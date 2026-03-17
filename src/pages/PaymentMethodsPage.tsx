import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, CreditCard as Edit2, Check, X, Loader2, GripVertical, CreditCard } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useBusinessStore } from '../stores/appStore';
import { useTransactionStore } from '../stores/transactionStore';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';

interface PaymentMethod {
  id: string;
  name: string;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
}

export default function PaymentMethodsPage() {
  const navigate = useNavigate();
  const { business } = useBusinessStore();
  const { fetchPaymentMethods } = useTransactionStore();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    if (!business?.id) return;
    const { data } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('business_id', business.id)
      .order('sort_order');

    if (data) setMethods(data as PaymentMethod[]);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newName.trim() || !business?.id) return;
    setSaving(true);

    const { data, error } = await supabase
      .from('payment_methods')
      .insert({
        business_id: business.id,
        name: newName.trim(),
        is_default: false,
        is_active: true,
        sort_order: methods.length,
      })
      .select()
      .single();

    setSaving(false);
    if (!error && data) {
      setMethods([...methods, data as PaymentMethod]);
      setNewName('');
      setShowAdd(false);
      if (business?.id) fetchPaymentMethods(business.id);
    }
  };

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return;
    setSaving(true);

    const { error } = await supabase
      .from('payment_methods')
      .update({ name: editName.trim() })
      .eq('id', id);

    setSaving(false);
    if (!error) {
      setMethods(methods.map((m) => m.id === id ? { ...m, name: editName.trim() } : m));
      setEditId(null);
      if (business?.id) fetchPaymentMethods(business.id);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', id);

    if (!error) {
      setMethods(methods.filter((m) => m.id !== id));
      if (business?.id) fetchPaymentMethods(business.id);
    }
  };

  const handleSetDefault = async (id: string) => {
    // Unset all defaults first
    await supabase
      .from('payment_methods')
      .update({ is_default: false })
      .eq('business_id', business?.id);

    // Set new default
    await supabase
      .from('payment_methods')
      .update({ is_default: true })
      .eq('id', id);

    setMethods(methods.map((m) => ({ ...m, is_default: m.id === id })));
    if (business?.id) fetchPaymentMethods(business.id);
  };

  return (
    <PageWrapper>
      <div className="sticky top-0 z-50 flex items-center gap-3 px-4 h-14
        bg-white/80 backdrop-blur-xl border-b border-neutral-200/60
        dark:bg-black/80 dark:border-white/5">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
            <ArrowLeft size={20} className="text-neutral-600 dark:text-zinc-400" />
          </button>
          <h1 className="text-[17px] font-bold text-neutral-900 dark:text-white">Payment Methods</h1>
        </div>

        <div className="px-4 pt-4 pb-24 space-y-4 animate-fade-in">
          <p className="text-sm text-neutral-500 dark:text-zinc-400">
            Manage how you record payments. Tap to set default, long-press to edit.
          </p>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="text-blue-500 animate-spin" />
            </div>
          ) : (
            <div className="glass-card divide-y divide-neutral-100 dark:divide-white/5 overflow-hidden">
              {methods.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3.5">
                  {editId === m.id ? (
                    /* Edit mode */
                    <div className="flex-1 flex items-center gap-2">
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                        className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-neutral-50 dark:bg-white/5 border border-blue-500 text-neutral-900 dark:text-white outline-none" />
                      <button onClick={() => handleEdit(m.id)}
                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <Check size={16} />
                      </button>
                      <button onClick={() => setEditId(null)}
                        className="p-2 rounded-lg bg-neutral-100 dark:bg-white/5 text-neutral-500">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    /* View mode */
                    <>
                      <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <CreditCard size={16} className="text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{m.name}</p>
                        {m.is_default && (
                          <span className="text-[10px] font-semibold text-accent-dark dark:text-accent">Default</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {!m.is_default && (
                          <button onClick={() => handleSetDefault(m.id)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold
                              bg-neutral-100 dark:bg-white/5 text-neutral-500 dark:text-zinc-400
                              hover:bg-accent/10 hover:text-accent-dark dark:hover:text-accent transition-colors">
                            Set Default
                          </button>
                        )}
                        <button onClick={() => { setEditId(m.id); setEditName(m.name); }}
                          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-400">
                          <Edit2 size={14} />
                        </button>
                        {!m.is_default && (
                          <button onClick={() => handleDelete(m.id)}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-neutral-400 hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add new */}
          {showAdd ? (
            <div className="glass-card p-4 flex items-center gap-3">
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                placeholder="Method name (e.g., Paytm)"
                autoFocus
                className="flex-1 px-3 py-2.5 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 outline-none" />
              <button onClick={handleAdd} disabled={saving || !newName.trim()}
                className="px-4 py-2.5 rounded-xl bg-accent text-black text-xs font-semibold disabled:opacity-50 active:scale-95 transition-all">
                {saving ? <Loader2 size={14} className="animate-spin" /> : 'Add'}
              </button>
              <button onClick={() => { setShowAdd(false); setNewName(''); }}
                className="p-2 text-neutral-400">
                <X size={16} />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAdd(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl
                bg-neutral-100 dark:bg-white/5 border border-dashed border-neutral-300 dark:border-white/10
                text-neutral-600 dark:text-zinc-400 text-sm font-semibold
                hover:bg-neutral-200 dark:hover:bg-white/8 transition-colors">
              <Plus size={16} /> Add Payment Method
            </button>
          )}
        </div>
    </PageWrapper>
  );
}
