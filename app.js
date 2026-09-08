const state = {
  orders: loadOrders(),
  files: loadFiles(),
  products: loadProducts(),
  exportLogs: loadExportLogs(),
};

const aliases = {
  orderId: ["注文番号", "取引ID", "取引番号", "落札ID", "オーダーID", "order id", "order_id", "name", "id"],
  source: ["サービス", "販売サイト", "モール", "platform", "source"],
  orderedAt: ["購入日", "注文日", "落札日", "日時", "created_at", "created at", "ordered_at"],
  status: ["ステータス", "取引状態", "発送状況", "fulfillment_status", "status"],
  buyerName: ["氏名", "購入者", "宛名", "お届け先氏名", "配送先氏名", "customer", "name"],
  postalCode: ["郵便番号", "zip", "postal_code", "postcode"],
  address: ["住所", "配送先住所", "お届け先住所", "address", "shipping address"],
  phone: ["電話番号", "tel", "phone"],
  itemName: ["商品名", "品名", "タイトル", "title", "item", "lineitem name"],
  sku: ["SKU", "商品コード", "管理番号", "sku"],
  quantity: ["数量", "個数", "quantity", "qty"],
  shippingMethod: ["配送方法", "発送方法", "shipping method", "carrier"],
  note: ["備考", "メモ", "要望", "オプション", "note"],
};

const sourceNames = {
  mercari: "メルカリ",
  yahoo: "ヤフオク",
  rakuma: "ラクマ",
  base: "BASE",
  shopify: "Shopify",
  giftmall: "ギフトモール",
  other: "その他",
};

const fileInput = document.querySelector("#fileInput");
const sourceSelect = document.querySelector("#sourceSelect");
const targetStatus = document.querySelector("#targetStatus");
const sellerAccountSelect = document.querySelector("#sellerAccountSelect");
const searchInput = document.querySelector("#searchInput");
const sampleButton = document.querySelector("#sampleButton");
const clearButton = document.querySelector("#clearButton");
const csvButton = document.querySelector("#csvButton");
const clickpostButton = document.querySelector("#clickpostButton");
const sheetCsvButton = document.querySelector("#sheetCsvButton");
const sheetSyncButton = document.querySelector("#sheetSyncButton");
const baseFetchButton = document.querySelector("#baseFetchButton");
const shopifyFetchButton = document.querySelector("#shopifyFetchButton");
const historyClearButton = document.querySelector("#historyClearButton");
const syncResetButton = document.querySelector("#syncResetButton");
const pasteImportButton = document.querySelector("#pasteImportButton");
const pasteSource = document.querySelector("#pasteSource");
const pasteText = document.querySelector("#pasteText");
const productAddButton = document.querySelector("#productAddButton");
const productNameInput = document.querySelector("#productNameInput");
const productSkuInput = document.querySelector("#productSkuInput");
const assignProductSelect = document.querySelector("#assignProductSelect");
const assignProductButton = document.querySelector("#assignProductButton");
const syncUrlInput = document.querySelector("#syncUrlInput");
const syncUrlSaveButton = document.querySelector("#syncUrlSaveButton");
const syncMode = document.querySelector("#syncMode");
const syncStatus = document.querySelector("#syncStatus");
const todaySalesResetButton = document.querySelector("#todaySalesResetButton");
const todaySalesRefreshButton = document.querySelector("#todaySalesRefreshButton");
const noticeBar = document.querySelector("#noticeBar");
const baseAuthButton = document.querySelector("#baseAuthButton");
const baseFetchPanelButton = document.querySelector("#baseFetchPanelButton");
const baseShopKey = document.querySelector("#baseShopKey");
const baseShopUrl = document.querySelector("#baseShopUrl");
const baseStartDate = document.querySelector("#baseStartDate");
const baseStatus = document.querySelector("#baseStatus");
const shopifyFetchPanelButton = document.querySelector("#shopifyFetchPanelButton");
const shopifyStoreDomain = document.querySelector("#shopifyStoreDomain");
const shopifyStartDate = document.querySelector("#shopifyStartDate");
const shopifyStatus = document.querySelector("#shopifyStatus");

fileInput.addEventListener("change", handleFiles);
sourceSelect.addEventListener("change", render);
targetStatus.addEventListener("change", render);
sellerAccountSelect.addEventListener("change", () => localStorage.setItem("shippingToolSellerAccount", sellerAccountSelect.value));
searchInput.addEventListener("input", render);
sampleButton.addEventListener("click", loadSample);
clearButton.addEventListener("click", clearAll);
csvButton.addEventListener("click", downloadCsv);
clickpostButton.addEventListener("click", downloadClickPostCsv);
sheetCsvButton.addEventListener("click", downloadSheetArchiveCsv);
sheetSyncButton.addEventListener("click", syncToGoogleSheets);
baseFetchButton.addEventListener("click", fetchBaseOrders);
shopifyFetchButton.addEventListener("click", fetchShopifyOrders);
baseFetchPanelButton.addEventListener("click", fetchBaseOrders);
shopifyFetchPanelButton.addEventListener("click", fetchShopifyOrders);
baseAuthButton.addEventListener("click", openBaseAuth);
historyClearButton.addEventListener("click", clearSavedHistory);
syncResetButton.addEventListener("click", resetSyncStatus);
pasteImportButton.addEventListener("click", importPastedText);
productAddButton.addEventListener("click", addProductMapping);
assignProductButton.addEventListener("click", assignProductToUnknownOrders);
syncUrlSaveButton.addEventListener("click", saveSyncUrl);
todaySalesResetButton.addEventListener("click", () => runSheetAction("reset_today_sales", "今日の販売リセット"));
todaySalesRefreshButton.addEventListener("click", () => runSheetAction("refresh_today_sales", "今日の販売更新"));
syncUrlInput.value = localStorage.getItem("shippingToolSyncUrl") || "";
syncStatus.value = syncUrlInput.value ? "URL設定済み" : "未設定";
sellerAccountSelect.value = localStorage.getItem("shippingToolSellerAccount") || "";
baseShopUrl.value = localStorage.getItem("shippingToolBaseShopUrl") || "https://ilt.base.ec/";
baseShopKey.value = localStorage.getItem("shippingToolBaseShopKey") || "ilt";
baseShopKey.addEventListener("change", () => {
  localStorage.setItem("shippingToolBaseShopKey", baseShopKey.value);
  baseShopUrl.value = baseShopKey.value === "iglight" ? "https://iglight.base.shop/" : "https://ilt.base.ec/";
});
baseStartDate.value = baseStartDate.value || new Date().toISOString().slice(0, 10);
shopifyStoreDomain.value = localStorage.getItem("shippingToolShopifyStoreDomain") || "";
shopifyStartDate.value = shopifyStartDate.value || new Date().toISOString().slice(0, 10);

async function handleFiles(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;
  setNotice(`${files.length}件のCSVを読み込み中です...`, "working");
  let importedCount = 0;
  for (const file of files) {
    const text = await readCsvText(file);
    const rows = parseCsv(text);
    const source = sourceSelect.value === "auto" ? inferSource(file.name, rows) : sourceSelect.value;
    const orders = rowsToOrders(rows, source);
    state.orders.push(...orders);
    importedCount += orders.length;
    state.files.push(file.name);
  }
  fileInput.value = "";
  render();
  setNotice(`CSVから${importedCount}件を発送リストへ追加しました`, "success");
}

async function readCsvText(file) {
  const buffer = await file.arrayBuffer();
  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  const brokenChars = (utf8.match(/\uFFFD/g) || []).length;
  if (brokenChars === 0) return utf8;

  try {
    return new TextDecoder("shift_jis", { fatal: false }).decode(buffer);
  } catch {
    return utf8;
  }
}

function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && quoted && next === '"') {
      field += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      field = "";
      row = [];
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

function rowsToOrders(rows, fallbackSource) {
  if (rows.length < 2) return [];
  const headers = rows[0].map(normalize);
  return rows.slice(1).map((row, index) => {
    const raw = Object.fromEntries(headers.map((header, i) => [header, row[i] || ""]));
    const order = {
      id: crypto.randomUUID(),
      source: pick(raw, headers, "source") || sourceNames[fallbackSource] || fallbackSource,
      sellerAccount: sellerAccountSelect.value || "",
      orderId: pick(raw, headers, "orderId") || `${fallbackSource}-${Date.now()}-${index + 1}`,
      orderedAt: pick(raw, headers, "orderedAt"),
      status: pick(raw, headers, "status"),
      buyerName: pick(raw, headers, "buyerName"),
      postalCode: pick(raw, headers, "postalCode"),
      address: pick(raw, headers, "address"),
      phone: pick(raw, headers, "phone"),
      itemName: pick(raw, headers, "itemName"),
      sku: pick(raw, headers, "sku"),
      quantity: pick(raw, headers, "quantity") || "1",
      shippingMethod: pick(raw, headers, "shippingMethod"),
      price: "",
      profit: "",
      accountName: "",
      syncedAt: "",
      note: pick(raw, headers, "note"),
    };
    order.shipTarget = isShipTarget(order.status);
    return order;
  });
}

function pick(raw, headers, key) {
  const names = aliases[key].map(normalize);
  const match = headers.find((header) => names.includes(header));
  return match ? raw[match].trim() : "";
}

function normalize(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function inferSource(fileName, rows) {
  const sample = `${fileName} ${rows.slice(0, 3).flat().join(" ")}`.toLowerCase();
  if (sample.includes("mercari") || sample.includes("メルカリ")) return "mercari";
  if (sample.includes("yahoo") || sample.includes("ヤフオク") || sample.includes("落札")) return "yahoo";
  if (sample.includes("rakuma") || sample.includes("ラクマ")) return "rakuma";
  if (sample.includes("base")) return "base";
  if (sample.includes("shopify")) return "shopify";
  if (sample.includes("gift") || sample.includes("ギフトモール")) return "giftmall";
  return "other";
}

function isShipTarget(status) {
  const value = normalize(status);
  if (!value) return true;
  const shippedWords = ["発送済", "完了", "fulfilled", "shipped", "cancel", "キャンセル"];
  return !shippedWords.some((word) => value.includes(word));
}

function importPastedText() {
  const text = pasteText.value.trim();
  if (!text) {
    setNotice("画面コピーのテキストを貼り付けてから取り込みしてください", "error");
    return;
  }
  setNotice("画面コピーを解析中です...", "working");
  const blocks = splitPastedBlocks(text, pasteSource.value);
  const imported = blocks.map((block, index) => pastedBlockToOrder(block, index));
  imported.forEach(upsertOrder);
  state.files.push(`${pasteSource.value}貼り付け`);
  pasteText.value = "";
  saveOrders();
  render();
  setNotice(`${pasteSource.value}の画面コピーから${imported.length}件を発送リストへ追加しました`, "success");
}

function upsertOrder(nextOrder) {
  const existing = state.orders.find((order) => order.source === nextOrder.source && order.orderId === nextOrder.orderId);
  if (!existing) {
    state.orders.push(nextOrder);
    return;
  }
  Object.keys(nextOrder).forEach((key) => {
    if (key === "id") return;
    if (nextOrder[key] && !existing[key]) existing[key] = nextOrder[key];
  });
  existing.shipTarget = isShipTarget(existing.status);
}

function splitPastedBlocks(text, source) {
  if (source === "メルカリ") {
    const linkPattern = /\[[^\]]+\]\(https:\/\/jp\.mercari\.com\/(?:item|transaction)\/m\d+\)/g;
    const starts = [];
    let match;
    while ((match = linkPattern.exec(text)) !== null) starts.push(match.index);
    if (starts.length > 1) {
      return starts.map((start, index) => text.slice(start, starts[index + 1] || text.length).trim()).filter(Boolean);
    }
    return [text.trim()].filter(Boolean);
  }
  if (source === "ラクマ") {
    const linkPattern = /https?:\/\/(?:item|fril)\.fril\.jp\/[^\s)]+|https?:\/\/fril\.jp\/[^\s)]+/g;
    const starts = [];
    let match;
    while ((match = linkPattern.exec(text)) !== null) starts.push(match.index);
    if (starts.length > 1) {
      return starts.map((start, index) => text.slice(start, starts[index + 1] || text.length).trim()).filter(Boolean);
    }
    return [text.trim()].filter(Boolean);
  }
  if (source === "ヤフオク") {
    // 取引詳細ページのコピーは内部に空行を多く含むため空行区切りは使えない。
    // 「オークションID：」の出現箇所を1取引の区切りとして使う。
    const idPattern = /オークションID[:：]/g;
    const starts = [];
    let match;
    while ((match = idPattern.exec(text)) !== null) starts.push(match.index);
    if (starts.length > 1) {
      // 商品名などIDより前の情報も含めるため、直前の空行までさかのぼって開始位置とする。
      const adjustedStarts = starts.map((start) => {
        const prevBlank = text.lastIndexOf("\n\n", start);
        return prevBlank >= 0 ? prevBlank + 2 : 0;
      });
      return adjustedStarts.map((start, index) => text.slice(start, adjustedStarts[index + 1] || text.length).trim()).filter(Boolean);
    }
    return [text.trim()].filter(Boolean);
  }
  return text
    .split(/\n\s*\n+/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function pastedBlockToOrder(block, index) {
  const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const get = (...labels) => {
    const normalizedLabels = labels.map(normalize);
    const line = lines.find((entry) => {
      const [key] = entry.split(/[:：]/);
      return normalizedLabels.includes(normalize(key));
    });
    if (!line || !/[:：]/.test(line)) return "";
    return line.replace(/^[^:：]+[:：]\s*/, "").trim();
  };
  const mercari = parseMercariPastedBlock(lines);
  const rakuma = pasteSource.value === "ラクマ" ? parseRakumaPastedBlock(lines) : {};
  const yahoo = pasteSource.value === "ヤフオク" ? parseYahooPastedBlock(lines) : {};

  const order = {
    id: crypto.randomUUID(),
    source: pasteSource.value,
    sellerAccount: sellerAccountSelect.value || "",
    orderId: get("注文番号", "取引ID", "取引番号", "落札ID") || yahoo.orderId || rakuma.orderId || mercari.orderId || `${pasteSource.value}-${Date.now()}-${index + 1}`,
    orderedAt: get("購入日", "注文日", "落札日") || yahoo.orderedAt || rakuma.orderedAt || mercari.orderedAt,
    status: get("ステータス", "取引状態", "発送状況") || yahoo.status || rakuma.status || mercari.status || "未発送",
    buyerName: yahoo.buyerName || rakuma.buyerName || get("氏名", "購入者", "宛名", "お届け先氏名") || mercari.buyerName,
    postalCode: get("郵便番号") || yahoo.postalCode || rakuma.postalCode || mercari.postalCode,
    address: yahoo.address || rakuma.address || get("住所", "配送先住所", "お届け先住所") || mercari.address,
    phone: get("電話番号"),
    itemName: get("商品名", "品名", "タイトル") || yahoo.itemName || rakuma.itemName || mercari.itemName,
    sku: get("SKU", "商品コード", "管理番号"),
    quantity: get("数量", "個数") || yahoo.quantity || "1",
    shippingMethod: get("配送方法", "発送方法") || yahoo.shippingMethod || rakuma.shippingMethod || mercari.shippingMethod,
    price: yahoo.price || rakuma.price || mercari.price,
    profit: rakuma.profit || mercari.profit,
    accountName: rakuma.accountName || mercari.accountName,
    syncedAt: "",
    note: get("備考", "メモ", "要望", "オプション") || yahoo.note || rakuma.note || mercari.note,
  };
  order.shipTarget = isShipTarget(order.status);
  return order;
}

function parseYahooPastedBlock(lines) {
  const cleaned = lines
    .map((line) => line.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim())
    .filter(Boolean);
  const joined = cleaned.join(" ");

  const orderId = yahooLabeledValue(cleaned, /^オークションID/, /^([A-Za-z0-9]+)$/)
    || (joined.match(/オークションID[:：]\s*([A-Za-z0-9]+)/) || [])[1] || "";
  const itemName = parseYahooItemName(cleaned);
  // 取引ページの段階によってラベルが「落札数量」「数量」のどちらにもなる。
  // さらにコピーの仕方によって「落札数量：3」と1行になる場合と、「落札数量」の次の行に「3」が
  // 来る場合がある。後者を拾えず数量が常に1になっていたため、両方の形式に対応する。
  const quantity = (yahooLabeledValue(cleaned, /^(?:落札)?数量/, /^([0-9,]+)/)
    || (joined.match(/(?:落札)?数量[:：]\s*([0-9,]+)/) || [])[1]
    || "1").replace(/,/g, "");
  const priceValue = yahooLabeledValue(cleaned, /^落札価格/, /^([0-9,]+)\s*円?/)
    || (joined.match(/落札価格[:：]\s*([0-9,]+)\s*円/) || [])[1] || "";
  const price = priceValue ? `¥${priceValue}` : "";
  const endedAtValue = yahooLabeledValue(cleaned, /^終了日時/, /(\d{1,2}月\d{1,2}日\s*\d{1,2}時\d{1,2}分)/)
    || (joined.match(/終了日時[:：]\s*(\d{1,2}月\d{1,2}日\s*\d{1,2}時\d{1,2}分)/) || [])[1] || "";
  const orderedAt = endedAtValue ? normalizeYahooDate(endedAtValue) : "";
  const buyerName = (yahooLabeledValue(cleaned, /^落札者/, /^([^\s（(]+)/)
    || (joined.match(/落札者[:：]\s*([^\s（(]+)/) || [])[1] || "").trim();
  const shippingMethod = parseYahooShippingMethod(cleaned);

  // ヤフオクの匿名配送（おてがる配送等）は住所欄自体がコピー内容に含まれないため、
  // 配送方法から匿名配送を検知し、住所欄は「-」（未取得）として扱う。
  let postalCode = "";
  let address = "";
  if (/匿名配送/.test(shippingMethod) || /匿名配送/.test(joined)) {
    postalCode = "-";
    address = "-";
  }

  // 発送コード発行後の画面には、コンビニ発送に必要な受付番号・パスワード・発送場所が載っているので、
  // 取れる場合はメモ欄に残しておく（実際の発送作業で必要になるため）。
  const noteParts = [];
  const dropOffLocation = parseYahooDropOffLocation(cleaned);
  if (dropOffLocation) noteParts.push(`発送場所:${dropOffLocation}`);
  const receiptMatch = joined.match(/受付番号\s*([0-9A-Za-z-]+)/);
  if (receiptMatch) noteParts.push(`受付番号:${receiptMatch[1]}`);
  const passwordMatch = joined.match(/パスワード\s*([0-9A-Za-z-]+)/);
  if (passwordMatch) noteParts.push(`パスワード:${passwordMatch[1]}`);
  const note = noteParts.join(" / ");

  const status = "未発送";
  return { orderId, itemName, orderedAt, buyerName, postalCode, address, shippingMethod, price, quantity, note, status };
}

// ヤフオク取引ナビのコピーは、環境によって「ラベル：値」が同じ行に入る場合と、
// ラベル行の次の行に値だけが入る場合がある。全行を空白で連結して「ラベル[:：]」を探す方式だと
// 後者をまったく拾えず、数量が既定値の1に、価格・ID・落札者・終了日時が空になっていた。
// ラベル行を見つけたうえで「同じ行の続き」→「次の非空行」の順に値を探すことで両形式に対応する。
function yahooLabeledValue(cleaned, labelPattern, valuePattern) {
  for (let i = 0; i < cleaned.length; i += 1) {
    const line = cleaned[i];
    if (!labelPattern.test(line)) continue;
    const inline = line.replace(labelPattern, "").replace(/^[:：]\s*/, "").trim();
    if (inline) {
      const hit = inline.match(valuePattern);
      if (hit) return hit[1] !== undefined ? hit[1] : hit[0];
    }
    for (let j = i + 1; j < cleaned.length; j += 1) {
      const next = cleaned[j];
      if (!next) continue;
      const hit = next.match(valuePattern);
      return hit ? (hit[1] !== undefined ? hit[1] : hit[0]) : "";
    }
  }
  return "";
}

function parseYahooItemName(cleaned) {
  const quantityIndex = cleaned.findIndex((line) => /^(?:落札)?数量/.test(line));
  if (quantityIndex > 0) {
    const skipLabels = ["取引ナビ", "使い方ガイド", "商品ページ", "商品ページへ", "商品情報"];
    for (let i = quantityIndex - 1; i >= 0; i -= 1) {
      const line = cleaned[i];
      if (!line || skipLabels.includes(line)) continue;
      return line;
    }
  }
  return "";
}

function parseYahooShippingMethod(cleaned) {
  const labelIndex = cleaned.findIndex((line) => line === "落札者が選択した配送方法" || line === "配送方法");
  if (labelIndex < 0) return "";
  const parts = [];
  for (let i = labelIndex + 1; i < cleaned.length && parts.length < 3; i += 1) {
    const line = cleaned[i];
    if (!line) break;
    if (line.length > 20 || /[。、]|変更する|発送場所|受付番号|パスワード|配送コード/.test(line)) break;
    parts.push(line);
  }
  return parts.join(" ");
}

function parseYahooDropOffLocation(cleaned) {
  const index = cleaned.findIndex((line) => line === "発送場所");
  if (index < 0) return "";
  for (let i = index + 1; i < cleaned.length; i += 1) {
    const line = cleaned[i];
    if (!line || line === "持込場所を検索") continue;
    if (line.length > 20 || /[。、]/.test(line)) return "";
    return line;
  }
  return "";
}

function normalizeYahooDate(text) {
  const match = String(text || "").match(/(\d{1,2})月(\d{1,2})日\s*(\d{1,2})時(\d{1,2})分/);
  if (!match) return text || "";
  const now = new Date();
  let year = now.getFullYear();
  const candidate = new Date(year, Number(match[1]) - 1, Number(match[2]));
  if (candidate.getTime() - now.getTime() > 24 * 60 * 60 * 1000) year -= 1; // 未来日付になる場合は前年と推定
  return `${year}年${match[1]}月${match[2]}日 ${match[3]}:${match[4].padStart(2, "0")}`;
}

function addProductMapping() {
  const name = productNameInput.value.trim();
  const sku = productSkuInput.value.trim();
  if (!name) return;
  const id = crypto.randomUUID();
  state.products.push({ id, name, sku });
  saveProducts();
  productNameInput.value = "";
  productSkuInput.value = "";
  render();
}

function deleteProduct(id) {
  state.products = state.products.filter((product) => product.id !== id);
  saveProducts();
  render();
}

function assignProductToUnknownOrders() {
  const product = state.products.find((entry) => entry.id === assignProductSelect.value);
  if (!product) return;
  state.orders.forEach((order) => {
    if (!order.itemName) {
      order.itemName = product.name;
      order.sku = product.sku || order.sku;
    }
  });
  saveOrders();
  render();
}

function loadProducts() {
  try {
    return JSON.parse(localStorage.getItem("shippingToolProducts") || "[]");
  } catch {
    return [];
  }
}

function saveProducts() {
  localStorage.setItem("shippingToolProducts", JSON.stringify(state.products));
}

function loadOrders() {
  try {
    return JSON.parse(localStorage.getItem("shippingToolOrders") || "[]");
  } catch {
    return [];
  }
}

function loadFiles() {
  try {
    return JSON.parse(localStorage.getItem("shippingToolFiles") || "[]");
  } catch {
    return [];
  }
}

function loadExportLogs() {
  try {
    return JSON.parse(localStorage.getItem("shippingToolExportLogs") || "[]");
  } catch {
    return [];
  }
}

function saveOrders() {
  localStorage.setItem("shippingToolOrders", JSON.stringify(state.orders));
  localStorage.setItem("shippingToolFiles", JSON.stringify(state.files));
}

function saveExportLogs() {
  localStorage.setItem("shippingToolExportLogs", JSON.stringify(state.exportLogs));
}

function parseMercariPastedBlock(lines) {
  const originalLines = lines
    .map((line) => line.replace(/\*\*/g, "").trim())
    .filter(Boolean);
  const cleaned = lines
    .map((line) => line.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim())
    .filter(Boolean);
  const valueAfter = (label) => {
    const index = cleaned.findIndex((line) => line === label);
    return index >= 0 ? cleaned[index + 1] || "" : "";
  };
  const orderId = valueAfter("商品ID") || (cleaned.join(" ").match(/\bm\d{6,}\b/) || [""])[0];
  const itemName = parseMercariItemName(cleaned, originalLines);
  const orderedAt = valueAfter("購入日時");
  const shippingMethod = valueAfter("配送の方法");
  const postalIndex = cleaned.findIndex((line) => /^〒?\d{3}-\d{4}$/.test(line));
  let postalCode = postalIndex >= 0 ? cleaned[postalIndex].replace(/^〒/, "") : "";
  const accountName = parseMercariAccountName(cleaned);
  let buyerName = "";
  let address = "";

  if (postalIndex >= 0) {
    const addressParts = [];
    for (let i = postalIndex + 1; i < cleaned.length; i += 1) {
      const line = cleaned[i];
      if (line === "購入者情報") break;
      if (line.endsWith("様")) {
        buyerName = line.replace(/様$/, "").trim();
        break;
      }
      addressParts.push(line);
    }
    address = addressParts.join(" ");
  }

  if (isMercariAnonymousDelivery(cleaned, buyerName, address)) {
    buyerName = "匿名配送";
    postalCode = "-";
    address = "-";
  }

  const price = valueAfter("商品代金") || parseMercariListPrice(cleaned, originalLines);
  const profit = valueAfter("販売利益");
  const listUpdatedAt = parseMercariListUpdatedAt(cleaned);
  const note = listUpdatedAt ? `一覧更新 ${listUpdatedAt}` : "";
  const status = cleaned.includes("発送してください") ? "発送してください" : "";
  return { orderId, itemName, orderedAt, buyerName, postalCode, address, shippingMethod, price, profit, accountName, note, status };
}

function isMercariAnonymousDelivery(cleaned, buyerName, address) {
  const text = cleaned.join(" ");
  const anonymousMethod = /匿名配送|らくらくメルカリ便|ゆうゆうメルカリ便/.test(text);
  if (!anonymousMethod) return false;
  const hasBuyerAddressBlock = cleaned.some((line) => line === "お届け先" || line === "配送先住所");
  const hasBuyerName = !!String(buyerName || "").trim();
  const hasAddress = !!String(address || "").trim();
  return !hasBuyerAddressBlock || !hasBuyerName || !hasAddress;
}

function parseMercariItemName(cleaned, originalLines = cleaned) {
  const originalLinkLine = originalLines.find((line) => /\]\(https:\/\/jp\.mercari\.com\/(?:item|transaction)\/m\d+\)/.test(line));
  if (originalLinkLine) {
    const match = originalLinkLine.match(/^\[([^\]]+)\]/);
    if (match) return match[1].replace(/のサムネイル$/, "").trim();
  }

  const thumbnailIndex = cleaned.findIndex((line) => line.endsWith("のサムネイル"));
  if (thumbnailIndex >= 0 && cleaned[thumbnailIndex + 1]) return cleaned[thumbnailIndex + 1];

  const priceIndex = cleaned.findIndex((line) => line === "商品代金");
  if (priceIndex > 0) {
    const candidates = cleaned.slice(0, priceIndex).filter((line) => {
      if (line.endsWith("のサムネイル")) return false;
      if (/^https?:\/\//.test(line)) return false;
      if (/^m\d{6,}$/.test(line)) return false;
      return line.length > 1;
    });
    if (candidates.length) return candidates[candidates.length - 1];
  }
  return "";
}

function parseMercariListPrice(cleaned, originalLines) {
  const yenIndex = cleaned.findIndex((line) => line === "¥");
  if (yenIndex >= 0 && cleaned[yenIndex + 1]) return `¥${cleaned[yenIndex + 1]}`;

  const yenLinkIndex = originalLines.findIndex((line) => /^\[\s*\**¥\**\s*\]/.test(line));
  if (yenLinkIndex >= 0 && originalLines[yenLinkIndex + 1]) {
    const match = originalLines[yenLinkIndex + 1].match(/\[\s*\**([\d,]+)\**\s*\]/);
    if (match) return `¥${match[1]}`;
  }
  return "";
}

function parseMercariListUpdatedAt(cleaned) {
  const line = cleaned.find((entry) => /前に更新$/.test(entry));
  return line || "";
}

function parseMercariAccountName(cleaned) {
  const buyerInfoIndex = cleaned.findIndex((line) => line === "購入者情報");
  if (buyerInfoIndex < 0) return "";
  const afterBuyerInfo = cleaned.slice(buyerInfoIndex + 1);
  const skipWords = ["コピーする", "取引画面", "発送をしてください"];
  const candidate = afterBuyerInfo.find((line) => {
    if (!line || skipWords.includes(line)) return false;
    if (line.includes("画像")) return false;
    if (line.startsWith("http")) return false;
    return true;
  });
  return candidate || "";
}

function parseRakumaPastedBlock(lines) {
  const cleaned = lines
    .map((line) => line.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim())
    .filter(Boolean);
  const joined = cleaned.join(" ");
  const valueAfter = (...labels) => {
    for (const label of labels) {
      const index = cleaned.findIndex((line) => normalize(line) === normalize(label));
      if (index >= 0 && cleaned[index + 1]) return cleaned[index + 1];
      const inline = cleaned.find((line) => normalize(line).startsWith(`${normalize(label)}:`) || normalize(line).startsWith(`${normalize(label)}：`));
      if (inline) return inline.replace(/^[^:：]+[:：]\s*/, "").trim();
    }
    return "";
  };

  const orderId = valueAfter("取引ID", "オーダーID", "注文番号", "商品ID") || `RAKUMA-${Date.now()}`;
  const itemName = parseRakumaItemName(cleaned);
  const deadline = parseRakumaDeadline(cleaned);
  const orderedAt = estimateRakumaOrderedAt(deadline) || valueAfter("購入日時", "購入日", "支払い日時", "注文日時");
  const shippingMethod = valueAfter("配送方法", "配送の方法", "発送方法");
  const price = valueAfter("商品代金", "販売価格", "購入金額", "価格") || parseLabeledAmount(cleaned, "商品代金") || parseFirstRakumaPrice(cleaned);
  const profit = valueAfter("販売利益", "売上金", "受取金額") || parseLabeledAmount(cleaned, "受取代金");
  const accountName = valueAfter("購入者", "購入者情報", "ニックネーム", "ユーザー名") || parseRakumaAccountName(cleaned);

  const addressInfo = parseRakumaAddress(cleaned);
  const postalCode = addressInfo.postalCode || valueAfter("郵便番号");
  let buyerName = addressInfo.buyerName || valueAfter("宛名", "氏名", "お届け先氏名");
  let address = addressInfo.address || valueAfter("住所", "配送先住所", "お届け先住所");

  if (address === postalCode) address = addressInfo.address;

  const status = cleaned.find((line) => /商品の発送と発送通知|発送通知を行ってください|購入手続が完了/.test(line)) || "未発送";
  const note = deadline ? `発送期限 ${deadline}` : "";
  return { orderId, itemName, orderedAt, buyerName, postalCode, address, shippingMethod: shippingMethod || parseRakumaShippingMethod(cleaned), price, profit, accountName, status, note };
}

function parseRakumaAddress(cleaned) {
  const startIndex = cleaned.findIndex((line) => line === "配送先住所" || line === "お届け先" || line === "お届け先住所");
  const postalIndex = cleaned.findIndex((line, index) => index >= Math.max(0, startIndex) && /^〒?\s*\d{3}-\d{4}$/.test(line));
  if (postalIndex < 0) return { postalCode: "", address: "", buyerName: "" };

  const postalCode = cleaned[postalIndex].replace(/^〒?\s*/, "");
  const parts = [];
  let buyerName = "";
  for (let i = postalIndex + 1; i < cleaned.length; i += 1) {
    const line = cleaned[i];
    if (/購入者情報|取引メッセージ|配送情報|商品代金|販売手数料|受取代金|発送期限|商品の発送|発送通知/.test(line)) break;
    if (line.endsWith("様")) {
      buyerName = line.replace(/様$/, "").trim();
      break;
    }
    parts.push(line);
  }
  return { postalCode, address: parts.join(" "), buyerName };
}

function parseRakumaItemName(cleaned) {
  const labelValue = (() => {
    const index = cleaned.findIndex((line) => ["商品名", "タイトル", "品名"].includes(line));
    return index >= 0 ? cleaned[index + 1] || "" : "";
  })();
  if (labelValue) return labelValue;

  const firstProductLine = cleaned.find((line, index) => {
    if (/商品代金|販売価格|購入日時|配送方法|取引|発送|お届け先|購入者/.test(line)) return false;
    if (/^〒?\s*\d{3}-\d{4}$/.test(line)) return false;
    if (/^¥?[\d,]+円?$/.test(line)) return false;
    if (index > 3) return false;
    return line.length >= 4;
  });
  return firstProductLine || "";
}

function parseLabeledAmount(cleaned, label) {
  const line = cleaned.find((entry) => entry.startsWith(label));
  if (!line) return "";
  const match = line.match(/¥\s*[\d,]+/);
  return match ? match[0].replace(/\s+/g, "") : "";
}

function parseFirstRakumaPrice(cleaned) {
  const line = cleaned.find((entry) => /^¥\s*[\d,]+$/.test(entry));
  return line ? line.replace(/\s+/g, "") : "";
}

function parseRakumaDeadline(cleaned) {
  const line = cleaned.find((entry) => entry.startsWith("発送期限"));
  if (!line) return "";
  return line.replace(/^発送期限[:：]?/, "").trim();
}

function estimateRakumaOrderedAt(deadline) {
  const match = String(deadline || "").match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (!match) return "";
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  date.setDate(date.getDate() - 3);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 推定`;
}

function parseRakumaShippingMethod(cleaned) {
  const infoIndex = cleaned.findIndex((line) => line === "配送情報");
  if (infoIndex >= 0) {
    const next = cleaned.slice(infoIndex + 1).find((line) => line && !/送料込み|発送期限/.test(line));
    if (next) return next;
  }
  const noticeIndex = cleaned.findIndex((line) => line === "発送通知");
  if (noticeIndex >= 0 && cleaned[noticeIndex + 1]) return cleaned[noticeIndex + 1];
  return "";
}

function parseRakumaAccountName(cleaned) {
  const buyerIndex = cleaned.findIndex((line) => line === "購入者情報");
  if (buyerIndex >= 0) {
    const next = cleaned.slice(buyerIndex + 1).find((line) => line && !/^\d+$/.test(line));
    if (next) return next;
  }
  const messageIndex = cleaned.findIndex((line) => line === "取引メッセージ");
  if (messageIndex >= 0) {
    const candidates = cleaned.slice(messageIndex + 1).filter((line) => !/^\d{4}\/\d{2}\/\d{2}/.test(line));
    const shortName = candidates.find((line) => line.length > 0 && line.length <= 20 && !/ありがとう|よろしく|メッセージ|送る|購入/.test(line));
    if (shortName) return shortName;
  }
  return "";
}

function filteredOrders() {
  const query = normalize(searchInput.value);
  return state.orders.filter((order) => {
    if (targetStatus.value === "unshipped" && !order.shipTarget) return false;
    if (!query) return true;
    return normalize(Object.values(order).join(" ")).includes(query);
  });
}

function duplicateKeys() {
  const seen = new Map();
  state.orders.forEach((order) => {
    const key = normalize(`${order.source}-${order.orderId}-${order.itemName}-${order.buyerName}`);
    seen.set(key, (seen.get(key) || 0) + 1);
  });
  return seen;
}

function render() {
  const rows = filteredOrders();
  const duplicates = duplicateKeys();
  const duplicateCount = Array.from(duplicates.values()).filter((count) => count > 1).length;
  document.querySelector("#totalCount").textContent = state.orders.length;
  document.querySelector("#shipCount").textContent = state.orders.filter((order) => order.shipTarget).length;
  document.querySelector("#duplicateCount").textContent = duplicateCount;
  document.querySelector("#updatedAt").textContent = state.orders.length ? new Date().toLocaleTimeString("ja-JP") : "未読込";
  document.querySelector("#fileList").textContent = state.files.length ? state.files.join(" / ") : "CSV未読込";
  document.querySelector("#exportLog").textContent = state.exportLogs.length
    ? state.exportLogs.map((log) => `${log.exportedAt} ${log.label || "CSV"} ${log.count}件`).join(" / ")
    : "CSV出力履歴はまだありません。";
  renderProductMap();

  const tbody = document.querySelector("#orderRows");
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="17" class="empty">表示できる注文がありません。</td></tr>';
    return;
  }

  tbody.innerHTML = rows
    .map((order) => {
      const key = normalize(`${order.source}-${order.orderId}-${order.itemName}-${order.buyerName}`);
      const duplicateClass = duplicates.get(key) > 1 ? " duplicate" : "";
      return `
        <tr class="${order.shipTarget ? "ship-target" : ""}${duplicateClass}">
          <td><span class="badge">${order.shipTarget ? "対象" : "除外"}</span></td>
          <td>${editableCell(order, "source")}</td>
          <td>${editableCell(order, "sellerAccount")}</td>
          <td>${editableCell(order, "orderId")}</td>
          <td>${editableCell(order, "orderedAt")}</td>
          <td>${editableCell(order, "buyerName")}</td>
          <td>${editableCell(order, "postalCode")}</td>
          <td>${editableCell(order, "address")}</td>
          <td>${editableCell(order, "itemName")}${order.sku ? `<br><small>SKU: ${escapeHtml(order.sku)}</small>` : ""}</td>
          <td>${editableCell(order, "quantity")}</td>
          <td>${editableCell(order, "shippingMethod")}</td>
          <td>${editableCell(order, "price")}</td>
          <td>${editableCell(order, "profit")}</td>
          <td>${editableCell(order, "accountName")}</td>
          <td><span class="badge ${order.syncedAt ? "synced" : ""}">${order.syncedAt ? "済" : "未"}</span></td>
          <td>${editableCell(order, "note")}</td>
          <td><button type="button" class="mini-button" data-delete="${escapeHtml(order.id)}">削除</button></td>
        </tr>`;
    })
    .join("");
  tbody.querySelectorAll("[contenteditable][data-id][data-field]").forEach((cell) => {
    cell.addEventListener("blur", () => updateOrderField(cell.dataset.id, cell.dataset.field, cell.textContent.trim()));
  });
  tbody.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteOrder(button.dataset.delete));
  });
}

function editableCell(order, field) {
  return `<span class="editable" contenteditable="true" data-id="${escapeHtml(order.id)}" data-field="${field}">${escapeHtml(order[field])}</span>`;
}

function updateOrderField(id, field, value) {
  const order = state.orders.find((entry) => entry.id === id);
  if (!order) return;
  order[field] = value;
  saveOrders();
}

function deleteOrder(id) {
  state.orders = state.orders.filter((order) => order.id !== id);
  saveOrders();
  render();
}

function resetSyncStatus() {
  state.orders.forEach((order) => {
    order.syncedAt = "";
  });
  saveOrders();
  setNotice("同期済み状態を解除しました", "success");
  render();
}

function renderProductMap() {
  const list = document.querySelector("#productMapList");
  assignProductSelect.innerHTML = '<option value="">商品を選択</option>';
  state.products.forEach((product) => {
    const option = document.createElement("option");
    option.value = product.id;
    option.textContent = product.sku ? `${product.name} (${product.sku})` : product.name;
    assignProductSelect.appendChild(option);
  });
  if (!state.products.length) {
    list.textContent = "登録済み商品はありません。";
    return;
  }
  list.innerHTML = state.products
    .map(
      (product) =>
        `<div class="product-row"><span>${escapeHtml(product.name)}${product.sku ? ` <small>SKU: ${escapeHtml(product.sku)}</small>` : ""}</span><button type="button" class="mini-button" data-product-delete="${escapeHtml(product.id)}">削除</button></div>`,
    )
    .join("<br>");
  list.querySelectorAll("[data-product-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteProduct(button.dataset.productDelete));
  });
}

function downloadCsv() {
  const headers = ["発送対象", "サービス", "販売アカウント", "注文番号", "購入日", "氏名", "郵便番号", "住所", "電話番号", "商品名", "SKU", "数量", "配送方法", "商品代金", "販売利益", "アカウント名", "備考"];
  const rows = filteredOrders().map((order) => [
    order.shipTarget ? "対象" : "除外",
    order.source,
    order.sellerAccount,
    order.orderId,
    order.orderedAt,
    order.buyerName,
    order.postalCode,
    order.address,
    order.phone,
    order.itemName,
    order.sku,
    order.quantity,
    order.shippingMethod,
    order.price,
    order.profit,
    order.accountName,
    order.note,
  ]);
  downloadRows("shipping-list", headers, rows, "通常CSV");
}

function isAnonymousShipment(order) {
  return (
    String(order.buyerName || "").trim() === "匿名配送" ||
    String(order.postalCode || "").trim() === "-" ||
    String(order.address || "").trim() === "-"
  );
}

function downloadClickPostCsv() {
  const headers = ["お届け先郵便番号", "お届け先氏名", "お届け先敬称", "お届け先住所1行目", "お届け先住所2行目", "お届け先住所3行目", "お届け先住所4行目", "内容品"];
  const targetOrders = filteredOrders().filter((order) => order.shipTarget);
  if (!targetOrders.length) {
    setNotice("クリックポストCSVの発送対象がありません", "error");
    return;
  }
  const anonymousOrders = targetOrders.filter((order) => isAnonymousShipment(order));
  const normalOrders = targetOrders.filter((order) => !isAnonymousShipment(order));
  const rows = normalOrders.map((order) => {
    const address = splitAddressForClickPost(order.address);
    return [
      formatClickPostPostalCode(order.postalCode),
      formatClickPostName(order.buyerName),
      "様",
      address[0],
      address[1],
      address[2],
      address[3],
      clickPostItemName(order.itemName),
    ];
  });
  if (!rows.length) {
    setNotice(`クリックポストCSV未出力: 発送対象${anonymousOrders.length}件はすべて匿名配送のため対象外です（匿名配送はクリックポスト対象外）`, "error");
    return;
  }
  const errors = validateClickPostRows(rows);
  if (errors.length) {
    setNotice(`クリックポストCSV未出力: ${errors.slice(0, 3).join(" / ")}${errors.length > 3 ? " ほか" : ""}`, "error");
    return;
  }
  const chunks = chunkRows(rows, 40);
  chunks.forEach((chunk, index) => {
    downloadRows("clickpost", headers, chunk, `クリックポストCSV ${index + 1}/${chunks.length}`, {
      encoding: "cp932",
      bom: false,
      fileSuffix: chunks.length > 1 ? `-${index + 1}` : "",
      quote: false,
    });
  });
  if (anonymousOrders.length) {
    setNotice(`クリックポストCSVを出力しました（${rows.length}件／匿名配送${anonymousOrders.length}件は対象外にしました）`, "success");
  }
}

function downloadSheetArchiveCsv() {
  const headers = sheetArchiveHeaders();
  const rows = sheetArchiveObjects().map((row) => headers.map((header) => row[header] || ""));
  downloadRows("shipping-archive-for-sheets", headers, rows, "保存用CSV");
}

async function syncToGoogleSheets() {
  setNotice("Sheets同期ボタンを押しました", "working");
  const url = (syncUrlInput.value || localStorage.getItem("shippingToolSyncUrl") || "").trim();
  if (!url) {
    syncStatus.value = "Apps Script URLを設定してください";
    setNotice("Apps Script URLを設定してください", "error");
    return;
  }
  const targetOrders = filteredOrders().filter((order) => {
    if (order.syncedAt) return false;
    return syncMode.value === "all" || order.shipTarget;
  });
  const rows = sheetArchiveObjects(targetOrders);
  if (!rows.length) {
    syncStatus.value = "未同期の対象がありません";
    setNotice("未同期の対象がありません", "error");
    return;
  }
  syncStatus.value = "同期中...";
  setNotice(`${rows.length}件をGoogle Sheetsへ同期中...`, "working");
  try {
    const result = await postToAppsScript(url, { rows });
    if (!result.ok) throw new Error(result.error || "同期に失敗しました");
    const syncedAt = new Date().toLocaleString("ja-JP");
    targetOrders.forEach((order) => {
      order.syncedAt = syncedAt;
    });
    saveOrders();
    syncStatus.value = `${result.inserted}件を同期しました`;
    setNotice(`${result.inserted}件をGoogle Sheetsへ同期しました`, "success");
    state.exportLogs.unshift({
      exportedAt: new Date().toLocaleString("ja-JP"),
      count: result.inserted,
      label: "Sheets同期",
    });
    state.exportLogs = state.exportLogs.slice(0, 5);
    saveExportLogs();
    render();
  } catch (error) {
    syncStatus.value = `失敗: ${error.message}`;
    setNotice(`同期失敗: ${error.message}`, "error");
  }
}

function saveSyncUrl() {
  const url = syncUrlInput.value.trim();
  localStorage.setItem("shippingToolSyncUrl", url);
  syncStatus.value = url ? "URL設定済み" : "未設定";
  setNotice(url ? "Apps Script URLを保存しました" : "Apps Script URLが空です", url ? "success" : "error");
}

function runSheetAction(action, label) {
  if (window.google?.script?.run) {
    syncStatus.value = `${label}中...`;
    setNotice(`${label}中...`, "working");
    window.google.script.run
      .withSuccessHandler((result) => {
        if (!result?.ok) {
          const message = result?.error || "処理に失敗しました";
          syncStatus.value = `失敗: ${message}`;
          setNotice(`処理失敗: ${message}`, "error");
          return;
        }
        syncStatus.value = result.message || `${label}しました`;
        setNotice(result.message || `${label}しました`, "success");
      })
      .withFailureHandler((error) => {
        const message = error?.message || String(error);
        syncStatus.value = `失敗: ${message}`;
        setNotice(`処理失敗: ${message}`, "error");
      })
      .runAction({ action });
    return;
  }

  const url = (syncUrlInput.value || localStorage.getItem("shippingToolSyncUrl") || "").trim();
  if (!url) {
    syncStatus.value = "Apps Script URLを設定してください";
    setNotice("Apps Script URLを設定してください", "error");
    return;
  }
  const separator = url.includes("?") ? "&" : "?";
  const actionUrl = `${url}${separator}action=${encodeURIComponent(action)}&t=${Date.now()}`;
  window.open(actionUrl, "_blank");
  syncStatus.value = `${label}を開きました`;
  setNotice(`${label}を開きました。完了画面が出たらシートを確認してください`, "success");
}

function setNotice(message, type = "") {
  if (!noticeBar) return;
  noticeBar.textContent = message;
  noticeBar.className = `notice ${type}`.trim();
  noticeBar.animate(
    [
      { transform: "translateY(-4px)", opacity: 0.75 },
      { transform: "translateY(0)", opacity: 1 },
    ],
    { duration: 180, easing: "ease-out" }
  );
}

async function readJsonResponse(response) {
  const text = await response.text();
  const trimmed = text.trim();
  if (trimmed.startsWith("<")) {
    const movedUrl = extractMovedUrl(trimmed);
    if (movedUrl) {
      const movedResponse = await fetch(movedUrl, { method: "GET", mode: "cors" });
      return readJsonResponse(movedResponse);
    }
    throw new Error("Apps ScriptからHTMLが返っています。WebアプリURLと再デプロイを確認してください。");
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`JSONとして読めません: ${text.slice(0, 120)}`);
  }
}

function postToAppsScript(url, payload) {
  if (window.google?.script?.run) {
    return new Promise((resolve, reject) => {
      window.google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler((error) => reject(new Error(error?.message || String(error))))
        .runAction(payload);
    });
  }
  return fetch(url, {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  }).then(readJsonResponse);
}

function extractMovedUrl(html) {
  const match = html.match(/href="([^"]+)"/i);
  if (!match) return "";
  const textarea = document.createElement("textarea");
  textarea.innerHTML = match[1];
  return textarea.value;
}

function openBaseAuth() {
  const url = getSyncUrl();
  if (!url) {
    baseStatus.value = "Save Apps Script URL first";
    setNotice("Save Apps Script URL first", "error");
    return;
  }
  localStorage.setItem("shippingToolBaseShopUrl", baseShopUrl.value.trim());
  localStorage.setItem("shippingToolBaseShopKey", baseShopKey.value);
  const separator = url.includes("?") ? "&" : "?";
  const authUrl = url + separator + "action=base_auth&shop=" + encodeURIComponent(baseShopKey.value) + "&t=" + Date.now();
  const popup = window.open(authUrl, "_blank", "noopener");
  if (!popup) {
    baseStatus.value = "Popup blocked. Opening BASE auth here.";
    setNotice("Popup blocked. Opening BASE auth here.", "working");
    window.location.href = authUrl;
    return;
  }
  baseStatus.value = "BASE auth opened";
  setNotice("BASE auth opened. If it does not open, allow popups.", "success");
}
async function fetchBaseOrders() {
  const url = getSyncUrl();
  if (!url) {
    baseStatus.value = "Apps Script URLを先に設定してください";
    setNotice("Apps Script URLを先に設定してください", "error");
    return;
  }
  localStorage.setItem("shippingToolBaseShopUrl", baseShopUrl.value.trim());
  localStorage.setItem("shippingToolBaseShopKey", baseShopKey.value);
  baseStatus.value = "取得中...";
  setNotice("BASE注文を取得中...", "success");
  try {
    const result = await postToAppsScript(url, {
      action: "base_orders",
      shop: baseShopKey.value,
      limit: 100,
      start_ordered: baseStartDate.value || "",
    });
    if (!result.ok) throw new Error(result.error || "BASE注文取得に失敗しました");
    const allOrders = (result.orders || []).map((order) => baseOrderToOrder(order, result.shop || baseShopKey.value));
    const orders = allOrders.filter((order) => order.shipTarget);
    orders.forEach(upsertOrder);
    state.files.push("BASE API");
    saveOrders();
    baseStatus.value = `${orders.length}件取得 / API ${allOrders.length}件`;
    setNotice(`BASE発送対象を${orders.length}件追加しました`, "success");
    render();
  } catch (error) {
    baseStatus.value = `失敗: ${error.message}`;
    setNotice(`BASE取得失敗: ${error.message}`, "error");
  }
}

function getSyncUrl() {
  return (syncUrlInput.value || localStorage.getItem("shippingToolSyncUrl") || "").trim();
}

function baseOrderToOrder(baseOrder, shopKey = "ilt") {
  const receiver = baseOrder.order_receiver || {};
  const buyerName = [receiver.last_name || baseOrder.last_name, receiver.first_name || baseOrder.first_name].filter(Boolean).join(" ");
  const address = [
    receiver.prefecture || baseOrder.prefecture,
    receiver.address || baseOrder.address,
    receiver.address2 || baseOrder.address2,
  ]
    .filter(Boolean)
    .join(" ");
  const items = Array.isArray(baseOrder.order_items) ? baseOrder.order_items : Array.isArray(baseOrder.items) ? baseOrder.items : [];
  const itemName = items
    .map((item) => {
      const optionText = Array.isArray(item.options)
        ? item.options.map((option) => `${option.option_name || ""}${option.option_value ? `: ${option.option_value}` : ""}`).filter(Boolean).join(" ")
        : "";
      return [item.title || item.item_name || item.name, item.variation, optionText].filter(Boolean).join(" ");
    })
    .filter(Boolean)
    .join(" / ");
  const sku = items
    .map((item) => item.variation_identifier || item.item_identifier || item.barcode)
    .filter(Boolean)
    .join(" / ");
  const quantity = items.reduce((sum, item) => sum + Number(item.amount || item.quantity || 1), 0) || 1;
  const shippingMethod =
    baseOrder.shipping_method ||
    (Array.isArray(baseOrder.shipping_lines) ? baseOrder.shipping_lines.map((line) => line.shipping_method).filter(Boolean).join(" / ") : "") ||
    items.map((item) => item.shipping_method).filter(Boolean).join(" / ");
  return {
    id: crypto.randomUUID(),
    source: shopKey === "iglight" ? "BASE(iglight)" : "BASE(ilt)",
    sellerAccount: shopKey === "iglight" ? "BASE iglight" : "BASE ilt",
    orderId: baseOrder.unique_key || baseOrder.order_id || `BASE-${Date.now()}`,
    orderedAt: baseOrder.ordered ? formatUnixTime(baseOrder.ordered) : "",
    status: baseOrder.dispatch_status || (baseOrder.dispatched ? "dispatched" : "ordered"),
    buyerName,
    postalCode: receiver.zip_code || baseOrder.zip_code || baseOrder.zip || baseOrder.postal_code || "",
    address,
    phone: receiver.tel || baseOrder.tel || baseOrder.phone || "",
    itemName,
    sku,
    quantity: String(quantity),
    shippingMethod,
    price: baseOrder.total ? `¥${baseOrder.total}` : "",
    profit: "",
    accountName: "",
    syncedAt: "",
    note: [baseOrder.remark, baseOrder.delivery_date ? `配送希望日 ${baseOrder.delivery_date}` : "", baseOrder.delivery_time_zone ? `時間帯 ${baseOrder.delivery_time_zone}` : ""].filter(Boolean).join(" / "),
    shipTarget: baseOrder.dispatch_status ? baseOrder.dispatch_status === "ordered" : !baseOrder.dispatched && !baseOrder.cancelled,
  };
}

function formatUnixTime(value) {
  const date = new Date(Number(value) * 1000);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("ja-JP");
}

async function fetchShopifyOrders() {
  const url = getSyncUrl();
  if (!url) {
    shopifyStatus.value = "Apps Script URLを先に設定してください";
    setNotice("Apps Script URLを先に設定してください", "error");
    return;
  }
  const domain = shopifyStoreDomain.value.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!domain) {
    shopifyStatus.value = "ストアドメインを入力してください";
    setNotice("Shopifyストアドメインを入力してください", "error");
    return;
  }
  localStorage.setItem("shippingToolShopifyStoreDomain", domain);
  shopifyStatus.value = "取得中...";
  setNotice("Shopify注文を取得中...", "success");
  try {
    const result = await postToAppsScript(url, {
      action: "shopify_orders",
      shop: "main",
      limit: 100,
      created_at_min: shopifyStartDate.value ? `${shopifyStartDate.value}T00:00:00+09:00` : "",
    });
    if (!result.ok) throw new Error(result.error || "Shopify注文取得に失敗しました");
    const allOrders = (result.orders || []).map((order) => shopifyOrderToOrder(order, domain));
    const orders = allOrders.filter((order) => order.shipTarget);
    orders.forEach(upsertOrder);
    state.files.push("Shopify API");
    saveOrders();
    shopifyStatus.value = `${orders.length}件取得 / API ${allOrders.length}件`;
    setNotice(`Shopify発送対象を${orders.length}件追加しました`, "success");
    render();
  } catch (error) {
    shopifyStatus.value = `失敗: ${error.message}`;
    setNotice(`Shopify取得失敗: ${error.message}`, "error");
  }
}

function shopifyOrderToOrder(shopifyOrder, domain) {
  const shipping = shopifyOrder.shipping_address || {};
  const lineItems = Array.isArray(shopifyOrder.line_items) ? shopifyOrder.line_items : [];
  const itemName = lineItems.map((item) => [item.title, item.variant_title].filter(Boolean).join(" ")).filter(Boolean).join(" / ");
  const sku = lineItems.map((item) => item.sku).filter(Boolean).join(" / ");
  const quantity = lineItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0) || 1;
  const shippingMethod = Array.isArray(shopifyOrder.shipping_lines)
    ? shopifyOrder.shipping_lines.map((line) => line.title || line.code).filter(Boolean).join(" / ")
    : "";
  const buyerName = [shipping.last_name, shipping.first_name].filter(Boolean).join(" ") || shopifyOrder.customer?.default_address?.name || "";
  const address = [shipping.province, shipping.city, shipping.address1, shipping.address2].filter(Boolean).join(" ");
  const fulfillmentStatus = shopifyOrder.fulfillment_status || "unfulfilled";
  return {
    id: crypto.randomUUID(),
    source: `Shopify(${domain})`,
    sellerAccount: "Shopify",
    orderId: shopifyOrder.name || String(shopifyOrder.id || `SHOPIFY-${Date.now()}`),
    orderedAt: shopifyOrder.created_at ? new Date(shopifyOrder.created_at).toLocaleString("ja-JP") : "",
    status: fulfillmentStatus,
    buyerName,
    postalCode: shipping.zip || "",
    address,
    phone: shipping.phone || shopifyOrder.phone || "",
    itemName,
    sku,
    quantity: String(quantity),
    shippingMethod,
    price: shopifyOrder.total_price ? `¥${shopifyOrder.total_price}` : "",
    profit: "",
    accountName: shopifyOrder.customer ? [shopifyOrder.customer.last_name, shopifyOrder.customer.first_name].filter(Boolean).join(" ") : "",
    syncedAt: "",
    note: shopifyOrder.note || "",
    shipTarget: !shopifyOrder.cancelled_at && (shopifyOrder.fulfillment_status === null || shopifyOrder.fulfillment_status === "partial" || fulfillmentStatus === "unfulfilled"),
  };
}

function sheetArchiveHeaders() {
  return [
    "保存日時",
    "発送対象",
    "販売サイト",
    "取引ID",
    "購入日時",
    "商品名",
    "カテゴリ",
    "数量",
    "商品代金",
    "販売利益",
    "配送方法",
    "氏名",
    "郵便番号",
    "住所",
    "電話番号",
    "アカウント名",
    "ステータス",
    "備考",
    "クレーム対応メモ",
    "対応状況",
    "発送日",
    "追跡番号",
    "販売アカウント",
    "商品コード1",
    "標準商品名1",
    "セット本数",
    "商品コード2",
    "標準商品名2",
    "商品コード3",
    "標準商品名3",
    "商品コード4",
    "標準商品名4",
    "商品コード5",
    "標準商品名5",
    "商品コード6",
    "標準商品名6",
    "送料",
    "販売手数料",
  ];
}

function sheetArchiveObjects(sourceOrders = filteredOrders()) {
  const savedAt = new Date().toLocaleString("ja-JP");
  return sourceOrders.map((order) => ({
    保存日時: savedAt,
    発送対象: order.shipTarget ? "対象" : "除外",
    販売サイト: order.source,
    取引ID: order.orderId,
    購入日時: order.orderedAt,
    商品名: order.itemName,
    カテゴリ: "",
    数量: order.quantity,
    商品代金: order.price,
    販売利益: order.profit,
    配送方法: order.shippingMethod,
    氏名: order.buyerName,
    郵便番号: order.postalCode,
    住所: order.address,
    電話番号: order.phone,
    アカウント名: order.accountName,
    ステータス: order.status,
    備考: order.note,
    クレーム対応メモ: "",
    対応状況: "未対応",
    発送日: "",
    追跡番号: "",
    販売アカウント: order.sellerAccount || "未指定",
    商品コード1: "",
    標準商品名1: "",
    セット本数: "",
    商品コード2: "",
    標準商品名2: "",
    商品コード3: "",
    標準商品名3: "",
    商品コード4: "",
    標準商品名4: "",
    商品コード5: "",
    標準商品名5: "",
    商品コード6: "",
    標準商品名6: "",
    送料: "",
    販売手数料: "",
  }));
}

function downloadRows(prefix, headers, rows, label, options = {}) {
  if (!rows.length) {
    setNotice(`${label}に出力するデータがありません`, "error");
    return;
  }
  setNotice(`${label}を作成中です...`, "working");
  const cell = options.quote === false ? csvCellPlain : csvCell;
  const csv = [headers, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
  const blob = createCsvBlob(csv, options);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${prefix}-${new Date().toISOString().slice(0, 10)}${options.fileSuffix || ""}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  state.exportLogs.unshift({
    exportedAt: new Date().toLocaleString("ja-JP"),
    count: rows.length,
    label,
  });
  state.exportLogs = state.exportLogs.slice(0, 5);
  saveExportLogs();
  render();
  setNotice(`${label}を出力しました（${rows.length}件）`, "success");
}

function chunkRows(rows, size) {
  const chunks = [];
  for (let i = 0; i < rows.length; i += size) chunks.push(rows.slice(i, i + size));
  return chunks;
}

function validateClickPostRows(rows) {
  const errors = [];
  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    if (!/^\d{7}$|^\d{3}-\d{4}$/.test(row[0])) errors.push(`${rowNumber}行目 郵便番号`);
    if (!row[1] || clickPostLength(row[1]) > 20) errors.push(`${rowNumber}行目 氏名`);
    if (!/^(様|御中)$/.test(row[2])) errors.push(`${rowNumber}行目 敬称`);
    if (!row.slice(3, 7).some(Boolean)) errors.push(`${rowNumber}行目 住所`);
    row.slice(3, 7).forEach((addressLine, lineIndex) => {
      if (clickPostLength(addressLine) > 20) errors.push(`${rowNumber}行目 住所${lineIndex + 1}`);
      // 住所に「?」が混ざったまま出力すると配達できない住所になる。
      // 取り込み元の文字化けや貼り付けミスが原因なので、黙って消さずに行番号を出して直してもらう
      // （「１？２？３」を単純削除すると「１２３」になり、丁目・番地が壊れるため）。
      if (/[?？]/.test(addressLine)) errors.push(`${rowNumber}行目 住所${lineIndex + 1}に「?」があります（住所を修正してください）`);
    });
    if (!row[7] || clickPostLength(row[7]) > 15) errors.push(`${rowNumber}行目 内容品`);
  });
  return errors;
}

function createCsvBlob(csv, options = {}) {
  if (options.encoding === "cp932" && window.Encoding) {
    const unicode = Array.from(csv).map((char) => char.charCodeAt(0));
    const sjis = window.Encoding.convert(unicode, { to: "SJIS", from: "UNICODE" });
    return new Blob([new Uint8Array(sjis)], { type: "text/csv;charset=shift_jis" });
  }
  if (options.encoding === "cp932") {
    setNotice("Shift-JIS変換の読み込みに失敗しました。画面をCtrl+F5で更新してください。", "error");
  }
  const parts = options.bom === false ? [csv] : ["\uFEFF", csv];
  return new Blob(parts, { type: "text/csv;charset=utf-8" });
}

function splitAddressForClickPost(value) {
  const compact = removeSjisUnsafeChars(toFullWidthClickPostText(value).replace(/\s+/g, " ").trim());
  const prefectures = "北海道|青森県|岩手県|宮城県|秋田県|山形県|福島県|茨城県|栃木県|群馬県|埼玉県|千葉県|東京都|神奈川県|新潟県|富山県|石川県|福井県|山梨県|長野県|岐阜県|静岡県|愛知県|三重県|滋賀県|京都府|大阪府|兵庫県|奈良県|和歌山県|鳥取県|島根県|岡山県|広島県|山口県|徳島県|香川県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県";
  const match = compact.match(new RegExp(`^(${prefectures})\\s*(.*)$`));
  const first = match ? match[1] : "";
  const rest = match ? match[2] : compact;
  const chunks = chunkTextByClickPostLength(rest, 20);
  const lines = [first, chunks[0] || "", chunks[1] || "", chunks.slice(2).join("")];
  return lines.map((part) => truncateClickPostText(part, 20));
}

function chunkTextByClickPostLength(text, maxLength) {
  const chunks = [];
  let current = "";
  Array.from(String(text || "")).forEach((char) => {
    if (clickPostLength(current + char) > maxLength) {
      chunks.push(current);
      current = char;
    } else {
      current += char;
    }
  });
  if (current) chunks.push(current);
  return chunks;
}

function clickPostItemName(itemName) {
  return truncateClickPostText("雑貨", 15);
}

function formatClickPostPostalCode(value) {
  const digits = String(value || "").replace(/[^\d]/g, "");
  if (digits.length === 7) return digits;
  return String(value || "").replace(/[^\d-]/g, "").slice(0, 8);
}

function formatClickPostName(value) {
  const name = toFullWidthClickPostText(value)
    .replace(/\s*(様|御中)\s*$/g, "")
    .replace(/[?？]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return truncateClickPostText(removeSjisUnsafeChars(name), 20);
}

function toFullWidthClickPostText(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[\uFE00-\uFE0F\u200B-\u200D\uDB40-\uDBFF][\uDC00-\uDFFF]?/g, "")
    .replace(/[\uD800-\uDFFF]/g, "")
    // 半角スペース(0x20)を対象に含めてはいけない。全角化は「+0xFEE0」で行うが、
    // 0x20+0xFEE0 は U+FF00 という未定義文字になり（全角スペースは U+3000 で別物）、
    // その結果 住所の区切りが「消える」か、Shift_JIS変換で「?」になっていた
    // （例: 大阪府守口市?東光町?2-19-1?マツイビル）。0x21〜0x7E だけを全角化する。
    .replace(/[!-~]/g, (char) => String.fromCharCode(char.charCodeAt(0) + 0xfee0))
    .replace(/　+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function removeSjisUnsafeChars(value) {
  if (!window.Encoding) return String(value || "");
  return Array.from(String(value || ""))
    .filter((char) => {
      const converted = window.Encoding.convert([char.charCodeAt(0)], { to: "SJIS", from: "UNICODE" });
      return converted.length && !(converted.length === 1 && converted[0] === 63 && char !== "?");
    })
    .join("");
}

function truncateClickPostText(value, maxLength) {
  let result = "";
  Array.from(String(value || "")).some((char) => {
    if (clickPostLength(result + char) > maxLength) return true;
    result += char;
    return false;
  });
  return result;
}

function clickPostLength(value) {
  return Array.from(String(value || "")).reduce((total, char) => total + (char.charCodeAt(0) <= 0x7f ? 0.5 : 1), 0);
}

function csvCell(value) {
  return `"${String(value || "").replace(/"/g, '""')}"`;
}

function csvCellPlain(value) {
  return String(value || "").replace(/[\r\n,]/g, " ").trim();
}

function loadSample() {
  const sample = `サービス,注文番号,購入日,ステータス,氏名,郵便番号,住所,電話番号,商品名,SKU,数量,配送方法,備考
メルカリ,M-1001,2026-07-23 09:12,支払い完了,山田 太郎,100-0001,東京都千代田区1-1,090-0000-0000,ギフトセット A,A-001,1,宅急便,午前中希望
ヤフオク,Y-8821,2026-07-23 08:45,未発送,佐藤 花子,150-0001,東京都渋谷区2-2,080-0000-0000,限定ボトル,B-210,2,ゆうパック,
BASE,B-4490,2026-07-22 18:03,発送済み,鈴木 一郎,530-0001,大阪府大阪市北区3-3,070-0000-0000,詰め替え用,C-011,1,ネコポス,`;
  state.orders.push(...rowsToOrders(parseCsv(sample), "other"));
  state.files.push("sample.csv");
  saveOrders();
  render();
}

function clearAll() {
  state.orders = [];
  state.files = [];
  saveOrders();
  render();
}

function clearSavedHistory() {
  state.orders = [];
  state.files = [];
  state.exportLogs = [];
  saveOrders();
  saveExportLogs();
  render();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

render();
