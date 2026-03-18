import jsPDF from 'jspdf';
import type { Invoice, InvoiceItem } from '../stores/invoiceStore';

interface BusinessInfo {
  name: string;
  ownerName: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  phone?: string;
  email?: string;
  upiId?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
}

function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateStr(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate().toString().padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

export async function generateInvoicePDF(
  invoice: Invoice,
  items: InvoiceItem[],
  business: BusinessInfo
): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const margin = 15;
  const contentW = W - margin * 2;
  let y = margin;

  // Colors
  const accent = [40, 40, 40]; // dark
  const accentGreen = [143, 176, 46]; // #8fb02e
  const gray = [120, 120, 120];
  const lightGray = [240, 240, 240];

  // ===== HEADER =====
  // Green accent bar
  doc.setFillColor(200, 238, 68);
  doc.rect(0, 0, W, 4, 'F');

  y = 12;

  // Business name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...accent);
  doc.text(business.name || 'BizzSathi', margin, y);

  // Invoice label on right
  doc.setFontSize(24);
  doc.setTextColor(...accentGreen);
  doc.text(invoice.document_type?.toUpperCase() || 'INVOICE', W - margin, y, { align: 'right' });

  y += 6;

  // Business details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...gray);

  const bizLines: string[] = [];
  if (business.address) bizLines.push(business.address);
  if (business.city || business.state) bizLines.push([business.city, business.state, business.pincode].filter(Boolean).join(', '));
  if (business.phone) bizLines.push(`Ph: ${business.phone}`);
  if (business.email) bizLines.push(business.email);
  if (business.gstin) bizLines.push(`GSTIN: ${business.gstin}`);

  for (const line of bizLines) {
    doc.text(line, margin, y);
    y += 3.5;
  }

  y = Math.max(y, 32);

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, y, W - margin, y);
  y += 6;

  // ===== INVOICE META (two columns) =====
  const col1X = margin;
  const col2X = W / 2 + 5;

  // Left: Bill To
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...accentGreen);
  doc.text('BILL TO', col1X, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...accent);
  doc.text(invoice.customer_name || '', col1X, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  let billY = y + 9;
  if (invoice.customer_address) { doc.text(invoice.customer_address, col1X, billY); billY += 3.5; }
  if (invoice.customer_state) { doc.text(invoice.customer_state, col1X, billY); billY += 3.5; }
  if (invoice.customer_phone) { doc.text(`Ph: ${invoice.customer_phone}`, col1X, billY); billY += 3.5; }
  if (invoice.customer_gstin) { doc.text(`GSTIN: ${invoice.customer_gstin}`, col1X, billY); billY += 3.5; }

  // Right: Invoice details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...accentGreen);
  doc.text('INVOICE DETAILS', col2X, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...accent);
  let metaY = y + 5;

  const metaRows = [
    ['Invoice No:', invoice.invoice_number],
    ['Date:', formatDateStr(invoice.invoice_date)],
  ];
  if (invoice.due_date) metaRows.push(['Due Date:', formatDateStr(invoice.due_date)]);
  if (invoice.place_of_supply) metaRows.push(['Place of Supply:', invoice.place_of_supply]);

  for (const [label, value] of metaRows) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text(label, col2X, metaY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accent);
    doc.text(value, col2X + 30, metaY);
    metaY += 4.5;
  }

  y = Math.max(billY, metaY) + 6;

  // ===== ITEMS TABLE =====
  const colWidths = invoice.is_gst_invoice
    ? [8, 48, 12, 12, 22, 12, 14, 14, 14, 22] // # | Item | Qty | Unit | Rate | Disc | Tax% | Tax | Total
    : [8, 65, 15, 15, 30, 15, 30]; // # | Item | Qty | Unit | Rate | Disc | Total

  // Table header
  doc.setFillColor(...lightGray);
  doc.rect(margin, y, contentW, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...accent);

  let headerX = margin + 2;
  const headers = invoice.is_gst_invoice
    ? ['#', 'Item', 'Qty', 'Unit', 'Rate', 'Disc%', 'GST%', 'Tax', 'Total']
    : ['#', 'Item', 'Qty', 'Unit', 'Rate', 'Disc', 'Total'];

  const actualWidths = invoice.is_gst_invoice ? colWidths : colWidths;

  for (let i = 0; i < headers.length; i++) {
    const align = i >= 2 ? 'right' : 'left';
    if (align === 'right') {
      doc.text(headers[i], headerX + actualWidths[i] - 2, y + 5, { align: 'right' });
    } else {
      doc.text(headers[i], headerX, y + 5);
    }
    headerX += actualWidths[i];
  }

  y += 9;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];

    if (y > 260) {
      doc.addPage();
      y = margin;
    }

    // Alternate row bg
    if (idx % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y - 1, contentW, 6, 'F');
    }

    doc.setTextColor(...accent);
    let rowX = margin + 2;

    if (invoice.is_gst_invoice) {
      const rowData = [
        String(idx + 1),
        item.item_name.slice(0, 28),
        String(item.quantity),
        item.unit,
        formatINR(item.rate).replace('₹', ''),
        item.discount_percent > 0 ? `${item.discount_percent}%` : '-',
        item.gst_rate > 0 ? `${item.gst_rate}%` : '-',
        formatINR(item.cgst_amount + item.sgst_amount + item.igst_amount).replace('₹', ''),
        formatINR(item.total).replace('₹', ''),
      ];
      for (let i = 0; i < rowData.length; i++) {
        if (i >= 2) {
          doc.text(rowData[i], rowX + colWidths[i] - 2, y + 3, { align: 'right' });
        } else {
          doc.text(rowData[i], rowX, y + 3);
        }
        rowX += colWidths[i];
      }
    } else {
      const simpleWidths = [8, 65, 15, 15, 30, 15, 30];
      const rowData = [
        String(idx + 1),
        item.item_name.slice(0, 38),
        String(item.quantity),
        item.unit,
        formatINR(item.rate).replace('₹', ''),
        item.discount_percent > 0 ? `${item.discount_percent}%` : '-',
        formatINR(item.total).replace('₹', ''),
      ];
      for (let i = 0; i < rowData.length; i++) {
        if (i >= 2) {
          doc.text(rowData[i], rowX + simpleWidths[i] - 2, y + 3, { align: 'right' });
        } else {
          doc.text(rowData[i], rowX, y + 3);
        }
        rowX += simpleWidths[i];
      }
    }

    y += 6;
  }

  // Table bottom line
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, W - margin, y);
  y += 4;

  // ===== TOTALS (right aligned) =====
  const totalsX = W / 2 + 20;
  const totalsValX = W - margin;

  const addTotalRow = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 10 : 9);
    doc.setTextColor(...(bold ? accent : gray));
    doc.text(label, totalsX, y);
    doc.setTextColor(...accent);
    doc.text(value, totalsValX, y, { align: 'right' });
    y += bold ? 6 : 4.5;
  };

  addTotalRow('Subtotal:', formatINR(Number(invoice.subtotal)));

  if (Number(invoice.discount_amount) > 0) {
    addTotalRow('Discount:', `- ${formatINR(Number(invoice.discount_amount))}`);
  }

  if (invoice.is_gst_invoice) {
    addTotalRow('Taxable Amount:', formatINR(Number(invoice.taxable_amount)));
    if (invoice.is_interstate) {
      addTotalRow('IGST:', formatINR(Number(invoice.igst_amount)));
    } else {
      addTotalRow('CGST:', formatINR(Number(invoice.cgst_amount)));
      addTotalRow('SGST:', formatINR(Number(invoice.sgst_amount)));
    }
    addTotalRow('Total Tax:', formatINR(Number(invoice.total_tax)));
  }

  // Grand total with accent bg
  y += 2;
  doc.setFillColor(200, 238, 68);
  doc.rect(totalsX - 5, y - 4, W - margin - totalsX + 5, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('TOTAL:', totalsX, y + 1);
  doc.text(formatINR(Number(invoice.grand_total)), totalsValX, y + 1, { align: 'right' });
  y += 10;

  if (Number(invoice.amount_paid) > 0 && invoice.status !== 'paid') {
    addTotalRow('Amount Paid:', formatINR(Number(invoice.amount_paid)));
    addTotalRow('Balance Due:', formatINR(Number(invoice.balance_due)), true);
  }

  // ===== BANK DETAILS (if available) =====
  if (business.bankAccountNumber || business.upiId) {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...accentGreen);
    doc.text('PAYMENT DETAILS', margin, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...gray);

    if (business.bankAccountName) { doc.text(`Account Name: ${business.bankAccountName}`, margin, y); y += 3.5; }
    if (business.bankAccountNumber) { doc.text(`Account No: ${business.bankAccountNumber}`, margin, y); y += 3.5; }
    if (business.bankIfsc) { doc.text(`IFSC: ${business.bankIfsc}`, margin, y); y += 3.5; }
    if (business.upiId) { doc.text(`UPI: ${business.upiId}`, margin, y); y += 3.5; }
  }

  // ===== NOTES & TERMS =====
  if (invoice.notes || invoice.terms) {
    y += 4;
    if (invoice.notes) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...accentGreen);
      doc.text('NOTES', margin, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...gray);
      const noteLines = doc.splitTextToSize(invoice.notes, contentW);
      doc.text(noteLines, margin, y);
      y += noteLines.length * 3.5 + 2;
    }
    if (invoice.terms) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...accentGreen);
      doc.text('TERMS & CONDITIONS', margin, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...gray);
      const termLines = doc.splitTextToSize(invoice.terms, contentW);
      doc.text(termLines, margin, y);
      y += termLines.length * 3.5;
    }
  }

  // ===== FOOTER =====
  const footerY = 285;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, footerY - 3, W - margin, footerY - 3);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...gray);
  doc.text('Generated by BizzSathi — Your AI Business Partner', margin, footerY);
  doc.text('bizzsathi.com', W - margin, footerY, { align: 'right' });

  // PAID watermark
  if (invoice.status === 'paid') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(60);
    doc.setTextColor(34, 197, 94); // green
    doc.setGState(new (doc as any).GState({ opacity: 0.12 }));
    doc.text('PAID', W / 2, 150, { align: 'center', angle: 35 });
    doc.setGState(new (doc as any).GState({ opacity: 1 }));
  }

  return doc.output('blob');
}

export function downloadInvoicePDF(blob: Blob, invoiceNumber: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${invoiceNumber}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export function shareInvoiceWhatsApp(invoice: Invoice, pdfUrl?: string) {
  const amount = Number(invoice.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const text = [
    `📄 Invoice ${invoice.invoice_number}`,
    `From: ${invoice.customer_name}`,
    `Amount: ₹${amount}`,
    invoice.due_date ? `Due: ${formatDateStr(invoice.due_date)}` : '',
    '',
    'Generated by BizzSathi',
  ].filter(Boolean).join('\n');

  const encoded = encodeURIComponent(text);
  const phone = invoice.customer_phone?.replace(/\D/g, '') || '';
  const whatsappUrl = phone
    ? `https://wa.me/91${phone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  window.open(whatsappUrl, '_blank');
}