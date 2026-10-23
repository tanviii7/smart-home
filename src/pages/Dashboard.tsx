import React, { useState } from 'react';
import {
  Sparkles,
  Thermometer,
  Zap,
  CheckCircle2,
  ShoppingCart,
  ArrowRight,
  Sun,
  Moon,
  Clock,
  Send,
  Power,
  ChevronRight,
  Plus
} from 'lucide-react';
import {
  Device,
  Scene,
  MealPlan,
  ShoppingListItem,
  PantryItem,
  HouseholdTask,
  AppSettings,
  ActiveTab
} from '../types';
import { deviceService } from '../services/deviceService';
import { StorageRepository } from '../services/storage';
import { useToast } from '../context/ToastContext';

interface DashboardProps {
  devices: Device[];
  scenes: Scene[];
  mealPlan: MealPlan;
  shoppingList: ShoppingListItem[];
  pantryItems: PantryItem[];
  tasks: HouseholdTask[];
  settings: AppSettings;
  onNavigate: (tab: ActiveTab) => void;
  onOpenAssistantWithPrompt?: (prompt: string) => void;
  onRefreshData: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  devices,
  scenes,
  mealPlan,
  shoppingList,
  pantryItems,
  tasks,
  settings,
  onNavigate,
  onOpenAssistantWithPrompt,
  onRefreshData
}) => {
  const { showToast } = useToast();
  const [quickInput, setQuickInput] = useState('');
  const [activatingSceneId, setActivatingSceneId] = useState<string | null>(null);

  // Time-aware greeting
  const hour = new Date().getHours();
  let timeGreeting = 'Good evening';
  if (hour < 12) timeGreeting = 'Good morning';
  else if (hour < 17) timeGreeting = 'Good afternoon';

  const dateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  // Home metrics
  const activeDevices = devices.filter((d) => d.state.power);
  const thermostat = devices.find((d) => d.category === 'climate');
  const tempReading = thermostat?.state.temperature ?? 71;
  const targetTemp = thermostat?.state.targetTemperature ?? 70;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter((t) => t.dueDate === todayStr || (!t.completed && t.dueDate < todayStr));
  const pendingTasks = todayTasks.filter((t) => !t.completed);

  const unboughtGroceries = shoppingList.filter((i) => !i.completed);
  const lowPantry = pantryItems.filter((p) => p.status === 'Low Stock' || p.status === 'Out of Stock');

  const todayDinner = mealPlan.days[0]?.meals?.dinner;

  // Toggle favorite device directly
  const handleToggleDevice = async (device: Device, e: React.MouseEvent) => {
    e.stopPropagation();
    const newPower = !device.state.power;
    const res = await deviceService.controlDevice(device.id, { power: newPower });
    if (res.success) {
      showToast(`${device.name} turned ${newPower ? 'on' : 'off'}`, 'success');
      onRefreshData();
    }
  };

  // Quick Scene activation
  const handleActivateScene = async (scene: Scene) => {
    setActivatingSceneId(scene.id);
    try {
      const res = await deviceService.activateScene(scene.id);
      if (res.success) {
        showToast(`Scene "${scene.name}" activated!`, 'success');
        onRefreshData();
      }
    } finally {
      setActivatingSceneId(null);
    }
  };

  // Toggle task from dashboard
  const handleToggleTask = (task: HouseholdTask) => {
    const { nextOccurrenceCreated } = StorageRepository.toggleTaskCompletion(task.id);
    showToast(
      task.completed
        ? `Task reopened: ${task.title}`
        : `Task completed: ${task.title}${nextOccurrenceCreated ? ' (Rescheduled for next cycle)' : ''}`,
      'success'
    );
    onRefreshData();
  };

  // Transfer today's dinner ingredients to grocery list
  const handleAddDinnerIngredients = () => {
    if (!todayDinner) return;
    const result = StorageRepository.addIngredientsToShoppingList(
      todayDinner.ingredients,
      todayDinner.title
    );
    showToast(
      `Added ${result.added} items from "${todayDinner.title}" to grocery list`,
      'success'
    );
    onRefreshData();
  };

  const handleQuickAssistantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onOpenAssistantWithPrompt?.(quickInput);
    setQuickInput('');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header Greeting & Quick Assistant Bar */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-nature-muted text-xs font-medium uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-nature-primary" />
            <span>{dateFormatted}</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              All systems nominal
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-nature-dark mt-1">
            {timeGreeting}, welcome home.
          </h1>
          <p className="text-nature-muted text-sm mt-0.5">
            {settings.householdName} • {activeDevices.length} active devices in the house
          </p>
        </div>

        {/* Quick Assistant search/command input */}
        <div className="w-full md:w-80 lg:w-96">
          <form
            onSubmit={handleQuickAssistantSubmit}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Ask assistant or control home..."
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-nature-card border border-nature-border text-sm text-nature-text placeholder:text-nature-muted shadow-soft focus:outline-none focus:border-nature-primary focus:ring-1 focus:ring-nature-primary transition-all"
            />
            <Sparkles className="w-4 h-4 text-nature-primary absolute left-3.5 pointer-events-none" />
            <button
              type="submit"
              disabled={!quickInput.trim()}
              className="absolute right-2 p-1.5 rounded-xl bg-nature-primary hover:bg-nature-primary-hover disabled:opacity-30 text-white transition-colors"
              aria-label="Send command"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </section>

      {/* 2. Home Overview Metrics Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Indoor Climate */}
        <div
          onClick={() => onNavigate('devices')}
          className="p-4 rounded-2xl bg-nature-card border border-nature-border shadow-soft hover:shadow-soft-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-nature-muted mb-2">
            <span className="text-xs font-medium">Indoor Climate</span>
            <div className="p-1.5 rounded-lg bg-nature-sage/40 text-nature-dark group-hover:bg-nature-sage transition-colors">
              <Thermometer className="w-4 h-4 text-nature-primary" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-semibold text-nature-dark">
              {tempReading}°
            </span>
            <span className="text-xs text-nature-muted font-medium">
              Target: {targetTemp}°
            </span>
          </div>
          <div className="mt-2 text-[11px] text-nature-muted flex items-center justify-between">
            <span>Main Floor Zone</span>
            <span className="text-nature-primary font-medium group-hover:underline flex items-center">
              View <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Active Devices */}
        <div
          onClick={() => onNavigate('devices')}
          className="p-4 rounded-2xl bg-nature-card border border-nature-border shadow-soft hover:shadow-soft-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-nature-muted mb-2">
            <span className="text-xs font-medium">Active Devices</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 group-hover:bg-amber-100 transition-colors">
              <Zap className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-semibold text-nature-dark">
              {activeDevices.length}
            </span>
            <span className="text-xs text-nature-muted font-medium">
              of {devices.length} running
            </span>
          </div>
          <div className="mt-2 text-[11px] text-nature-muted flex items-center justify-between">
            <span>Simulated Matter Bus</span>
            <span className="text-nature-primary font-medium group-hover:underline flex items-center">
              Control <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Pending Tasks */}
        <div
          onClick={() => onNavigate('tasks')}
          className="p-4 rounded-2xl bg-nature-card border border-nature-border shadow-soft hover:shadow-soft-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-nature-muted mb-2">
            <span className="text-xs font-medium">Chores Today</span>
            <div className="p-1.5 rounded-lg bg-nature-sage/40 text-nature-dark group-hover:bg-nature-sage transition-colors">
              <CheckCircle2 className="w-4 h-4 text-nature-primary" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-semibold text-nature-dark">
              {pendingTasks.length}
            </span>
            <span className="text-xs text-nature-muted font-medium">
              tasks due
            </span>
          </div>
          <div className="mt-2 text-[11px] text-nature-muted flex items-center justify-between">
            <span>{tasks.filter((t) => t.completed).length} completed</span>
            <span className="text-nature-primary font-medium group-hover:underline flex items-center">
              Review <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Groceries & Low Stock */}
        <div
          onClick={() => onNavigate('groceries')}
          className="p-4 rounded-2xl bg-nature-card border border-nature-border shadow-soft hover:shadow-soft-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-nature-muted mb-2">
            <span className="text-xs font-medium">Groceries Needed</span>
            <div className="p-1.5 rounded-lg bg-nature-peach/60 text-amber-900 group-hover:bg-nature-peach transition-colors">
              <ShoppingCart className="w-4 h-4 text-amber-800" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-semibold text-nature-dark">
              {unboughtGroceries.length}
            </span>
            <span className="text-xs text-amber-800 font-medium">
              {lowPantry.length} pantry low
            </span>
          </div>
          <div className="mt-2 text-[11px] text-nature-muted flex items-center justify-between">
            <span>List ready</span>
            <span className="text-nature-primary font-medium group-hover:underline flex items-center">
              View List <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>
      </section>

      {/* 3. AI Proactive Assistant Recommendation Banner */}
      <section className="p-5 rounded-2xl bg-gradient-to-r from-nature-card via-nature-surface to-nature-sage-light border border-nature-border shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-nature-primary text-white flex items-center justify-center shrink-0 shadow-soft">
            <Sparkles className="w-5 h-5 text-nature-sage" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-nature-dark">
                Proactive Home Coordination
              </span>
              <span className="text-[10px] bg-white/80 px-2 py-0.5 rounded-full font-semibold text-nature-primary border border-nature-border">
                AI Suggestion
              </span>
            </div>
            <p className="text-sm text-nature-text mt-1 leading-snug">
              Evening prep window: Tonight's dinner is <strong className="font-semibold text-nature-dark">{todayDinner?.title}</strong> (30 min prep).
              {lowPantry.length > 0 && ` Note: ${lowPantry[0].name} is low in your pantry.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => onOpenAssistantWithPrompt?.('Help me organize dinner and evening chores')}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-nature-primary hover:bg-nature-primary-hover text-white text-xs font-medium shadow-soft transition-all text-center"
          >
            Coordinate Evening
          </button>
        </div>
      </section>

      {/* 4. Quick Scene Launcher */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-semibold text-nature-dark">
              Quick Scene Launcher
            </h2>
            <p className="text-xs text-nature-muted">
              One-touch household presets with verified simulated device states
            </p>
          </div>
          <button
            onClick={() => onNavigate('scenes')}
            className="text-xs font-semibold text-nature-primary hover:text-nature-dark transition-colors flex items-center gap-1"
          >
            All Scenes <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {scenes.map((scene) => {
            const isActivating = activatingSceneId === scene.id;
            return (
              <button
                key={scene.id}
                onClick={() => handleActivateScene(scene)}
                disabled={isActivating}
                className="p-4 rounded-2xl bg-nature-card hover:bg-nature-card/90 border border-nature-border hover:border-nature-primary/40 shadow-soft hover:shadow-soft-md transition-all text-left flex flex-col justify-between group h-32 active:scale-95 disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-nature-sage/50 text-nature-dark flex items-center justify-center group-hover:bg-nature-sage transition-colors">
                    {scene.icon === 'Sunrise' ? (
                      <Sun className="w-4 h-4 text-nature-primary" />
                    ) : scene.icon === 'Moon' ? (
                      <Moon className="w-4 h-4 text-nature-dark" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-nature-primary" />
                    )}
                  </div>
                  <span className="text-[10px] text-nature-muted font-mono">
                    {scene.actions.length} devices
                  </span>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-nature-dark group-hover:text-nature-primary transition-colors leading-tight">
                    {scene.name}
                  </h3>
                  <span className="text-[11px] text-nature-muted block mt-0.5 truncate">
                    {isActivating ? 'Activating...' : scene.lastActivated || 'Ready'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. Two-Column Lifestyle Grid: Today's Dinner & Quick Device Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Tonight's Dinner Card & Chores */}
        <div className="lg:col-span-7 space-y-6">
          {/* Dinner Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-nature-card border border-nature-border shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-nature-muted">
                  Tonight's Dinner
                </span>
                <h3 className="font-serif text-2xl font-semibold text-nature-dark mt-0.5">
                  {todayDinner?.title || 'No meal scheduled'}
                </h3>
              </div>
              <button
                onClick={() => onNavigate('meals')}
                className="text-xs text-nature-primary hover:text-nature-dark font-medium flex items-center gap-1"
              >
                Weekly Planner <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {todayDinner && (
              <>
                <p className="text-sm text-nature-muted leading-relaxed">
                  {todayDinner.description}
                </p>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-nature-sage/50 text-nature-dark font-medium">
                    ⏱ {todayDinner.prepTimeMinutes + todayDinner.cookTimeMinutes} mins
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-nature-surface text-nature-text font-medium">
                    🍽 Serves {todayDinner.servings}
                  </span>
                  {todayDinner.dietaryTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full bg-nature-peach/50 text-amber-900 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Key Ingredients Preview */}
                <div className="pt-2 border-t border-nature-border">
                  <span className="text-xs font-semibold text-nature-dark block mb-2">
                    Key Ingredients ({todayDinner.ingredients.length} total):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {todayDinner.ingredients.slice(0, 6).map((ing, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-nature-bg border border-nature-border text-xs"
                      >
                        <span className="font-medium text-nature-dark block truncate">
                          {ing.name}
                        </span>
                        <span className="text-[11px] text-nature-muted">
                          {ing.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-wrap gap-2.5">
                  <button
                    onClick={handleAddDinnerIngredients}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-nature-sage text-nature-dark hover:bg-nature-sage/80 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Ingredients to Groceries
                  </button>
                  <button
                    onClick={() => onNavigate('meals')}
                    className="px-4 py-2 rounded-xl bg-nature-surface hover:bg-nature-sage/30 text-nature-text font-medium text-xs transition-colors"
                  >
                    View Recipe Details
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Today's Chores List */}
          <div className="p-5 sm:p-6 rounded-3xl bg-nature-card border border-nature-border shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-nature-muted">
                  Daily Household Routines
                </span>
                <h3 className="font-serif text-xl font-semibold text-nature-dark">
                  Today's Chores
                </h3>
              </div>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-xs text-nature-primary hover:text-nature-dark font-medium flex items-center gap-1"
              >
                All Tasks <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 pt-1">
              {todayTasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    task.completed
                      ? 'bg-nature-bg border-nature-border/60 opacity-60'
                      : 'bg-white border-nature-border hover:border-nature-primary/50 shadow-soft'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-nature-primary focus:ring-nature-primary border-nature-border pointer-events-none"
                    />
                    <div>
                      <span
                        className={`text-sm font-medium ${
                          task.completed
                            ? 'line-through text-nature-muted'
                            : 'text-nature-dark'
                        }`}
                      >
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-nature-muted mt-0.5">
                        <span>{task.category}</span>
                        {task.dueTime && <span>• {task.dueTime}</span>}
                        {task.assignedTo && <span>• {task.assignedTo}</span>}
                      </div>
                    </div>
                  </div>

                  {task.recurrence && task.recurrence !== 'none' && (
                    <span className="text-[10px] uppercase font-semibold text-nature-muted bg-nature-surface px-2 py-0.5 rounded-full">
                      {task.recurrence}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Favorite Devices & Quick Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 sm:p-6 rounded-3xl bg-nature-card border border-nature-border shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-nature-muted">
                  Quick Access
                </span>
                <h3 className="font-serif text-xl font-semibold text-nature-dark">
                  Favorite Devices
                </h3>
              </div>
              <button
                onClick={() => onNavigate('devices')}
                className="text-xs text-nature-primary hover:text-nature-dark font-medium flex items-center gap-1"
              >
                All Devices <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {devices.filter((d) => d.isFavorite).slice(0, 5).map((dev) => {
                const isOn = dev.state.power;
                return (
                  <div
                    key={dev.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isOn
                        ? 'bg-nature-sage-light/60 border-nature-sage'
                        : 'bg-white border-nature-border'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-nature-dark">
                          {dev.name}
                        </span>
                        <span className="text-[10px] text-nature-muted font-medium bg-nature-surface px-1.5 py-0.5 rounded">
                          {dev.room}
                        </span>
                      </div>
                      <span className="text-xs text-nature-muted block mt-0.5">
                        {isOn
                          ? dev.state.brightness !== undefined
                            ? `On • ${dev.state.brightness}% brightness`
                            : dev.state.targetTemperature !== undefined
                            ? `On • Set to ${dev.state.targetTemperature}°F`
                            : dev.state.fanSpeed !== undefined
                            ? `On • ${dev.state.fanSpeed} speed`
                            : 'Powered on'
                          : 'Off'}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleToggleDevice(dev, e)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        isOn
                          ? 'bg-nature-primary text-white shadow-soft'
                          : 'bg-nature-surface text-nature-muted hover:text-nature-dark'
                      }`}
                      aria-label={`Toggle ${dev.name}`}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grocery Snapshot Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-nature-surface/60 border border-nature-border shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-nature-muted">
                  Shopping & Pantry
                </span>
                <h3 className="font-serif text-lg font-semibold text-nature-dark">
                  Stock Snapshot
                </h3>
              </div>
              <button
                onClick={() => onNavigate('groceries')}
                className="text-xs text-nature-primary hover:text-nature-dark font-medium"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2">
              {lowPantry.length > 0 && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  <span className="font-semibold block">⚠️ Low Stock Alert</span>
                  <span>
                    {lowPantry.map((p) => p.name).slice(0, 3).join(', ')} running low.
                  </span>
                </div>
              )}

              <div className="p-3 rounded-2xl bg-white border border-nature-border text-xs flex items-center justify-between">
                <span className="text-nature-muted">Remaining on Shopping List:</span>
                <span className="font-bold text-nature-dark">
                  {unboughtGroceries.length} items
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
