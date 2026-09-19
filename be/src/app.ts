import express from "express";
const app = express();
const sensorRouter = require('./routes/sensorRouter');


app.use("/sensors", sensorRouter);

app.get("/", (req, res) => {
  res.send("<h1>Greenhouse Monitoring System Homepage</h1>");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});