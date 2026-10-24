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
        { heading: 'Estimates', body: 'Performance insights and expected-view ranges are statistical estimates based on historical data. They are not guarantees of future performance.' },
        { heading: 'Availability', body: 'CreatorIQ is a free project hosted on free-tier infrastructure (Vercel and Render). The backend may take around 30 seconds to wake up after inactivity, and features may change or be discontinued at any time.' },
        { heading: 'Contact', body: 'For questions about these terms, open an issue at github.com/harshgupta257/CreatorIq/issues.' },
      ]}
    />
  );
}
