import { Device, DeviceState } from '../types';
import { StorageRepository } from './storage';

export interface DeviceCommandResult {
  deviceId: string;
  deviceName: string;
  success: boolean;
  message: string;
  updatedState?: Partial<DeviceState>;
}

export interface SceneExecutionResult {
  sceneId: string;
  sceneName: string;
  success: boolean;
  deviceResults: DeviceCommandResult[];
  timestamp: string;
}

export interface IDeviceService {
  getDevices(): Device[];
  getDeviceById(id: string): Device | undefined;
  controlDevice(deviceId: string, command: Partial<DeviceState>): Promise<DeviceCommandResult>;
  activateScene(sceneId: string): Promise<SceneExecutionResult>;
  addDevice(device: Device): Promise<Device>;
  updateDevice(id: string, updates: Partial<Omit<Device, 'state'>> & { state?: Partial<DeviceState> }): Promise<Device | null>;
  deleteDevice(id: string): Promise<boolean>;
}

/**
 * Simulated Demo Device Service.
 * Implements full stateful control with realistic latency and feedback,
 * while maintaining honest simulation status.
 */
class SimulatedDeviceService implements IDeviceService {
  getDevices(): Device[] {
    return StorageRepository.getDevices();
  }

  getDeviceById(id: string): Device | undefined {
    return this.getDevices().find((d) => d.id === id);
  }

  async controlDevice(deviceId: string, command: Partial<DeviceState>): Promise<DeviceCommandResult> {
    // Artificial mini-delay to simulate local Matter/Zigbee bus latency (100ms)
    await new Promise((resolve) => setTimeout(resolve, 100));

    const device = this.getDeviceById(deviceId);
    if (!device) {
      return {
        deviceId,
        deviceName: 'Unknown Device',
        success: false,
        message: `Device with ID ${deviceId} was not found in the household registry.`
      };
    }

    const updated = StorageRepository.updateDevice(deviceId, { state: command });
    if (!updated) {
      return {
        deviceId,
        deviceName: device.name,
        success: false,
        message: `Failed to apply state update to ${device.name}.`
      };
    }

    // Build human-friendly description of what changed
    const changes: string[] = [];
    if (command.power !== undefined) {
      changes.push(command.power ? 'turned on' : 'turned off');
    }
    if (command.brightness !== undefined) {
      changes.push(`brightness set to ${command.brightness}%`);
    }
    if (command.targetTemperature !== undefined) {
      changes.push(`climate set to ${command.targetTemperature}°`);
    }
    if (command.fanSpeed !== undefined) {
      changes.push(`fan speed set to ${command.fanSpeed}`);
    }
    if (command.volume !== undefined) {
      changes.push(`volume set to ${command.volume}%`);
    }

    const changeSummary = changes.length > 0 ? changes.join(', ') : 'state updated';

    return {
      deviceId,
      deviceName: device.name,
      success: true,
      message: `${device.name} in ${device.room}: ${changeSummary} (Simulated).`,
      updatedState: updated.state
    };
  }

  async activateScene(sceneId: string): Promise<SceneExecutionResult> {
    const scenes = StorageRepository.getScenes();
    const scene = scenes.find((s) => s.id === sceneId);

    if (!scene) {
      return {
        sceneId,
        sceneName: 'Unknown Scene',
        success: false,
        deviceResults: [],
        timestamp: new Date().toISOString()
      };
    }

    const results: DeviceCommandResult[] = [];

    // Execute target state for each configured device in scene
    for (const action of scene.actions) {
      const res = await this.controlDevice(action.deviceId, action.targetState);
      results.push(res);
    }

    // Mark scene as active and update timestamp
    StorageRepository.updateScene(sceneId, {
      isActive: true,
      lastActivated: 'Just now'
    });

    const allSuccessful = results.every((r) => r.success);

    return {
      sceneId: scene.id,
      sceneName: scene.name,
      success: allSuccessful,
      deviceResults: results,
      timestamp: new Date().toISOString()
    };
  }

  async addDevice(device: Device): Promise<Device> {
    StorageRepository.addDevice(device);
    return device;
  }

  async updateDevice(id: string, updates: Partial<Device>): Promise<Device | null> {
    return StorageRepository.updateDevice(id, updates);
  }

  async deleteDevice(id: string): Promise<boolean> {
    StorageRepository.deleteDevice(id);
    return true;
  }
}

export const deviceService: IDeviceService = new SimulatedDeviceService();
