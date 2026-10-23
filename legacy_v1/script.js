/**
 * ============================================================================
 * HomeFlow 2.1 — Cozy Household Planning & Coordination Agent
 * Integrations, Quick Assistant, and Responsive UX Architecture
 * ============================================================================
 * 
 * Architecture Overview:
 * 1. Seeded Household Data (Pantry, Calendar, Members)
 * 2. Delivery Service Integration Adapter (Configurable external handoffs)
 * 3. Persistent State Manager (localStorage with fallback error handling)
 * 4. Discrete Agent Tool Functions:
 *    - getPantry()
 *    - updatePantry(items)
 *    - getCalendar()
 *    - updateCalendar(newTime)
 *    - getShoppingList()
 *    - updateShoppingList(items)
 *    - confirmPurchasedItems(itemIds)
 *    - getHouseholdMembers()
 *    - getTasks()
 *    - assignTask(task)
 *    - saveDinnerPlan(plan)
 *    - deliveryHandoff(serviceId, items)
 * 5. Deterministic Word-Boundary Intent Router (Dinner, Groceries, Handoff, Tasks, Diet, Schedule)
 * 6. Multi-Step Agent Workflows
 * 7. Unified UI Renderers & Event Handlers (Hero Recipe, Shopping, Handoff, Tasks, Quick Assistant Drawer)
 */

'use strict';

/* ==========================================================================
   1. Seeded Household Data (Fictional Miller Household)
   ========================================================================== */

const SEEDED_PANTRY = [
  { id: 'p1', name: 'Penne Rigate Pasta', quantity: '500g', status: 'In Stock', category: 'Pantry' },
  { id: 'p2', name: 'Crushed San Marzano Tomatoes', quantity: '2 cans (800g)', status: 'In Stock', category: 'Pantry' },
  { id: 'p3', name: 'Extra Virgin Olive Oil', quantity: '750ml bottle', status: 'In Stock', category: 'Pantry' },
  { id: 'p4', name: 'Fresh Garlic Bulbs', quantity: '3 heads', status: 'In Stock', category: 'Produce' },
  { id: 'p5', name: 'Yellow Onions', quantity: '4 medium', status: 'In Stock', category: 'Produce' },
  { id: 'p6', name: 'Dried Oregano & Red Pepper', quantity: 'Full spice jar', status: 'In Stock', category: 'Spices' },
  { id: 'p7', name: 'Kosher Salt & Peppercorns', quantity: 'Full grinder', status: 'In Stock', category: 'Spices' },
  { id: 'p8', name: 'Shredded Mozzarella', quantity: '50g (Very Low)', status: 'Low Stock', category: 'Dairy' }
];

const SEEDED_CALENDAR = [
  { time: '5:30 PM', person: 'Alex', event: 'Leaves office & commutes home' },
  { time: '6:00 PM', person: 'Jordan', event: 'Finishing school homework' },
  { time: '6:30 PM', person: 'Maya', event: 'Returns home from soccer practice (hungry)' },
  { time: '7:15 PM', person: 'All Family', event: 'Target Family Dinner Time (< 45 min prep window)' }
];

const SEEDED_MEMBERS = [
  { id: 'm1', name: 'Alex', role: 'Adult (Home at 5:45 PM)', specialty: 'Prep & Knife skills', avatar: '👨‍💼' },
  { id: 'm2', name: 'Sam', role: 'Adult (Cooking lead)', specialty: 'Stovetop & Simmering', avatar: '👩‍🍳' },
  { id: 'm3', name: 'Maya', role: 'Teen (Home at 6:30 PM)', specialty: 'Table setting & Bread warming', avatar: '👧' },
  { id: 'm4', name: 'Jordan', role: 'Child (Home at 6:00 PM)', specialty: 'Drinks, Napkins & Light chores', avatar: '👦' }
];

/* ==========================================================================
   2. Configurable External Delivery Services Adapter (Feature A & C)
   ========================================================================== */

const INTEGRATION_SERVICES = [
  {
    id: 'amazon_fresh',
    name: 'Amazon Fresh / Whole Foods',
    category: 'Groceries & Fresh Produce',
    url: 'https://www.amazon.com/alm/storefront?almBrandId=QW1hem9uIEZyZXNo',
    status: 'external_handoff',
    statusLabel: 'Manual Handoff (Official Web)',
    description: 'Copies your organized shopping list to clipboard and opens the Amazon Fresh storefront so you can paste or add items to your cart.',
    notes: 'No live cart API. Complete checkout on Amazon Fresh.'
  },
  {
    id: 'instacart',
    name: 'Instacart',
    category: 'Local Supermarket Delivery',
    url: 'https://www.instacart.com',
    status: 'external_handoff',
    statusLabel: 'Manual Handoff (Official Web)',
    description: 'Copies your categorized shopping list and opens Instacart to choose your local store (Aldi, Wegmans, Safeway, etc.).',
    notes: 'Direct cart injection is not connected. User completes checkout on Instacart.'
  },
  {
    id: 'target',
    name: 'Target (Shipt Delivery)',
    category: 'Household & Pantry Staples',
    url: 'https://www.target.com/c/grocery/-/N-5xt1a',
    status: 'external_handoff',
    statusLabel: 'Manual Handoff (Official Web)',
    description: 'Copies your list and opens Target Grocery for local store pickup or same-day Shipt delivery.',
    notes: 'External redirect. No direct cart pre-population.'
  },
  {
    id: 'walmart',
    name: 'Walmart Grocery',
    category: 'Pantry & Everyday Essentials',
    url: 'https://www.walmart.com/cp/food/976759',
    status: 'external_handoff',
    statusLabel: 'Manual Handoff (Official Web)',
    description: 'Copies your formatted list and opens Walmart Food & Grocery for curbside pickup or home delivery.',
    notes: 'External redirect. Checkout completed on Walmart.'
  },
  {
    id: 'direct_cart_api',
    name: 'Direct Smart Cart Sync',
    category: 'Automated Checkout Protocol',
    url: '',
    status: 'not_connected',
    statusLabel: 'Not Connected',
    description: 'Direct API cart population requires merchant partner OAuth authorization.',
    notes: 'Not connected. HomeFlow uses manual clipboard handoff instead.'
  }
];

const DEFAULT_INITIAL_STATE = {
  pantry: JSON.parse(JSON.stringify(SEEDED_PANTRY)),
  calendar: JSON.parse(JSON.stringify(SEEDED_CALENDAR)),
  dinnerPlan: {
    name: 'No Active Dinner Plan',
    status: 'unplanned',
    prepTime: '--',
    servings: 4,
    description: 'HomeFlow has not formulated tonight\'s meal yet. Ask: "Plan a simple dinner for four tonight and check what\'s missing."',
    ingredientsHave: ['Pantry items ready'],
    ingredientsMissing: [],
    calendarNotes: 'Awaiting planning trigger'
  },
  shoppingList: [
    { id: 's1', name: 'Organic Whole Milk', category: 'Dairy & Refrigerated', quantity: '1 Gallon', estimatedCost: 4.29, relatedMeal: 'Weekly Breakfast & Restock', purchased: false, selectedForHandoff: true, addedBy: 'Auto-routine' },
    { id: 's2', name: 'Ripe Bananas', category: 'Produce', quantity: '1 Bunch', estimatedCost: 1.89, relatedMeal: 'After-school Snacks', purchased: true, selectedForHandoff: false, addedBy: 'Sam' },
    { id: 's3', name: 'Pasture-Raised Eggs', category: 'Dairy & Refrigerated', quantity: '1 Dozen', estimatedCost: 4.99, relatedMeal: 'Weekend Brunch', purchased: false, selectedForHandoff: true, addedBy: 'Auto-routine' }
  ],
  tasks: [],
  activityLog: [],
  chatHistory: [
    {
      sender: 'agent',
      text: 'Good evening! I am **HomeFlow**, your household coordination helper. Let me know what you would like to plan or organize for tonight.',
      timestamp: formatTime(new Date()),
      workflowCard: null
    }
  ]
};

const STORAGE_KEY = 'homeflow_household_state_v1';

/* ==========================================================================
   3. State Management with LocalStorage
   ========================================================================== */

let appState = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_INITIAL_STATE));
    const parsed = JSON.parse(raw);
    
    return {
      pantry: Array.isArray(parsed.pantry) && parsed.pantry.length > 0 
        ? parsed.pantry 
        : JSON.parse(JSON.stringify(SEEDED_PANTRY)),
      calendar: Array.isArray(parsed.calendar) && parsed.calendar.length > 0
        ? parsed.calendar
        : JSON.parse(JSON.stringify(SEEDED_CALENDAR)),
      dinnerPlan: parsed.dinnerPlan || DEFAULT_INITIAL_STATE.dinnerPlan,
      shoppingList: Array.isArray(parsed.shoppingList) ? parsed.shoppingList : DEFAULT_INITIAL_STATE.shoppingList,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : DEFAULT_INITIAL_STATE.tasks,
      activityLog: Array.isArray(parsed.activityLog) ? parsed.activityLog : [],
      chatHistory: Array.isArray(parsed.chatHistory) ? parsed.chatHistory : DEFAULT_INITIAL_STATE.chatHistory
    };
  } catch (err) {
    console.warn('[HomeFlow] Error reading localStorage, resetting to defaults:', err);
    return JSON.parse(JSON.stringify(DEFAULT_INITIAL_STATE));
  }
}

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    updateSyncIndicator(true);
  } catch (err) {
    console.error('[HomeFlow] Failed to write state to localStorage:', err);
    showToast('Failed to save state to localStorage', 'error');
  }
}

function resetToSeedData() {
  appState = JSON.parse(JSON.stringify(DEFAULT_INITIAL_STATE));
  appState.activityLog.push({
    timestamp: formatTime(new Date()),
    tool: 'systemReset',
    params: { action: 'restore_defaults' },
    result: 'All household data restored to initial demo seeds.',
    status: 'success'
  });
  persistState();
  renderAll();
  showToast('HomeFlow demo data has been reset to defaults.');
}

/* ==========================================================================
   4. Discrete Agent Tool Functions
   ========================================================================== */

/**
 * Tool: getPantry()
 * Reads current inventory of pantry supplies from state.
 */
function getPantry() {
  const pantryItems = appState.pantry || SEEDED_PANTRY;
  logToolCall('getPantry', {}, `${pantryItems.length} inventory items in stock`);
  return JSON.parse(JSON.stringify(pantryItems));
}

/**
 * Tool: updatePantry(items)
 * Adds or restocks items into the household pantry state.
 */
function updatePantry(items) {
  if (!Array.isArray(items)) items = [items];
  if (!appState.pantry) appState.pantry = JSON.parse(JSON.stringify(SEEDED_PANTRY));

  let count = 0;
  items.forEach(item => {
    const existing = appState.pantry.find(
      p => p.name.toLowerCase().trim() === item.name.toLowerCase().trim()
    );
    if (existing) {
      existing.status = 'In Stock';
      existing.quantity = item.quantity || 'In Stock';
    } else {
      appState.pantry.push({
        id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name: item.name,
        quantity: item.quantity || '1 unit',
        status: 'In Stock',
        category: item.category || 'Pantry'
      });
    }
    count++;
  });

  persistState();
  renderSampleDataModal();
  logToolCall('updatePantry', { count }, `Restocked ${count} item(s) into household pantry`);
  return appState.pantry;
}

/**
 * Tool: getCalendar()
 * Reads tonight's household calendar events and deadlines.
 */
function getCalendar() {
  const cal = appState.calendar || SEEDED_CALENDAR;
  logToolCall('getCalendar', { date: 'Tonight', householdId: 'miller-4' }, `Found Maya's 6:30 PM soccer return; target dinner at 7:15 PM`);
  return JSON.parse(JSON.stringify(cal));
}

/**
 * Tool: updateCalendar(updates)
 */
function updateCalendar(updates) {
  if (!appState.calendar) appState.calendar = JSON.parse(JSON.stringify(SEEDED_CALENDAR));
  if (updates.targetDinnerTime) {
    const dinnerEvent = appState.calendar.find(e => e.person.includes('Family') || e.event.includes('Dinner'));
    if (dinnerEvent) {
      dinnerEvent.time = updates.targetDinnerTime;
      dinnerEvent.event = `Adjusted Family Dinner Time (${updates.targetDinnerTime})`;
    }
  }
  persistState();
  renderSampleDataModal();
  logToolCall('updateCalendar', updates, `Adjusted dinner schedule to ${updates.targetDinnerTime || 'updated time'}`);
  return appState.calendar;
}

/**
 * Tool: getShoppingList()
 * Reads the active household shopping list items.
 */
function getShoppingList() {
  const count = appState.shoppingList.length;
  logToolCall('getShoppingList', {}, `${count} grocery items currently listed`);
  return JSON.parse(JSON.stringify(appState.shoppingList));
}

/**
 * Tool: updateShoppingList(newItems)
 */
function updateShoppingList(newItems) {
  if (!Array.isArray(newItems)) newItems = [newItems];
  
  let addedCount = 0;
  newItems.forEach(item => {
    const exists = appState.shoppingList.some(
      existing => existing.name.toLowerCase().trim() === item.name.toLowerCase().trim()
    );
    if (!exists) {
      appState.shoppingList.push({
        id: 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name: item.name,
        category: item.category || 'Pantry & Seasonings',
        quantity: item.quantity || '1 unit',
        estimatedCost: item.estimatedCost || 3.00,
        relatedMeal: item.relatedMeal || 'Tonight\'s Dinner',
        purchased: false,
        selectedForHandoff: true,
        addedBy: item.addedBy || 'HomeFlow Agent'
      });
      addedCount++;
    }
  });

  persistState();
  logToolCall('updateShoppingList', { newItemsCount: newItems.length }, `Added ${addedCount} missing ingredients to shopping list`);
  return appState.shoppingList;
}

/**
 * Tool: confirmPurchasedItems(itemIds)
 * Marks items as purchased, moves them to the pantry as "In Stock", and updates state.
 */
function confirmPurchasedItems(itemIds) {
  if (!itemIds || itemIds.length === 0) {
    showToast('Please select at least one item to confirm purchase.');
    return;
  }

  const purchasedItems = [];
  appState.shoppingList.forEach(item => {
    if (itemIds.includes(item.id)) {
      item.purchased = true;
      item.selectedForHandoff = false;
      purchasedItems.push(item);
    }
  });

  if (purchasedItems.length > 0) {
    updatePantry(purchasedItems);
    persistState();
    renderShoppingList();
    renderHandoffView();
    showToast(`Confirmed ${purchasedItems.length} item(s) purchased and added to pantry!`);
  }
}

/**
 * Tool: getHouseholdMembers()
 */
function getHouseholdMembers() {
  logToolCall('getHouseholdMembers', {}, `Loaded 4 family members (Alex, Sam, Maya, Jordan)`);
  return JSON.parse(JSON.stringify(SEEDED_MEMBERS));
}

/**
 * Tool: getTasks()
 */
function getTasks() {
  logToolCall('getTasks', {}, `${appState.tasks.length} active prep tasks retrieved`);
  return JSON.parse(JSON.stringify(appState.tasks));
}

/**
 * Tool: assignTask(task)
 */
function assignTask(task) {
  const existingIndex = appState.tasks.findIndex(
    t => t.title.toLowerCase().trim() === task.title.toLowerCase().trim()
  );

  if (existingIndex >= 0) {
    appState.tasks[existingIndex] = {
      ...appState.tasks[existingIndex],
      assignee: task.assignee,
      avatar: task.avatar || '👤',
      duration: task.duration || '15 min'
    };
    logToolCall('assignTask', { title: task.title, assignee: task.assignee }, `Updated assignment: "${task.title}" to ${task.assignee}`);
  } else {
    appState.tasks.push({
      id: 't_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      title: task.title,
      assignee: task.assignee,
      avatar: task.avatar || '👤',
      duration: task.duration || '15 min',
      completed: false
    });
    logToolCall('assignTask', { title: task.title, assignee: task.assignee }, `Assigned "${task.title}" to ${task.assignee}`);
  }

  persistState();
  return appState.tasks;
}

/**
 * Tool: saveDinnerPlan(plan)
 */
function saveDinnerPlan(plan) {
  appState.dinnerPlan = {
    name: plan.name,
    status: 'planned',
    prepTime: plan.prepTime || '35 mins',
    servings: plan.servings || 4,
    description: plan.description || '',
    ingredientsHave: plan.ingredientsHave || [],
    ingredientsMissing: plan.ingredientsMissing || [],
    calendarNotes: plan.calendarNotes || ''
  };

  persistState();
  logToolCall('saveDinnerPlan', { meal: plan.name, prepTime: plan.prepTime }, `Saved recipe plan: "${plan.name}" (Ready by 7:15 PM)`);
  return appState.dinnerPlan;
}

/**
 * Tool: deliveryHandoff(serviceId, selectedItems)
 */
function deliveryHandoff(serviceId, items) {
  const service = INTEGRATION_SERVICES.find(s => s.id === serviceId) || INTEGRATION_SERVICES[0];
  
  if (service.status === 'not_connected') {
    showToast(`${service.name} is not connected. Please choose a supported service.`, 'error');
    return false;
  }

  // Generate clipboard text
  const text = formatHandoffClipboardText(items);
  copyTextToClipboard(text);

  logToolCall('deliveryHandoff', { service: service.name, itemCount: items.length }, `Formatted & copied ${items.length} items for ${service.name}`);

  // Open external merchant storefront
  if (service.url) {
    window.open(service.url, '_blank', 'noopener,noreferrer');
  }

  showToast(`Copied ${items.length} items to clipboard & opening ${service.name}!`);
  return true;
}

/* ==========================================================================
   5. Tool Execution Logger
   ========================================================================== */

function logToolCall(toolName, params, resultSummary, status = 'success') {
  const cleanToolName = toolName.replace(/\(\)/g, '');
  const entry = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 3),
    timestamp: formatTime(new Date()),
    tool: cleanToolName,
    params: params,
    result: resultSummary,
    status: status
  };

  appState.activityLog.unshift(entry);
  if (appState.activityLog.length > 50) appState.activityLog.pop();
  
  renderActivityLog();
  updateToolCountBadge();
}

/* ==========================================================================
   6. Deterministic Word-Boundary Intent Router (Feature C)
   ========================================================================== */

function routeIntent(userInput) {
  const text = userInput.toLowerCase().trim();

  const matchesKeyword = (words) => {
    return words.some(word => {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|\\s|[^a-zA-Z0-9])${escaped}($|\\s|[^a-zA-Z0-9])`, 'i');
      return regex.test(text);
    });
  };

  // 1. Task Coordination
  const taskKeywords = [
    'divide', 'task', 'tasks', 'assign', 'chore', 'chores', 
    'delegate', 'distribute', 'who is', 'prep task', 'prep tasks'
  ];
  if (matchesKeyword(taskKeywords)) {
    return 'INTENT_DIVIDE_TASKS';
  }

  // 2. Delivery Service Handoff / Order
  const handoffKeywords = [
    'handoff', 'delivery', 'order', 'instacart', 'amazon fresh', 
    'shipt', 'checkout', 'buy online', 'grocery delivery', 'copy list'
  ];
  if (matchesKeyword(handoffKeywords)) {
    return 'INTENT_GROCERY_HANDOFF';
  }

  // 3. Dietary Changes / Allergies
  const dietaryKeywords = [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'allergy', 
    'dietary', 'plant-based', 'nut-free', 'substitute ingredient'
  ];
  if (matchesKeyword(dietaryKeywords)) {
    return 'INTENT_DIETARY_CHANGE';
  }

  // 4. Schedule Changes / Timing
  const scheduleKeywords = [
    'delay', 'later', 'earlier', 'schedule change', 'soccer delayed', 
    'postpone', 'reschedule', 'dinner time'
  ];
  if (matchesKeyword(scheduleKeywords)) {
    return 'INTENT_SCHEDULE_CHANGE';
  }

  // 5. Grocery & Shopping List
  const groceryKeywords = [
    'shopping', 'grocery', 'groceries', 'buy', 'market', 
    'need to buy', 'cart', 'items to buy', 'shopping list'
  ];
  if (matchesKeyword(groceryKeywords)) {
    return 'INTENT_GROCERY_PREP';
  }

  // 6. Dinner Planning
  const dinnerKeywords = [
    'dinner', 'meal', 'cook', 'recipe', 'eat', 'food', 
    'plan dinner', 'what to make', 'supper', 'pantry', 'weekly'
  ];
  if (matchesKeyword(dinnerKeywords)) {
    return 'INTENT_PLAN_DINNER';
  }

  return 'INTENT_FALLBACK';
}

/* ==========================================================================
   7. Multi-Step Agent Workflows
   ========================================================================== */

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * WORKFLOW 1: Dinner Planning
 */
async function executeDinnerPlanningWorkflow() {
  setAgentTyping(true, 'Checking household pantry inventory...');
  await sleep(350);

  const pantry = getPantry();

  setAgentTyping(true, 'Checking family evening calendar and schedule...');
  await sleep(350);

  const calendar = getCalendar();

  setAgentTyping(true, 'Formulating a 35-minute dinner tailored to Maya\'s 6:30 PM return...');
  await sleep(400);

  const proposedMeal = {
    name: 'Rustic Garlic-Herb Penne with Fresh Greens & Crusty Bread',
    prepTime: '35 minutes',
    servings: 4,
    description: 'A comforting, rapid 35-minute family pasta dinner tailored to Maya\'s 6:30 PM soccer arrival and tonight\'s 7:15 PM target dinner time.',
    ingredientsHave: [
      'Penne Rigate Pasta (500g)',
      'Crushed San Marzano Tomatoes (800g)',
      'Extra Virgin Olive Oil & Fresh Garlic',
      'Dried Oregano & Red Pepper Flakes'
    ],
    ingredientsMissing: [
      { name: 'Fresh Sweet Basil', category: 'Produce', quantity: '1 fresh bunch', estimatedCost: 2.49, relatedMeal: 'Rustic Garlic-Herb Penne', addedBy: 'Dinner Planner' },
      { name: 'Aged Parmesan Cheese (Wedge)', category: 'Dairy & Refrigerated', quantity: '200g', estimatedCost: 4.89, relatedMeal: 'Rustic Garlic-Herb Penne', addedBy: 'Dinner Planner' },
      { name: 'Artisan Crusty Sourdough Bread', category: 'Bakery & Bread', quantity: '1 loaf', estimatedCost: 3.49, relatedMeal: 'Rustic Garlic-Herb Penne', addedBy: 'Dinner Planner' },
      { name: 'Organic Mixed Salad Greens', category: 'Produce', quantity: '1 clamshell (5oz)', estimatedCost: 3.99, relatedMeal: 'Rustic Garlic-Herb Penne', addedBy: 'Dinner Planner' }
    ],
    calendarNotes: 'Ready by 7:15 PM &bull; 35m prep window'
  };

  setAgentTyping(true, 'Adding missing ingredients to your shopping list...');
  await sleep(350);

  updateShoppingList(proposedMeal.ingredientsMissing);

  setAgentTyping(true, 'Saving dinner plan...');
  await sleep(250);

  saveDinnerPlan(proposedMeal);
  setAgentTyping(false);

  const responseText = 
    `I've planned tonight's meal for 4: **${proposedMeal.name}**.\n\n` +
    `⏱️ **Prep Time:** ${proposedMeal.prepTime} (ready by 7:15 PM after Maya's 6:30 PM soccer return).\n` +
    `🥫 **In Stock:** Penne pasta, crushed tomatoes, olive oil, garlic & spices.\n` +
    `🛒 **Added to Shopping List:** 4 missing items (${proposedMeal.ingredientsMissing.map(i => i.name).join(', ')}).\n\n` +
    `You can now ask to **"Divide dinner prep tasks"** or **"Prepare delivery handoff"**!`;

  const workflowCard = {
    title: 'Dinner Plan Formulated',
    items: [
      `Meal: ${proposedMeal.name}`,
      `Timeline: Ready in ${proposedMeal.prepTime} by 7:15 PM`,
      `Pantry Matched: Penne, Tomatoes, Garlic & Spices`,
      `Shopping Updated: 4 missing items with cost estimates`
    ]
  };

  addChatMessage('agent', responseText, workflowCard);
  renderAllStatePanels();
  showToast('Dinner plan formulated and saved!');
}

/**
 * WORKFLOW 2: Grocery Preparation
 */
async function executeGroceryPreparationWorkflow() {
  setAgentTyping(true, 'Retrieving active shopping list items...');
  await sleep(350);

  const items = getShoppingList();

  setAgentTyping(true, 'Organizing items by supermarket department...');
  await sleep(300);

  const categories = categorizeItems(items);
  const pendingCount = items.filter(i => !i.purchased).length;
  const purchasedCount = items.filter(i => i.purchased).length;

  setAgentTyping(false);

  const responseText = 
    `Here is your organized shopping list (**${pendingCount} needed**, ${purchasedCount} acquired):\n\n` +
    Object.keys(categories).map(cat => {
      const catItems = categories[cat];
      return `**${cat} (${catItems.length}):**\n` + catItems.map(i => `• ${i.name} [${i.quantity}] ~$${(i.estimatedCost || 3).toFixed(2)} ${i.purchased ? '✓' : '○'}`).join('\n');
    }).join('\n\n') +
    `\n\nCheck items off as you shop, or use the **Order Groceries** panel to handoff to Amazon Fresh or Instacart!`;

  const workflowCard = {
    title: 'Shopping List Organized',
    items: [
      `Total Items: ${items.length} across ${Object.keys(categories).length} categories`,
      `Pending to buy: ${pendingCount} items`,
      `Purchased: ${purchasedCount} items`,
      `Estimated total cost: $${calculateEstimatedTotal(items.filter(i => !i.purchased)).toFixed(2)}`
    ]
  };

  addChatMessage('agent', responseText, workflowCard);
  renderShoppingList();
  renderHandoffView();
  showToast('Shopping list organized by department!');
}

/**
 * WORKFLOW 3: Household Task Coordination
 */
async function executeTaskCoordinationWorkflow() {
  setAgentTyping(true, 'Reviewing household members and evening availability...');
  await sleep(350);

  const members = getHouseholdMembers();
  const currentTasks = getTasks();

  setAgentTyping(true, 'Splitting dinner prep tasks across family members...');
  await sleep(400);

  const prepAssignments = [
    {
      title: 'Chop fresh garlic, mince herbs & toss side salad',
      assignee: 'Alex',
      avatar: '👨‍💼',
      duration: '10 mins (Starts 6:15 PM)'
    },
    {
      title: 'Boil penne pasta & simmer rustic tomato-herb sauce',
      assignee: 'Sam',
      avatar: '👩‍🍳',
      duration: '25 mins (Kitchen lead)'
    },
    {
      title: 'Slice artisan bread & set dining table for 4',
      assignee: 'Maya',
      avatar: '👧',
      duration: '10 mins (Starts 6:40 PM after soccer)'
    },
    {
      title: 'Pour cold water glasses & distribute cloth napkins',
      assignee: 'Jordan',
      avatar: '👦',
      duration: '5 mins (Child helper)'
    }
  ];

  setAgentTyping(true, 'Registering task assignments...');
  await sleep(300);

  prepAssignments.forEach(assignment => {
    assignTask(assignment);
  });

  setAgentTyping(false);

  const responseText = 
    `I've divided tonight's dinner preparation among the 4 household members to ensure dinner is served smoothly by 7:15 PM:\n\n` +
    prepAssignments.map(t => `• **${t.assignee} ${t.avatar}:** ${t.title} (${t.duration})`).join('\n') +
    `\n\nFamily members can check off tasks in the **Family Tasks** card as they complete them.`;

  const workflowCard = {
    title: 'Prep Tasks Divided',
    items: [
      `Alex 👨‍💼: Garlic & Salad Prep (10 min)`,
      `Sam 👩‍🍳: Pasta & Tomato Sauce Simmer (25 min)`,
      `Maya 👧: Bread Slicing & Table Setting (10 min)`,
      `Jordan 👦: Water & Napkins (5 min)`
    ]
  };

  addChatMessage('agent', responseText, workflowCard);
  renderTasksList();
  showToast('Dinner prep tasks divided and assigned!');
}

/**
 * WORKFLOW 4: Grocery Delivery Handoff (Feature A)
 */
async function executeGroceryHandoffWorkflow() {
  setAgentTyping(true, 'Preparing grocery delivery handoff...');
  await sleep(300);

  const items = getShoppingList().filter(i => !i.purchased);
  const total = calculateEstimatedTotal(items);

  setAgentTyping(false);

  const responseText = 
    `I've consolidated your delivery handoff for **${items.length} needed items** (estimated **$${total.toFixed(2)}**).\n\n` +
    `In the **Order Groceries** panel, select your preferred service (Amazon Fresh, Instacart, Target) to copy your formatted list and jump to checkout.`;

  const workflowCard = {
    title: 'Delivery Handoff Ready',
    items: [
      `Items to order: ${items.length}`,
      `Estimated Cart Total: $${total.toFixed(2)}`,
      `Service: Configured for Amazon Fresh, Instacart, Target`,
      `Action: Copy & open merchant storefront`
    ]
  };

  addChatMessage('agent', responseText, workflowCard);
  renderHandoffView();
  
  // Smoothly scroll to handoff section
  const handoffSec = document.getElementById('handoff');
  if (handoffSec) {
    handoffSec.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * WORKFLOW 5: Dietary Preference Adaptation (Adaptive replanning)
 */
async function executeDietaryChangeWorkflow(userInput) {
  setAgentTyping(true, 'Adapting recipe for dietary preferences...');
  await sleep(400);

  const isGlutenFree = userInput.toLowerCase().includes('gluten');
  const mealName = isGlutenFree 
    ? 'Gluten-Free Brown Rice Penne with Rustic Garlic-Tomato Sauce' 
    : 'Vegetarian Rustic Garlic-Herb Penne with Fresh Greens & Pine Nuts';

  const adaptedPlan = {
    name: mealName,
    prepTime: '35 minutes',
    servings: 4,
    description: `Adapted to be 100% ${isGlutenFree ? 'gluten-free' : 'vegetarian'} using pantry staples, fresh herbs, and certified ingredients.`,
    ingredientsHave: [
      isGlutenFree ? 'Brown Rice Penne Pasta' : 'Penne Rigate Pasta',
      'Crushed San Marzano Tomatoes',
      'Extra Virgin Olive Oil & Fresh Garlic'
    ],
    ingredientsMissing: [
      { name: 'Fresh Sweet Basil', category: 'Produce', quantity: '1 bunch', estimatedCost: 2.49, relatedMeal: mealName, addedBy: 'Dietary Adapt' },
      { name: isGlutenFree ? 'Gluten-Free Artisan Sourdough' : 'Roasted Pine Nuts & Nutritional Yeast', category: 'Bakery & Bread', quantity: '1 pack', estimatedCost: 4.50, relatedMeal: mealName, addedBy: 'Dietary Adapt' }
    ],
    calendarNotes: 'Dietary preference active &bull; Ready by 7:15 PM'
  };

  updateShoppingList(adaptedPlan.ingredientsMissing);
  saveDinnerPlan(adaptedPlan);
  setAgentTyping(false);

  const responseText = `I have adapted tonight's plan to **${mealName}**! Ingredients and grocery estimates have been updated.`;
  addChatMessage('agent', responseText, {
    title: 'Recipe Adapted',
    items: [
      `New meal: ${mealName}`,
      `Pantry verified & restock adjusted`,
      `Allergies/Preferences synchronized`
    ]
  });
  renderAllStatePanels();
  showToast('Dinner plan adapted to dietary preference!');
}

/**
 * WORKFLOW 6: Schedule Change & Timing Adaptation
 */
async function executeScheduleChangeWorkflow(userInput) {
  setAgentTyping(true, 'Adjusting evening schedule & dinner timeline...');
  await sleep(350);

  const newTime = '7:45 PM';
  updateCalendar({ targetDinnerTime: newTime });

  if (appState.dinnerPlan && appState.dinnerPlan.status === 'planned') {
    appState.dinnerPlan.calendarNotes = `Rescheduled to ${newTime} (Soccer delayed)`;
    persistState();
  }

  setAgentTyping(false);

  const responseText = `I've updated tonight's schedule! Target dinner time is now moved to **${newTime}**. Preparation tasks will begin at 7:10 PM.`;
  addChatMessage('agent', responseText, {
    title: 'Schedule Updated',
    items: [
      `New dinner target: ${newTime}`,
      `Maya soccer return accommodated`,
      `Tasks timeline adjusted`
    ]
  });
  renderAllStatePanels();
  showToast('Evening schedule updated!');
}

/**
 * Fallback response
 */
async function executeFallbackWorkflow(userInput) {
  setAgentTyping(true, 'Thinking...');
  await sleep(250);
  setAgentTyping(false);

  const responseText = 
    `I heard: *"${escapeHtml(userInput)}"*.\n\n` +
    `As your household coordination helper, I can assist you with:\n\n` +
    `1. 🍽️ **Dinner Planning:** *"Plan a simple dinner for four tonight and check what's missing."*\n` +
    `2. 🛒 **Shopping List:** *"Show my shopping list and organize what I need to buy."*\n` +
    `3. 🚚 **Delivery Handoff:** *"Prepare grocery delivery handoff for Amazon Fresh or Instacart."*\n` +
    `4. 📋 **Task Division:** *"Divide tonight's dinner preparation tasks."*\n` +
    `5. 🌿 **Dietary Changes:** *"Make dinner vegetarian or gluten-free."*\n\n` +
    `You can also tap one of the suggested prompts above!`;

  addChatMessage('agent', responseText, null);
}

/* ==========================================================================
   8. Helper Functions
   ========================================================================== */

function categorizeItems(items) {
  const categories = {
    'Produce': [],
    'Dairy & Refrigerated': [],
    'Pantry & Seasonings': [],
    'Bakery & Bread': [],
    'Protein & Meat': [],
    'Household & Other': []
  };

  items.forEach(item => {
    const cat = item.category || 'Household & Other';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(item);
  });

  Object.keys(categories).forEach(k => {
    if (categories[k].length === 0) delete categories[k];
  });

  return categories;
}

function calculateEstimatedTotal(items) {
  return items.reduce((sum, item) => sum + (Number(item.estimatedCost) || 3.00), 0);
}

function formatHandoffClipboardText(items) {
  const dateStr = new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  const total = calculateEstimatedTotal(items);
  const grouped = categorizeItems(items);

  let output = `HomeFlow Grocery List — The Miller Household\n`;
  output += `Date: ${dateStr}\n`;
  output += `Total Items: ${items.length} | Estimated Total: $${total.toFixed(2)}\n\n`;

  Object.keys(grouped).forEach(cat => {
    output += `[${cat.toUpperCase()}]\n`;
    grouped[cat].forEach(item => {
      const meal = item.relatedMeal ? ` (For: ${item.relatedMeal})` : '';
      output += `• ${item.name} — ${item.quantity || '1 unit'} (~$${(item.estimatedCost || 3).toFixed(2)})${meal}\n`;
    });
    output += `\n`;
  });

  output += `(Generated by HomeFlow Assistant — Complete checkout on merchant website)`;
  return output;
}

function copyTextToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (e) {
      console.warn('Copy command fallback error:', e);
    }
    document.body.removeChild(textarea);
    return Promise.resolve();
  }
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');
}

/* ==========================================================================
   9. UI Renderers
   ========================================================================== */

function renderAll() {
  renderChatThread();
  renderActivityLog();
  renderAllStatePanels();
  renderSampleDataModal();
  updateToolCountBadge();
  updateSyncIndicator(true);
}

function renderAllStatePanels() {
  renderDinnerPlanCard();
  renderShoppingList();
  renderHandoffView();
  renderTasksList();
}

/**
 * Render Chat Messages (Unified across Main Card and Quick Drawer)
 */
function renderChatThread() {
  const container = document.getElementById('chat-messages');
  const drawerContainer = document.getElementById('drawer-chat-messages');

  const html = appState.chatHistory.map(msg => {
    const isUser = msg.sender === 'user';
    const formattedBody = formatMessageText(msg.text);

    let cardHtml = '';
    if (msg.workflowCard) {
      cardHtml = `
        <div class="agent-workflow-card">
          <h4>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            ${escapeHtml(msg.workflowCard.title)}
          </h4>
          <ul>
            ${msg.workflowCard.items.map(it => `<li>${escapeHtml(it)}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    return `
      <div class="chat-message ${isUser ? 'user' : 'agent'}">
        <div class="message-meta">
          <span>${isUser ? 'You' : 'HomeFlow'}</span>
          <span>&bull;</span>
          <span>${escapeHtml(msg.timestamp)}</span>
        </div>
        <div class="message-bubble">
          ${formattedBody}
          ${cardHtml}
        </div>
      </div>
    `;
  }).join('');

  if (container) {
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
  }
  if (drawerContainer) {
    drawerContainer.innerHTML = html;
    drawerContainer.scrollTop = drawerContainer.scrollHeight;
  }
}

function formatMessageText(text) {
  if (!text) return '';
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/\n/g, '<br>');
  return html;
}

function addChatMessage(sender, text, workflowCard = null) {
  const newMsg = {
    sender,
    text,
    timestamp: formatTime(new Date()),
    workflowCard
  };
  appState.chatHistory.push(newMsg);
  persistState();
  renderChatThread();
}

/**
 * Render Tool Activity Feed
 */
function renderActivityLog() {
  const container = document.getElementById('activity-log');
  if (!container) return;

  if (appState.activityLog.length === 0) {
    container.innerHTML = `
      <div class="activity-empty-text">
        No recent actions recorded. When HomeFlow checks the pantry, calendar, or tasks, the details will appear here.
      </div>
    `;
    return;
  }

  container.innerHTML = appState.activityLog.map(item => {
    const toolMeta = getHumanReadableToolInfo(item.tool);
    return `
      <div class="activity-item-card">
        <div class="activity-item-main">
          <div class="activity-item-title">
            <span>${escapeHtml(toolMeta.title)}</span>
          </div>
          <span class="activity-item-desc">${escapeHtml(toolMeta.description)}</span>
          <span class="activity-item-result">${escapeHtml(item.result)}</span>
        </div>
        <span class="activity-status-tag">${escapeHtml(toolMeta.statusLabel)}</span>
      </div>
    `;
  }).join('');
}

function getHumanReadableToolInfo(rawTool) {
  const tool = (rawTool || '').replace(/\(\)/g, '');
  switch (tool) {
    case 'getPantry':
      return {
        title: 'Pantry Inventory Checked',
        description: 'Read in-stock supplies to find suitable recipes',
        statusLabel: 'Completed'
      };
    case 'updatePantry':
      return {
        title: 'Pantry Restocked',
        description: 'Moved confirmed purchased items into pantry',
        statusLabel: 'Updated'
      };
    case 'getCalendar':
      return {
        title: 'Household Schedule Checked',
        description: 'Analyzed evening family timings and soccer return',
        statusLabel: 'Completed'
      };
    case 'updateCalendar':
      return {
        title: 'Schedule Updated',
        description: 'Rescheduled dinner target and prep timeline',
        statusLabel: 'Updated'
      };
    case 'updateShoppingList':
      return {
        title: 'Shopping List Updated',
        description: 'Added missing dinner ingredients to grocery restock',
        statusLabel: 'Synced'
      };
    case 'deliveryHandoff':
      return {
        title: 'Delivery Handoff Formatted',
        description: 'Copied categorized list for merchant checkout',
        statusLabel: 'Handoff'
      };
    case 'saveDinnerPlan':
      return {
        title: 'Dinner Plan Saved',
        description: 'Stored tonight\'s meal recipe and prep timeline',
        statusLabel: 'Saved'
      };
    case 'getHouseholdMembers':
      return {
        title: 'Family Members Checked',
        description: 'Loaded household availability for dinner prep roles',
        statusLabel: 'Completed'
      };
    case 'getTasks':
      return {
        title: 'Prep Tasks Reviewed',
        description: 'Checked current tasks to avoid double assignments',
        statusLabel: 'Completed'
      };
    case 'assignTask':
      return {
        title: 'Task Delegated',
        description: 'Assigned prep task to family member',
        statusLabel: 'Assigned'
      };
    case 'getShoppingList':
      return {
        title: 'Shopping List Loaded',
        description: 'Retrieved active items for department categorization',
        statusLabel: 'Completed'
      };
    case 'systemReset':
      return {
        title: 'Demo State Reset',
        description: 'Restored initial sample pantry, shopping, and tasks',
        statusLabel: 'Reset'
      };
    default:
      return {
        title: 'Household State Checked',
        description: 'HomeFlow agent synchronized application data',
        statusLabel: 'Ready'
      };
  }
}

function updateToolCountBadge() {
  const badge = document.getElementById('tool-count-badge');
  if (badge) {
    const count = appState.activityLog.length;
    badge.textContent = `${count} ${count === 1 ? 'action' : 'actions'} recorded`;
  }
}

/**
 * Render Dinner Plan Card (Hero Lifestyle Card)
 */
function renderDinnerPlanCard() {
  const container = document.getElementById('dinner-plan-container');
  if (!container) return;

  const plan = appState.dinnerPlan;
  const isPlanned = plan.status === 'planned';

  if (!isPlanned) {
    container.innerHTML = `
      <div class="unplanned-dinner-hero">
        <div class="unplanned-icon-circle" aria-hidden="true">🍲</div>
        <h3 class="unplanned-heading">What's for dinner tonight?</h3>
        <p class="unplanned-desc">
          HomeFlow hasn't planned tonight's meal yet. Ask below to check the pantry, align with Maya's soccer schedule, and draft a 35-minute family recipe.
        </p>
        <button class="btn btn-primary" onclick="handleUserSubmission('Plan a simple dinner for four tonight and check what\\'s missing.')">
          Plan dinner for four &amp; check pantry
        </button>
      </div>
    `;
    return;
  }

  const foodPhotoUrl = 'https://images.unsplash.com/photo-1621996346565-e3d5d6281781?auto=format&fit=crop&w=1000&q=80';

  container.innerHTML = `
    <div class="recipe-layout-split">
      <!-- Left: Large Natural Food Image with Error Fallback -->
      <div class="recipe-image-wrap">
        <img 
          src="${foodPhotoUrl}" 
          alt="Rustic Garlic Herb Pasta" 
          class="recipe-hero-image"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        />
        <div class="recipe-image-fallback" style="display: none;" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
            <line x1="6" y1="1" x2="6" y2="4"></line>
            <line x1="10" y1="1" x2="10" y2="4"></line>
            <line x1="14" y1="1" x2="14" y2="4"></line>
          </svg>
          <span style="font-family: var(--font-serif); font-size: 1.15rem; color: var(--text-primary); margin-bottom: 2px;">Rustic Garlic-Herb Penne</span>
          <span style="font-size: 0.8rem; color: var(--text-secondary);">Family dinner for four &bull; Fresh greens &amp; bread</span>
        </div>
        <span class="recipe-badge-overlay">Tonight's Family Meal</span>
      </div>

      <!-- Right: Editorial Content Panel -->
      <div class="recipe-content-panel">
        <div class="recipe-header-group">
          <div class="recipe-meta-pills">
            <span class="meta-pill">⏱️ ${escapeHtml(plan.prepTime)} prep</span>
            <span class="meta-dot">&bull;</span>
            <span class="meta-pill">👥 Serves ${escapeHtml(String(plan.servings))}</span>
            <span class="meta-dot">&bull;</span>
            <span class="meta-pill">✨ Family Favorite</span>
          </div>
          <h3 class="recipe-title-serif">${escapeHtml(plan.name)}</h3>
          <p class="recipe-description">${escapeHtml(plan.description)}</p>
        </div>

        <!-- 2-Column Clean Ingredients Split -->
        <div class="recipe-ingredients-split">
          <div>
            <div class="ingredient-col-title title-sage">
              <span>✓ In Pantry (${plan.ingredientsHave.length})</span>
            </div>
            <ul class="clean-bullet-list list-sage">
              ${plan.ingredientsHave.map(i => `<li>${escapeHtml(i)}</li>`).join('')}
            </ul>
          </div>
          <div>
            <div class="ingredient-col-title title-terracotta">
              <span>+ Added to Groceries (${plan.ingredientsMissing.length})</span>
            </div>
            <ul class="clean-bullet-list list-terracotta">
              ${plan.ingredientsMissing.map(i => `<li>${escapeHtml(i.name || i)}</li>`).join('')}
            </ul>
          </div>
        </div>

        <!-- Preparation Timeline -->
        <div class="recipe-timeline-row">
          <svg class="timeline-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <span><strong>Timeline:</strong> Maya arrives home at 6:30 PM &bull; Prep starts 6:35 PM &bull; Dinner served at 7:15 PM</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render Categorized Shopping List
 */
function renderShoppingList() {
  const container = document.getElementById('shopping-list-display');
  const countSummary = document.getElementById('shopping-count-summary');
  if (!container) return;

  const items = appState.shoppingList;
  const pendingCount = items.filter(i => !i.purchased).length;

  if (countSummary) {
    countSummary.textContent = `${pendingCount} needed &bull; ${items.length} total`;
  }

  if (items.length === 0) {
    container.innerHTML = `
      <div class="activity-empty-text">
        Your shopping list is clear. Missing ingredients from dinner plans will appear here automatically.
      </div>
    `;
    return;
  }

  const grouped = categorizeItems(items);

  container.innerHTML = Object.keys(grouped).map(category => {
    const catItems = grouped[category];
    return `
      <div class="shopping-group">
        <div class="shopping-group-title">
          <span>${escapeHtml(category)}</span>
          <span class="group-count">${catItems.length}</span>
        </div>
        <ul class="items-stack">
          ${catItems.map(item => `
            <li class="grocery-row" data-id="${escapeHtml(item.id)}">
              <label class="grocery-label">
                <input 
                  type="checkbox" 
                  class="grocery-checkbox grocery-toggle-cb" 
                  data-id="${escapeHtml(item.id)}" 
                  ${item.purchased ? 'checked' : ''} 
                  aria-label="Mark ${escapeHtml(item.name)} as purchased"
                />
                <span class="item-name ${item.purchased ? 'purchased' : ''}">${escapeHtml(item.name)}</span>
              </label>
              <div style="display: flex; align-items: center; gap: 0.4rem;">
                <span class="item-qty-tag">${escapeHtml(item.quantity || '1')}</span>
                <button class="item-remove-btn" data-delete-id="${escapeHtml(item.id)}" title="Remove item" aria-label="Delete ${escapeHtml(item.name)}">&times;</button>
              </div>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.grocery-toggle-cb').forEach(cb => {
    cb.addEventListener('change', e => {
      const id = e.target.getAttribute('data-id');
      toggleGroceryPurchased(id, e.target.checked);
    });
  });

  container.querySelectorAll('.item-remove-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = e.target.getAttribute('data-delete-id');
      deleteGroceryItem(id);
    });
  });
}

function toggleGroceryPurchased(id, isPurchased) {
  const item = appState.shoppingList.find(i => i.id === id);
  if (item) {
    item.purchased = isPurchased;
    if (isPurchased) {
      item.selectedForHandoff = false;
      updatePantry([item]); // auto-add to pantry
    }
    persistState();
    renderShoppingList();
    renderHandoffView();
    logToolCall('updateShoppingList', { itemId: id, purchased: isPurchased }, `Marked "${item.name}" as ${isPurchased ? 'Purchased' : 'Pending'}`);
  }
}

function deleteGroceryItem(id) {
  const index = appState.shoppingList.findIndex(i => i.id === id);
  if (index >= 0) {
    const deleted = appState.shoppingList.splice(index, 1)[0];
    persistState();
    renderShoppingList();
    renderHandoffView();
    logToolCall('updateShoppingList', { action: 'delete', name: deleted.name }, `Removed "${deleted.name}" from shopping list`);
  }
}

/**
 * FEATURE A: Render Grocery Delivery Handoff Card
 */
function renderHandoffView() {
  const container = document.getElementById('handoff-items-container');
  const estCostBadge = document.getElementById('handoff-est-cost');
  const serviceSelect = document.getElementById('delivery-service-select');
  const statusPill = document.getElementById('selected-service-status');
  const explanation = document.getElementById('service-handoff-explanation');
  if (!container) return;

  const items = appState.shoppingList.filter(i => !i.purchased);
  const total = calculateEstimatedTotal(items);

  if (estCostBadge) {
    estCostBadge.textContent = `$${total.toFixed(2)} estimated (${items.length} items)`;
  }

  // Populate services dropdown if empty
  if (serviceSelect && (!serviceSelect.options || serviceSelect.options.length === 0)) {
    serviceSelect.innerHTML = INTEGRATION_SERVICES.map(s => `
      <option value="${escapeHtml(s.id)}">${escapeHtml(s.name)} [${s.status === 'not_connected' ? 'Not Connected' : 'Manual Handoff'}]</option>
    `).join('');
  }

  if (serviceSelect && statusPill && explanation) {
    const currentServiceId = serviceSelect.value || INTEGRATION_SERVICES[0].id;
    const currentService = INTEGRATION_SERVICES.find(s => s.id === currentServiceId) || INTEGRATION_SERVICES[0];
    statusPill.textContent = currentService.statusLabel;
    statusPill.className = `service-status-pill ${currentService.status === 'not_connected' ? 'not-connected' : ''}`;
    explanation.textContent = currentService.description;
  }

  if (items.length === 0) {
    container.innerHTML = `
      <div class="activity-empty-text">
        All grocery items have been acquired! Formulate a new dinner plan to view restock items.
      </div>
    `;
    return;
  }

  const grouped = categorizeItems(items);

  container.innerHTML = Object.keys(grouped).map(cat => {
    const catItems = grouped[cat];
    return `
      <div class="handoff-category-group">
        <div class="handoff-category-header">
          <span>${escapeHtml(cat)}</span>
          <span>${catItems.length} items</span>
        </div>
        ${catItems.map(item => `
          <div class="handoff-item-row">
            <div class="handoff-item-left">
              <input 
                type="checkbox" 
                class="grocery-checkbox handoff-item-cb" 
                data-id="${escapeHtml(item.id)}" 
                ${item.selectedForHandoff !== false ? 'checked' : ''} 
                aria-label="Select ${escapeHtml(item.name)} for delivery"
              />
              <div class="handoff-item-meta">
                <span class="handoff-item-title">${escapeHtml(item.name)} (${escapeHtml(item.quantity || '1 unit')})</span>
                <span class="handoff-item-sub">For: ${escapeHtml(item.relatedMeal || 'Household Restock')}</span>
              </div>
            </div>
            <span class="handoff-item-cost">~$${(item.estimatedCost || 3.00).toFixed(2)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }).join('');

  // Item checkbox toggle for handoff selection
  container.querySelectorAll('.handoff-item-cb').forEach(cb => {
    cb.addEventListener('change', e => {
      const id = e.target.getAttribute('data-id');
      const item = appState.shoppingList.find(i => i.id === id);
      if (item) {
        item.selectedForHandoff = e.target.checked;
        persistState();
      }
    });
  });
}

/**
 * Render Tasks List
 */
function renderTasksList() {
  const container = document.getElementById('tasks-list-display');
  const countSummary = document.getElementById('tasks-count-summary');
  const progressBar = document.getElementById('tasks-progress-bar');
  if (!container) return;

  const tasks = appState.tasks;
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (countSummary) {
    countSummary.textContent = `${completedCount} of ${totalCount} completed (${pct}%)`;
  }
  if (progressBar) {
    progressBar.style.width = `${pct}%`;
  }

  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="activity-empty-text">
        No dinner prep tasks divided yet. Ask: "Divide tonight's dinner preparation tasks" to assign roles to the family.
      </div>
    `;
    return;
  }

  container.innerHTML = tasks.map(task => `
    <div class="task-item-card ${task.completed ? 'completed' : ''}" data-task-id="${escapeHtml(task.id)}">
      <div class="task-cb-wrap">
        <input 
          type="checkbox" 
          class="task-checkbox task-toggle-cb" 
          data-id="${escapeHtml(task.id)}" 
          ${task.completed ? 'checked' : ''} 
          aria-label="Complete task ${escapeHtml(task.title)}"
        />
      </div>
      <div class="task-body">
        <div class="task-text">${escapeHtml(task.title)}</div>
        <div class="task-sub-row">
          <span class="member-pill">${escapeHtml(task.avatar || '👤')} ${escapeHtml(task.assignee)}</span>
          <span class="task-time-pill">⏱️ ${escapeHtml(task.duration)}</span>
        </div>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.task-toggle-cb').forEach(cb => {
    cb.addEventListener('change', e => {
      const id = e.target.getAttribute('data-id');
      toggleTaskCompleted(id, e.target.checked);
    });
  });
}

function toggleTaskCompleted(id, isCompleted) {
  const task = appState.tasks.find(t => t.id === id);
  if (task) {
    task.completed = isCompleted;
    persistState();
    renderTasksList();
    logToolCall('assignTask', { taskId: id, completed: isCompleted }, `Task "${task.title}" marked as ${isCompleted ? 'Completed' : 'Pending'}`);
  }
}

/**
 * Render Seeded Reference Modal Tables
 */
function renderSampleDataModal() {
  const pantryTable = document.getElementById('pantry-reference-table');
  const calendarTable = document.getElementById('calendar-reference-table');
  const membersTable = document.getElementById('members-reference-table');

  const pantryItems = appState.pantry || SEEDED_PANTRY;
  const calendarEvents = appState.calendar || SEEDED_CALENDAR;

  if (pantryTable) {
    pantryTable.innerHTML = pantryItems.map(item => `
      <div class="ref-row">
        <span class="ref-col-bold">${escapeHtml(item.name)} (${escapeHtml(item.category || 'Pantry')})</span>
        <span class="ref-col-muted">${escapeHtml(item.quantity)} &bull; ${escapeHtml(item.status)}</span>
      </div>
    `).join('');
  }

  if (calendarTable) {
    calendarTable.innerHTML = calendarEvents.map(cal => `
      <div class="ref-row">
        <span class="ref-col-bold">${escapeHtml(cal.time)} — ${escapeHtml(cal.person)}</span>
        <span class="ref-col-muted">${escapeHtml(cal.event)}</span>
      </div>
    `).join('');
  }

  if (membersTable) {
    membersTable.innerHTML = SEEDED_MEMBERS.map(m => `
      <div class="ref-row">
        <span class="ref-col-bold">${escapeHtml(m.avatar)} ${escapeHtml(m.name)} (${escapeHtml(m.role)})</span>
        <span class="ref-col-muted">Focus: ${escapeHtml(m.specialty)}</span>
      </div>
    `).join('');
  }
}

/**
 * Visual Indicators
 */
function setAgentTyping(isTyping, statusText = 'Checking household pantry...') {
  const typingBar = document.getElementById('agent-typing');
  const statusLabel = document.getElementById('typing-status-text');
  const drawerTyping = document.getElementById('drawer-agent-typing');
  const drawerLabel = document.getElementById('drawer-typing-status-text');

  [typingBar, drawerTyping].forEach(bar => {
    if (bar) {
      if (isTyping) bar.classList.remove('hidden');
      else bar.classList.add('hidden');
    }
  });

  [statusLabel, drawerLabel].forEach(lbl => {
    if (lbl) lbl.textContent = statusText;
  });
}

function updateSyncIndicator(isSynced) {
  const badge = document.getElementById('state-sync-badge');
  if (badge) {
    badge.innerHTML = isSynced 
      ? '<span class="sync-dot"></span> All changes saved' 
      : '<span class="sync-dot" style="background:var(--accent-terracotta);"></span> Saving changes...';
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span>${type === 'error' ? '⚠️' : '🌿'}</span>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(6px)';
    toast.style.transition = 'all 200ms ease';
    setTimeout(() => {
      if (typeof toast.remove === 'function') {
        toast.remove();
      } else if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 250);
  }, 3200);
}

/* ==========================================================================
   10. Quick Assistant Drawer Controls (Feature B)
   ========================================================================== */

function openAssistantDrawer() {
  const drawer = document.getElementById('quick-assistant-drawer');
  const backdrop = document.getElementById('assistant-backdrop');
  if (drawer && backdrop) {
    drawer.classList.remove('hidden');
    backdrop.classList.remove('hidden');
    // Focus drawer input
    const input = document.getElementById('drawer-user-input');
    if (input) setTimeout(() => input.focus(), 150);
  }
}

function closeAssistantDrawer() {
  const drawer = document.getElementById('quick-assistant-drawer');
  const backdrop = document.getElementById('assistant-backdrop');
  if (drawer && backdrop) {
    drawer.classList.add('hidden');
    backdrop.classList.add('hidden');
  }
}

/* ==========================================================================
   11. User Input & Workflow Dispatcher
   ========================================================================== */

async function handleUserSubmission(queryText) {
  if (!queryText || !queryText.trim()) return;
  const cleanInput = queryText.trim();

  addChatMessage('user', cleanInput, null);

  const intent = routeIntent(cleanInput);

  switch (intent) {
    case 'INTENT_PLAN_DINNER':
      await executeDinnerPlanningWorkflow();
      break;
    case 'INTENT_GROCERY_PREP':
      await executeGroceryPreparationWorkflow();
      break;
    case 'INTENT_GROCERY_HANDOFF':
      await executeGroceryHandoffWorkflow();
      break;
    case 'INTENT_DIVIDE_TASKS':
      await executeTaskCoordinationWorkflow();
      break;
    case 'INTENT_DIETARY_CHANGE':
      await executeDietaryChangeWorkflow(cleanInput);
      break;
    case 'INTENT_SCHEDULE_CHANGE':
      await executeScheduleChangeWorkflow(cleanInput);
      break;
    default:
      await executeFallbackWorkflow(cleanInput);
      break;
  }
}

/* ==========================================================================
   12. Event Listeners & Initialization
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  renderAll();

  // Chat Form Submission (Main page)
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('user-input');

  if (chatForm && chatInput) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = chatInput.value;
      if (val) {
        chatInput.value = '';
        handleUserSubmission(val);
      }
    });
  }

  // Drawer Chat Form Submission
  const drawerForm = document.getElementById('drawer-chat-form');
  const drawerInput = document.getElementById('drawer-user-input');

  if (drawerForm && drawerInput) {
    drawerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = drawerInput.value;
      if (val) {
        drawerInput.value = '';
        handleUserSubmission(val);
      }
    });
  }

  // Assistant Drawer Triggers (FAB, Sidebar, Mobile bottom nav)
  const fab = document.getElementById('quick-assistant-fab');
  const sidebarAssistantBtn = document.getElementById('sidebar-assistant-btn');
  const mobileAssistantTrigger = document.getElementById('mobile-assistant-trigger');
  const closeDrawerBtn = document.getElementById('close-assistant-drawer-btn');
  const backdrop = document.getElementById('assistant-backdrop');

  if (fab) fab.addEventListener('click', openAssistantDrawer);
  if (sidebarAssistantBtn) sidebarAssistantBtn.addEventListener('click', openAssistantDrawer);
  if (mobileAssistantTrigger) mobileAssistantTrigger.addEventListener('click', openAssistantDrawer);
  if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeAssistantDrawer);
  if (backdrop) backdrop.addEventListener('click', closeAssistantDrawer);

  // Quick Prompt Chips (All prompt chips inside main and drawer)
  document.querySelectorAll('.prompt-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const prompt = btn.getAttribute('data-prompt');
      if (prompt) {
        handleUserSubmission(prompt);
      }
    });
  });

  // Clear Chat Button
  const clearChatBtn = document.getElementById('clear-chat-btn');
  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', () => {
      appState.chatHistory = [
        {
          sender: 'agent',
          text: 'Conversation cleared. How can HomeFlow assist your home tonight?',
          timestamp: formatTime(new Date()),
          workflowCard: null
        }
      ];
      persistState();
      renderChatThread();
      showToast('Conversation cleared.');
    });
  }

  // Clear Tool Trace Button
  const clearActivityBtn = document.getElementById('clear-activity-btn');
  if (clearActivityBtn) {
    clearActivityBtn.addEventListener('click', () => {
      appState.activityLog = [];
      persistState();
      renderActivityLog();
      updateToolCountBadge();
      showToast('Activity details cleared.');
    });
  }

  // Add Custom Grocery Item
  const addGroceryForm = document.getElementById('add-grocery-form');
  const newGroceryInput = document.getElementById('new-grocery-input');
  const newGroceryCategory = document.getElementById('new-grocery-category');

  if (addGroceryForm && newGroceryInput && newGroceryCategory) {
    addGroceryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = newGroceryInput.value.trim();
      const category = newGroceryCategory.value;

      if (name) {
        updateShoppingList([{ 
          name, 
          category, 
          quantity: '1 unit', 
          estimatedCost: 3.50,
          relatedMeal: 'Household Restock',
          addedBy: 'User Manual' 
        }]);
        newGroceryInput.value = '';
        renderShoppingList();
        renderHandoffView();
        showToast(`Added "${name}" to shopping list.`);
      }
    });
  }

  // Clear Completed Groceries Button
  const clearDoneBtn = document.getElementById('clear-completed-groceries-btn');
  if (clearDoneBtn) {
    clearDoneBtn.addEventListener('click', () => {
      const initialCount = appState.shoppingList.length;
      appState.shoppingList = appState.shoppingList.filter(item => !item.purchased);
      const removed = initialCount - appState.shoppingList.length;
      persistState();
      renderShoppingList();
      renderHandoffView();
      logToolCall('updateShoppingList', { action: 'clear_purchased', removedCount: removed }, `Removed ${removed} purchased items`);
      showToast(`Removed ${removed} purchased item(s).`);
    });
  }

  // FEATURE A: Handoff Toolbar Handlers
  const selectAllBtn = document.getElementById('handoff-select-all-btn');
  const selectNoneBtn = document.getElementById('handoff-select-none-btn');
  const copyListBtn = document.getElementById('copy-handoff-list-btn');
  const confirmPantryBtn = document.getElementById('confirm-purchase-pantry-btn');
  const serviceSelect = document.getElementById('delivery-service-select');
  const launchHandoffBtn = document.getElementById('launch-delivery-handoff-btn');

  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', () => {
      appState.shoppingList.forEach(item => {
        if (!item.purchased) item.selectedForHandoff = true;
      });
      persistState();
      renderHandoffView();
    });
  }

  if (selectNoneBtn) {
    selectNoneBtn.addEventListener('click', () => {
      appState.shoppingList.forEach(item => {
        item.selectedForHandoff = false;
      });
      persistState();
      renderHandoffView();
    });
  }

  if (copyListBtn) {
    copyListBtn.addEventListener('click', () => {
      const selected = appState.shoppingList.filter(i => !i.purchased && i.selectedForHandoff !== false);
      const itemsToCopy = selected.length > 0 ? selected : appState.shoppingList.filter(i => !i.purchased);
      
      if (itemsToCopy.length === 0) {
        showToast('No items available to copy.');
        return;
      }

      const text = formatHandoffClipboardText(itemsToCopy);
      copyTextToClipboard(text);
      showToast(`Copied ${itemsToCopy.length} items to clipboard!`);
    });
  }

  if (confirmPantryBtn) {
    confirmPantryBtn.addEventListener('click', () => {
      const selectedIds = appState.shoppingList
        .filter(i => !i.purchased && i.selectedForHandoff !== false)
        .map(i => i.id);

      if (selectedIds.length === 0) {
        showToast('Please select items to mark purchased.');
        return;
      }

      confirmPurchasedItems(selectedIds);
    });
  }

  if (serviceSelect) {
    serviceSelect.addEventListener('change', () => {
      const currentService = INTEGRATION_SERVICES.find(s => s.id === serviceSelect.value);
      const statusPill = document.getElementById('selected-service-status');
      const explanation = document.getElementById('service-handoff-explanation');
      if (currentService && statusPill && explanation) {
        statusPill.textContent = currentService.statusLabel;
        statusPill.className = `service-status-pill ${currentService.status === 'not_connected' ? 'not-connected' : ''}`;
        explanation.textContent = currentService.description;
      }
    });
  }

  if (launchHandoffBtn && serviceSelect) {
    launchHandoffBtn.addEventListener('click', () => {
      const serviceId = serviceSelect.value;
      const selected = appState.shoppingList.filter(i => !i.purchased && i.selectedForHandoff !== false);
      const itemsToHandoff = selected.length > 0 ? selected : appState.shoppingList.filter(i => !i.purchased);

      if (itemsToHandoff.length === 0) {
        showToast('Your shopping list is currently clear.');
        return;
      }

      deliveryHandoff(serviceId, itemsToHandoff);
    });
  }

  // Reference Data Modal Controls
  const viewDataBtn = document.getElementById('view-sample-data-btn');
  const dataModal = document.getElementById('data-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const modalOkBtn = document.getElementById('modal-ok-btn');

  function openModal() {
    if (dataModal) dataModal.classList.remove('hidden');
  }
  function closeModal() {
    if (dataModal) dataModal.classList.add('hidden');
  }

  if (viewDataBtn) viewDataBtn.addEventListener('click', openModal);
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (modalOkBtn) modalOkBtn.addEventListener('click', closeModal);

  // Reset Demo Data Modal Controls
  const resetBtn = document.getElementById('reset-demo-btn');
  const resetModal = document.getElementById('reset-confirm-modal');
  const cancelResetBtn = document.getElementById('cancel-reset-btn');
  const cancelResetXBtn = document.getElementById('cancel-reset-x-btn');
  const confirmResetBtn = document.getElementById('confirm-reset-btn');

  function openResetModal() {
    if (resetModal) resetModal.classList.remove('hidden');
  }
  function closeResetModal() {
    if (resetModal) resetModal.classList.add('hidden');
  }

  if (resetBtn) resetBtn.addEventListener('click', openResetModal);
  if (cancelResetBtn) cancelResetBtn.addEventListener('click', closeResetModal);
  if (cancelResetXBtn) cancelResetXBtn.addEventListener('click', closeResetModal);

  if (confirmResetBtn) {
    confirmResetBtn.addEventListener('click', () => {
      resetToSeedData();
      closeResetModal();
    });
  }

  // Close modals and drawer on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeResetModal();
      closeAssistantDrawer();
    }
  });

  // Log initial start
  if (appState.activityLog.length === 0) {
    logToolCall('systemSetup', {}, 'HomeFlow coordination agent initialized');
  }
});
