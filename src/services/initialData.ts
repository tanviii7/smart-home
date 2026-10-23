import {
  Room,
  Device,
  Scene,
  Recipe,
  MealPlan,
  ShoppingListItem,
  PantryItem,
  HouseholdTask,
  AppSettings,
  HouseholdMember
} from '../types';

export const INITIAL_ROOMS: Room[] = [
  { id: 'living_room', name: 'Living Room', icon: 'Sofa', floor: 'Main Floor' },
  { id: 'kitchen', name: 'Kitchen', icon: 'Utensils', floor: 'Main Floor' },
  { id: 'master_bedroom', name: 'Master Bedroom', icon: 'BedDouble', floor: 'Second Floor' },
  { id: 'bathroom', name: 'Bathroom', icon: 'Bath', floor: 'Main Floor' },
  { id: 'dining_room', name: 'Dining Room', icon: 'Coffee', floor: 'Main Floor' },
  { id: 'patio', name: 'Patio & Porch', icon: 'Sun', floor: 'Outdoor' }
];

export const INITIAL_DEVICES: Device[] = [
  {
    id: 'dev_lr_main',
    name: 'Living Room Ceiling Pendant',
    room: 'Living Room',
    category: 'lighting',
    isSimulated: true,
    isFavorite: true,
    state: {
      power: true,
      brightness: 75,
      colorTemp: 2700,
      color: '#F4E1D7'
    },
    modelInfo: 'Simulated Warm LED Driver (Matter/Demo)',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'dev_lr_lamp',
    name: 'Reading Floor Lamp',
    room: 'Living Room',
    category: 'lighting',
    isSimulated: true,
    isFavorite: false,
    state: {
      power: true,
      brightness: 40,
      colorTemp: 2400
    },
    modelInfo: 'Simulated Dimmable Lamp',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'dev_lr_fan',
    name: 'Living Room Ceiling Fan',
    room: 'Living Room',
    category: 'climate',
    isSimulated: true,
    isFavorite: true,
    state: {
      power: true,
      fanSpeed: 'low'
    },
    modelInfo: 'Simulated 3-Speed Quiet Fan',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'dev_lr_tv',
    name: 'Living Room Smart OLED TV',
    room: 'Living Room',
    category: 'entertainment',
    isSimulated: true,
    isFavorite: true,
    state: {
      power: false,
      volume: 24,
      input: 'Apple TV / HDMI 1'
    },
    modelInfo: 'Simulated 65" 4K Smart Display',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'dev_kitchen_ambient',
    name: 'Under-Cabinet Ambient Lights',
    room: 'Kitchen',
    category: 'lighting',
    isSimulated: true,
    isFavorite: true,
    state: {
      power: true,
      brightness: 90,
      colorTemp: 3500
    },
    modelInfo: 'Simulated Warm White LED Strip',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'dev_kitchen_coffee',
    name: 'Espresso Bar Smart Plug',
    room: 'Kitchen',
    category: 'appliance',
    isSimulated: true,
    isFavorite: true,
    state: {
      power: false
    },
    modelInfo: 'Simulated 15A Smart Energy Plug',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'dev_mbr_light',
    name: 'Bedroom Sconces',
    room: 'Master Bedroom',
    category: 'lighting',
    isSimulated: true,
    isFavorite: false,
    state: {
      power: false,
      brightness: 20,
      colorTemp: 2200
    },
    modelInfo: 'Simulated Dual Dimmable Sconce',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'dev_mbr_thermostat',
    name: 'Whole Home Smart Thermostat',
    room: 'Master Bedroom',
    category: 'climate',
    isSimulated: true,
    isFavorite: true,
    state: {
      power: true,
      temperature: 71,
      targetTemperature: 70,
      mode: 'cool'
    },
    modelInfo: 'Simulated Multi-Zone Heat Pump/AC',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'dev_bath_mirror',
    name: 'Vanity Mirror Halo Light',
    room: 'Bathroom',
    category: 'lighting',
    isSimulated: true,
    isFavorite: false,
    state: {
      power: false,
      brightness: 80,
      colorTemp: 4000
    },
    modelInfo: 'Simulated Backlit Vanity Mirror',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'dev_patio_lights',
    name: 'Patio Bistro String Lights',
    room: 'Patio & Porch',
    category: 'lighting',
    isSimulated: true,
    isFavorite: false,
    state: {
      power: true,
      brightness: 60,
      colorTemp: 2200
    },
    modelInfo: 'Simulated Weatherproof Outdoor Filament',
    lastUpdated: new Date().toISOString()
  }
];

export const INITIAL_SCENES: Scene[] = [
  {
    id: 'scene_morning',
    name: 'Morning Routine',
    description: 'Soft warm light, starts the coffee bar, sets cozy ambient climate.',
    icon: 'Sunrise',
    category: 'Daily',
    actions: [
      { deviceId: 'dev_lr_main', targetState: { power: true, brightness: 80, colorTemp: 3200 } },
      { deviceId: 'dev_kitchen_ambient', targetState: { power: true, brightness: 90 } },
      { deviceId: 'dev_kitchen_coffee', targetState: { power: true } },
      { deviceId: 'dev_mbr_thermostat', targetState: { targetTemperature: 71, mode: 'auto' } },
      { deviceId: 'dev_lr_fan', targetState: { power: false } }
    ],
    lastActivated: 'Today, 7:15 AM'
  },
  {
    id: 'scene_relax',
    name: 'Relax & Unwind',
    description: 'Dimmable ambient lighting in peach tones, gentle breeze, TV off.',
    icon: 'Feather',
    category: 'Comfort',
    actions: [
      { deviceId: 'dev_lr_main', targetState: { power: true, brightness: 25, colorTemp: 2200, color: '#F4E1D7' } },
      { deviceId: 'dev_lr_lamp', targetState: { power: true, brightness: 35 } },
      { deviceId: 'dev_kitchen_ambient', targetState: { power: false } },
      { deviceId: 'dev_lr_tv', targetState: { power: false } },
      { deviceId: 'dev_lr_fan', targetState: { power: true, fanSpeed: 'low' } }
    ],
    lastActivated: 'Yesterday, 8:30 PM'
  },
  {
    id: 'scene_movie',
    name: 'Movie Night',
    description: 'Cinematic lighting, powers on OLED display, turns off glare.',
    icon: 'Film',
    category: 'Entertainment',
    actions: [
      { deviceId: 'dev_lr_main', targetState: { power: false } },
      { deviceId: 'dev_lr_lamp', targetState: { power: true, brightness: 10, colorTemp: 2000 } },
      { deviceId: 'dev_kitchen_ambient', targetState: { power: false } },
      { deviceId: 'dev_lr_tv', targetState: { power: true, volume: 28, input: 'Apple TV / HDMI 1' } }
    ],
    lastActivated: '3 days ago'
  },
  {
    id: 'scene_away',
    name: 'Away Mode',
    description: 'Turns off all indoor lighting, cuts coffee plug power, switches thermostat to eco.',
    icon: 'ShieldCheck',
    category: 'Efficiency',
    actions: [
      { deviceId: 'dev_lr_main', targetState: { power: false } },
      { deviceId: 'dev_lr_lamp', targetState: { power: false } },
      { deviceId: 'dev_lr_fan', targetState: { power: false } },
      { deviceId: 'dev_lr_tv', targetState: { power: false } },
      { deviceId: 'dev_kitchen_ambient', targetState: { power: false } },
      { deviceId: 'dev_kitchen_coffee', targetState: { power: false } },
      { deviceId: 'dev_mbr_light', targetState: { power: false } },
      { deviceId: 'dev_bath_mirror', targetState: { power: false } },
      { deviceId: 'dev_patio_lights', targetState: { power: false } },
      { deviceId: 'dev_mbr_thermostat', targetState: { targetTemperature: 76, mode: 'cool' } }
    ]
  },
  {
    id: 'scene_goodnight',
    name: 'Good Night',
    description: 'Turns off household lights, dims porch to 20%, sets bedroom cool sleep temperature.',
    icon: 'Moon',
    category: 'Sleep',
    actions: [
      { deviceId: 'dev_lr_main', targetState: { power: false } },
      { deviceId: 'dev_lr_lamp', targetState: { power: false } },
      { deviceId: 'dev_lr_fan', targetState: { power: false } },
      { deviceId: 'dev_lr_tv', targetState: { power: false } },
      { deviceId: 'dev_kitchen_ambient', targetState: { power: false } },
      { deviceId: 'dev_kitchen_coffee', targetState: { power: false } },
      { deviceId: 'dev_mbr_light', targetState: { power: false } },
      { deviceId: 'dev_bath_mirror', targetState: { power: false } },
      { deviceId: 'dev_patio_lights', targetState: { power: true, brightness: 20 } },
      { deviceId: 'dev_mbr_thermostat', targetState: { targetTemperature: 68, mode: 'cool' } }
    ]
  }
];

export const INITIAL_RECIPES: Record<string, Recipe> = {
  penne: {
    id: 'rec_penne',
    title: 'Rustic Garlic-Herb Penne with San Marzano Sauce',
    description: 'Comforting 30-minute family pasta with rich garlic-simmered crushed tomatoes, olive oil, and herbs.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    servings: 4,
    dietaryTags: ['Vegetarian', 'Mediterranean'],
    cuisine: 'Italian-Inspired',
    ingredients: [
      { name: 'Penne Rigate Pasta', quantity: '500g', category: 'Grains & Bakery' },
      { name: 'Crushed San Marzano Tomatoes', quantity: '2 cans (800g)', category: 'Pantry Staples' },
      { name: 'Extra Virgin Olive Oil', quantity: '3 tbsp', category: 'Pantry Staples' },
      { name: 'Fresh Garlic Cloves', quantity: '4 cloves, sliced', category: 'Fruits & Vegetables' },
      { name: 'Fresh Basil or Dried Oregano', quantity: '1 generous bunch', category: 'Fruits & Vegetables' },
      { name: 'Grated Parmesan or Mozzarella', quantity: '80g', category: 'Dairy' }
    ],
    instructions: [
      'Bring a large pot of salted water to a rolling boil and cook the penne until al dente (approx 10 mins).',
      'In a wide skillet, heat the olive oil over medium-low heat. Add sliced garlic and gently sizzle until golden and fragrant (do not burn).',
      'Pour in crushed tomatoes, oregano, salt, and black pepper. Simmer gently for 12-15 minutes until thickened.',
      'Toss drained pasta directly into the sauce. Finish with fresh basil and shredded cheese before serving.'
    ]
  },
  grain_bowl: {
    id: 'rec_grain_bowl',
    title: 'Warm Quinoa & Roasted Veggie Harvest Bowl',
    description: 'Nourishing bowl with fluffy quinoa, honey-roasted sweet potatoes, chickpeas, and lemon tahini drizzle.',
    prepTimeMinutes: 15,
    cookTimeMinutes: 25,
    servings: 4,
    dietaryTags: ['Vegetarian', 'High-Protein', 'Gluten-Free'],
    cuisine: 'Mediterranean',
    ingredients: [
      { name: 'White or Tri-Color Quinoa', quantity: '1.5 cups', category: 'Grains & Bakery' },
      { name: 'Sweet Potatoes', quantity: '2 medium, cubed', category: 'Fruits & Vegetables' },
      { name: 'Canned Chickpeas', quantity: '1 can (400g), rinsed', category: 'Pantry Staples' },
      { name: 'Baby Spinach or Arugula', quantity: '4 cups', category: 'Fruits & Vegetables' },
      { name: 'Tahini', quantity: '4 tbsp', category: 'Pantry Staples' },
      { name: 'Lemon', quantity: '1 large (juiced)', category: 'Fruits & Vegetables' }
    ],
    instructions: [
      'Preheat oven to 400°F (200°C). Toss diced sweet potatoes and drained chickpeas with olive oil, cumin, and salt.',
      'Roast for 22-25 minutes until tender and caramelized at edges.',
      'Cook quinoa with vegetable broth or water (ratio 1:2) until water is absorbed and fluffy.',
      'Whisk tahini, lemon juice, 2 tbsp warm water, and a pinch of garlic powder into a creamy dressing.',
      'Assemble bowls: spinach base, quinoa, roasted vegetables, and tahini drizzle.'
    ]
  },
  salmon: {
    id: 'rec_salmon',
    title: 'Pan-Seared Lemon Herb Salmon with Asparagus',
    description: 'Crisp, flaky wild salmon fillets finished with fresh dill, lemon zest, and tender garlic-butter asparagus.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 4,
    dietaryTags: ['High-Protein', 'Gluten-Free', 'Mediterranean'],
    cuisine: 'Coastal Living',
    ingredients: [
      { name: 'Fresh Salmon Fillets', quantity: '4 fillets (600g)', category: 'Other' },
      { name: 'Fresh Asparagus', quantity: '1 bunch, trimmed', category: 'Fruits & Vegetables' },
      { name: 'Unsalted Butter or Olive Oil', quantity: '2 tbsp', category: 'Dairy' },
      { name: 'Lemons', quantity: '2 whole', category: 'Fruits & Vegetables' },
      { name: 'Fresh Dill', quantity: '3 sprigs, chopped', category: 'Fruits & Vegetables' }
    ],
    instructions: [
      'Pat salmon dry with paper towels; season both sides with sea salt and freshly cracked pepper.',
      'Heat oil in a heavy stainless steel or cast iron skillet over medium-high heat until shimmering.',
      'Place salmon skin-side down; sear undisturbed for 5 minutes until crispy. Flip and cook for 3-4 minutes.',
      'Push salmon to one side, add butter, garlic, and asparagus spears. Sauté asparagus until vibrant green and tender-crisp.',
      'Squeeze fresh lemon over the pan and garnish with fresh dill.'
    ]
  },
  avocado_toast: {
    id: 'rec_avocado_toast',
    title: 'Artisan Sourdough Avocado Toast with Poached Eggs',
    description: 'Toasted country sourdough with creamy mashed avocado, soft poached eggs, microgreens, and chili flakes.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 5,
    servings: 2,
    dietaryTags: ['Vegetarian', 'High-Protein'],
    cuisine: 'Breakfast & Brunch',
    ingredients: [
      { name: 'Artisan Sourdough Bread', quantity: '4 thick slices', category: 'Grains & Bakery' },
      { name: 'Ripe Avocados', quantity: '2 large', category: 'Fruits & Vegetables' },
      { name: 'Pasture-Raised Eggs', quantity: '4 eggs', category: 'Dairy' },
      { name: 'Red Pepper Chili Flakes', quantity: '1 pinch', category: 'Pantry Staples' },
      { name: 'Microgreens or Sprouts', quantity: '1 handful', category: 'Fruits & Vegetables' }
    ],
    instructions: [
      'Toast sourdough bread slices until golden brown and crusty.',
      'In a bowl, coarsely mash avocado with lemon juice, salt, and pepper.',
      'Poach or soft-fry the eggs in gentle boiling water with a splash of vinegar.',
      'Spread avocado generously on toasted bread, top each slice with an egg, and dust with chili flakes and microgreens.'
    ]
  },
  smoothie_bowl: {
    id: 'rec_smoothie_bowl',
    title: 'Wild Berry & Chia Superfood Smoothie Bowl',
    description: 'Thick blended acai and wild blueberries topped with toasted almonds, chia seeds, and sliced banana.',
    prepTimeMinutes: 8,
    cookTimeMinutes: 0,
    servings: 2,
    dietaryTags: ['Vegetarian', 'Vegan', 'Gluten-Free'],
    cuisine: 'Breakfast & Refreshment',
    ingredients: [
      { name: 'Frozen Wild Berries', quantity: '2 cups', category: 'Fruits & Vegetables' },
      { name: 'Bananas', quantity: '2 medium (1 frozen)', category: 'Fruits & Vegetables' },
      { name: 'Almond Milk or Oat Milk', quantity: '1/2 cup', category: 'Dairy' },
      { name: 'Chia Seeds', quantity: '2 tbsp', category: 'Pantry Staples' },
      { name: 'Sliced Almonds', quantity: '3 tbsp, toasted', category: 'Snacks' }
    ],
    instructions: [
      'Add frozen berries, frozen banana, and splash of milk to a high-speed blender.',
      'Blend using tamper until thick like soft-serve ice cream.',
      'Spoon into chilled bowls and arrange fresh banana slices, chia seeds, and crunchy almonds across the top.'
    ]
  },
  chickpea_curry: {
    id: 'rec_chickpea_curry',
    title: 'Golden Coconut Chickpea & Spinach Curry',
    description: 'Fragrant turmeric and ginger coconut stew served over steamed basmati rice with warm naan.',
    prepTimeMinutes: 12,
    cookTimeMinutes: 20,
    servings: 4,
    dietaryTags: ['Vegetarian', 'Vegan', 'Gluten-Free'],
    cuisine: 'South Asian-Inspired',
    ingredients: [
      { name: 'Canned Coconut Milk', quantity: '1 can (400ml)', category: 'Pantry Staples' },
      { name: 'Canned Chickpeas', quantity: '2 cans, rinsed', category: 'Pantry Staples' },
      { name: 'Fresh Baby Spinach', quantity: '3 cups', category: 'Fruits & Vegetables' },
      { name: 'Ground Turmeric & Garam Masala', quantity: '2 tsp', category: 'Pantry Staples' },
      { name: 'Basmati Rice', quantity: '2 cups dry', category: 'Grains & Bakery' }
    ],
    instructions: [
      'Sauté diced onion, minced ginger, and garlic in a deep pot until translucent.',
      'Add turmeric, cumin, and garam masala, stirring for 60 seconds until fragrant.',
      'Pour in full-fat coconut milk and drained chickpeas. Simmer uncovered for 15 minutes.',
      'Fold in baby spinach until wilted. Serve hot over steamed fluffy basmati rice.'
    ]
  }
};

export const INITIAL_MEAL_PLAN: MealPlan = {
  id: 'current_week_plan',
  startDate: new Date().toISOString(),
  days: [
    {
      dayOfWeek: 'Monday',
      dateStr: 'Oct 23',
      meals: {
        breakfast: INITIAL_RECIPES.avocado_toast,
        lunch: INITIAL_RECIPES.grain_bowl,
        dinner: INITIAL_RECIPES.penne,
        snack: INITIAL_RECIPES.smoothie_bowl
      }
    },
    {
      dayOfWeek: 'Tuesday',
      dateStr: 'Oct 24',
      meals: {
        breakfast: INITIAL_RECIPES.smoothie_bowl,
        lunch: INITIAL_RECIPES.penne,
        dinner: INITIAL_RECIPES.salmon,
        snack: undefined
      }
    },
    {
      dayOfWeek: 'Wednesday',
      dateStr: 'Oct 25',
      meals: {
        breakfast: INITIAL_RECIPES.avocado_toast,
        lunch: INITIAL_RECIPES.salmon,
        dinner: INITIAL_RECIPES.chickpea_curry,
        snack: INITIAL_RECIPES.smoothie_bowl
      }
    },
    {
      dayOfWeek: 'Thursday',
      dateStr: 'Oct 26',
      meals: {
        breakfast: INITIAL_RECIPES.smoothie_bowl,
        lunch: INITIAL_RECIPES.chickpea_curry,
        dinner: INITIAL_RECIPES.grain_bowl,
        snack: undefined
      }
    },
    {
      dayOfWeek: 'Friday',
      dateStr: 'Oct 27',
      meals: {
        breakfast: INITIAL_RECIPES.avocado_toast,
        lunch: INITIAL_RECIPES.grain_bowl,
        dinner: INITIAL_RECIPES.penne,
        snack: INITIAL_RECIPES.smoothie_bowl
      }
    },
    {
      dayOfWeek: 'Saturday',
      dateStr: 'Oct 28',
      meals: {
        breakfast: INITIAL_RECIPES.avocado_toast,
        lunch: INITIAL_RECIPES.smoothie_bowl,
        dinner: INITIAL_RECIPES.salmon,
        snack: undefined
      }
    },
    {
      dayOfWeek: 'Sunday',
      dateStr: 'Oct 29',
      meals: {
        breakfast: INITIAL_RECIPES.smoothie_bowl,
        lunch: INITIAL_RECIPES.grain_bowl,
        dinner: INITIAL_RECIPES.chickpea_curry,
        snack: INITIAL_RECIPES.avocado_toast
      }
    }
  ]
};

export const INITIAL_SHOPPING_ITEMS: ShoppingListItem[] = [
  {
    id: 'shop_1',
    name: 'Penne Rigate Pasta',
    quantity: '500g',
    category: 'Grains & Bakery',
    completed: false,
    addedFromRecipe: 'Rustic Garlic-Herb Penne',
    createdAt: new Date().toISOString()
  },
  {
    id: 'shop_2',
    name: 'Fresh Basil or Oregano',
    quantity: '1 bunch',
    category: 'Fruits & Vegetables',
    completed: false,
    addedFromRecipe: 'Rustic Garlic-Herb Penne',
    createdAt: new Date().toISOString()
  },
  {
    id: 'shop_3',
    name: 'Almond Milk (Unsweetened)',
    quantity: '1 carton (1L)',
    category: 'Dairy',
    completed: true,
    notes: 'For morning smoothie bowls',
    createdAt: new Date().toISOString()
  },
  {
    id: 'shop_4',
    name: 'Wild Salmon Fillets',
    quantity: '4 fillets (600g)',
    category: 'Other',
    completed: false,
    addedFromRecipe: 'Pan-Seared Lemon Herb Salmon',
    createdAt: new Date().toISOString()
  },
  {
    id: 'shop_5',
    name: 'Sourdough Country Loaf',
    quantity: '1 fresh loaf',
    category: 'Grains & Bakery',
    completed: false,
    notes: 'Bakery counter',
    createdAt: new Date().toISOString()
  },
  {
    id: 'shop_6',
    name: 'Lemons',
    quantity: '4 whole',
    category: 'Fruits & Vegetables',
    completed: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'shop_7',
    name: 'Eco Dish Soap & Scrubbers',
    quantity: '1 refill bottle',
    category: 'Cleaning Supplies',
    completed: false,
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_PANTRY_ITEMS: PantryItem[] = [
  {
    id: 'pantry_1',
    name: 'Crushed San Marzano Tomatoes',
    quantity: '2 cans (800g)',
    category: 'Pantry Staples',
    status: 'In Stock',
    notes: 'Aisle 3 Italian staples',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pantry_2',
    name: 'Extra Virgin Olive Oil',
    quantity: '750ml bottle (70% full)',
    category: 'Pantry Staples',
    status: 'In Stock',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pantry_3',
    name: 'Fresh Garlic Bulbs',
    quantity: '3 whole heads',
    category: 'Fruits & Vegetables',
    status: 'In Stock',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pantry_4',
    name: 'Shredded Mozzarella',
    quantity: '50g remaining',
    category: 'Dairy',
    status: 'Low Stock',
    notes: 'Running low — need for pasta',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pantry_5',
    name: 'Tri-Color Quinoa',
    quantity: '1 full jar (1kg)',
    category: 'Grains & Bakery',
    status: 'In Stock',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pantry_6',
    name: 'Organic Chia Seeds',
    quantity: '250g bag',
    category: 'Pantry Staples',
    status: 'In Stock',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pantry_7',
    name: 'Pasture-Raised Eggs',
    quantity: '2 eggs left',
    category: 'Dairy',
    status: 'Low Stock',
    notes: 'Restock before weekend breakfast',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pantry_8',
    name: 'Ground Turmeric & Garam Masala',
    quantity: 'Half jar',
    category: 'Pantry Staples',
    status: 'In Stock',
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_TASKS: HouseholdTask[] = [
  {
    id: 'task_1',
    title: 'Clean kitchen countertops and run dishwasher',
    description: 'Wipe down quartz surfaces and load evening dishes.',
    category: 'Kitchen',
    priority: 'Medium',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '20:30',
    recurrence: 'daily',
    completed: false,
    assignedTo: 'Sam',
    createdAt: new Date().toISOString()
  },
  {
    id: 'task_2',
    title: 'Water the living room fiddle leaf fig & monstera',
    description: 'Check soil moisture before watering with room-temp water.',
    category: 'Plants',
    priority: 'Low',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '18:00',
    recurrence: 'weekly',
    completed: true,
    completedAt: 'Today, 4:10 PM',
    assignedTo: 'Alex',
    createdAt: new Date().toISOString()
  },
  {
    id: 'task_3',
    title: 'Check pantry staples & review weekend groceries',
    description: 'Cross-reference low-stock items with meal plan.',
    category: 'Chore' as any,
    priority: 'Medium',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    dueTime: '11:00',
    recurrence: 'weekly',
    completed: false,
    assignedTo: 'Alex',
    createdAt: new Date().toISOString()
  },
  {
    id: 'task_4',
    title: 'Change master bedroom linens & pillowcases',
    description: 'Fresh linen sheets and duvet cover.',
    category: 'Laundry',
    priority: 'Medium',
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    dueTime: '10:00',
    recurrence: 'weekly',
    completed: false,
    assignedTo: 'Maya',
    createdAt: new Date().toISOString()
  },
  {
    id: 'task_5',
    title: 'Deep clean upstairs bathroom mirrors and vanity',
    description: 'Glass cleaner and fresh hand towels.',
    category: 'Cleaning',
    priority: 'Low',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    recurrence: 'monthly',
    completed: false,
    assignedTo: 'Sam',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_MEMBERS: HouseholdMember[] = [
  { id: 'm1', name: 'Alex', role: 'Household Organizer', avatar: '👨‍💼', specialty: 'Groceries & Prep' },
  { id: 'm2', name: 'Sam', role: 'Family Chef', avatar: '👩‍🍳', specialty: 'Dinner Lead' },
  { id: 'm3', name: 'Maya', role: 'Student', avatar: '👧', specialty: 'Table & Linens' },
  { id: 'm4', name: 'Jordan', role: 'Junior Member', avatar: '👦', specialty: 'Plants & Recycling' }
];

export const INITIAL_SETTINGS: AppSettings = {
  householdName: 'The Miller Residence',
  temperatureUnit: '°F',
  defaultServings: 4,
  dietaryPreferences: ['Vegetarian', 'Mediterranean'],
  aiProvider: 'local',
  geminiApiKey: '',
  deviceIntegrationMode: 'simulated',
  ambientGreetingEnabled: true,
  voiceSoundsEnabled: false
};
