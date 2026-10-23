import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { ActiveTab } from './types';
import { StorageRepository, subscribeToStorage } from './services/storage';
import { ToastProvider } from './context/ToastContext';
import { Sidebar } from './components/Sidebar';
import { MobileHeader } from './components/MobileHeader';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AssistantDrawer } from './components/AssistantDrawer';
import { AssistantChat } from './components/AssistantChat';
import { Dashboard } from './pages/Dashboard';
import { DevicesView } from './pages/DevicesView';
import { ScenesView } from './pages/ScenesView';
import { MealsView } from './pages/MealsView';
import { GroceriesView } from './pages/GroceriesView';
import { TasksView } from './pages/TasksView';
import { SettingsView } from './pages/SettingsView';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isAssistantDrawerOpen, setIsAssistantDrawerOpen] = useState(false);

  // App data states
  const [devices, setDevices] = useState(() => StorageRepository.getDevices());
  const [rooms, setRooms] = useState(() => StorageRepository.getRooms());
  const [scenes, setScenes] = useState(() => StorageRepository.getScenes());
  const [mealPlan, setMealPlan] = useState(() => StorageRepository.getMealPlan());
  const [shoppingList, setShoppingList] = useState(() => StorageRepository.getShoppingList());
  const [pantryItems, setPantryItems] = useState(() => StorageRepository.getPantry());
  const [tasks, setTasks] = useState(() => StorageRepository.getTasks());
  const [settings, setSettings] = useState(() => StorageRepository.getSettings());

  const refreshAllData = useCallback(() => {
    setDevices(StorageRepository.getDevices());
    setRooms(StorageRepository.getRooms());
    setScenes(StorageRepository.getScenes());
    setMealPlan(StorageRepository.getMealPlan());
    setShoppingList(StorageRepository.getShoppingList());
    setPantryItems(StorageRepository.getPantry());
    setTasks(StorageRepository.getTasks());
    setSettings(StorageRepository.getSettings());
  }, []);

  useEffect(() => {
    // Subscribe to all repository mutations
    const unsubscribe = subscribeToStorage(() => {
      refreshAllData();
    });
    return () => unsubscribe();
  }, [refreshAllData]);

  const handleOpenAssistantWithPrompt = (_prompt: string) => {
    setIsAssistantDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-nature-bg text-nature-text flex flex-col lg:flex-row antialiased selection:bg-nature-sage selection:text-nature-dark">
      {/* Desktop Persistent Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        settings={settings}
        openAssistantDrawer={() => setIsAssistantDrawerOpen(true)}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Header (compact) */}
        <MobileHeader
          settings={settings}
          onOpenAssistant={() => setIsAssistantDrawerOpen(true)}
          onSelectTab={setActiveTab}
        />

        {/* Main Page Body Container */}
        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              devices={devices}
              scenes={scenes}
              mealPlan={mealPlan}
              shoppingList={shoppingList}
              pantryItems={pantryItems}
              tasks={tasks}
              settings={settings}
              onNavigate={setActiveTab}
              onOpenAssistantWithPrompt={handleOpenAssistantWithPrompt}
              onRefreshData={refreshAllData}
            />
          )}

          {activeTab === 'devices' && (
            <DevicesView
              devices={devices}
              rooms={rooms}
              onRefreshData={refreshAllData}
            />
          )}

          {activeTab === 'scenes' && (
            <ScenesView
              scenes={scenes}
              devices={devices}
              onRefreshData={refreshAllData}
            />
          )}

          {activeTab === 'meals' && (
            <MealsView
              mealPlan={mealPlan}
              onRefreshData={refreshAllData}
            />
          )}

          {activeTab === 'groceries' && (
            <GroceriesView
              shoppingList={shoppingList}
              pantryItems={pantryItems}
              onRefreshData={refreshAllData}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              onRefreshData={refreshAllData}
            />
          )}

          {activeTab === 'assistant' && (
            <div className="h-[calc(100vh-140px)] lg:h-[calc(100vh-80px)] rounded-3xl border border-nature-border overflow-hidden shadow-soft">
              <AssistantChat
                isFullPage
                onActionExecuted={refreshAllData}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              rooms={rooms}
              onRefreshData={refreshAllData}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <MobileBottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />
      </div>

      {/* Slide-out / Slide-up Assistant Drawer (Accessible anywhere) */}
      <AssistantDrawer
        isOpen={isAssistantDrawerOpen}
        onClose={() => setIsAssistantDrawerOpen(false)}
        onActionExecuted={refreshAllData}
      />

      {/* Floating Action Button (FAB) for Assistant on Desktop & Tablet when drawer closed */}
      {!isAssistantDrawerOpen && activeTab !== 'assistant' && (
        <button
          onClick={() => setIsAssistantDrawerOpen(true)}
          className="fixed bottom-20 lg:bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-nature-primary hover:bg-nature-primary-hover text-white text-sm font-semibold shadow-soft-lg hover:shadow-2xl transition-all transform hover:-translate-y-0.5 active:scale-95"
          aria-label="Open Smart Home Assistant"
        >
          <Sparkles className="w-4 h-4 text-nature-sage animate-spin-slow" />
          <span className="hidden sm:inline">Ask Assistant</span>
        </button>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;
