import express from "express";
import { sensors } from "./data/sensors";
import { createReading, generateNextValue, simulateSensor } from "./services/simulationService";

const app = express();

const sensorRouter = require('./routes/sensorRouter');
const readingRouter = require('./routes/readingRouter')

app.use("/sensors", sensorRouter);
app.use("/readings", readingRouter);

app.get("/", (req, res) => {
  res.send("<h1>Greenhouse Monitoring System Homepage</h1>");
});

app.listen(3000, () => {
  //todo: manca il sensore della luce!!!!!!!!
  console.log("Server running on port 3000");
  sensors.forEach(sensor => simulateSensor(sensor));
});