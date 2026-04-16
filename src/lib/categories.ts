// Single source of truth for all categories used across the app
// Keep in sync with python-ocr/main.py EXPENSE_CATEGORIES

export const INCOME_CATEGORIES = [
  "Salary / Payroll",
  "Freelance / Self-Employed",
  "Tutoring",
  "Universities",
  "PT / Physical Therapy",
  "Investments & Dividends",
  "Refunds & Cashback",
  "Other Income",
];

export const EXPENSE_CATEGORIES = [
  // Food & Drinks
  "Food & Drinks – Fast Food",
  "Food & Drinks – Cafes & Coffee",
  "Food & Drinks – Bars & Alcohol",
  "Food & Drinks – Delivery",
  "Food & Drinks – Dining",
  "Food & Drinks – Groceries",

  // Entertainment
  "Entertainment – Streaming",
  "Entertainment – Music",
  "Entertainment – Gaming",
  "Entertainment – Events & Cinema",
  "Entertainment – Sports & Recreation",

  // Subscriptions
  "Subscriptions – Software & Tools",
  "Subscriptions – News & Media",
  "Subscriptions – Fitness & Wellness",

  // Transportation
  "Transportation – Rideshare",
  "Transportation – Gas & Fuel",
  "Transportation – Transit & Parking",
  "Transportation – Flights & Airlines",
  "Transportation – Car & Auto",

  // Shopping
  "Shopping – Clothing & Fashion",
  "Shopping – Electronics & Tech",
  "Shopping – Online & Department",
  "Shopping – Home & Garden",

  // Work & Business
  "Work – Office & Supplies",
  "Work – Professional Services",
  "Work – Cloud & Dev Tools",

  // Education
  "Education – Courses & Training",
  "Education – Books & Reading",
  "Education – Tuition & School",

  // Healthcare
  "Healthcare – Pharmacy",
  "Healthcare – Medical",
  "Healthcare – Insurance",

  // Travel
  "Travel – Hotels & Lodging",

  // Utilities
  "Utilities – Phone & Internet",
  "Utilities – Electric & Gas",
  "Utilities – Other Bills",

  // Personal Care
  "Personal Care – Beauty",
  "Personal Care – Salon & Grooming",
  "Personal Care – Spa & Wellness",

  // Family & Pets
  "Family – Children",
  "Family – Pets",

  // Finance
  "Finance – Fees & Charges",
  "Finance – Investments & Crypto",

  // Catch-all
  "Others",
];

// Pure-JS keyword categorizer — mirrors Python logic for CSV/PDF paths
const INCOME_KW = [
  "direct deposit", "payroll", "salary", "deposit", "cashback", "cash back",
  "reward", "refund", "reimbursement", "zelle from", "venmo from",
  "transfer from", "interest paid", "dividend", "tax return",
];

export const KW_MAP: [string, string[]][] = [
  ["Food & Drinks – Fast Food",            ["mcdonald","burger king","wendy","taco bell","chick-fil","popeye","in-n-out","jack in the box","five guys","wingstop","raising cane","shake shack","panda express"]],
  ["Food & Drinks – Cafes & Coffee",       ["starbucks","dutch bros","peet","dunkin","tim horton","coffee bean","philz","blue bottle","cafe","boba","tea lab","kung fu tea"]],
  ["Food & Drinks – Bars & Alcohol",       ["brewery","brewing","winery","wine ","spirits","liquor","tavern","pub ","cocktail","total wine","bev mo"]],
  ["Food & Drinks – Delivery",             ["doordash","ubereats","grubhub","postmates","instacart","gopuff","seamless","delivery"]],
  ["Food & Drinks – Dining",               ["restaurant","sushi","grill","kitchen","eatery","bistro","chipotle","subway","panera","pizza","domino","papa john","olive garden","applebee","denny","ihop","cheesecake factory","outback","texas roadhouse","pf chang","noodle","ramen","thai","diner"]],
  ["Food & Drinks – Groceries",            ["costco","target","walmart","kroger","safeway","whole foods","trader joe","aldi","publix","heb","meijer","wegman","sprouts","grocery"]],
  ["Entertainment – Streaming",            ["netflix","hulu","disney+","hbo","paramount","peacock","apple tv","amazon prime video","youtube premium","crunchyroll","fubo","sling"]],
  ["Entertainment – Music",                ["spotify","apple music","tidal","amazon music","pandora","soundcloud"]],
  ["Entertainment – Gaming",               ["steam","playstation","xbox","nintendo","epic games","riot games","blizzard","ea games","roblox","twitch","discord nitro"]],
  ["Entertainment – Events & Cinema",      ["ticketmaster","stubhub","eventbrite","fandango","amc theatre","regal cinema","concert","museum","amusement","six flags","disneyland","theater"]],
  ["Entertainment – Sports & Recreation",  ["golf","bowling","trampoline","escape room","laser tag","skating","nfl","nba","mlb","nhl"]],
  ["Subscriptions – Software & Tools",     ["adobe","microsoft 365","office 365","slack","notion","figma","canva","dropbox","google one","icloud","zoom","grammarly","1password","nordvpn","github","aws","openai"]],
  ["Subscriptions – News & Media",         ["new york times","nytimes","wsj","wall street journal","washington post","bloomberg","economist","medium","substack","patreon"]],
  ["Subscriptions – Fitness & Wellness",   ["planet fitness","la fitness","anytime fitness","equinox","orangetheory","peloton","calm","headspace","yoga","membership"]],
  ["Transportation – Rideshare",           ["uber","lyft","waymo"]],
  ["Transportation – Gas & Fuel",          ["shell","chevron","bp ","exxon","mobil","76 ","arco","circle k","speedway","wawa","fuel","gas station","gasoline"]],
  ["Transportation – Transit & Parking",   ["metro","mta ","bart ","caltrain","metra","mbta","wmata","spothero","parkwhiz","parking","toll","transit","bus pass"]],
  ["Transportation – Flights & Airlines",  ["united airlines","delta","american airlines","southwest","jetblue","spirit airlines","alaska airlines","frontier","expedia","kayak","airline"]],
  ["Transportation – Car & Auto",          ["enterprise","hertz","avis","budget rent","car rental","autozone","jiffy lube","valvoline","firestone","pep boys"]],
  ["Shopping – Clothing & Fashion",        ["zara","h&m","gap","old navy","banana republic","forever 21","express","j.crew","uniqlo","nike","adidas","lululemon","nordstrom rack","tj maxx","marshalls","ross"]],
  ["Shopping – Electronics & Tech",        ["best buy","apple store","apple.com","newegg","b&h photo","microsoft store","samsung","dell","logitech"]],
  ["Shopping – Online & Department",       ["amazon","ebay","etsy","shein","temu","wayfair","macys","nordstrom","bloomingdale","kohls"]],
  ["Shopping – Home & Garden",             ["home depot","lowes","ikea","bed bath","crate & barrel","restoration hardware","west elm","pottery barn"]],
  ["Work – Office & Supplies",             ["staples","office depot","office max","fedex office","ups store"]],
  ["Work – Professional Services",         ["linkedin premium","upwork","fiverr","docusign","legalzoom"]],
  ["Work – Cloud & Dev Tools",             ["github","gitlab","jira","atlassian","heroku","aws ","google cloud","azure","digitalocean","netlify","vercel","cloudflare","datadog","sentry"]],
  ["Education – Courses & Training",       ["coursera","udemy","skillshare","pluralsight","linkedin learning","masterclass","codecademy","edx","udacity","duolingo"]],
  ["Education – Books & Reading",          ["kindle","audible","scribd","book","textbook","chegg","barnes & noble"]],
  ["Education – Tuition & School",         ["university","college","tuition","student loan"]],
  ["Healthcare – Pharmacy",                ["cvs","walgreens","rite aid","pharmacy","rx","prescription"]],
  ["Healthcare – Medical",                 ["hospital","medical center","clinic","urgent care","doctor","physician","dentist","dental","dermatologist","labcorp","quest diagnostics"]],
  ["Healthcare – Insurance",               ["health insurance","blue cross","blue shield","cigna","humana","aetna","united health","kaiser","anthem"]],
  ["Travel – Hotels & Lodging",            ["marriott","hilton","hyatt","ihg","wyndham","airbnb","vrbo","hotel","motel","resort"]],
  ["Utilities – Phone & Internet",         ["verizon","at&t","t-mobile","sprint","comcast","xfinity","spectrum","cox "]],
  ["Utilities – Electric & Gas",           ["pg&e","pge","edison","sdge","con ed","duke energy","dominion energy","electric","natural gas"]],
  ["Utilities – Other Bills",              ["water bill","sewer","trash","waste management"]],
  ["Personal Care – Beauty",               ["sephora","ulta","mac cosmetics","bath & body","glossier"]],
  ["Personal Care – Salon & Grooming",     ["salon","hair ","nail ","barbershop","waxing","threading","great clips","supercuts"]],
  ["Personal Care – Spa & Wellness",       ["spa ","massage","float tank","meditation","mental health"]],
  ["Family – Children",                    ["daycare","school supply","toys r us","buy buy baby"]],
  ["Family – Pets",                        ["petco","petsmart","chewy","pet ","veterinary","vet ","animal"]],
  ["Finance – Fees & Charges",             ["annual fee","late fee","interest charge","overdraft","atm fee","wire transfer fee","service charge"]],
  ["Finance – Investments & Crypto",       ["robinhood","coinbase","fidelity","schwab","e*trade","vanguard","webull","crypto","bitcoin","ethereum"]],
];

export function categorizeLocally(description: string, type: string): string {
  const d = description.toLowerCase();
  if (type === "INCOME") {
    for (const kw of INCOME_KW) {
      if (d.includes(kw)) return "Refunds & Cashback";
    }
    return "Other Income";
  }
  for (const [cat, kws] of KW_MAP) {
    for (const kw of kws) {
      if (d.includes(kw)) return cat;
    }
  }
  return "Others";
}
