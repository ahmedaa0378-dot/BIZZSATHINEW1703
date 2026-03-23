import { useEffect, useState } from 'react';
import { Plus, Clock, CheckCircle2, Trash2, Bell, Calendar, Tag } from 'lucide-react';
import { useReminderStore, Reminder } from '../stores/reminderStore';
import { useAuthStore, useBusinessStore } from '../stores/appStore';
import { cn } from '../lib/utils';
import { Plus, Clock, CheckCircle2, Trash2, Bell, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isTomorrow, isPast } from 'date-fns';

const types = [
  { value: 'general', label: 'General', color: 'bg-blue-500/10 text-blue-500' },
  { value: 'payment', label: 'Payment', color: 'bg-red-500/10 text-red-500' },
  { value: 'follow_up', label: 'Follow Up', color: 'bg-purple-500/10 text-purple-500' },
  { value: 'stock', label: 'Stock', color: 'bg-orange-500/10 text-orange-500' },
];

function dueDateLabel(date: string) {
  const d = new Date(date);
  if (isToday(d)) return { label: 'Today', color: 'text-[#c8ee44]' };
  if (isTomorrow(d)) return { label: 'Tomorrow', color: 'text-blue-400' };
  if (isPast(d)) return { label: 'Overdue', color: 'text-red-400' };
  return { label: format(d, 'dd MMM, hh:mm a'), color: 'text-zinc-400' };
}

export default function RemindersPage() {
  const { reminders, loading, fetchReminders, addReminder, toggleComplete, deleteReminder } = useReminderStore();
  const { user } = useAuthStore();
  const { business } = useBusinessStore();
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('pending');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('09:00');
  const [type, setType] = useState('general');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) fetchReminders(user.id);
  }, [user]);

  const handleAdd = async () => {
    if (!title || !dueDate || !user || !business) return;
    setSaving(true);
    await addReminder({
      title, description, type: type as any,
      due_date: new Date(`${dueDate}T${dueTime}`).toISOString(),
      completed: false, user_id: user.id, business_id: business.id,
    });
    setTitle(''); setDescription(''); setDueDate(''); setDueTime('09:00'); setType('general');
    setShowAdd(false);
    setSaving(false);
  };

  const filtered = reminders.filter(r =>
    filter === 'all' ? true : filter === 'pending' ? !r.completed : r.completed
  );

  const pendingCount = reminders.filter(r => !r.completed).length;

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark pb-24">
      {/* Header */}
<div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-neutral-100 dark:border-white/5 px-4 py-3">
  <div className="max-w-[430px] mx-auto flex items-center justify-between">
    <div className="flex items-center gap-3">
      <button
        onClick={() => navigate(-1)}
        className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors -ml-2"
      >
        <ChevronLeft size={22} className="text-neutral-700 dark:text-zinc-300" />
      </button>
      <div>
        <h1 className="text-lg font-bold text-neutral-900 dark:text-white">Reminders</h1>
        {pendingCount > 0 && <p className="text-xs text-neutral-500 dark:text-zinc-500">{pendingCount} pending</p>}
      </div>
    </div>
    <button onClick={() => setShowAdd(true)}
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#c8ee44] text-black text-sm font-semibold">
      <Plus size={16} />
      Add
    </button>
  </div>
</div>

      <div className="max-w-[430px] mx-auto px-4 pt-4 space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-2 p-1 rounded-2xl bg-neutral-100 dark:bg-white/5">
          {(['pending', 'all', 'done'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all',
                filter === f ? 'bg-white dark:bg-white/10 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 dark:text-zinc-500')}>
              {f}
            </button>
          ))}
        </div>

        {/* Reminders list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#c8ee44] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-white/5 flex items-center justify-center">
              <Bell size={24} className="text-neutral-400 dark:text-zinc-600" />
            </div>
            <p className="text-sm text-neutral-500 dark:text-zinc-500">No reminders here</p>
            <button onClick={() => setShowAdd(true)}
              className="text-sm text-[#8fb02e] dark:text-[#c8ee44] font-semibold">
              + Add your first reminder
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => {
              const typeInfo = types.find(t => t.value === r.type) || types[0];
              const due = dueDateLabel(r.due_date);
              return (
                <div key={r.id} className={cn(
                  'glass-card p-4 flex items-start gap-3 transition-opacity',
                  r.completed && 'opacity-50'
                )}>
                  <button onClick={() => toggleComplete(r.id, !r.completed)} className="mt-0.5 flex-shrink-0">
                    <CheckCircle2 size={22} className={r.completed ? 'text-[#c8ee44]' : 'text-neutral-300 dark:text-zinc-700'} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-semibold text-sm', r.completed ? 'line-through text-neutral-400 dark:text-zinc-600' : 'text-neutral-900 dark:text-white')}>
                      {r.title}
                    </p>
                    {r.description && <p className="text-xs text-neutral-500 dark:text-zinc-500 mt-0.5">{r.description}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', typeInfo.color)}>
                        {typeInfo.label}
                      </span>
                      <span className={cn('text-[11px] font-medium flex items-center gap-1', due.color)}>
                        <Clock size={11} />
                        {due.label}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => deleteReminder(r.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-300 dark:text-zinc-700 hover:text-red-500 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Reminder Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-6">
          <div className="w-full max-w-[430px] bg-white dark:bg-[#0f0f0f] rounded-3xl p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">New Reminder</h2>

            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What to remember?"
              className="w-full px-4 py-3 rounded-xl text-sm bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-[#c8ee44]/50 focus:border-[#c8ee44]" />

            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Details (optional)"
              className="w-full px-4 py-3 rounded-xl text-sm bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-[#c8ee44]/50 focus:border-[#c8ee44]" />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-zinc-500 mb-1.5 block">Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-[#c8ee44]/50" />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-zinc-500 mb-1.5 block">Time</label>
                <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-[#c8ee44]/50" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-zinc-500 mb-1.5 block">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {types.map(t => (
                  <button key={t.value} onClick={() => setType(t.value)}
                    className={cn('py-2 rounded-xl text-sm font-medium transition-all border',
                      type === t.value ? 'border-[#c8ee44] bg-[#c8ee44]/10 text-[#8fb02e] dark:text-[#c8ee44]'
                        : 'border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-zinc-400')}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowAdd(false)}
                className="flex-1 py-3 rounded-2xl border border-neutral-200 dark:border-white/10 text-sm font-semibold text-neutral-600 dark:text-zinc-400">
                Cancel
              </button>
              <button onClick={handleAdd} disabled={!title || !dueDate || saving}
                className="flex-1 py-3 rounded-2xl bg-[#c8ee44] text-black text-sm font-semibold disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}