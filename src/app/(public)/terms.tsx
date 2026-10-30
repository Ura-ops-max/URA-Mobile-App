import { FileText } from 'lucide-react-native';
import { LegalPage } from '@/components/info/LegalPage';

// Same text as the website's Terms of Service (www.ura.com.ng/terms); the payments
// section matches how the backend pays out (the website's page still says both types are held).
export default function TermsScreen() {
  return (
    <LegalPage
      icon={FileText}
      eyebrow="Legal"
      title="Terms of Service"
      updated="June 2026"
      intro="Welcome to URA. By creating an account or using our marketplace, you agree to these Terms of Service. Please read them carefully."
      sections={[
        {
          heading: 'Using URA',
          body: 'You must be at least 18 years old to buy or sell on URA. You are responsible for keeping your account credentials secure and for all activity that happens under your account.',
        },
        {
          heading: 'Buying and Selling',
          body: 'Sellers are responsible for the accuracy of their listings, pricing, and fulfilment of orders. Buyers agree to pay for items they order. URA facilitates transactions but is not a party to the contract of sale between a buyer and a seller.',
        },
        {
          heading: 'Payments and Buyer Protection',
          body: 'Payments are processed through our payment partner, Payluk. At checkout you can choose Normal Payment or Buyer-Protected Payment (escrow). With Normal Payment, your payment goes straight to the seller and there is no extra fee for you, so there is no buyer protection. With Buyer-Protected Payment, your payment is held securely and released to the seller only once you confirm you received your order (or when the delivery window ends without a reported problem); you pay a small fee for this protection. Applicable fees are shown before you complete a payment.',
        },
        {
          heading: 'Prohibited Activity',
          body: 'You may not use URA to list illegal items, engage in fraud, harass other users, or infringe on intellectual property. We may suspend or remove accounts that violate these terms.',
        },
        {
          heading: 'Limitation of Liability',
          body: 'URA is provided on an "as is" basis. To the fullest extent permitted by law, we are not liable for indirect or consequential losses arising from your use of the platform.',
        },
        {
          heading: 'Changes to These Terms',
          body: 'We may update these terms from time to time. Continued use of URA after changes take effect means you accept the updated terms.',
        },
      ]}
    />
  );
}
