import React, { useState } from 'react';
import {
  ShoppingCart,
  Package,
  Plus,
  Trash2,
  CheckCircle2,
  Copy,
  X
} from 'lucide-react';
import { ShoppingListItem, PantryItem, ShoppingCategory } from '../types';
import { StorageRepository } from '../services/storage';
import { useToast } from '../context/ToastContext';

interface GroceriesViewProps {
  shoppingList: ShoppingListItem[];
  pantryItems: PantryItem[];
  onRefreshData: () => void;
}

const CATEGORIES: ShoppingCategory[] = [
  'Fruits & Vegetables',
  'Dairy',
  'Grains & Bakery',
  'Pantry Staples',
  'Snacks',
  'Beverages',
  'Cleaning Supplies',
  'Personal Care',
  'Other'
];

export const GroceriesView: React.FC<GroceriesViewProps> = ({
  shoppingList,
  pantryItems,
  onRefreshData
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'shopping' | 'pantry'>('shopping');

  // Shopping List filter: 'all' | 'remaining' | 'purchased'
  const [shoppingFilter, setShoppingFilter] = useState<'all' | 'remaining' | 'purchased'>('remaining');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modals
  const [isAddShoppingModalOpen, setIsAddShoppingModalOpen] = useState(false);
  const [isAddPantryModalOpen, setIsAddPantryModalOpen] = useState(false);

  // Form states for shopping item
  const [shopName, setShopName] = useState('');
  const [shopQty, setShopQty] = useState('');
  const [shopCat, setShopCat] = useState<ShoppingCategory>('Pantry Staples');
  const [shopNote, setShopNote] = useState('');

  // Form states for pantry item
  const [pantryName, setPantryName] = useState('');
  const [pantryQty, setPantryQty] = useState('');
  const [pantryCat, setPantryCat] = useState<ShoppingCategory>('Pantry Staples');
  const [pantryStatus, setPantryStatus] = useState<'In Stock' | 'Low Stock'>('In Stock');

  // Shopping list metrics
  const totalItems = shoppingList.length;
  const purchasedItems = shoppingList.filter((i) => i.completed);
  const remainingItems = shoppingList.filter((i) => !i.completed);
  const percentComplete = totalItems > 0 ? Math.round((purchasedItems.length / totalItems) * 100) : 0;

  // Filter shopping list
  const filteredShopping = shoppingList.filter((item) => {
    if (shoppingFilter === 'remaining' && item.completed) return false;
    if (shoppingFilter === 'purchased' && !item.completed) return false;
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    return true;
  });

  // Filter pantry items
  const filteredPantry = pantryItems.filter((item) => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    return true;
  });

  const lowStockPantry = pantryItems.filter((p) => p.status === 'Low Stock' || p.status === 'Out of Stock');

  const handleToggleShopItem = (item: ShoppingListItem) => {
    StorageRepository.updateShoppingItem(item.id, { completed: !item.completed });
    onRefreshData();
  };

  const handleDeleteShopItem = (id: string) => {
    StorageRepository.deleteShoppingItem(id);
    onRefreshData();
  };

  const handleClearCompleted = () => {
    StorageRepository.clearCompletedShoppingItems();
    showToast('Cleared checked items from shopping list', 'info');
    onRefreshData();
  };

  const handleAddShoppingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) return;

    StorageRepository.addShoppingItem({
      name: shopName.trim(),
      quantity: shopQty.trim() || '1 item',
      category: shopCat,
      completed: false,
      notes: shopNote.trim() || undefined
    });

    showToast(`Added ${shopName} to shopping list`, 'success');
    setShopName('');
    setShopQty('');
    setShopNote('');
    setIsAddShoppingModalOpen(false);
    onRefreshData();
  };

  const handleAddPantrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pantryName.trim()) return;

    StorageRepository.addPantryItem({
      name: pantryName.trim(),
      quantity: pantryQty.trim() || '1 unit',
      category: pantryCat,
      status: pantryStatus
    });

    showToast(`Added ${pantryName} to pantry`, 'success');
    setPantryName('');
    setPantryQty('');
    setIsAddPantryModalOpen(false);
    onRefreshData();
  };

  const handleTogglePantryStatus = (item: PantryItem) => {
    const nextStatus = item.status === 'In Stock' ? 'Low Stock' : 'In Stock';
    StorageRepository.updatePantryItem(item.id, { status: nextStatus });
    showToast(`${item.name} marked as ${nextStatus}`, 'info');
    onRefreshData();
  };

  const handleDeletePantry = (id: string) => {
    StorageRepository.deletePantryItem(id);
    onRefreshData();
  };

  // 1-Click transfer low-stock pantry items to shopping list
  const handleAddLowStockToShopping = () => {
    if (lowStockPantry.length === 0) return;
    const ingredients = lowStockPantry.map((p) => ({
      name: p.name,
      quantity: '1 restock package',
      category: p.category,
      note: 'Added from low-stock pantry'
    }));

    const res = StorageRepository.addIngredientsToShoppingList(ingredients, 'Pantry Restock');
    showToast(`Added ${res.added} low-stock items to your shopping list`, 'success');
    onRefreshData();
  };

  // Copy shopping list to clipboard for delivery handoff (Amazon Fresh / Instacart)
  const handleCopyShoppingList = () => {
    if (remainingItems.length === 0) {
      showToast('No unbought items to copy', 'info');
      return;
    }
    const lines = [
      `🛒 Smart Home Grocery List (${remainingItems.length} items):`,
      ...remainingItems.map((i) => `• ${i.name} — ${i.quantity} (${i.category})`)
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    showToast('Shopping list copied to clipboard!', 'success');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl font-semibold text-nature-dark">
              Groceries & Pantry
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-nature-sage/60 text-nature-dark font-medium border border-nature-border">
              Synchronized
            </span>
          </div>
          <p className="text-sm text-nature-muted mt-0.5">
            Keep track of needed grocery items and pantry inventory
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex p-1 rounded-2xl bg-nature-surface border border-nature-border self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('shopping')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'shopping'
                ? 'bg-nature-card text-nature-dark shadow-soft'
                : 'text-nature-muted hover:text-nature-dark'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 text-nature-primary" />
            <span>Shopping List ({remainingItems.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('pantry')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'pantry'
                ? 'bg-nature-card text-nature-dark shadow-soft'
                : 'text-nature-muted hover:text-nature-dark'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-nature-primary" />
            <span>Pantry ({pantryItems.length})</span>
          </button>
        </div>
      </div>

      {/* SHOPPING LIST TAB CONTENT */}
      {activeTab === 'shopping' && (
        <div className="space-y-5">
          {/* Progress Bar & Actions Bar */}
          <div className="p-5 rounded-3xl bg-nature-card border border-nature-border shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <span className="text-nature-dark">
                  Shopping Progress: {purchasedItems.length} of {totalItems} items checked
                </span>
                <span className="text-nature-primary font-bold">{percentComplete}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-nature-surface overflow-hidden">
                <div
                  className="h-full bg-nature-primary rounded-full transition-all duration-300"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopyShoppingList}
                className="px-3.5 py-2 rounded-xl bg-nature-surface hover:bg-nature-sage/40 text-nature-dark text-xs font-medium flex items-center gap-1.5 border border-nature-border transition-colors"
                title="Copy checklist for Amazon Fresh or Instacart"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy for Delivery</span>
              </button>

              <button
                onClick={handleClearCompleted}
                disabled={purchasedItems.length === 0}
                className="px-3.5 py-2 rounded-xl bg-nature-surface hover:bg-red-50 text-nature-muted hover:text-red-700 disabled:opacity-40 text-xs font-medium flex items-center gap-1.5 border border-nature-border transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Checked</span>
              </button>

              <button
                onClick={() => setIsAddShoppingModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-nature-primary hover:bg-nature-primary-hover text-white text-xs font-medium shadow-soft transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1.5 bg-nature-surface/80 p-1 rounded-xl border border-nature-border text-xs">
              {(['remaining', 'all', 'purchased'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setShoppingFilter(filter)}
                  className={`px-3 py-1 rounded-lg capitalize font-medium transition-all ${
                    shoppingFilter === filter
                      ? 'bg-nature-card text-nature-dark font-semibold shadow-soft'
                      : 'text-nature-muted hover:text-nature-text'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1 max-w-full scrollbar-none">
              {['All', ...CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-nature-sage text-nature-dark font-semibold'
                      : 'text-nature-muted hover:bg-nature-surface'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Items List */}
          {filteredShopping.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-nature-card border border-nature-border">
              <CheckCircle2 className="w-8 h-8 text-nature-primary mx-auto mb-2" />
              <h3 className="font-serif text-lg font-semibold text-nature-dark">
                No items to display
              </h3>
              <p className="text-xs text-nature-muted mt-1">
                Your shopping list is clear or no items match the current filters.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredShopping.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleShopItem(item)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    item.completed
                      ? 'bg-nature-bg/70 border-nature-border/60 opacity-60'
                      : 'bg-nature-card border-nature-border hover:border-nature-primary/40 shadow-soft'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-nature-primary focus:ring-nature-primary border-nature-border pointer-events-none"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium ${
                            item.completed
                              ? 'line-through text-nature-muted'
                              : 'text-nature-dark'
                          }`}
                        >
                          {item.name}
                        </span>
                        <span className="text-xs text-nature-muted font-medium bg-nature-surface px-2 py-0.5 rounded-md">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-nature-muted mt-0.5">
                        <span>{item.category}</span>
                        {item.addedFromRecipe && (
                          <span>• From: {item.addedFromRecipe}</span>
                        )}
                        {item.notes && <span>• {item.notes}</span>}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteShopItem(item.id);
                    }}
                    className="p-1.5 rounded-lg text-nature-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PANTRY TAB CONTENT */}
      {activeTab === 'pantry' && (
        <div className="space-y-5">
          {/* Top Pantry Actions Banner */}
          <div className="p-5 rounded-3xl bg-nature-card border border-nature-border shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-lg font-semibold text-nature-dark">
                Pantry Inventory ({pantryItems.length} items tracked)
              </h3>
              <p className="text-xs text-nature-muted">
                {lowStockPantry.length > 0
                  ? `⚠️ ${lowStockPantry.length} items are currently flagged as running low.`
                  : 'All tracked staples are currently in stock.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {lowStockPantry.length > 0 && (
                <button
                  onClick={handleAddLowStockToShopping}
                  className="px-4 py-2 rounded-xl bg-nature-sage text-nature-dark hover:bg-nature-sage/80 text-xs font-medium shadow-soft transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Restock Low Items ({lowStockPantry.length})</span>
                </button>
              )}

              <button
                onClick={() => setIsAddPantryModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-nature-primary hover:bg-nature-primary-hover text-white text-xs font-medium shadow-soft transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Pantry Item</span>
              </button>
            </div>
          </div>

          {/* Pantry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPantry.map((item) => {
              const isLow = item.status === 'Low Stock' || item.status === 'Out of Stock';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-3xl border transition-all flex flex-col justify-between ${
                    isLow
                      ? 'bg-amber-50/70 border-amber-200 shadow-soft'
                      : 'bg-nature-card border-nature-border shadow-soft'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm text-nature-dark leading-tight">
                        {item.name}
                      </h4>
                      <button
                        onClick={() => handleTogglePantryStatus(item)}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-colors ${
                          isLow
                            ? 'bg-amber-200 text-amber-900 hover:bg-amber-300'
                            : 'bg-nature-sage text-nature-dark hover:bg-nature-sage/80'
                        }`}
                      >
                        {item.status}
                      </button>
                    </div>

                    <div className="mt-1 text-xs text-nature-muted space-y-0.5">
                      <p>Quantity: <span className="text-nature-dark font-medium">{item.quantity}</span></p>
                      <p>Department: {item.category}</p>
                      {item.notes && <p className="text-[11px] italic">"{item.notes}"</p>}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-nature-border/60 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-nature-muted">
                      Click status badge to toggle
                    </span>
                    <button
                      onClick={() => handleDeletePantry(item.id)}
                      className="p-1 rounded text-nature-muted hover:text-red-600 transition-colors"
                      title="Remove from pantry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Shopping Item Modal */}
      {isAddShoppingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-nature-dark/40 backdrop-blur-xs"
            onClick={() => setIsAddShoppingModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-nature-card rounded-3xl p-6 border border-nature-border shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-semibold text-nature-dark">
                Add Item to Shopping List
              </h2>
              <button
                onClick={() => setIsAddShoppingModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-nature-sage/40 text-nature-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddShoppingSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-nature-dark block mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Sourdough bread, Almond milk"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-nature-border text-sm text-nature-dark focus:border-nature-primary focus:ring-1 focus:ring-nature-primary outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-nature-dark block mb-1">
                  Quantity / Unit
                </label>
                <input
                  type="text"
                  value={shopQty}
                  onChange={(e) => setShopQty(e.target.value)}
                  placeholder="e.g. 1 loaf, 2 cartons, 500g"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-nature-border text-sm text-nature-dark focus:border-nature-primary focus:ring-1 focus:ring-nature-primary outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-nature-dark block mb-1">
                  Category
                </label>
                <select
                  value={shopCat}
                  onChange={(e) => setShopCat(e.target.value as ShoppingCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-nature-border text-sm text-nature-dark focus:border-nature-primary focus:ring-1 focus:ring-nature-primary outline-none bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-nature-dark block mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={shopNote}
                  onChange={(e) => setShopNote(e.target.value)}
                  placeholder="e.g. Organic preferred, Bakery counter"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-nature-border text-sm text-nature-dark focus:border-nature-primary focus:ring-1 focus:ring-nature-primary outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddShoppingModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-nature-muted hover:text-nature-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-nature-primary hover:bg-nature-primary-hover text-white text-xs font-medium shadow-soft transition-all"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Pantry Item Modal */}
      {isAddPantryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-nature-dark/40 backdrop-blur-xs"
            onClick={() => setIsAddPantryModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-nature-card rounded-3xl p-6 border border-nature-border shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-semibold text-nature-dark">
                Add Pantry Staple
              </h2>
              <button
                onClick={() => setIsAddPantryModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-nature-sage/40 text-nature-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPantrySubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-nature-dark block mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  value={pantryName}
                  onChange={(e) => setPantryName(e.target.value)}
                  placeholder="e.g. Extra Virgin Olive Oil, Quinoa"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-nature-border text-sm text-nature-dark focus:border-nature-primary focus:ring-1 focus:ring-nature-primary outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-nature-dark block mb-1">
                  Current Quantity
                </label>
                <input
                  type="text"
                  value={pantryQty}
                  onChange={(e) => setPantryQty(e.target.value)}
                  placeholder="e.g. 750ml bottle, 1kg bag"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-nature-border text-sm text-nature-dark focus:border-nature-primary focus:ring-1 focus:ring-nature-primary outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-nature-dark block mb-1">
                  Category
                </label>
                <select
                  value={pantryCat}
                  onChange={(e) => setPantryCat(e.target.value as ShoppingCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-nature-border text-sm text-nature-dark focus:border-nature-primary focus:ring-1 focus:ring-nature-primary outline-none bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-nature-dark block mb-1">
                  Status
                </label>
                <select
                  value={pantryStatus}
                  onChange={(e) => setPantryStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-nature-border text-sm text-nature-dark focus:border-nature-primary focus:ring-1 focus:ring-nature-primary outline-none bg-white"
                >
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddPantryModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-nature-muted hover:text-nature-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-nature-primary hover:bg-nature-primary-hover text-white text-xs font-medium shadow-soft transition-all"
                >
                  Save to Pantry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
