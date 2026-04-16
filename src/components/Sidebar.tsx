'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, List, BarChart3, ShoppingCart } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/transactions', label: 'Transactions', icon: List },
  { href: '/groceries', label: 'Grocery Receipts', icon: ShoppingCart },
  { href: '/categories', label: 'Categories', icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <h2>Finance<span className="text-success">Track</span></h2>
      </div>
      <ul className="nav-links">
        {navItems.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className={`nav-link${pathname === href ? ' nav-link-active' : ''}`}
            >
              <Icon size={20} />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
