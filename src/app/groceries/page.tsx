import { ShoppingCart } from 'lucide-react';
import { getGroceryGroups, getGroceryPriceHistory, getGroceryReceipts } from '@/app/actions';
import GroceryTracker from '@/components/GroceryTracker';
import GroceryReceiptUploader from '@/components/GroceryReceiptUploader';

export const metadata = { title: 'Grocery Receipts - Finance Tracker' };

export default async function GroceriesPage() {
  const [history, groups, receipts] = await Promise.all([
    getGroceryPriceHistory(),
    getGroceryGroups(),
    getGroceryReceipts(),
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h3 className="text-muted">Price Tracking</h3>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
          <ShoppingCart size={30} style={{ color: 'var(--accent-teal)' }} />
          Grocery Receipts
        </h1>
      </div>

      <GroceryTracker
        rows={history.rows}
        recentItems={history.recentItems}
        receipts={receipts.map(receipt => ({
          id: receipt.id,
          merchant: receipt.merchant,
          total: receipt.total,
          subtotal: receipt.subtotal,
          tax: receipt.tax,
          sourceFileName: receipt.sourceFileName,
          date: receipt.date.toISOString(),
          itemCount: receipt.items.length,
        }))}
        groups={groups.map(group => ({
          id: group.id,
          name: group.name,
          keywords: group.keywords,
        }))}
        uploader={<GroceryReceiptUploader />}
      />
    </div>
  );
}
