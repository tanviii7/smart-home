import React from 'react';
import { Leaf, Sparkles, Settings as SettingsIcon } from 'lucide-react';
import { ActiveTab, AppSettings } from '../types';

interface MobileHeaderProps {
  settings: AppSettings;
  onOpenAssistant: () => void;
  onSelectTab: (tab: ActiveTab) => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  settings,
  onOpenAssistant,
  onSelectTab
}) => {
  return (
    <header className="lg:hidden sticky top-0 z-20 bg-nature-bg/95 backdrop-blur-md border-b border-nature-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-nature-primary text-white flex items-center justify-center shadow-soft">
          <Leaf className="w-4 h-4 text-nature-sage" />
        </div>
        <div>
          <span className="font-serif text-base font-semibold text-nature-dark leading-none block">
            Smart Home
          </span>
          <span className="text-[11px] text-nature-muted font-medium block">
            {settings.householdName}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenAssistant}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-nature-card border border-nature-border text-xs font-medium text-nature-dark shadow-soft active:scale-95 transition-transform"
          aria-label="Open AI Assistant"
        >
          <Sparkles className="w-3.5 h-3.5 text-nature-primary" />
          <span>Assistant</span>
        </button>

        <button
          onClick={() => onSelectTab('settings')}
          className="p-2 rounded-full hover:bg-nature-sage/30 text-nature-muted active:scale-95 transition-transform"
          aria-label="Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
