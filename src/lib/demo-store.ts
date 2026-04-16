import { INCOME_CATEGORIES, KW_MAP } from '@/lib/categories';

type DemoGroceryItem = {
  id: string;
  name: string;
  price: number;
  group: string;
  createdAt: Date;
};

type DemoTransaction = {
  id: string;
  amount: number;
  type: string;
  category: string;
  date: Date;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  groceryItems: DemoGroceryItem[];
};

type DemoCategory = {
  id: string;
  name: string;
  type: string;
  keywords: string;
  createdAt: Date;
  updatedAt: Date;
};

type DemoGroceryGroup = {
  id: string;
  name: string;
  keywords: string;
  createdAt: Date;
  updatedAt: Date;
};

type DemoReceiptItem = {
  id: string;
  name: string;
  price: number;
  group: string;
  createdAt: Date;
};

type DemoReceipt = {
  id: string;
  merchant: string;
  total: number;
  subtotal: number | null;
  tax: number | null;
  sourceFileName: string | null;
  date: Date;
  items: DemoReceiptItem[];
  createdAt: Date;
  updatedAt: Date;
};

type DemoData = {
  transactions: DemoTransaction[];
  categories: DemoCategory[];
  groceryGroups: DemoGroceryGroup[];
  groceryReceipts: DemoReceipt[];
};

type GroceryGroupInput = { name: string; keywords: string };

type GroceryItemInput = { name: string; price: number; group?: string };

type ManualGroceryItemInput = {
  name: string;
  price: number;
  group?: string;
  merchant?: string;
  date?: string;
};

type DemoStatementTransaction = {
  date: string;
  amount: number;
  type: string;
  category: string;
  description: string;
};

declare global {
  // eslint-disable-next-line no-var
  var financeTrackerDemoStore: DemoData | undefined;
}

function createId() {
  return crypto.randomUUID();
}

function now() {
  return new Date();
}

function createSeedCategories() {
  const income = INCOME_CATEGORIES.map(name => ({
    id: createId(),
    name,
    type: 'INCOME',
    keywords: name.toLowerCase(),
    createdAt: now(),
    updatedAt: now(),
  }));

  const expenses = KW_MAP.map(([name, keywords]) => ({
    id: createId(),
    name,
    type: 'EXPENSE',
    keywords: keywords.join(','),
    createdAt: now(),
    updatedAt: now(),
  }));

  return [...income, ...expenses];
}

function createSeedGroceryGroups() {
  return [
    { name: 'Produce', keywords: 'apple,banana,orange,lettuce,tomato,onion,potato,carrot,broccoli,spinach,berries,avocado,pepper,cucumber' },
    { name: 'Dairy', keywords: 'milk,cheese,yogurt,butter,cream,eggs,sour cream,cottage cheese,half and half' },
    { name: 'Meat & Seafood', keywords: 'chicken,beef,pork,turkey,steak,sausage,bacon,ham,salmon,shrimp,tuna,fish,seafood' },
    { name: 'Bakery', keywords: 'bread,bagel,muffin,croissant,bun,roll,tortilla,cake,pastry,donut' },
    { name: 'Pantry', keywords: 'rice,pasta,beans,flour,sugar,cereal,oats,oil,sauce,soup,spice,coffee,tea,peanut butter' },
    { name: 'Frozen', keywords: 'frozen,ice cream,pizza,popsicle,waffle' },
    { name: 'Snacks', keywords: 'chips,cracker,cookie,nuts,popcorn,candy,chocolate,granola,pretzel' },
    { name: 'Beverages', keywords: 'water,soda,juice,sparkling,drink,beverage,kombucha,beer,wine' },
    { name: 'Household', keywords: 'paper towel,toilet paper,tissue,detergent,soap,cleaner,trash bag,foil,storage bag' },
    { name: 'Personal Care', keywords: 'shampoo,conditioner,toothpaste,deodorant,lotion,razor,body wash' },
    { name: 'Other', keywords: '' },
  ].map(group => ({
    id: createId(),
    name: group.name,
    keywords: group.keywords,
    createdAt: now(),
    updatedAt: now(),
  }));
}

function createSeedTransactions(): DemoTransaction[] {
  const seed: Array<Omit<DemoTransaction, 'id' | 'createdAt' | 'updatedAt' | 'groceryItems'>> = [
    { amount: 4200, type: 'INCOME', category: 'Salary / Payroll', date: new Date('2026-04-14T09:00:00Z'), description: 'Monthly payroll' },
    { amount: 640, type: 'INCOME', category: 'Freelance / Self-Employed', date: new Date('2026-04-12T14:20:00Z'), description: 'Design project payment' },
    { amount: 124.76, type: 'EXPENSE', category: 'Utilities – Electric & Gas', date: new Date('2026-04-11T08:15:00Z'), description: 'City Electric' },
    { amount: 89.24, type: 'EXPENSE', category: 'Food & Drinks – Groceries', date: new Date('2026-04-10T19:35:00Z'), description: 'Market Fresh' },
    { amount: 31.9, type: 'EXPENSE', category: 'Food & Drinks – Dining', date: new Date('2026-04-09T20:05:00Z'), description: 'Noodle House' },
    { amount: 58.4, type: 'EXPENSE', category: 'Transportation – Gas & Fuel', date: new Date('2026-04-09T09:10:00Z'), description: 'Northside Fuel' },
    { amount: 18.99, type: 'EXPENSE', category: 'Subscriptions – Software & Tools', date: new Date('2026-04-08T13:30:00Z'), description: 'Notion' },
    { amount: 229.99, type: 'EXPENSE', category: 'Shopping – Electronics & Tech', date: new Date('2026-04-07T17:45:00Z'), description: 'Tech Store' },
    { amount: 42.5, type: 'INCOME', category: 'Refunds & Cashback', date: new Date('2026-04-06T11:00:00Z'), description: 'Card cashback' },
    { amount: 22.5, type: 'EXPENSE', category: 'Healthcare – Pharmacy', date: new Date('2026-04-05T10:15:00Z'), description: 'Neighborhood Pharmacy' },
    { amount: 59, type: 'EXPENSE', category: 'Education – Courses & Training', date: new Date('2026-04-04T16:30:00Z'), description: 'Online course' },
    { amount: 28, type: 'EXPENSE', category: 'Personal Care – Beauty', date: new Date('2026-04-03T18:00:00Z'), description: 'Beauty supply' },
  ];

  return seed.map((entry, index) => ({
    id: createId(),
    ...entry,
    createdAt: new Date(entry.date.getTime() - 60000 * (index + 1)),
    updatedAt: new Date(entry.date.getTime() - 60000 * (index + 1)),
    groceryItems: entry.category === 'Food & Drinks – Groceries'
      ? [
          { id: createId(), name: 'Milk', price: 4.29, group: 'Dairy', createdAt: now() },
          { id: createId(), name: 'Eggs', price: 3.99, group: 'Dairy', createdAt: now() },
          { id: createId(), name: 'Bananas', price: 2.19, group: 'Produce', createdAt: now() },
          { id: createId(), name: 'Bread', price: 3.49, group: 'Bakery', createdAt: now() },
        ]
      : [],
  }));
}

function createSeedReceipts(): DemoReceipt[] {
  const receipts: Array<{
    merchant: string;
    total: number;
    subtotal: number;
    tax: number;
    sourceFileName: string;
    date: Date;
    items: Array<{ name: string; price: number; group: string }>;
  }> = [
    {
      merchant: 'Market Fresh',
      total: 34.18,
      subtotal: 32.31,
      tax: 1.87,
      sourceFileName: 'demo-market-fresh.png',
      date: new Date('2026-04-12T19:20:00Z'),
      items: [
        { name: 'Milk', price: 4.29, group: 'Dairy' },
        { name: 'Eggs', price: 3.99, group: 'Dairy' },
        { name: 'Bread', price: 3.49, group: 'Bakery' },
        { name: 'Apples', price: 5.99, group: 'Produce' },
      ],
    },
    {
      merchant: 'Green Valley Market',
      total: 29.72,
      subtotal: 28.11,
      tax: 1.61,
      sourceFileName: 'demo-green-valley.jpg',
      date: new Date('2026-04-09T18:10:00Z'),
      items: [
        { name: 'Spinach', price: 3.99, group: 'Produce' },
        { name: 'Chicken', price: 12.49, group: 'Meat & Seafood' },
        { name: 'Rice', price: 6.19, group: 'Pantry' },
        { name: 'Yogurt', price: 5.45, group: 'Dairy' },
      ],
    },
    {
      merchant: 'Corner Grocery',
      total: 18.22,
      subtotal: 17.11,
      tax: 1.11,
      sourceFileName: 'demo-corner-grocery.pdf',
      date: new Date('2026-04-06T12:45:00Z'),
      items: [
        { name: 'Coffee', price: 8.49, group: 'Pantry' },
        { name: 'Bananas', price: 2.19, group: 'Produce' },
        { name: 'Butter', price: 7.54, group: 'Dairy' },
      ],
    },
  ];

  return receipts.map(receipt => ({
    id: createId(),
    merchant: receipt.merchant,
    total: receipt.total,
    subtotal: receipt.subtotal,
    tax: receipt.tax,
    sourceFileName: receipt.sourceFileName,
    date: receipt.date,
    items: receipt.items.map(item => ({
      id: createId(),
      name: item.name,
      price: item.price,
      group: item.group,
      createdAt: now(),
    })),
    createdAt: now(),
    updatedAt: now(),
  }));
}

function createSeedStore(): DemoData {
  return {
    transactions: createSeedTransactions(),
    categories: createSeedCategories(),
    groceryGroups: createSeedGroceryGroups(),
    groceryReceipts: createSeedReceipts(),
  };
}

function getStore() {
  if (!globalThis.financeTrackerDemoStore) {
    globalThis.financeTrackerDemoStore = createSeedStore();
  }
  return globalThis.financeTrackerDemoStore;
}

function cloneDate(value: Date) {
  return new Date(value.getTime());
}

function toTransaction(transaction: DemoTransaction) {
  return {
    id: transaction.id,
    amount: transaction.amount,
    type: transaction.type,
    category: transaction.category,
    date: cloneDate(transaction.date),
    description: transaction.description,
    createdAt: cloneDate(transaction.createdAt),
    updatedAt: cloneDate(transaction.updatedAt),
    groceryItems: transaction.groceryItems.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      group: item.group,
      createdAt: cloneDate(item.createdAt),
    })),
  };
}

function toCategory(category: DemoCategory) {
  return {
    id: category.id,
    name: category.name,
    type: category.type,
    keywords: category.keywords,
    createdAt: cloneDate(category.createdAt),
    updatedAt: cloneDate(category.updatedAt),
  };
}

function toGroceryGroup(group: DemoGroceryGroup) {
  return {
    id: group.id,
    name: group.name,
    keywords: group.keywords,
    createdAt: cloneDate(group.createdAt),
    updatedAt: cloneDate(group.updatedAt),
  };
}

function toReceipt(receipt: DemoReceipt) {
  return {
    id: receipt.id,
    merchant: receipt.merchant,
    total: receipt.total,
    subtotal: receipt.subtotal,
    tax: receipt.tax,
    sourceFileName: receipt.sourceFileName,
    date: cloneDate(receipt.date),
    createdAt: cloneDate(receipt.createdAt),
    updatedAt: cloneDate(receipt.updatedAt),
    items: receipt.items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      group: item.group,
      createdAt: cloneDate(item.createdAt),
    })),
  };
}

export function isDemoMode() {
  return process.env.DEMO_MODE !== 'false' && process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';
}

export function listDemoTransactions() {
  return getStore().transactions
    .slice()
    .sort((left, right) => right.date.getTime() - left.date.getTime())
    .map(toTransaction);
}

export function addDemoTransaction(data: {
  amount: number;
  type: string;
  category: string;
  description: string;
  date?: Date;
  groceryItems?: GroceryItemInput[];
}) {
  const transactionDate = data.date ? new Date(data.date) : new Date();
  const store = getStore();
  const transaction: DemoTransaction = {
    id: createId(),
    amount: data.amount,
    type: data.type,
    category: data.category,
    date: transactionDate,
    description: data.description,
    createdAt: now(),
    updatedAt: now(),
    groceryItems: (data.groceryItems ?? []).map(item => ({
      id: createId(),
      name: item.name,
      price: item.price,
      group: item.group || 'Other',
      createdAt: now(),
    })),
  };

  store.transactions.unshift(transaction);
  return toTransaction(transaction);
}

export function updateDemoTransaction(id: string, data: { amount: number; type: string; category: string; description: string; date: string; }) {
  const store = getStore();
  const transaction = store.transactions.find(item => item.id === id);
  if (!transaction) throw new Error('Transaction not found.');
  transaction.amount = data.amount;
  transaction.type = data.type;
  transaction.category = data.category;
  transaction.description = data.description;
  transaction.date = new Date(data.date);
  transaction.updatedAt = now();
  return toTransaction(transaction);
}

export function deleteDemoTransaction(id: string) {
  const store = getStore();
  const index = store.transactions.findIndex(item => item.id === id);
  if (index === -1) throw new Error('Transaction not found.');
  store.transactions.splice(index, 1);
}

export function listDemoCategories() {
  return getStore().categories.slice().sort((left, right) => left.name.localeCompare(right.name)).map(toCategory);
}

export function addDemoCategory(data: { name: string; type: string; keywords: string }) {
  const store = getStore();
  const category: DemoCategory = {
    id: createId(),
    name: data.name.trim(),
    type: data.type,
    keywords: data.keywords.trim(),
    createdAt: now(),
    updatedAt: now(),
  };
  store.categories.push(category);
  return toCategory(category);
}

export function updateDemoCategory(id: string, data: { name: string; type: string; keywords: string }) {
  const store = getStore();
  const category = store.categories.find(item => item.id === id);
  if (!category) throw new Error('Category not found.');
  category.name = data.name.trim();
  category.type = data.type;
  category.keywords = data.keywords.trim();
  category.updatedAt = now();
  return toCategory(category);
}

export function deleteDemoCategory(id: string) {
  const store = getStore();
  const index = store.categories.findIndex(item => item.id === id);
  if (index === -1) throw new Error('Category not found.');
  store.categories.splice(index, 1);
}

export function listDemoGroceryGroups() {
  return getStore().groceryGroups.slice().sort((left, right) => left.name.localeCompare(right.name)).map(toGroceryGroup);
}

export function addDemoGroceryGroup(data: GroceryGroupInput) {
  const store = getStore();
  const group: DemoGroceryGroup = {
    id: createId(),
    name: data.name.trim(),
    keywords: data.keywords.trim(),
    createdAt: now(),
    updatedAt: now(),
  };
  store.groceryGroups.push(group);
  return toGroceryGroup(group);
}

export function updateDemoGroceryGroup(id: string, data: GroceryGroupInput) {
  const store = getStore();
  const group = store.groceryGroups.find(item => item.id === id);
  if (!group) throw new Error('Grocery group not found.');
  group.name = data.name.trim();
  group.keywords = data.keywords.trim();
  group.updatedAt = now();
  return toGroceryGroup(group);
}

export function deleteDemoGroceryGroup(id: string) {
  const store = getStore();
  const group = store.groceryGroups.find(item => item.id === id);
  if (!group) throw new Error('Grocery group not found.');
  if (group.name === 'Other') {
    throw new Error('The Other grocery group cannot be deleted.');
  }
  store.groceryGroups = store.groceryGroups.filter(item => item.id !== id);
}

export function listDemoReceipts() {
  return getStore().groceryReceipts.slice().sort((left, right) => right.date.getTime() - left.date.getTime()).map(toReceipt);
}

export function addDemoReceipt(data: {
  merchant: string;
  total: number;
  subtotal?: number | null;
  tax?: number | null;
  sourceFileName?: string | null;
  date?: Date;
  items: GroceryItemInput[];
}) {
  const receipt: DemoReceipt = {
    id: createId(),
    merchant: data.merchant,
    total: data.total,
    subtotal: data.subtotal ?? null,
    tax: data.tax ?? null,
    sourceFileName: data.sourceFileName ?? null,
    date: data.date ?? now(),
    items: data.items.map(item => ({
      id: createId(),
      name: item.name,
      price: item.price,
      group: item.group || 'Other',
      createdAt: now(),
    })),
    createdAt: now(),
    updatedAt: now(),
  };

  getStore().groceryReceipts.unshift(receipt);
  return toReceipt(receipt);
}

export function getDemoGroceryPriceHistory() {
  const receipts = listDemoReceipts();
  const items = receipts.flatMap(receipt => receipt.items.map((item: DemoReceiptItem) => ({
    id: `receipt-${item.id}`,
    name: item.name,
    price: item.price,
    group: item.group || 'Other',
    merchant: receipt.merchant,
    date: receipt.date,
    createdAt: item.createdAt,
  })));

  const history = new Map<string, {
    name: string;
    group: string;
    count: number;
    lastPrice: number;
    averagePrice: number;
    lowestPrice: number;
    highestPrice: number;
    cheapestStore: string;
    lastPurchaseDate: string;
    purchases: {
      id: string;
      price: number;
      merchant: string;
      date: string;
      group: string;
    }[];
  }>();

  for (const item of items) {
    const key = item.name.trim().toLowerCase();
    if (!key) continue;

    const date = item.date.toISOString();
    const purchase = {
      id: item.id,
      price: item.price,
      merchant: item.merchant,
      date,
      group: item.group || 'Other',
    };

    const existing = history.get(key);
    if (!existing) {
      history.set(key, {
        name: item.name,
        group: item.group || 'Other',
        count: 1,
        lastPrice: item.price,
        averagePrice: item.price,
        lowestPrice: item.price,
        highestPrice: item.price,
        cheapestStore: item.merchant,
        lastPurchaseDate: date,
        purchases: [purchase],
      });
      continue;
    }

    existing.count += 1;
    existing.purchases.push(purchase);
    const total = existing.purchases.reduce((sum, purchaseItem) => sum + purchaseItem.price, 0);
    existing.averagePrice = total / existing.purchases.length;

    if (item.price < existing.lowestPrice) {
      existing.lowestPrice = item.price;
      existing.cheapestStore = item.merchant;
    }
    if (item.price > existing.highestPrice) {
      existing.highestPrice = item.price;
    }
    if (item.date.toISOString() > existing.lastPurchaseDate) {
      existing.lastPurchaseDate = item.date.toISOString();
      existing.lastPrice = item.price;
    }
  }

  const rows = Array.from(history.values()).sort(
    (left, right) => new Date(right.lastPurchaseDate).getTime() - new Date(left.lastPurchaseDate).getTime()
  );

  return {
    rows,
    recentItems: items.slice(0, 20).map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      group: item.group || 'Other',
      merchant: item.merchant,
      date: item.date.toISOString(),
    })),
  };
}

export function getDemoStatementTransactions(bankName: string, sourceName: string): DemoStatementTransaction[] {
  const label = sourceName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').trim() || bankName;
  return [
    {
      date: '2026-04-14',
      amount: 4200,
      type: 'INCOME',
      category: 'Salary / Payroll',
      description: `${label} payroll`,
    },
    {
      date: '2026-04-13',
      amount: 54.76,
      type: 'EXPENSE',
      category: 'Transportation – Gas & Fuel',
      description: `${bankName} fuel purchase`,
    },
    {
      date: '2026-04-12',
      amount: 31.9,
      type: 'EXPENSE',
      category: 'Food & Drinks – Dining',
      description: `${bankName} lunch`,
    },
    {
      date: '2026-04-11',
      amount: 18.99,
      type: 'EXPENSE',
      category: 'Subscriptions – Software & Tools',
      description: 'Productivity subscription',
    },
  ];
}
