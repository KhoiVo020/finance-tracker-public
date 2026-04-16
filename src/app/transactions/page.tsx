import { getTransactions } from '@/app/actions';
import TransactionList from '@/components/TransactionList';
import TransactionForm from '@/components/TransactionForm';

export default async function TransactionsPage() {
  const transactions = await getTransactions();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h3 className="text-muted">History</h3>
          <h1>All Transactions</h1>
        </div>
        <TransactionForm />
      </div>

      <div className="glass-card" style={{ padding: '2rem', minHeight: '60vh' }}>
        <TransactionList transactions={transactions} />
      </div>

    </div>
  );
}
