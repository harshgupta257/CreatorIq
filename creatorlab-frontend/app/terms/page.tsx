import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Use — CreatorIQ',
  description: 'The terms that govern your use of CreatorIQ.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      updated="January 2026"
      sections={[
        { heading: 'Using the service', body: 'CreatorIQ provides analytics on public creator data for informational purposes. You agree not to use the service to harass creators or to violate any platform terms of service.' },
        { heading: 'Forecasts', body: 'Growth predictions are statistical estimates based on historical data. They are not guarantees of future performance.' },
        { heading: 'Availability', body: 'We aim for continuous uptime but may change, suspend or discontinue features at any time. Paid plans can be cancelled at any time.' },
        { heading: 'Contact', body: 'For questions about these terms, email hello@creatoriq.app.' },
      ]}
    />
  );
}
