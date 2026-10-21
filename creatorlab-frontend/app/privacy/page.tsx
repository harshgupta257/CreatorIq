import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy — CreatorIQ',
  description: 'How CreatorIQ collects, uses and protects data.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="January 2026"
      sections={[
        { heading: 'What we collect', body: 'CreatorIQ only processes publicly available channel data (videos, statistics and public comments) for the handles you enter. We do not require an account to run an analysis.' },
        { heading: 'How we use it', body: 'Data is used solely to generate the analytics, sentiment scores and forecasts shown in your dashboard. We never sell your data or share it with advertisers.' },
        { heading: 'Local storage', body: 'Your last analyzed channel and dashboard preferences are stored in your browser so the app can restore your session. You can clear them at any time from your browser settings.' },
        { heading: 'Contact', body: 'Questions about privacy? Open an issue at github.com/harshgupta257/CreatorIq/issues.' },
      ]}
    />
  );
}
