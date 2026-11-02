
import express from "express";
import cors from "cors";

import sensorRouter from "./routes/sensorRouter.js";
import readingRouter from "./routes/readingRouter.js";
import deviceRouter from "./routes/deviceRouter.js";
import deviceApiRouter from "./routes/deviceApiRouter.js";
import actuatorRouter from "./routes/actuatorRouter.js";
import weatherRouter from "./routes/weatherRouter.js";
import environmentalAlertRouter from "./routes/environmentalAlertRouter.js";
import authRouter from "./routes/authRouter.js";

import { sessionMiddleware } from "./config/session.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

const configuredFrontendUrl = process.env.FRONTEND_URL;

if (
  process.env.NODE_ENV === "production" &&
  !configuredFrontendUrl
) {
  throw new Error(
    "FRONTEND_URL must be configured in production."
  );
}

const frontendOrigins = (
  configuredFrontendUrl ?? "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set("trust proxy", 1);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || frontendOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS."));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(sessionMiddleware);

app.use("/api/sensors", sensorRouter);
app.use("/api/readings", readingRouter);
app.use("/api/devices", deviceRouter);
app.use("/api/device", deviceApiRouter);
app.use("/api/actuators", actuatorRouter);
app.use("/api/weather", weatherRouter);
app.use("/api/environmental-alerts", environmentalAlertRouter);
app.use("/api/auth", authRouter);

app.get("/", (_req, res) => {
  res.send("<h1>Greenhouse Monitoring System Homepage</h1>");
});

app.use(errorHandler);

export default app;
