'use client';

import React, { useState, useRef } from 'react';
import { FileText, Loader2, UploadCloud, Check } from 'lucide-react';
import { processCSVStatement, processLocalDocument } from '@/app/actions';
import { useLanguage } from '@/lib/language';

export default function StatementUploader() {
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setSuccessMsg(null);

    try {
      let res;
      if (file.name.toLowerCase().endsWith('.csv')) {
        const formData = new FormData();
        formData.append('document', file);
        res = await processCSVStatement(formData);
      } else {
        const formData = new FormData();
        formData.append('document', file);
        res = await processLocalDocument(formData);
      }
      setSuccessMsg(t('statement.extracted', { count: res.count }));
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(err.message || t('statement.failed'));
    } finally {
       setIsProcessing(false);
       if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button 
        className="btn" 
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          alignItems: 'center', 
          background: 'rgba(56, 189, 248, 0.1)', 
          border: '1px solid rgba(56, 189, 248, 0.2)',
          color: 'var(--accent-teal)'
        }}
      >
        {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
        {isProcessing ? t('statement.parsing') : t('statement.upload')}
      </button>

      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv,image/*,application/pdf"
        style={{ display: 'none' }}
      />

      {successMsg && (
        <div style={{ position: 'absolute', top: '120%', right: 0, fontSize: '0.85rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.4rem', width: 'max-content' }}>
           <Check size={14} /> {successMsg}
        </div>
      )}
    </div>
  );
}
