import express from "express";
import sensorRouter from "./routes/sensorRouter.js";
import readingRouter from "./routes/readingRouter.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(express.json());

app.use("/api/sensors", sensorRouter);
app.use("/api/readings", readingRouter);

app.get("/", (_req, res) => {
  res.send("<h1>Greenhouse Monitoring System Homepage</h1>");
});

app.use(errorHandler);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});