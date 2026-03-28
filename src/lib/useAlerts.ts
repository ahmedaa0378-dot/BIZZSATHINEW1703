import { useMemo } from 'react';
import { useInvoiceStore } from '../stores/invoiceStore';
import { useProductStore } from '../stores/productStore';
import { useReminderStore } from '../stores/reminderStore';
import { useBusinessStore, trialDaysLeft } from '../stores/appStore';

export interface Alert {
  id: string;
  title: string;
  body: string;
  type: 'overdue' | 'low_stock' | 'reminder' | 'trial' | 'info';
  action_url?: string;
  created_at: string;
}

export function useAlerts(): Alert[] {
  const { invoices } = useInvoiceStore();
  const { products } = useProductStore();
  const { reminders } = useReminderStore();
  const { business } = useBusinessStore();

  return useMemo(() => {
    const alerts: Alert[] = [];
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Trial expiry (show first — most important)
    if (business && business.subscriptionTier === 'trial') {
      const days = trialDaysLeft(business);
      if (days === 0) {
        alerts.push({
          id: 'trial-expired',
          title: 'Trial expired',
          body: 'Upgrade to Pro to continue using BizSaathi',
          type: 'trial',
          action_url: '/subscription',
          created_at: now.toISOString(),
        });
      } else if (days <= 3) {
        alerts.push({
          id: 'trial-expiring',
          title: `Trial expires in ${days} day${days > 1 ? 's' : ''}`,
          body: 'Upgrade now to keep full access',
          type: 'trial',
          action_url: '/subscription',
          created_at: now.toISOString(),
        });
      }
    }

    // Overdue invoices
    invoices
      .filter(inv => inv.due_date && inv.due_date < today && !['paid', 'cancelled', 'draft'].includes(inv.status))
      .slice(0, 5)
      .forEach(inv => {
        alerts.push({
          id: `inv-${inv.id}`,
          title: `Invoice ${inv.invoice_number} overdue`,
          body: `₹${Number(inv.balance_due).toLocaleString('en-IN')} from ${inv.customer_name}`,
          type: 'overdue',
          action_url: '/invoices',
          created_at: inv.invoice_date,
        });
      });

    // Low stock
    products
      .filter(p => p.is_active && p.low_stock_threshold > 0 && p.current_stock <= p.low_stock_threshold)
      .slice(0, 5)
      .forEach(p => {
        alerts.push({
          id: `stock-${p.id}`,
          title: `${p.name} — low stock`,
          body: `Only ${p.current_stock} ${p.unit} left (threshold: ${p.low_stock_threshold})`,
          type: 'low_stock',
          action_url: '/stock',
          created_at: now.toISOString(),
        });
      });

    // Overdue reminders
    reminders
      .filter(r => !r.completed && new Date(r.due_date) < now)
      .slice(0, 5)
      .forEach(r => {
        alerts.push({
          id: `rem-${r.id}`,
          title: r.title,
          body: 'Reminder overdue',
          type: 'reminder',
          action_url: '/more/reminders',
          created_at: r.due_date,
        });
      });

    return alerts;
  }, [invoices, products, reminders, business]);
}