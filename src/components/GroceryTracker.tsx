'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { addGroceryGroup, addManualGroceryItem, deleteGroceryGroup, updateGroceryGroup } from '@/app/actions';
import { Check, Plus, Save, Search, ShoppingBasket, Trash2 } from 'lucide-react';

type GroceryGroup = {
  id: string;
  name: string;
  keywords: string;
};

type GroceryHistoryRow = {
  name: string;
  group: string;
  count: number;
  lastPrice: number;
  averagePrice: number;
  lowestPrice: number;
  highestPrice: number;
  cheapestStore: string;
  lastPurchaseDate: string;
};

type RecentGroceryItem = {
  id: string;
  name: string;
  price: number;
  group: string;
  merchant: string;
  date: string;
};

type GroceryReceiptSummary = {
  id: string;
  merchant: string;
  total: number;
  subtotal: number | null;
  tax: number | null;
  sourceFileName: string | null;
  date: string;
  itemCount: number;
};

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function shortDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function todayInputValue() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

export default function GroceryTracker({
  rows,
  recentItems,
  receipts,
  groups,
  uploader,
}: {
  rows: GroceryHistoryRow[];
  recentItems: RecentGroceryItem[];
  receipts: GroceryReceiptSummary[];
  groups: GroceryGroup[];
  uploader: ReactNode;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [manualMessage, setManualMessage] = useState<string | null>(null);
  const [manualName, setManualName] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualMerchant, setManualMerchant] = useState('');
  const [manualDate, setManualDate] = useState(todayInputValue);
  const [manualGroup, setManualGroup] = useState(
    () => groups.find(group => group.name === 'Other')?.name ?? groups[0]?.name ?? 'Other'
  );
  const [newName, setNewName] = useState('');
  const [newKeywords, setNewKeywords] = useState('');
  const [drafts, setDrafts] = useState<Record<string, { name: string; keywords: string }>>(
    () => Object.fromEntries(groups.map(group => [group.id, { name: group.name, keywords: group.keywords }]))
  );

  const groupNames = useMemo(
    () => ['All', ...Array.from(new Set(groups.map(group => group.name)))],
    [groups]
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return rows.filter(row => {
      const matchesQuery = !normalizedQuery
        || row.name.toLowerCase().includes(normalizedQuery)
        || row.cheapestStore.toLowerCase().includes(normalizedQuery);
      const matchesGroup = selectedGroup === 'All' || row.group === selectedGroup;
      return matchesQuery && matchesGroup;
    });
  }, [query, rows, selectedGroup]);

  const totalPurchases = rows.reduce((sum, row) => sum + row.count, 0);
  const lowestTracked = rows.length > 0
    ? Math.min(...rows.map(row => row.lowestPrice))
    : 0;

  async function handleAddGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSavingId('new');
    try {
      await addGroceryGroup({ name: newName, keywords: newKeywords });
      setNewName('');
      setNewKeywords('');
      router.refresh();
    } finally {
      setSavingId(null);
    }
  }

  async function handleAddManualItem(e: React.FormEvent) {
    e.preventDefault();
    setIsAddingManual(true);
    setManualMessage(null);

    try {
      await addManualGroceryItem({
        name: manualName,
        price: Number(manualPrice),
        group: manualGroup,
        merchant: manualMerchant,
        date: manualDate,
      });
      setManualMessage(`Saved ${manualName.trim()} to grocery price tracking.`);
      setManualName('');
      setManualPrice('');
      setManualMerchant('');
      setManualDate(todayInputValue());
      router.refresh();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to add grocery item');
    } finally {
      setIsAddingManual(false);
    }
  }

  async function handleSaveGroup(groupId: string) {
    const draft = drafts[groupId];
    if (!draft?.name.trim()) return;
    setSavingId(groupId);
    try {
      await updateGroceryGroup(groupId, draft);
      router.refresh();
    } finally {
      setSavingId(null);
    }
  }

  async function handleDeleteGroup(group: GroceryGroup) {
    if (group.name === 'Other') return;
    if (!confirm(`Delete the ${group.name} grocery group? Existing saved items keep their current group text.`)) {
      return;
    }
    setSavingId(group.id);
    try {
      await deleteGroceryGroup(group.id);
      router.refresh();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', alignItems: 'stretch' }}>
        {uploader}

        <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <ShoppingBasket size={22} style={{ color: 'var(--accent-teal)' }} />
              Add Manual Item
            </h2>
            <p className="text-muted" style={{ lineHeight: 1.5 }}>
              Add a grocery item and price when you do not have a receipt scan handy.
            </p>
          </div>

          <form onSubmit={handleAddManualItem} style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(120px, 0.45fr)', gap: '0.75rem' }}>
              <input
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Item name"
                required
              />
              <input
                value={manualPrice}
                onChange={(e) => setManualPrice(e.target.value)}
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Price"
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(150px, 0.6fr)', gap: '0.75rem' }}>
              <select value={manualGroup} onChange={(e) => setManualGroup(e.target.value)}>
                {groups.length === 0 ? (
                  <option value="Other">Other</option>
                ) : groups.map(group => (
                  <option key={group.id} value={group.name}>{group.name}</option>
                ))}
              </select>
              <input
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                type="date"
                required
              />
            </div>
            <input
              value={manualMerchant}
              onChange={(e) => setManualMerchant(e.target.value)}
              placeholder="Store (optional)"
            />
            <button
              type="submit"
              className="btn"
              disabled={isAddingManual}
              style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}
            >
              <Plus size={16} /> {isAddingManual ? 'Adding Item...' : 'Add Item & Price'}
            </button>
          </form>

          {manualMessage && (
            <p className="text-success" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Check size={16} /> {manualMessage}
            </p>
          )}
        </section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        <div className="glass-card">
          <h3 className="text-muted">Tracked Items</h3>
          <h2 style={{ fontSize: '2rem', marginBottom: 0 }}>{rows.length}</h2>
        </div>
        <div className="glass-card">
          <h3 className="text-muted">Logged Purchases</h3>
          <h2 style={{ fontSize: '2rem', marginBottom: 0 }}>{totalPurchases}</h2>
        </div>
        <div className="glass-card">
          <h3 className="text-muted">Lowest Saved Price</h3>
          <h2 className="text-success" style={{ fontSize: '2rem', marginBottom: 0 }}>{money(lowestTracked)}</h2>
        </div>
      </div>

      <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
          <h2 style={{ marginBottom: 0 }}>Price History</h2>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', minWidth: 420 }}>
            <label style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search items or stores"
                style={{ paddingLeft: '2.3rem' }}
              />
            </label>
            <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} style={{ maxWidth: 180 }}>
              {groupNames.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Item</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Group</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Last</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Average</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Low</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>High</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Cheapest Store</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Count</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-muted" style={{ padding: '2rem 0.5rem', textAlign: 'center' }}>
                    No grocery items match this view.
                  </td>
                </tr>
              ) : filteredRows.map(row => (
                <tr key={row.name.toLowerCase()} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>{row.name}</td>
                  <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>{row.group}</td>
                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--accent-teal)', fontWeight: 700 }}>{money(row.lastPrice)}</td>
                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>{money(row.averagePrice)}</td>
                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--success)' }}>{money(row.lowestPrice)}</td>
                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>{money(row.highestPrice)}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{row.cheapestStore}</td>
                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '2rem', alignItems: 'start' }}>
        <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ marginBottom: 0 }}>Receipt History</h2>
          {receipts.length === 0 ? (
            <p className="text-muted">No grocery receipts saved yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {receipts.map(receipt => (
                <div key={receipt.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{receipt.merchant}</div>
                    <div className="text-muted" style={{ fontSize: '0.82rem' }}>
                      {shortDate(receipt.date)} &bull; {receipt.itemCount} item{receipt.itemCount === 1 ? '' : 's'}
                      {receipt.sourceFileName ? ` &bull; ${receipt.sourceFileName}` : ''}
                    </div>
                  </div>
                  <div style={{ color: 'var(--accent-teal)', fontWeight: 800 }}>{money(receipt.total)}</div>
                </div>
              ))}
            </div>
          )}

          <h2 style={{ marginBottom: 0 }}>Recent Receipt Items</h2>
          {recentItems.length === 0 ? (
            <p className="text-muted">Upload a grocery receipt to start tracking prices.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recentItems.map(item => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{item.name}</div>
                    <div className="text-muted" style={{ fontSize: '0.82rem' }}>{item.group} &bull; {item.merchant} &bull; {shortDate(item.date)}</div>
                  </div>
                  <div style={{ color: 'var(--accent-teal)', fontWeight: 800 }}>{money(item.price)}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ marginBottom: 0 }}>Grocery Groups</h2>
          <form onSubmit={handleAddGroup} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New group name" />
            <textarea value={newKeywords} onChange={(e) => setNewKeywords(e.target.value)} placeholder="Keywords, separated by commas" rows={3} />
            <button type="submit" className="btn" disabled={savingId === 'new'} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={16} /> {savingId === 'new' ? 'Adding...' : 'Add Group'}
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {groups.map(group => (
              <div key={group.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.5rem', alignItems: 'start', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.9rem' }}>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <input
                    value={drafts[group.id]?.name ?? group.name}
                    onChange={(e) => setDrafts(prev => ({ ...prev, [group.id]: { ...(prev[group.id] ?? group), name: e.target.value } }))}
                    aria-label={`${group.name} group name`}
                  />
                  <textarea
                    value={drafts[group.id]?.keywords ?? group.keywords}
                    onChange={(e) => setDrafts(prev => ({ ...prev, [group.id]: { ...(prev[group.id] ?? group), keywords: e.target.value } }))}
                    rows={2}
                    aria-label={`${group.name} keywords`}
                  />
                </div>
                <button className="btn-icon" title="Save group" onClick={() => handleSaveGroup(group.id)} disabled={savingId === group.id}>
                  <Save size={16} />
                </button>
                <button className="btn-icon" title="Delete group" onClick={() => handleDeleteGroup(group)} disabled={savingId === group.id || group.name === 'Other'}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
