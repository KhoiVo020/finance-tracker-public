'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

const dictionary = {
  en: {
    'app.namePrefix': 'Finance',
    'app.nameAccent': 'Track',
    'language.toggle': 'Tieng Viet',
    'language.current': 'English',
    'nav.dashboard': 'Dashboard',
    'nav.transactions': 'Transactions',
    'nav.groceries': 'Grocery Receipts',
    'nav.categories': 'Categories',
    'dashboard.eyebrow': 'Overview',
    'dashboard.title': 'Dashboard',
    'dashboard.totalBalance': 'Total Balance',
    'dashboard.totalIncome': 'Total Income',
    'dashboard.totalExpenses': 'Total Expenses',
    'dashboard.cashFlow': 'Cash Flow Analytics',
    'dashboard.recentTransactions': 'Recent Transactions',
    'transactions.eyebrow': 'History',
    'transactions.title': 'All Transactions',
    'transactions.empty': 'No transactions recorded yet.',
    'transactions.editTitle': 'Edit transaction',
    'transactions.deleteTitle': 'Delete transaction',
    'transactions.new': 'New Transaction',
    'transactions.add': 'Add Transaction',
    'transactions.amount': 'Amount ($)',
    'transactions.date': 'Date',
    'transactions.type': 'Type',
    'transactions.category': 'Category',
    'transactions.description': 'Description',
    'transactions.save': 'Save Transaction',
    'transactions.saving': 'Saving...',
    'transactions.saveChanges': 'Save Changes',
    'transactions.expense': 'Expense',
    'transactions.income': 'Income',
    'transactions.transfer': 'Transfer',
    'transactions.selectCategory': 'Select category...',
    'transactions.descriptionPlaceholder': 'Grocery shopping, Internet bill...',
    'transactions.scanReceipt': 'Import receipt photo',
    'transactions.readingReceipt': 'Reading receipt...',
    'statement.upload': 'Upload Statement',
    'statement.parsing': 'Parsing Document...',
    'statement.extracted': 'Extracted {count} transactions!',
    'statement.failed': 'Failed to process document',
    'grocery.manualPanelEmpty': 'Add Grocery Items Manually',
    'grocery.manualPanelCount': 'Grocery Items ({count}) - subtotal ${total}',
    'grocery.itemName': 'Item name',
    'grocery.group': 'Group',
    'grocery.price': 'Price',
    'grocery.other': 'Other',
    'grocery.addItemTitle': 'Add grocery item',
    'grocery.removeItemTitle': 'Remove grocery item',
    'grocery.manualHint': 'Add item names and prices here to track grocery price history with this transaction.',
    'grocery.item': 'Item',
    'grocery.items': 'items',
    'grocery.addReceipt': 'Add Grocery Receipt',
    'grocery.uploadHint': 'Upload a receipt image to itemize grocery lines and add it to the public demo dataset.',
    'grocery.uploadReceipt': 'Upload Receipt',
    'grocery.readingReceipt': 'Reading Receipt...',
    'grocery.savedReceipt': 'Saved {count} items from {merchant}.',
    'grocery.scanFailed': 'Failed to scan grocery receipt',
    'grocery.eyebrow': 'Price Tracking',
    'grocery.title': 'Grocery Receipts',
    'grocery.addManualItem': 'Add Manual Item',
    'grocery.manualItemHint': 'Add a grocery item and price when you do not have a receipt scan handy.',
    'grocery.storeOptional': 'Store (optional)',
    'grocery.addingItem': 'Adding Item...',
    'grocery.addItemPrice': 'Add Item & Price',
    'grocery.savedManual': 'Saved {name} to grocery price tracking.',
    'grocery.addFailed': 'Failed to add grocery item',
    'grocery.trackedItems': 'Tracked Items',
    'grocery.loggedPurchases': 'Logged Purchases',
    'grocery.lowestSavedPrice': 'Lowest Saved Price',
    'grocery.priceHistory': 'Price History',
    'grocery.search': 'Search items or stores',
    'grocery.all': 'All',
    'grocery.last': 'Last',
    'grocery.average': 'Average',
    'grocery.low': 'Low',
    'grocery.high': 'High',
    'grocery.cheapestStore': 'Cheapest Store',
    'grocery.count': 'Count',
    'grocery.noMatch': 'No grocery items match this view.',
    'grocery.receiptHistory': 'Receipt History',
    'grocery.noReceipts': 'No grocery receipts saved yet.',
    'grocery.recentItems': 'Recent Receipt Items',
    'grocery.uploadStart': 'Upload a grocery receipt to start tracking prices.',
    'grocery.groups': 'Grocery Groups',
    'grocery.newGroup': 'New group name',
    'grocery.keywords': 'Keywords, separated by commas',
    'grocery.addingGroup': 'Adding...',
    'grocery.addGroup': 'Add Group',
    'grocery.saveGroupTitle': 'Save group',
    'grocery.deleteGroupTitle': 'Delete group',
    'grocery.deleteGroupConfirm': 'Delete the {name} grocery group? Existing saved items keep their current group text.',
    'categories.eyebrow': 'Spending Insights',
    'categories.title': 'Categories',
    'categories.totalExpenses': 'Total Expenses',
    'categories.totalIncome': 'Total Income',
    'categories.tracked': 'Categories Tracked',
    'categories.expenses': 'Expenses',
    'categories.income': 'Income',
    'categories.noExpenses': 'No expenses recorded yet.',
    'categories.noIncome': 'No income recorded yet.',
    'categories.txn': 'txn',
    'categories.txns': 'txns',
    'categories.ofTotal': '% of total',
    'categories.edit': 'Edit Categories',
    'categories.manage': 'Manage Categories',
    'categories.noKeywords': 'No keywords',
    'categories.deleteConfirm': 'Are you sure you want to delete this category?',
    'categories.nameLabel': 'Category Name (e.g. Food & Drinks - Dining)',
    'categories.namePlaceholder': 'Category Name',
    'categories.keywordLabel': 'Keywords (comma separated, for auto-scanning)',
    'categories.keywordPlaceholder': 'starbucks,peet,dutch bros',
    'categories.cancel': 'Cancel',
    'categories.save': 'Save',
    'categories.create': 'Create Custom Category',
    'common.loading': 'Loading...',
    'common.chartLoading': 'Loading chart...',
    'common.noChartData': 'No chart data available. Add some transactions!',
  },
  vi: {
    'app.namePrefix': 'Theo dõi',
    'app.nameAccent': 'Tài chính',
    'language.toggle': 'English',
    'language.current': 'Tiếng Việt',
    'nav.dashboard': 'Tổng quan',
    'nav.transactions': 'Giao dịch',
    'nav.groceries': 'Hóa đơn thực phẩm',
    'nav.categories': 'Danh mục',
    'dashboard.eyebrow': 'Tổng quan',
    'dashboard.title': 'Bảng điều khiển',
    'dashboard.totalBalance': 'Tổng số dư',
    'dashboard.totalIncome': 'Tổng thu nhập',
    'dashboard.totalExpenses': 'Tổng chi tiêu',
    'dashboard.cashFlow': 'Phân tích dòng tiền',
    'dashboard.recentTransactions': 'Giao dịch gần đây',
    'transactions.eyebrow': 'Lịch sử',
    'transactions.title': 'Tất cả giao dịch',
    'transactions.empty': 'Chưa có giao dịch nào.',
    'transactions.editTitle': 'Sửa giao dịch',
    'transactions.deleteTitle': 'Xóa giao dịch',
    'transactions.new': 'Giao dịch mới',
    'transactions.add': 'Thêm giao dịch',
    'transactions.amount': 'Số tiền ($)',
    'transactions.date': 'Ngày',
    'transactions.type': 'Loại',
    'transactions.category': 'Danh mục',
    'transactions.description': 'Mô tả',
    'transactions.save': 'Lưu giao dịch',
    'transactions.saving': 'Đang lưu...',
    'transactions.saveChanges': 'Lưu thay đổi',
    'transactions.expense': 'Chi tiêu',
    'transactions.income': 'Thu nhập',
    'transactions.transfer': 'Chuyển khoản',
    'transactions.selectCategory': 'Chọn danh mục...',
    'transactions.descriptionPlaceholder': 'Mua thực phẩm, hóa đơn Internet...',
    'transactions.scanReceipt': 'Nhập ảnh hóa đơn',
    'transactions.readingReceipt': 'Đang đọc hóa đơn...',
    'statement.upload': 'Tải sao kê lên',
    'statement.parsing': 'Đang phân tích tài liệu...',
    'statement.extracted': 'Đã trích xuất {count} giao dịch!',
    'statement.failed': 'Không thể xử lý tài liệu',
    'grocery.manualPanelEmpty': 'Thêm mặt hàng thủ công',
    'grocery.manualPanelCount': 'Mặt hàng thực phẩm ({count}) - tạm tính ${total}',
    'grocery.itemName': 'Tên mặt hàng',
    'grocery.group': 'Nhóm',
    'grocery.price': 'Giá',
    'grocery.other': 'Khác',
    'grocery.addItemTitle': 'Thêm mặt hàng',
    'grocery.removeItemTitle': 'Xóa mặt hàng',
    'grocery.manualHint': 'Thêm tên và giá mặt hàng để theo dõi lịch sử giá thực phẩm trong giao dịch này.',
    'grocery.item': 'mặt hàng',
    'grocery.items': 'mặt hàng',
    'grocery.addReceipt': 'Thêm hóa đơn thực phẩm',
    'grocery.uploadHint': 'Tải ảnh hóa đơn lên để tách từng dòng hàng và thêm vào bộ dữ liệu demo công khai.',
    'grocery.uploadReceipt': 'Tải hóa đơn lên',
    'grocery.readingReceipt': 'Đang đọc hóa đơn...',
    'grocery.savedReceipt': 'Đã lưu {count} mặt hàng từ {merchant}.',
    'grocery.scanFailed': 'Không thể quét hóa đơn thực phẩm',
    'grocery.eyebrow': 'Theo dõi giá',
    'grocery.title': 'Hóa đơn thực phẩm',
    'grocery.addManualItem': 'Thêm mặt hàng thủ công',
    'grocery.manualItemHint': 'Thêm mặt hàng và giá khi bạn không có hóa đơn để quét.',
    'grocery.storeOptional': 'Cửa hàng (không bắt buộc)',
    'grocery.addingItem': 'Đang thêm...',
    'grocery.addItemPrice': 'Thêm mặt hàng và giá',
    'grocery.savedManual': 'Đã lưu {name} vào theo dõi giá thực phẩm.',
    'grocery.addFailed': 'Không thể thêm mặt hàng thực phẩm',
    'grocery.trackedItems': 'Mặt hàng đang theo dõi',
    'grocery.loggedPurchases': 'Lượt mua đã ghi',
    'grocery.lowestSavedPrice': 'Giá thấp nhất đã lưu',
    'grocery.priceHistory': 'Lịch sử giá',
    'grocery.search': 'Tìm mặt hàng hoặc cửa hàng',
    'grocery.all': 'Tất cả',
    'grocery.last': 'Gần nhất',
    'grocery.average': 'Trung bình',
    'grocery.low': 'Thấp',
    'grocery.high': 'Cao',
    'grocery.cheapestStore': 'Cửa hàng rẻ nhất',
    'grocery.count': 'Số lần',
    'grocery.noMatch': 'Không có mặt hàng nào khớp với chế độ xem này.',
    'grocery.receiptHistory': 'Lịch sử hóa đơn',
    'grocery.noReceipts': 'Chưa lưu hóa đơn thực phẩm nào.',
    'grocery.recentItems': 'Mặt hàng hóa đơn gần đây',
    'grocery.uploadStart': 'Tải hóa đơn thực phẩm lên để bắt đầu theo dõi giá.',
    'grocery.groups': 'Nhóm thực phẩm',
    'grocery.newGroup': 'Tên nhóm mới',
    'grocery.keywords': 'Từ khóa, ngăn cách bằng dấu phẩy',
    'grocery.addingGroup': 'Đang thêm...',
    'grocery.addGroup': 'Thêm nhóm',
    'grocery.saveGroupTitle': 'Lưu nhóm',
    'grocery.deleteGroupTitle': 'Xóa nhóm',
    'grocery.deleteGroupConfirm': 'Xóa nhóm thực phẩm {name}? Các mặt hàng đã lưu sẽ giữ nguyên tên nhóm hiện tại.',
    'categories.eyebrow': 'Thông tin chi tiêu',
    'categories.title': 'Danh mục',
    'categories.totalExpenses': 'Tổng chi tiêu',
    'categories.totalIncome': 'Tổng thu nhập',
    'categories.tracked': 'Danh mục đang theo dõi',
    'categories.expenses': 'Chi tiêu',
    'categories.income': 'Thu nhập',
    'categories.noExpenses': 'Chưa ghi nhận chi tiêu nào.',
    'categories.noIncome': 'Chưa ghi nhận thu nhập nào.',
    'categories.txn': 'giao dịch',
    'categories.txns': 'giao dịch',
    'categories.ofTotal': '% của tổng',
    'categories.edit': 'Sửa danh mục',
    'categories.manage': 'Quản lý danh mục',
    'categories.noKeywords': 'Không có từ khóa',
    'categories.deleteConfirm': 'Bạn có chắc muốn xóa danh mục này?',
    'categories.nameLabel': 'Tên danh mục (vd: Đồ ăn & Đồ uống - Ăn ngoài)',
    'categories.namePlaceholder': 'Tên danh mục',
    'categories.keywordLabel': 'Từ khóa (ngăn cách bằng dấu phẩy, dùng để tự động quét)',
    'categories.keywordPlaceholder': 'starbucks,peet,dutch bros',
    'categories.cancel': 'Hủy',
    'categories.save': 'Lưu',
    'categories.create': 'Tạo danh mục tùy chỉnh',
    'common.loading': 'Đang tải...',
    'common.chartLoading': 'Đang tải biểu đồ...',
    'common.noChartData': 'Chưa có dữ liệu biểu đồ. Hãy thêm vài giao dịch!',
  },
} as const;

export type Language = keyof typeof dictionary;
export type TranslationKey = keyof typeof dictionary.en;

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function format(template: string, values?: Record<string, string | number>) {
  if (!values) return template;
  return Object.entries(values).reduce((text, [key, value]) => {
    return text.replaceAll(`{${key}}`, String(value));
  }, template);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const stored = window.localStorage.getItem('finance-tracker-language');
    if (stored === 'en' || stored === 'vi') {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem('finance-tracker-language', nextLanguage);
  };

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    toggleLanguage: () => setLanguage(language === 'en' ? 'vi' : 'en'),
    t: (key, values) => format(dictionary[language][key], values),
  }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider.');
  }
  return context;
}

export function T({ k, values }: { k: TranslationKey; values?: Record<string, string | number> }) {
  const { t } = useLanguage();
  return <>{t(k, values)}</>;
}
