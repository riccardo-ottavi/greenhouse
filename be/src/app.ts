import express from "express";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

const sensorRouter = require('./routes/sensorRouter');
const readingRouter = require('./routes/readingRouter')

app.use(express.json());

app.use("/sensors", sensorRouter);
app.use("/readings", readingRouter);

app.get("/", (req, res) => {
  res.send("<h1>Greenhouse Monitoring System Homepage</h1>");
});

app.use(errorHandler);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});