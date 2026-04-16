'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addTransaction, getGroceryGroups, scanReceipt } from '@/app/actions';
import { X, Plus, Camera, Loader2, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';
import { useCategories } from '@/lib/useCategories';
import './modal.css';

interface GroceryItem { name: string; price: number; group?: string; }
interface GroceryGroup { id: string; name: string; keywords: string; }
interface ReceiptScanResult {
  amount?: number;
  category?: string;
  description?: string;
  grocery_items?: GroceryItem[];
}

export default function TransactionForm() {
  const { categories: dbCats, loading: catLoading } = useCategories();
  const [isOpen, setIsOpen]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [showGrocery, setShowGrocery]   = useState(false);
  const [groceryGroups, setGroceryGroups] = useState<GroceryGroup[]>([]);
  const [newGroceryName, setNewGroceryName] = useState('');
  const [newGroceryPrice, setNewGroceryPrice] = useState('');
  const [newGroceryGroup, setNewGroceryGroup] = useState('Other');

  const [amount, setAmount]           = useState('');
  const [type, setType]               = useState('EXPENSE');
  const [category, setCategory]       = useState('');
  const [description, setDescription] = useState('');

  const router = useRouter();

  useEffect(() => {
    getGroceryGroups().then(groups => {
      setGroceryGroups(groups);
      setNewGroceryGroup(groups.find(group => group.name === 'Other')?.name ?? groups[0]?.name ?? 'Other');
    });
  }, []);

  function resetForm() {
    setAmount(''); setType('EXPENSE'); setCategory(''); setDescription('');
    setGroceryItems([]); setShowGrocery(false);
    setNewGroceryName(''); setNewGroceryPrice('');
    setNewGroceryGroup(groceryGroups.find(group => group.name === 'Other')?.name ?? groceryGroups[0]?.name ?? 'Other');
  }

  function addManualGroceryLine() {
    const name = newGroceryName.trim();
    const price = Number(newGroceryPrice);
    if (!name || !Number.isFinite(price) || price < 0.01) return;

    setGroceryItems(prev => [...prev, { name, price, group: newGroceryGroup || 'Other' }]);
    setNewGroceryName('');
    setNewGroceryPrice('');
    setShowGrocery(true);
    setType('EXPENSE');
    if (!category) setCategory('Groceries');

    const currentAmount = Number(amount);
    setAmount(Number.isFinite(currentAmount) && amount ? (currentAmount + price).toFixed(2) : price.toFixed(2));
  }

  function removeGroceryLine(index: number) {
    const item = groceryItems[index];
    setGroceryItems(prev => prev.filter((_, i) => i !== index));
    if (!item) return;

    const currentAmount = Number(amount);
    if (Number.isFinite(currentAmount) && amount) {
      setAmount(Math.max(0, currentAmount - item.price).toFixed(2));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    await addTransaction({ 
      amount: parseFloat(amount), 
      type, 
      category, 
      description,
      groceryItems: groceryItems.length > 0 ? groceryItems : undefined
    });
    setLoading(false);
    setIsOpen(false);
    resetForm();
    router.refresh();
  }

  async function handleScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    try {
      const formData = new FormData();
      formData.append('receipt', file);
      const data: ReceiptScanResult = await scanReceipt(formData);

      if (data.amount)      setAmount(data.amount.toString());
      if (data.category)    setCategory(data.category);
      if (data.description) setDescription(data.description);
      setType('EXPENSE');
      setShowGrocery(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to scan receipt';
      alert(message);
    } finally {
      setIsScanning(false);
      e.target.value = '';
    }
  }

  const groceryTotal = groceryItems.reduce((s, i) => s + i.price, 0);

  return (
    <>
      <button className="btn" onClick={() => setIsOpen(true)} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <Plus size={20} /> Add Transaction
      </button>

      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '520px', width: '95vw' }}>
            <div className="modal-header">
              <h3>New Transaction</h3>
              <button className="btn-icon" onClick={() => { setIsOpen(false); resetForm(); }}><X size={20} /></button>
            </div>

            <div className="scan-section" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(56,189,248,0.08)', borderRadius: '12px', border: '1px dashed var(--accent-teal)' }}>
              {isScanning ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--accent-teal)' }}>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Reading receipt...</span>
                </div>
              ) : (
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--accent-teal)', fontWeight: 600 }}>
                  <Camera size={20} />
                  <span>Import receipt photo</span>
                  <input type="file" accept="image/*,application/pdf" onChange={handleScan} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            {/* ── Grocery items panel ── */}
            <div style={{ marginBottom: '1.5rem', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.05)' }}>
                <button
                  type="button"
                  onClick={() => setShowGrocery(v => !v)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                    <ShoppingCart size={16} style={{ color: '#22c55e' }} />
                    {groceryItems.length === 0
                      ? 'Add Grocery Items Manually'
                      : `Grocery Items (${groceryItems.length}) - subtotal $${groceryTotal.toFixed(2)}`}
                  </span>
                  {showGrocery ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showGrocery && (
                  <div style={{ padding: '0 1rem 0.75rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 90px auto', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <input
                        value={newGroceryName}
                        onChange={(e) => setNewGroceryName(e.target.value)}
                        placeholder="Item name"
                        disabled={isScanning}
                      />
                      <select
                        value={newGroceryGroup}
                        onChange={(e) => setNewGroceryGroup(e.target.value)}
                        disabled={isScanning}
                      >
                        {groceryGroups.length === 0 ? (
                          <option value="Other">Other</option>
                        ) : groceryGroups.map(group => (
                          <option key={group.id} value={group.name}>{group.name}</option>
                        ))}
                      </select>
                      <input
                        value={newGroceryPrice}
                        onChange={(e) => setNewGroceryPrice(e.target.value)}
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="Price"
                        disabled={isScanning}
                      />
                      <button
                        type="button"
                        className="btn-icon"
                        title="Add grocery item"
                        onClick={addManualGroceryLine}
                        disabled={isScanning || !newGroceryName.trim() || Number(newGroceryPrice) < 0.01}
                        style={{ color: '#22c55e' }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {groceryItems.length === 0 ? (
                      <p className="text-muted" style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                        Add item names and prices here to track grocery price history with this transaction.
                      </p>
                    ) : (
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                              <th style={{ textAlign: 'left', padding: '0.3rem 0', color: 'var(--text-muted)', fontWeight: 500 }}>Item</th>
                              <th style={{ textAlign: 'left', padding: '0.3rem 0', color: 'var(--text-muted)', fontWeight: 500 }}>Group</th>
                              <th style={{ textAlign: 'right', padding: '0.3rem 0', color: 'var(--text-muted)', fontWeight: 500 }}>Price</th>
                              <th style={{ width: 34 }} />
                            </tr>
                          </thead>
                          <tbody>
                            {groceryItems.map((item, i) => (
                              <tr key={`${item.name}-${i}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '0.3rem 0', color: 'var(--text-main)' }}>{item.name}</td>
                                <td style={{ padding: '0.3rem 0', color: 'var(--text-muted)' }}>{item.group || 'Other'}</td>
                                <td style={{ padding: '0.3rem 0', textAlign: 'right', color: '#22c55e', fontWeight: 600 }}>${item.price.toFixed(2)}</td>
                                <td style={{ padding: '0.3rem 0', textAlign: 'right' }}>
                                  <button
                                    type="button"
                                    className="btn-icon"
                                    title="Remove grocery item"
                                    onClick={() => removeGroceryLine(i)}
                                    style={{ width: 28, height: 28, color: 'var(--danger)' }}
                                  >
                                    <X size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
            </div>

            {/* ── Form fields ── */}
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Amount ($)</label>
                <input type="number" step="0.01" required placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isScanning} />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select required value={type} onChange={(e) => setType(e.target.value)} disabled={isScanning}>
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                  <option value="TRANSFER">Transfer</option>
                </select>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select required value={category} onChange={(e) => setCategory(e.target.value)} disabled={isScanning || catLoading}>
                  <option value="" disabled>{catLoading ? 'Loading...' : 'Select category...'}</option>
                  {(type === 'INCOME' 
                    ? dbCats.filter(c => c.type === 'INCOME').map(c => c.name) 
                    : type === 'EXPENSE' 
                      ? dbCats.filter(c => c.type === 'EXPENSE').map(c => c.name)
                      : ['Transfer', 'Others']).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" required placeholder="Grocery shopping, Internet bill..." value={description} onChange={(e) => setDescription(e.target.value)} disabled={isScanning} />
              </div>
              <button type="submit" className="btn submit-btn" disabled={loading || isScanning}>
                {loading ? 'Saving...' : 'Save Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
