
import { updateActuatorStatus } from "../services/actuatorService";
import {
    getAllDevices,
    getDeviceActuatorStates,
    getDeviceSensorConfigs,
    getDeviceById,
    updateHeartbeat
} from "../services/deviceService";
import { Request, Response } from "express";
import { getSensorViewsByDeviceId } from "../services/sensorService";

export async function index(req: Request, res: Response) {
    try {
        const devices = await getAllDevices();
        res.json(devices);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Couldn't get devices"
        });
    }
}

export async function show(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);

        if (Number.isNaN(id)) {
            res.status(400).json({
                message: "Device id must be a number"
            });
            return;
        }

        const device = await getDeviceById(id);

        if (!device) {
            res.status(404).json({
                message: "Device not found"
            });
            return;
        }

        res.json(device);
    }

    catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Couldn't get device's data"
        });
    }
}

export async function heartbeat(req: Request, res: Response) {
    try {
        const deviceId = req.authenticatedDeviceId;

        if (!deviceId) {
            res.status(401).json({
                message: "Authenticated device is required"
            });
            return;
        }

        const updated = await updateHeartbeat(deviceId);

        if (!updated) {
            res.status(404).json({
                message: "Device not found"
            });
            return;
        }

        res.json({
            message: "Heartbeat received"
        });
    }

    catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Couldn't update device heartbeat"
        });
    }
}

export async function updateStatus(req: Request, res: Response) {
    try {
        const deviceId = req.authenticatedDeviceId;
        const { actuators } = req.body;

        if (!deviceId) {
            res.status(401).json({
                message: "Authenticated device is required"
            });
            return;
        }

        if (!Array.isArray(actuators)) {
            res.status(400).json({
                message: "actuators must be an array"
            });
            return;
        }

        for (const actuator of actuators) {
            if (
                typeof actuator.actuatorId !== "number" ||
                !["ON", "OFF"].includes(actuator.state) ||
                !["AUTO", "MANUAL"].includes(actuator.controlMode)
            ) {
                res.status(400).json({
                    message: "Invalid actuator status"
                });
                return;
            }

            await updateActuatorStatus(
                deviceId,
                actuator.actuatorId,
                actuator.state,
                actuator.controlMode
            );
        }

        res.json({
            message: "Device status updated"
        });
    }

    catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Couldn't update device status"
        });
    }
}

export async function getConfig(req: Request, res: Response): Promise<void> {
    try {
        const deviceId = req.authenticatedDeviceId;

        if (!deviceId) {
            res.status(401).json({
                message: "Authenticated device is required"
            });
            return;
        }

        const [actuators, sensors] = await Promise.all([
            getDeviceActuatorStates(deviceId),
            getDeviceSensorConfigs(deviceId)
        ]);

        res.json({
            deviceId,
            actuators,
            sensors
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Couldn't get device configuration"
        });
    }
}

export async function getDeviceSensors(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        message: "Device id must be a positive integer"
      });
      return;
    }

    const device = await getDeviceById(id);

    if (!device) {
      res.status(404).json({
        message: "Device not found"
      });
      return;
    }

    const sensors = await getSensorViewsByDeviceId(id);

    res.json(sensors);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Couldn't get device sensors"
    });
  }
}
