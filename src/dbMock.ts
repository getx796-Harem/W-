import { Category, Product, StockKey, Order, User, TopupRequest, RedeemCode } from "./types";
import { sendDiscordWebhook } from "./utils/discord";

// Initial seed data
const DEFAULT_TOPUP_REQUESTS: TopupRequest[] = [
  {
    id: "req-1",
    userId: "demo-buyer",
    username: "Guest#1337",
    method: "bank",
    amount: 500,
    slipUrl: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=300",
    transactionRef: "202606117942183",
    status: "approved",
    createdAt: Date.now() - 1000 * 60 * 60 * 3,
    approvedAt: Date.now() - 1000 * 60 * 50
  },
  {
    id: "req-2",
    userId: "demo-buyer",
    username: "Guest#1337",
    method: "truemoney",
    amount: 150,
    rawEnvelopeUrl: "https://gift.truemoney.com/campaign/?v=truemoneygift500k",
    status: "approved",
    createdAt: Date.now() - 1000 * 60 * 120,
    approvedAt: Date.now() - 1000 * 60 * 115
  }
];

const DEFAULT_REDEEM_CODES: RedeemCode[] = [
  {
    id: "code-1",
    code: "FREE50",
    type: "cash",
    value: 50,
    expiryDate: Date.now() + 1000 * 60 * 60 * 24 * 365, // 1 year
    usageLimit: 100,
    timesClaimed: 0,
    claimedBy: [],
    createdAt: Date.now()
  },
  {
    id: "code-2",
    code: "CYBER100",
    type: "cash",
    value: 100,
    expiryDate: Date.now() + 1000 * 60 * 60 * 24 * 365,
    usageLimit: 50,
    timesClaimed: 0,
    claimedBy: [],
    createdAt: Date.now()
  },
  {
    id: "code-3",
    code: "DISCOUNT10",
    type: "discount_percent",
    value: 10,
    expiryDate: Date.now() + 1000 * 60 * 60 * 24 * 365,
    usageLimit: 200,
    timesClaimed: 0,
    claimedBy: [],
    createdAt: Date.now()
  },
  {
    id: "code-4",
    code: "FLAT150",
    type: "discount_flat",
    value: 150,
    expiryDate: Date.now() + 1000 * 60 * 60 * 24 * 365,
    usageLimit: 30,
    timesClaimed: 0,
    claimedBy: [],
    createdAt: Date.now()
  }
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Subscriptions", icon: "Sparkles", slug: "subscriptions" },
  { id: "cat-2", name: "Steam & Games", icon: "Gamepad2", slug: "games" },
  { id: "cat-3", name: "Premium Accounts", icon: "UserCheck", slug: "accounts" },
  { id: "cat-4", name: "VPN & Utilities", icon: "Shield", slug: "utilities" },
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Discord Nitro (1 Month Boost)",
    description: "Upgrade your Discord profile, get 2 server boosts, higher video stream quality, custom emojis anywhere, and a massive upload size limit of up to 500MB! Auto-delivered instantly.",
    price: 149,
    imageUrl: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&q=80&w=400",
    categoryId: "cat-1",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
  },
  {
    id: "prod-2",
    name: "Steam Wallet $10 USD (Global Key)",
    description: "Get steam wallet codes added automatically. Safe, secure, and works on all regions after conversion to local currency. Use it to buy any games or in-game DLC.",
    price: 349,
    imageUrl: "https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?auto=format&fit=crop&q=80&w=400",
    categoryId: "cat-2",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
  {
    id: "prod-3",
    name: "Spotify Premium 1 Month (Voucher Key)",
    description: "1 Month of non-stop, ad-free music, fully offline play, high-quality audio downloads, and unlimited skips. Activate on any individual account.",
    price: 89,
    imageUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400",
    categoryId: "cat-1",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
  },
  {
    id: "prod-4",
    name: "Minecraft: Java & Bedrock Edition PC key",
    description: "Get the complete legendary builder game for PC. Includes both Java and Bedrock additions! Single product code redeemable on the official Microsoft store.",
    price: 790,
    imageUrl: "https://images.unsplash.com/photo-1605899435973-ca2d1a8861cf?auto=format&fit=crop&q=80&w=400",
    categoryId: "cat-2",
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
  },
  {
    id: "prod-5",
    name: "NordVPN Premium (1-Year Key)",
    description: "The gold standard of online privacy and speed. Secure up to 6 devices with high-speed military-grade encryption, malware protection, and adblock extensions.",
    price: 490,
    imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=400",
    categoryId: "cat-4",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
  },
];

const DEFAULT_STOCK_KEYS: StockKey[] = [
  // Discord Nitro keys
  { id: "key-1", productId: "prod-1", code: "https://discord.gift/NITRO-BOOST-E49G-A7Y2-L99X", isUsed: false },
  { id: "key-2", productId: "prod-1", code: "https://discord.gift/NITRO-BOOST-8QLX-FF22-Z9W0", isUsed: false },
  { id: "key-3", productId: "prod-1", code: "https://discord.gift/NITRO-BOOST-77G2-9PQL-W22X", isUsed: false },

  // Steam $10 Wallet keys
  { id: "key-4", productId: "prod-2", code: "STEAM-VAL-10USD-L9F8A-7D2H4-8G2PQ", isUsed: false },
  { id: "key-5", productId: "prod-2", code: "STEAM-VAL-10USD-B2H8S-K11P4-W38A9", isUsed: false },

  // Spotify keys
  { id: "key-6", productId: "prod-3", code: "SPOTIFY-PREM-1M-AA8G9HY8G24X912", isUsed: false },
  { id: "key-7", productId: "prod-3", code: "SPOTIFY-PREM-1M-KK82HFF920LQS11", isUsed: false },

  // Minecraft keys
  { id: "key-8", productId: "prod-4", code: "MCJB-PCKEY-99F2H-AA32K-HH392-XX884", isUsed: false },

  // NordVPN keys
  { id: "key-9", productId: "prod-5", code: "NORDVPN-1YR-PREM-X9L2F-S29G1-K00W4", isUsed: false },
];

const DEFAULT_ORDERS: Order[] = [
  {
    id: "ord-1",
    userId: "demo-user-1",
    username: "NoobGamer#9999",
    loginPlatform: "discord",
    productId: "prod-1",
    productName: "Discord Nitro (1 Month Boost)",
    price: 149,
    status: "completed",
    deliveredCode: "https://discord.gift/NITRO-BOOST-USED-DEMO-K9P1",
    createdAt: Date.now() - 1000 * 60 * 60 * 4, // 4 hours ago
  },
  {
    id: "ord-2",
    userId: "demo-user-2",
    username: "Jane Doe (Google)",
    loginPlatform: "google",
    productId: "prod-3",
    productName: "Spotify Premium 1 Month (Voucher Key)",
    price: 89,
    status: "completed",
    deliveredCode: "SPOTIFY-PREM-USED-DEMO-AA992",
    createdAt: Date.now() - 1000 * 60 * 60 * 18, // 18 hours ago
  }
];

// Helper to safely fetch from localStorage
function getStoreData<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(`cyber_store_${key}`);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

// Helper to save to localStorage
function saveStoreData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`cyber_store_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to write to localStorage for key", key, e);
  }
}

export const db = {
  getCategories(): Category[] {
    const data = getStoreData("categories", DEFAULT_CATEGORIES);
    // Double save to lock seed
    if (!localStorage.getItem("cyber_store_categories")) {
      saveStoreData("categories", DEFAULT_CATEGORIES);
    }
    return data;
  },

  saveCategories(categories: Category[]): void {
    saveStoreData("categories", categories);
  },

  getProducts(): Product[] {
    const data = getStoreData("products", DEFAULT_PRODUCTS);
    if (!localStorage.getItem("cyber_store_products")) {
      saveStoreData("products", DEFAULT_PRODUCTS);
    }
    return data;
  },

  saveProducts(products: Product[]): void {
    saveStoreData("products", products);
  },

  getStockKeys(): StockKey[] {
    const data = getStoreData("stock_keys", DEFAULT_STOCK_KEYS);
    if (!localStorage.getItem("cyber_store_stock_keys")) {
      saveStoreData("stock_keys", DEFAULT_STOCK_KEYS);
    }
    return data;
  },

  saveStockKeys(stockKeys: StockKey[]): void {
    saveStoreData("stock_keys", stockKeys);
  },

  getOrders(): Order[] {
    const data = getStoreData("orders", DEFAULT_ORDERS);
    if (!localStorage.getItem("cyber_store_orders")) {
      saveStoreData("orders", DEFAULT_ORDERS);
    }
    return data;
  },

  saveOrders(orders: Order[]): void {
    saveStoreData("orders", orders);
  },

  getUsers(): User[] {
    const DEFAULT_USERS: User[] = [
      {
        id: "demo-buyer",
        username: "Guest#1337",
        email: "guest@cybernet.xyz",
        avatarUrl: "",
        platform: "email",
        balance: 0,
        isAdmin: false
      }
    ];
    return getStoreData("users", DEFAULT_USERS);
  },

  saveUsers(users: User[]): void {
    saveStoreData("users", users);
  },

  getTopupRequests(): TopupRequest[] {
    const data = getStoreData("topup_requests", DEFAULT_TOPUP_REQUESTS);
    if (!localStorage.getItem("cyber_store_topup_requests")) {
      saveStoreData("topup_requests", DEFAULT_TOPUP_REQUESTS);
    }
    return data;
  },

  saveTopupRequests(requests: TopupRequest[]): void {
    saveStoreData("topup_requests", requests);
  },

  getRedeemCodes(): RedeemCode[] {
    const data = getStoreData("redeem_codes", DEFAULT_REDEEM_CODES);
    if (!localStorage.getItem("cyber_store_redeem_codes")) {
      saveStoreData("redeem_codes", DEFAULT_REDEEM_CODES);
    }
    return data;
  },

  saveRedeemCodes(codes: RedeemCode[]): void {
    saveStoreData("redeem_codes", codes);
  },

  redeemCode(
    userId: string,
    codeStr: string
  ): { success: boolean; error?: string; message?: string; amount?: number; codeObj?: RedeemCode } {
    const trimmed = codeStr.trim().toUpperCase();
    const codes = this.getRedeemCodes();
    const codeIndex = codes.findIndex((c) => c.code.toUpperCase() === trimmed);
    
    if (codeIndex === -1) {
      return { success: false, error: "ไม่พบรหัสโค้ดนี้ในระบบ กรุณาตรวจสอบและพิมพ์ใหม่อีกครั้ง" };
    }
    
    const code = codes[codeIndex];
    if (code.expiryDate < Date.now()) {
      return { success: false, error: "ขออภัย โค้ดรางวัล/ส่วนลดนี้หมดอายุการใช้งานแล้ว" };
    }
    
    if (code.timesClaimed >= code.usageLimit) {
      return { success: false, error: "ขออภัย โค้ดนี้ทำรายการเคลมสิทธิ์เต็มจำนวนโควตาแล้ว" };
    }
    
    if (code.claimedBy.includes(userId)) {
      return { success: false, error: "คุณเคยเปิดใช้งานและรับสิทธิ์จากโค้ดนี้ไปแล้วเรียบร้อย" };
    }
    
    if (code.type === "cash") {
      const users = this.getUsers();
      const userIdx = users.findIndex((u) => u.id === userId);
      if (userIdx === -1) {
        return { success: false, error: "ไม่พบข้อมูลผู้ใช้กรุณาเข้าสู่ระบบใหม่" };
      }
      
      users[userIdx].balance += code.value;
      this.saveUsers(users);
      
      code.timesClaimed += 1;
      code.claimedBy.push(userId);
      this.saveRedeemCodes(codes);
      
      sendDiscordWebhook({
        title: "🎁 มีการเคลมโค้ดเงินสดสำเร็จ! / Voucher Claimed",
        description: `ผู้ใช้ทำการเติมโค้ดเงินสดเข้าระบบสำเร็จและได้รับเครดิตทันที`,
        color: 16750848,
        fields: [
          { name: "ผู้ใช้ (User)", value: `\`${users[userIdx].username}\``, inline: true },
          { name: "โค้ดที่กรอก (Redeemed Code)", value: `\`${code.code}\``, inline: true },
          { name: "มูลค่าเติมเงิน (Value Added)", value: `**+${code.value} ฿**`, inline: true },
          { name: "สิทธิ์โค้ดล่าสุด (Usage)", value: `**${code.timesClaimed}/${code.usageLimit}**`, inline: true }
        ]
      }, "enableTopUp");
      
      return {
        success: true,
        message: `เติมเงินสำเร็จ! ได้รับเครดิตมูลค่า ${code.value} ฿ เรียบร้อยแล้ว`,
        amount: code.value,
        codeObj: code
      };
    } else {
      return {
        success: true,
        message: `พบคูปองส่วนลด "${code.code}" สามารถนําไปกรอกเพื่อรับสิทธิ์ส่วนลดตอนสั่งซื้อสินค้า!`,
        codeObj: code
      };
    }
  },

  // Interactive functions
  purchaseProduct(
    userId: string,
    productId: string,
    discountCodeStr?: string
  ): { success: boolean; error?: string; key?: string; order?: Order; finalPrice?: number } {
    const products = this.getProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) {
      return { success: false, error: "ไม่พบสินค้าดังกล่าวในระบบ" };
    }

    const users = this.getUsers();
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return { success: false, error: "ไม่พบข้อมูลผู้ใช้นี้กรุณาเข้าสู่ระบบใหม่" };
    }
    const user = users[userIndex];

    let finalPrice = product.price;
    let appliedDiscountObj: RedeemCode | null = null;
    const codes = this.getRedeemCodes();

    if (discountCodeStr && discountCodeStr.trim()) {
      const trimmedCode = discountCodeStr.trim().toUpperCase();
      const codeIndex = codes.findIndex((c) => c.code.toUpperCase() === trimmedCode);
      
      if (codeIndex === -1) {
        return { success: false, error: "ไม่พบคูปองส่วนลดที่ระบุ กรุณากรอกใหม่อีกครั้ง" };
      }

      const coupon = codes[codeIndex];
      if (coupon.type === "cash") {
        return { success: false, error: "โค้ดนี้เป็นโค้ดรางวัลเงินสด กรุณาเติมโดยตรงที่ปุ่ม 'เติมเงิน' ด้านบน" };
      }
      if (coupon.expiryDate < Date.now()) {
        return { success: false, error: "ขออภัย คูปองส่วนลดนี้หมดอายุลงแล้ว" };
      }
      if (coupon.timesClaimed >= coupon.usageLimit) {
        return { success: false, error: "ขออภัย สิทธิ์คูปองส่วนลดนี้เต็มจำนวนเรียบร้อยแล้ว" };
      }
      if (coupon.claimedBy.includes(userId)) {
        return { success: false, error: "คุณใช้คูปองส่วนลดรหัสนี้ไปแล้ว จำกัดเพียง 1 สิทธิ์ต่อผู้ใช้" };
      }

      appliedDiscountObj = coupon;
      if (coupon.type === "discount_percent") {
        const discountVal = Math.round(product.price * (coupon.value / 100));
        finalPrice = Math.max(0, product.price - discountVal);
      } else if (coupon.type === "discount_flat") {
        finalPrice = Math.max(0, product.price - coupon.value);
      }
    }

    if (user.balance < finalPrice) {
      return {
        success: false,
        error: `ยอดเงินคงเหลือของคุณไม่เพียงพอ (ต้องการทั้งหมด ${finalPrice} ฿ แต่คุณมีเพียง ${user.balance} ฿) กรุณาเติมเงินเข้าระบบก่อนชำระเงิน!`,
      };
    }

    // Find first available unused key for this product
    const stockKeys = this.getStockKeys();
    const availableKeyIndex = stockKeys.findIndex(
      (k) => k.productId === productId && !k.isUsed
    );

    if (availableKeyIndex === -1) {
      return {
        success: false,
        error: "สินค้าชิ้นนี้หมดสต็อกชั่วคราว! กรุณาตรวจสอบแท็บ Admin เพื่อเติมสินค้าลงในคลัง",
      };
    }

    const matchedKey = stockKeys[availableKeyIndex];
    const orderId = `ord-${Math.floor(100000 + Math.random() * 900000)}`;

    // Update keys state
    matchedKey.isUsed = true;
    matchedKey.usedAt = Date.now();
    matchedKey.orderId = orderId;
    this.saveStockKeys(stockKeys);

    // Update user balance
    user.balance -= finalPrice;
    this.saveUsers(users);

    // Lock coupon claim state for user
    if (appliedDiscountObj) {
      appliedDiscountObj.timesClaimed += 1;
      appliedDiscountObj.claimedBy.push(userId);
      this.saveRedeemCodes(codes);
    }

    // Create & prepend new order
    const newOrder: Order = {
      id: orderId,
      userId: user.id,
      username: user.username,
      loginPlatform: user.platform,
      productId: product.id,
      productName: product.name,
      price: finalPrice,
      status: "completed",
      deliveredCode: matchedKey.code,
      createdAt: Date.now(),
    };

    const orders = this.getOrders();
    orders.unshift(newOrder);
    this.saveOrders(orders);

    // Send Discord purchase notification
    sendDiscordWebhook({
      title: "🛍️ มีผู้ทำรายการสั่งซื้อสินค้าชิ้นใหม่! / New Order Placed",
      description: `รายการออเดอร์ใหม่ได้รับการจ่ายเงินและจัดส่งสิทธิคีย์เรียบร้อยแล้ว${appliedDiscountObj ? ` (ใช้โค้ดส่วนลด: ${appliedDiscountObj.code})` : ""}`,
      color: 6749425, // #66FCF1 Cyan
      fields: [
        { name: "ใบเสร็จหมายเลข (Order ID)", value: `\`${newOrder.id.toUpperCase()}\``, inline: true },
        { name: "ชื่อลูกค้าคนสั่งซื้อ (Buyer)", value: `\`${newOrder.username}\``, inline: true },
        { name: "เครือข่ายสิทธิ (Platform)", value: `\`${newOrder.loginPlatform.toUpperCase()}\``, inline: true },
        { name: "สินค้าที่ซื้อขาย (Product Item)", value: `**${newOrder.productName}**`, inline: false },
        { name: "ราคารวมชำระ (Price Paid)", value: `**${newOrder.price.toLocaleString()} ฿** ${appliedDiscountObj ? `*(ประหยัดไป ${(product.price - finalPrice).toLocaleString()} ฿)*` : ""}`, inline: true },
        { name: "รหัสคีย์จัดส่ง (Delivered Key)", value: `||${newOrder.deliveredCode}||` /* Hidden behind a Discord spoiler tag safely */, inline: false },
      ],
      thumbnailUrl: product.imageUrl || "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&q=80&w=400"
    }, "enablePurchase");

    return {
      success: true,
      key: matchedKey.code,
      order: newOrder,
      finalPrice: finalPrice
    };
  }
};
