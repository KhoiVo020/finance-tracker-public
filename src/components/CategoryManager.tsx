'use client';
import { useState } from 'react';
import { Settings, X, Plus, Pencil, Trash2, Loader2, Save } from 'lucide-react';
import { useCategories } from '@/lib/useCategories';
import { addCategory, updateCategory, deleteCategory } from '@/app/actions';
import { useLanguage } from '@/lib/language';

export default function CategoryManager() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const { categories, loading } = useCategories();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editKeywords, setEditKeywords] = useState('');
  const [editType, setEditType] = useState('EXPENSE');

  const [isSaving, setIsSaving] = useState(false);

  // Filter categories
  const expenses = categories.filter(c => c.type === 'EXPENSE');
  const incomes = categories.filter(c => c.type === 'INCOME');

  function openEdit(cat?: any) {
    if (cat) {
      setEditingId(cat.id);
      setEditName(cat.name);
      setEditKeywords(cat.keywords);
      setEditType(cat.type);
    } else {
      setEditingId('new');
      setEditName('');
      setEditKeywords('');
      setEditType('EXPENSE');
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId === 'new') {
        await addCategory({ name: editName, type: editType, keywords: editKeywords });
      } else if (editingId) {
        await updateCategory(editingId, { name: editName, type: editType, keywords: editKeywords });
      }
      setEditingId(null);
      // Hack to trigger re-fetch in hook (ideally we use SWR or query, but re-render works via refresh action)
      window.location.reload(); 
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('categories.deleteConfirm'))) return;
    setIsSaving(true);
    await deleteCategory(id);
    setIsSaving(false);
    window.location.reload();
  }

  function Row({ c }: { c: any }) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 600 }}>{c.name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
            {c.keywords || t('categories.noKeywords')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-icon" onClick={() => openEdit(c)}><Pencil size={15} style={{ color: 'var(--accent-teal)' }} /></button>
          <button className="btn-icon" onClick={() => handleDelete(c.id)}><Trash2 size={15} style={{ color: 'var(--danger)' }} /></button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button className="btn" onClick={() => setIsOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)' }}>
        <Settings size={18} /> {t('categories.edit')}
      </button>

      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '600px', width: '95vw', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div className="modal-header">
              <h3>{t('categories.manage')}</h3>
              <button className="btn-icon" onClick={() => setIsOpen(false)}><X size={20} /></button>
            </div>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="animate-spin" /></div>
            ) : editingId ? (
              <form onSubmit={handleSave} className="modal-form" style={{ padding: '1rem 0' }}>
                <div className="form-group">
                  <label>{t('transactions.type')}</label>
                  <select value={editType} onChange={e => setEditType(e.target.value)} required>
                    <option value="EXPENSE">{t('transactions.expense')}</option>
                    <option value="INCOME">{t('transactions.income')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('categories.nameLabel')}</label>
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required placeholder={t('categories.namePlaceholder')} />
                </div>
                <div className="form-group">
                  <label>{t('categories.keywordLabel')}</label>
                  <textarea value={editKeywords} onChange={e => setEditKeywords(e.target.value)} required placeholder={t('categories.keywordPlaceholder')} rows={4} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', padding: '0.75rem', width: '100%' }} />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }} onClick={() => setEditingId(null)}>{t('categories.cancel')}</button>
                  <button type="submit" className="btn submit-btn" style={{ flex: 2, display: 'flex', justifyContent: 'center', gap: '0.5rem' }} disabled={isSaving}>
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {t('categories.save')}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <button className="btn" onClick={() => openEdit()} style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
                  <Plus size={16} /> {t('categories.create')}
                </button>

                <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
                  <h4 style={{ color: '#f43f5e', marginTop: 0 }}>{t('categories.expenses')}</h4>
                  {expenses.map(c => <Row key={c.id} c={c} />)}
                  
                  <h4 style={{ color: '#22c55e', marginTop: '1.5rem' }}>{t('categories.income')}</h4>
                  {incomes.map(c => <Row key={c.id} c={c} />)}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
