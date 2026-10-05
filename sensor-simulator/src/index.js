import { startCommandPolling, startHeartbeat } from "./services/deviceService.js";
import { runSimulation } from "./services/simulationService.js";

startCommandPolling();
startHeartbeat();
runSimulation();

setInterval(() => {
  runSimulation();
}, 5000);