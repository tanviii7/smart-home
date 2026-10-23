import React, { useState } from 'react';
import {
  Home,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  Check,
  Plus,
  Trash2,
  Key,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { AppSettings, Room, DietaryPreference } from '../types';
import { StorageRepository } from '../services/storage';
import { AssistantService } from '../services/assistantService';
import { useToast } from '../context/ToastContext';

interface SettingsViewProps {
  settings: AppSettings;
  rooms: Room[];
  onRefreshData: () => void;
}

const ALL_DIETARY_PREFS: DietaryPreference[] = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'High-Protein',
  'Mediterranean',
  'Low-Carb'
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  rooms,
  onRefreshData
}) => {
  const { showToast } = useToast();

  const [householdName, setHouseholdName] = useState(settings.householdName);
  const [temperatureUnit, setTemperatureUnit] = useState(settings.temperatureUnit);
  const [defaultServings, setDefaultServings] = useState(settings.defaultServings);
  const [dietaryPrefs, setDietaryPrefs] = useState<DietaryPreference[]>(settings.dietaryPreferences);
  const [aiProvider, setAiProvider] = useState<'local' | 'gemini'>(settings.aiProvider);
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey || '');

  // API testing state
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiTestStatus, setApiTestStatus] = useState<{ checked: boolean; success: boolean; message: string } | null>(null);

  // Add room state
  const [newRoomName, setNewRoomName] = useState('');

  const envKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim();
  const effectiveKey = geminiApiKey.trim() || envKey || '';

  const handleTestApiKey = async () => {
    setIsTestingApi(true);
    setApiTestStatus(null);
    try {
      const res = await AssistantService.testGeminiApi(effectiveKey);
      setApiTestStatus({ checked: true, success: res.success, message: res.message });
      if (res.success) {
        showToast('Gemini API verified successfully!', 'success');
      } else {
        showToast('Gemini API verification failed', 'error');
      }
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AppSettings = {
      ...settings,
      householdName: householdName.trim() || 'Smart Home',
      temperatureUnit,
      defaultServings,
      dietaryPreferences: dietaryPrefs,
      aiProvider,
      geminiApiKey: geminiApiKey.trim()
    };
    StorageRepository.saveSettings(updated);
    showToast('Settings saved successfully', 'success');
    onRefreshData();
  };

  const toggleDietaryPref = (pref: DietaryPreference) => {
    setDietaryPrefs((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    const currentRooms = StorageRepository.getRooms();
    const newRoom: Room = {
      id: `room_${Date.now()}`,
      name: newRoomName.trim()
    };
    StorageRepository.saveRooms([...currentRooms, newRoom]);
    showToast(`Added room "${newRoomName}"`, 'success');
    setNewRoomName('');
    onRefreshData();
  };

  const handleDeleteRoom = (roomId: string, name: string) => {
    if (confirm(`Remove room "${name}" from household?`)) {
      const currentRooms = StorageRepository.getRooms().filter((r) => r.id !== roomId);
      StorageRepository.saveRooms(currentRooms);
      showToast(`Removed room "${name}"`, 'info');
      onRefreshData();
    }
  };

  const handleRestoreDemoData = () => {
    if (
      confirm(
        'Are you sure you want to restore the original demo data? All custom device changes, meals, and tasks will be reset.'
      )
    ) {
      StorageRepository.restoreDemoData();
      showToast('Demo data successfully restored to default!', 'success');
      onRefreshData();
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl">
      {/* Top Header */}
      <div>
        <h1 className="font-serif text-3xl font-semibold text-nature-dark">
          Household Settings
        </h1>
        <p className="text-sm text-nature-muted mt-0.5">
          Manage household preferences, AI assistant configuration, and room layout
        </p>
      </div>

      <form onSubmit={handleSaveGeneral} className="space-y-6">
        {/* 1. General Profile */}
        <div className="p-6 rounded-3xl bg-nature-card border border-nature-border shadow-soft space-y-4">
          <div className="flex items-center gap-2.5">
            <Home className="w-5 h-5 text-nature-primary" />
            <h2 className="font-serif text-lg font-semibold text-nature-dark">
              Household Profile
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-nature-dark block mb-1">
                Household Name
              </label>
              <input
                type="text"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-nature-border text-sm text-nature-dark focus:border-nature-primary outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-nature-dark block mb-1">
                Default Dinner Serving Count
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={defaultServings}
                onChange={(e) => setDefaultServings(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-nature-border text-sm text-nature-dark focus:border-nature-primary outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-nature-dark block mb-1">
                Temperature Unit
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTemperatureUnit('°F')}
                  className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                    temperatureUnit === '°F'
                      ? 'bg-nature-dark text-white border-nature-dark font-semibold'
                      : 'bg-white border-nature-border text-nature-text'
                  }`}
                >
                  Fahrenheit (°F)
                </button>
                <button
                  type="button"
                  onClick={() => setTemperatureUnit('°C')}
                  className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                    temperatureUnit === '°C'
                      ? 'bg-nature-dark text-white border-nature-dark font-semibold'
                      : 'bg-white border-nature-border text-nature-text'
                  }`}
                >
                  Celsius (°C)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Dietary Preferences */}
        <div className="p-6 rounded-3xl bg-nature-card border border-nature-border shadow-soft space-y-4">
          <h2 className="font-serif text-lg font-semibold text-nature-dark">
            Dietary Preferences
          </h2>
          <p className="text-xs text-nature-muted">
            The AI meal planner will tailor recipes and pantry recommendations to match these choices.
          </p>

          <div className="flex flex-wrap gap-2">
            {ALL_DIETARY_PREFS.map((pref) => {
              const isChecked = dietaryPrefs.includes(pref);
              return (
                <button
                  key={pref}
                  type="button"
                  onClick={() => toggleDietaryPref(pref)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isChecked
                      ? 'bg-nature-sage text-nature-dark font-semibold border border-nature-primary/40 shadow-soft'
                      : 'bg-nature-surface/70 text-nature-muted hover:text-nature-text border border-nature-border'
                  }`}
                >
                  {isChecked && <Check className="w-3.5 h-3.5 text-nature-primary" />}
                  <span>{pref}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. AI Assistant Service Configuration */}
        <div className="p-6 rounded-3xl bg-nature-card border border-nature-border shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-nature-primary" />
              <h2 className="font-serif text-lg font-semibold text-nature-dark">
                AI Assistant Engine Status
              </h2>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
              Active
            </span>
          </div>

          <p className="text-xs text-nature-muted leading-relaxed">
            Smart Home Assistant supports both deterministic local intent matching (zero API key needed) and Google Gemini API integration with tool calling.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => setAiProvider('local')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                aiProvider === 'local'
                  ? 'bg-nature-sage-light border-nature-primary shadow-soft'
                  : 'bg-white border-nature-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-nature-dark">
                  Local Intent Router (Default)
                </span>
                {aiProvider === 'local' && <Check className="w-4 h-4 text-nature-primary" />}
              </div>
              <p className="text-xs text-nature-muted mt-1">
                Fast, deterministic NLP running locally in-browser. Executes verified application tools without network latency or external costs.
              </p>
            </div>

            <div
              onClick={() => setAiProvider('gemini')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                aiProvider === 'gemini'
                  ? 'bg-nature-sage-light border-nature-primary shadow-soft'
                  : 'bg-white border-nature-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-nature-dark">
                  Google Gemini 3.8 Flash (Latest)
                </span>
                {aiProvider === 'gemini' && <Check className="w-4 h-4 text-nature-primary" />}
              </div>
              <p className="text-xs text-nature-muted mt-1">
                Deep natural language reasoning with real-time function calling against the application's local tool bus.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-nature-surface/60 border border-nature-border space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-nature-dark flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-nature-primary" />
                <span>Google Gemini API Key</span>
              </label>
              {envKey && (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
                  Detected in .env
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder={envKey ? 'Using key from .env (or enter override here)' : 'Paste API Key (AIzaSy...)'}
                className="flex-1 px-3.5 py-2 rounded-xl border border-nature-border text-xs text-nature-dark focus:border-nature-primary outline-none bg-white font-mono"
              />
              <button
                type="button"
                onClick={handleTestApiKey}
                disabled={isTestingApi || !effectiveKey}
                className="px-4 py-2 rounded-xl bg-nature-primary hover:bg-nature-primary-hover disabled:opacity-40 text-white text-xs font-semibold shadow-soft transition-all shrink-0 flex items-center gap-1.5 active:scale-95"
              >
                {isTestingApi ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <span>Test API Connection</span>
                )}
              </button>
            </div>

            {/* Test result status badge */}
            {apiTestStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  apiTestStatus.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                {apiTestStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{apiTestStatus.message}</span>
              </div>
            )}

            <p className="text-[11px] text-nature-muted leading-relaxed">
              When an API key is provided and verified, the assistant automatically switches from the local intent router to live Google Gemini reasoning with real-time application tool execution. Stored securely in your browser's local storage.
            </p>
          </div>
        </div>

        {/* 4. Smart Home Integration Transparency */}
        <div className="p-6 rounded-3xl bg-nature-card border border-nature-border shadow-soft space-y-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-nature-primary" />
            <h2 className="font-serif text-lg font-semibold text-nature-dark">
              Smart Home Integration Architecture
            </h2>
          </div>

          <div className="p-4 rounded-2xl bg-nature-surface/50 border border-nature-border text-xs text-nature-text space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-nature-dark">
                Current Mode: Simulated Demo Bus (Matter / Home Assistant Interface)
              </span>
              <span className="px-2 py-0.5 rounded bg-nature-sage text-nature-dark font-medium text-[10px]">
                Honest Transparency
              </span>
            </div>
            <p className="text-nature-muted leading-relaxed">
              All devices currently operate on the stateful demo bus. State changes occur immediately and synchronize across the dashboard, devices tab, scenes, and conversational assistant. To bridge to a real Home Assistant or Zigbee2MQTT broker, implement the <code>IDeviceService</code> interface.
            </p>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-nature-primary hover:bg-nature-primary-hover text-white text-sm font-medium shadow-soft transition-all active:scale-95"
          >
            Save All Settings
          </button>
        </div>
      </form>

      {/* 5. Rooms Management */}
      <div className="p-6 rounded-3xl bg-nature-card border border-nature-border shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-semibold text-nature-dark">
              Household Rooms
            </h2>
            <p className="text-xs text-nature-muted">
              Organize your devices by zone and room
            </p>
          </div>
        </div>

        <form onSubmit={handleAddRoom} className="flex gap-2">
          <input
            type="text"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="Add new room (e.g. Nursery, Home Office)"
            className="flex-1 px-3.5 py-2 rounded-xl border border-nature-border text-sm text-nature-dark focus:border-nature-primary outline-none"
          />
          <button
            type="submit"
            disabled={!newRoomName.trim()}
            className="px-4 py-2 rounded-xl bg-nature-primary hover:bg-nature-primary-hover disabled:opacity-40 text-white text-xs font-medium shadow-soft transition-all shrink-0 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Room</span>
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="p-3 rounded-2xl bg-nature-bg border border-nature-border flex items-center justify-between text-xs"
            >
              <span className="font-medium text-nature-dark truncate">{room.name}</span>
              {rooms.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteRoom(room.id, room.name)}
                  className="p-1 text-nature-muted hover:text-red-600 transition-colors"
                  title="Remove room"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 6. Demo Data Reset (Dangerous Action) */}
      <div className="p-6 rounded-3xl bg-amber-50/60 border border-amber-200 text-amber-900 shadow-soft space-y-3">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-amber-700" />
          <h2 className="font-serif text-lg font-semibold">
            Reset Demo Data
          </h2>
        </div>
        <p className="text-xs leading-relaxed text-amber-800">
          Restore initial rooms, sample devices, preset scenes, weekly meal plans, and chores. This will reset any custom data you created.
        </p>
        <button
          type="button"
          onClick={handleRestoreDemoData}
          className="px-4 py-2 rounded-xl bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-semibold text-xs transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restore Demo Data</span>
        </button>
      </div>
    </div>
  );
};
