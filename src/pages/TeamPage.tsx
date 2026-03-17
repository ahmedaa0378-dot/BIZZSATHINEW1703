import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Users, Shield, Eye, CreditCard as Edit2, Trash2, Phone, Mail, X, Loader2, Check, ChevronDown, UserPlus, Crown, Briefcase, User, Calculator } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useBusinessStore } from '../stores/appStore';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';

interface TeamMember {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: 'owner' | 'manager' | 'staff' | 'accountant';
  status: 'invited' | 'active' | 'inactive';
  created_at: string;
}

const ROLES = [
  { value: 'manager', label: 'Manager', icon: Briefcase, desc: 'View all, create transactions/invoices. Cannot delete or change settings.', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  { value: 'staff', label: 'Staff', icon: User, desc: 'Add transactions, view stock. Cannot see reports or financials.', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  { value: 'accountant', label: 'Accountant', icon: Calculator, desc: 'View all financial data, reports, export. Read-only.', color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10' },
];

const ROLE_ICONS: Record<string, typeof Crown> = {
  owner: Crown,
  manager: Briefcase,
  staff: User,
  accountant: Calculator,
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'text-amber-500',
  manager: 'text-blue-500',
  staff: 'text-emerald-500',
  accountant: 'text-violet-500',
};

export default function TeamPage() {
  const navigate = useNavigate();
  const { business } = useBusinessStore();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  // Invite form
  const [invName, setInvName] = useState('');
  const [invPhone, setInvPhone] = useState('');
  const [invEmail, setInvEmail] = useState('');
  const [invRole, setInvRole] = useState('staff');
  const [inviting, setInviting] = useState(false);
  const [invited, setInvited] = useState(false);

  useEffect(() => { loadMembers(); }, []);

  const loadMembers = async () => {
    if (!business?.id) return;
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at');

    if (data) setMembers(data as TeamMember[]);
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!invName.trim() || !business?.id) return;
    setInviting(true);

    const { error } = await supabase.from('team_members').insert({
      business_id: business.id,
      name: invName.trim(),
      phone: invPhone.trim() || null,
      email: invEmail.trim() || null,
      role: invRole,
      status: 'invited',
    });

    setInviting(false);
    if (!error) {
      setInvited(true);
      setTimeout(() => {
        setShowInvite(false);
        setInvName(''); setInvPhone(''); setInvEmail(''); setInvRole('staff');
        setInvited(false);
        loadMembers();
      }, 800);
    }
  };

  const handleRemove = async (id: string) => {
    await supabase.from('team_members').delete().eq('id', id);
    setMembers(members.filter((m) => m.id !== id));
  };

  const handleChangeRole = async (id: string, role: string) => {
    await supabase.from('team_members').update({ role }).eq('id', id);
    setMembers(members.map((m) => m.id === id ? { ...m, role: role as any } : m));
  };

  return (
    <PageWrapper>
      <div className="sticky top-0 z-50 flex items-center gap-3 px-4 h-14
        bg-white/80 backdrop-blur-xl border-b border-neutral-200/60
        dark:bg-black/80 dark:border-white/5">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
          <ArrowLeft size={20} className="text-neutral-600 dark:text-zinc-400" />
        </button>
        <h1 className="text-[17px] font-bold text-neutral-900 dark:text-white">Team</h1>
        <span className="ml-auto text-xs text-neutral-400 dark:text-zinc-600">{members.length + 1} members</span>
      </div>

      <div className="px-4 pt-3 pb-24 space-y-4 animate-fade-in">

        {/* Owner Card */}
        <div className="premium-card p-4">
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Crown size={20} className="text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-neutral-900 dark:text-white">{business?.ownerName || 'You'}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Owner · Full Access</p>
            </div>
          </div>
        </div>

        {/* Role Guide */}
        <div className="glass-card p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-zinc-600 mb-3">Roles & Permissions</p>
          <div className="space-y-2.5">
            {ROLES.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.value} className="flex items-start gap-3">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', r.bg)}>
                    <Icon size={14} className={r.color} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-900 dark:text-white">{r.label}</p>
                    <p className="text-[10px] text-neutral-500 dark:text-zinc-500 leading-relaxed">{r.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Members */}
        {members.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Team Members</p>
            <div className="glass-card divide-y divide-neutral-100 dark:divide-white/5 overflow-hidden">
              {members.map((m) => {
                const RoleIcon = ROLE_ICONS[m.role] || User;
                return (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
                      m.role === 'manager' ? 'bg-blue-50 dark:bg-blue-500/10' :
                      m.role === 'accountant' ? 'bg-violet-50 dark:bg-violet-500/10' :
                      'bg-emerald-50 dark:bg-emerald-500/10')}>
                      <RoleIcon size={16} className={ROLE_COLORS[m.role]} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">{m.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-neutral-500 dark:text-zinc-500 capitalize">{m.role}</span>
                        <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-semibold',
                          m.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                          m.status === 'invited' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                          'bg-neutral-100 dark:bg-white/8 text-neutral-500')}>
                          {m.status}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => handleRemove(m.id)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-neutral-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Invite Button */}
        <button onClick={() => setShowInvite(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl
            bg-neutral-100 dark:bg-white/5 border border-dashed border-neutral-300 dark:border-white/10
            text-neutral-600 dark:text-zinc-400 text-sm font-semibold
            hover:bg-neutral-200 dark:hover:bg-white/8 transition-colors">
          <UserPlus size={16} /> Invite Team Member
        </button>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowInvite(false)} />
          <div className="relative w-full max-w-[430px] bg-white dark:bg-[#0a0a0a] rounded-t-3xl animate-slide-up">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Invite Member</h2>
              <button onClick={() => setShowInvite(false)} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
                <X size={20} className="text-neutral-500" />
              </button>
            </div>
            <div className="px-5 pb-8 space-y-4">
              <InputField label="Name *" value={invName} onChange={setInvName} placeholder="Staff name" />
              <InputField label="Phone" value={invPhone} onChange={(v) => setInvPhone(v.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" />
              <InputField label="Email" value={invEmail} onChange={setInvEmail} placeholder="staff@email.com" />

              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">Role</label>
                <div className="space-y-2">
                  {ROLES.map((r) => {
                    const Icon = r.icon;
                    return (
                      <button key={r.value} onClick={() => setInvRole(r.value)}
                        className={cn('w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all',
                          invRole === r.value
                            ? 'bg-blue-500/10 border-2 border-blue-500 ring-2 ring-blue-500/20'
                            : 'glass-card')}>
                        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', r.bg)}>
                          <Icon size={16} className={r.color} />
                        </div>
                        <div>
                          <p className={cn('text-sm font-semibold', invRole === r.value ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-900 dark:text-white')}>{r.label}</p>
                          <p className="text-[10px] text-neutral-500 dark:text-zinc-500">{r.desc.slice(0, 50)}...</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button onClick={handleInvite} disabled={inviting || !invName.trim()}
                className={cn('w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-[15px] active:scale-[0.98] transition-all disabled:opacity-50',
                  invited ? 'bg-emerald-500 text-white' : 'bg-gradient-to-r from-[#c8ee44] to-[#a3c428] text-black shadow-glow-green')}>
                {inviting ? <Loader2 size={18} className="animate-spin" /> :
                  invited ? <><Check size={18} /> Invited!</> : <><UserPlus size={18} /> Send Invite</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

function InputField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
    </div>
  );
}
