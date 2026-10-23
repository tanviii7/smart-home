import {
  Room,
  Device,
  DeviceState,
  Scene,
  MealPlan,
  Recipe,
  ShoppingListItem,
  PantryItem,
  HouseholdTask,
  AppSettings,
  AssistantMessage,
  Ingredient
} from '../types';
import {
  INITIAL_ROOMS,
  INITIAL_DEVICES,
  INITIAL_SCENES,
  INITIAL_MEAL_PLAN,
  INITIAL_RECIPES,
  INITIAL_SHOPPING_ITEMS,
  INITIAL_PANTRY_ITEMS,
  INITIAL_TASKS,
  INITIAL_SETTINGS
} from './initialData';

const KEYS = {
  ROOMS: 'smarthome_rooms_v1',
  DEVICES: 'smarthome_devices_v1',
  SCENES: 'smarthome_scenes_v1',
  MEAL_PLAN: 'smarthome_meal_plan_v1',
  RECIPES: 'smarthome_recipes_v1',
  SHOPPING: 'smarthome_shopping_v1',
  PANTRY: 'smarthome_pantry_v1',
  TASKS: 'smarthome_tasks_v1',
  SETTINGS: 'smarthome_settings_v1',
  CHAT_MESSAGES: 'smarthome_chat_messages_v1',
};

// Simple event emitter for storage changes
type StorageListener = () => void;
const listeners: Set<StorageListener> = new Set();

export const subscribeToStorage = (listener: StorageListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifyListeners = () => {
  listeners.forEach((l) => {
    try {
      l();
    } catch (e) {
      console.error('Storage listener error:', e);
    }
  });
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    if (!val) return fallback;
    return JSON.parse(val);
  } catch (e) {
    console.warn(`Failed to parse storage key "${key}":`, e);
    return fallback;
  }
}

function safeSet<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    notifyListeners();
  } catch (e) {
    console.error(`Failed to write to storage key "${key}":`, e);
  }
}

export const StorageRepository = {
  // Rooms
  getRooms(): Room[] {
    return safeGet<Room[]>(KEYS.ROOMS, INITIAL_ROOMS);
  },
  saveRooms(rooms: Room[]): void {
    safeSet(KEYS.ROOMS, rooms);
  },

  // Devices
  getDevices(): Device[] {
    return safeGet<Device[]>(KEYS.DEVICES, INITIAL_DEVICES);
  },
  saveDevices(devices: Device[]): void {
    safeSet(KEYS.DEVICES, devices);
  },
  updateDevice(id: string, updates: Partial<Omit<Device, 'state'>> & { state?: Partial<DeviceState> }): Device | null {
    const devices = this.getDevices();
    const idx = devices.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    const updated = {
      ...devices[idx],
      ...updates,
      state: {
        ...devices[idx].state,
        ...(updates.state || {})
      },
      lastUpdated: new Date().toISOString()
    };
    devices[idx] = updated;
    this.saveDevices(devices);
    return updated;
  },
  addDevice(device: Device): void {
    const devices = this.getDevices();
    devices.push(device);
    this.saveDevices(devices);
  },
  deleteDevice(id: string): void {
    const devices = this.getDevices().filter((d) => d.id !== id);
    this.saveDevices(devices);
  },

  // Scenes
  getScenes(): Scene[] {
    return safeGet<Scene[]>(KEYS.SCENES, INITIAL_SCENES);
  },
  saveScenes(scenes: Scene[]): void {
    safeSet(KEYS.SCENES, scenes);
  },
  addScene(scene: Scene): void {
    const scenes = this.getScenes();
    scenes.push(scene);
    this.saveScenes(scenes);
  },
  updateScene(id: string, updates: Partial<Scene>): void {
    const scenes = this.getScenes();
    const idx = scenes.findIndex((s) => s.id === id);
    if (idx !== -1) {
      scenes[idx] = { ...scenes[idx], ...updates };
      this.saveScenes(scenes);
    }
  },
  deleteScene(id: string): void {
    const scenes = this.getScenes().filter((s) => s.id !== id);
    this.saveScenes(scenes);
  },

  // Meal Plan & Recipes
  getMealPlan(): MealPlan {
    return safeGet<MealPlan>(KEYS.MEAL_PLAN, INITIAL_MEAL_PLAN);
  },
  saveMealPlan(plan: MealPlan): void {
    safeSet(KEYS.MEAL_PLAN, plan);
  },
  setDayMeal(dayOfWeek: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', recipe: Recipe | undefined): MealPlan {
    const plan = this.getMealPlan();
    const day = plan.days.find((d) => d.dayOfWeek.toLowerCase() === dayOfWeek.toLowerCase());
    if (day) {
      day.meals[mealType] = recipe;
      this.saveMealPlan(plan);
    }
    return plan;
  },
  deleteMealFromSlot(dayOfWeek: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'): MealPlan {
    return this.setDayMeal(dayOfWeek, mealType, undefined);
  },
  getRecipes(): Record<string, Recipe> {
    return safeGet<Record<string, Recipe>>(KEYS.RECIPES, INITIAL_RECIPES);
  },
  saveRecipe(recipe: Recipe): void {
    const recipes = this.getRecipes();
    recipes[recipe.id] = recipe;
    safeSet(KEYS.RECIPES, recipes);
  },
  deleteRecipe(id: string): void {
    const recipes = this.getRecipes();
    delete recipes[id];
    safeSet(KEYS.RECIPES, recipes);
  },

  // Shopping List
  getShoppingList(): ShoppingListItem[] {
    return safeGet<ShoppingListItem[]>(KEYS.SHOPPING, INITIAL_SHOPPING_ITEMS);
  },
  saveShoppingList(items: ShoppingListItem[]): void {
    safeSet(KEYS.SHOPPING, items);
  },
  addShoppingItem(item: Omit<ShoppingListItem, 'id' | 'createdAt'>): ShoppingListItem {
    const items = this.getShoppingList();
    const newItem: ShoppingListItem = {
      ...item,
      id: `shop_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    items.unshift(newItem);
    this.saveShoppingList(items);
    return newItem;
  },
  updateShoppingItem(id: string, updates: Partial<ShoppingListItem>): void {
    const items = this.getShoppingList();
    const idx = items.findIndex((i) => i.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...updates };
      this.saveShoppingList(items);
    }
  },
  deleteShoppingItem(id: string): void {
    const items = this.getShoppingList().filter((i) => i.id !== id);
    this.saveShoppingList(items);
  },
  clearCompletedShoppingItems(): void {
    const items = this.getShoppingList().filter((i) => !i.completed);
    this.saveShoppingList(items);
  },
  addIngredientsToShoppingList(ingredients: Ingredient[], recipeTitle?: string): { added: number; updated: number } {
    const list = this.getShoppingList();
    let addedCount = 0;
    let updatedCount = 0;

    ingredients.forEach((ing) => {
      const trimmedName = ing.name.trim();
      const existing = list.find((item) => item.name.toLowerCase() === trimmedName.toLowerCase());

      if (existing) {
        // Don't duplicate; append quantity note if different
        if (!existing.completed) {
          existing.quantity = `${existing.quantity} + ${ing.quantity}`;
          existing.notes = existing.notes ? `${existing.notes}; also needed for ${recipeTitle || 'meal'}` : `Also for ${recipeTitle || 'meal'}`;
          updatedCount++;
        } else {
          // If already checked off in past, uncheck it with new quantity
          existing.completed = false;
          existing.quantity = ing.quantity;
          existing.notes = `Restocked for ${recipeTitle || 'meal'}`;
          updatedCount++;
        }
      } else {
        list.push({
          id: `shop_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: trimmedName,
          quantity: ing.quantity,
          category: ing.category || 'Pantry Staples',
          completed: false,
          addedFromRecipe: recipeTitle,
          createdAt: new Date().toISOString()
        });
        addedCount++;
      }
    });

    this.saveShoppingList(list);
    return { added: addedCount, updated: updatedCount };
  },

  // Pantry
  getPantry(): PantryItem[] {
    return safeGet<PantryItem[]>(KEYS.PANTRY, INITIAL_PANTRY_ITEMS);
  },
  savePantry(items: PantryItem[]): void {
    safeSet(KEYS.PANTRY, items);
  },
  addPantryItem(item: Omit<PantryItem, 'id' | 'updatedAt'>): PantryItem {
    const items = this.getPantry();
    const newItem: PantryItem = {
      ...item,
      id: `pantry_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      updatedAt: new Date().toISOString()
    };
    items.unshift(newItem);
    this.savePantry(items);
    return newItem;
  },
  updatePantryItem(id: string, updates: Partial<PantryItem>): void {
    const items = this.getPantry();
    const idx = items.findIndex((i) => i.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
      this.savePantry(items);
    }
  },
  deletePantryItem(id: string): void {
    const items = this.getPantry().filter((i) => i.id !== id);
    this.savePantry(items);
  },

  // Tasks & Reminders
  getTasks(): HouseholdTask[] {
    return safeGet<HouseholdTask[]>(KEYS.TASKS, INITIAL_TASKS);
  },
  saveTasks(tasks: HouseholdTask[]): void {
    safeSet(KEYS.TASKS, tasks);
  },
  addTask(task: Omit<HouseholdTask, 'id' | 'createdAt'>): HouseholdTask {
    const tasks = this.getTasks();
    const newTask: HouseholdTask = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    tasks.unshift(newTask);
    this.saveTasks(tasks);
    return newTask;
  },
  updateTask(id: string, updates: Partial<HouseholdTask>): void {
    const tasks = this.getTasks();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      tasks[idx] = { ...tasks[idx], ...updates };
      this.saveTasks(tasks);
    }
  },
  toggleTaskCompletion(id: string): { task: HouseholdTask | null; nextOccurrenceCreated: boolean } {
    const tasks = this.getTasks();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return { task: null, nextOccurrenceCreated: false };

    const current = tasks[idx];
    const willBeCompleted = !current.completed;

    current.completed = willBeCompleted;
    current.completedAt = willBeCompleted ? new Date().toISOString() : undefined;

    let nextOccurrenceCreated = false;

    // If marked completed and has a recurrence rule, schedule next occurrence
    if (willBeCompleted && current.recurrence && current.recurrence !== 'none') {
      const baseDate = current.dueDate ? new Date(current.dueDate) : new Date();
      let nextDate = new Date(baseDate);

      switch (current.recurrence) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + 1);
          break;
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'biweekly':
          nextDate.setDate(nextDate.getDate() + 14);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
      }

      const nextOccurrenceTask: HouseholdTask = {
        ...current,
        id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        dueDate: nextDate.toISOString().split('T')[0],
        completed: false,
        completedAt: undefined,
        createdAt: new Date().toISOString()
      };

      tasks.push(nextOccurrenceTask);
      nextOccurrenceCreated = true;
    }

    this.saveTasks(tasks);
    return { task: current, nextOccurrenceCreated };
  },
  deleteTask(id: string): void {
    const tasks = this.getTasks().filter((t) => t.id !== id);
    this.saveTasks(tasks);
  },

  // Settings
  getSettings(): AppSettings {
    return safeGet<AppSettings>(KEYS.SETTINGS, INITIAL_SETTINGS);
  },
  saveSettings(settings: AppSettings): void {
    safeSet(KEYS.SETTINGS, settings);
  },

  // Chat Messages
  getChatMessages(): AssistantMessage[] {
    const fallback: AssistantMessage[] = [
      {
        id: 'msg_welcome',
        sender: 'assistant',
        text: 'Good evening! I am your Smart Home Assistant. I can control your lights and climate, coordinate dinner recipes, update your shopping list, or manage household chores. How can I help you right now?',
        timestamp: new Date().toISOString()
      }
    ];
    return safeGet<AssistantMessage[]>(KEYS.CHAT_MESSAGES, fallback);
  },
  saveChatMessages(messages: AssistantMessage[]): void {
    safeSet(KEYS.CHAT_MESSAGES, messages);
  },
  clearChatMessages(): void {
    this.saveChatMessages([]);
  },

  // Complete Reset
  restoreDemoData(): void {
    safeSet(KEYS.ROOMS, INITIAL_ROOMS);
    safeSet(KEYS.DEVICES, INITIAL_DEVICES);
    safeSet(KEYS.SCENES, INITIAL_SCENES);
    safeSet(KEYS.MEAL_PLAN, INITIAL_MEAL_PLAN);
    safeSet(KEYS.RECIPES, INITIAL_RECIPES);
    safeSet(KEYS.SHOPPING, INITIAL_SHOPPING_ITEMS);
    safeSet(KEYS.PANTRY, INITIAL_PANTRY_ITEMS);
    safeSet(KEYS.TASKS, INITIAL_TASKS);
    safeSet(KEYS.SETTINGS, INITIAL_SETTINGS);
    this.clearChatMessages();
    notifyListeners();
  }
};
