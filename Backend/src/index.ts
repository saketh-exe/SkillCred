import "dotenv/config";
import http from "http";
import app from "./app";
import { connectDB } from "./db/connection";
import { attachGeminiLiveRelay } from "./services/assessment/geminiLiveRelay";

const PORT = process.env.PORT ?? 3000;

connectDB()
  .then(() => {
    const server = http.createServer(app);
    attachGeminiLiveRelay(server);

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
