'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addGroceryReceipt } from '@/app/actions';
import { Check, Loader2, ReceiptText, UploadCloud } from 'lucide-react';
import { useLanguage } from '@/lib/language';

export default function GroceryReceiptUploader() {
  const { t } = useLanguage();
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
      setMessage(t('grocery.savedReceipt', { count: result.itemCount, merchant: result.merchant }));
      router.refresh();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('grocery.scanFailed');
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
          {t('grocery.addReceipt')}
        </h2>
        <p className="text-muted" style={{ lineHeight: 1.5 }}>
          {t('grocery.uploadHint')}
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
        {isScanning ? t('grocery.readingReceipt') : t('grocery.uploadReceipt')}
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
