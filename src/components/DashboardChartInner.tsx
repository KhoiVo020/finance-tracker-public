'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '@/lib/language';

export default function DashboardChartInner({ data }: { data: any[] }) {
  const { language, t } = useLanguage();
  // Aggregate data by date
  const chartData = data.reduce((acc: any[], curr) => {
    const dateStr = new Date(curr.date).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric' });
    const existing = acc.find(item => item.date === dateStr);
    
    if (existing) {
      if (curr.type === 'INCOME') existing.income += curr.amount;
      if (curr.type === 'EXPENSE') existing.expense += curr.amount;
    } else {
      acc.push({
        date: dateStr,
        income: curr.type === 'INCOME' ? curr.amount : 0,
        expense: curr.type === 'EXPENSE' ? curr.amount : 0,
      });
    }
    return acc;
  }, []).reverse(); // Reverse to have oldest first

  if (chartData.length === 0) {
    return (
      <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        {t('common.noChartData')}
      </div>
    );
  }

  return (
    <div style={{ height: 300, width: '100%', minWidth: 0, marginTop: '1rem' }}>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-teal)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--accent-teal)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--danger)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', borderRadius: '12px' }}
            itemStyle={{ color: 'var(--text-main)' }}
          />
          <Area type="monotone" dataKey="income" name={t('transactions.income')} stroke="var(--accent-teal)" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
          <Area type="monotone" dataKey="expense" name={t('transactions.expense')} stroke="var(--danger)" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
