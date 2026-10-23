# HomeFlow 2.1 — Cozy Household Planning & Coordination Agent (Simulation)

> **Amazon Developer Hackathon Submission**  
> *Category:* Alexa+ Simulated Experience Track  
> *Design Language:* Warm Editorial Lifestyle Interface (Warm Ivory, Muted Sage, Soft Terracotta)  
> *Technology Stack:* 100% Vanilla HTML5, CSS3, ES6+ JavaScript (Zero external frameworks, build tools, or paid AI APIs)

---

## 1. Problem & Intended Users

### The Problem
In multi-member families and busy households, the 5:00 PM to 7:30 PM evening window is frequently chaotic:
- **Dinner Uncertainty:** Scrambling to decide what to cook with available pantry staples before sports practices or evening meetings.
- **Disconnected Groceries:** Missing ingredients aren't identified until cooking starts, triggering frantic last-minute store runs or disorganized delivery orders.
- **Delivery Service Friction:** Trying to handoff a handwritten or fragmented recipe list into delivery storefronts without clear category organization or price estimates.
- **Unequal Household Burden:** Evening prep tasks fall disproportionately on one person or get missed altogether.

### Intended Users
Busy families, working couples, and shared households who want a calm, human, lifestyle-oriented assistant to coordinate dinner, groceries, delivery handoffs, and prep chores seamlessly from desktop, tablet, or phone without juggling multiple disconnected apps.

---

## 2. What HomeFlow 2.1 Does

**HomeFlow** is an ambient household coordination agent designed with a warm, editorial lifestyle aesthetic. It operates across four core household domains:
1. **Dinner Planning & Adaptive Replanning:** Formulates recipes that match current pantry inventory and adapts dynamically to dietary changes (vegetarian, gluten-free) or evening schedule delays.
2. **Smart Shopping List:** Groups items by grocery department, estimates individual item costs and total cart expense, and tracks purchased state.
3. **Grocery Delivery Handoff (New in 2.1):** Consolidates needed ingredients with quantities, estimated costs, and planned meal references. Allows users to select items, copy formatted lists to the clipboard, and handoff to external delivery services (Amazon Fresh, Instacart, Target Shipt, Walmart Grocery).
4. **Task Coordination:** Splits preparation tasks fairly across family members, tracks durations, and calculates completion progress.
5. **Persistent Quick-Access Assistant (New in 2.1):** A floating launcher and accessible drawer (desktop side drawer / mobile bottom sheet) accessible from every section of the application.

> **Simulation & Integration Transparency Disclaimer:** HomeFlow is a deterministic browser-based prototype created for hackathon demonstration. It simulates the agentic behavior, tool invocation patterns, and state synchronization of an Alexa+ assistant without connecting to real Alexa services, AWS accounts, or external AI APIs.  
> **Delivery Integrations:** HomeFlow provides a transparent **manual handoff experience** (copying the formatted checklist and opening the official merchant storefront). It does **not** scrape websites, store payment information, inject live carts, or automate purchases.

---

## 3. The Cozy Editorial Design System

HomeFlow rejects generic dark AI dashboards in favor of a warm, human, thoughtfully crafted aesthetic inspired by *Kinfolk* and *NYT Cooking*:
- **Color Palette (CSS Variables):**
  - *Main Background:* Warm Ivory (`#F8F6F0`)
  - *Main Surface:* Soft White (`#FFFDF9`)
  - *Primary Text:* Warm Charcoal (`#34372F`)
  - *Secondary Text:* Muted Gray-Brown (`#77786F`)
  - *Primary Accent:* Muted Sage (`#78866A`) & Pale Sage (`#E9EDE3`)
  - *Secondary Accent:* Muted Terracotta (`#C48269`)
  - *Borders:* Warm Beige (`#E8E2D7`)
- **Typography:**
  - *Headings:* Editorial serif (`Newsreader`, `Georgia`, serif) for warmth and elegance.
  - *Body & Controls:* Clean, legible sans-serif (`Plus Jakarta Sans`, system sans-serif).
- **Layout & Responsiveness:**
  - **Desktop (1024px+):** Left sidebar navigation, centered max-width content container, hero recipe card, two-column lifestyle grid, floating action button (`Ask HomeFlow 💬`), and side drawer assistant.
  - **Tablet (768px):** Balanced layout, touch-friendly checklist controls, and side drawer.
  - **Mobile (360px & 390px):** Single-column flow, sticky top greeting, persistent mobile bottom navigation bar (`Today`, `Dinner`, `Groceries`, `Handoff`, `Tasks`, `Assistant`), touch targets $\ge 44\text{px}$, accessible slide-up bottom sheet assistant, and zero horizontal page overflow.

---

## 4. Supported Agent Workflows & Intents

HomeFlow implements a deterministic word-boundary intent router supporting six primary workflows:

### Workflow 1: Dinner Planning
* **Example Prompt:** `"Plan a simple dinner for four tonight and check what's missing."`
* **Tools Called:** `getPantry()`, `getCalendar()`, `updateShoppingList()`, `saveDinnerPlan()`.
* **Behavior:** Cross-references 8 in-stock pantry items with family schedules (Maya's 6:30 PM soccer return) to formulate a 35-minute meal (*"Rustic Garlic-Herb Penne with Fresh Greens & Crusty Bread"*), identifies 4 missing ingredients with estimated costs, and updates household state.

### Workflow 2: Grocery Preparation
* **Example Prompt:** `"Show my shopping list and organize what I need to buy."`
* **Tools Called:** `getShoppingList()`.
* **Behavior:** Reads active items, organizes them by supermarket department (*Produce*, *Dairy & Refrigerated*, *Pantry & Seasonings*, *Bakery & Bread*), and calculates estimated costs.

### Workflow 3: Household Task Coordination
* **Example Prompt:** `"Divide tonight's dinner preparation tasks."`
* **Tools Called:** `getHouseholdMembers()`, `getTasks()`, `assignTask()`.
* **Behavior:** Assigns age- and schedule-appropriate tasks to Alex (garlic & salad prep), Sam (lead pasta cooking), Maya (bread & table setting), and Jordan (drinks & napkins) without duplication.

### Workflow 4: Grocery Delivery Handoff (New in 2.1)
* **Example Prompt:** `"Prepare delivery handoff for Instacart"` or `"Order groceries on Amazon Fresh"`.
* **Tools Called:** `getShoppingList()`, `deliveryHandoff(serviceId, items)`.
* **Behavior:** Consolidates needed items, calculates total cart cost, copies formatted text to clipboard, and opens the official merchant storefront in a new tab.

### Workflow 5: Dietary Preference Adaptation (New in 2.1)
* **Example Prompt:** `"Make tonight's dinner vegetarian"` or `"Can we make it gluten-free?"`.
* **Tools Called:** `getPantry()`, `updateShoppingList()`, `saveDinnerPlan()`.
* **Behavior:** Adapts the active recipe (e.g. Vegetarian Rustic Penne with Roasted Pine Nuts or Gluten-Free Brown Rice Penne), updates grocery requirements, and synchronizes state.

### Workflow 6: Schedule Delay & Timing Adaptation (New in 2.1)
* **Example Prompt:** `"Maya's soccer is delayed, can we have dinner later at 7:45 PM?"`.
* **Tools Called:** `getCalendar()`, `updateCalendar({ targetDinnerTime: '7:45 PM' })`.
* **Behavior:** Adjusts family calendar deadlines, updates dinner card schedule notes, and reschedules prep timelines.

---

## 5. Tool Architecture & Integration Adapter

HomeFlow features a discrete, modular JavaScript tool system:

```
[ User Input / FAB / Bottom Nav ]
              │
              ▼
    [ Word-Boundary Intent Router ]
              │
    ┌─────────┼──────────────────────────────┐
    ▼         ▼                              ▼
[Dinner]  [Groceries & Handoff]           [Tasks & Schedule]
    │         │                              │
    └─────────┼──────────────────────────────┘
              ▼
   [ Discrete Tool Dispatcher ]
      ├── getPantry()
      ├── updatePantry(items)           <-- Auto-restocks on confirmed purchase
      ├── getCalendar()
      ├── updateCalendar(updates)       <-- Adapts to evening delays
      ├── getShoppingList()
      ├── updateShoppingList(items)
      ├── confirmPurchasedItems(ids)    <-- Moves purchased items to pantry
      ├── getHouseholdMembers()
      ├── getTasks()
      ├── assignTask(task)
      ├── saveDinnerPlan(plan)
      └── deliveryHandoff(service, items)
              │
              ▼
    [ Delivery Integration Adapter (Configurable) ]
      ├── Amazon Fresh: external_handoff (Official Web)
      ├── Instacart: external_handoff (Official Web)
      ├── Target / Shipt: external_handoff (Official Web)
      ├── Walmart Grocery: external_handoff (Official Web)
      └── Direct Cart Sync: not_connected (Explicit status)
              │
              ▼
   [ State Persistence ] ── localStorage ('homeflow_household_state_v1')
              │
              ▼
    [ Synchronized Reactive UI ]
      ├── Hero Recipe Lifestyle Card
      ├── Smart Shopping List & Handoff Card
      ├── Persistent Assistant Drawer & Floating FAB
      ├── Mobile Bottom Navigation Bar
      └── "How your plan came together" Activity Accordion
```

### Integration Status Representation
In strict compliance with transparency guidelines:
* **`available`**: Features execute locally in the browser runtime (e.g. pantry updates, list grouping, clipboard generation).
* **`external_handoff`**: Prepares formatted text and redirects the user to the merchant's official storefront.
* **`not_connected`**: Displayed for future direct API integrations that require OAuth partner access. Never claims a live connection when not connected.

---

## 6. Technologies Used

* **HTML5:** Semantic elements (`<aside>`, `<main>`, `<section>`, `<article>`, `<details>`, `<nav>`, `<dialog>`), ARIA live regions, viewport cover meta tag, and accessible form controls.
* **Vanilla CSS3:** Custom design tokens, CSS Grid & Flexbox, responsive media queries (360px, 390px, 768px, 1024px+), iOS safe-area inset handling (`env(safe-area-inset-bottom)`), and $\ge 44\text{px}$ touch target compliance.
* **Vanilla ES6+ JavaScript:** Async/await workflows, unified chat rendering, clipboard API integration, and resilient `localStorage` serialization.
* **No Dependencies:** Zero external frameworks, zero Node.js server dependencies, zero build systems, zero API keys.

---

## 7. How to Run Locally

### Option 1: Direct Browser Open (Simplest)
1. Navigate to the project directory: `c:\Users\hp\Desktop\ADH\`.
2. Double-click `index.html` (or right-click &rarr; *Open With* &rarr; *Google Chrome*, *Microsoft Edge*, *Mozilla Firefox*, or *Safari*).
3. The application will initialize immediately with seeded demo data.

### Option 2: Lightweight Local Server
```bash
# Using Python 3:
python -m http.server 8000

# Or using Node.js:
npx serve .
```
Then visit `http://localhost:8000` in your browser.

---

## 8. How to Test Each Feature

1. **Test Workflow 1 (Dinner Planning):**
   * Click prompt chip: **`Plan dinner for 4 & check pantry`** (or type `"Plan dinner tonight"`).
   * Notice the recipe card updates with prep time, servings, pantry matches, and missing items.
2. **Test Feature A (Grocery Delivery Handoff & Pantry Move):**
   * Scroll to the **Order Groceries** card (or click **Handoff** in the navigation).
   * Notice items are grouped by category with quantities, estimated costs, and planned meal tags.
   * Click **Copy List** &rarr; verify the clipboard notification.
   * Check 2 items and click **Move to Pantry** &rarr; notice items are marked as purchased and moved to the pantry!
   * Click **Pantry & Schedule** in the sidebar to verify the new items appear as *"In Stock"* in the pantry modal.
   * Select a delivery service (e.g., *Amazon Fresh* or *Instacart*) and click **Open Service** &rarr; verifies external handoff without claiming direct checkout automation.
3. **Test Feature B (Quick-Access Assistant):**
   * On desktop: Click the floating **Ask HomeFlow 💬** button or sidebar **Quick Assistant** button.
   * On mobile: Tap **Assistant** in the bottom navigation bar.
   * Verify the drawer/bottom sheet opens smoothly, retains full conversation history, accepts questions, and updates state across the entire page.
4. **Test Feature D (Mobile-First Responsiveness):**
   * Open Developer Tools (`F12`), toggle device toolbar, and test at **360px** (Galaxy S8), **390px** (iPhone 12/13/14), **768px** (iPad Mini), and desktop.
   * Verify the sticky bottom navigation bar appears on mobile, touch targets are comfortable, and there is zero horizontal page scrolling.
5. **Test Persistence & Reset:**
   * Refresh the page (`F5`) &rarr; confirm all dinner plans, handoff selections, and pantry updates remain intact.
   * Click **Reset Demo** &rarr; confirm to restore clean initial seeds.

---

## 9. Automated Testing Summary

Automated test suites (`test_homeflow21.js` and `check_ids.js`) were executed via Node.js v24:
* **Tool Functions & Logic:** `getPantry()`, `updatePantry()`, `getCalendar()`, `updateCalendar()`, `getShoppingList()`, `updateShoppingList()`, `confirmPurchasedItems()`, `assignTask()`, `saveDinnerPlan()`, `deliveryHandoff()`.
* **Delivery Handoff Adapter:** Verified service configurations, clipboard formatting, estimated cost calculation ($7.38 for sample items), and explicit status labels.
* **Pantry Updates on Purchase:** Confirmed that purchasing an item removes it from pending groceries and restocks it into the household pantry.
* **Intent Routing:** 100% pass rate across dinner, grocery, task, handoff, dietary, and schedule adjustment queries.
* **DOM Integration:** Verified all 55 element IDs in `script.js` exist in `index.html`.

---

## 10. License

This project is licensed under the [MIT License](LICENSE).
