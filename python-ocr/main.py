import re
import io
import json
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import cv2
from PIL import Image
import easyocr
from grocery_receipt import group_ocr_rows, parse_grocery_receipt

app = FastAPI(title="Finance Tracker OCR Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_methods=["POST"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled OCR error on {request.url.path}: {type(exc).__name__}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"{type(exc).__name__}: {exc}"},
    )

print("Initialising EasyOCR reader (may download model on first run)...")
reader = easyocr.Reader(["en"], gpu=False, verbose=False)
print("EasyOCR ready.")

# ---------------------------------------------------------------------------
# Category Taxonomy
# ---------------------------------------------------------------------------
INCOME_KEYWORDS = [
    "direct deposit", "payroll", "salary", "deposit", "cashback", "cash back",
    "reward", "refund", "reimbursement", "zelle from", "venmo from",
    "transfer from", "interest paid", "dividend", "tax return",
]

EXPENSE_CATEGORIES: list[tuple[str, list[str]]] = [
    ("Food & Drinks – Fast Food",           ["mcdonald","burger king","wendy","taco bell","chick-fil","popeye","in-n-out","jack in the box","five guys","wingstop","raising cane","shake shack","panda express","carl's jr","whataburger","sonic drive","del taco"]),
    ("Food & Drinks – Cafes & Coffee",      ["starbucks","dutch bros","peet","dunkin","tim horton","coffee bean","philz","blue bottle","caffee","boba","tea lab","kung fu tea","coffee"]),
    ("Food & Drinks – Bars & Alcohol",      ["brewery","brewing","winery","wine ","spirits","liquor","tavern","pub ","cocktail","total wine","bev mo"]),
    ("Food & Drinks – Delivery",            ["doordash","ubereats","grubhub","postmates","instacart","gopuff","seamless"]),
    ("Food & Drinks – Dining",              ["restaurant","sushi","grill","kitchen","eatery","bistro","chipotle","subway","panera","pizza","domino","papa john","olive garden","applebee","denny","ihop","cheesecake factory","outback","texas roadhouse","pf chang","noodle","bbq","ramen","thai","dim sum","tapas","diner","eatery","food court"]),
    ("Food & Drinks – Groceries",           ["costco","target","walmart","kroger","safeway","whole foods","trader joe","aldi","publix","heb","meijer","wegman","sprouts","smart & final","grocery","market","supermarket","food 4 less","food4less","vons","ralphs","albertsons"]),
    ("Entertainment – Streaming",           ["netflix","hulu","disney+","disney plus","hbo max","hbo","paramount+","peacock","apple tv","amazon prime video","youtube premium","crunchyroll","fubo","sling"]),
    ("Entertainment – Music",               ["spotify","apple music","tidal","amazon music","pandora","soundcloud","deezer"]),
    ("Entertainment – Gaming",              ["steam","playstation","xbox","nintendo","epic games","riot games","blizzard","ea games","roblox","twitch","discord nitro","game"]),
    ("Entertainment – Events & Cinema",     ["ticketmaster","stubhub","eventbrite","fandango","amc theatre","amc entertainment","regal cinema","concert","museum","amusement","six flags","disneyland","universal studios","theater"]),
    ("Entertainment – Sports & Recreation", ["golftec","golf","bowling","trampoline","escape room","laser tag","skating","nfl","nba","mlb","nhl","gym day pass"]),
    ("Subscriptions – Software & Tools",    ["adobe","microsoft 365","office 365","slack","notion","figma","canva","dropbox","google one","icloud","zoom","grammarly","1password","nordvpn","expressvpn","github","aws","openai","chatgpt"]),
    ("Subscriptions – News & Media",        ["new york times","nytimes","wsj","wall street journal","washington post","bloomberg","economist","medium","substack","patreon"]),
    ("Subscriptions – Fitness & Wellness",  ["planet fitness","la fitness","anytime fitness","equinox","orangetheory","peloton","beachbody","noom","calm","headspace","yoga","membership"]),
    ("Transportation – Rideshare",          ["uber","lyft","waymo"]),
    ("Transportation – Gas & Fuel",         ["shell","chevron","bp ","exxon","mobil","76 ","arco","circle k","speedway","wawa","fuel","gas station","gasoline"]),
    ("Transportation – Transit & Parking",  ["metro","mta ","bart ","caltrain","metra","mbta","wmata","spothero","parkwhiz","parking","toll ","transit","bus pass","clipper"]),
    ("Transportation – Flights & Airlines", ["united airlines","delta","american airlines","southwest","jetblue","spirit airlines","alaska airlines","frontier","expedia","kayak","airline"]),
    ("Transportation – Car & Auto",         ["enterprise","hertz","avis","budget rent","car rental","autozone","o'reilly","advance auto","jiffy lube","valvoline","firestone","pep boys"]),
    ("Shopping – Clothing & Fashion",       ["zara","h&m","gap","old navy","banana republic","forever 21","express","j.crew","uniqlo","nike store","adidas","under armour","lululemon","nordstrom rack","tj maxx","marshalls","ross "]),
    ("Shopping – Electronics & Tech",       ["best buy","apple store","apple.com","newegg","b&h photo","microsoft store","samsung","dell","lenovo","logitech","adorama"]),
    ("Shopping – Online & Department",      ["amazon","ebay","etsy","wish","shein","temu","wayfair","overstock","macys","nordstrom","bloomingdale","kohls","jcpenney"]),
    ("Shopping – Home & Garden",            ["home depot","lowes","ikea","bed bath","crate & barrel","restoration hardware","west elm","pottery barn"]),
    ("Work – Office & Supplies",            ["staples","office depot","office max","uline","fedex office","ups store"]),
    ("Work – Professional Services",        ["linkedin premium","indeed","upwork","fiverr","docusign","legalzoom"]),
    ("Work – Cloud & Dev Tools",            ["github","gitlab","jira","atlassian","heroku","aws ","google cloud","azure","digitalocean","netlify","vercel","cloudflare","datadog","sentry"]),
    ("Education – Courses & Training",      ["coursera","udemy","skillshare","pluralsight","linkedin learning","masterclass","codecademy","edx","udacity","duolingo"]),
    ("Education – Books & Reading",         ["kindle","audible","scribd","textbook","chegg","barnes & noble","booksamillion"]),
    ("Education – Tuition & School",        ["university","college","tuition","student loan"]),
    ("Healthcare – Pharmacy",               ["cvs","walgreens","rite aid","pharmacy","rx pharmacy","prescription"]),
    ("Healthcare – Medical",                ["hospital","medical center","clinic","urgent care","physician","optometrist","dentist","dental","orthodontist","dermatolog","labcorp","quest diagnostics"]),
    ("Healthcare – Insurance",              ["health insurance","blue cross","blue shield","cigna","humana","aetna","united health","kaiser","anthem"]),
    ("Travel – Hotels & Lodging",           ["marriott","hilton","hyatt","ihg","wyndham","airbnb","vrbo","hotel","motel","resort","inn "]),
    ("Utilities – Phone & Internet",        ["verizon wireless","at&t","t-mobile","sprint","comcast","xfinity","spectrum","cox "]),
    ("Utilities – Electric & Gas",          ["pg&e","pge","edison","sdge","con ed","duke energy","dominion energy","electric company","natural gas"]),
    ("Utilities – Other Bills",             ["water bill","sewer","waste management","trash pickup"]),
    ("Personal Care – Beauty",              ["sephora","ulta","mac cosmetics","bath & body works","glossier","lush"]),
    ("Personal Care – Salon & Grooming",    ["salon","hair salon","nail salon","barbershop","waxing","threading","great clips","sport clips","supercuts"]),
    ("Personal Care – Spa & Wellness",      ["spa ","day spa","massage","float tank","meditation"]),
    ("Family – Children",                   ["daycare","child care","school supply","toys r us","buy buy baby","children"]),
    ("Family – Pets",                       ["petco","petsmart","chewy","veterinary","vet ","animal hospital","pet supply"]),
    ("Finance – Fees & Charges",            ["annual fee","late fee","interest charge","overdraft","atm fee","wire transfer fee","service charge","foreign transaction"]),
    ("Finance – Investments & Crypto",      ["robinhood","coinbase","fidelity","schwab","e*trade","vanguard","webull","crypto","bitcoin","ethereum"]),
]


def classify(text: str, custom_categories: list[dict] = None) -> tuple[str, str]:
    d = text.lower()
    
    if custom_categories:
        # custom_categories is a list of dicts: {"name": "...", "type": "INCOME", "keywords": "foo,bar"}
        incomes = [c for c in custom_categories if c.get("type", "").upper() == "INCOME"]
        expenses = [c for c in custom_categories if c.get("type", "").upper() == "EXPENSE"]

        for inc in incomes:
            kws = [k.strip() for k in inc.get("keywords", "").split(",") if k.strip()]
            if any(kw in d for kw in kws):
                return "INCOME", inc.get("name", "Other Income")

        for exp in expenses:
            kws = [k.strip() for k in exp.get("keywords", "").split(",") if k.strip()]
            if any(kw in d for kw in kws):
                return "EXPENSE", exp.get("name", "Others")
                
        return "EXPENSE", "Others"

    # Fallback to hardcoded if no custom categories strictly provided
    for kw in INCOME_KEYWORDS:
        if kw in d:
            return "INCOME", "Other Income"
    for cat, keywords in EXPENSE_CATEGORIES:
        for kw in keywords:
            if kw in d:
                return "EXPENSE", cat
    return "EXPENSE", "Others"


# ---------------------------------------------------------------------------
# Spatial row grouping
# Row = set of OCR detections whose vertical centre Y is within ROW_TOLERANCE
# pixels of each other after normalisation.
# ---------------------------------------------------------------------------
ROW_TOLERANCE = 18  # px – tune if needed for dense statements


def group_into_rows(ocr_results: list) -> list[str]:
    """
    ocr_results: list of (bbox, text, conf)
    bbox: [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]  (EasyOCR polygon)

    Returns a list of row strings, each being the full combined text
    of all OCR boxes that share approximately the same vertical centre.
    Rows are sorted top-to-bottom; boxes within a row are sorted left-to-right.
    """
    if not ocr_results:
        return []

    # Attach a y-centre to each result
    annotated = []
    for bbox, text, conf in ocr_results:
        if conf < 0.3:
            continue
        ys = [pt[1] for pt in bbox]
        y_centre = (min(ys) + max(ys)) / 2
        x_left = min(pt[0] for pt in bbox)
        annotated.append((y_centre, x_left, text))

    # Sort top-to-bottom, then left-to-right
    annotated.sort(key=lambda t: (t[0], t[1]))

    rows: list[list[tuple]] = []
    for item in annotated:
        y_centre, x_left, text = item
        # Try to merge into an existing row
        merged = False
        for row in rows:
            row_y = sum(r[0] for r in row) / len(row)
            if abs(y_centre - row_y) <= ROW_TOLERANCE:
                row.append(item)
                merged = True
                break
        if not merged:
            rows.append([item])

    # Within each row, sort left-to-right and join text
    row_strings = []
    for row in rows:
        row.sort(key=lambda t: t[1])
        row_strings.append("  ".join(t[2] for t in row))

    return row_strings


# ---------------------------------------------------------------------------
# Image preprocessing — generic (bank statements / documents)
# ---------------------------------------------------------------------------
def preprocess(image_bytes: bytes) -> np.ndarray:
    pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = np.array(pil_img)
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)

    h, w = gray.shape
    if w < 1200:
        scale = 1200 / w
        gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

    processed = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 31, 11
    )
    return processed


# ---------------------------------------------------------------------------
# Image preprocessing — dedicated receipt pipeline
#
# Receipts shot on phones suffer from:
#   • Uneven illumination / shadows from overhead lighting
#   • Low contrast on faded thermal paper
#   • Slight tilt / skew from handheld capture
#   • JPEG noise artifacts
#
# Pipeline:
#   1. Upscale (receipts are narrow; OCR needs ≥ 1 px per character stroke)
#   2. Shadow removal via background-division (morphological trick)
#   3. CLAHE adaptive contrast boost
#   4. Bilateral denoise (edge-preserving — keeps text sharp)
#   5. Auto-deskew (rotation correction up to ±15°)
#   6. Otsu binarisation for clean black-on-white text
# ---------------------------------------------------------------------------

def _deskew(gray: np.ndarray) -> np.ndarray:
    """
    Detect and correct rotation skew using the projection-profile method.
    Sweeps angles -15° → +15° and picks the angle that produces the
    sharpest horizontal text-line peaks (highest variance in row sums).
    """
    # Work on a small copy for speed
    scale = min(1.0, 800 / max(gray.shape))
    small = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)

    # Invert + threshold so text pixels are 1
    _, bw = cv2.threshold(
        cv2.bitwise_not(small), 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )

    best_angle = 0.0
    best_score = -1.0
    h_s, w_s = bw.shape
    cx, cy = w_s // 2, h_s // 2

    for angle in np.arange(-15, 15.5, 0.5):
        M = cv2.getRotationMatrix2D((cx, cy), angle, 1.0)
        rotated = cv2.warpAffine(bw, M, (w_s, h_s),
                                 flags=cv2.INTER_NEAREST,
                                 borderMode=cv2.BORDER_CONSTANT,
                                 borderValue=0)
        row_sums = rotated.sum(axis=1).astype(float)
        score = float(np.var(row_sums))
        if score > best_score:
            best_score = score
            best_angle = angle

    # Only rotate if the angle is meaningful (> 0.3°)
    if abs(best_angle) < 0.3:
        return gray

    h, w = gray.shape
    M = cv2.getRotationMatrix2D((w // 2, h // 2), best_angle, 1.0)
    return cv2.warpAffine(gray, M, (w, h),
                          flags=cv2.INTER_CUBIC,
                          borderMode=cv2.BORDER_REPLICATE)


def preprocess_receipt(image_bytes: bytes) -> np.ndarray:
    """
    Purpose-built preprocessing for phone-camera receipt images.
    Returns a clean binary image optimised for EasyOCR.
    """
    pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = np.array(pil_img)

    # ── 1. Upscale ──────────────────────────────────────────────────────────
    # Receipts are narrow; we target the longer dimension at ≥ 2000 px so that
    # small fonts (tax lines, store ID) are resolvable.
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    h, w = gray.shape
    long_side = max(h, w)
    if long_side < 2000:
        scale = 2000 / long_side
        gray = cv2.resize(gray, None, fx=scale, fy=scale,
                          interpolation=cv2.INTER_CUBIC)

    # ── 2. Shadow / uneven-illumination removal ─────────────────────────────
    # Estimate the background by dilating the image (enlarges bright regions
    # = background) then smoothing with a large Gaussian.
    kernel_size = max(gray.shape) // 10 | 1   # ensure odd
    bg_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_size, kernel_size))
    background = cv2.dilate(gray, bg_kernel)
    background = cv2.GaussianBlur(background, (kernel_size, kernel_size), 0)
    # Divide original by background → normalised 0-255
    shadow_free = cv2.divide(gray, background, scale=255.0)
    shadow_free = shadow_free.astype(np.uint8)

    # ── 3. CLAHE contrast enhancement ───────────────────────────────────────
    # Boosts local contrast on faded / low-ink thermal receipts.
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(shadow_free)

    # ── 4. Bilateral denoise ────────────────────────────────────────────────
    # Smoothes JPEG noise while preserving sharp character edges.
    denoised = cv2.bilateralFilter(enhanced, d=9, sigmaColor=75, sigmaSpace=75)

    # ── 5. Auto-deskew ──────────────────────────────────────────────────────
    straightened = _deskew(denoised)

    # ── 6. Otsu binarisation ────────────────────────────────────────────────
    # Global Otsu works well here because shadow removal already flattened the
    # background; no need for adaptive thresholding.
    _, binary = cv2.threshold(straightened, 0, 255,
                               cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    return binary


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------
@app.post("/process-image")
async def process_image(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are accepted.")

    raw_bytes = await file.read()

    try:
        processed = preprocess(raw_bytes)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Image pre-processing failed: {e}")

    # EasyOCR with bounding box detail
    ocr_results = reader.readtext(processed, detail=1, paragraph=False)

    # Spatially group boxes into logical statement rows
    rows = group_into_rows(ocr_results)

    transactions = []
    for row_text in rows:
        # Find all dollar amounts in the combined row
        matches = list(re.finditer(r"\$?\s*([0-9][0-9,]*\.[0-9]{2})", row_text))
        if not matches:
            continue

        # Use the largest amount found in the row (usually the transaction total)
        best = max(matches, key=lambda m: float(m.group(1).replace(",", "")))
        amount = round(float(best.group(1).replace(",", "")), 2)
        if amount == 0:
            continue

        # Description = full row text with dollar amounts stripped
        description = re.sub(r"\$?\s*[0-9][0-9,]*\.[0-9]{2}", "", row_text).strip()
        # Also strip trailing/leading punctuation noise
        description = re.sub(r"^[\s\-–—|:,]+|[\s\-–—|:,]+$", "", description)
        if len(description) < 2:
            description = "Bank transaction"

        tx_type, category = classify(row_text)  # classify on FULL row (merchant + amount)

        transactions.append({
            "amount":      amount,
            "type":        tx_type,
            "category":    category,
            "description": description[:80],
        })

    return {"transactions": transactions, "raw_line_count": len(ocr_results)}


# ---------------------------------------------------------------------------
# /scan-receipt — single-receipt scanner
# Returns: { amount, category, description }
# ---------------------------------------------------------------------------

# Matches rows that explicitly say TOTAL or TOTAL SALE (and common variants).
# The row must ALSO contain a $ symbol to qualify.
TOTAL_LINE = re.compile(
    r"\b(total\s*sale|sale\s*total|grand\s*total|total)\b",
    re.IGNORECASE,
)

# Rows to skip even if they contain "total" — these are NOT the purchase total.
EXCLUDED_ROW = re.compile(
    r"\b(subtotal|sub\s*total|tax|hst|gst|pst|vat|tip|gratuity|"
    r"discount|savings|you\s*saved|coupon|reward|change\s*due|"
    r"cash\s*tendered|amount\s*tendered|gift\s*card|store\s*credit|"
    r"loyalty|points)\b",
    re.I,
)

# Patterns that suggest a row is NOT a merchant name header
NOT_MERCHANT_ROW = re.compile(
    r"^\d{5}$"
    r"|^\d{1,5}\s+\w"
    r"|\d{3}[\s\-\.]\d{4}"
    r"|\(\d{3}\)"
    r"|^\d{1,2}[/\-]\d{1,2}"
    r"|\b(www\.|http|\.com|@)\b",
    re.I,
)


def _find_grand_total(rows: list[str]) -> float | None:
    """
    Only accept rows that:
      1. Contain TOTAL or TOTAL SALE keyword
      2. Contain a $ symbol
      3. Do NOT match exclusion keywords (tax, subtotal, tip, etc.)

    Among qualifying rows, prefer TOTAL SALE / GRAND TOTAL over plain TOTAL.
    If multiple qualify at the same specificity, return the largest amount.
    """
    # Two buckets: specific labels (TOTAL SALE, GRAND TOTAL) and plain TOTAL
    specific: list[float] = []   # TOTAL SALE | GRAND TOTAL
    generic:  list[float] = []   # plain TOTAL

    SPECIFIC = re.compile(r"\b(total\s*sale|sale\s*total|grand\s*total)\b", re.I)

    for row in rows:
        # Must have a dollar sign on the same row
        if "$" not in row:
            continue
        # Must have a TOTAL keyword
        if not TOTAL_LINE.search(row):
            continue
        # Must NOT be a tax/discount/subtotal line
        if EXCLUDED_ROW.search(row):
            continue

        # Extract all $X.XX amounts on this row
        amounts = [
            float(m.replace(",", ""))
            for m in re.findall(r"\$\s*([0-9][0-9,]*\.[0-9]{2})", row)
            if float(m.replace(",", "")) > 0
        ]
        if not amounts:
            continue

        row_amount = max(amounts)
        if SPECIFIC.search(row):
            specific.append(row_amount)
        else:
            generic.append(row_amount)

    if specific:
        return max(specific)
    if generic:
        return max(generic)
    return None


def _fallback_largest(rows: list[str]) -> float | None:
    """
    Last-resort total detection for receipts where OCR misses the TOTAL label.
    Prefer the largest positive dollar amount from non-excluded rows, then fall
    back to the largest positive amount anywhere on the receipt.
    """
    preferred: list[float] = []
    fallback: list[float] = []

    for row in rows:
        amounts = [
            float(m.replace(",", ""))
            for m in re.findall(r"\$?\s*([0-9][0-9,]*\.[0-9]{2})", row)
            if float(m.replace(",", "")) > 0
        ]
        if not amounts:
            continue

        row_amount = max(amounts)
        fallback.append(row_amount)
        if not EXCLUDED_ROW.search(row):
            preferred.append(row_amount)

    if preferred:
        return max(preferred)
    if fallback:
        return max(fallback)
    return None


def _extract_totals(rows: list[str]) -> dict:
    """Extract subtotal, tax, and grand total."""
    totals = {
        "subtotal": None,
        "tax": None,
        "grand_total": _find_grand_total(rows)
    }
    if totals["grand_total"] is None:
        totals["grand_total"] = _fallback_largest(rows)

    SUBTOTAL_RE = re.compile(r"\b(subtotal|sub\s*total)\b", re.I)
    TAX_RE = re.compile(r"\b(tax|hst|gst|pst|vat)\b", re.I)

    for row in rows:
        amounts = [float(m.replace(",", "")) for m in re.findall(r"\$?\s*([0-9][0-9,]*\.[0-9]{2})", row) if float(m.replace(",", "")) > 0]
        if not amounts:
            continue
            
        row_amount = max(amounts)
        if totals["subtotal"] is None and SUBTOTAL_RE.search(row):
            totals["subtotal"] = row_amount
        elif totals["tax"] is None and TAX_RE.search(row) and not SUBTOTAL_RE.search(row):
            totals["tax"] = row_amount

    return totals

def _extract_merchant(rows: list[str]) -> str:
    """
    Read the top rows of the receipt to find the store/merchant name.
    Receipts almost always print the store name first.
    We scan the first 6 rows and pick the first 'clean' one.
    """
    for row in rows[:6]:
        # Remove any dollar amounts clutter
        clean = re.sub(r"\$?\s*[0-9][0-9,]*\.[0-9]{2}", "", row).strip()
        # Strip leading/trailing punctuation / separators
        clean = re.sub(r"^[\s\-–—|*#:,]+|[\s\-–—|*#:,]+$", "", clean)
        # Must be at least 3 chars and not look like an address / phone
        if len(clean) >= 3 and not NOT_MERCHANT_ROW.search(clean):
            return clean[:60]
    return "Receipt"


def _classify_receipt(rows: list[str], merchant: str, custom_categories: list[dict] = None) -> str:
    """
    Classify MERCHANT FIRST (most reliable), then fall back to full text.
    We avoid matching individual food item names at a grocery store etc.
    """
    # Try merchant name alone first
    _, cat = classify(merchant, custom_categories)
    if cat != "Others":
        return cat

    # Second pass: use just the first 5 rows (header area) which contains
    # the store name, address, etc. — not individual item descriptions.
    header = " ".join(rows[:5])
    _, cat = classify(header, custom_categories)
    if cat != "Others":
        return cat

    # Final fallback: scan full receipt text
    _, cat = classify(" ".join(rows), custom_categories)
    return cat

# ---------------------------------------------------------------------------
# Grocery item extractor
# ---------------------------------------------------------------------------

# Keywords that mark non-item rows (totals, taxes, header, footer)
SKIP_ITEM_ROW = re.compile(
    r"\b(total|subtotal|sub\s*total|tax|hst|gst|pst|vat|tip|gratuity|"
    r"discount|savings|change|tender|coupon|reward|membership|loyalty|"
    r"thank\s*you|visit|receipt|approved|auth|ref\s*#|terminal|cashier|"
    r"store\s*#|phone|www\.|\.com|http|balance|points|card|visa|master|"
    r"debit|credit|account|ending|welcome)\b",
    re.I,
)

# Item line: has a dollar amount, not a total/tax/footer row
ITEM_PRICE = re.compile(r"\$?\s*([0-9][0-9,]*\.[0-9]{2})")


def _classify_grocery_item(name: str, grocery_groups: list[dict] | None = None) -> str:
    """
    Classify a grocery item using editable group keyword definitions.
    grocery_groups items are expected to look like:
      {"name": "Produce", "keywords": "apple,banana,lettuce"}
    """
    if not grocery_groups:
        return "Other"

    normalized_name = name.lower()
    for group in grocery_groups:
        group_name = (group.get("name") or "Other").strip() or "Other"
        raw_keywords = group.get("keywords") or ""
        keywords = [kw.strip().lower() for kw in raw_keywords.split(",") if kw.strip()]

        # Let the group name itself count as a keyword too.
        if group_name.lower() != "other":
            keywords.append(group_name.lower())

        if any(keyword in normalized_name for keyword in keywords):
            return group_name

    return "Other"


def _extract_grocery_items(rows: list[str], grocery_groups: list[dict] | None = None) -> list[dict]:
    """
    Extract individual grocery line items from receipt rows.
    Returns list of {name, price} dicts.
    Only called when merchant is classified as a grocery store.
    Skips header rows (first 5), total/tax rows, and footer rows (last 5).
    """
    items: list[dict] = []

    # Skip the header (store name, address etc.) and footer (totals, thank you etc.)
    body_rows = rows[5:-5] if len(rows) > 12 else rows[3:-3]

    for row in body_rows:
        # Skip total/tax/header/footer rows
        if SKIP_ITEM_ROW.search(row):
            continue

        prices = ITEM_PRICE.findall(row)
        if not prices:
            continue

        # Use the last price on the row (the line total, not unit price × qty)
        price = float(prices[-1].replace(",", ""))
        if price <= 0 or price > 999:
            continue

        # Description = row text with prices and noise stripped
        desc = ITEM_PRICE.sub("", row)
        desc = re.sub(r"\$", "", desc)
        # Remove quantity prefixes like "2 x", "3x", "2 @"
        desc = re.sub(r"^\s*\d+\s*[xX@]\s*", "", desc)
        # Remove leading/trailing symbols
        desc = re.sub(r"^[\s\-–|*#:,\d]+|[\s\-–|*#:,]+$", "", desc).strip()

        if len(desc) < 2:
            continue

        name = desc[:45]
        items.append({
            "name": name,
            "price": round(price, 2),
            "group": _classify_grocery_item(name, grocery_groups),
        })

    return items


# Grocery-store detector — same keywords as the category classifier
GROCERY_STORES = re.compile(
    r"\b(costco|target|walmart|kroger|safeway|whole\s*foods|trader\s*joe|"
    r"aldi|publix|heb|meijer|wegman|sprouts|grocery|supermarket|market|"
    r"food\s*4\s*less|food4less|vons|ralphs|albertsons|smart\s*&\s*final|"
    r"fresh\s*market|lidl|food\s*lion|piggly|winco)\b",
    re.I,
)


@app.post("/scan-receipt")
async def scan_receipt(
    file: UploadFile = File(...),
    categories: str = Form(None),
    grocery_groups: str = Form(None)
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files accepted.")

    # Parse custom categories
    custom_categories = None
    if categories:
        try:
            custom_categories = json.loads(categories)
        except:
            pass

    custom_grocery_groups = None
    if grocery_groups:
        try:
            custom_grocery_groups = json.loads(grocery_groups)
        except:
            pass

    raw_bytes = await file.read()

    try:
        processed = preprocess_receipt(raw_bytes)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Receipt pre-processing failed: {e}")

    ocr_results = reader.readtext(processed, detail=1, paragraph=False)
    rows = group_into_rows(ocr_results)

    if not rows:
        raise HTTPException(status_code=422, detail="No text detected in image.")

    # 1. Extract Totals (Grand Total, Subtotal, Tax)
    totals = _extract_totals(rows)
    if totals["grand_total"] is None:
        raise HTTPException(
            status_code=422,
            detail="Could not find a TOTAL or TOTAL SALE line with a $ amount."
        )

    # 2. Merchant name from receipt header
    merchant = _extract_merchant(rows)

    # 3. Category (merchant-first)
    category = _classify_receipt(rows, merchant, custom_categories)

    # 4. Extract Items (Universally extract all valid line items)
    grocery_items = _extract_grocery_items(rows, custom_grocery_groups)

    return {
        "amount":        round(totals["grand_total"], 2),
        "subtotal":      round(totals["subtotal"], 2) if totals["subtotal"] else None,
        "tax":           round(totals["tax"], 2) if totals["tax"] else None,
        "category":      category,
        "description":   merchant,
        "grocery_items": grocery_items,
    }


@app.post("/scan-grocery-receipt")
async def scan_grocery_receipt(
    file: UploadFile = File(...),
    grocery_groups: str = Form(None)
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files accepted.")

    custom_grocery_groups = None
    if grocery_groups:
        try:
            custom_grocery_groups = json.loads(grocery_groups)
        except:
            pass

    raw_bytes = await file.read()

    parsed_candidates = []

    try:
        original_img = np.array(Image.open(io.BytesIO(raw_bytes)).convert("RGB"))
        original_results = reader.readtext(
            original_img,
            detail=1,
            paragraph=False,
            decoder="beamsearch",
            batch_size=4,
            width_ths=1.2,
            add_margin=0.02,
            text_threshold=0.5,
            low_text=0.3,
        )
        original_rows = group_ocr_rows(original_results)
        if original_rows:
            parsed_candidates.append(parse_grocery_receipt(original_rows, custom_grocery_groups))
    except Exception as e:
        print(f"Original grocery OCR pass failed: {e}")

    try:
        processed = preprocess_receipt(raw_bytes)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Receipt pre-processing failed: {e}")

    ocr_results = reader.readtext(processed, detail=1, paragraph=False)
    rows = group_ocr_rows(ocr_results)

    if rows:
        parsed_candidates.append(parse_grocery_receipt(rows, custom_grocery_groups))

    if not parsed_candidates:
        raise HTTPException(status_code=422, detail="No text detected in image.")

    parsed = max(
        parsed_candidates,
        key=lambda candidate: (
            len(candidate["items"]),
            1 if candidate["total"] is not None else 0,
            len(candidate["raw_rows"]),
        ),
    )
    if not parsed["items"]:
        raise HTTPException(
            status_code=422,
            detail="No grocery line items with prices were detected in this receipt.",
        )

    return parsed


@app.get("/health")
def health():
    return {"status": "ok"}
