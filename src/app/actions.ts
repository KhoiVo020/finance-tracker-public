'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { categorizeLocally } from '@/lib/categories';
import {
  addDemoCategory,
  addDemoGroceryGroup,
  addDemoReceipt,
  addDemoTransaction,
  deleteDemoCategory,
  deleteDemoGroceryGroup,
  deleteDemoTransaction,
  getDemoGroceryPriceHistory,
  getDemoStatementTransactions,
  isDemoMode,
  listDemoCategories,
  listDemoGroceryGroups,
  listDemoReceipts,
  listDemoTransactions,
  updateDemoCategory,
  updateDemoGroceryGroup,
  updateDemoTransaction,
} from '@/lib/demo-store';

const OCR_SERVICE_URL = 'http://127.0.0.1:8000';

const DEFAULT_GROCERY_GROUPS = [
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
];

type GroceryItemInput = { name: string; price: number; group?: string };
type ManualGroceryItemInput = {
  name: string;
  price: number;
  group?: string;
  merchant?: string;
  date?: string;
};
type GroceryReceiptScanItem = { name: string; price: number; group?: string };
type GroceryReceiptScanResult = {
  merchant: string;
  total?: number | null;
  subtotal?: number | null;
  tax?: number | null;
  items: GroceryReceiptScanItem[];
  raw_rows?: string[];
};
let ocrServiceStartPromise: Promise<void> | null = null;

async function isOcrServiceUp() {
  try {
    const health = await fetch(`${OCR_SERVICE_URL}/health`, { cache: 'no-store' });
    return health.ok;
  } catch {
    return false;
  }
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function getResponseErrorMessage(res: Response) {
  const text = await res.text();
  try {
    const body = JSON.parse(text) as { detail?: unknown };
    if (typeof body.detail === 'string') return body.detail;
  } catch {
    // The OCR service may return plain text for framework-level errors.
  }
  return text || res.statusText;
}

async function startOcrService() {
  if (await isOcrServiceUp()) return;
  if (!ocrServiceStartPromise) {
    ocrServiceStartPromise = (async () => {
      const [{ spawn }, path, fs] = await Promise.all([
        import('node:child_process'),
        import('node:path'),
        import('node:fs'),
      ]);
      const ocrDir = path.join(process.cwd(), 'python-ocr');
      const venvPython = path.join(ocrDir, 'venv', 'Scripts', 'python.exe');
      const child = fs.existsSync(venvPython)
        ? spawn(
            venvPython,
            ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000'],
            {
              cwd: ocrDir,
              detached: true,
              stdio: 'ignore',
              windowsHide: true,
            }
          )
        : spawn(
            'cmd.exe',
            ['/c', 'start.bat'],
            {
              cwd: ocrDir,
              detached: true,
              stdio: 'ignore',
              windowsHide: true,
            }
          );
      child.unref();

      for (let attempt = 0; attempt < 180; attempt++) {
        if (await isOcrServiceUp()) return;
        await delay(1000);
      }

      throw new Error('Python OCR service did not finish starting. Try running python-ocr/start.bat once to install or repair the OCR environment.');
    })().finally(() => {
      ocrServiceStartPromise = null;
    });
  }

  await ocrServiceStartPromise;
}

export async function getTransactions() {
  if (isDemoMode()) {
    return listDemoTransactions();
  }

  return prisma.transaction.findMany({
    include: {
      groceryItems: {
        select: {
          id: true,
          name: true,
          price: true,
          group: true,
        },
      },
    },
    orderBy: { date: 'desc' },
  });
}

export async function addTransaction(data: {
  amount: number;
  type: string;
  category: string;
  description: string;
  groceryItems?: GroceryItemInput[];
}) {
  if (isDemoMode()) {
    addDemoTransaction({
      amount: data.amount,
      type: data.type,
      category: data.category,
      description: data.description,
      groceryItems: data.groceryItems,
    });
    revalidatePath('/');
    revalidatePath('/transactions');
    revalidatePath('/groceries');
    return;
  }

  await prisma.transaction.create({
    data: {
      amount: data.amount,
      type: data.type,
      category: data.category,
      description: data.description,
      date: new Date(),
      groceryItems: data.groceryItems && data.groceryItems.length > 0 ? {
        create: data.groceryItems.map(item => ({
          name: item.name,
          price: item.price,
          group: item.group || 'Other',
        }))
      } : undefined,
    },
  });
  revalidatePath('/');
  revalidatePath('/transactions');
  revalidatePath('/groceries');
}

export async function deleteTransaction(id: string) {
  if (isDemoMode()) {
    deleteDemoTransaction(id);
    revalidatePath('/');
    revalidatePath('/transactions');
    revalidatePath('/groceries');
    return;
  }

  await prisma.transaction.delete({
    where: { id },
  });
  revalidatePath('/');
  revalidatePath('/transactions');
  revalidatePath('/groceries');
}

export async function updateTransaction(id: string, data: {
  amount: number;
  type: string;
  category: string;
  description: string;
  date: string;
}) {
  if (isDemoMode()) {
    updateDemoTransaction(id, data);
    revalidatePath('/');
    revalidatePath('/transactions');
    revalidatePath('/groceries');
    return;
  }

  await prisma.transaction.update({
    where: { id },
    data: {
      amount: data.amount,
      type: data.type,
      category: data.category,
      description: data.description,
      date: new Date(data.date),
    },
  });
  revalidatePath('/');
  revalidatePath('/transactions');
  revalidatePath('/groceries');
}

// --- Categories Actions ---

export async function getCategories() {
  if (isDemoMode()) {
    return listDemoCategories();
  }

  const count = await prisma.category.count();
  if (count === 0) {
    // Seed default categories
    const { INCOME_CATEGORIES, KW_MAP } = await import('@/lib/categories');
    const incomeData = INCOME_CATEGORIES.map(name => ({
      name,
      type: 'INCOME',
      keywords: name.toLowerCase() // just default to its name
    }));
    await prisma.category.createMany({ data: incomeData });

    const expenseData = KW_MAP.map(([name, kws]) => ({
      name,
      type: 'EXPENSE',
      keywords: kws.join(',')
    }));
    await prisma.category.createMany({ data: expenseData });
  }

  return prisma.category.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function addCategory(data: { name: string; type: string; keywords: string }) {
  if (isDemoMode()) {
    addDemoCategory(data);
    revalidatePath('/categories');
    return;
  }

  await prisma.category.create({ data });
  revalidatePath('/categories');
}

export async function updateCategory(id: string, data: { name: string; type: string; keywords: string }) {
  if (isDemoMode()) {
    updateDemoCategory(id, data);
    revalidatePath('/categories');
    return;
  }

  await prisma.category.update({ where: { id }, data });
  revalidatePath('/categories');
}

export async function deleteCategory(id: string) {
  if (isDemoMode()) {
    deleteDemoCategory(id);
    revalidatePath('/categories');
    return;
  }

  await prisma.category.delete({ where: { id } });
  revalidatePath('/categories');
}

// --- Grocery Actions ---

async function ensureDefaultGroceryGroups() {
  const count = await prisma.groceryGroup.count();
  if (count === 0) {
    await prisma.groceryGroup.createMany({ data: DEFAULT_GROCERY_GROUPS });
  }
}

export async function getGroceryGroups() {
  if (isDemoMode()) {
    return listDemoGroceryGroups();
  }

  await ensureDefaultGroceryGroups();
  return prisma.groceryGroup.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function addGroceryGroup(data: { name: string; keywords: string }) {
  if (isDemoMode()) {
    addDemoGroceryGroup(data);
    revalidatePath('/groceries');
    return;
  }

  await prisma.groceryGroup.create({
    data: {
      name: data.name.trim(),
      keywords: data.keywords.trim(),
    },
  });
  revalidatePath('/groceries');
}

export async function updateGroceryGroup(id: string, data: { name: string; keywords: string }) {
  if (isDemoMode()) {
    updateDemoGroceryGroup(id, data);
    revalidatePath('/groceries');
    return;
  }

  await prisma.groceryGroup.update({
    where: { id },
    data: {
      name: data.name.trim(),
      keywords: data.keywords.trim(),
    },
  });
  revalidatePath('/groceries');
}

export async function deleteGroceryGroup(id: string) {
  if (isDemoMode()) {
    deleteDemoGroceryGroup(id);
    revalidatePath('/groceries');
    return;
  }

  const group = await prisma.groceryGroup.findUnique({ where: { id } });
  if (group?.name === 'Other') {
    throw new Error('The Other grocery group cannot be deleted.');
  }
  await prisma.groceryGroup.delete({ where: { id } });
  revalidatePath('/groceries');
}

export async function addGroceryReceipt(formData: FormData) {
  try {
    const file = formData.get('receipt') as File;
    if (!file) throw new Error('No receipt image provided');

    if (isDemoMode()) {
      const fileName = file.name.replace(/\.[^.]+$/, '') || 'demo-receipt';
      const receipt = addDemoReceipt({
        merchant: fileName.replace(/[-_]/g, ' ').replace(/\b\w/g, character => character.toUpperCase()),
        total: 27.48,
        subtotal: 25.93,
        tax: 1.55,
        sourceFileName: file.name,
        items: [
          { name: 'Milk', price: 4.29, group: 'Dairy' },
          { name: 'Eggs', price: 3.99, group: 'Dairy' },
          { name: 'Bananas', price: 2.19, group: 'Produce' },
          { name: 'Bread', price: 3.49, group: 'Bakery' },
        ],
      });

      revalidatePath('/groceries');
      return {
        success: true,
        receiptId: receipt.id,
        merchant: receipt.merchant,
        total: receipt.total,
        itemCount: receipt.items.length,
      };
    }

    await startOcrService();

    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type });
    const pyForm = new FormData();
    pyForm.append('file', blob, file.name);

    const groceryGroups = await getGroceryGroups();
    pyForm.append('grocery_groups', JSON.stringify(groceryGroups));

    const res = await fetch(`${OCR_SERVICE_URL}/scan-grocery-receipt`, {
      method: 'POST',
      body: pyForm,
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await getResponseErrorMessage(res);
      throw new Error(`Python grocery OCR error: ${err}`);
    }

    const data = await res.json() as GroceryReceiptScanResult;
    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new Error('No grocery line items were detected in this receipt.');
    }

    const total = typeof data.total === 'number'
      ? data.total
      : data.items.reduce((sum, item) => sum + item.price, 0);

    const receipt = await prisma.groceryReceipt.create({
      data: {
        merchant: data.merchant || 'Grocery Receipt',
        total,
        subtotal: data.subtotal ?? null,
        tax: data.tax ?? null,
        sourceFileName: file.name,
        items: {
          create: data.items.map(item => ({
            name: item.name,
            price: item.price,
            group: item.group || 'Other',
          })),
        },
      },
      include: {
        items: true,
      },
    });

    revalidatePath('/groceries');
    return {
      success: true,
      receiptId: receipt.id,
      merchant: receipt.merchant,
      total: receipt.total,
      itemCount: receipt.items.length,
    };
  } catch (error: unknown) {
    console.error('Grocery receipt scan error:', error);
    throw new Error(getErrorMessage(error, 'Failed to process grocery receipt'));
  }
}

export async function addManualGroceryItem(data: ManualGroceryItemInput) {
  const name = data.name.trim();
  const price = Number(data.price);
  const group = data.group?.trim() || 'Other';
  const merchant = data.merchant?.trim() || 'Manual Entry';

  if (!name) {
    throw new Error('Enter a grocery item name.');
  }

  if (!Number.isFinite(price) || price < 0.01) {
    throw new Error('Enter a valid price of at least $0.01.');
  }

  if (isDemoMode()) {
    const receipt = addDemoReceipt({
      merchant,
      total: price,
      subtotal: price,
      tax: null,
      sourceFileName: null,
      date: new Date(),
      items: [{ name, price, group }],
    });

    revalidatePath('/groceries');
    return {
      success: true,
      receiptId: receipt.id,
      merchant: receipt.merchant,
      itemCount: receipt.items.length,
    };
  }

  let purchasedAt = new Date();
  if (data.date) {
    const parsed = new Date(`${data.date}T12:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      purchasedAt = parsed;
    }
  }

  const receipt = await prisma.groceryReceipt.create({
    data: {
      merchant,
      total: price,
      subtotal: price,
      tax: null,
      sourceFileName: null,
      date: purchasedAt,
      items: {
        create: {
          name,
          price,
          group,
        },
      },
    },
    include: {
      items: true,
    },
  });

  revalidatePath('/groceries');
  return {
    success: true,
    receiptId: receipt.id,
    merchant: receipt.merchant,
    itemCount: receipt.items.length,
  };
}

export async function getGroceryReceipts() {
  if (isDemoMode()) {
    return listDemoReceipts();
  }

  return prisma.groceryReceipt.findMany({
    include: {
      items: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { date: 'desc' },
    take: 20,
  });
}

export async function getGroceryPriceHistory() {
  if (isDemoMode()) {
    return getDemoGroceryPriceHistory();
  }

  const [receiptItems, transactionItems] = await Promise.all([
    prisma.groceryReceiptItem.findMany({
      include: {
        receipt: {
          select: {
            id: true,
            merchant: true,
            date: true,
          },
        },
      },
    }),
    prisma.groceryItem.findMany({
      include: {
        transaction: {
          select: {
            id: true,
            description: true,
            date: true,
          },
        },
      },
    }),
  ]);

  const items = [
    ...receiptItems.map(item => ({
      id: `receipt-${item.id}`,
      name: item.name,
      price: item.price,
      group: item.group || 'Other',
      merchant: item.receipt.merchant,
      date: item.receipt.date,
      createdAt: item.createdAt,
    })),
    ...transactionItems.map(item => ({
      id: `transaction-${item.id}`,
      name: item.name,
      price: item.price,
      group: item.group || 'Other',
      merchant: item.transaction.description || 'Transaction',
      date: item.transaction.date,
      createdAt: item.createdAt,
    })),
  ].sort((a, b) => {
    const dateDiff = b.date.getTime() - a.date.getTime();
    return dateDiff || b.createdAt.getTime() - a.createdAt.getTime();
  });

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
    const total = existing.purchases.reduce((sum, p) => sum + p.price, 0);
    existing.averagePrice = total / existing.purchases.length;

    if (item.price < existing.lowestPrice) {
      existing.lowestPrice = item.price;
      existing.cheapestStore = item.merchant;
    }
    if (item.price > existing.highestPrice) {
      existing.highestPrice = item.price;
    }
  }

  const rows = Array.from(history.values()).sort(
    (a, b) => new Date(b.lastPurchaseDate).getTime() - new Date(a.lastPurchaseDate).getTime()
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

export async function scanReceipt(formData: FormData) {
  try {
    const file = formData.get('receipt') as File;
    if (!file) throw new Error('No file provided');

    if (isDemoMode()) {
      const baseName = file.name.replace(/\.[^.]+$/, '') || 'Demo receipt';
      return {
        amount: 27.48,
        category: 'Food & Drinks – Groceries',
        description: baseName.replace(/[-_]/g, ' ').trim(),
      };
    }

    // Convert file to base64 buffer for Gemini
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Initialize Gemini
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not defined in your environment variables.');
    }
    
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use gemini-2.5-flash as the standard default vision model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert accountant. Extract transaction details from the provided receipt image.
Return strictly a JSON object with the following fields:
- "amount": The total numerical amount float (e.g. 12.99).
- "category": You MUST choose exactly one of these strictly depending on if it's income or expense. For Income: "Tutoring", "Universities", "PT", "Books", or "Others". For Expenses: "Gas / Transit", "Groceries", "Dining", "Subscriptions", "Utilities / Bills", "Shopping", "Healthcare", "Personal", "Family", "Work Related", or "Others". Do NOT make up your own category.
- "description": A short merchant name or description (e.g., "Trader Joe's", "Target").
Do NOT include backticks or any other text, just raw JSON.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: file.type,
        },
      },
    ]);

    const text = result.response.text().trim();
    // Safely parse out any markdown backticks if they are stubbornly included
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanJson);
  } catch (error: unknown) {
    console.error("AI Scanning error:", error);
    throw new Error(getErrorMessage(error, "Failed to parse receipt"));
  }
}

export async function scanReceiptLocal(formData: FormData) {
  try {
    const file = formData.get('receipt') as File;
    if (!file) throw new Error('No file provided');

    if (isDemoMode()) {
      const baseName = file.name.replace(/\.[^.]+$/, '') || 'Demo receipt';
      return {
        amount: 27.48,
        category: 'Food & Drinks – Groceries',
        description: baseName.replace(/[-_]/g, ' ').trim(),
        grocery_items: [
          { name: 'Milk', price: 4.29, group: 'Dairy' },
          { name: 'Eggs', price: 3.99, group: 'Dairy' },
          { name: 'Bananas', price: 2.19, group: 'Produce' },
          { name: 'Bread', price: 3.49, group: 'Bakery' },
        ],
      };
    }

    await startOcrService();

    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type });
    const pyForm = new FormData();
    pyForm.append('file', blob, file.name);

    // Pass dynamic DB categories to python!
    const dbCats = await getCategories();
    pyForm.append('categories', JSON.stringify(dbCats));
    const groceryGroups = await getGroceryGroups();
    pyForm.append('grocery_groups', JSON.stringify(groceryGroups));

    const res = await fetch(`${OCR_SERVICE_URL}/scan-receipt`, {
      method: 'POST',
      body: pyForm,
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await getResponseErrorMessage(res);
      throw new Error(`Python OCR error: ${err}`);
    }

    const data = await res.json();
    return data as { amount: number; category: string; description: string; grocery_items: Array<{ name: string; price: number; group?: string }> };
  } catch (error: unknown) {
    console.error("Local receipt scan error:", error);
    throw new Error(getErrorMessage(error, "Failed to scan receipt locally"));
  }
}

export async function processStatement(formData: FormData) {
  try {
    const file = formData.get('document') as File;
    const bankName = formData.get('bankName') as string;
    if (!file) throw new Error('No document provided');

    if (isDemoMode()) {
      const rows = getDemoStatementTransactions(bankName || 'Demo Bank', file.name);
      for (const row of rows) {
        addDemoTransaction({
          amount: row.amount,
          type: row.type,
          category: row.category,
          description: row.description,
          date: new Date(row.date),
        });
      }

      revalidatePath('/');
      revalidatePath('/transactions');
      return { success: true, count: rows.length };
    }

    // Convert file to base64 buffer for Gemini natively
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is missing.');
    
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert accountant parsing a document strictly representing a bank statement or transaction history from ${bankName}. 
Carefully extract EVERY SINGLE valid financial transaction line item found in this document.
For each transaction, extract exactly these fields:
- "date": The exact chronological date written next to the transaction on the document formatted strictly as YYYY-MM-DD. Note: if the document only says "Oct 14" without a year, use the current astronomical year.
- "amount": The absolute numerical amount float (e.g. 12.99).
- "type": Strictly either "INCOME" (deposit/received) or "EXPENSE" (withdrawal/paid).
- "category": You MUST choose exactly ONE: For Income: "Tutoring", "Universities", "PT", "Books", or "Others". For Expenses: "Gas / Transit", "Groceries", "Dining", "Subscriptions", "Utilities / Bills", "Shopping", "Healthcare", "Personal", "Family", "Work Related", or "Others". Do NOT invent a custom category.
- "description": The merchant name or transfer description cleanly stripped.

Return strictly a raw JSON array of objects. Example format:
[
  {"date": "2026-10-12", "amount": 45.00, "type": "EXPENSE", "category": "Dining", "description": "Shake Shack"},
  {"date": "2026-10-14", "amount": 500.00, "type": "INCOME", "category": "Others", "description": "Direct Deposit"}
]
Do NOT include backticks or markdown or text inside the response, I need just the raw parsable JSON array. Return [] if perfectly zero transactions are found.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: file.type, // properly handles application/pdf and images
        },
      },
    ]);

    const text = result.response.text().trim();
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const transactions = JSON.parse(cleanJson);

    if (!Array.isArray(transactions)) {
      throw new Error("AI did not return a valid array array.");
    }

    let addedCount = 0;
    for (const t of transactions) {
      if (t.amount != null && t.type) {
         // Convert extracted string "2026-10-12" to proper Date object, defaulting to now
         const tDate = t.date ? new Date(t.date) : new Date();
         if (isNaN(tDate.getTime())) tDate.setTime(Date.now()); // fallback validity

         await prisma.transaction.create({
            data: {
               amount: parseFloat(t.amount.toString()),
               type: t.type,
               category: t.category || "Others",
               description: t.description || "Statement item",
               date: tDate
            }
         });
         addedCount++;
      }
    }

    revalidatePath('/');
    revalidatePath('/transactions');
    return { success: true, count: addedCount };

  } catch (error: unknown) {
    console.error("Statement Parsing error:", error);
    throw new Error(getErrorMessage(error, "Failed to process bank statement"));
  }
}

export async function processCSVStatement(formData: FormData) {
  try {
    const file = formData.get('document') as File;
    if (!file) throw new Error('No CSV document provided');

    const csvText = await file.text();
    // We dynamically import to avoid breaking client-side logic
    const { parse } = await import('csv-parse/sync');
    
    // Parse the CSV rigidly into an array of JSON objects (dynamically mapping headers)
    const records = parse(csvText, { columns: true, skip_empty_lines: true }) as Record<string, string>[];
    // Build all rows in memory first, then do ONE bulk insert
    const toInsert: { amount: number; type: string; category: string; description: string; date: Date }[] = [];

    for (const row of records) {
      // Fuzzy header mapping — works with Chase, Wells Fargo, Costco, etc.
      const keys = Object.keys(row);
      const dateKey = keys.find(k => k.toLowerCase().includes('date'));
      const descKey = keys.find(k => k.toLowerCase().includes('description') || k.toLowerCase().includes('name') || k.toLowerCase().includes('memo'));
      const amtKey  = keys.find(k => k.toLowerCase().includes('amount') || k.toLowerCase().includes('credit') || k.toLowerCase().includes('debit'));

      if (!dateKey || !amtKey) continue;

      const rawAmountStr = row[amtKey]?.toString() || '0';
      let amount = parseFloat(rawAmountStr.replace(/[^0-9.-]+/g, ''));
      if (isNaN(amount) || amount === 0) continue;

      const type = amount < 0 ? 'EXPENSE' : 'INCOME';
      amount = Math.abs(amount);

      const description = descKey ? row[descKey] : 'Bank Transaction';
      const category = categorizeLocally(description, type);

      const tDate = new Date(row[dateKey]);
      if (isNaN(tDate.getTime())) tDate.setTime(Date.now());

      toInsert.push({ amount, type, category, description: description.substring(0, 100), date: tDate });
    }

    if (isDemoMode()) {
      for (const row of toInsert) {
        addDemoTransaction({
          amount: row.amount,
          type: row.type,
          category: row.category,
          description: row.description,
          date: row.date,
        });
      }
    } else if (toInsert.length > 0) {
      // Single bulk DB write — dramatically faster than N individual inserts
      await prisma.transaction.createMany({ data: toInsert });
    }
    const addedCount = toInsert.length;

    revalidatePath('/');
    revalidatePath('/transactions');
    return { success: true, count: addedCount };

  } catch (error: unknown) {
    console.error("CSV Parsing error:", error);
    throw new Error(getErrorMessage(error, "Failed to process CSV statement"));
  }
}

export async function processLocalDocument(formData: FormData) {
  try {
    const file = formData.get('document') as File;
    if (!file) throw new Error('No document provided for offline parsing');

    if (isDemoMode()) {
      const rows = getDemoStatementTransactions('Demo Statement', file.name);
      for (const row of rows) {
        addDemoTransaction({
          amount: row.amount,
          type: row.type,
          category: row.category,
          description: row.description,
          date: new Date(row.date),
        });
      }

      revalidatePath('/');
      revalidatePath('/transactions');
      return { success: true, count: rows.length };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const toInsert: { amount: number; type: string; category: string; description: string; date: Date }[] = [];

    // ── Image path: delegate to Python EasyOCR service ──────────────────────
    if (file.type.startsWith('image/')) {
      await startOcrService();

      // Forward the image to the Python service
      const blob = new Blob([buffer], { type: file.type });
      const pyForm = new FormData();
      pyForm.append('file', blob, file.name);

      const pyRes = await fetch(`${OCR_SERVICE_URL}/process-image`, {
        method: 'POST',
        body: pyForm,
        cache: 'no-store',
      });

      if (!pyRes.ok) {
        const err = await getResponseErrorMessage(pyRes);
        throw new Error(`Python OCR error: ${err}`);
      }

      const { transactions } = await pyRes.json() as {
        transactions: { amount: number; type: string; category: string; description: string }[];
      };

      for (const t of transactions) {
        toInsert.push({ ...t, date: new Date() });
      }

    // ── PDF path: local pdf-parse (no API needed) ────────────────────────────
    } else if (file.type.includes('pdf')) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
      const { text } = await pdfParse(buffer);

      for (const line of text.split('\n')) {
        if (!line.trim()) continue;
        const match = line.match(/\$?([0-9,]+\.[0-9]{2})/);
        if (!match) continue;

        const amount = parseFloat(match[1].replace(/,/g, ''));
        if (isNaN(amount) || amount === 0) continue;

        const dLower = line.toLowerCase();
        const type = (dLower.includes('deposit') || dLower.includes('payroll') || dLower.includes('cashback') || dLower.includes('reward'))
          ? 'INCOME' : 'EXPENSE';

        const category = categorizeLocally(line, type);
        const description = line.substring(0, 60).replace(/\$?([0-9,]+\.[0-9]{2})/, '').trim() || 'Statement item';

        toInsert.push({ amount, type, category, description, date: new Date() });
      }

    } else {
      throw new Error('Unsupported file type. Please upload an image or PDF.');
    }

    if (toInsert.length > 0) {
      await prisma.transaction.createMany({ data: toInsert });
    }

    revalidatePath('/');
    revalidatePath('/transactions');
    return { success: true, count: toInsert.length };

  } catch (error: unknown) {
    console.error('Local document error:', error);
    throw new Error(getErrorMessage(error, 'Failed to process document locally'));
  }
}
