import re
from typing import Any


TOTAL_LINE = re.compile(r"(total\s*sale|sale\s*total|grand\s*total|total|[0-9]*j?b?total|tjtal|ijial)", re.I)
SUBTOTAL_LINE = re.compile(r"\b(subtotal|sub\s*total)\b", re.I)
TAX_LINE = re.compile(r"\b(tax|hst|gst|pst|vat)\b", re.I)

NON_ITEM_ROW = re.compile(
    r"(total|[0-9]*j?b?total|tjtal|ijial|\bsubtotal|sub\s*total|tax|hst|gst|pst|vat|tip|gratuity|"
    r"discount|savings|saved|change|tender|coupon|reward|membership|loyalty|"
    r"thank\s*you|visit|receipt|approved|auth|ref\s*#|terminal|cashier|"
    r"store\s*#|phone|www\.|\.com|http|balance|points|card|visa|master|"
    r"debit|credit|account|ending|welcome|return policy)\b",
    re.I,
)

NOT_MERCHANT_ROW = re.compile(
    r"^\d{5}$"
    r"|^\d{1,5}\s+\w"
    r"|\d{3}[\s\-\.]\d{4}"
    r"|\(\d{3}\)"
    r"|^\d{1,2}[/\-]\d{1,2}"
    r"|\b(www\.|http|\.com|@)\b",
    re.I,
)

PRICE_RE = re.compile(r"(?:\$|\b)\s*([0-9][0-9,]*[\.,][0-9]{1,2})\s*([A-Z]{0,2})?\b")
SPLIT_PRICE_RE = re.compile(r"\b([0-9]{1,3})\s+([0-9]{2})\b")


def group_ocr_rows(ocr_results: list[Any], min_conf: float = 0.03, row_tolerance: int = 22) -> list[str]:
    rows = _group_ocr_boxes(ocr_results, min_conf=min_conf, row_tolerance=row_tolerance)
    return ["  ".join(text for _, text, _ in row) for row in rows]


def _group_ocr_boxes(
    ocr_results: list[Any],
    min_conf: float = 0.03,
    row_tolerance: int = 22,
) -> list[list[tuple[float, str, float]]]:
    annotated: list[tuple[float, float, str, float]] = []

    for bbox, text, conf in ocr_results:
        if conf < min_conf or not str(text).strip():
            continue
        ys = [point[1] for point in bbox]
        xs = [point[0] for point in bbox]
        y_center = (min(ys) + max(ys)) / 2
        x_left = min(xs)
        annotated.append((y_center, x_left, str(text).strip(), float(conf)))

    annotated.sort(key=lambda item: (item[0], item[1]))

    grouped: list[list[tuple[float, float, str, float]]] = []
    for item in annotated:
        y_center, _, _, _ = item
        for row in grouped:
            row_y = sum(existing[0] for existing in row) / len(row)
            if abs(y_center - row_y) <= row_tolerance:
                row.append(item)
                break
        else:
            grouped.append([item])

    output: list[list[tuple[float, str, float]]] = []
    for row in grouped:
        row.sort(key=lambda item: item[1])
        output.append([(x_left, text, conf) for _, x_left, text, conf in row])

    return output


def _amounts(row: str) -> list[float]:
    values: list[float] = []
    for amount, suffix in PRICE_RE.findall(row):
        if suffix and suffix.upper() in {"T", "F", "N", "B", "X"}:
            # Common receipt tax/status suffixes after item prices.
            pass
        normalized = amount.replace(",", ".")
        dollars, cents = normalized.split(".", 1)
        cents = cents[:2].ljust(2, "0")
        value = float(f"{dollars}.{cents}")
        if 0 < value < 10000:
            values.append(value)

    # OCR often reads a price like "2.39" as "2 39" on thermal receipts.
    for dollars, cents in SPLIT_PRICE_RE.findall(row):
        value = float(f"{dollars}.{cents}")
        if 0 < value < 10000:
            values.append(value)
    return values


def _clean_item_name(row: str) -> str:
    text = PRICE_RE.sub("", row)
    text = SPLIT_PRICE_RE.sub("", text)
    text = re.sub(r"\b\d{4,}\b", "", text)
    text = re.sub(r"\b\d+\s*(x|@)\s*\d+(\.\d{2})?\b", "", text, flags=re.I)
    text = re.sub(r"\b(FA|FC|FG|F|T|N|B)\b$", "", text, flags=re.I)
    text = re.sub(r"^\s*[-|*#:,\d]+|[-|*#:,]+$", "", text)
    text = re.sub(r"\s{2,}", " ", text).strip()
    return text[:60]


def extract_merchant(rows: list[str]) -> str:
    for row in rows[:8]:
        clean = _clean_item_name(row)
        if len(clean) >= 3 and not NOT_MERCHANT_ROW.search(clean):
            return clean[:60]
    return "Grocery Receipt"


def classify_item(name: str, grocery_groups: list[dict[str, Any]] | None = None) -> str:
    if not grocery_groups:
        return "Other"

    normalized = name.lower()
    for group in grocery_groups:
        group_name = str(group.get("name") or "Other").strip() or "Other"
        keywords = [
            keyword.strip().lower()
            for keyword in str(group.get("keywords") or "").split(",")
            if keyword.strip()
        ]
        if group_name.lower() != "other":
            keywords.append(group_name.lower())

        if any(keyword in normalized for keyword in keywords):
            return group_name

    return "Other"


def extract_totals(rows: list[str]) -> dict[str, float | None]:
    subtotal = None
    tax = None
    total = None
    fallback: list[float] = []

    for row in rows:
        amounts = _amounts(row)
        if not amounts:
            continue

        row_amount = max(amounts)
        fallback.append(row_amount)

        if subtotal is None and SUBTOTAL_LINE.search(row):
            subtotal = row_amount
        elif tax is None and TAX_LINE.search(row) and not SUBTOTAL_LINE.search(row):
            tax = row_amount
        elif TOTAL_LINE.search(row) and not SUBTOTAL_LINE.search(row) and not TAX_LINE.search(row):
            total = max(total or 0, row_amount)

    if total is None and fallback:
        total = max(fallback)

    return {"subtotal": subtotal, "tax": tax, "total": total}


def extract_items(
    rows: list[str],
    grocery_groups: list[dict[str, Any]] | None = None,
    max_price: float | None = None,
) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    body_rows = rows[4:-4] if len(rows) > 10 else rows

    for row in body_rows:
        if NON_ITEM_ROW.search(row):
            continue

        amounts = _amounts(row)
        if not amounts:
            continue

        price = amounts[-1]
        if max_price is not None and price > max_price * 1.05:
            continue
        name = _clean_item_name(row)
        if len(name) < 2:
            continue

        items.append({
            "name": name,
            "price": round(price, 2),
            "group": classify_item(name, grocery_groups),
        })

    return _dedupe_items(items)


def _dedupe_items(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    deduped: list[dict[str, Any]] = []
    seen: set[tuple[str, float]] = set()

    for item in items:
        key = (str(item["name"]).lower(), float(item["price"]))
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)

    return deduped


def parse_grocery_receipt(rows: list[str], grocery_groups: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    totals = extract_totals(rows)
    merchant = extract_merchant(rows)
    items = extract_items(rows, grocery_groups, totals["total"])

    return {
        "merchant": merchant,
        "total": round(totals["total"], 2) if totals["total"] is not None else None,
        "subtotal": round(totals["subtotal"], 2) if totals["subtotal"] is not None else None,
        "tax": round(totals["tax"], 2) if totals["tax"] is not None else None,
        "items": items,
        "raw_rows": rows,
    }
