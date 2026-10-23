import React, { useState } from 'react';
import {
  Lightbulb,
  Thermometer,
  Tv,
  Zap,
  Power,
  Plus,
  Trash2,
  Edit2,
  Sliders,
  X,
  Info
} from 'lucide-react';
import { Device, DeviceCategory, Room } from '../types';
import { deviceService } from '../services/deviceService';
import { useToast } from '../context/ToastContext';

interface DevicesViewProps {
  devices: Device[];
  rooms: Room[];
  onRefreshData: () => void;
}

export const DevicesView: React.FC<DevicesViewProps> = ({
  devices,
  rooms,
  onRefreshData
}) => {
  const { showToast } = useToast();
  const [selectedRoom, setSelectedRoom] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  // Form states for Add/Edit Device
  const [formName, setFormName] = useState('');
  const [formRoom, setFormRoom] = useState('Living Room');
  const [formCategory, setFormCategory] = useState<DeviceCategory>('lighting');

  // Filter devices
  const filteredDevices = devices.filter((d) => {
    const roomMatch = selectedRoom === 'All' || d.room === selectedRoom;
    const catMatch = selectedCategory === 'All' || d.category === selectedCategory;
    return roomMatch && catMatch;
  });

  const getDeviceIcon = (category: DeviceCategory) => {
    switch (category) {
      case 'lighting':
        return Lightbulb;
      case 'climate':
        return Thermometer;
      case 'entertainment':
        return Tv;
      case 'appliance':
        return Zap;
      default:
        return Sliders;
    }
  };

  const handleTogglePower = async (device: Device) => {
    const newPower = !device.state.power;
    const res = await deviceService.controlDevice(device.id, { power: newPower });
    if (res.success) {
      showToast(`${device.name} turned ${newPower ? 'on' : 'off'}`, 'success');
      onRefreshData();
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleBrightnessChange = async (device: Device, brightness: number) => {
    await deviceService.controlDevice(device.id, { brightness, power: true });
    onRefreshData();
  };

  const handleTemperatureChange = async (device: Device, delta: number) => {
    const current = device.state.targetTemperature ?? 70;
    const newTemp = current + delta;
    const res = await deviceService.controlDevice(device.id, { targetTemperature: newTemp, power: true });
    if (res.success) {
      showToast(`${device.name} target set to ${newTemp}°F`, 'info');
      onRefreshData();
    }
  };

  const handleFanSpeedChange = async (device: Device, speed: 'off' | 'low' | 'medium' | 'high') => {
    const res = await deviceService.controlDevice(device.id, {
      fanSpeed: speed,
      power: speed !== 'off'
    });
    if (res.success) {
      showToast(`${device.name} speed set to ${speed}`, 'info');
      onRefreshData();
    }
  };

  const handleDeleteDevice = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name}?`)) {
      await deviceService.deleteDevice(id);
      showToast(`${name} removed`, 'info');
      onRefreshData();
    }
  };

  const handleSaveDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingDevice) {
      await deviceService.updateDevice(editingDevice.id, {
        name: formName.trim(),
        room: formRoom,
        category: formCategory
      });
      showToast(`Updated ${formName}`, 'success');
      setEditingDevice(null);
    } else {
      const newDev: Device = {
        id: `dev_${Date.now()}`,
        name: formName.trim(),
        room: formRoom,
        category: formCategory,
        isSimulated: true,
        isFavorite: false,
        state: {
          power: false,
          ...(formCategory === 'lighting' ? { brightness: 80, colorTemp: 2700 } : {}),
          ...(formCategory === 'climate' ? { temperature: 71, targetTemperature: 70 } : {})
        },
        modelInfo: 'Simulated Demo Smart Device',
        lastUpdated: new Date().toISOString()
      };
      await deviceService.addDevice(newDev);
      showToast(`Added ${formName} to ${formRoom}`, 'success');
      setIsAddModalOpen(false);
    }

    setFormName('');
    onRefreshData();
  };

  const openEditModal = (device: Device) => {
    setEditingDevice(device);
    setFormName(device.name);
    setFormRoom(device.room);
    setFormCategory(device.category);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl font-semibold text-nature-dark">
              Smart Devices
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-nature-sage/60 text-nature-dark font-medium border border-nature-border">
              Simulated Demo Bus
            </span>
          </div>
          <p className="text-sm text-nature-muted mt-0.5">
            Real-time stateful control across all rooms and device categories
          </p>
        </div>

        <button
          onClick={() => {
            setFormName('');
            setFormRoom(rooms[0]?.name || 'Living Room');
            setFormCategory('lighting');
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nature-primary hover:bg-nature-primary-hover text-white text-sm font-medium shadow-soft transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Demo Device</span>
        </button>
      </div>

      {/* Filter Tabs: Rooms */}
      <div className="space-y-2.5">
        <div className="text-xs font-semibold text-nature-muted uppercase tracking-wider">
          Filter by Room
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {['All', ...rooms.map((r) => r.name)].map((roomName) => {
            const count =
              roomName === 'All'
                ? devices.length
                : devices.filter((d) => d.room === roomName).length;
            const isSelected = selectedRoom === roomName;
            return (
              <button
                key={roomName}
                onClick={() => setSelectedRoom(roomName)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-nature-dark text-white shadow-soft'
                    : 'bg-nature-card hover:bg-nature-sage/30 text-nature-text border border-nature-border'
                }`}
              >
                <span>{roomName}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-nature-surface text-nature-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['All', 'lighting', 'climate', 'entertainment', 'appliance'].map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                isSelected
                  ? 'bg-nature-sage text-nature-dark font-semibold'
                  : 'bg-transparent text-nature-muted hover:text-nature-text'
              }`}
            >
              {cat === 'All' ? 'All Types' : cat}
            </button>
          );
        })}
      </div>

      {/* Device Cards Grid */}
      {filteredDevices.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-nature-card border border-nature-border">
          <Info className="w-8 h-8 text-nature-muted mx-auto mb-2" />
          <h3 className="font-serif text-lg font-semibold text-nature-dark">
            No devices found in this filter
          </h3>
          <p className="text-xs text-nature-muted mt-1">
            Try switching rooms or add a new demo device to this room.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map((device) => {
            const Icon = getDeviceIcon(device.category);
            const isOn = device.state.power;

            return (
              <div
                key={device.id}
                className={`p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between ${
                  isOn
                    ? 'bg-nature-card border-nature-primary/40 shadow-soft-md'
                    : 'bg-nature-card/70 border-nature-border shadow-soft opacity-90'
                }`}
              >
                {/* Card Top: Icon, Room, Power switch */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${
                          isOn
                            ? 'bg-nature-sage text-nature-dark'
                            : 'bg-nature-surface text-nature-muted'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm text-nature-dark leading-tight">
                          {device.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-nature-muted mt-0.5">
                          <span>{device.room}</span>
                          <span>•</span>
                          <span className="text-[10px] text-nature-primary font-medium">
                            Demo
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Power Toggle Button */}
                    <button
                      onClick={() => handleTogglePower(device)}
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
                        isOn
                          ? 'bg-nature-primary text-white shadow-soft'
                          : 'bg-nature-surface text-nature-muted hover:text-nature-text'
                      }`}
                      aria-label={`Toggle power for ${device.name}`}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Device Specific Controls */}
                  <div className="mt-4 pt-3 border-t border-nature-border/60 space-y-3">
                    {/* Lighting: Brightness Slider */}
                    {device.category === 'lighting' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-nature-muted">
                          <span>Brightness</span>
                          <span className="font-semibold text-nature-dark">
                            {isOn ? `${device.state.brightness ?? 80}%` : 'Off'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="100"
                          value={device.state.brightness ?? 80}
                          disabled={!isOn}
                          onChange={(e) =>
                            handleBrightnessChange(device, parseInt(e.target.value, 10))
                          }
                          className="w-full accent-nature-primary disabled:opacity-30 cursor-pointer h-1.5 bg-nature-surface rounded-lg appearance-none"
                        />
                      </div>
                    )}

                    {/* Climate: Thermostat Controls */}
                    {device.category === 'climate' && device.state.targetTemperature !== undefined && (
                      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-nature-surface/70 border border-nature-border">
                        <div>
                          <span className="text-[11px] text-nature-muted block">
                            Current: {device.state.temperature}°F
                          </span>
                          <span className="text-sm font-bold text-nature-dark">
                            Target: {device.state.targetTemperature}°F
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleTemperatureChange(device, -1)}
                            className="w-7 h-7 rounded-lg bg-nature-card hover:bg-white border border-nature-border font-bold text-sm text-nature-dark flex items-center justify-center shadow-soft"
                          >
                            -
                          </button>
                          <button
                            onClick={() => handleTemperatureChange(device, 1)}
                            className="w-7 h-7 rounded-lg bg-nature-card hover:bg-white border border-nature-border font-bold text-sm text-nature-dark flex items-center justify-center shadow-soft"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Climate: Fan Speed Selector */}
                    {device.state.fanSpeed !== undefined && (
                      <div className="space-y-1.5">
                        <span className="text-xs text-nature-muted block">Fan Speed</span>
                        <div className="grid grid-cols-4 gap-1">
                          {(['off', 'low', 'medium', 'high'] as const).map((speed) => {
                            const isSpeedActive = device.state.fanSpeed === speed;
                            return (
                              <button
                                key={speed}
                                onClick={() => handleFanSpeedChange(device, speed)}
                                className={`py-1 text-[11px] rounded-lg font-medium capitalize transition-all ${
                                  isSpeedActive
                                    ? 'bg-nature-dark text-white font-semibold'
                                    : 'bg-nature-surface text-nature-muted hover:text-nature-text'
                                }`}
                              >
                                {speed}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Entertainment: Input Info */}
                    {device.category === 'entertainment' && (
                      <div className="text-xs text-nature-muted flex items-center justify-between">
                        <span>Input Source:</span>
                        <span className="font-medium text-nature-dark">
                          {device.state.input || 'HDMI 1'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Model info, Edit, Delete */}
                <div className="mt-4 pt-3 border-t border-nature-border/60 flex items-center justify-between text-xs text-nature-muted">
                  <span className="truncate max-w-[150px]">
                    {device.modelInfo || 'Simulated Matter'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(device)}
                      className="p-1 rounded hover:bg-nature-sage/40 text-nature-muted hover:text-nature-text transition-colors"
                      title="Edit device"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDevice(device.id, device.name)}
                      className="p-1 rounded hover:bg-red-50 text-nature-muted hover:text-red-600 transition-colors"
                      title="Remove device"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Device Modal */}
      {(isAddModalOpen || editingDevice) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-nature-dark/40 backdrop-blur-xs"
            onClick={() => {
              setIsAddModalOpen(false);
              setEditingDevice(null);
            }}
          />
          <div className="relative w-full max-w-md bg-nature-card rounded-3xl p-6 border border-nature-border shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-semibold text-nature-dark">
                {editingDevice ? 'Edit Demo Device' : 'Add New Demo Device'}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingDevice(null);
                }}
                className="p-1.5 rounded-full hover:bg-nature-sage/40 text-nature-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDevice} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-nature-dark block mb-1">
                  Device Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Porch Lantern, Kitchen Kettle"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-nature-border text-sm text-nature-dark focus:border-nature-primary focus:ring-1 focus:ring-nature-primary outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-nature-dark block mb-1">
                  Room
                </label>
                <select
                  value={formRoom}
                  onChange={(e) => setFormRoom(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-nature-border text-sm text-nature-dark focus:border-nature-primary focus:ring-1 focus:ring-nature-primary outline-none bg-white"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-nature-dark block mb-1">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as DeviceCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-nature-border text-sm text-nature-dark focus:border-nature-primary focus:ring-1 focus:ring-nature-primary outline-none bg-white"
                >
                  <option value="lighting">Lighting</option>
                  <option value="climate">Climate & Fan</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="appliance">Appliance / Plug</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingDevice(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-nature-muted hover:text-nature-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-nature-primary hover:bg-nature-primary-hover text-white text-xs font-medium shadow-soft transition-all"
                >
                  {editingDevice ? 'Save Changes' : 'Create Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
