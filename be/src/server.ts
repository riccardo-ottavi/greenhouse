import app from "./app.js";
import { markOfflineDevices } from "./services/deviceService.js";

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

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