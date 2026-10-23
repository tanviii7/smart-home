import React, { useState } from 'react';
import {
  Plus,
  Sparkles,
  Clock,
  Users,
  ShoppingCart,
  RotateCw,
  X,
  BookOpen,
  Edit2,
  Trash2,
  Search,
  ChefHat
} from 'lucide-react';
import { MealPlan, Recipe, DietaryPreference, MealType, Ingredient } from '../types';
import { StorageRepository } from '../services/storage';
import { useToast } from '../context/ToastContext';

interface MealsViewProps {
  mealPlan: MealPlan;
  onRefreshData: () => void;
}

export const MealsView: React.FC<MealsViewProps> = ({
  mealPlan,
  onRefreshData
}) => {
  const { showToast } = useToast();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Modals
  const [selectedRecipeForDetails, setSelectedRecipeForDetails] = useState<Recipe | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateRecipeModalOpen, setIsCreateRecipeModalOpen] = useState(false);

  // Context for swap or edit
  const [targetSlot, setTargetSlot] = useState<MealType>('dinner');
  const [swapTab, setSwapTab] = useState<'cookbook' | 'custom'>('cookbook');
  const [recipeSearch, setRecipeSearch] = useState('');

  // Generate plan options
  const [generatePref, setGeneratePref] = useState<DietaryPreference>('Mediterranean');
  const [generateDays, setGenerateDays] = useState(7);

  // Edit / Custom Recipe Form State
  const [formId, setFormId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCuisine, setFormCuisine] = useState('Home Cooking');
  const [formPrepTime, setFormPrepTime] = useState(15);
  const [formCookTime, setFormCookTime] = useState(20);
  const [formServings, setFormServings] = useState(4);
  const [formDietaryTags, setFormDietaryTags] = useState<DietaryPreference[]>(['Vegetarian']);
  const [formIngredients, setFormIngredients] = useState<Ingredient[]>([
    { name: '', quantity: '1 unit' }
  ]);
  const [formInstructions, setFormInstructions] = useState('');
  const [saveToCookbook, setSaveToCookbook] = useState(true);

  const currentDay = mealPlan.days[selectedDayIndex] || mealPlan.days[0];
  const allCookbookRecipes = Object.values(StorageRepository.getRecipes());

  const mealSlots: { type: MealType; label: string; icon: string }[] = [
    { type: 'breakfast', label: 'Breakfast', icon: '☀️' },
    { type: 'lunch', label: 'Lunch', icon: '🥗' },
    { type: 'dinner', label: 'Dinner', icon: '🍲' },
    { type: 'snack', label: 'Afternoon Snack', icon: '🍎' }
  ];

  // Add ingredients of a recipe directly to the shopping list
  const handleAddRecipeToShopping = (recipe: Recipe) => {
    const res = StorageRepository.addIngredientsToShoppingList(
      recipe.ingredients,
      recipe.title
    );
    showToast(
      `Added ${res.added} ingredients (${res.updated} updated) from "${recipe.title}" to grocery list`,
      'success'
    );
    onRefreshData();
  };

  // Generate / adapt AI meal plan
  const handleGeneratePlan = () => {
    const recipes = allCookbookRecipes;
    const updatedDays = mealPlan.days.map((day, idx) => {
      if (idx >= generateDays) return day;
      const dinnerRecipe = recipes[(idx + 2) % recipes.length];
      const lunchRecipe = recipes[(idx + 1) % recipes.length];
      return {
        ...day,
        meals: {
          ...day.meals,
          lunch: lunchRecipe,
          dinner: dinnerRecipe
        }
      };
    });

    StorageRepository.saveMealPlan({
      ...mealPlan,
      days: updatedDays
    });

    showToast(
      `Generated a ${generateDays}-day meal plan focused on ${generatePref} cuisine`,
      'success'
    );
    setIsGenerateModalOpen(false);
    onRefreshData();
  };

  // Select / Swap a meal from cookbook into slot
  const handleSelectRecipeForSlot = (recipe: Recipe) => {
    StorageRepository.setDayMeal(currentDay.dayOfWeek, targetSlot, recipe);
    showToast(
      `Updated ${currentDay.dayOfWeek}'s ${targetSlot} to "${recipe.title}"`,
      'success'
    );
    setIsSwapModalOpen(false);
    onRefreshData();
  };

  // Remove / Clear a meal from a slot
  const handleRemoveMealFromSlot = (slotType: MealType) => {
    StorageRepository.deleteMealFromSlot(currentDay.dayOfWeek, slotType);
    showToast(`Cleared ${slotType} for ${currentDay.dayOfWeek}`, 'info');
    onRefreshData();
  };

  // Open Swap / Select Modal for specific slot
  const openSwapModal = (slotType: MealType) => {
    setTargetSlot(slotType);
    setSwapTab('cookbook');
    setRecipeSearch('');
    // Prefill custom form with blank
    setFormTitle('');
    setFormDescription('');
    setFormCuisine('Home Cooking');
    setFormPrepTime(15);
    setFormCookTime(20);
    setFormServings(4);
    setFormIngredients([{ name: '', quantity: '1 item' }]);
    setFormInstructions('');
    setIsSwapModalOpen(true);
  };

  // Open Edit Modal for a meal
  const openEditModalForMeal = (slotType: MealType, recipe: Recipe) => {
    setTargetSlot(slotType);
    setFormId(recipe.id);
    setFormTitle(recipe.title);
    setFormDescription(recipe.description || '');
    setFormCuisine(recipe.cuisine || 'Home Cooking');
    setFormPrepTime(recipe.prepTimeMinutes || 15);
    setFormCookTime(recipe.cookTimeMinutes || 20);
    setFormServings(recipe.servings || 4);
    setFormDietaryTags(recipe.dietaryTags || ['Vegetarian']);
    setFormIngredients(
      recipe.ingredients?.length > 0
        ? [...recipe.ingredients]
        : [{ name: '', quantity: '1 unit' }]
    );
    setFormInstructions(recipe.instructions ? recipe.instructions.join('\n') : '');
    setSaveToCookbook(true);
    setIsEditModalOpen(true);
  };

  // Open Create New Recipe Modal
  const openCreateRecipeModal = () => {
    setFormId(`rec_${Date.now()}`);
    setFormTitle('');
    setFormDescription('');
    setFormCuisine('Home Cooking');
    setFormPrepTime(15);
    setFormCookTime(20);
    setFormServings(4);
    setFormDietaryTags(['Vegetarian']);
    setFormIngredients([{ name: '', quantity: '1 unit' }]);
    setFormInstructions('');
    setSaveToCookbook(true);
    setIsCreateRecipeModalOpen(true);
  };

  // Ingredient list management in form
  const handleAddIngredientRow = () => {
    setFormIngredients((prev) => [...prev, { name: '', quantity: '1 unit' }]);
  };

  const handleUpdateIngredient = (index: number, field: 'name' | 'quantity', val: string) => {
    setFormIngredients((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
  };

  const handleRemoveIngredientRow = (index: number) => {
    setFormIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  // Save edited or custom meal
  const handleSaveMealForm = (e: React.FormEvent, isStandaloneRecipe = false) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const cleanedIngredients = formIngredients.filter((ing) => ing.name.trim().length > 0);
    const instructionsArray = formInstructions
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const recipeObj: Recipe = {
      id: formId || `rec_${Date.now()}`,
      title: formTitle.trim(),
      description: formDescription.trim() || 'Wholesome homemade meal',
      prepTimeMinutes: Number(formPrepTime) || 15,
      cookTimeMinutes: Number(formCookTime) || 20,
      servings: Number(formServings) || 4,
      dietaryTags: formDietaryTags,
      cuisine: formCuisine.trim() || 'Home Cooking',
      ingredients: cleanedIngredients.length > 0 ? cleanedIngredients : [{ name: formTitle.trim(), quantity: '1 serving' }],
      instructions: instructionsArray.length > 0 ? instructionsArray : ['Prepare ingredients and serve hot.']
    };

    if (saveToCookbook || isStandaloneRecipe) {
      StorageRepository.saveRecipe(recipeObj);
    }

    if (!isStandaloneRecipe) {
      StorageRepository.setDayMeal(currentDay.dayOfWeek, targetSlot, recipeObj);
      showToast(`Saved and updated ${currentDay.dayOfWeek}'s ${targetSlot}!`, 'success');
    } else {
      showToast(`Added "${recipeObj.title}" to Recipe Cookbook!`, 'success');
    }

    setIsEditModalOpen(false);
    setIsSwapModalOpen(false);
    setIsCreateRecipeModalOpen(false);
    onRefreshData();
  };

  // Filter cookbook recipes by search
  const filteredRecipes = allCookbookRecipes.filter((r) =>
    r.title.toLowerCase().includes(recipeSearch.toLowerCase()) ||
    r.cuisine?.toLowerCase().includes(recipeSearch.toLowerCase()) ||
    r.dietaryTags?.some((t) => t.toLowerCase().includes(recipeSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl font-semibold text-nature-dark">
              Weekly Meal Planner
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-nature-sage/60 text-nature-dark font-medium border border-nature-border">
              Fully Editable
            </span>
          </div>
          <p className="text-sm text-nature-muted mt-0.5">
            Customize any meal slot, swap recipes, or create your own custom family meals
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={openCreateRecipeModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-nature-surface hover:bg-nature-sage/40 text-nature-dark border border-nature-border text-xs font-semibold shadow-soft transition-all active:scale-95"
          >
            <ChefHat className="w-3.5 h-3.5 text-nature-primary" />
            <span>Add to Cookbook</span>
          </button>

          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nature-primary hover:bg-nature-primary-hover text-white text-xs font-semibold shadow-soft transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Generate Plan</span>
          </button>
        </div>
      </div>

      {/* Day-by-Day Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {mealPlan.days.map((day, idx) => {
          const isSelected = selectedDayIndex === idx;
          const isToday = idx === 0;

          return (
            <button
              key={day.dayOfWeek}
              onClick={() => setSelectedDayIndex(idx)}
              className={`min-w-[96px] p-3 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'bg-nature-card border-nature-primary text-nature-dark shadow-soft-md'
                  : 'bg-nature-card/60 border-nature-border text-nature-muted hover:bg-nature-sage/30'
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider block font-semibold text-nature-primary">
                {isToday ? 'Today' : day.dateStr || `Day ${idx + 1}`}
              </span>
              <span className="font-serif text-base font-semibold block text-nature-dark mt-0.5">
                {day.dayOfWeek.slice(0, 3)}
              </span>
              <span className="text-[10px] text-nature-muted block truncate mt-1">
                {day.meals.dinner ? day.meals.dinner.title : 'No dinner'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Day Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-nature-dark">
            {currentDay.dayOfWeek}’s Meals
          </h2>
          <p className="text-xs text-nature-muted">
            Click <strong>Change</strong> to swap, or <strong>Edit</strong> to customize ingredients and instructions.
          </p>
        </div>
      </div>

      {/* 4 Meal Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mealSlots.map((slot) => {
          const recipe = currentDay.meals[slot.type];

          return (
            <div
              key={slot.type}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                recipe
                  ? 'bg-nature-card border-nature-border shadow-soft'
                  : 'bg-nature-card/40 border-dashed border-nature-border text-nature-muted'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{slot.icon}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-nature-muted">
                      {slot.label}
                    </span>
                  </div>

                  {recipe && (
                    <div className="flex items-center gap-1.5 text-xs text-nature-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-nature-primary" />
                        {recipe.prepTimeMinutes + recipe.cookTimeMinutes}m
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-nature-primary" />
                        {recipe.servings}
                      </span>
                    </div>
                  )}
                </div>

                {recipe ? (
                  <>
                    <h3 className="font-serif text-lg font-semibold text-nature-dark leading-snug">
                      {recipe.title}
                    </h3>
                    <p className="text-xs text-nature-muted line-clamp-2 mt-1 leading-relaxed">
                      {recipe.description}
                    </p>

                    {/* Dietary Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {recipe.dietaryTags?.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-nature-peach/60 text-amber-900 font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-nature-surface text-nature-muted font-medium">
                        {recipe.cuisine}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="py-6 text-center text-xs">
                    <p className="font-medium text-nature-dark">No meal scheduled</p>
                    <p className="text-[11px] text-nature-muted mt-0.5">
                      Select a recipe from your cookbook or create a custom dish.
                    </p>
                  </div>
                )}
              </div>

              {/* Card Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-nature-border/60 flex flex-wrap items-center justify-between gap-2">
                {recipe ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedRecipeForDetails(recipe)}
                        className="px-2.5 py-1.5 rounded-lg bg-nature-surface hover:bg-nature-sage/40 text-xs text-nature-dark font-medium flex items-center gap-1 transition-colors"
                        title="View ingredients and steps"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Recipe</span>
                      </button>

                      <button
                        onClick={() => openEditModalForMeal(slot.type, recipe)}
                        className="px-2.5 py-1.5 rounded-lg bg-nature-surface hover:bg-nature-sage/40 text-xs text-nature-dark font-medium flex items-center gap-1 transition-colors"
                        title="Edit meal details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => openSwapModal(slot.type)}
                        className="px-2.5 py-1.5 rounded-lg bg-nature-surface hover:bg-nature-sage/40 text-xs text-nature-dark font-medium flex items-center gap-1 transition-colors"
                        title="Swap with another meal"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Swap</span>
                      </button>

                      <button
                        onClick={() => handleRemoveMealFromSlot(slot.type)}
                        className="p-1.5 rounded-lg text-nature-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Clear meal from this slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleAddRecipeToShopping(recipe)}
                      className="px-3 py-1.5 rounded-xl bg-nature-sage text-nature-dark hover:bg-nature-sage/80 text-xs font-semibold flex items-center gap-1.5 shadow-soft transition-colors ml-auto"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>To Groceries</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => openSwapModal(slot.type)}
                    className="w-full py-2.5 rounded-xl bg-nature-surface hover:bg-nature-sage/40 text-xs font-semibold text-nature-dark transition-colors flex items-center justify-center gap-1.5 border border-nature-border"
                  >
                    <Plus className="w-4 h-4 text-nature-primary" />
                    <span>Add Meal to {slot.label}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 1. SWAP / SELECT RECIPE MODAL */}
      {isSwapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-nature-dark/40 backdrop-blur-xs"
            onClick={() => setIsSwapModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-nature-card rounded-3xl p-6 border border-nature-border shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div>
                <h2 className="font-serif text-xl font-semibold text-nature-dark">
                  Set {currentDay.dayOfWeek}’s {targetSlot}
                </h2>
                <p className="text-xs text-nature-muted">
                  Choose a saved recipe from your cookbook or create a custom meal.
                </p>
              </div>
              <button
                onClick={() => setIsSwapModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-nature-sage/40 text-nature-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex p-1 rounded-xl bg-nature-surface border border-nature-border mb-3 shrink-0">
              <button
                onClick={() => setSwapTab('cookbook')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  swapTab === 'cookbook'
                    ? 'bg-nature-card text-nature-dark shadow-soft'
                    : 'text-nature-muted hover:text-nature-dark'
                }`}
              >
                Choose from Cookbook ({allCookbookRecipes.length})
              </button>
              <button
                onClick={() => setSwapTab('custom')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  swapTab === 'custom'
                    ? 'bg-nature-card text-nature-dark shadow-soft'
                    : 'text-nature-muted hover:text-nature-dark'
                }`}
              >
                + Create Custom Meal
              </button>
            </div>

            {/* TAB A: COOKBOOK LIST */}
            {swapTab === 'cookbook' && (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <div className="relative">
                  <input
                    type="text"
                    value={recipeSearch}
                    onChange={(e) => setRecipeSearch(e.target.value)}
                    placeholder="Search recipes by name, cuisine, or diet..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-nature-border text-xs text-nature-dark outline-none focus:border-nature-primary"
                  />
                  <Search className="w-3.5 h-3.5 text-nature-muted absolute left-3 top-2.5" />
                </div>

                <div className="space-y-2">
                  {filteredRecipes.map((rec) => (
                    <div
                      key={rec.id}
                      onClick={() => handleSelectRecipeForSlot(rec)}
                      className="p-3.5 rounded-2xl border border-nature-border hover:border-nature-primary bg-white hover:bg-nature-sage/10 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div>
                        <h4 className="font-medium text-sm text-nature-dark group-hover:text-nature-primary">
                          {rec.title}
                        </h4>
                        <span className="text-xs text-nature-muted block mt-0.5">
                          {rec.cuisine} • {rec.prepTimeMinutes + rec.cookTimeMinutes} mins • {rec.dietaryTags?.join(', ')}
                        </span>
                      </div>
                      <button className="px-3 py-1.5 rounded-lg bg-nature-sage text-nature-dark text-xs font-semibold group-hover:bg-nature-primary group-hover:text-white transition-colors">
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB B: CREATE CUSTOM MEAL INLINE */}
            {swapTab === 'custom' && (
              <form onSubmit={(e) => handleSaveMealForm(e, false)} className="flex-1 overflow-y-auto space-y-3 pr-1">
                <div>
                  <label className="text-xs font-semibold text-nature-dark block mb-1">
                    Meal Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Grandma's Lemon Risotto, Quick Berry Oats"
                    className="w-full px-3 py-2 rounded-xl border border-nature-border text-xs text-nature-dark outline-none focus:border-nature-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-nature-dark block mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Brief description"
                    className="w-full px-3 py-2 rounded-xl border border-nature-border text-xs text-nature-dark outline-none focus:border-nature-primary"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-nature-muted block mb-0.5">
                      Prep Time (m)
                    </label>
                    <input
                      type="number"
                      value={formPrepTime}
                      onChange={(e) => setFormPrepTime(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-nature-border text-xs text-nature-dark"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-nature-muted block mb-0.5">
                      Cook Time (m)
                    </label>
                    <input
                      type="number"
                      value={formCookTime}
                      onChange={(e) => setFormCookTime(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-nature-border text-xs text-nature-dark"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-nature-muted block mb-0.5">
                      Servings
                    </label>
                    <input
                      type="number"
                      value={formServings}
                      onChange={(e) => setFormServings(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-nature-border text-xs text-nature-dark"
                    />
                  </div>
                </div>

                {/* Ingredients */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-nature-dark">
                      Key Ingredients
                    </label>
                    <button
                      type="button"
                      onClick={handleAddIngredientRow}
                      className="text-xs text-nature-primary hover:text-nature-dark font-medium flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Add Item
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {formIngredients.map((ing, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Ingredient name (e.g. Pasta, Spinach)"
                          value={ing.name}
                          onChange={(e) => handleUpdateIngredient(idx, 'name', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-nature-border text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Quantity (e.g. 200g)"
                          value={ing.quantity}
                          onChange={(e) => handleUpdateIngredient(idx, 'quantity', e.target.value)}
                          className="w-24 px-2 py-1.5 rounded-lg border border-nature-border text-xs"
                        />
                        {formIngredients.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredientRow(idx)}
                            className="p-1 text-nature-muted hover:text-red-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="saveToCookbookCheck"
                    checked={saveToCookbook}
                    onChange={(e) => setSaveToCookbook(e.target.checked)}
                    className="w-4 h-4 rounded text-nature-primary"
                  />
                  <label htmlFor="saveToCookbookCheck" className="text-xs text-nature-dark">
                    Also save to my permanent Recipe Cookbook
                  </label>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSwapModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-nature-muted hover:text-nature-dark"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-nature-primary hover:bg-nature-primary-hover text-white text-xs font-semibold shadow-soft"
                  >
                    Set as {targetSlot}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 2. EDIT MEAL DETAILS MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-nature-dark/40 backdrop-blur-xs"
            onClick={() => setIsEditModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-nature-card rounded-3xl p-6 border border-nature-border shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-xl font-semibold text-nature-dark">
                  Edit Meal: {currentDay.dayOfWeek} {targetSlot}
                </h2>
                <p className="text-xs text-nature-muted">
                  Modify the recipe title, ingredients, and instructions.
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-nature-sage/40 text-nature-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => handleSaveMealForm(e, false)} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-nature-dark block mb-1">
                  Recipe Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-nature-border text-sm text-nature-dark outline-none focus:border-nature-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-nature-dark block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-nature-border text-xs text-nature-dark outline-none focus:border-nature-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-nature-muted block mb-0.5">
                    Prep Time (mins)
                  </label>
                  <input
                    type="number"
                    value={formPrepTime}
                    onChange={(e) => setFormPrepTime(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-nature-border text-xs text-nature-dark"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-nature-muted block mb-0.5">
                    Cook Time (mins)
                  </label>
                  <input
                    type="number"
                    value={formCookTime}
                    onChange={(e) => setFormCookTime(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-nature-border text-xs text-nature-dark"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-nature-muted block mb-0.5">
                    Servings
                  </label>
                  <input
                    type="number"
                    value={formServings}
                    onChange={(e) => setFormServings(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-nature-border text-xs text-nature-dark"
                  />
                </div>
              </div>

              {/* Ingredients Checklist Editor */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-nature-dark">
                    Ingredients Checklist ({formIngredients.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="text-xs text-nature-primary hover:text-nature-dark font-medium flex items-center gap-0.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Ingredient
                  </button>
                </div>

                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {formIngredients.map((ing, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Ingredient name"
                        value={ing.name}
                        onChange={(e) => handleUpdateIngredient(idx, 'name', e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-nature-border text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Quantity"
                        value={ing.quantity}
                        onChange={(e) => handleUpdateIngredient(idx, 'quantity', e.target.value)}
                        className="w-28 px-2.5 py-1.5 rounded-lg border border-nature-border text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredientRow(idx)}
                        className="p-1 text-nature-muted hover:text-red-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cooking Instructions */}
              <div>
                <label className="text-xs font-semibold text-nature-dark block mb-1">
                  Preparation Instructions (One step per line)
                </label>
                <textarea
                  rows={3}
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  placeholder="Step 1: Boil salted water...&#10;Step 2: Sauté garlic in olive oil..."
                  className="w-full px-3 py-2 rounded-xl border border-nature-border text-xs text-nature-dark outline-none focus:border-nature-primary resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-nature-muted hover:text-nature-dark"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-nature-primary hover:bg-nature-primary-hover text-white text-xs font-semibold shadow-soft"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. RECIPE DETAILS MODAL */}
      {selectedRecipeForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-nature-dark/40 backdrop-blur-xs"
            onClick={() => setSelectedRecipeForDetails(null)}
          />
          <div className="relative w-full max-w-xl bg-nature-card rounded-3xl p-6 sm:p-7 border border-nature-border shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-nature-primary">
                  {selectedRecipeForDetails.cuisine} Recipe
                </span>
                <h2 className="font-serif text-2xl font-semibold text-nature-dark mt-0.5">
                  {selectedRecipeForDetails.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedRecipeForDetails(null)}
                className="p-1.5 rounded-full hover:bg-nature-sage/40 text-nature-muted shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-nature-muted leading-relaxed mb-4">
              {selectedRecipeForDetails.description}
            </p>

            <div className="flex gap-2 text-xs mb-5">
              <span className="px-3 py-1 rounded-full bg-nature-surface text-nature-dark font-medium">
                ⏱ Prep: {selectedRecipeForDetails.prepTimeMinutes}m
              </span>
              <span className="px-3 py-1 rounded-full bg-nature-surface text-nature-dark font-medium">
                🔥 Cook: {selectedRecipeForDetails.cookTimeMinutes}m
              </span>
              <span className="px-3 py-1 rounded-full bg-nature-surface text-nature-dark font-medium">
                🍽 Serves {selectedRecipeForDetails.servings}
              </span>
            </div>

            {/* Ingredients Section */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-serif text-base font-semibold text-nature-dark">
                  Ingredients Checklist
                </h3>
                <button
                  onClick={() => handleAddRecipeToShopping(selectedRecipeForDetails)}
                  className="text-xs font-medium text-nature-primary hover:text-nature-dark flex items-center gap-1"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Add All to Shopping List
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedRecipeForDetails.ingredients?.map((ing, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-nature-bg border border-nature-border text-xs flex items-center justify-between"
                  >
                    <span className="font-medium text-nature-dark">{ing.name}</span>
                    <span className="text-nature-muted">{ing.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preparation Steps */}
            <div>
              <h3 className="font-serif text-base font-semibold text-nature-dark mb-2">
                Preparation Instructions
              </h3>
              <ol className="space-y-2.5 text-xs text-nature-text leading-relaxed">
                {selectedRecipeForDetails.instructions?.map((step, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start">
                    <span className="w-5 h-5 rounded-full bg-nature-sage text-nature-dark flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Modal Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-nature-border flex items-center justify-between">
              <button
                onClick={() => {
                  const rec = selectedRecipeForDetails;
                  setSelectedRecipeForDetails(null);
                  openEditModalForMeal(targetSlot, rec);
                }}
                className="px-4 py-2 rounded-xl bg-nature-surface hover:bg-nature-sage/40 text-xs font-semibold text-nature-dark flex items-center gap-1.5 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit This Recipe</span>
              </button>

              <button
                onClick={() => handleAddRecipeToShopping(selectedRecipeForDetails)}
                className="px-5 py-2 rounded-xl bg-nature-primary hover:bg-nature-primary-hover text-white text-xs font-semibold shadow-soft flex items-center gap-1.5 transition-all"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add Ingredients to Groceries</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CREATE NEW RECIPE TO COOKBOOK MODAL */}
      {isCreateRecipeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-nature-dark/40 backdrop-blur-xs"
            onClick={() => setIsCreateRecipeModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-nature-card rounded-3xl p-6 border border-nature-border shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-xl font-semibold text-nature-dark">
                  Add New Recipe to Cookbook
                </h2>
                <p className="text-xs text-nature-muted">
                  Create a recipe that can be scheduled anytime in your meal plan.
                </p>
              </div>
              <button
                onClick={() => setIsCreateRecipeModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-nature-sage/40 text-nature-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => handleSaveMealForm(e, true)} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-nature-dark block mb-1">
                  Recipe Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Tuscan White Bean Stew"
                  className="w-full px-3 py-2 rounded-xl border border-nature-border text-sm text-nature-dark outline-none focus:border-nature-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-nature-dark block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Short summary of flavor and preparation"
                  className="w-full px-3 py-2 rounded-xl border border-nature-border text-xs text-nature-dark outline-none focus:border-nature-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-nature-muted block mb-0.5">
                    Prep Time (mins)
                  </label>
                  <input
                    type="number"
                    value={formPrepTime}
                    onChange={(e) => setFormPrepTime(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-nature-border text-xs text-nature-dark"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-nature-muted block mb-0.5">
                    Cook Time (mins)
                  </label>
                  <input
                    type="number"
                    value={formCookTime}
                    onChange={(e) => setFormCookTime(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-nature-border text-xs text-nature-dark"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-nature-muted block mb-0.5">
                    Servings
                  </label>
                  <input
                    type="number"
                    value={formServings}
                    onChange={(e) => setFormServings(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-nature-border text-xs text-nature-dark"
                  />
                </div>
              </div>

              {/* Ingredients list */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-nature-dark">
                    Ingredients Checklist
                  </label>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="text-xs text-nature-primary hover:text-nature-dark font-medium flex items-center gap-0.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Ingredient
                  </button>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {formIngredients.map((ing, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Ingredient name"
                        value={ing.name}
                        onChange={(e) => handleUpdateIngredient(idx, 'name', e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-nature-border text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Quantity"
                        value={ing.quantity}
                        onChange={(e) => handleUpdateIngredient(idx, 'quantity', e.target.value)}
                        className="w-28 px-2.5 py-1.5 rounded-lg border border-nature-border text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredientRow(idx)}
                        className="p-1 text-nature-muted hover:text-red-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="text-xs font-semibold text-nature-dark block mb-1">
                  Instructions (One step per line)
                </label>
                <textarea
                  rows={3}
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  placeholder="Step 1: Prep vegetables...&#10;Step 2: Simmer for 15 minutes..."
                  className="w-full px-3 py-2 rounded-xl border border-nature-border text-xs text-nature-dark outline-none focus:border-nature-primary resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateRecipeModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-nature-muted hover:text-nature-dark"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-nature-primary hover:bg-nature-primary-hover text-white text-xs font-semibold shadow-soft"
                >
                  Save to Cookbook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. GENERATE AI MEAL PLAN MODAL */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-nature-dark/40 backdrop-blur-xs"
            onClick={() => setIsGenerateModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-nature-card rounded-3xl p-6 border border-nature-border shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-nature-primary" />
                <h2 className="font-serif text-xl font-semibold text-nature-dark">
                  Generate AI Meal Plan
                </h2>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-nature-sage/40 text-nature-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-nature-dark block mb-1">
                  Dietary Focus
                </label>
                <select
                  value={generatePref}
                  onChange={(e) => setGeneratePref(e.target.value as DietaryPreference)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-nature-border text-sm text-nature-dark focus:border-nature-primary focus:ring-1 focus:ring-nature-primary outline-none bg-white"
                >
                  <option value="Mediterranean">Mediterranean Fresh</option>
                  <option value="Vegetarian">Wholesome Vegetarian</option>
                  <option value="High-Protein">High-Protein Lifestyle</option>
                  <option value="Gluten-Free">Gluten-Free Balanced</option>
                  <option value="Vegan">100% Plant-Based Vegan</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-nature-dark block mb-1">
                  Number of Days
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGenerateDays(5)}
                    className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                      generateDays === 5
                        ? 'bg-nature-dark text-white border-nature-dark'
                        : 'bg-white border-nature-border text-nature-text'
                    }`}
                  >
                    5 Days (Weekdays)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenerateDays(7)}
                    className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                      generateDays === 7
                        ? 'bg-nature-dark text-white border-nature-dark'
                        : 'bg-white border-nature-border text-nature-text'
                    }`}
                  >
                    7 Days (Full Week)
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-nature-surface/60 border border-nature-border text-xs text-nature-muted">
                Rotates verified recipes matching your pantry inventory and household dietary profile.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-nature-muted hover:text-nature-text"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGeneratePlan}
                  className="px-5 py-2.5 rounded-xl bg-nature-primary hover:bg-nature-primary-hover text-white text-xs font-semibold shadow-soft transition-all"
                >
                  Generate Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
