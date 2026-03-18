import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';

type Tab = 'terms' | 'privacy';

export default function LegalPage() {
  const [tab, setTab] = useState<Tab>('terms');
  const navigate = useNavigate();

  return (
    <PageWrapper>
      <div className="sticky top-0 z-50 flex items-center gap-3 px-4 h-14
        bg-white/80 backdrop-blur-xl border-b border-neutral-200/60
        dark:bg-black/80 dark:border-white/5">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
          <ArrowLeft size={20} className="text-neutral-600 dark:text-zinc-400" />
        </button>
        <h1 className="text-[17px] font-bold text-neutral-900 dark:text-white">Legal</h1>
      </div>

      {/* Tab toggle */}
      <div className="px-4 pt-3">
        <div className="flex gap-2 p-1 rounded-2xl bg-neutral-100 dark:bg-white/5">
          <button onClick={() => setTab('terms')}
            className={cn('flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all',
              tab === 'terms' ? 'bg-white dark:bg-white/10 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 dark:text-zinc-500')}>
            Terms of Service
          </button>
          <button onClick={() => setTab('privacy')}
            className={cn('flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all',
              tab === 'privacy' ? 'bg-white dark:bg-white/10 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 dark:text-zinc-500')}>
            Privacy Policy
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 pb-24 animate-fade-in">
        <div className="glass-card p-5">
          {tab === 'terms' ? <TermsContent /> : <PrivacyContent />}
        </div>
      </div>
    </PageWrapper>
  );
}

function TermsContent() {
  return (
    <div className="space-y-5 text-sm text-neutral-700 dark:text-zinc-300 leading-relaxed">
      <div>
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">Terms of Service</h2>
        <p className="text-xs text-neutral-400 dark:text-zinc-600">Last updated: March 2026</p>
      </div>

      <p>Welcome to BizzSathi ("we", "our", "us"). By accessing or using the BizzSathi application ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, please do not use the Service.</p>

      <Section title="1. About the Service">
        BizzSathi is a business management platform designed for Micro, Small, and Medium Enterprises (MSMEs) in India. The Service provides tools for financial management, invoicing, inventory tracking, customer management, AI-powered insights, and marketing assistance.
      </Section>

      <Section title="2. Eligibility">
        You must be at least 18 years old and legally capable of entering into a binding agreement to use this Service. By registering, you represent that all information you provide is accurate and complete.
      </Section>

      <Section title="3. Account Registration">
        You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. We are not liable for any loss arising from unauthorized access to your account.
      </Section>

      <Section title="4. Subscription Plans & Payments">
        BizzSathi offers Free, Pro, and Business subscription tiers. Free accounts are subject to usage limits as described in the application. Paid subscriptions are billed monthly through Razorpay. All payments are in Indian Rupees (INR). Subscriptions auto-renew unless cancelled before the renewal date. Refunds are subject to our refund policy and applicable Indian consumer protection laws.
      </Section>

      <Section title="5. Free Trial">
        New users receive a 7-day free trial of Pro features. After the trial ends, your account reverts to the Free tier unless you subscribe. No payment information is required for the trial.
      </Section>

      <Section title="6. Acceptable Use">
        You agree not to: (a) use the Service for any unlawful purpose; (b) upload false, misleading, or fraudulent business data; (c) attempt to gain unauthorized access to other users' accounts or data; (d) reverse-engineer, decompile, or modify the Service; (e) use automated tools to scrape or extract data from the Service; (f) transmit viruses, malware, or harmful code.
      </Section>

      <Section title="7. Data Ownership">
        You retain ownership of all business data you enter into BizzSathi. We do not claim any intellectual property rights over your data. You grant us a limited license to process, store, and display your data solely for the purpose of providing the Service.
      </Section>

      <Section title="8. AI Features">
        BizzSathi uses artificial intelligence (powered by OpenAI) for voice assistant, chatbot, insights, and content generation features. AI outputs are generated suggestions and should not be treated as professional financial, legal, or tax advice. You are responsible for verifying AI-generated content before acting on it. We do not guarantee the accuracy of AI outputs.
      </Section>

      <Section title="9. GST & Invoicing Disclaimer">
        BizzSathi provides invoicing tools with GST calculation capabilities. However, we are not a licensed tax consultant or chartered accountant. GST calculations are based on the rates and information you provide. You are solely responsible for the accuracy of your invoices, tax filings, and compliance with applicable Indian tax laws including the Goods and Services Tax Act, 2017.
      </Section>

      <Section title="10. Service Availability">
        We strive to maintain 99.9% uptime but do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control. We are not liable for any loss resulting from Service downtime.
      </Section>

      <Section title="11. Limitation of Liability">
        To the maximum extent permitted by Indian law, BizzSathi and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of the Service. Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim.
      </Section>

      <Section title="12. Termination">
        We may suspend or terminate your account if you violate these Terms. You may delete your account at any time from the Settings page. Upon termination, your data will be retained for 30 days for recovery purposes, after which it will be permanently deleted.
      </Section>

      <Section title="13. Modifications">
        We reserve the right to modify these Terms at any time. Material changes will be communicated via email or in-app notification at least 15 days before they take effect. Continued use of the Service after changes constitutes acceptance.
      </Section>

      <Section title="14. Governing Law & Disputes">
        These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Hyderabad, Telangana, India. Before initiating legal proceedings, parties agree to attempt resolution through good-faith negotiation for at least 30 days.
      </Section>

      <Section title="15. Contact Us">
        If you have questions about these Terms, contact us at: support@bizzsathi.com
      </Section>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div className="space-y-5 text-sm text-neutral-700 dark:text-zinc-300 leading-relaxed">
      <div>
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">Privacy Policy</h2>
        <p className="text-xs text-neutral-400 dark:text-zinc-600">Last updated: March 2026</p>
      </div>

      <p>BizzSathi ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your information when you use our application ("Service"). This policy complies with the Information Technology Act, 2000, the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and the Digital Personal Data Protection Act, 2023.</p>

      <Section title="1. Information We Collect">
        <strong>Account Information:</strong> Name, email address, phone number, business name, business address, and GSTIN (if provided).
        {'\n\n'}
        <strong>Business Data:</strong> Transactions (income/expenses), invoices, contacts (customers/suppliers), products/inventory, and financial records you enter into the Service.
        {'\n\n'}
        <strong>Usage Data:</strong> Device information, browser type, IP address, pages visited, features used, and interaction timestamps — collected automatically for analytics and improvement.
        {'\n\n'}
        <strong>Location Data:</strong> GPS coordinates (only when you explicitly enable location for distributor discovery or business profile). We do not track location in the background.
        {'\n\n'}
        <strong>Voice & Chat Data:</strong> Voice recordings (processed in real-time, not stored) and chat messages with the AI assistant (used for generating responses, not stored permanently on our servers).
      </Section>

      <Section title="2. How We Use Your Information">
        We use your information to: (a) provide and maintain the Service; (b) process transactions, invoices, and business operations; (c) generate AI-powered insights, captions, and recommendations; (d) send service notifications (account updates, payment reminders); (e) improve the Service through aggregated, anonymized analytics; (f) comply with legal obligations under Indian law.
      </Section>

      <Section title="3. Data Storage & Security">
        Your data is stored on Supabase servers (cloud infrastructure by AWS) in the Mumbai (ap-south-1) region, ensuring data residency within India. We implement industry-standard security measures including: encryption in transit (TLS 1.3), encryption at rest (AES-256), Row Level Security (RLS) ensuring users can only access their own data, and regular security audits. Despite our efforts, no method of electronic storage is 100% secure.
      </Section>

      <Section title="4. Third-Party Services">
        We use the following third-party services that may process your data:
        {'\n\n'}
        <strong>Supabase</strong> — Database and authentication (data stored in India).
        {'\n\n'}
        <strong>OpenAI</strong> — AI features (voice, chat, insights, captions). Your prompts and business context are sent to OpenAI's API for processing. OpenAI's data usage policy applies. We do not send sensitive financial data (bank accounts, passwords) to OpenAI.
        {'\n\n'}
        <strong>Razorpay</strong> — Payment processing. Payment data is handled directly by Razorpay and subject to their privacy policy. We do not store your card numbers or bank details.
        {'\n\n'}
        <strong>Vercel</strong> — Application hosting.
        {'\n\n'}
        All third-party providers are bound by their respective privacy policies and data protection agreements.
      </Section>

      <Section title="5. Data Sharing">
        We do NOT sell, rent, or trade your personal or business data to any third party. We may share data only: (a) with your explicit consent; (b) with service providers necessary to operate the Service (listed above); (c) to comply with legal obligations, court orders, or government requests under Indian law; (d) to protect our rights, safety, or property.
      </Section>

      <Section title="6. Data Retention">
        We retain your data for as long as your account is active. If you delete your account, we will delete your data within 30 days, except where retention is required by law (e.g., financial records under the Companies Act or Income Tax Act may need to be retained for up to 8 years). Anonymized, aggregated data may be retained indefinitely for analytics.
      </Section>

      <Section title="7. Your Rights">
        Under Indian data protection laws, you have the right to: (a) access your personal data; (b) correct inaccurate data; (c) delete your account and associated data; (d) export your data in a machine-readable format (CSV); (e) withdraw consent for data processing; (f) file a complaint with the Data Protection Board of India. To exercise these rights, contact us at support@bizzsathi.com.
      </Section>

      <Section title="8. Cookies & Local Storage">
        We use browser local storage (not cookies) to maintain your session, theme preference, and language setting. No third-party tracking cookies are used. We do not serve advertisements.
      </Section>

      <Section title="9. Children's Privacy">
        The Service is not intended for users under 18 years of age. We do not knowingly collect data from minors. If we learn that a minor has provided personal data, we will delete it promptly.
      </Section>

      <Section title="10. Changes to This Policy">
        We may update this Privacy Policy from time to time. Material changes will be communicated via email or in-app notification at least 15 days before they take effect. The "Last updated" date at the top indicates the latest revision.
      </Section>

      <Section title="11. Grievance Officer">
        In accordance with the Information Technology Act, 2000, the name and contact details of the Grievance Officer are:
        {'\n\n'}
        Name: BizzSathi Support Team{'\n'}
        Email: grievance@bizzsathi.com{'\n'}
        Response time: Within 48 hours of receiving a complaint.
      </Section>

      <Section title="12. Contact Us">
        For privacy-related questions or concerns:{'\n\n'}
        Email: support@bizzsathi.com{'\n'}
        Website: bizzsathi.com
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-2">{title}</h3>
      <p className="whitespace-pre-line">{children}</p>
    </div>
  );
}