import { Sidebar } from '@/components/shell/Sidebar';
import { Header } from '@/components/shell/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="crt-soft retro-grid-dim" style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#05050c' }}>
      <Sidebar />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <Header />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
