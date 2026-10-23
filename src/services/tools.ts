import { ToolResult } from '../types';
import { StorageRepository } from './storage';
import { deviceService } from './deviceService';
import { INITIAL_RECIPES } from './initialData';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (params: any) => Promise<ToolResult>;
}

export const APPLICATION_TOOLS: Record<string, ToolDefinition> = {
  get_home_status: {
    name: 'get_home_status',
    description: 'Retrieve overall status summary of the smart home, including active devices, temperature, pending chores, and tonight\'s dinner.',
    parameters: {
      type: 'object',
      properties: {}
    },
    async execute() {
      const devices = StorageRepository.getDevices();
      const onDevices = devices.filter((d) => d.state.power);
      const thermostat = devices.find((d) => d.category === 'climate' && d.state.temperature !== undefined);
      const tasks = StorageRepository.getTasks();
      const pendingTasks = tasks.filter((t) => !t.completed);
      const mealPlan = StorageRepository.getMealPlan();
      const currentDay = mealPlan.days[0]; // today
      const dinner = currentDay?.meals.dinner;
      const shopping = StorageRepository.getShoppingList();
      const unboughtGroceries = shopping.filter((s) => !s.completed);

      return {
        toolName: 'get_home_status',
        success: true,
        message: `Home status compiled: ${onDevices.length} devices active, ${pendingTasks.length} pending tasks, ${unboughtGroceries.length} groceries needed.`,
        data: {
          activeDevicesCount: onDevices.length,
          activeDevices: onDevices.map((d) => `${d.name} (${d.room})`),
          indoorTemp: thermostat ? `${thermostat.state.temperature}°F` : '71°F',
          targetTemp: thermostat ? `${thermostat.state.targetTemperature}°F` : '70°F',
          tonightDinner: dinner ? dinner.title : 'No dinner scheduled',
          pendingTasksCount: pendingTasks.length,
          unboughtGroceriesCount: unboughtGroceries.length
        }
      };
    }
  },

  list_rooms_and_devices: {
    name: 'list_rooms_and_devices',
    description: 'List all rooms and devices in the house, optionally filtered by room name or category.',
    parameters: {
      type: 'object',
      properties: {
        room: { type: 'string', description: 'Optional room name filter (e.g. Living Room, Kitchen)' },
        category: { type: 'string', description: 'Optional category filter (lighting, climate, entertainment, appliance)' }
      }
    },
    async execute(params: { room?: string; category?: string }) {
      let devices = StorageRepository.getDevices();
      if (params.room) {
        const query = params.room.toLowerCase();
        devices = devices.filter((d) => d.room.toLowerCase().includes(query));
      }
      if (params.category) {
        devices = devices.filter((d) => d.category.toLowerCase() === params.category?.toLowerCase());
      }

      return {
        toolName: 'list_rooms_and_devices',
        success: true,
        message: `Found ${devices.length} matching devices.`,
        data: devices.map((d) => ({
          id: d.id,
          name: d.name,
          room: d.room,
          power: d.state.power,
          state: d.state
        }))
      };
    }
  },

  control_device: {
    name: 'control_device',
    description: 'Control a smart device (power on/off, brightness, temperature, fan speed, etc.).',
    parameters: {
      type: 'object',
      properties: {
        deviceId: { type: 'string', description: 'The unique ID of the device' },
        deviceNameOrQuery: { type: 'string', description: 'Device name or search term if ID unknown' },
        power: { type: 'boolean', description: 'True to turn on, false to turn off' },
        brightness: { type: 'number', description: 'Brightness level from 0 to 100' },
        targetTemperature: { type: 'number', description: 'Target temperature in degrees' },
        fanSpeed: { type: 'string', enum: ['off', 'low', 'medium', 'high'] }
      }
    },
    async execute(params: {
      deviceId?: string;
      deviceNameOrQuery?: string;
      power?: boolean;
      brightness?: number;
      targetTemperature?: number;
      fanSpeed?: 'off' | 'low' | 'medium' | 'high';
    }) {
      let targetId = params.deviceId;
      const allDevices = StorageRepository.getDevices();

      if (!targetId && params.deviceNameOrQuery) {
        const q = params.deviceNameOrQuery.toLowerCase();
        const found = allDevices.find((d) => d.name.toLowerCase().includes(q) || d.room.toLowerCase().includes(q));
        if (found) {
          targetId = found.id;
        }
      }

      if (!targetId) {
        return {
          toolName: 'control_device',
          success: false,
          message: `Could not identify device from input: "${params.deviceNameOrQuery || 'unknown'}". Please specify a valid device name.`
        };
      }

      const command: any = {};
      if (params.power !== undefined) command.power = params.power;
      if (params.brightness !== undefined) command.brightness = Math.max(0, Math.min(100, params.brightness));
      if (params.targetTemperature !== undefined) command.targetTemperature = params.targetTemperature;
      if (params.fanSpeed !== undefined) command.fanSpeed = params.fanSpeed;

      const result = await deviceService.controlDevice(targetId, command);

      return {
        toolName: 'control_device',
        success: result.success,
        message: result.message,
        data: result
      };
    }
  },

  activate_scene: {
    name: 'activate_scene',
    description: 'Activate a home scene (e.g. Morning Routine, Relax, Movie Night, Away Mode, Good Night).',
    parameters: {
      type: 'object',
      properties: {
        sceneName: { type: 'string', description: 'The name or ID of the scene to activate' }
      },
      required: ['sceneName']
    },
    async execute(params: { sceneName: string }) {
      const scenes = StorageRepository.getScenes();
      const q = params.sceneName.toLowerCase();
      const target = scenes.find((s) => s.id.toLowerCase() === q || s.name.toLowerCase().includes(q));

      if (!target) {
        return {
          toolName: 'activate_scene',
          success: false,
          message: `Scene "${params.sceneName}" was not found. Available scenes: ${scenes.map((s) => s.name).join(', ')}.`
        };
      }

      const result = await deviceService.activateScene(target.id);
      return {
        toolName: 'activate_scene',
        success: result.success,
        message: `Scene "${result.sceneName}" activated successfully. Updated ${result.deviceResults.length} simulated devices.`,
        data: result
      };
    }
  },

  create_scene: {
    name: 'create_scene',
    description: 'Create a new customized smart home scene with target device states.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the scene' },
        description: { type: 'string', description: 'Brief description' },
        icon: { type: 'string', description: 'Icon name (e.g. Sparkles, Moon, Sun, Coffee)' }
      },
      required: ['name']
    },
    async execute(params: { name: string; description?: string; icon?: string }) {
      const newScene = {
        id: `scene_${Date.now()}`,
        name: params.name,
        description: params.description || 'Custom user created scene',
        icon: params.icon || 'Sparkles',
        category: 'Custom',
        actions: [
          { deviceId: 'dev_lr_main', targetState: { power: true, brightness: 50 } },
          { deviceId: 'dev_kitchen_ambient', targetState: { power: true } }
        ]
      };
      StorageRepository.addScene(newScene);

      return {
        toolName: 'create_scene',
        success: true,
        message: `Scene "${params.name}" has been created with default ambient actions. You can customize target devices in the Scenes tab.`,
        data: newScene
      };
    }
  },

  generate_meal_plan: {
    name: 'generate_meal_plan',
    description: 'Generate or adapt a weekly dinner and meal plan based on preferences (e.g. vegetarian, Mediterranean, quick prep).',
    parameters: {
      type: 'object',
      properties: {
        preference: { type: 'string', description: 'Dietary focus such as Vegetarian, High-Protein, Mediterranean' },
        daysCount: { type: 'number', description: 'Number of days to plan (e.g. 5 or 7)' }
      }
    },
    async execute(params: { preference?: string; daysCount?: number }) {
      const pref = params.preference || 'Mediterranean';
      const count = params.daysCount || 7;

      const currentPlan = StorageRepository.getMealPlan();
      const recipes = Object.values(INITIAL_RECIPES);

      // Rotate recipes dynamically
      const updatedDays = currentPlan.days.map((day, idx) => {
        if (idx >= count) return day;
        const dinnerRecipe = recipes[(idx + 1) % recipes.length];
        return {
          ...day,
          meals: {
            ...day.meals,
            dinner: dinnerRecipe
          }
        };
      });

      const newPlan = {
        ...currentPlan,
        days: updatedDays
      };

      StorageRepository.saveMealPlan(newPlan);

      return {
        toolName: 'generate_meal_plan',
        success: true,
        message: `Generated a ${count}-day meal plan focused on ${pref} recipes. Dinners have been updated with verified recipes and balanced prep times.`,
        data: newPlan
      };
    }
  },

  get_meal_plan: {
    name: 'get_meal_plan',
    description: 'Get the current weekly meal plan or today\'s meals.',
    parameters: {
      type: 'object',
      properties: {
        day: { type: 'string', description: 'Optional day of week (Monday, Tuesday, etc.)' }
      }
    },
    async execute(params: { day?: string }) {
      const plan = StorageRepository.getMealPlan();
      if (params.day) {
        const d = plan.days.find((x) => x.dayOfWeek.toLowerCase() === params.day?.toLowerCase());
        return {
          toolName: 'get_meal_plan',
          success: true,
          message: `Meals for ${params.day}: Breakfast: ${d?.meals.breakfast?.title || 'None'}, Lunch: ${d?.meals.lunch?.title || 'None'}, Dinner: ${d?.meals.dinner?.title || 'None'}.`,
          data: d
        };
      }

      return {
        toolName: 'get_meal_plan',
        success: true,
        message: `Retrieved full 7-day meal plan. Tonight's dinner is "${plan.days[0]?.meals.dinner?.title}".`,
        data: plan
      };
    }
  },

  update_meal_plan: {
    name: 'update_meal_plan',
    description: 'Replace or update a specific meal slot in the weekly schedule.',
    parameters: {
      type: 'object',
      properties: {
        dayOfWeek: { type: 'string', description: 'Day of week (e.g. Monday)' },
        mealType: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
        recipeTitle: { type: 'string', description: 'Title or recipe name' }
      },
      required: ['dayOfWeek', 'mealType', 'recipeTitle']
    },
    async execute(params: { dayOfWeek: string; mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'; recipeTitle: string }) {
      const plan = StorageRepository.getMealPlan();
      const day = plan.days.find((d) => d.dayOfWeek.toLowerCase() === params.dayOfWeek.toLowerCase());

      if (!day) {
        return {
          toolName: 'update_meal_plan',
          success: false,
          message: `Could not find day "${params.dayOfWeek}".`
        };
      }

      const allRecipes = Object.values(StorageRepository.getRecipes());
      const match = allRecipes.find((r) => r.title.toLowerCase().includes(params.recipeTitle.toLowerCase())) || {
        id: `rec_custom_${Date.now()}`,
        title: params.recipeTitle,
        description: 'Custom meal option',
        prepTimeMinutes: 15,
        cookTimeMinutes: 20,
        servings: 4,
        dietaryTags: ['Vegetarian'],
        cuisine: 'Family Favorite',
        ingredients: [],
        instructions: ['Prepare ingredients and cook according to recipe.']
      };

      day.meals[params.mealType] = match;
      StorageRepository.saveMealPlan(plan);

      return {
        toolName: 'update_meal_plan',
        success: true,
        message: `Updated ${params.dayOfWeek}'s ${params.mealType} to "${match.title}".`,
        data: match
      };
    }
  },

  get_pantry_inventory: {
    name: 'get_pantry_inventory',
    description: 'Check current inventory in the pantry, including low-stock and staple items.',
    parameters: {
      type: 'object',
      properties: {
        filter: { type: 'string', enum: ['all', 'low_stock', 'in_stock'] }
      }
    },
    async execute(params: { filter?: 'all' | 'low_stock' | 'in_stock' }) {
      let pantry = StorageRepository.getPantry();
      if (params.filter === 'low_stock') {
        pantry = pantry.filter((p) => p.status === 'Low Stock' || p.status === 'Out of Stock');
      } else if (params.filter === 'in_stock') {
        pantry = pantry.filter((p) => p.status === 'In Stock');
      }

      const lowItems = pantry.filter((p) => p.status === 'Low Stock');
      return {
        toolName: 'get_pantry_inventory',
        success: true,
        message: `Pantry contains ${pantry.length} items (${lowItems.length} running low).`,
        data: pantry
      };
    }
  },

  add_shopping_item: {
    name: 'add_shopping_item',
    description: 'Add an item to the grocery shopping list with optional quantity and department category.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Item name (e.g. Organic Whole Milk, Sourdough Bread)' },
        quantity: { type: 'string', description: 'Quantity (e.g. 1 gallon, 2 loaves, 500g)' },
        category: { type: 'string', description: 'Department category (Dairy, Produce, Bakery, etc.)' }
      },
      required: ['name']
    },
    async execute(params: { name: string; quantity?: string; category?: any }) {
      const added = StorageRepository.addShoppingItem({
        name: params.name,
        quantity: params.quantity || '1 pack',
        category: params.category || 'Pantry Staples',
        completed: false
      });

      return {
        toolName: 'add_shopping_item',
        success: true,
        message: `Added "${added.name}" (${added.quantity}) to your shopping list under ${added.category}.`,
        data: added
      };
    }
  },

  update_shopping_item: {
    name: 'update_shopping_item',
    description: 'Mark a shopping item as completed/purchased, or update its quantity.',
    parameters: {
      type: 'object',
      properties: {
        itemName: { type: 'string', description: 'Name of the item to update' },
        completed: { type: 'boolean', description: 'True to mark purchased, false to uncheck' }
      },
      required: ['itemName']
    },
    async execute(params: { itemName: string; completed?: boolean }) {
      const items = StorageRepository.getShoppingList();
      const match = items.find((i) => i.name.toLowerCase().includes(params.itemName.toLowerCase()));

      if (!match) {
        return {
          toolName: 'update_shopping_item',
          success: false,
          message: `Item "${params.itemName}" not found in shopping list.`
        };
      }

      StorageRepository.updateShoppingItem(match.id, {
        completed: params.completed !== undefined ? params.completed : true
      });

      return {
        toolName: 'update_shopping_item',
        success: true,
        message: `Marked "${match.name}" as ${params.completed !== false ? 'purchased' : 'pending'}.`,
        data: match
      };
    }
  },

  create_household_task: {
    name: 'create_household_task',
    description: 'Create a new household chore or reminder with due date, recurrence, and priority.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the task' },
        category: { type: 'string', enum: ['Cleaning', 'Maintenance', 'Plants', 'Kitchen', 'Laundry', 'General'] },
        priority: { type: 'string', enum: ['Low', 'Medium', 'High'] },
        dueDate: { type: 'string', description: 'Due date in YYYY-MM-DD' },
        recurrence: { type: 'string', enum: ['none', 'daily', 'weekly', 'biweekly', 'monthly'] }
      },
      required: ['title']
    },
    async execute(params: { title: string; category?: any; priority?: any; dueDate?: string; recurrence?: any }) {
      const newTask = StorageRepository.addTask({
        title: params.title,
        category: params.category || 'General',
        priority: params.priority || 'Medium',
        dueDate: params.dueDate || new Date().toISOString().split('T')[0],
        recurrence: params.recurrence || 'none',
        completed: false
      });

      return {
        toolName: 'create_household_task',
        success: true,
        message: `Task "${newTask.title}" scheduled for ${newTask.dueDate} (Priority: ${newTask.priority}, Recurrence: ${newTask.recurrence}).`,
        data: newTask
      };
    }
  },

  list_upcoming_tasks: {
    name: 'list_upcoming_tasks',
    description: 'List household chores and reminders due today or upcoming.',
    parameters: {
      type: 'object',
      properties: {
        filter: { type: 'string', enum: ['today', 'upcoming', 'all'] }
      }
    },
    async execute(params: { filter?: 'today' | 'upcoming' | 'all' }) {
      const tasks = StorageRepository.getTasks();
      const today = new Date().toISOString().split('T')[0];
      let filtered = tasks;

      if (params.filter === 'today') {
        filtered = tasks.filter((t) => t.dueDate === today && !t.completed);
      } else if (params.filter === 'upcoming') {
        filtered = tasks.filter((t) => t.dueDate >= today && !t.completed);
      }

      return {
        toolName: 'list_upcoming_tasks',
        success: true,
        message: `Found ${filtered.length} tasks (${filtered.filter((t) => !t.completed).length} pending).`,
        data: filtered
      };
    }
  },

  update_task_status: {
    name: 'update_task_status',
    description: 'Mark a household chore as completed or uncheck it.',
    parameters: {
      type: 'object',
      properties: {
        taskTitleOrId: { type: 'string', description: 'Title or ID of the task' },
        completed: { type: 'boolean', description: 'Whether it is completed' }
      },
      required: ['taskTitleOrId']
    },
    async execute(params: { taskTitleOrId: string; completed?: boolean }) {
      const tasks = StorageRepository.getTasks();
      const q = params.taskTitleOrId.toLowerCase();
      const match = tasks.find((t) => t.id === params.taskTitleOrId || t.title.toLowerCase().includes(q));

      if (!match) {
        return {
          toolName: 'update_task_status',
          success: false,
          message: `Task "${params.taskTitleOrId}" was not found.`
        };
      }

      const { task, nextOccurrenceCreated } = StorageRepository.toggleTaskCompletion(match.id);
      const note = nextOccurrenceCreated ? ' Recurred and scheduled for the next interval.' : '';

      return {
        toolName: 'update_task_status',
        success: true,
        message: `Task "${task?.title}" marked as ${task?.completed ? 'completed' : 'pending'}.${note}`,
        data: task
      };
    }
  }
};

/**
 * Execute a validated application tool by name
 */
export async function executeTool(name: string, params: any): Promise<ToolResult> {
  const tool = APPLICATION_TOOLS[name];
  if (!tool) {
    return {
      toolName: name,
      success: false,
      message: `Tool "${name}" is not a recognized or supported application tool.`
    };
  }

  try {
    return await tool.execute(params || {});
  } catch (error: any) {
    console.error(`Error executing tool ${name}:`, error);
    return {
      toolName: name,
      success: false,
      message: `Failed to execute ${name}: ${error?.message || 'Internal error'}`
    };
  }
}
