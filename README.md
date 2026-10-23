# Smart Home — AI Assistant

> **A calm, intelligent personal smart home management application inspired by Amazon Alexa and Alexa+.**  
> Built with React 18, TypeScript, Vite, Tailwind CSS, and a nature-inspired warm editorial design system.

---

## 1. Product Overview

**Smart Home** coordinates everyday household activities from one unified, peaceful interface. It seamlessly bridges:

- **Smart Device Control:** Stateful lighting, climate thermostats, ceiling fans, smart plugs, and entertainment devices with room filters.
- **Home Themes & Scenes:** One-touch presets (*Morning Routine*, *Relax & Unwind*, *Movie Night*, *Away Mode*, *Good Night*) that execute real multi-device state changes.
- **AI Meal Planning:** Weekly 7-day calendar with breakfast, lunch, dinner, and snack slots; verified recipes with prep times and dietary preferences (Mediterranean, Vegetarian, High-Protein, Vegan, Gluten-Free); and 1-click grocery synchronization with smart deduplication.
- **Groceries & Pantry Inventory:** Shopping list with department categorization, progress bars, delivery handoff for Amazon Fresh and Instacart; alongside a pantry inventory tracker with low-stock alerts and 1-click restocking.
- **Cleaning Schedules & Household Routines:** Tasks organized by Today, Upcoming, Overdue, and Completed; priority tags; family member assignment; and recurring schedules (daily, weekly, bi-weekly, monthly) with automatic next-occurrence calculation upon completion.
- **Conversational AI Assistant (Smart Home Assistant):** Available everywhere via a persistent slide-out drawer or full-page view, backed by a 14-tool orchestration layer, visual tool audit trails, and safety confirmations for consequential actions.
- **Settings & Integration Transparency:** Household customization, room manager, dietary settings, unit preferences (°F/°C), honest simulated device status, and demo data reset.

---

## 2. Visual Design System

Designed around a warm, minimal, nature-inspired lifestyle palette (avoiding harsh dark neon dashboards in favor of an elegant, serene atmosphere):

| Element | Color Hex | Role |
| :--- | :--- | :--- |
| **Main Background** | `#FAF8F2` | Warm off-white canvas |
| **Secondary Surface** | `#F1EADF` | Subdued grouping surfaces & pill backgrounds |
| **Card Surface** | `#FFFFFF` | Crisp elevated cards with soft shadows |
| **Sage Light / Accent** | `#DCE7D8` / `#EEF3EC` | Active states, subtle badges, and highlights |
| **Primary Green** | `#7B9274` | Primary brand accent and interactive buttons |
| **Dark Green** | `#445B46` | Contrast headings and active indicator pills |
| **Soft Peach** | `#F4E1D7` | Warm dietary badges and ambient accents |
| **Soft Lavender** | `#E9E7F2` | Subtle secondary highlights |
| **Primary Text** | `#343A34` | High-contrast readable typography |
| **Muted Text** | `#777D74` | Secondary labels, timestamps, and subtitles |
| **Borders** | `#E8E4DA` | Fine, soft borders |

Typography combines **Newsreader** (warm editorial serif for headings) with **Plus Jakarta Sans** (clean, accessible sans-serif for UI controls).

---

## 3. Technology Stack & Architecture

- **Framework:** React 18 with TypeScript 5
- **Bundler & Dev Server:** Vite 6
- **Styling:** Tailwind CSS with custom design tokens and `@tailwindcss/typography`
- **Icons:** `lucide-react`
- **Data Persistence:** Client-side Repository Pattern with `localStorage` fallback, real-time subscriber events (`subscribeToStorage`), and full initial seed data.
- **Device Service Layer:** `IDeviceService` interface decoupling simulated demo hardware from potential future Home Assistant / Matter / Zigbee bridges.
- **AI Tool Orchestration:** 14 validated tools with strict input schemas, execution audit logging, and two operational modes:
  1. **Deterministic Local Intent Router (Default):** Zero latency, zero cost, completely offline in-browser matching.
  2. **Google Gemini API Integration (Optional):** Live Gemini 2.5 Flash reasoning with function calling against the local application bus.

---

## 4. Validated AI Application Tools

The assistant does not pretend or hallucinate state; every action runs through validated application services:

| Tool Name | Parameters | Action Outcome |
| :--- | :--- | :--- |
| `get_home_status` | *(None)* | Compiles active device counts, temperature, tonight's dinner, pending tasks, and grocery count. |
| `list_rooms_and_devices` | `room`, `category` | Queries devices filtered by room name or device category. |
| `control_device` | `deviceId`, `power`, `brightness`, `targetTemperature`, `fanSpeed` | Modifies device state with immediate UI synchronization. |
| `activate_scene` | `sceneName` | Applies multi-device target states defined in the scene. |
| `create_scene` | `name`, `description`, `icon` | Registers a new custom scene in the household profile. |
| `generate_meal_plan` | `preference`, `daysCount` | Generates a 5-day or 7-day dinner plan matching dietary requirements. |
| `get_meal_plan` | `day` | Retrieves today's or weekly recipes and ingredients. |
| `update_meal_plan` | `dayOfWeek`, `mealType`, `recipeTitle` | Replaces or updates a meal slot in the weekly calendar. |
| `get_pantry_inventory` | `filter` (`all`, `low_stock`, `in_stock`) | Checks pantry inventory levels and low-stock warnings. |
| `add_shopping_item` | `name`, `quantity`, `category` | Adds an item to the grocery list with deduplication. |
| `update_shopping_item` | `itemName`, `completed` | Marks a shopping item as purchased or unchecks it. |
| `create_household_task` | `title`, `category`, `priority`, `dueDate`, `recurrence` | Schedules a new chore or reminder. |
| `list_upcoming_tasks` | `filter` (`today`, `upcoming`, `all`) | Lists chores filtered by date and completion status. |
| `update_task_status` | `taskTitleOrId`, `completed` | Toggles chore completion and calculates next recurrence. |

### Consequential Action Confirmations
Sensitive actions (such as activating **Away Mode** to power down the entire home or resetting household data) prompt the user with an interactive confirmation card before executing.

---

## 5. Real vs. Simulated Capabilities (Transparency)

In compliance with the design principles:
- **Simulated Demo Devices:** All lights, thermostats, fans, smart plugs, and televisions are explicitly labeled as **Demo Devices** on the Simulated Matter Bus. They execute real state changes in application storage, update the UI instantaneously, and respond to scenes and voice commands.
- **Delivery Handoff:** For groceries, a transparent **Manual Handoff** flow copies the formatted checklist to the clipboard for pasting into Amazon Fresh or Instacart. The app does not pretend to charge cards or place fake external orders.
- **Local Persistence:** All state (rooms, devices, scenes, meal plans, pantry inventory, shopping items, and tasks) persists across page reloads via `localStorage`.

---

## 6. Getting Started

### Prerequisites
- Node.js (v18 or newer; v24 recommended)
- npm or pnpm

### Installation

```bash
# Clone or navigate to the project directory
cd ADH

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
```

The production assets will be built to the `dist/` directory.

### Optional Google Gemini Integration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Or simply open **Settings** inside the application and paste your Google Gemini API key into the AI Provider section.

---

## 7. Verification of Acceptance Tests

- **Workflow A (Device Control):** Navigating to Devices, toggling the Living Room Pendant on/off updates its state immediately on the card, on the Home Dashboard, and inside the Assistant status tool.
- **Workflow B (Scene Activation):** Clicking "Activate" on *Movie Night* dims the living room lights, turns off kitchen lighting, and powers on the OLED TV.
- **Workflow C (Meal Planning):** Clicking "Generate Weekly Plan" or swapping a recipe updates the weekly calendar; reloading preserves the exact schedule.
- **Workflow D (Groceries):** Adding an item or clicking "Add Ingredients to Groceries" merges ingredients into the shopping list without duplicating, updates category counts and the progress bar.
- **Workflow E (Household Tasks):** Marking a recurring task (e.g. Daily kitchen cleaning) as completed immediately calculates the next due date (+1 day) and schedules the new task.
- **Workflow F (AI Assistant):** Typing *"Turn off all living room lights"* or *"Plan my dinners for the next five days"* invokes validated tools with an audit trail and updates real application state.
- **Workflow G (Responsive Layout):** Responsive across desktop (left sidebar), tablet, and mobile (bottom navigation bar, compact header, and slide-up assistant drawer).

---

## 8. License
MIT License.
