import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  RotateCw,
  X,
  CheckCircle2,
  User
} from 'lucide-react';
import { HouseholdTask, TaskCategory, TaskPriority, RecurrenceRule } from '../types';
import { StorageRepository } from '../services/storage';
import { useToast } from '../context/ToastContext';

interface TasksViewProps {
  tasks: HouseholdTask[];
  onRefreshData: () => void;
}

const CATEGORIES: TaskCategory[] = [
  'Cleaning',
  'Kitchen',
  'Plants',
  'Laundry',
  'Maintenance',
  'General'
];

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onRefreshData
}) => {
  const { showToast } = useToast();
  const [filterTab, setFilterTab] = useState<'today' | 'upcoming' | 'overdue' | 'completed'>('today');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<HouseholdTask | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Cleaning');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState<string>('18:00');
  const [recurrence, setRecurrence] = useState<RecurrenceRule>('none');
  const [assignedTo, setAssignedTo] = useState('Alex');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtering logic
  const filteredTasks = tasks.filter((t) => {
    // Category check
    if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;

    if (filterTab === 'completed') {
      return t.completed;
    }

    if (t.completed) return false;

    if (filterTab === 'today') {
      return t.dueDate === todayStr;
    }
    if (filterTab === 'upcoming') {
      return t.dueDate > todayStr;
    }
    if (filterTab === 'overdue') {
      return t.dueDate < todayStr;
    }
    return true;
  });

  const handleToggleTask = (task: HouseholdTask) => {
    const { nextOccurrenceCreated } = StorageRepository.toggleTaskCompletion(task.id);
    if (!task.completed) {
      showToast(
        `Completed "${task.title}"${nextOccurrenceCreated ? ' • Next occurrence scheduled!' : ''}`,
        'success'
      );
    } else {
      showToast(`Marked "${task.title}" as pending`, 'info');
    }
    onRefreshData();
  };

  const handleDeleteTask = (id: string, taskTitle: string) => {
    if (confirm(`Delete chore "${taskTitle}"?`)) {
      StorageRepository.deleteTask(id);
      showToast(`Deleted "${taskTitle}"`, 'info');
      onRefreshData();
    }
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setCategory('Cleaning');
    setPriority('Medium');
    setDueDate(new Date().toISOString().split('T')[0]);
    setDueTime('18:00');
    setRecurrence('none');
    setAssignedTo('Alex');
    setIsModalOpen(true);
  };

  const openEditModal = (task: HouseholdTask) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setCategory(task.category);
    setPriority(task.priority);
    setDueDate(task.dueDate);
    setDueTime(task.dueTime || '18:00');
    setRecurrence(task.recurrence);
    setAssignedTo(task.assignedTo || 'Alex');
    setIsModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingTask) {
      StorageRepository.updateTask(editingTask.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        dueDate,
        dueTime,
        recurrence,
        assignedTo
      });
      showToast(`Updated task "${title}"`, 'success');
    } else {
      StorageRepository.addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        dueDate,
        dueTime,
        recurrence,
        assignedTo,
        completed: false
      });
      showToast(`Created task "${title}"`, 'success');
    }

    setIsModalOpen(false);
    onRefreshData();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl font-semibold text-nature-dark">
              Tasks & Reminders
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-nature-sage/60 text-nature-dark font-medium border border-nature-border">
              Recurring Schedules
            </span>
          </div>
          <p className="text-sm text-nature-muted mt-0.5">
            Coordinate cleaning, chores, and maintenance with automatic recurrence calculation
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nature-primary hover:bg-nature-primary-hover text-white text-sm font-medium shadow-soft transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 bg-nature-surface/80 p-1 rounded-2xl border border-nature-border text-xs">
          {(['today', 'upcoming', 'overdue', 'completed'] as const).map((tab) => {
            const isSelected = filterTab === tab;
            let count = 0;
            if (tab === 'today') count = tasks.filter((t) => !t.completed && t.dueDate === todayStr).length;
            else if (tab === 'upcoming') count = tasks.filter((t) => !t.completed && t.dueDate > todayStr).length;
            else if (tab === 'overdue') count = tasks.filter((t) => !t.completed && t.dueDate < todayStr).length;
            else if (tab === 'completed') count = tasks.filter((t) => t.completed).length;

            return (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-3 py-1.5 rounded-xl capitalize font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-nature-card text-nature-dark font-semibold shadow-soft'
                    : 'text-nature-muted hover:text-nature-text'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-nature-sage text-nature-dark font-bold' : 'bg-nature-border/60 text-nature-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category Pills */}
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

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-nature-card border border-nature-border">
          <CheckCircle2 className="w-8 h-8 text-nature-primary mx-auto mb-2" />
          <h3 className="font-serif text-lg font-semibold text-nature-dark">
            No tasks in this view
          </h3>
          <p className="text-xs text-nature-muted mt-1">
            All chores are organized or no tasks match your filters.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => {
            const isHighPriority = task.priority === 'High';
            const isOverdue = !task.completed && task.dueDate < todayStr;

            return (
              <div
                key={task.id}
                onClick={() => handleToggleTask(task)}
                className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  task.completed
                    ? 'bg-nature-bg/70 border-nature-border/60 opacity-60'
                    : isOverdue
                    ? 'bg-red-50/60 border-red-200 shadow-soft'
                    : 'bg-nature-card border-nature-border hover:border-nature-primary/40 shadow-soft'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => {}}
                    className="w-5 h-5 rounded-lg text-nature-primary focus:ring-nature-primary border-nature-border pointer-events-none"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          task.completed
                            ? 'line-through text-nature-muted'
                            : 'text-nature-dark'
                        }`}
                      >
                        {task.title}
                      </span>
                      {isHighPriority && (
                        <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded">
                          High
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-nature-muted line-clamp-1 mt-0.5">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-nature-muted mt-1">
                      <span className="font-medium text-nature-dark bg-nature-surface px-2 py-0.5 rounded">
                        {task.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-nature-primary" />
                        {task.dueDate === todayStr ? 'Today' : task.dueDate}
                      </span>
                      {task.dueTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-nature-primary" />
                          {task.dueTime}
                        </span>
                      )}
                      {task.assignedTo && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-nature-primary" />
                          {task.assignedTo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {task.recurrence && task.recurrence !== 'none' && (
                    <span className="text-[10px] font-semibold text-nature-dark bg-nature-sage/60 px-2 py-1 rounded-lg flex items-center gap-1">
                      <RotateCw className="w-3 h-3 text-nature-primary" />
                      {task.recurrence}
                    </span>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(task);
                    }}
                    className="p-1.5 rounded-lg text-nature-muted hover:text-nature-dark hover:bg-nature-sage/30 transition-colors"
                    title="Edit task"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTask(task.id, task.title);
                    }}
                    className="p-1.5 rounded-lg text-nature-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-nature-dark/40 backdrop-blur-xs"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-nature-card rounded-3xl p-6 border border-nature-border shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-semibold text-nature-dark">
                {editingTask ? 'Edit Household Chore' : 'Add Household Chore'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-nature-sage/40 text-nature-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-nature-dark block mb-1">
                  Chore Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Clean kitchen counters, Water plants"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-nature-border text-sm text-nature-dark focus:border-nature-primary focus:ring-1 focus:ring-nature-primary outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-nature-dark block mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Specific details or notes"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-nature-border text-sm text-nature-dark focus:border-nature-primary focus:ring-1 focus:ring-nature-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-nature-dark block mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TaskCategory)}
                    className="w-full px-3.5 py-2 rounded-xl border border-nature-border text-xs text-nature-dark bg-white outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-nature-dark block mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3.5 py-2 rounded-xl border border-nature-border text-xs text-nature-dark bg-white outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-nature-dark block mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-nature-border text-xs text-nature-dark outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-nature-dark block mb-1">
                    Due Time
                  </label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-nature-border text-xs text-nature-dark outline-none bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-nature-dark block mb-1">
                    Recurrence
                  </label>
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as RecurrenceRule)}
                    className="w-full px-3.5 py-2 rounded-xl border border-nature-border text-xs text-nature-dark bg-white outline-none"
                  >
                    <option value="none">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-nature-dark block mb-1">
                    Assigned Member
                  </label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-nature-border text-xs text-nature-dark bg-white outline-none"
                  >
                    <option value="Alex">Alex</option>
                    <option value="Sam">Sam</option>
                    <option value="Maya">Maya</option>
                    <option value="Jordan">Jordan</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-nature-muted hover:text-nature-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-nature-primary hover:bg-nature-primary-hover text-white text-xs font-medium shadow-soft transition-all"
                >
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
