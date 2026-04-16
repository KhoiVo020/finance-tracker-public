import { getTransactions } from './actions';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';
import DashboardChart from '@/components/DashboardChart';
import StatementUploader from '@/components/StatementUploader';

export default async function DashboardPage() {
  const transactions = await getTransactions();

  // Calculate metrics
  const monthlyIncome = transactions
    .filter((t: any) => t.type === 'INCOME')
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const monthlyExpense = transactions
    .filter((t: any) => t.type === 'EXPENSE')
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const totalBalance = monthlyIncome - monthlyExpense;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h3 className="text-muted">Overview</h3>
          <h1>Dashboard</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <StatementUploader />
          <TransactionForm />
        </div>
      </div>

      {/* Hero Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        <div className="glass-card">
          <h3 className="text-muted">Total Balance</h3>
          <h2 style={{ fontSize: '2rem', marginBottom: 0 }}>${totalBalance.toFixed(2)}</h2>
        </div>
        <div className="glass-card">
          <h3 className="text-muted">Total Income</h3>
          <h2 className="text-success" style={{ fontSize: '2rem', marginBottom: 0 }}>${monthlyIncome.toFixed(2)}</h2>
        </div>
        <div className="glass-card">
          <h3 className="text-muted">Total Expenses</h3>
          <h2 className="text-danger" style={{ fontSize: '2rem', marginBottom: 0 }}>${monthlyExpense.toFixed(2)}</h2>
        </div>
      </div>

      {/* Chart Section */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h2>Cash Flow Analytics</h2>
        <DashboardChart data={transactions} />
      </div>

      {/* Recent Transactions */}
      <div>
        <h2 style={{ marginBottom: '1.5rem' }}>Recent Transactions</h2>
        <TransactionList transactions={transactions.slice(0, 5)} />
      </div>

    </div>
  );
}
