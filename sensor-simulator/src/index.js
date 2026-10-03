import { startCommandPolling } from "./services/deviceService.js";
import { runSimulation } from "./services/simulationService.js";

startCommandPolling();
runSimulation();

setInterval(() => {
  runSimulation();
}, 5000);