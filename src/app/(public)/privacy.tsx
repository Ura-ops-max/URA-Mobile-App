import { ShieldCheck } from 'lucide-react-native';
import { LegalPage } from '@/components/info/LegalPage';

// Same text as the website's Privacy Policy (www.ura.com.ng/privacy).
export default function PrivacyScreen() {
  return (
    <LegalPage
      icon={ShieldCheck}
      eyebrow="Your data"
      title="Privacy Policy"
      updated="June 2026"
      intro="Your privacy matters to us. This policy explains what information URA collects, how we use it, and the choices you have."
      sections={[
        {
          heading: 'Information We Collect',
          body: 'We collect the details you provide when you register (such as your name, email, and phone number), information about your listings and orders, and technical data like your device and usage patterns.',
        },
        {
          heading: 'How We Use Your Information',
          body: 'We use your information to operate the marketplace, process payments, personalise your experience, keep the platform secure, and communicate with you about your account and orders.',
        },
        {
          heading: 'Payments',
          body: 'Payment and escrow transactions are handled by our payment partner, Payluk. We share only the information needed to complete a transaction and never store your full card details.',
        },
        {
          heading: 'Sharing Your Information',
          body: 'We do not sell your personal data. We share information with service providers who help us run URA, and when required by law. Sellers and buyers see only the details necessary to complete an order.',
        },
        {
          heading: 'Your Rights',
          body: 'You can access, update, or request deletion of your personal information at any time by contacting us. You may also opt out of non-essential communications. In the app, go to More → Delete account.',
        },
        {
          heading: 'Data Security',
          body: 'We use encryption and industry-standard safeguards to protect your data. No system is completely secure, but we work continuously to keep your information safe.',
        },
      ]}
    />
  );
}
