'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addGroceryReceipt } from '@/app/actions';
import { Check, Loader2, ReceiptText, UploadCloud } from 'lucide-react';

export default function GroceryReceiptUploader() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const result = await addGroceryReceipt(formData);
      setMessage(`Saved ${result.itemCount} items from ${result.merchant}.`);
      router.refresh();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to scan grocery receipt';
      alert(errorMessage);
    } finally {
      setIsScanning(false);
      e.target.value = '';
    }
  }

  return (
    <section className="glass-card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.25rem', alignItems: 'center' }}>
      <div>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <ReceiptText size={22} style={{ color: 'var(--accent-teal)' }} />
          Add Grocery Receipt
        </h2>
        <p className="text-muted" style={{ lineHeight: 1.5 }}>
          Upload a receipt image to itemize grocery lines and add it to the public demo dataset.
        </p>
        {message && (
          <p className="text-success" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.75rem' }}>
            <Check size={16} /> {message}
          </p>
        )}
      </div>

      <button
        type="button"
        className="btn"
        onClick={() => fileInputRef.current?.click()}
        disabled={isScanning}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 210, justifyContent: 'center' }}
      >
        {isScanning ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
        {isScanning ? 'Reading Receipt...' : 'Upload Receipt'}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        style={{ display: 'none' }}
      />
    </section>
  );
}
