import express from "express";
import sensorRouter from "./routes/sensorRouter.js";
import readingRouter from "./routes/readingRouter.js";
import deviceRouter from "./routes/deviceRouter.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import deviceApiRouter from "./routes/deviceApiRouter.js";
import actuatorRouter from "./routes/actuatorRouter.js";
import { markOfflineDevices } from "./services/deviceService.js";

const app = express();

app.use(express.json());

app.use("/api/sensors", sensorRouter);
app.use("/api/readings", readingRouter);
app.use("/api/devices", deviceRouter);
app.use("/api/device", deviceApiRouter);
app.use("/api/actuators", actuatorRouter);

app.get("/", (_req, res) => {
  res.send("<h1>Greenhouse Monitoring System Homepage</h1>");
});

app.use(errorHandler);

app.listen(3000, () => {
  console.log("Server running on port 3000");

  setInterval(async () => {
    try {
      await markOfflineDevices();
    } catch (error) {
      console.error(
        "Device availability check error:",
        error
      );
    }
  }, 10000);
});