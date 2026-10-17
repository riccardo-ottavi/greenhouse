import express from "express";
import cors from "cors";

import sensorRouter from "./routes/sensorRouter.js";
import readingRouter from "./routes/readingRouter.js";
import deviceRouter from "./routes/deviceRouter.js";
import deviceApiRouter from "./routes/deviceApiRouter.js";
import actuatorRouter from "./routes/actuatorRouter.js";
import weatherRouter from "./routes/weatherRouter.js";
import environmentalAlertRouter from "./routes/environmentalAlertRouter.js";

import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
}));

app.use(express.json());

app.use("/api/sensors", sensorRouter);
app.use("/api/readings", readingRouter);
app.use("/api/devices", deviceRouter);
app.use("/api/device", deviceApiRouter);
app.use("/api/actuators", actuatorRouter);
app.use("/api/weather", weatherRouter);
app.use("/api/environmental-alerts", environmentalAlertRouter);

app.get("/", (_req, res) => {
  res.send("<h1>Greenhouse Monitoring System Homepage</h1>");
});

app.use(errorHandler);

export default app;