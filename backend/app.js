import express from "express";
import dotenv from "dotenv";
import conect from "./config/mogoDb.js";
import cookieParser from "cookie-parser";
import router from "./routers/index.js";
import cors from "cors";

dotenv.config();

const app = express()

app.use(cors({
    origin: "https://smsproject-frontend-nine.vercel.app",
  credentials: true
}))
app.use(cookieParser())

app.use(express.json({ limit: "1mb" }))
app.disable("x-powered-by")

app.use("/api", router)

app.get("/api/health", (_req, res) => res.json({ status: true, message: "SRMS API is healthy" }));
app.get("/api/helth", (_req, res) => res.json({ status: true, message: "SRMS API is healthy" }));

const port =process.env.PORT || 5000;
try {
    await conect();
    app.listen(port, () => console.log(`SRMS API listening on http://localhost:${port}`));
} catch (error) {
    console.error(`Unable to start SRMS API: ${error.message}`);
    process.exitCode = 1;
}