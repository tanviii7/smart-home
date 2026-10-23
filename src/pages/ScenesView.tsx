import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Sparkles,
  Film,
  Feather,
  ShieldCheck,
  Play,
  Plus,
  Trash2,
  Edit2,
  X
} from 'lucide-react';
import { Scene, Device, SceneAction } from '../types';
import { deviceService } from '../services/deviceService';
import { StorageRepository } from '../services/storage';
import { useToast } from '../context/ToastContext';

interface ScenesViewProps {
  scenes: Scene[];
  devices: Device[];
  onRefreshData: () => void;
}

export const ScenesView: React.FC<ScenesViewProps> = ({
  scenes,
  devices,
  onRefreshData
}) => {
  const { showToast } = useToast();
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Sparkles');
  const [selectedActions, setSelectedActions] = useState<SceneAction[]>([]);

  const getSceneIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sunrise':
        return Sun;
      case 'Moon':
        return Moon;
      case 'Film':
        return Film;
      case 'Feather':
        return Feather;
      case 'ShieldCheck':
        return ShieldCheck;
      default:
        return Sparkles;
    }
  };

  const handleActivate = async (scene: Scene) => {
    setActivatingId(scene.id);
    try {
      const res = await deviceService.activateScene(scene.id);
      if (res.success) {
        showToast(
          `Scene "${scene.name}" activated! Updated ${res.deviceResults.length} devices.`,
          'success'
        );
        onRefreshData();
      } else {
        showToast(`Failed to activate ${scene.name}`, 'error');
      }
    } finally {
      setActivatingId(null);
    }
  };

  const handleDelete = (scene: Scene) => {
    if (confirm(`Delete scene "${scene.name}"?`)) {
      StorageRepository.deleteScene(scene.id);
      showToast(`Scene "${scene.name}" deleted`, 'info');
      onRefreshData();
    }
  };

  const openCreateModal = () => {
    setName('');
    setDescription('');
    setIcon('Sparkles');
    // Default 2 actions with first 2 devices
    const defaultActions: SceneAction[] = devices.slice(0, 2).map((d) => ({
      deviceId: d.id,
      targetState: { power: true, ...(d.category === 'lighting' ? { brightness: 70 } : {}) }
    }));
    setSelectedActions(defaultActions);
    setEditingScene(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (scene: Scene) => {
    setEditingScene(scene);
    setName(scene.name);
    setDescription(scene.description);
    setIcon(scene.icon);
    setSelectedActions([...scene.actions]);
    setIsAddModalOpen(true);
  };

  const toggleDeviceInScene = (deviceId: string) => {
    const exists = selectedActions.find((a) => a.deviceId === deviceId);
    if (exists) {
      setSelectedActions((prev) => prev.filter((a) => a.deviceId !== deviceId));
    } else {
      setSelectedActions((prev) => [
        ...prev,
        { deviceId, targetState: { power: true } }
      ]);
    }
  };

  const updateActionTargetPower = (deviceId: string, power: boolean) => {
    setSelectedActions((prev) =>
      prev.map((a) =>
        a.deviceId === deviceId ? { ...a, targetState: { ...a.targetState, power } } : a
      )
    );
  };

  const handleSaveScene = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingScene) {
      StorageRepository.updateScene(editingScene.id, {
        name: name.trim(),
        description: description.trim(),
        icon,
        actions: selectedActions
      });
      showToast(`Updated scene "${name}"`, 'success');
    } else {
      const newScene: Scene = {
        id: `scene_${Date.now()}`,
        name: name.trim(),
        description: description.trim() || 'Custom smart home theme',
        icon,
        actions: selectedActions
      };
      StorageRepository.addScene(newScene);
      showToast(`Created scene "${name}"`, 'success');
    }

    setIsAddModalOpen(false);
    setEditingScene(null);
    onRefreshData();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl font-semibold text-nature-dark">
              Themes & Scenes
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-nature-sage/60 text-nature-dark font-medium border border-nature-border">
              Multi-Device Automation
            </span>
          </div>
          <p className="text-sm text-nature-muted mt-0.5">
            Synchronize lighting, climate, and appliances with a single touch
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nature-primary hover:bg-nature-primary-hover text-white text-sm font-medium shadow-soft transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create Scene</span>
        </button>
      </div>

      {/* Scenes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {scenes.map((scene) => {
          const IconComponent = getSceneIcon(scene.icon);
          const isActivating = activatingId === scene.id;

          return (
            <div
              key={scene.id}
              className="p-6 rounded-3xl bg-nature-card border border-nature-border shadow-soft hover:shadow-soft-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-nature-sage/50 text-nature-dark flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-nature-primary" />
                  </div>

                  <div className="flex items-center gap-1 text-xs text-nature-muted">
                    <button
                      onClick={() => openEditModal(scene)}
                      className="p-1.5 rounded-lg hover:bg-nature-sage/40 transition-colors"
                      title="Edit scene"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(scene)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-nature-muted hover:text-red-600 transition-colors"
                      title="Delete scene"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-serif text-xl font-semibold text-nature-dark">
                  {scene.name}
                </h3>
                <p className="text-xs text-nature-muted leading-relaxed mt-1 line-clamp-2">
                  {scene.description}
                </p>

                {/* Configured Actions Summary */}
                <div className="mt-4 pt-3 border-t border-nature-border/60">
                  <span className="text-[11px] font-semibold text-nature-dark block mb-2">
                    Configured Devices ({scene.actions.length}):
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {scene.actions.map((act, idx) => {
                      const dev = devices.find((d) => d.id === act.deviceId);
                      const targetPower = act.targetState.power;
                      return (
                        <div
                          key={idx}
                          className="text-xs p-2 rounded-xl bg-nature-surface/60 border border-nature-border flex items-center justify-between"
                        >
                          <span className="font-medium text-nature-dark truncate max-w-[140px]">
                            {dev ? dev.name : act.deviceId}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              targetPower
                                ? 'bg-nature-sage text-nature-dark'
                                : 'bg-nature-border text-nature-muted'
                            }`}
                          >
                            {targetPower ? 'Turn ON' : 'Turn OFF'}
                            {act.targetState.brightness
                              ? ` (${act.targetState.brightness}%)`
                              : ''}
                            {act.targetState.targetTemperature
                              ? ` (${act.targetState.targetTemperature}°)`
                              : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Card Footer: Activate button */}
              <div className="mt-5 pt-4 border-t border-nature-border/60 flex items-center justify-between">
                <span className="text-[11px] text-nature-muted">
                  {scene.lastActivated ? `Activated: ${scene.lastActivated}` : 'Ready'}
                </span>

                <button
                  onClick={() => handleActivate(scene)}
                  disabled={isActivating}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nature-dark hover:bg-nature-primary text-white text-xs font-semibold shadow-soft active:scale-95 transition-all disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isActivating ? 'Activating...' : 'Activate'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Scene Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-nature-dark/40 backdrop-blur-xs"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-nature-card rounded-3xl p-6 border border-nature-border shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-semibold text-nature-dark">
                {editingScene ? 'Edit Scene' : 'Create Home Scene'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-nature-sage/40 text-nature-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveScene} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-nature-dark block mb-1">
                  Scene Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Candlelight Dinner, Focus Work"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-nature-border text-sm text-nature-dark focus:border-nature-primary focus:ring-1 focus:ring-nature-primary outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-nature-dark block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What should this scene do?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-nature-border text-sm text-nature-dark focus:border-nature-primary focus:ring-1 focus:ring-nature-primary outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-nature-dark block mb-1">
                  Icon
                </label>
                <select
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-nature-border text-sm text-nature-dark focus:border-nature-primary focus:ring-1 focus:ring-nature-primary outline-none bg-white"
                >
                  <option value="Sparkles">Sparkles</option>
                  <option value="Sunrise">Sunrise (Morning)</option>
                  <option value="Moon">Moon (Night)</option>
                  <option value="Film">Film (Entertainment)</option>
                  <option value="Feather">Feather (Relax)</option>
                  <option value="ShieldCheck">Shield (Away)</option>
                </select>
              </div>

              {/* Target Devices Selection */}
              <div>
                <label className="text-xs font-semibold text-nature-dark block mb-1">
                  Select Devices & Target States
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto border border-nature-border rounded-2xl p-2 bg-nature-bg">
                  {devices.map((dev) => {
                    const action = selectedActions.find((a) => a.deviceId === dev.id);
                    const isIncluded = !!action;

                    return (
                      <div
                        key={dev.id}
                        className={`p-2.5 rounded-xl border transition-colors flex items-center justify-between text-xs ${
                          isIncluded
                            ? 'bg-nature-card border-nature-primary/40'
                            : 'bg-white/60 border-nature-border opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isIncluded}
                            onChange={() => toggleDeviceInScene(dev.id)}
                            className="w-4 h-4 rounded text-nature-primary focus:ring-nature-primary border-nature-border"
                          />
                          <div>
                            <span className="font-medium text-nature-dark block">
                              {dev.name}
                            </span>
                            <span className="text-[11px] text-nature-muted">
                              {dev.room}
                            </span>
                          </div>
                        </div>

                        {isIncluded && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                updateActionTargetPower(dev.id, !action.targetState.power)
                              }
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                                action.targetState.power
                                  ? 'bg-nature-sage text-nature-dark'
                                  : 'bg-nature-surface text-nature-muted'
                              }`}
                            >
                              {action.targetState.power ? 'Target: ON' : 'Target: OFF'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-nature-muted hover:text-nature-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-nature-primary hover:bg-nature-primary-hover text-white text-xs font-medium shadow-soft transition-all"
                >
                  {editingScene ? 'Update Scene' : 'Save Scene'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
