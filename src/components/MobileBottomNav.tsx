import React from 'react';
import {
  Home,
  Sliders,
  Layers,
  UtensilsCrossed,
  ShoppingCart,
  CheckSquare
} from 'lucide-react';
import { ActiveTab } from '../types';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab
}) => {
  const tabs = [
    { id: 'dashboard' as ActiveTab, label: 'Home', icon: Home },
    { id: 'devices' as ActiveTab, label: 'Devices', icon: Sliders },
    { id: 'scenes' as ActiveTab, label: 'Scenes', icon: Layers },
    { id: 'meals' as ActiveTab, label: 'Meals', icon: UtensilsCrossed },
    { id: 'groceries' as ActiveTab, label: 'Groceries', icon: ShoppingCart },
    { id: 'tasks' as ActiveTab, label: 'Tasks', icon: CheckSquare },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-nature-card/95 backdrop-blur-md border-t border-nature-border px-2 py-1 safe-area-pb shadow-lg">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 min-w-[50px] min-h-[48px] rounded-xl transition-all ${
                isActive
                  ? 'text-nature-dark font-semibold'
                  : 'text-nature-muted hover:text-nature-text'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-colors ${
                  isActive ? 'bg-nature-sage text-nature-dark' : ''
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
