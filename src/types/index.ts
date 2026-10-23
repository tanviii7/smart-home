// Core Data Types for Smart Home AI Assistant

export type DeviceCategory = 'lighting' | 'climate' | 'entertainment' | 'appliance' | 'security';

export interface DeviceState {
  power: boolean;
  brightness?: number; // 0 - 100
  colorTemp?: number; // 2200K - 6500K
  color?: string; // hex color
  temperature?: number; // e.g. 70°F
  targetTemperature?: number;
  fanSpeed?: 'off' | 'low' | 'medium' | 'high';
  volume?: number; // 0 - 100
  input?: string;
  mode?: 'heat' | 'cool' | 'auto' | 'off';
  [key: string]: any;
}

export interface Device {
  id: string;
  name: string;
  room: string;
  category: DeviceCategory;
  state: DeviceState;
  isSimulated: boolean;
  isFavorite: boolean;
  modelInfo?: string;
  lastUpdated: string;
}

export interface Room {
  id: string;
  name: string;
  icon?: string;
  floor?: string;
}

export interface SceneAction {
  deviceId: string;
  targetState: Partial<DeviceState>;
}

export interface Scene {
  id: string;
  name: string;
  description: string;
  icon: string;
  category?: string;
  actions: SceneAction[];
  isActive?: boolean;
  lastActivated?: string;
}

export type DietaryPreference = 'Vegetarian' | 'Vegan' | 'Gluten-Free' | 'Dairy-Free' | 'High-Protein' | 'Mediterranean' | 'Low-Carb' | 'Keto';

export interface Ingredient {
  name: string;
  quantity: string;
  category?: ShoppingCategory;
  note?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  dietaryTags: DietaryPreference[];
  cuisine: string;
  ingredients: Ingredient[];
  instructions: string[];
  imageUrl?: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface DayMealPlan {
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  dateStr?: string;
  meals: {
    breakfast?: Recipe;
    lunch?: Recipe;
    dinner?: Recipe;
    snack?: Recipe;
  };
}

export interface MealPlan {
  id: string;
  startDate: string;
  days: DayMealPlan[];
}

export type ShoppingCategory = 
  | 'Fruits & Vegetables'
  | 'Dairy'
  | 'Grains & Bakery'
  | 'Pantry Staples'
  | 'Snacks'
  | 'Beverages'
  | 'Cleaning Supplies'
  | 'Personal Care'
  | 'Other';

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: string;
  category: ShoppingCategory;
  completed: boolean;
  notes?: string;
  addedFromRecipe?: string;
  createdAt: string;
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: string;
  category: ShoppingCategory;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  expiryDate?: string;
  notes?: string;
  updatedAt: string;
}

export type TaskCategory = 'Cleaning' | 'Maintenance' | 'Plants' | 'Kitchen' | 'Laundry' | 'General';
export type TaskPriority = 'Low' | 'Medium' | 'High';
export type RecurrenceRule = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface HouseholdTask {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  recurrence: RecurrenceRule;
  completed: boolean;
  completedAt?: string;
  assignedTo?: string;
  createdAt: string;
}

export interface ToolCall {
  name: string;
  params: Record<string, any>;
}

export interface ToolResult {
  toolName: string;
  success: boolean;
  message: string;
  data?: any;
}

export interface AssistantConfirmation {
  required: boolean;
  title: string;
  prompt: string;
  actionPayload?: {
    toolName: string;
    params: any;
  };
  confirmed?: boolean;
}

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  confirmation?: AssistantConfirmation;
  isThinking?: boolean;
}

export interface HouseholdMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  specialty?: string;
}

export interface AppSettings {
  householdName: string;
  temperatureUnit: '°F' | '°C';
  defaultServings: number;
  dietaryPreferences: DietaryPreference[];
  aiProvider: 'local' | 'gemini';
  geminiApiKey?: string;
  deviceIntegrationMode: 'simulated' | 'home_assistant_bridge';
  ambientGreetingEnabled: boolean;
  voiceSoundsEnabled: boolean;
}

export type ActiveTab = 'dashboard' | 'devices' | 'scenes' | 'meals' | 'groceries' | 'tasks' | 'assistant' | 'settings';
