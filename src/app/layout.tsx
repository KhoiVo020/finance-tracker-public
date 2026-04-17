import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { LanguageProvider } from '@/lib/language';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Finance Tracker',
  description: 'Premium local finance usage tracker',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <LanguageProvider>
          <div className="app-container">
            <Sidebar />
            
            <main className="main-content">
              {children}
            </main>
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
