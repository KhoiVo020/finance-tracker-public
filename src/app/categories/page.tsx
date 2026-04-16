import { prisma } from '@/lib/prisma';
import { isDemoMode, listDemoTransactions } from '@/lib/demo-store';
import { BarChart3 } from 'lucide-react';
import CategoryManager from '@/components/CategoryManager';

export const metadata = { title: 'Categories – Finance Tracker' };

type CategoryData = {
  category: string;
  type: string;
  _sum: { amount: number | null };
  _count: { id: number };
};

async function getCategoryData() {
  if (isDemoMode()) {
    const grouped = new Map<string, CategoryData>();

    for (const transaction of listDemoTransactions()) {
      const key = `${transaction.category}::${transaction.type}`;
      const current = grouped.get(key) ?? {
        category: transaction.category,
        type: transaction.type,
        _sum: { amount: 0 },
        _count: { id: 0 },
      };

      current._sum.amount = (current._sum.amount ?? 0) + transaction.amount;
      current._count.id += 1;
      grouped.set(key, current);
    }

    return Array.from(grouped.values()).sort((left, right) => {
      return (right._sum.amount ?? 0) - (left._sum.amount ?? 0);
    });
  }

  const grouped = await prisma.transaction.groupBy({
    by: ['category', 'type'],
    _sum: { amount: true },
    _count: { id: true },
    orderBy: { _sum: { amount: 'desc' } },
  });
  return grouped;
}

function CategoryBar({ name, amount, total, count, type }: {
  name: string; amount: number; total: number; count: number; type: string;
}) {
  const pct = total > 0 ? Math.min(100, (amount / total) * 100) : 0;
  const color = type === 'INCOME' ? '#22c55e' : '#f43f5e';
  const [group, sub] = name.includes('–') ? name.split('–').map(s => s.trim()) : [name, ''];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>{group}</span>
          {sub && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.4rem' }}>/ {sub}</span>}
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>({count} txn{count !== 1 ? 's' : ''})</span>
        </div>
        <span style={{ fontWeight: 700, color, fontSize: '0.95rem' }}>
          {type === 'INCOME' ? '+' : '-'}${amount.toFixed(2)}
        </span>
      </div>
      <div style={{ height: '8px', borderRadius: '99px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: '99px',
          background: color,
          transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: `0 0 8px ${color}60`,
        }} />
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right' }}>{pct.toFixed(1)}% of total</div>
    </div>
  );
}

export default async function CategoriesPage() {
  const data = await getCategoryData();

  const expenses = data.filter(d => d.type === 'EXPENSE');
  const incomes  = data.filter(d => d.type === 'INCOME');

  const totalExpense = expenses.reduce((s, d) => s + (d._sum.amount ?? 0), 0);
  const totalIncome  = incomes.reduce((s, d) => s + (d._sum.amount ?? 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h3 className="text-muted">Spending Insights</h3>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
            <BarChart3 size={28} style={{ color: 'var(--accent-purple)' }} />
            Categories
          </h1>
        </div>
        <CategoryManager />
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <p className="text-muted" style={{ marginBottom: '0.25rem', fontSize: '0.85rem' }}>Total Expenses</p>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f43f5e', margin: 0 }}>${totalExpense.toFixed(2)}</p>
        </div>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <p className="text-muted" style={{ marginBottom: '0.25rem', fontSize: '0.85rem' }}>Total Income</p>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#22c55e', margin: 0 }}>${totalIncome.toFixed(2)}</p>
        </div>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <p className="text-muted" style={{ marginBottom: '0.25rem', fontSize: '0.85rem' }}>Categories Tracked</p>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-teal)', margin: 0 }}>{data.length}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Expenses */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 0 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f43f5e', display: 'inline-block' }} />
            Expenses
          </h2>
          {expenses.length === 0
            ? <p className="text-muted">No expenses recorded yet.</p>
            : expenses.map(d => (
                <CategoryBar
                  key={d.category}
                  name={d.category}
                  amount={d._sum.amount ?? 0}
                  total={totalExpense}
                  count={d._count.id}
                  type="EXPENSE"
                />
              ))
          }
        </div>

        {/* Income */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 0 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            Income
          </h2>
          {incomes.length === 0
            ? <p className="text-muted">No income recorded yet.</p>
            : incomes.map(d => (
                <CategoryBar
                  key={d.category}
                  name={d.category}
                  amount={d._sum.amount ?? 0}
                  total={totalIncome}
                  count={d._count.id}
                  type="INCOME"
                />
              ))
          }
        </div>
      </div>
    </div>
  );
}
