import { useState, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, Check, Loader2, Plus, Trash2, X,
  Search, ChevronDown, FileText, User, Package, Receipt,
} from 'lucide-react';
import { cn, formatINR, formatDate } from '../lib/utils';
import { useInvoiceStore, calculateLineItem, calculateInvoiceTotals, GST_RATES, UNITS } from '../stores/invoiceStore';
import type { InvoiceItem } from '../stores/invoiceStore';
import { useContactStore } from '../stores/contactStore';
import { useBusinessStore } from '../stores/appStore';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const EMPTY_ITEM: InvoiceItem = {
  item_name: '', description: '', hsn_sac: '', quantity: 1, unit: 'pcs',
  rate: 0, discount_percent: 0, discount_amount: 0, taxable_amount: 0,
  gst_rate: 0, cgst_amount: 0, sgst_amount: 0, igst_amount: 0, total: 0, sort_order: 0,
};

export default function CreateInvoicePage() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { createInvoice, getNextNumber, loading } = useInvoiceStore();
  const { contacts, fetchContacts } = useContactStore();
  const { business } = useBusinessStore();

  // Step 1 — Customer
  const [contactId, setContactId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [customerState, setCustomerState] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [showContactList, setShowContactList] = useState(false);

  // Step 2 — Line Items
  const [items, setItems] = useState<InvoiceItem[]>([{ ...EMPTY_ITEM }]);
  const [isGst, setIsGst] = useState(false);
  const [isInterstate, setIsInterstate] = useState(false);

  // Step 3 — Invoice Details
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('Payment due within 30 days');

  // Init
  useEffect(() => {
    if (business?.id) {
      fetchContacts(business.id);
      getNextNumber(business.id).then(setInvoiceNumber);
    }
  }, [business?.id]);

  // Auto-detect interstate
  useEffect(() => {
    if (business && customerState) {
      // Compare business state with customer state
      const bizState = (business as any).state || '';
      const interstate = bizState && customerState && bizState.toLowerCase() !== customerState.toLowerCase();
      setIsInterstate(interstate);
    }
  }, [customerState, business]);

  // Select contact
  const selectContact = (contact: typeof contacts[0]) => {
    setContactId(contact.id);
    setCustomerName(contact.name);
    setCustomerPhone(contact.phone || '');
    setCustomerEmail(contact.email || '');
    setCustomerGstin(contact.gstin || '');
    setCustomerAddress(contact.address || '');
    setShowContactList(false);
    setContactSearch('');
    if (contact.gstin) setIsGst(true);
  };

  // Recalculate item
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };

    // Recalculate
    const calc = calculateLineItem(
      item.quantity, item.rate, item.discount_percent,
      isGst ? item.gst_rate : 0, isInterstate
    );
    Object.assign(item, calc);
    newItems[index] = item;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { ...EMPTY_ITEM }]);
  const removeItem = (i: number) => items.length > 1 && setItems(items.filter((_, idx) => idx !== i));

  const totals = calculateInvoiceTotals(items);

  const canProceed = () => {
    if (step === 1) return customerName.trim().length > 0;
    if (step === 2) return items.some((i) => i.item_name && i.rate > 0);
    if (step === 3) return invoiceNumber.trim().length > 0;
    return true;
  };

  const handleCreate = async () => {
    if (!business) return;

    const invoice = await createInvoice({
      business_id: business.id,
      document_type: 'invoice',
      invoice_number: invoiceNumber,
      invoice_prefix: invoiceNumber.split('-')[0] || 'INV',
      contact_id: contactId,
      customer_name: customerName,
      customer_phone: customerPhone || null,
      customer_email: customerEmail || null,
      customer_address: customerAddress || null,
      customer_gstin: customerGstin || null,
      customer_state: customerState || null,
      invoice_date: invoiceDate,
      due_date: dueDate || null,
      ...totals,
      balance_due: totals.grand_total,
      amount_paid: 0,
      is_gst_invoice: isGst,
      is_interstate: isInterstate,
      place_of_supply: customerState || null,
      status: 'draft',
      notes: notes || null,
      terms: terms || null,
      template: 'classic',
      show_upi_qr: false,
    }, items.filter((i) => i.item_name && i.rate > 0));

    if (invoice) {
      navigate('/invoices');
    }
  };

  const filteredContacts = contacts.filter((c) => {
    if (!contactSearch) return true;
    const q = contactSearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone?.includes(q);
  });

  return (
    <PageWrapper>
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center gap-3 px-4 h-14
        bg-white/80 backdrop-blur-xl border-b border-neutral-200/60
        dark:bg-black/80 dark:border-white/5">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
            <ArrowLeft size={20} className="text-neutral-600 dark:text-zinc-400" />
          </button>
          <h1 className="text-[17px] font-bold text-neutral-900 dark:text-white">Create Invoice</h1>
          <span className="ml-auto text-xs text-neutral-400 dark:text-zinc-600">Step {step}/4</span>
        </div>

        {/* Progress */}
        <div className="px-4 pt-3 pb-1">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex-1 h-1 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
                <div className={cn('h-full rounded-full transition-all duration-500',
                  s <= step ? 'bg-accent w-full' : 'w-0')} />
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 pt-3 pb-32">

          {/* ===== STEP 1: CUSTOMER ===== */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">Select Customer</h2>
                <p className="text-sm text-neutral-500 dark:text-zinc-400">Choose existing or enter new</p>
              </div>

              {/* Contact Search */}
              <div className="glass-card flex items-center gap-3 px-4 py-3">
                <Search size={18} className="text-neutral-400 flex-shrink-0" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => { setContactSearch(e.target.value); setShowContactList(true); }}
                  onFocus={() => setShowContactList(true)}
                  placeholder="Search contacts..."
                  className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 outline-none"
                />
              </div>

              {/* Contact List */}
              {showContactList && filteredContacts.length > 0 && (
                <div className="glass-card max-h-48 overflow-y-auto divide-y divide-neutral-100 dark:divide-white/5">
                  {filteredContacts.slice(0, 8).map((c) => (
                    <button key={c.id} onClick={() => selectContact(c)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-white/3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-emerald-500">
                          {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{c.name}</p>
                        <p className="text-xs text-neutral-500 dark:text-zinc-500">{c.phone || c.type}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Manual Entry */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-zinc-600">Customer Details</p>
                <Input label="Name *" value={customerName} onChange={setCustomerName} placeholder="Customer name" />
                <Input label="Phone" value={customerPhone} onChange={(v) => setCustomerPhone(v.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" />
                <Input label="Email" value={customerEmail} onChange={setCustomerEmail} placeholder="customer@email.com" />
                <Input label="GSTIN" value={customerGstin} onChange={(v) => { setCustomerGstin(v.toUpperCase().slice(0, 15)); if (v.length > 2) setIsGst(true); }} placeholder="29ABCDE1234F1Z5" />

                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">State</label>
                  <select value={customerState} onChange={(e) => setCustomerState(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#c8ee44]/50 outline-none [&>option]:dark:bg-neutral-900">
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <Input label="Address" value={customerAddress} onChange={setCustomerAddress} placeholder="Full address" />
              </div>
            </div>
          )}

          {/* ===== STEP 2: LINE ITEMS ===== */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">Add Items</h2>
                  <p className="text-sm text-neutral-500 dark:text-zinc-400">{items.length} item{items.length > 1 ? 's' : ''}</p>
                </div>
                {/* GST Toggle */}
                <button onClick={() => setIsGst(!isGst)}
                  className={cn('px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                    isGst ? 'bg-accent text-black' : 'bg-neutral-100 dark:bg-white/8 text-neutral-500 dark:text-zinc-400')}>
                  GST {isGst ? 'ON' : 'OFF'}
                </button>
              </div>

              {isInterstate && isGst && (
                <div className="px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Interstate supply → IGST applies</p>
                </div>
              )}

              {/* Items */}
              {items.map((item, i) => (
                <div key={i} className="glass-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-400 dark:text-zinc-600">Item {i + 1}</span>
                    {items.length > 1 && (
                      <button onClick={() => removeItem(i)} className="p-1 text-red-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <input value={item.item_name} onChange={(e) => updateItem(i, 'item_name', e.target.value)}
                    placeholder="Item name *" className="w-full px-3 py-2.5 rounded-lg text-sm bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 outline-none" />

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-neutral-400 dark:text-zinc-600 mb-1 block">Qty</label>
                      <input type="number" value={item.quantity || ''} onChange={(e) => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white outline-none tabular-nums" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-neutral-400 dark:text-zinc-600 mb-1 block">Unit</label>
                      <select value={item.unit} onChange={(e) => updateItem(i, 'unit', e.target.value)}
                        className="w-full px-2 py-2 rounded-lg text-sm bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white outline-none [&>option]:dark:bg-neutral-900">
                        {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-neutral-400 dark:text-zinc-600 mb-1 block">Rate (₹)</label>
                      <input type="number" value={item.rate || ''} onChange={(e) => updateItem(i, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white outline-none tabular-nums" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-neutral-400 dark:text-zinc-600 mb-1 block">Discount %</label>
                      <input type="number" value={item.discount_percent || ''} onChange={(e) => updateItem(i, 'discount_percent', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white outline-none" />
                    </div>
                    {isGst && (
                      <div>
                        <label className="text-[10px] font-semibold text-neutral-400 dark:text-zinc-600 mb-1 block">GST Rate</label>
                        <select value={item.gst_rate} onChange={(e) => updateItem(i, 'gst_rate', parseFloat(e.target.value))}
                          className="w-full px-2 py-2 rounded-lg text-sm bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white outline-none [&>option]:dark:bg-neutral-900">
                          {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  {isGst && (
                    <input value={item.hsn_sac} onChange={(e) => updateItem(i, 'hsn_sac', e.target.value)}
                      placeholder="HSN/SAC Code" className="w-full px-3 py-2 rounded-lg text-sm bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 outline-none" />
                  )}

                  {/* Line Total */}
                  <div className="flex justify-between pt-1 border-t border-neutral-100 dark:border-white/5">
                    <span className="text-xs text-neutral-500 dark:text-zinc-500">Line total</span>
                    <span className="text-sm font-bold tabular-nums text-neutral-900 dark:text-white">{formatINR(item.total)}</span>
                  </div>
                </div>
              ))}

              <button onClick={addItem}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl
                  bg-neutral-100 dark:bg-white/5 border border-dashed border-neutral-300 dark:border-white/10
                  text-neutral-600 dark:text-zinc-400 text-sm font-semibold
                  hover:bg-neutral-200 dark:hover:bg-white/8 transition-colors">
                <Plus size={16} /> Add Item
              </button>

              {/* Invoice Totals */}
              <div className="glass-card p-4 space-y-2">
                <TotalRow label="Subtotal" value={totals.subtotal} />
                {totals.discount_amount > 0 && <TotalRow label="Discount" value={-totals.discount_amount} negative />}
                <TotalRow label="Taxable Amount" value={totals.taxable_amount} />
                {isGst && !isInterstate && totals.cgst_amount > 0 && (
                  <>
                    <TotalRow label="CGST" value={totals.cgst_amount} />
                    <TotalRow label="SGST" value={totals.sgst_amount} />
                  </>
                )}
                {isGst && isInterstate && totals.igst_amount > 0 && (
                  <TotalRow label="IGST" value={totals.igst_amount} />
                )}
                <div className="border-t border-neutral-200 dark:border-white/10 pt-2 mt-2">
                  <TotalRow label="Grand Total" value={totals.grand_total} bold />
                </div>
              </div>
            </div>
          )}

          {/* ===== STEP 3: DETAILS ===== */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">Invoice Details</h2>
                <p className="text-sm text-neutral-500 dark:text-zinc-400">Number, dates, and terms</p>
              </div>

              <Input label="Invoice Number *" value={invoiceNumber} onChange={setInvoiceNumber} placeholder="INV-0001" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">Invoice Date</label>
                  <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#c8ee44]/50 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">Due Date</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#c8ee44]/50 outline-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                  placeholder="Thank you for your business!"
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium resize-none bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-[#c8ee44]/50 outline-none" />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">Terms & Conditions</label>
                <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={2}
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium resize-none bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-[#c8ee44]/50 outline-none" />
              </div>
            </div>
          )}

          {/* ===== STEP 4: PREVIEW ===== */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Preview</h2>

              <div className="glass-card p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-zinc-600">Invoice</p>
                    <p className="text-lg font-bold text-neutral-900 dark:text-white">{invoiceNumber}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold">Draft</span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-3 border-y border-neutral-100 dark:border-white/5">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-zinc-600 mb-1">Bill To</p>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">{customerName}</p>
                    {customerPhone && <p className="text-xs text-neutral-500 dark:text-zinc-500">{customerPhone}</p>}
                    {customerGstin && <p className="text-xs text-neutral-500 dark:text-zinc-500">GSTIN: {customerGstin}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-zinc-600 mb-1">Date</p>
                    <p className="text-sm text-neutral-900 dark:text-white">{formatDate(new Date(invoiceDate))}</p>
                    {dueDate && <p className="text-xs text-neutral-500 dark:text-zinc-500 mt-1">Due: {formatDate(new Date(dueDate))}</p>}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {items.filter((i) => i.item_name && i.rate > 0).map((item, i) => (
                    <div key={i} className="flex justify-between py-2 border-b border-neutral-100 dark:border-white/5 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">{item.item_name}</p>
                        <p className="text-xs text-neutral-500 dark:text-zinc-500">
                          {item.quantity} {item.unit} × {formatINR(item.rate)}
                          {item.discount_percent > 0 ? ` (-${item.discount_percent}%)` : ''}
                        </p>
                      </div>
                      <p className="text-sm font-bold tabular-nums text-neutral-900 dark:text-white">{formatINR(item.total)}</p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="pt-2 space-y-1.5">
                  <TotalRow label="Subtotal" value={totals.subtotal} />
                  {totals.discount_amount > 0 && <TotalRow label="Discount" value={-totals.discount_amount} negative />}
                  {isGst && !isInterstate && totals.cgst_amount > 0 && (
                    <>
                      <TotalRow label="CGST" value={totals.cgst_amount} />
                      <TotalRow label="SGST" value={totals.sgst_amount} />
                    </>
                  )}
                  {isGst && isInterstate && totals.igst_amount > 0 && (
                    <TotalRow label="IGST" value={totals.igst_amount} />
                  )}
                  <div className="border-t border-neutral-200 dark:border-white/10 pt-2 mt-2">
                    <TotalRow label="Grand Total" value={totals.grand_total} bold />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 safe-bottom
          bg-white/90 backdrop-blur-xl border-t border-neutral-200/60
          dark:bg-[#0a0a0a]/90 dark:border-white/5">
          <div className="max-w-[430px] mx-auto flex gap-3 px-4 py-3">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)}
                className="w-12 h-12 rounded-2xl flex items-center justify-center
                  bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10
                  text-neutral-600 dark:text-zinc-400 active:scale-95 transition-all">
                <ArrowLeft size={20} />
              </button>
            )}
            <button
              onClick={() => step < 4 ? setStep(step + 1) : handleCreate()}
              disabled={!canProceed() || (step === 4 && loading)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl
                bg-gradient-to-r from-[#c8ee44] to-[#a3c428] text-black font-semibold text-[15px]
                shadow-glow-blue active:scale-[0.98] transition-all disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> :
                step === 4 ? <><Check size={18} /> Create Invoice</> :
                <>Continue <ArrowRight size={18} /></>}
            </button>
          </div>
        </div>
    </PageWrapper>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-[#c8ee44]/50 outline-none transition-all" />
    </div>
  );
}

function TotalRow({ label, value, bold, negative }: { label: string; value: number; bold?: boolean; negative?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={cn('text-sm', bold ? 'font-bold text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-zinc-400')}>{label}</span>
      <span className={cn('text-sm tabular-nums', bold ? 'font-bold text-neutral-900 dark:text-white text-base' : 'font-semibold text-neutral-900 dark:text-white',
        negative && 'text-red-500 dark:text-red-400')}>
        {negative ? '-' : ''}{formatINR(Math.abs(value))}
      </span>
    </div>
  );
}
