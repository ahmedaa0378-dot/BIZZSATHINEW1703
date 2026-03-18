// BizzSathi Knowledge Base — injected into chatbot system prompt
// Covers all features, navigation, how-to guides, subscription info

export const BIZZSATHI_KNOWLEDGE_BASE = `
BIZZSATHI APP KNOWLEDGE BASE — Use this to answer user questions about the app:

NAVIGATION:
- Bottom tabs: Home, Transactions, Stock, More
- Floating green mic button: opens Voice Assistant
- Green chat bubble (bottom right): opens this AI Chat
- More page has all settings and tools

HOW TO ADD INCOME / SALE:
1. Tap "Income" quick action on Home page
2. Or go to Transactions tab → tap "+" button
3. Enter amount, select category (Product Sales, Service Income, etc.)
4. Choose payment method (Cash, UPI, Card, etc.)
5. Optionally link a contact and add notes
6. Tap "Save Income"
Alternative: Tell me "sale 300" or "income 500" and I'll log it for you with one tap.

HOW TO ADD EXPENSE:
1. Tap "Expense" quick action on Home page
2. Or go to Transactions tab → tap "+" button → switch to Expense
3. Enter amount, select category (Rent, Transport, Stock Purchase, etc.)
4. Choose payment method, optionally link supplier
5. Tap "Save Expense"
Alternative: Tell me "kharcha 500 petrol" and I'll log it for you.

HOW TO CREATE AN INVOICE:
1. Tap "Invoice" quick action on Home page
2. Or go to More → Invoice Settings (to configure first)
3. Step 1: Select or add customer
4. Step 2: Add line items — product name, quantity, unit, rate, GST rate
5. Step 3: Set invoice number, dates, payment terms
6. Step 4: Preview and save
7. Invoice supports GST (CGST/SGST for same state, IGST for different state)
8. GST rates: 0%, 5%, 12%, 18%, 28%
Alternative: Tell me "invoice banao Ramesh ke liye" and I'll open the invoice form.

HOW TO ADD A CONTACT:
1. Go to More → Contacts
2. Tap "+" button at top
3. Choose type: Customer, Supplier, or Both
4. Enter name, phone, email
5. Expand "More details" for GSTIN, address, credit limit, opening balance
6. Tap "Save Contact"

HOW TO MANAGE STOCK / INVENTORY:
1. Go to Stock tab (3rd tab at bottom)
2. Tap "+" to add a new product
3. Enter: product name, category, unit, sell price, buy price, GST rate
4. Set opening stock and low stock threshold
5. To adjust stock: tap product → "Adjust Stock" → Stock In/Out/Set
6. Low stock items show alerts on Home page and Stock page

HOW TO CHECK REPORTS:
1. Go to More → Reports
2. Available reports: P&L Statement, Category Analysis, Income vs Expense Trend, Receivables Aging, Day Book
3. Select time period: Today, This Week, This Month, This Quarter, Custom
4. Compare with previous period using the comparison toggle
5. Tap any number to drill down into transactions
Alternative: Ask me "aaj ka summary" or "profit margin kaisa hai" for quick answers.

HOW TO USE VOICE ASSISTANT:
1. Tap the green mic button (center bottom)
2. Voice Assistant greets you and asks how to help
3. Speak naturally: "sale 300", "expense add karo", "stock check"
4. Voice guides you step by step — one question at a time
5. Say "haan" or "yes" to confirm actions
6. Say "bas" or "done" to close
7. Works in Hindi and English
8. On mobile: use Chrome browser for best voice support

HOW TO CHANGE LANGUAGE:
1. Tap language dropdown (EN/HI/TE etc.) in top header bar
2. Or go to More → Preferences → Language section
3. Available: English, Hindi, Telugu, Tamil, Gujarati
4. Dashboard labels, tabs, and AI responses change to selected language

HOW TO CHANGE THEME (DARK/LIGHT MODE):
1. Go to More page → Appearance toggle (near top)
2. Or go to More → Preferences → Theme section
3. Options: Light, Dark, System (follows phone setting)

HOW TO EDIT BUSINESS PROFILE:
1. Go to More → Business Profile
2. Edit: business name, owner name, type, category, address
3. Add GSTIN for GST invoices
4. Add bank details (account name, number, IFSC, UPI ID) — these appear on invoices

HOW TO MANAGE PAYMENT METHODS:
1. Go to More → Payment Methods
2. Default methods: Cash, UPI, Card, Bank Transfer, Credit (Udhar), Cheque
3. Add custom methods (e.g., "Paytm", "PhonePe", "Google Pay")
4. Set any method as default
5. Delete methods you don't use

HOW TO CONFIGURE INVOICE SETTINGS:
1. Go to More → Invoice Settings
2. Set invoice number prefix (INV, BILL, etc.)
3. Set default payment terms (days)
4. Set default GST rate
5. Choose template: Classic, Modern, or Minimal
6. Toggle UPI QR code on invoices
7. Set default notes and terms

HOW TO USE MARKETING SUITE:
1. Go to More → Marketing Suite
2. Create Post: choose type (Product Promo, Discount, Festival, etc.)
3. Enter product/offer details
4. Select tone (Professional, Friendly, Urgent, Festive)
5. Tap "Generate Caption" — AI creates caption with emojis and hashtags
6. Copy caption or save post
7. Festival Calendar: see upcoming Indian festivals with countdown

HOW TO FIND DISTRIBUTORS:
1. Go to More → Find Distributors
2. Search by name or product
3. Filter by category (FMCG, Electronics, Clothing, etc.)
4. Tap distributor → see details, call, WhatsApp, get directions
5. Rate distributors (1-5 stars)
6. Add your own distributor listings

HOW TO USE AI INSIGHTS:
1. Go to More → AI Insights
2. Tap "Generate Fresh Insights"
3. AI analyzes your transactions, stock, and invoices
4. Get alerts: spending trends, low stock predictions, revenue changes, overdue invoices
5. Dismiss insights you've seen

HOW TO MANAGE TEAM:
1. Go to More → Team Members
2. Tap "Invite Team Member"
3. Enter name, phone/email, select role
4. Roles: Manager (view/create), Staff (add transactions only), Accountant (view/export only)
5. Owner has full access

HOW TO EXPORT DATA:
1. Go to More → Preferences
2. Tap "Export All Transactions"
3. Downloads CSV file with all transaction data

HOW TO CONFIGURE WHATSAPP:
1. Go to More → WhatsApp
2. Follow setup guide to connect Whapi.Cloud
3. Toggle notifications: daily summary, payment reminders, low stock alerts
4. Set daily summary time
5. View available WhatsApp commands

SUBSCRIPTION PLANS:
- Free: 50 transactions/month, 10 invoices, 25 contacts, 20 products, basic reports, 10 voice commands, 20 chat messages
- Pro (paid): Unlimited everything, all reports, voice, chat, AI insights, WhatsApp, online payments, 2 team members, no branding on invoices
- Business (paid): Everything in Pro + Marketing Suite, Distributor Discovery, 5 team members, priority support
- New users get 7-day free Pro trial
- After trial, drops to Free tier unless upgraded

PAYMENTS & COLLECTIONS:
1. Go to More → Payments & Collections
2. Razorpay handles online payments (UPI, Card, Net Banking)
3. Share invoice with "Pay Now" button to customers
4. Payment auto-marks invoice as paid
5. UPI QR code can be added to invoices (configure in Business Profile → UPI ID)

TROUBLESHOOTING:
- App not loading: Clear browser cache, try incognito mode
- Voice not working: Use Chrome browser, allow microphone permission
- Data not showing: Pull down to refresh, check internet connection
- Login issues: Clear browser data, try signing up with email
- Invoice numbers: Check prefix in More → Invoice Settings
`;