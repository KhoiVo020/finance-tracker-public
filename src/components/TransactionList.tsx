'use client';

import { useState } from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { deleteTransaction } from '@/app/actions';
import EditTransactionModal from './EditTransactionModal';
import { useLanguage } from '@/lib/language';

export default function TransactionList({ transactions }: { transactions: any[] }) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState<string | null>(null);

  if (transactions.length === 0) {
    return <div className="text-muted" style={{ padding: '2rem 0', textAlign: 'center' }}>{t('transactions.empty')}</div>;
  }

  const editingTx = transactions.find((t) => t.id === editing);

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="glass-card"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}
          >
            {/* Left: description + category/date */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 600, fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tx.description}
              </span>
              <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                {tx.category} &bull; {new Date(tx.date).toLocaleDateString()}
              </span>
            </div>

            {/* Right: amount + action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
              <span style={{
                fontWeight: 700,
                fontSize: '1.1rem',
                color: tx.type === 'INCOME' ? 'var(--success)' : tx.type === 'EXPENSE' ? 'var(--danger)' : 'var(--text-main)'
              }}>
                {tx.type === 'EXPENSE' ? '-' : tx.type === 'INCOME' ? '+' : ''}
                ${tx.amount.toFixed(2)}
              </span>

              {/* Edit */}
              <button
                className="btn-icon"
                title={t('transactions.editTitle')}
                onClick={() => setEditing(tx.id)}
                style={{ color: 'var(--accent-teal)', opacity: 0.8 }}
              >
                <Pencil size={17} />
              </button>

              {/* Delete */}
              <button
                className="btn-icon"
                title={t('transactions.deleteTitle')}
                onClick={() => deleteTransaction(tx.id)}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && editingTx && (
        <EditTransactionModal
          transaction={editingTx}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
