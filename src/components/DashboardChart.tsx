'use client';

import dynamic from 'next/dynamic';

// Lazy-load the heavy Recharts chart — avoid bundling it in the initial JS
// and prevent SSR dimension warnings
const LazyChart = dynamic(() => import('./DashboardChartInner'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: 300,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-muted)',
      background: 'rgba(255,255,255,0.02)',
      borderRadius: '12px',
    }}>
      Loading chart…
    </div>
  ),
});

export default function DashboardChart({ data }: { data: any[] }) {
  return <LazyChart data={data} />;
}

