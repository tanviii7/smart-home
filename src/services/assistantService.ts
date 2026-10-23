import { AssistantMessage, ToolCall, ToolResult, AssistantConfirmation } from '../types';
import { StorageRepository } from './storage';
import { executeTool, APPLICATION_TOOLS } from './tools';

interface ProcessPromptOptions {
  confirmationResponse?: boolean;
  confirmedActionPayload?: {
    toolName: string;
    params: any;
  };
}

export class AssistantService {
  /**
   * Get effective API key from Settings or Environment Variable
   */
  static getEffectiveApiKey(): string {
    const settings = StorageRepository.getSettings();
    if (settings.geminiApiKey?.trim()) return settings.geminiApiKey.trim();
    const envKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim();
    if (envKey) return envKey;
    return '';
  }

  /**
   * Check if external Gemini API is active
   */
  static isApiEnabled(): boolean {
    const key = this.getEffectiveApiKey();
    return key.length > 5;
  }

  /**
   * Dynamically discover the best working Gemini model for this API key
   */
  static async getWorkingModel(apiKey: string): Promise<string> {
    const cached = sessionStorage.getItem('smarthome_gemini_model');
    if (cached) return cached;

    try {
      const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (listRes.ok) {
        const listData = await listRes.json();
        const availableModels = (listData.models || []).filter((m: any) =>
          m.supportedGenerationMethods?.includes('generateContent')
        );

        const preferred = [
          'gemini-3.8-flash',
          'gemini-3.5-flash',
          'gemini-3-flash',
          'gemini-3.8-pro',
          'gemini-2.5-flash',
          'gemini-2.0-flash',
          'gemini-flash'
        ];

        for (const pref of preferred) {
          const found = availableModels.find((m: any) => m.name.includes(pref));
          if (found) {
            const cleanName = found.name.replace(/^models\//, '');
            sessionStorage.setItem('smarthome_gemini_model', cleanName);
            return cleanName;
          }
        }

        if (availableModels.length > 0) {
          const cleanName = availableModels[0].name.replace(/^models\//, '');
          sessionStorage.setItem('smarthome_gemini_model', cleanName);
          return cleanName;
        }
      }
    } catch (e) {
      console.warn('Failed to query ModelService.ListModels:', e);
    }

    return 'gemini-3.8-flash';
  }

  /**
   * Test live connection to Google Gemini API
   * Uses ModelService.ListModels to auto-detect supported models for the key
   * and verifies using gemini-3.8-flash with fallback
   */
  static async testGeminiApi(keyToTest?: string): Promise<{ success: boolean; message: string; model?: string }> {
    const key = keyToTest?.trim() || this.getEffectiveApiKey();
    if (!key) {
      return { success: false, message: 'No API key provided. Please enter a valid Google Gemini API key.' };
    }

    try {
      // 1. Query ModelService.ListModels to check key validity and available models
      const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      if (!listRes.ok) {
        const errData = await listRes.json().catch(() => ({}));
        const errMsg = errData.error?.message || `HTTP ${listRes.status} ${listRes.statusText}`;
        return { success: false, message: `API Verification Failed: ${errMsg}` };
      }

      const listData = await listRes.json();
      const availableModels = (listData.models || []).filter((m: any) =>
        m.supportedGenerationMethods?.includes('generateContent')
      );

      // Priority order for selecting the best modern model (Gemini 3.8 Flash recommended)
      const preferred = [
        'gemini-3.8-flash',
        'gemini-3.5-flash',
        'gemini-3-flash',
        'gemini-3.8-pro',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-flash'
      ];

      const candidates: string[] = [];
      // Always put gemini-3.8-flash first
      candidates.push('gemini-3.8-flash');

      for (const pref of preferred) {
        const match = availableModels.find((m: any) => m.name.includes(pref));
        if (match) {
          const clean = match.name.replace(/^models\//, '');
          if (!candidates.includes(clean)) candidates.push(clean);
        }
      }

      for (const m of availableModels) {
        const clean = m.name.replace(/^models\//, '');
        if (!candidates.includes(clean)) candidates.push(clean);
      }

      // 2. Test generation against candidates in order until a supported model responds
      let workingModel = '';
      let lastError = '';

      for (const modelName of candidates) {
        try {
          const testEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`;
          const testRes = await fetch(testEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: 'Respond with "Ready" in 1 word.' }] }]
            })
          });

          if (testRes.ok) {
            workingModel = modelName;
            break;
          } else {
            const errData = await testRes.json().catch(() => ({}));
            lastError = errData.error?.message || `HTTP ${testRes.status}`;
          }
        } catch (e: any) {
          lastError = e.message;
        }
      }

      if (!workingModel) {
        return { success: false, message: `Verification failed on available models: ${lastError}` };
      }

      sessionStorage.setItem('smarthome_gemini_model', workingModel);
      return {
        success: true,
        message: `Successfully connected! Active model: ${workingModel}`,
        model: workingModel
      };
    } catch (err: any) {
      return { success: false, message: `Network connection error: ${err.message || 'Please check your connection.'}` };
    }
  }

  /**
   * Main entry point to process a user prompt
   */
  static async processUserMessage(
    userText: string,
    options?: ProcessPromptOptions
  ): Promise<AssistantMessage> {
    const settings = StorageRepository.getSettings();

    // 1. If this is a confirmation response
    if (options?.confirmationResponse !== undefined && options?.confirmedActionPayload) {
      if (options.confirmationResponse === true) {
        // Execute the confirmed action
        const { toolName, params } = options.confirmedActionPayload;
        const res = await executeTool(toolName, params);
        return {
          id: `msg_${Date.now()}`,
          sender: 'assistant',
          text: `Action confirmed. ${res.message}`,
          timestamp: new Date().toISOString(),
          toolCalls: [{ name: toolName, params }],
          toolResults: [res]
        };
      } else {
        return {
          id: `msg_${Date.now()}`,
          sender: 'assistant',
          text: 'Understood. Action cancelled. No changes were made.',
          timestamp: new Date().toISOString()
        };
      }
    }

    // 2. Check if Gemini API is available
    const effectiveKey = this.getEffectiveApiKey();
    if (effectiveKey && (settings.aiProvider === 'gemini' || effectiveKey.length > 5)) {
      try {
        const geminiResult = await this.callGeminiWithTools(userText, effectiveKey);
        if (geminiResult) return geminiResult;
      } catch (err: any) {
        console.warn('Gemini API call failed, falling back to local deterministic engine:', err);
        // Fall back gracefully below
      }
    }

    // 3. Fallback to our deterministic intent router
    return await this.processDeterministicIntent(userText);
  }

  /**
   * Deterministic Intent Router
   * Maps natural language commands to real application tool executions
   */
  private static async processDeterministicIntent(text: string): Promise<AssistantMessage> {
    const lower = text.toLowerCase().trim();
    const toolCalls: ToolCall[] = [];
    const toolResults: ToolResult[] = [];
    let responseText = '';
    let confirmation: AssistantConfirmation | undefined = undefined;

    // Consequential action check: Away Mode or turning off the entire home
    if (lower.includes('away mode') || lower.includes('leaving home') || (lower.includes('turn off') && (lower.includes('everything') || lower.includes('all devices')))) {
      confirmation = {
        required: true,
        title: 'Activate Away Mode',
        prompt: 'This will turn off all living room, kitchen, bedroom, and patio lights, cut power to appliances, and switch climate to eco mode. Would you like to proceed?',
        actionPayload: {
          toolName: 'activate_scene',
          params: { sceneName: 'Away Mode' }
        }
      };

      return {
        id: `msg_${Date.now()}`,
        sender: 'assistant',
        text: 'This is a significant household action that will power down all rooms.',
        timestamp: new Date().toISOString(),
        confirmation
      };
    }

    // 1. Home status overview
    if (
      lower.includes('status') ||
      lower.includes('how is the house') ||
      lower.includes('home overview') ||
      lower.includes('what is on')
    ) {
      toolCalls.push({ name: 'get_home_status', params: {} });
      const res = await executeTool('get_home_status', {});
      toolResults.push(res);
      responseText = `Here is your current home status: ${res.data.activeDevicesCount} devices are currently turned on. The indoor temperature is ${res.data.indoorTemp} (target: ${res.data.targetTemp}). Tonight's planned dinner is "${res.data.tonightDinner}". You have ${res.data.pendingTasksCount} pending tasks and ${res.data.unboughtGroceriesCount} items left to shop for.`;
    }

    // 2. Scene Activation (Movie night, Morning routine, Relax, Good night)
    else if (lower.includes('movie night') || lower.includes('watch a movie')) {
      toolCalls.push({ name: 'activate_scene', params: { sceneName: 'Movie Night' } });
      const res = await executeTool('activate_scene', { sceneName: 'Movie Night' });
      toolResults.push(res);
      responseText = `I've set the scene for Movie Night. Living room lights are dimmed, kitchen lights are off, and your OLED TV is powered on. Enjoy the show!`;
    } else if (lower.includes('morning routine') || lower.includes('good morning')) {
      toolCalls.push({ name: 'activate_scene', params: { sceneName: 'Morning Routine' } });
      const res = await executeTool('activate_scene', { sceneName: 'Morning Routine' });
      toolResults.push(res);
      responseText = `Good morning! I've activated your Morning Routine. Warm ambient lighting is on, the espresso bar is heating up, and climate is adjusted to 71°F.`;
    } else if (lower.includes('relax') || lower.includes('unwind') || lower.includes('cozy evening')) {
      toolCalls.push({ name: 'activate_scene', params: { sceneName: 'Relax & Unwind' } });
      const res = await executeTool('activate_scene', { sceneName: 'Relax & Unwind' });
      toolResults.push(res);
      responseText = `Activated the Relax & Unwind scene. Ambient lighting has softened to a warm peach glow, fan is set to low breeze, and TV is powered down.`;
    } else if (lower.includes('good night') || lower.includes('going to bed') || lower.includes('bedtime')) {
      toolCalls.push({ name: 'activate_scene', params: { sceneName: 'Good Night' } });
      const res = await executeTool('activate_scene', { sceneName: 'Good Night' });
      toolResults.push(res);
      responseText = `Good night! Indoor lights and appliances have been turned off, patio lights set to gentle 20%, and the thermostat is set to cool 68°F for restful sleep.`;
    }

    // 3. Create Scene
    else if (lower.includes('create a scene') || lower.includes('create scene') || lower.includes('create a relaxing')) {
      const sceneName = 'Relaxing Evening';
      toolCalls.push({ name: 'create_scene', params: { name: sceneName, icon: 'Feather' } });
      const res = await executeTool('create_scene', { name: sceneName, icon: 'Feather' });
      toolResults.push(res);
      responseText = `I created a new scene named "${sceneName}" for you. You can review and customize its device behaviors under the Scenes tab.`;
    }

    // 4. Device Controls: Turn off/on living room lights, kitchen lights, coffee maker, fan, thermostat
    else if (lower.includes('turn off') || lower.includes('turn on') || lower.includes('switch off') || lower.includes('switch on') || lower.includes('dim') || lower.includes('set temperature') || lower.includes('thermostat')) {
      const isPowerOn = lower.includes('turn on') || lower.includes('switch on');
      const isPowerOff = lower.includes('turn off') || lower.includes('switch off');

      if (lower.includes('living room light') || lower.includes('living room lights')) {
        toolCalls.push({ name: 'control_device', params: { deviceNameOrQuery: 'Living Room Ceiling Pendant', power: isPowerOn } });
        const res1 = await executeTool('control_device', { deviceNameOrQuery: 'Living Room Ceiling Pendant', power: isPowerOn });
        toolResults.push(res1);

        toolCalls.push({ name: 'control_device', params: { deviceNameOrQuery: 'Reading Floor Lamp', power: isPowerOn } });
        const res2 = await executeTool('control_device', { deviceNameOrQuery: 'Reading Floor Lamp', power: isPowerOn });
        toolResults.push(res2);

        responseText = `Done. I've turned ${isPowerOn ? 'on' : 'off'} all the lights in the Living Room.`;
      } else if (lower.includes('coffee') || lower.includes('espresso')) {
        toolCalls.push({ name: 'control_device', params: { deviceNameOrQuery: 'Espresso Bar Smart Plug', power: isPowerOn } });
        const res = await executeTool('control_device', { deviceNameOrQuery: 'Espresso Bar Smart Plug', power: isPowerOn });
        toolResults.push(res);
        responseText = `The Espresso Bar smart plug is now turned ${isPowerOn ? 'on' : 'off'}.`;
      } else if (lower.includes('fan')) {
        const speed = isPowerOff ? 'off' : 'medium';
        toolCalls.push({ name: 'control_device', params: { deviceNameOrQuery: 'Ceiling Fan', power: isPowerOn, fanSpeed: speed } });
        const res = await executeTool('control_device', { deviceNameOrQuery: 'Ceiling Fan', power: isPowerOn, fanSpeed: speed });
        toolResults.push(res);
        responseText = `I've ${isPowerOn ? 'turned on the ceiling fan' : 'turned off the ceiling fan'}.`;
      } else if (lower.includes('thermostat') || lower.includes('temperature') || lower.includes('climate')) {
        const tempMatch = lower.match(/\b(\d{2})\b/);
        const targetTemp = tempMatch ? parseInt(tempMatch[1], 10) : 70;
        toolCalls.push({ name: 'control_device', params: { deviceNameOrQuery: 'Thermostat', targetTemperature: targetTemp } });
        const res = await executeTool('control_device', { deviceNameOrQuery: 'Thermostat', targetTemperature: targetTemp });
        toolResults.push(res);
        responseText = `I've adjusted the smart thermostat to ${targetTemp}°F.`;
      } else if (lower.includes('tv') || lower.includes('television')) {
        toolCalls.push({ name: 'control_device', params: { deviceNameOrQuery: 'Smart TV', power: isPowerOn } });
        const res = await executeTool('control_device', { deviceNameOrQuery: 'Smart TV', power: isPowerOn });
        toolResults.push(res);
        responseText = `The Living Room Smart TV is now turned ${isPowerOn ? 'on' : 'off'}.`;
      } else {
        // Generic device control match
        toolCalls.push({ name: 'control_device', params: { deviceNameOrQuery: lower, power: isPowerOn } });
        const res = await executeTool('control_device', { deviceNameOrQuery: lower, power: isPowerOn });
        toolResults.push(res);
        responseText = res.message;
      }
    }

    // 5. Meal Planning: Plan dinners, what's for dinner, replace dinner
    else if (lower.includes('plan my dinners') || lower.includes('plan dinners') || lower.includes('meal plan') || lower.includes('generate meal')) {
      const days = lower.includes('five') || lower.includes('5') ? 5 : 7;
      let pref = 'Mediterranean & Vegetarian';
      if (lower.includes('vegetarian')) pref = 'Vegetarian';
      if (lower.includes('protein')) pref = 'High-Protein';

      toolCalls.push({ name: 'generate_meal_plan', params: { daysCount: days, preference: pref } });
      const res = await executeTool('generate_meal_plan', { daysCount: days, preference: pref });
      toolResults.push(res);
      responseText = `I've planned your dinners for the next ${days} days with a focus on wholesome ${pref} recipes. You can review recipes, ingredients, and prep times in the Meals tab.`;
    } else if (lower.includes('dinner tonight') || lower.includes('what is for dinner') || lower.includes("what's for dinner")) {
      toolCalls.push({ name: 'get_meal_plan', params: {} });
      const res = await executeTool('get_meal_plan', {});
      toolResults.push(res);
      const dinner = res.data.days[0]?.meals?.dinner;
      if (dinner) {
        responseText = `Tonight's scheduled dinner is "${dinner.title}". It takes about ${dinner.prepTimeMinutes + dinner.cookTimeMinutes} minutes total (${dinner.prepTimeMinutes}m prep, ${dinner.cookTimeMinutes}m cook). Ingredients include: ${dinner.ingredients.map((i: any) => i.name).slice(0, 4).join(', ')}.`;
      } else {
        responseText = 'No specific dinner is scheduled for tonight yet. Would you like me to recommend a recipe?';
      }
    }

    // 6. Groceries & Shopping List
    else if (lower.includes('add') && (lower.includes('grocery') || lower.includes('shopping') || lower.includes('list'))) {
      // e.g. "Add milk and bread to my grocery list"
      const itemsToAdd: string[] = [];
      if (lower.includes('milk')) itemsToAdd.push('Whole Milk');
      if (lower.includes('bread')) itemsToAdd.push('Sourdough Bread');
      if (lower.includes('eggs')) itemsToAdd.push('Pasture-Raised Eggs');
      if (lower.includes('coffee')) itemsToAdd.push('Coffee Beans');
      if (lower.includes('apples')) itemsToAdd.push('Crisp Apples');

      if (itemsToAdd.length === 0) {
        // extract item from between "add" and "to"
        const match = lower.match(/add (.*?) (to|in)/);
        if (match && match[1]) {
          itemsToAdd.push(match[1]);
        } else {
          itemsToAdd.push('Groceries item');
        }
      }

      for (const item of itemsToAdd) {
        const cat = item.toLowerCase().includes('milk') || item.toLowerCase().includes('egg') ? 'Dairy' : 'Grains & Bakery';
        toolCalls.push({ name: 'add_shopping_item', params: { name: item, category: cat } });
        const res = await executeTool('add_shopping_item', { name: item, category: cat });
        toolResults.push(res);
      }

      responseText = `Added ${itemsToAdd.join(' and ')} to your grocery list.`;
    } else if (lower.includes('show my shopping list') || lower.includes('what groceries do i need') || lower.includes('grocery list')) {
      const shopping = StorageRepository.getShoppingList();
      const remaining = shopping.filter((s) => !s.completed);
      responseText = `You currently have ${remaining.length} items on your shopping list: ${remaining.slice(0, 5).map((i) => i.name).join(', ')}${remaining.length > 5 ? `, and ${remaining.length - 5} more` : ''}.`;
    }

    // 7. Pantry & Low-stock checks
    else if (lower.includes('pantry') || lower.includes('running low') || lower.includes('stock')) {
      toolCalls.push({ name: 'get_pantry_inventory', params: { filter: 'low_stock' } });
      const res = await executeTool('get_pantry_inventory', { filter: 'low_stock' });
      toolResults.push(res);
      const lowItems = res.data;
      if (lowItems.length > 0) {
        responseText = `You have ${lowItems.length} items running low in the pantry: ${lowItems.map((i: any) => `${i.name} (${i.quantity})`).join(', ')}. Would you like me to add these to your shopping list?`;
      } else {
        responseText = 'Your pantry is well-stocked! No essential items are currently flagged as low.';
      }
    }

    // 8. Tasks & Reminders
    else if (lower.includes('task') || lower.includes('chores') || lower.includes('due today') || lower.includes('reminder')) {
      toolCalls.push({ name: 'list_upcoming_tasks', params: { filter: 'today' } });
      const res = await executeTool('list_upcoming_tasks', { filter: 'today' });
      toolResults.push(res);
      const tasks = res.data;
      if (tasks.length > 0) {
        responseText = `You have ${tasks.length} tasks due today: ${tasks.map((t: any) => `"${t.title}" (${t.dueTime || 'Anytime'})`).join('; ')}.`;
      } else {
        responseText = 'You have no pending household chores due today. Enjoy your day!';
      }
    }

    // 9. Weekend Organization Routine
    else if (lower.includes('organize my home') || lower.includes('weekend')) {
      toolCalls.push({ name: 'list_upcoming_tasks', params: { filter: 'all' } });
      const resTasks = await executeTool('list_upcoming_tasks', { filter: 'all' });
      toolResults.push(resTasks);

      toolCalls.push({ name: 'get_pantry_inventory', params: { filter: 'low_stock' } });
      const resPantry = await executeTool('get_pantry_inventory', { filter: 'low_stock' });
      toolResults.push(resPantry);

      responseText = `Here is your weekend home coordination summary:
• Household Chores: You have ${resTasks.data.length} scheduled routines (including cleaning surfaces, plant care, and bed linens).
• Kitchen & Pantry: ${resPantry.data.length} staples are running low (e.g. ${resPantry.data.map((p: any) => p.name).slice(0, 2).join(', ')}).
• Meal Prep: Weekend dinners are ready in your weekly planner with full ingredient checklists.`;
    }

    // Default Fallback
    else {
      responseText = `I'm here to help coordinate your home. You can ask me to:
• Control lights or climate ("Turn off the living room lights", "Set thermostat to 69")
• Activate preset scenes ("Movie Night", "Morning Routine", "Relax")
• Organize meals ("Plan my dinners for the next five days", "What's for dinner tonight?")
• Manage groceries ("Add oat milk and sourdough to my shopping list")
• Track chores & reminders ("What tasks are due today?")`;
    }

    return {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      text: responseText,
      timestamp: new Date().toISOString(),
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      toolResults: toolResults.length > 0 ? toolResults : undefined,
      confirmation
    };
  }

  /**
   * Optional Gemini API integration when user enters their API key in Settings
   */
  private static async callGeminiWithTools(userText: string, apiKey: string): Promise<AssistantMessage | null> {
    const workingModel = await this.getWorkingModel(apiKey);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${workingModel}:generateContent?key=${apiKey}`;

    // Convert APPLICATION_TOOLS to Gemini function declarations
    const functionDeclarations = Object.values(APPLICATION_TOOLS).map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));

    const systemInstruction = {
      role: 'system',
      parts: [
        {
          text: `You are Smart Home Assistant, a calm, intelligent household coordinator inspired by Amazon Alexa+.
Always prioritize calling validated tools to inspect or modify household state (devices, scenes, meal plans, groceries, tasks).
Never fabricate success without executing the tool. Maintain a warm, concise, and helpful tone.`
        }
      ]
    };

    const payload = {
      systemInstruction,
      contents: [
        {
          role: 'user',
          parts: [{ text: userText }]
        }
      ],
      tools: [
        {
          functionDeclarations
        }
      ]
    };

    let response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      sessionStorage.removeItem('smarthome_gemini_model');
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    const toolCalls: ToolCall[] = [];
    const toolResults: ToolResult[] = [];
    let textResponse = '';

    for (const part of parts) {
      if (part.functionCall) {
        const { name, args } = part.functionCall;
        toolCalls.push({ name, params: args });
        const res = await executeTool(name, args);
        toolResults.push(res);
        textResponse += (textResponse ? '\n' : '') + res.message;
      }
      if (part.text) {
        textResponse += (textResponse ? '\n' : '') + part.text;
      }
    }

    return {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      text: textResponse || 'Action completed via Gemini.',
      timestamp: new Date().toISOString(),
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      toolResults: toolResults.length > 0 ? toolResults : undefined
    };
  }
}
