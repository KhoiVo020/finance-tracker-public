'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, List, BarChart3, ShoppingCart } from 'lucide-react';
import { useLanguage, type TranslationKey } from '@/lib/language';

const navItems = [
  { href: '/', label: 'nav.dashboard', icon: Home },
  { href: '/transactions', label: 'nav.transactions', icon: List },
  { href: '/groceries', label: 'nav.groceries', icon: ShoppingCart },
  { href: '/categories', label: 'nav.categories', icon: BarChart3 },
] satisfies Array<{ href: string; label: TranslationKey; icon: typeof Home }>;

export default function Sidebar() {
  const pathname = usePathname();
  const { language, t, toggleLanguage } = useLanguage();

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <h2>{t('app.namePrefix')}<span className="text-success"> {t('app.nameAccent')}</span></h2>
      </div>
      <ul className="nav-links">
        {navItems.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className={`nav-link${pathname === href ? ' nav-link-active' : ''}`}
            >
              <Icon size={20} />
              {t(label)}
            </Link>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="language-toggle"
        onClick={toggleLanguage}
        aria-label={language === 'en' ? 'Translate interface to Vietnamese' : 'Translate interface to English'}
      >
        <span>{t('language.current')}</span>
        <strong>{t('language.toggle')}</strong>
      </button>
    </nav>
  );
}
