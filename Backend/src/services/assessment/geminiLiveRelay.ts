import { WebSocket as WS, WebSocketServer } from "ws";
import type { Server as HTTPServer } from "http";
import type { IncomingMessage } from "http";
import jwt from "jsonwebtoken";
import { Application } from "../../models/Application";
import { JobPosting } from "../../models/JobPosting";
import { UserBase } from "../../models/User";
import { Interview } from "../../models/Interview";
import { buildInterviewSystemInstruction } from "./interviewService";

const GEMINI_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";
const GEMINI_WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent`;

interface ParsedQuery {
  token: string;
  appId: string;
}

function parseQueryParams(url: string | undefined): ParsedQuery | null {
  if (!url) return null;
  try {
    const parsed = new URL(url, "http://localhost");
    const token = parsed.searchParams.get("token");
    const appId = parsed.searchParams.get("appId");
    if (!token || !appId) return null;
    return { token, appId };
  } catch {
    return null;
  }
}

function verifyToken(token: string): string | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const payload = jwt.verify(token, secret) as { userId: string };
    return payload.userId;
  } catch {
    return null;
  }
}

async function resolveInterviewContext(appId: string, userId: string) {
  const app = await Application.findOne({ _id: appId, studentId: userId });
  if (!app) return null;

  const job = await JobPosting.findById(app.jobId);
  if (!job) return null;

  const stageIdx = (app as unknown as { pipelineStage: number }).pipelineStage;
  const pipeline = job.pipeline as Array<{ name: string; type: string }>;
  const stage = pipeline[stageIdx];
  if (!stage || stage.type !== "AI Interview") return null;

  const student = await UserBase.findById(userId);
  const skills = ((job.requiredSkills as Array<{ name: string }>) ?? []).map(
    (s) => s.name
  );

  return {
    app,
    job,
    stageIdx,
    context: {
      jobTitle: (job as { title: string }).title,
      jobDescription: (job as { description: string }).description,
      requiredSkills: skills,
      candidateName: (student as { name?: string })?.name ?? "Candidate",
    },
  };
}

/**
 * Attach the Gemini Live relay WebSocket server to an existing HTTP server.
 * Client connects to ws://host/api/interview/live?token=JWT&appId=APP_ID
 *
 * Protocol (client ↔ backend):
 *   Client sends:  { type: "audio", data: "<base64 PCM16 16kHz mono>" }
 *   Server sends:  { type: "audio", data: "<base64 PCM16 24kHz mono>" }
 *   Server sends:  { type: "transcript", role: "interviewer"|"candidate", text: "..." }
 *   Server sends:  { type: "turn_complete" }
 *   Server sends:  { type: "setup_complete" }
 *   Server sends:  { type: "interrupted" }
 *   Server sends:  { type: "error", message: "..." }
 *   Client sends:  { type: "end" }
 */
export function attachGeminiLiveRelay(httpServer: HTTPServer): void {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (req: IncomingMessage, socket, head) => {
    const pathname = new URL(req.url ?? "", "http://localhost").pathname;
    if (pathname !== "/api/interview/live") {
      // Not our route — ignore (let other upgrade handlers deal with it, or reject)
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", async (clientWs: WS, req: IncomingMessage) => {
    const params = parseQueryParams(req.url);
    if (!params) {
      clientWs.send(JSON.stringify({ type: "error", message: "Missing token or appId" }));
      clientWs.close();
      return;
    }

    const userId = verifyToken(params.token);
    if (!userId) {
      clientWs.send(JSON.stringify({ type: "error", message: "Invalid token" }));
      clientWs.close();
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      clientWs.send(JSON.stringify({ type: "error", message: "GEMINI_API_KEY not configured" }));
      clientWs.close();
      return;
    }

    // Resolve interview context
    let resolved;
    try {
      resolved = await resolveInterviewContext(params.appId, userId);
    } catch {
      clientWs.send(JSON.stringify({ type: "error", message: "Failed to resolve interview context" }));
      clientWs.close();
      return;
    }

    if (!resolved) {
      clientWs.send(JSON.stringify({ type: "error", message: "Not eligible for AI Interview" }));
      clientWs.close();
      return;
    }

    // Create interview record in DB
    let interviewId: string;
    try {
      await Application.findByIdAndUpdate(resolved.app._id, {
        $set: { [`stages.${resolved.stageIdx}.assessmentStatus`]: "in_progress" },
      });

      const interview = await Interview.create({
        applicationId: resolved.app._id,
        studentId: userId,
        jobId: resolved.job._id,
        stageIndex: resolved.stageIdx,
        jobTitle: resolved.context.jobTitle,
        jobDescription: resolved.context.jobDescription,
        transcript: [],
      });
      interviewId = String(interview._id);
    } catch (err) {
      clientWs.send(JSON.stringify({ type: "error", message: "Failed to create interview record" }));
      clientWs.close();
      return;
    }

    // Send interviewId to client
    clientWs.send(JSON.stringify({ type: "interview_created", interviewId }));

    // Connect to Gemini Live API
    const geminiUrl = `${GEMINI_WS_URL}?key=${apiKey}`;
    const geminiWs = new WS(geminiUrl);

    let setupDone = false;

    // Transcript accumulation for DB saving
    const transcriptBuffer: Array<{ role: "interviewer" | "candidate"; text: string }> = [];
    let currentModelText = "";
    let currentUserText = "";

    geminiWs.on("open", () => {
      // Send the setup message with system instruction and audio config
      const setupMsg = {
        setup: {
          model: `models/${GEMINI_MODEL}`,
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: "Aoede",
                },
              },
            },
          },
          systemInstruction: {
            parts: [{ text: buildInterviewSystemInstruction(resolved!.context) }],
          },
        },
      };
      geminiWs.send(JSON.stringify(setupMsg));
    });

    geminiWs.on("message", (raw: Buffer | string) => {
      try {
        const msg = JSON.parse(typeof raw === "string" ? raw : raw.toString("utf-8"));

        // Setup complete
        if (msg.setupComplete) {
          setupDone = true;
          clientWs.send(JSON.stringify({ type: "setup_complete" }));

          // Send initial prompt to kick off the interview greeting
          const initialMsg = {
            clientContent: {
              turns: [
                {
                  role: "user",
                  parts: [{ text: "The candidate has just joined the call. Begin the interview with a greeting." }],
                },
              ],
              turnComplete: true,
            },
          };
          geminiWs.send(JSON.stringify(initialMsg));
          return;
        }

        // Server content (model response)
        if (msg.serverContent) {
          const sc = msg.serverContent;

          // Handle interrupted
          if (sc.interrupted) {
            clientWs.send(JSON.stringify({ type: "interrupted" }));
            return;
          }

          // Model turn parts
          if (sc.modelTurn?.parts) {
            for (const part of sc.modelTurn.parts) {
              // Audio data
              if (part.inlineData) {
                clientWs.send(JSON.stringify({
                  type: "audio",
                  data: part.inlineData.data,
                  mimeType: part.inlineData.mimeType,
                }));
              }
              // Text content (transcript)
              if (part.text) {
                currentModelText += part.text;
                clientWs.send(JSON.stringify({
                  type: "transcript",
                  role: "interviewer",
                  text: part.text,
                  partial: true,
                }));
              }
            }
          }

          // Turn complete
          if (sc.turnComplete) {
            if (currentModelText.trim()) {
              transcriptBuffer.push({ role: "interviewer", text: currentModelText.trim() });
              clientWs.send(JSON.stringify({
                type: "transcript",
                role: "interviewer",
                text: currentModelText.trim(),
                partial: false,
              }));
            }
            currentModelText = "";
            clientWs.send(JSON.stringify({ type: "turn_complete" }));
          }
        }
      } catch {
        // Ignore unparseable messages
      }
    });

    geminiWs.on("error", (err) => {
      console.error("Gemini WS error:", err.message);
      clientWs.send(JSON.stringify({ type: "error", message: "Gemini connection error" }));
    });

    geminiWs.on("close", () => {
      if (clientWs.readyState === WS.OPEN) {
        clientWs.send(JSON.stringify({ type: "error", message: "Gemini session ended" }));
        clientWs.close();
      }
    });

    // Handle messages from client
    clientWs.on("message", (raw: Buffer | string) => {
      try {
        const msg = JSON.parse(typeof raw === "string" ? raw : raw.toString("utf-8"));

        if (!setupDone) return;

        // Audio from candidate's microphone
        if (msg.type === "audio" && msg.data) {
          const realtimeInput = {
            realtimeInput: {
              mediaChunks: [
                {
                  data: msg.data,
                  mimeType: "audio/pcm;rate=16000",
                },
              ],
            },
          };
          geminiWs.send(JSON.stringify(realtimeInput));
        }

        // Client sends text for transcript tracking
        if (msg.type === "candidate_transcript" && msg.text) {
          transcriptBuffer.push({ role: "candidate", text: msg.text });
        }

        // End interview
        if (msg.type === "end") {
          // Save transcript to DB
          Interview.findByIdAndUpdate(interviewId, {
            $set: { transcript: transcriptBuffer },
          }).catch(() => {});

          geminiWs.close();
        }
      } catch {
        // Ignore unparseable
      }
    });

    clientWs.on("close", () => {
      // Save transcript and close Gemini connection
      Interview.findByIdAndUpdate(interviewId, {
        $set: { transcript: transcriptBuffer },
      }).catch(() => {});

      if (geminiWs.readyState === WS.OPEN || geminiWs.readyState === WS.CONNECTING) {
        geminiWs.close();
      }
    });
  });
}
