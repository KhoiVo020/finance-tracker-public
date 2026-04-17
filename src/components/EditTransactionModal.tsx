'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2 } from 'lucide-react';
import { updateTransaction } from '@/app/actions';
import { useCategories } from '@/lib/useCategories';
import { useLanguage } from '@/lib/language';
import './modal.css';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  category: string;
  description: string;
  date: string | Date;
}

export default function EditTransactionModal({
  transaction,
  onClose,
}: {
  transaction: Transaction;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { categories: dbCats, loading: catLoading } = useCategories();

  // Format date string for <input type="date">
  const toDateInput = (d: string | Date) =>
    new Date(d).toISOString().split('T')[0];

  const [amount, setAmount] = useState(transaction.amount.toString());
  const [type, setType] = useState(transaction.type);
  const [category, setCategory] = useState(transaction.category);
  const [description, setDescription] = useState(transaction.description);
  const [date, setDate] = useState(toDateInput(transaction.date));

  // Reset category if type changes and current category doesn't belong to new type
  function handleTypeChange(newType: string) {
    setType(newType);
    setCategory('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateTransaction(transaction.id, {
        amount: parseFloat(amount),
        type,
        category,
        description,
        date,
      });
      router.refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const categoryOptions = type === 'INCOME'
    ? dbCats.filter(c => c.type === 'INCOME').map(c => c.name)
    : type === 'EXPENSE'
      ? dbCats.filter(c => c.type === 'EXPENSE').map(c => c.name)
      : ['Transfer', 'Others'];

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content glass-card">
        {/* Header */}
        <div className="modal-header">
          <h3>{t('transactions.editTitle')}</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Amount */}
          <div className="form-group">
            <label>{t('transactions.amount')}</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Date */}
          <div className="form-group">
            <label>{t('transactions.date')}</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Type */}
          <div className="form-group">
            <label>{t('transactions.type')}</label>
            <select required value={type} onChange={(e) => handleTypeChange(e.target.value)}>
              <option value="EXPENSE">{t('transactions.expense')}</option>
              <option value="INCOME">{t('transactions.income')}</option>
              <option value="TRANSFER">{t('transactions.transfer')}</option>
            </select>
          </div>

          {/* Category */}
          <div className="form-group">
            <label>{t('transactions.category')}</label>
            <select required value={category} onChange={(e) => setCategory(e.target.value)} disabled={catLoading}>
              <option value="" disabled>{catLoading ? t('common.loading') : t('transactions.selectCategory')}</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="form-group">
            <label>{t('transactions.description')}</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button type="submit" className="btn submit-btn" disabled={saving}>
            {saving ? <><Loader2 size={16} className="animate-spin" /> {t('transactions.saving')}</> : t('transactions.saveChanges')}
          </button>
        </form>
      </div>
    </div>
  );
}
