import express from "express";
import cors from "cors";

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
import router from "./routes/index";
import authRouter from "./routes/auth";
import studentRouter from "./routes/student";
import recruiterRouter from "./routes/recruiter";
app.use("/api", router);
app.use("/api/auth", authRouter);
app.use("/api/student", studentRouter);
app.use("/api/recruiter", recruiterRouter);

export default app;
