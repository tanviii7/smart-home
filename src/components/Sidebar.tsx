import React from 'react';
import {
  Home,
  Sliders,
  Layers,
  UtensilsCrossed,
  ShoppingCart,
  CheckSquare,
  Sparkles,
  Settings,
  Leaf
} from 'lucide-react';
import { ActiveTab, AppSettings } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  settings: AppSettings;
  unreadCount?: number;
  openAssistantDrawer: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  settings,
  openAssistantDrawer
}) => {
  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Home', icon: Home },
    { id: 'devices' as ActiveTab, label: 'Devices', icon: Sliders },
    { id: 'scenes' as ActiveTab, label: 'Scenes', icon: Layers },
    { id: 'meals' as ActiveTab, label: 'Meals', icon: UtensilsCrossed },
    { id: 'groceries' as ActiveTab, label: 'Groceries', icon: ShoppingCart },
    { id: 'tasks' as ActiveTab, label: 'Tasks & Reminders', icon: CheckSquare },
    { id: 'assistant' as ActiveTab, label: 'AI Assistant', icon: Sparkles },
    { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-nature-surface/60 border-r border-nature-border select-none backdrop-blur-sm z-30">
      {/* Brand & Household */}
      <div className="p-6 border-b border-nature-border/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-nature-primary text-white flex items-center justify-center shadow-soft">
            <Leaf className="w-5 h-5 text-nature-sage" />
          </div>
          <div>
            <span className="font-serif text-xl font-semibold tracking-tight text-nature-dark block leading-tight">
              Smart Home
            </span>
            <span className="text-xs text-nature-muted truncate max-w-[140px] block font-medium">
              {settings.householdName}
            </span>
          </div>
        </div>

        {/* Demo Mode status indicator pill */}
        <div className="mt-4 flex items-center justify-between px-3 py-1.5 rounded-lg bg-nature-sage/40 border border-nature-sage/70 text-xs">
          <span className="flex items-center gap-1.5 text-nature-dark font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Simulated Demo Bus
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-nature-muted bg-white/70 px-1.5 py-0.5 rounded">
            Matter
          </span>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-nature-card text-nature-dark shadow-soft font-semibold border border-nature-border/80'
                  : 'text-nature-text/80 hover:bg-nature-sage/30 hover:text-nature-dark'
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-nature-primary' : 'text-nature-muted'
                }`}
              />
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === 'assistant' && (
                <span className="text-[10px] bg-nature-peach/70 text-amber-900 px-1.5 py-0.5 rounded-full font-semibold">
                  Alexa+
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Assistant Callout Card */}
      <div className="p-4 m-3 rounded-2xl bg-gradient-to-br from-nature-card to-nature-sage-light border border-nature-border shadow-soft">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-4 h-4 text-nature-primary" />
          <span className="text-xs font-semibold text-nature-dark">Ask Assistant</span>
        </div>
        <p className="text-xs text-nature-muted leading-relaxed mb-3">
          "Turn off living room lights" or "Plan dinners for 5 days"
        </p>
        <button
          onClick={openAssistantDrawer}
          className="w-full py-2 px-3 rounded-xl bg-nature-primary hover:bg-nature-primary-hover text-white text-xs font-medium transition-all shadow-soft flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Open Chat Drawer
        </button>
      </div>

      {/* Footer / System status */}
      <div className="px-6 py-4 border-t border-nature-border/60 text-[11px] text-nature-muted flex items-center justify-between">
        <span>Smart Home v1.0</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-nature-primary"></span>
          Ready
        </span>
      </div>
    </aside>
  );
};
