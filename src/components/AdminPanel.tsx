import React, { useState, useEffect } from "react";
import { 
  X, 
  Plus, 
  Trash2, 
  Edit, 
  ShoppingBag, 
  Key, 
  FolderPlus, 
  Settings, 
  BarChart2, 
  RefreshCcw, 
  Layers, 
  Download,
  AlertTriangle,
  User,
  CheckCircle,
  FileSpreadsheet,
  Grid,
  Sparkles,
  Gamepad2,
  UserCheck,
  Shield,
  MessageSquare,
  Coins,
  Ticket
} from "lucide-react";
import { Category, Product, StockKey, Order, DiscordConfig } from "../types";
import { db } from "../dbMock";
import { 
  getDiscordConfig, 
  saveDiscordConfig, 
  sendTestWebhook, 
  sendDiscordWebhook 
} from "../utils/discord";

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockKeys, setStockKeys] = useState<StockKey[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Sub tab: "analytics", "categories", "products", "stock", "orders", "discord", "topups", "coupons"
  const [adminTab, setAdminTab] = useState<"analytics" | "categories" | "products" | "stock" | "orders" | "discord" | "topups" | "coupons">("analytics");

  // NEW ADMIN STATES
  const [topupRequests, setTopupRequests] = useState<any[]>([]);
  const [redeemCodes, setRedeemCodes] = useState<any[]>([]);

  // NEW REDEEM CODE FORM STATE
  const [newCodeVal, setNewCodeVal] = useState("");
  const [newCodeType, setNewCodeType] = useState<"cash" | "discount_percent" | "discount_flat">("cash");
  const [newCodeAmount, setNewCodeAmount] = useState<number>(300);
  const [newCodeExpiryStr, setNewCodeExpiryStr] = useState("2026-12-31");
  const [newCodeUsageLimit, setNewCodeUsageLimit] = useState<number>(99);

  // FORM STATES: Categories
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("Sparkles");
  const [customCatImageUrl, setCustomCatImageUrl] = useState("");
  
  // Discord Configurations State
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState("");
  const [discordWebhookRefillUrl, setDiscordWebhookRefillUrl] = useState("");
  const [discordWebhookSignupUrl, setDiscordWebhookSignupUrl] = useState("");
  const [discordWebhookPurchaseUrl, setDiscordWebhookPurchaseUrl] = useState("");
  const [discordWebhookTopUpUrl, setDiscordWebhookTopUpUrl] = useState("");
  const [discordEnableRefill, setDiscordEnableRefill] = useState(true);
  const [discordEnableSignup, setDiscordEnableSignup] = useState(true);
  const [discordEnablePurchase, setDiscordEnablePurchase] = useState(true);
  const [discordEnableTopUp, setDiscordEnableTopUp] = useState(true);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  
  // FORM STATES: Products
  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState<number | "">("");
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("");
  const [newProdImage, setNewProdImage] = useState("");

  // FORM STATES: Stock key refill
  const [refillProductId, setRefillProductId] = useState("");
  const [bulkCodesText, setBulkCodesText] = useState(""); // One code per line
  const [stockFilterProductId, setStockFilterProductId] = useState("all");

  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Sync backoffice lists
  const syncLocalData = () => {
    setCategories(db.getCategories());
    setProducts(db.getProducts());
    setStockKeys(db.getStockKeys());
    setOrders(db.getOrders());
    setTopupRequests(db.getTopupRequests());
    setRedeemCodes(db.getRedeemCodes());
  };

  useEffect(() => {
    syncLocalData();
    const disc = getDiscordConfig();
    setDiscordWebhookUrl(disc.webhookUrl || "");
    setDiscordWebhookRefillUrl(disc.webhookRefillUrl || "");
    setDiscordWebhookSignupUrl(disc.webhookSignupUrl || "");
    setDiscordWebhookPurchaseUrl(disc.webhookPurchaseUrl || "");
    setDiscordWebhookTopUpUrl(disc.webhookTopUpUrl || "");
    setDiscordEnableRefill(disc.enableRefill);
    setDiscordEnableSignup(disc.enableSignup);
    setDiscordEnablePurchase(disc.enablePurchase);
    setDiscordEnableTopUp(disc.enableTopUp);
  }, []);

  const handleSaveDiscordConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const config: DiscordConfig = {
      webhookUrl: discordWebhookUrl.trim(),
      webhookRefillUrl: discordWebhookRefillUrl.trim(),
      webhookSignupUrl: discordWebhookSignupUrl.trim(),
      webhookPurchaseUrl: discordWebhookPurchaseUrl.trim(),
      webhookTopUpUrl: discordWebhookTopUpUrl.trim(),
      enableRefill: discordEnableRefill,
      enableSignup: discordEnableSignup,
      enablePurchase: discordEnablePurchase,
      enableTopUp: discordEnableTopUp,
    };
    saveDiscordConfig(config);
    triggerToast("บันทึกการตั้งค่าระบบแจ้งเตือน Discord สำเร็จ!");
  };

  const handleTestDiscordWebhook = async (url: string, label: string) => {
    if (!url.trim()) {
      triggerToast(`กรุณาระบุ Webhook URL ของ "${label}" ก่อนทดสอบการเชื่อมต่อ`, "error");
      return;
    }
    setIsTestingWebhook(true);
    const success = await sendTestWebhook(url.trim());
    setIsTestingWebhook(false);
    if (success) {
      triggerToast(`ส่งข้อความทดสอบไปยังช่อง "${label}" สำเร็จแล้ว!`, "success");
    } else {
      triggerToast(`ระบบไม่สามารถเชื่อมต่อ Discord ในส่วน "${label}" ได้ กรุณาเช็กความถูกต้องของ URL`, "error");
    }
  };

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- ACTIONS: CATEGORIES ---
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const slug = newCatName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const finalIcon = newCatIcon === "CustomImage" ? customCatImageUrl.trim() : newCatIcon;
    const newCategory: Category = {
      id: `cat-${Math.floor(100 + Math.random() * 899)}`,
      name: newCatName.trim(),
      icon: finalIcon || "Sparkles",
      slug
    };

    const updated = [...categories, newCategory];
    db.saveCategories(updated);
    setCategories(updated);
    setNewCatName("");
    setCustomCatImageUrl("");
    triggerToast("เพิ่มหมวดหมู่สินค้าใหม่เสร็จสมบูรณ์!");
  };

  const handleDeleteCategory = (catId: string) => {
    if (confirm("คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่นี้? สินค้าภายในหมวดหมู่นี้จะไม่แสดงผลบนหน้าแรก")) {
      const updated = categories.filter(c => c.id !== catId);
      db.saveCategories(updated);
      setCategories(updated);
      triggerToast("ลบหมวดหมู่สินค้าเรียบร้อยแล้ว");
    }
  };

  // --- ACTIONS: PRODUCTS ---
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice || !newProdCategory) {
      triggerToast("กรุณากรอกข้อมูลสินค้าให้ถูกต้องและครบถ้วน", "error");
      return;
    }

    const defaultImages = [
      "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1605899435973-ca2d1a8861cf?auto=format&fit=crop&q=80&w=400"
    ];

    const randomImg = defaultImages[Math.floor(Math.random() * defaultImages.length)];

    const newProduct: Product = {
      id: `prod-${Math.floor(100 + Math.random() * 899)}`,
      name: newProdName.trim(),
      description: newProdDesc.trim() || "ไม่ระบุคำอธิบายสินค้า",
      price: Number(newProdPrice),
      imageUrl: newProdImage.trim() || randomImg,
      categoryId: newProdCategory,
      createdAt: Date.now()
    };

    const updated = [...products, newProduct];
    db.saveProducts(updated);
    setProducts(updated);

    // Reset forms
    setNewProdName("");
    setNewProdPrice("");
    setNewProdDesc("");
    setNewProdCategory("");
    setNewProdImage("");
    triggerToast("เพิ่มสินค้าชิ้นใหม่เข้าสู่ตารางร้านค้าเรียบร้อย!");
  };

  const handleDeleteProduct = (prodId: string) => {
    if (confirm("การยืนยันจะลบข้อมูลสินค้าชิ้นนี้ รวมถึงประวัติคีย์ที่มีอยู่?")) {
      const updatedProds = products.filter(p => p.id !== prodId);
      const updatedKeys = stockKeys.filter(k => k.productId !== prodId);
      
      db.saveProducts(updatedProds);
      db.saveStockKeys(updatedKeys);
      
      setProducts(updatedProds);
      setStockKeys(updatedKeys);
      triggerToast("ลบข้อมูลสินค้ายกล็อกเสร็จสิ้น");
    }
  };

  // --- ACTIONS: STOCK REFILL ---
  const handleRefillStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refillProductId) {
      triggerToast("กรุณาเลือกสินค้าที่ต้องการเติมคีย์", "error");
      return;
    }
    if (!bulkCodesText.trim()) {
      triggerToast("กรุณากรอกรหัสสิทธิ์/ซีเรียลคีย์อย่างน้อย 1 รายการ", "error");
      return;
    }

    const lines = bulkCodesText.split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      triggerToast("ไม่พบรหัสคีย์ที่สามารถใช้งานได้", "error");
      return;
    }

    const newStockKeys: StockKey[] = lines.map(code => ({
      id: `key-${Math.floor(100000 + Math.random() * 899999)}`,
      productId: refillProductId,
      code,
      isUsed: false
    }));

    const updated = [...stockKeys, ...newStockKeys];
    db.saveStockKeys(updated);
    setStockKeys(updated);

    // Trigger stock refill Discord message
    const matchedProduct = products.find(p => p.id === refillProductId);
    const prodName = matchedProduct ? matchedProduct.name : "ไม่ทราบชื่อสินค้า";
    const prodPrice = matchedProduct ? matchedProduct.price : 0;
    const prodImage = matchedProduct ? matchedProduct.imageUrl : "";

    sendDiscordWebhook({
      title: "🟢 เติมสต็อกสินค้าบาร์โค้ดใหม่เรียบร้อย! / Stock Refilled Successfully",
      description: `ผู้ดูแลระบบได้เพิ่มชุดคีย์ซีเรียลสิทธิ์ใหม่เข้าคลังสินค้าเรียบร้อยพร้อมจำหน่าย`,
      color: 3066993, // #2ECC71 Green
      fields: [
        { name: "สินค้าเป้าหมาย (Product)", value: `**${prodName}**`, inline: false },
        { name: "มูลค่าราคาต่อหน่วย (Unit Price)", value: `**${prodPrice.toLocaleString()} ฿**`, inline: true },
        { name: "จำนวนคีย์ที่เติม (Refilled Count)", value: `\`+${lines.length} คีย์\``, inline: true },
        { name: "สถานะพร้อมขาย (Status)", value: "`พร้อมจัดส่งออโต้ (Active)`", inline: true }
      ],
      thumbnailUrl: prodImage || "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&q=80&w=400"
    }, "enableRefill");

    setBulkCodesText("");
    triggerToast(`เติมสินค้าอัตโนมัติสำเร็จ ${lines.length} ลิเซนส์บาร์การันตี`);
  };

  const handleDeleteKey = (keyId: string) => {
    if (confirm("ยืนยันจะลบสิทธิ์คีย์รหัสนี้ออกจากสลอตระบบ?")) {
      const updated = stockKeys.filter(k => k.id !== keyId);
      db.saveStockKeys(updated);
      setStockKeys(updated);
      triggerToast("ลบคีย์เรียบร้อย");
    }
  };

  const handleResetToSeeds = () => {
    if (confirm("คุณแน่ใจว่าต้องการรีเซ็ตข้อมูลทั้งหมดกลับคืนสู่ค่าเริ่มต้นของระบบ?")) {
      localStorage.removeItem("cyber_store_categories");
      localStorage.removeItem("cyber_store_products");
      localStorage.removeItem("cyber_store_stock_keys");
      localStorage.removeItem("cyber_store_orders");
      localStorage.removeItem("cyber_store_users");
      syncLocalData();
      triggerToast("รีเซ็ตระบบสำเร็จ!");
    }
  };

  // --- ACTIONS: TOP-UP REQUESTS APPROVAL & REJECTIONS ---
  const handleApproveTopup = (requestId: string) => {
    const list = db.getTopupRequests();
    const reqIndex = list.findIndex(r => r.id === requestId);
    if (reqIndex === -1) {
      triggerToast("ไม่พบรายการแจ้งโอนเงินนี้", "error");
      return;
    }
    
    const req = list[reqIndex];
    if (req.status !== "pending") {
      triggerToast("รายการนี้ผ่านการดำเนินการเสร็จสิ้นไปแล้ว", "error");
      return;
    }

    // 1. Mark as approved
    req.status = "approved";
    db.saveTopupRequests(list);

    // 2. Add Balance to user account
    const users = db.getUsers();
    const targetUser = users.find(u => u.username === req.username);
    if (targetUser) {
      targetUser.balance += req.amount;
      db.saveUsers(users);
      
      // Discord top-up billing success webhook
      sendDiscordWebhook({
        title: "🔔 เติมเงินผ่านธนาคารสำเร็จ! (Bank Auto-Approved)",
        description: `ผู้ดูแลระบบได้ทำการอนุมัติสิทธิ์ยอดเงินสลิปความถูกต้องเรียบร้อยยอดเงินเครดิตเข้าไอดีผู้ใช้`,
        color: 3066993, // #2ECC71 Green
        fields: [
          { name: "ชื่อผู้ใช้ (Username)", value: `\`${req.username}\``, inline: true },
          { name: "จำนวนเงินที่เข้า (Credited)", value: `**+${req.amount.toLocaleString()} ฿**`, inline: true },
          { name: "รหัสอ้างอิงสลิป (Tx Ref ID)", value: `\`${req.transactionRef || "N/A"}\``, inline: false },
          { name: "สถานะยอดเงินบัญชี (Account Balance)", value: `**${targetUser.balance.toLocaleString()} ฿**`, inline: true }
        ],
        thumbnailUrl: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&q=80&w=400"
      }, "enableTopUp");

      triggerToast(`อนุมัติยอดโอน ${req.amount} บาท ให้ผู้ใช้ ${req.username} สำเร็จ!`);
    } else {
      triggerToast("ไม่พบบัญชีผู้ใช้เป้าหมายในการเติมยอดเครดิต", "error");
    }

    syncLocalData();
  };

  const handleRejectTopup = (requestId: string) => {
    const list = db.getTopupRequests();
    const reqIndex = list.findIndex(r => r.id === requestId);
    if (reqIndex === -1) {
      triggerToast("ไม่พบรายการที่จะปฏิเสธ", "error");
      return;
    }

    const req = list[reqIndex];
    if (req.status !== "pending") {
      triggerToast("รายการนี้ผ่านการอนุมัติหรือปฏิเสธไปแล้ว", "error");
      return;
    }

    // Mark as rejected
    req.status = "rejected";
    db.saveTopupRequests(list);
    triggerToast("ปฏิเสธคำโอนเงินนี้เรียบร้อยแล้ว", "error");
    syncLocalData();
  };

  // --- ACTIONS: REDEEM CODES CREATION & REMOVALS ---
  const handleCreateRedeemCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodeVal.trim()) {
      triggerToast("กรุณากรอกรหัสโค้ดที่ต้องการแจกจ่าย", "error");
      return;
    }

    const formattedCode = newCodeVal.trim().toUpperCase();
    const list = db.getRedeemCodes();
    
    if (list.some(c => c.code === formattedCode)) {
      triggerToast("พบโค้ดสิทธิ์ชื่อซ้ำในระบบเรียบร้อยแล้ว กรุณาใช้โค้ดอื่น", "error");
      return;
    }

    const newCode = {
      id: "rc_" + Date.now(),
      code: formattedCode,
      type: newCodeType,
      value: newCodeAmount,
      expiryDate: newCodeExpiryStr,
      usageLimit: newCodeUsageLimit,
      timesClaimed: 0,
      claimedBy: [],
      createdAt: Date.now()
    };

    const updated = [...list, newCode];
    db.saveRedeemCodes(updated);
    setRedeemCodes(updated);
    setNewCodeVal("");
    triggerToast(`จัดสร้างรหัสรางวัล ${formattedCode} เรียบร้อยแล้ว!`);
    syncLocalData();
  };

  const handleDeleteRedeemCode = (codeStr: string) => {
    if (confirm(`ยืนยันการทำลายและลบโค้ด ${codeStr}? ผู้ใช้จะไม่สามารถกดเคลมรับสิทธิ์จากโค้ดนี้ได้อีกต่อไป`)) {
      const list = db.getRedeemCodes();
      const updated = list.filter(c => c.code !== codeStr);
      db.saveRedeemCodes(updated);
      setRedeemCodes(updated);
      triggerToast(`ทำลายโค้ด ${codeStr} เรียบร้อยแล้ว`);
      syncLocalData();
    }
  };

  // --- ANALYTICS calculations ---
  const totalSalesVal = orders.reduce((acc, current) => acc + current.price, 0);
  const totalCompletedOrders = orders.length;
  
  const productsWithStockStates = products.map(p => {
    const totalInStock = stockKeys.filter(k => k.productId === p.id && !k.isUsed).length;
    return {
      ...p,
      stockCount: totalInStock
    };
  });

  const lowStockProds = productsWithStockStates.filter(p => p.stockCount === 0);

  return (
    <div className="fixed inset-0 z-40 bg-[#0B0C10] flex flex-col md:flex-row font-sans text-[#C5C6C7]">
      
      {/* Toast alert */}
      {notification && (
        <div id="admin-panel-toast" className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl border text-xs font-mono font-bold shadow-lg flex items-center gap-2 ${
          notification.type === "success" 
            ? "bg-[#11141a]/95 border-[#45A29E]/30 text-[#66FCF1]" 
            : "bg-rose-950/90 border-rose-500/30 text-rose-300"
        }`}>
          <span>{notification.type === "success" ? "✓" : "⚡"}</span>
          {notification.message}
        </div>
      )}

      {/* Sidebar navigation */}
      <aside id="admin-panel-sidebar" className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#45A29E]/25 bg-[#11141a]/90 backdrop-blur-md md:flex flex-col p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#66FCF1] animate-spin" />
            <span className="text-white font-mono font-bold text-sm tracking-widest uppercase">BACKOFFICE</span>
          </div>

          <button 
            id="admin-close-btn-mobile"
            onClick={onClose}
            className="md:hidden text-[#C5C6C7] hover:text-[#66FCF1] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-1.5 pb-2 md:pb-0 scrollbar-none font-mono text-xs">
          <button
            id="tab-btn-analytics"
            onClick={() => setAdminTab("analytics")}
            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              adminTab === "analytics" 
                ? "bg-[#1F2833] text-[#66FCF1] border border-[#66FCF1]/15 shadow-sm" 
                : "hover:bg-[#1E2732]/40 text-[#C5C6C7] hover:text-[#66FCF1]"
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            วิเคราะห์ข้อมูล / Stats
          </button>

          <button
            id="tab-btn-categories"
            onClick={() => setAdminTab("categories")}
            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              adminTab === "categories" 
                ? "bg-[#1F2833] text-[#66FCF1] border border-[#66FCF1]/15 shadow-sm" 
                : "hover:bg-[#1E2732]/40 text-[#C5C6C7] hover:text-[#66FCF1]"
            }`}
          >
            <Layers className="w-4 h-4" />
            เพิ่ม/จัดการหมวดหมู่
          </button>

          <button
            id="tab-btn-products"
            onClick={() => setAdminTab("products")}
            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              adminTab === "products" 
                ? "bg-[#1F2833] text-[#66FCF1] border border-[#66FCF1]/15 shadow-sm" 
                : "hover:bg-[#1E2732]/40 text-[#C5C6C7] hover:text-[#66FCF1]"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            เพิ่ม/จัดการสินค้า
          </button>

          <button
            id="tab-btn-stock"
            onClick={() => setAdminTab("stock")}
            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              adminTab === "stock" 
                ? "bg-[#1F2833] text-[#66FCF1] border border-[#66FCF1]/15 shadow-sm" 
                : "hover:bg-[#1E2732]/40 text-[#C5C6C7] hover:text-[#66FCF1]"
            }`}
          >
            <Key className="w-4 h-4 animate-bounce" />
            เติมสินค้า (คลังคีย์)
          </button>

          <button
            id="tab-btn-orders"
            onClick={() => setAdminTab("orders")}
            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              adminTab === "orders" 
                ? "bg-[#1F2833] text-[#66FCF1] border border-[#66FCF1]/15 shadow-sm" 
                : "hover:bg-[#1E2732]/40 text-[#C5C6C7] hover:text-[#66FCF1]"
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            รายการออเดอร์ ({orders.length})
          </button>

          <button
            id="tab-btn-discord"
            onClick={() => setAdminTab("discord")}
            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              adminTab === "discord" 
                ? "bg-[#1F2833] text-[#66FCF1] border border-[#66FCF1]/15 shadow-sm" 
                : "hover:bg-[#1E2732]/40 text-[#C5C6C7] hover:text-[#66FCF1]"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            ตั้งค่าแจ้งเตือน Discord
          </button>

          <button
            id="tab-btn-topups"
            onClick={() => setAdminTab("topups")}
            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer relative ${
              adminTab === "topups" 
                ? "bg-[#1F2833] text-[#66FCF1] border border-[#66FCF1]/15 shadow-sm" 
                : "hover:bg-[#1E2732]/40 text-[#C5C6C7] hover:text-[#66FCF1]"
            }`}
          >
            <Coins className="w-4 h-4" />
            อนุมัติเงินโอนธนาคาร
            {topupRequests.filter(r => r.status === "pending").length > 0 && (
              <span className="absolute right-3 bg-rose-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full animate-bounce">
                {topupRequests.filter(r => r.status === "pending").length}
              </span>
            )}
          </button>

          <button
            id="tab-btn-coupons"
            onClick={() => setAdminTab("coupons")}
            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              adminTab === "coupons" 
                ? "bg-[#1F2833] text-[#66FCF1] border border-[#66FCF1]/15 shadow-sm" 
                : "hover:bg-[#1E2732]/40 text-[#C5C6C7] hover:text-[#66FCF1]"
            }`}
          >
            <Ticket className="w-4 h-4" />
            โค้ดส่วนลด & โค้ดฟรี
          </button>
        </nav>

        <div className="mt-auto pt-4 border-t border-[#45A29E]/20 space-y-3 font-mono text-[10px]">
          <button
            id="admin-reset-btn"
            onClick={handleResetToSeeds}
            className="w-full bg-[#0B0C10] hover:bg-rose-950/20 text-rose-500 hover:text-rose-400 border border-[#45A29E]/10 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCcw className="w-3 h-3" />
            รีเซ็ตโครงสร้างคลัง
          </button>

          <button
            id="admin-exit-btn"
            onClick={onClose}
            className="w-full bg-white hover:bg-zinc-100 text-[#0B0C10] font-bold py-2.5 rounded-lg transition-all text-center cursor-pointer block"
          >
            กลับสู่ร้านค้า / Exit Admin
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main id="admin-panel-main" className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-[#0B0C10]">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#45A29E]/20 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">
              {adminTab === "analytics" && "สถิติร้านค้าภาพรวม • Analytics"}
              {adminTab === "categories" && "จัดการหมวดหมู่สินค้า • Category Hub"}
              {adminTab === "products" && "เพิ่มและลบรายการค้าขาย • Stores Catalog"}
              {adminTab === "stock" && "เพิ่มและจัดการคลังอัตโนมัติ • Cyber Stock Keys"}
              {adminTab === "orders" && "ประวัติจัดส่งและออเดอร์ทั้งหมด • Sales Ledger"}
              {adminTab === "discord" && "เชื่อมต่อระบบแจ้งเตือน Discord Webhook"}
              {adminTab === "topups" && "อนุมัติรายการสลิปเครดิตธนาคาร • Bank Slip Verifier"}
              {adminTab === "coupons" && "คูปองส่วนลดและโค้ดของรางวัลฟรี • Vouchers Engine"}
            </h1>
            <p className="text-xs text-[#C5C6C7]/80 font-light mt-1 font-sans">
              {adminTab === "analytics" && "รายงานรายได้จากการขาย ลิเซนส์ที่เปิดใช้งาน และคำเตือนสต็อกหมดคลัง"}
              {adminTab === "categories" && "ใช้สำหรับแอดชื่อกลุ่มหมวดหมู่แยกกลุ่ม เพื่อความสะดวกเป็นสัดส่วนแก่นักช้อป"}
              {adminTab === "products" && "ควบคุมราคาสินค้า, เชื่อมเข้ากับหมวดหมู่ และกำหนดรูปภาพประกอบสำหรับแสดงผล"}
              {adminTab === "stock" && "หัวใจสำคัญ: เติมชุดลิเซนส์ (ซีเรียลคีย์-โค้ด) เพื่อให้ระบบทำการถอนจ่ายลูกค้าทันทีเมื่อมีรายการซื้อ"}
              {adminTab === "orders" && "ตรวจเช็กรายชื่อ รหัสที่ส่งออก สถานะจัดจัดสรร โดยมีระบบบันทึกความโปร่งใสตรวจย้อนกลับ"}
              {adminTab === "discord" && "ส่งข้อมูลการสมัครสมาชิก, การซื้อสินค้าคีย์ซีเรียลสำเร็จ, และการเติมสินค้า/เครดิตเงินสด เข้ากับแชลแนล Discord อัตโนมัติ"}
              {adminTab === "topups" && "ตรวจสอบหลักฐานสลิปเงินโอนของลูกค้า และคลิกอนุมัติยอดเงินสดเติมเข้าไอดีให้โดยตรง"}
              {adminTab === "coupons" && "กำหนดโค้ดส่วนลดราคาอัตราร้อยละ (Percent), จำนวนบาทโดยตรง (Flat), หรือบัตรเงินสมนาคุณฟรี (Claimable Cash Gift Card)"}
            </p>
          </div>

          <button 
            id="admin-exit-btn-desktop"
            onClick={onClose}
            className="hidden md:flex bg-[#1F2833] hover:bg-[#11141a] border border-[#45A29E]/25 px-4 py-2 rounded-xl text-xs font-mono text-[#C5C6C7] tracking-tight items-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
            ออกจากระบบ / Exit Panel
          </button>
        </div>

        {/* --------------------- TAB: ANALYTICS --------------------- */}
        {adminTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 font-mono">
              <div className="bg-[#11141a] border border-[#45A29E]/20 p-5 rounded-2xl space-y-2 shadow-inner">
                <p className="text-[10px] text-[#45A29E] font-semibold tracking-wider">TOTAL SALES REVENUE</p>
                <p className="text-[#66FCF1] font-bold text-3xl tracking-tight">
                  {totalSalesVal.toLocaleString()} <span className="text-sm font-normal text-white">฿</span>
                </p>
                <p className="text-[9px] text-[#C5C6C7]/60">หักต้นทุนจัดส่งอัตโนมัติแล้ว 100%</p>
              </div>

              <div className="bg-[#11141a] border border-[#45A29E]/20 p-5 rounded-2xl space-y-2 shadow-inner">
                <p className="text-[10px] text-[#45A29E] font-semibold tracking-wider">TOTAL COMPLETE ORDERS</p>
                <p className="text-[#66FCF1] font-bold text-3xl tracking-tight">
                  {totalCompletedOrders.toLocaleString()} <span className="text-sm font-normal text-white">รายการ</span>
                </p>
                <p className="text-[9px] text-[#C5C6C7]/60">คีย์จัดส่งอัตโนมัติไปยังประวัติของลูกค้า</p>
              </div>

              <div className="bg-[#11141a] border border-[#45A29E]/20 p-5 rounded-2xl space-y-2 shadow-inner">
                <p className="text-[10px] text-[#45A29E] font-semibold tracking-wider">INVENTORY CODES IN POOL</p>
                <p className="text-white font-bold text-3xl tracking-tight font-display">
                  {stockKeys.length.toLocaleString()} <span className="text-sm font-normal text-[#C5C6C7]">รหัสคีย์</span>
                </p>
                <p className="text-[10px] text-[#C5C6C7]/60">
                  คงเหลือพร้อมส่ง: {stockKeys.filter(k => !k.isUsed).length} คีย์
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#11141a] border border-[#45A29E]/20 rounded-2xl p-6 space-y-4 shadow-inner">
                <h3 className="text-sm font-bold text-[#C5C6C7] font-mono tracking-widest uppercase flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-450 animate-bounce" />
                  รายชื่อสินค้าใกล้หมดสต็อก / LOW STOCK WRITING
                </h3>

                {lowStockProds.length === 0 ? (
                  <div className="py-12 text-center text-[#C5C6C7]/50 text-xs font-mono border border-[#45A29E]/10 border-dashed rounded-xl">
                    ✓ ทุกอย่างอยู่ในเกณฑ์ดี! มีคีย์สำรองพร้อมขายครบในทุกหมวดหมู่
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {lowStockProds.map(p => (
                      <div 
                        key={p.id}
                        className="bg-[#1F2833]/50 border border-[#45A29E]/15 p-3 rounded-xl flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <p className="text-white font-semibold text-xs">{p.name}</p>
                          <p className="text-[9px] font-mono text-[#45A29E]">
                            หมวดหมู่: {categories.find(c => c.id === p.categoryId)?.name || "ทั่วไป"}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-mono bg-rose-500/10 text-rose-450 border border-rose-500/20 px-2 py-0.5 rounded font-bold">
                            คีย์เหลือ 0 ด่วน!
                          </span>
                          <button
                            onClick={() => {
                              setRefillProductId(p.id);
                              setAdminTab("stock");
                            }}
                            className="block text-[11px] font-mono text-[#66FCF1] hover:underline mt-1 cursor-pointer"
                          >
                            เติมคีย์ / Refill →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-[#11141a] border border-[#45A29E]/20 rounded-2xl p-6 space-y-4 font-mono shadow-inner">
                <h3 className="text-sm font-bold text-[#C5C6C7] tracking-widest uppercase flex items-center gap-2">
                  <Grid className="w-4 h-4 text-[#66FCF1]" />
                  สัดส่วนสต็อกสินค้าคงเหลือภาพรวม / STOCK DISTRIBUTIONS
                </h3>

                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {productsWithStockStates.map(p => (
                    <div key={p.id} className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-[#C5C6C7]/80">
                        <span className="text-white font-medium truncate max-w-sm">{p.name}</span>
                        <span className="text-[#66FCF1]">{p.stockCount} ชิ้นพร้อมส่ง</span>
                      </div>
                      
                      <div className="w-full bg-[#0B0C10] h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            p.stockCount === 0 ? "bg-rose-500" : p.stockCount < 2 ? "bg-yellow-500" : "bg-[#66FCF1] shadow-[0_0_8px_#66FCF1]"
                          }`}
                          style={{ width: `${Math.min(100, (p.stockCount / 5) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --------------------- TAB: CATEGORIES --------------------- */}
        {adminTab === "categories" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-[#11141a] border border-[#45A29E]/20 rounded-2xl p-6 h-fit space-y-5 shadow-inner">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 font-display">
                <FolderPlus className="w-5 h-5 text-[#66FCF1]" />
                เพิ่มหมวดหมู่สินค้าใหม่
              </h3>

              <form onSubmit={handleAddCategory} className="space-y-4 font-mono text-xs">
                <div className="space-y-1.5">
                  <label className="text-[#C5C6C7] text-[11px] font-semibold">ชื่อหมวดหมู่:</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น Steam Wallet Cards, Discord Nitro"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full bg-[#0B0C10] border border-[#45A29E]/20 rounded-xl py-3 px-4 focus:outline-none focus:border-[#66FCF1]/50 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#C5C6C7] text-[11px] font-semibold">ตัวเลือกไอคอน / ICON LABEL:</label>
                  <select
                    value={newCatIcon}
                    onChange={(e) => {
                      setNewCatIcon(e.target.value);
                      if (e.target.value !== "CustomImage") {
                        setCustomCatImageUrl("");
                      }
                    }}
                    className="w-full bg-[#0B0C10] border border-[#45A29E]/20 rounded-xl py-3 px-4 focus:outline-none focus:border-[#66FCF1]/50 text-white cursor-pointer"
                  >
                    <option value="Sparkles" className="bg-[#11141a]">Sparkles</option>
                    <option value="Gamepad2" className="bg-[#11141a]">Gamepad2</option>
                    <option value="UserCheck" className="bg-[#11141a]">UserCheck</option>
                    <option value="Shield" className="bg-[#11141a]">Shield</option>
                    <option value="CustomImage" className="bg-[#11141a]">Custom Image URL</option>
                  </select>
                </div>

                {newCatIcon === "CustomImage" && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-[#66FCF1] text-[11px] font-semibold">ป้อนลิงก์รูปภาพไอคอน (URL):</label>
                    <input
                      type="url"
                      required
                      placeholder="https://example.com/icon.png"
                      value={customCatImageUrl}
                      onChange={(e) => setCustomCatImageUrl(e.target.value)}
                      className="w-full bg-[#0B0C10] border border-[#66FCF1]/30 rounded-xl py-3 px-4 focus:outline-none focus:border-[#66FCF1] text-white"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#66FCF1] hover:bg-[#45A29E] text-[#0B0C10] font-bold py-3.5 rounded-xl cursor-pointer transition-colors"
                >
                  แอดหมวดหมู่ / Save Category
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-[#11141a] border border-[#45A29E]/20 rounded-2xl p-6 space-y-4 shadow-inner">
              <h3 className="text-lg font-bold text-white tracking-tight font-display">รายชื่อหมวดหมู่ตั้งต้นในระบบ</h3>

              <div className="space-y-2.5">
                {categories.map(c => (
                  <div 
                    key={c.id}
                    className="border border-[#45A29E]/15 bg-[#1F2833]/30 p-4 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#0B0C10] border border-[#45A29E]/20 flex items-center justify-center text-[#66FCF1] shadow-inner overflow-hidden">
                        {c.icon && (c.icon.startsWith("http://") || c.icon.startsWith("https://") || c.icon.startsWith("data:image/")) ? (
                          <img src={c.icon} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="font-mono text-xs">
                            {c.icon === "Sparkles" && <Sparkles className="w-4 h-4" />}
                            {c.icon === "Gamepad2" && <Gamepad2 className="w-4 h-4" />}
                            {c.icon === "UserCheck" && <UserCheck className="w-4 h-4" />}
                            {c.icon === "Shield" && <Shield className="w-4 h-4" />}
                          </span>
                        )}
                      </div>

                      <div>
                        <p className="text-white font-semibold text-sm">{c.name}</p>
                        <p className="text-[10px] font-mono text-[#C5C6C7]/50">ID: {c.id} • Slug: /{c.slug}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteCategory(c.id)}
                      className="p-2 border border-[#45A29E]/15 hover:bg-rose-950/20 text-rose-500 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                      title="ลบหมวดหมู่"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --------------------- TAB: PRODUCTS --------------------- */}
        {adminTab === "products" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-[#11141a] border border-[#45A29E]/20 rounded-2xl p-6 h-fit space-y-5 shadow-inner">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 font-display">
                <FolderPlus className="w-5 h-5 text-[#66FCF1]" />
                เพิ่มสินค้าใหม่ลงร้านค้า
              </h3>

              <form onSubmit={handleAddProduct} className="space-y-4 font-mono text-xs">
                <div className="space-y-1.5">
                  <label className="text-[#C5C6C7] text-[11px] font-semibold">ชื่อสินค้า:</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น Garena Shells 150 บาท"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    className="w-full bg-[#0B0C10] border border-[#45A29E]/20 rounded-xl py-3 px-4 focus:outline-none focus:border-[#66FCF1]/50 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[#C5C6C7] text-[11px] font-semibold">ราคา (บาท):</label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="150"
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-[#0B0C10] border border-[#45A29E]/20 rounded-xl py-3 px-4 focus:outline-none focus:border-[#66FCF1]/50 text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[#C5C6C7] text-[11px] font-semibold">หมวดหมู่สินค้า:</label>
                    <select
                      required
                      value={newProdCategory}
                      onChange={(e) => setNewProdCategory(e.target.value)}
                      className="w-full bg-[#0B0C10] border border-[#45A29E]/20 rounded-xl py-3 px-4 focus:outline-none focus:border-[#66FCF1]/50 text-white cursor-pointer"
                    >
                      <option value="" className="bg-[#11141a]">เลือกหมวดหมู่</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id} className="bg-[#11141a]">{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#C5C6C7] text-[11px] font-semibold">ลิงก์รูปภาพประกอบ (หรือปล่อยว่างเป็นเสาสุ่ม):</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={newProdImage}
                    onChange={(e) => setNewProdImage(e.target.value)}
                    className="w-full bg-[#0B0C10] border border-[#45A29E]/20 rounded-xl py-3 px-4 focus:outline-none focus:border-[#66FCF1]/50 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#C5C6C7] text-[11px] font-semibold">คำอธิบายสินค้าอย่างย่อ:</label>
                  <textarea
                    placeholder="บัตรเติมเกม ของแท้ 100% บริการซัพพอร์ตตลอด 24 ชม."
                    rows={3}
                    value={newProdDesc}
                    onChange={(e) => setNewProdDesc(e.target.value)}
                    className="w-full bg-[#0B0C10] border border-[#45A29E]/20 rounded-xl py-2.5 px-4 focus:outline-none focus:border-[#66FCF1]/50 text-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#66FCF1] hover:bg-[#45A29E] text-[#0B0C10] font-bold py-3.5 rounded-xl cursor-pointer transition-colors"
                >
                  แอดสินค้า / Save Product
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-[#11141a] border border-[#45A29E]/20 rounded-2xl p-6 space-y-4 shadow-inner">
              <h3 className="text-lg font-bold text-white tracking-tight font-display">รายชื่อสินค้าภายในร้านทั้งหมด</h3>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {products.length === 0 ? (
                  <div className="py-20 text-center text-[#C5C6C7]/50 font-mono text-xs border border-[#45A29E]/10 border-dashed rounded-2xl">
                    ไม่พบสินค้า แนะนำให้แอดสินค้าเพื่อสร้างสต็อกจัดสรรคีย์ขาย
                  </div>
                ) : (
                  products.map(p => {
                    const matchedCat = categories.find(c => c.id === p.categoryId);
                    const stockCount = stockKeys.filter(k => k.productId === p.id && !k.isUsed).length;
                    return (
                      <div 
                        key={p.id}
                        className="border border-[#45A29E]/15 bg-[#1F2833]/30 p-4 rounded-xl flex items-center justify-between gap-4 font-sans animate-fadeIn"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <img 
                            src={p.imageUrl} 
                            alt={p.name} 
                            className="w-12 h-12 rounded-lg object-cover border border-[#45A29E]/20 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-semibold text-sm truncate">{p.name}</p>
                            <p className="text-[10px] text-[#C5C6C7]/55 mt-0.5">
                              หมวดหมู่: <span className="text-[#66FCF1] font-medium">{matchedCat ? matchedCat.name : "ทั่วไป"}</span> • ราคา: <span className="text-white font-bold">{p.price.toLocaleString()} ฿</span>
                            </p>
                            <p className="text-[10px] text-[#C5C6C7]/70 truncate mt-1">{p.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              stockCount > 0 
                                ? "bg-emerald-950/30 text-emerald-400 border border-emerald-950/20" 
                                : "bg-rose-950/30 text-rose-400 border border-rose-950/20"
                            }`}>
                              พร้อมขาย: {stockCount} คีย์
                            </span>
                          </div>
                          
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-2 border border-[#45A29E]/15 hover:bg-rose-950/20 text-rose-500 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                            title="ลบสินค้า"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* --------------------- TAB: STOCK --------------------- */}
        {adminTab === "stock" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            <div className="bg-[#11141a] border border-[#45A29E]/20 rounded-2xl p-6 h-fit space-y-5 shadow-inner">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 font-display">
                <Key className="w-5 h-5 text-[#66FCF1]" />
                เพิ่มคีย์สินค้าคงคลัง (Bulk Refill)
              </h3>

              <form onSubmit={handleRefillStock} className="space-y-4 font-mono text-xs">
                <div className="space-y-1.5 font-sans">
                  <label className="text-[#C5C6C7] text-[11px] font-semibold">เลือกสินค้าที่จะเติมคีย์:</label>
                  <select
                    required
                    value={refillProductId}
                    onChange={(e) => setRefillProductId(e.target.value)}
                    className="w-full bg-[#0B0C10] border border-[#45A29E]/20 rounded-xl py-3 px-4 focus:outline-none focus:border-[#66FCF1]/50 text-white cursor-pointer font-sans"
                  >
                    <option value="" className="bg-[#11141a]">เลือกสินค้าเป้าหมาย</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id} className="bg-[#11141a]">{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 font-sans">
                  <label className="text-[#C5C6C7] text-[11px] font-semibold block">รหัสคีย์ (1 คีย์ต่อ 1 บรรทัด):</label>
                  <textarea
                    required
                    placeholder="เช่น&#10;KEY-XYZ123-ABC987&#10;KEY-999AAA-888BBB"
                    rows={8}
                    value={bulkCodesText}
                    onChange={(e) => setBulkCodesText(e.target.value)}
                    className="w-full bg-[#0B0C10] border border-[#45A29E]/20 rounded-xl py-2.5 px-4 focus:outline-none focus:border-[#66FCF1]/50 text-white resize-none font-mono text-xs placeholder:opacity-50"
                  />
                  <p className="text-[10px] text-[#C5C6C7]/55 leading-relaxed font-sans">
                    * เมื่อลูกค้าสั่งซื้อสำเร็จ ระบบจะหยิบคีย์ส่งออโต้ทันที
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#66FCF1] hover:bg-[#45A29E] text-[#0B0C10] font-sans font-bold py-3.5 rounded-xl cursor-pointer transition-colors"
                >
                  เติมคีย์เข้าคลัง / Bulk Refill
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-[#11141a] border border-[#45A29E]/20 rounded-2xl p-6 h-[550px] flex flex-col shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#45A29E]/10 pb-4 mb-4">
                <h3 className="text-sm font-bold text-white tracking-widest uppercase font-mono">
                  คีย์ลิเซนส์คงเหลือนำจำหน่าย ({stockKeys.filter(k => !k.isUsed).length} คีย์)
                </h3>
                
                <select
                  value={stockFilterProductId}
                  onChange={(e) => setStockFilterProductId(e.target.value)}
                  className="bg-[#0B0C10] border border-[#45A29E]/20 rounded-lg text-xs text-white py-1.5 px-3 focus:outline-none focus:border-[#66FCF1]/50 cursor-pointer font-sans"
                >
                  <option value="all">แสดงทุกสินค้า (All)</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
                {stockKeys.filter(k => stockFilterProductId === "all" || k.productId === stockFilterProductId).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-[#C5C6C7]/40 py-16 font-sans">
                    <Key className="w-8 h-8 opacity-20 mb-2" />
                    <p>ไม่พบรายการคีย์สินค้าหรือคลังว่างเปล่า</p>
                  </div>
                ) : (
                  stockKeys
                    .filter(k => stockFilterProductId === "all" || k.productId === stockFilterProductId)
                    .map(k => {
                      const associatedProduct = products.find(p => p.id === k.productId);
                      return (
                        <div 
                          key={k.id}
                          className="bg-[#0B0C10]/60 border border-[#45A29E]/10 p-3 rounded-xl flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0">
                            <p className="text-white text-xs font-semibold font-sans truncate">{associatedProduct ? associatedProduct.name : "ทั่วไป"}</p>
                            <code className="text-[#60a5fa] font-mono text-xs block font-bold mt-1 tracking-wider">{k.code}</code>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase font-sans ${
                              k.isUsed 
                                ? "bg-rose-950/20 text-rose-400 border border-rose-955/20" 
                                : "bg-emerald-950/30 text-emerald-400 border border-emerald-950/20"
                            }`}>
                              {k.isUsed ? "ถูกใช้แล้ว" : "พร้อมใช้งาน"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        )}

        {/* --------------------- TAB: DISCORD --------------------- */}
        {adminTab === "discord" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn animate-duration-150">
            <div className="lg:col-span-2 bg-[#11141a] border border-[#45A29E]/20 rounded-2xl p-6 space-y-6 shadow-inner">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 font-display">
                <MessageSquare className="w-5 h-5 text-[#66FCF1]" />
                ตั้งค่าโครงข่าย Discord Webhook Bot
              </h3>

              <form onSubmit={handleSaveDiscordConfig} className="space-y-6 font-mono text-xs">
                {/* 1. MAIN GENERAL WEBHOOK */}
                <div className="space-y-2 mt-2">
                  <label className="text-white text-[11px] font-bold block uppercase tracking-wider font-sans">
                    📢 ลิงก์เว็บบอทฮุคหลัก (Main Discord Webhook URL) <span className="text-red-500">*</span>:
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="url"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={discordWebhookUrl}
                      onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                      className="flex-1 bg-[#0B0C10] border border-[#45A29E]/20 rounded-xl py-3.5 px-4 focus:outline-none focus:border-[#66FCF1]/50 text-white font-mono text-xs"
                    />
                    <button
                      type="button"
                      disabled={isTestingWebhook}
                      onClick={() => handleTestDiscordWebhook(discordWebhookUrl, "แชนแนลหลัก/ทั่วไป")}
                      className="bg-[#1F2833] hover:bg-[#253242] text-[#66FCF1] border border-[#45A29E]/30 px-4 rounded-xl cursor-pointer font-bold transition-all whitespace-nowrap flex items-center justify-center gap-1 min-w-[130px] disabled:opacity-50 text-xs font-sans"
                    >
                      {isTestingWebhook ? "กำลังทดสอบ..." : "ทดสอบส่ง / TEST"}
                    </button>
                  </div>
                  <p className="text-[10px] text-[#C5C6C7]/55 leading-relaxed font-sans font-light">
                    * เป็นลิงก์ประสานงานหลักที่จะส่งข้อความเหตุกาณ์ต่างๆ หากไม่มีการกำหนด URL แยกห้องด้านล่างนี้
                  </p>
                </div>

                {/* 2. SEPARATE SUB-WEBHOOKS */}
                <div className="border-t border-[#45A29E]/15 pt-5 space-y-4 font-sans">
                  <div className="space-y-1">
                    <label className="text-[#66FCF1] text-[12px] font-bold block uppercase tracking-wider">
                      ⚙️ ระบบแยกเว็บบอทฮุคส่งรายงานเฉพาะช่อง (Per-Event Channel Routing) // ไม่บังคับ:
                    </label>
                    <p className="text-[10px] text-[#C5C6C7]/60 leading-relaxed font-light">
                      คุณสามารถสร้างห้องในดิสคอร์ดและสร้างเว็บบอทแยกกัน เพื่อให้ข่าวสารแยกช่องเป็นระเบียบเรียบร้อย (หากเว้นว่างระบบจะส่งเข้า แชนแนลหลัก ด้านบนอัตโนมัติ)
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* A. NEW SIGNUP WEBHOOK */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[#C5C6C7] text-[11px] font-semibold">ห้องสมัครสมาชิกใหม่ (New Signup Webhook URL):</span>
                        <span className="text-[9px] text-[#45A29E] font-mono">Optional</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="วางลิงก์ Webhook สำหรับแจ้งสมาชิกใหม่ (หรือเว้นว่างเพื่อใช้ช่องหลัก)"
                          value={discordWebhookSignupUrl}
                          onChange={(e) => setDiscordWebhookSignupUrl(e.target.value)}
                          className="flex-1 bg-[#0B0C10] border border-[#45A29E]/20 rounded-xl py-2 px-3 focus:outline-none focus:border-[#66FCF1]/50 text-white font-mono text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleTestDiscordWebhook(discordWebhookSignupUrl, "ช่องข้อมูลสมัครสมาชิก")}
                          className="bg-[#1F2833] hover:bg-[#253242] text-white border border-[#45A29E]/30 px-3 rounded-xl cursor-pointer text-[10px] transition-all whitespace-nowrap"
                        >
                          ทดสอบย่อย
                        </button>
                      </div>
                    </div>

                    {/* B. PURCHASES WEBHOOK */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[#C5C6C7] text-[11px] font-semibold">ห้องประวัติสั่งซื้อสินค้า (Order Purchase Webhook URL):</span>
                        <span className="text-[9px] text-[#45A29E] font-mono">Optional</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="วางลิงก์ Webhook สำหรับแจ้งสถิติกดสั่งซื้อสำเร็จ (หรือเว้นว่างเพื่อใช้ช่องหลัก)"
                          value={discordWebhookPurchaseUrl}
                          onChange={(e) => setDiscordWebhookPurchaseUrl(e.target.value)}
                          className="flex-1 bg-[#0B0C10] border border-[#45A29E]/20 rounded-xl py-2 px-3 focus:outline-none focus:border-[#66FCF1]/50 text-white font-mono text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleTestDiscordWebhook(discordWebhookPurchaseUrl, "ช่องแจ้งสถิติตั้งซื้อ")}
                          className="bg-[#1F2833] hover:bg-[#253242] text-white border border-[#45A29E]/30 px-3 rounded-xl cursor-pointer text-[10px] transition-all whitespace-nowrap"
                        >
                          ทดสอบย่อย
                        </button>
                      </div>
                    </div>

                    {/* C. INVENTORY REFILL */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[#C5C6C7] text-[11px] font-semibold">ห้องสต็อกของเติมเพิ่ม (Inventory Refill Webhook URL):</span>
                        <span className="text-[9px] text-[#45A29E] font-mono">Optional</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="วางลิงก์ Webhook สำหรับอัปเดตสต็อกสินค้าเมื่อเติมของ (หรือเว้นว่างเพื่อใช้ช่องหลัก)"
                          value={discordWebhookRefillUrl}
                          onChange={(e) => setDiscordWebhookRefillUrl(e.target.value)}
                          className="flex-1 bg-[#0B0C10] border border-[#45A29E]/20 rounded-xl py-2 px-3 focus:outline-none focus:border-[#66FCF1]/50 text-white font-mono text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleTestDiscordWebhook(discordWebhookRefillUrl, "ช่องข้อมูลยอดอัปเดตคลัง")}
                          className="bg-[#1F2833] hover:bg-[#253242] text-white border border-[#45A29E]/30 px-3 rounded-xl cursor-pointer text-[10px] transition-all whitespace-nowrap"
                        >
                          ทดสอบย่อย
                        </button>
                      </div>
                    </div>

                    {/* D. TOP UP WEBHOOK */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[#C5C6C7] text-[11px] font-semibold">ห้องประวัติผู้เล่นเติมเงินเข้าวอลเลต (Wallet Top-Up Webhook URL):</span>
                        <span className="text-[9px] text-[#45A29E] font-mono">Optional</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="วางลิงก์ Webhook สำหรับสรุปยอดลูกค้าแจ้งฝากเงิน/เติมพอยท์สำเร็จ (หรือเว้นว่าง)"
                          value={discordWebhookTopUpUrl}
                          onChange={(e) => setDiscordWebhookTopUpUrl(e.target.value)}
                          className="flex-1 bg-[#0B0C10] border border-[#45A29E]/20 rounded-xl py-2 px-3 focus:outline-none focus:border-[#66FCF1]/50 text-white font-mono text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleTestDiscordWebhook(discordWebhookTopUpUrl, "ช่องบันทึกเงินกองกลาง")}
                          className="bg-[#1F2833] hover:bg-[#253242] text-white border border-[#45A29E]/30 px-3 rounded-xl cursor-pointer text-[10px] transition-all whitespace-nowrap"
                        >
                          ทดสอบย่อย
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#45A29E]/15 pt-5 space-y-4">
                  <label className="text-white text-[12px] font-bold block tracking-wider font-sans">
                    เลือกเหตุการณ์ที่ต้องการให้แจ้งเตือนใน Discord (EVENT FLAGS):
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-xs">
                    <label className="flex items-start gap-3 bg-[#0B0C10]/60 hover:bg-[#0b0c10]/95 border border-[#45A29E]/10 p-3.5 rounded-xl cursor-pointer select-none transition-all">
                      <input
                        type="checkbox"
                        checked={discordEnableSignup}
                        onChange={(e) => setDiscordEnableSignup(e.target.checked)}
                        className="mt-0.5 rounded border-[#45A29E]/30 text-[#66FCF1] focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4 text-[#66FCF1]"
                      />
                      <div className="space-y-0.5">
                        <span className="text-[#66FCF1] font-bold text-xs">สมัครสมาชิกใหม่ • New Signup</span>
                        <p className="text-[10px] text-zinc-400">แจ้งเตือนเมื่อมีผู้เล่น เข้าล็อกอิน หรือ สมัครสมาชิกระบบ</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 bg-[#0B0C10]/60 hover:bg-[#0b0c10]/95 border border-[#45A29E]/10 p-3.5 rounded-xl cursor-pointer select-none transition-all">
                      <input
                        type="checkbox"
                        checked={discordEnablePurchase}
                        onChange={(e) => setDiscordEnablePurchase(e.target.checked)}
                        className="mt-0.5 rounded border-[#45A29E]/30 text-[#66FCF1] focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4 text-[#66FCF1]"
                      />
                      <div className="space-y-0.5">
                        <span className="text-[#66FCF1] font-bold text-xs">รายการสั่งซื้อ • Purchases Log</span>
                        <p className="text-[10px] text-zinc-400">แจ้งเตือนบันทึกคำสั่งซื้อพ้อมซ่อนคีย์จัดจ่ายใต้สปอยเลอร์</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 bg-[#0B0C10]/60 hover:bg-[#0b0c10]/95 border border-[#45A29E]/10 p-3.5 rounded-xl cursor-pointer select-none transition-all">
                      <input
                        type="checkbox"
                        checked={discordEnableRefill}
                        onChange={(e) => setDiscordEnableRefill(e.target.checked)}
                        className="mt-0.5 rounded border-[#45A29E]/30 text-[#66FCF1] focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4 text-[#66FCF1]"
                      />
                      <div className="space-y-0.5">
                        <span className="text-[#66FCF1] font-bold text-xs">แอดมินเติมของ • Inventory Refills</span>
                        <p className="text-[10px] text-zinc-400">แจ้งเตือนเมื่อมีการเติมซีเรียลคีย์/สต็อกของเข้าคลังพร้อมขาย</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 bg-[#0B0C10]/60 hover:bg-[#0b0c10]/95 border border-[#45A29E]/10 p-3.5 rounded-xl cursor-pointer select-none transition-all">
                      <input
                        type="checkbox"
                        checked={discordEnableTopUp}
                        onChange={(e) => setDiscordEnableTopUp(e.target.checked)}
                        className="mt-0.5 rounded border-[#45A29E]/30 text-[#66FCF1] focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4 text-[#66FCF1]"
                      />
                      <div className="space-y-0.5">
                        <span className="text-[#66FCF1] font-bold text-xs">ยอดเครดิตเติมเงิน • Client Balance Topup</span>
                        <p className="text-[10px] text-zinc-400">แจ้งเตือนระบบตรวจสอบการฝากสิทธิ์เครดิตเงินเพิ่มสำเร็จ</p>
                      </div>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#66FCF1] hover:bg-[#45A29E] text-[#0B0C10] font-bold py-3.5 rounded-xl cursor-pointer transition-colors text-center text-xs font-sans"
                >
                  ✓ บันทึกโครงสร้างการตั้งค่า / Apply Webhook Config
                </button>
              </form>
            </div>

            <div className="bg-[#11141a] border border-[#45A29E]/20 rounded-2xl p-6 h-fit space-y-4 shadow-inner text-xs font-sans">
              <h4 className="text-[#66FCF1] font-mono font-bold tracking-wider uppercase text-xs">🔋 ประโยชน์ของการเชื่อม Discord</h4>
              <p className="text-[#C5C6C7]/80 leading-relaxed font-sans font-light text-[11px]">
                การเชื่อมต่อ Discord Webhook เป็นหัวใจสำคัญของร้านค้าประเภทออโต้ เพื่อให้ทีมหลังบ้านและสมาชิกในคอมมูนิตี้รู้ความเคลื่อนไหวทันที
              </p>
              <div className="bg-[#0B0C10]/80 p-4 rounded-xl border border-[#45A29E]/10 space-y-3 font-mono text-[10px] text-zinc-400 font-sans">
                <div className="text-[#66FCF1] font-semibold text-xs">🔒 เคล็ดลับการแจกจ่ายคีย์:</div>
                <p className="text-[10px] leading-relaxed">
                  เมื่อระบบการขายอัตโนมัติจัดกระทำการหยิบดึงชุด License Key รหัสจัดส่งที่หน้าเว็บ จะส่งรายงานพร้อมครอบด้วยสปอยเลอร์ป้องกันบุคคลอื่นลอกเลียนแบบ
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --------------------- TAB: TOPUPS (BANK TRANSFER REVIEWS) --------------------- */}
        {adminTab === "topups" && (
          <div className="space-y-6 animate-fadeIn animate-duration-150 text-left">
            <div className="bg-[#11141a] border border-[#45A29E]/20 rounded-2xl p-6 shadow-inner">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 font-display">
                    <Coins className="w-5 h-5 text-[#66FCF1]" />
                    รายการแจ้งโอนเงินผ่านบัญชีธนาคาร (Slip Transfer Logs)
                  </h3>
                  <p className="text-xs text-[#C5C6C7]/60 mt-1 flex items-center gap-1">
                    ระบบรวบรวมคำขอแจ้งเครดิตสลิปธนาคารที่ลูกค้าส่งเข้า เพื่อให้คุณทำการตรวจสอบความถูกต้องและกดเพื่มยอดเครดิตพอยท์เข้าสู่ระบบ
                  </p>
                </div>
                <div className="flex gap-4 font-mono text-xs">
                  <div className="bg-[#0B0C10] border border-[#45A29E]/10 px-4 py-2 rounded-xl text-center">
                    <p className="text-[10px] text-[#45A29E]">PENDING REQS</p>
                    <p className="text-amber-400 font-bold text-lg">
                      {topupRequests.filter(r => r.status === "pending").length} รายการ
                    </p>
                  </div>
                  <div className="bg-[#0B0C10] border border-[#45A29E]/10 px-4 py-2 rounded-xl text-center">
                    <p className="text-[10px] text-[#45A29E]">APPROVED TOTAL</p>
                    <p className="text-emerald-400 font-bold text-lg">
                      {topupRequests.filter(r => r.status === "approved").length} รายการ
                    </p>
                  </div>
                </div>
              </div>

              {topupRequests.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-[#45A29E]/10 rounded-2xl">
                  <p className="text-[#C5C6C7]/50 font-mono text-xs">📭 ไม่พบรายการคำขอแจ้งเติมเงินธนาคารเข้าในระบบ</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#45A29E]/20 text-[#66FCF1]/80 uppercase text-[10px]">
                        <th className="py-3 px-4">วันและเวลา (Date)</th>
                        <th className="py-3 px-4">ผู้แจ้งฝาก (Username)</th>
                        <th className="py-3 px-4">ยอดเงินแจ้ง (Amount)</th>
                        <th className="py-3 px-4">เลขอ้างอิงธนาคาร (Ref ID)</th>
                        <th className="py-3 px-4">สลิปตัวอย่าง (Slip Check)</th>
                        <th className="py-3 px-4">สถานะคำขอ (Status)</th>
                        <th className="py-3 px-4 text-right">เครื่องมือตรวจอนุมัติ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topupRequests.map((req) => (
                        <tr key={req.id} className="border-b border-[#45A29E]/10 hover:bg-[#1C2330]/20 transition-colors">
                          <td className="py-3.5 px-4 text-[#C5C6C7]/80">
                            {new Date(req.createdAt).toLocaleString("th-TH")}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-white">
                            {req.username}
                          </td>
                          <td className="py-3.5 px-4 text-[#66FCF1] font-bold text-sm">
                            {req.amount.toLocaleString()} ฿
                          </td>
                          <td className="py-3.5 px-4 text-[#45A29E]">
                            {req.transactionRef || "ไม่มีข้อมูล / N/A"}
                          </td>
                          <td className="py-3.5 px-4">
                            <a 
                              href={req.slipUrl || "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&q=80&w=400"} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-[#66FCF1] hover:underline flex items-center gap-1.5"
                            >
                              🔎 ดูรูปสลิป / View
                            </a>
                          </td>
                          <td className="py-3.5 px-4">
                            {req.status === "approved" ? (
                              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold px-2 py-1 rounded">
                                ✓ อนุมัติแล้ว
                              </span>
                            ) : req.status === "rejected" ? (
                              <span className="text-[10px] bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold px-2 py-1 rounded">
                                ❌ ปฏิเสธ
                              </span>
                            ) : (
                              <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold px-2 py-1 rounded animate-pulse">
                                ● รอตรวจยอด
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {req.status === "pending" ? (
                              <div className="flex justify-end gap-2 text-white">
                                <button
                                  type="button"
                                  onClick={() => handleApproveTopup(req.id)}
                                  className="bg-emerald-500 hover:bg-emerald-400 text-[#0B0C10] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                                >
                                  อนุมัติ / Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectTopup(req.id)}
                                  className="bg-rose-500 hover:bg-rose-650 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs"
                                >
                                  ปฏิเสธ / Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-zinc-500 italic">ดำเนินการเรียบร้อย</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --------------------- TAB: COUPONS (GIFT VOUCHERS CREATOR) --------------------- */}
        {adminTab === "coupons" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn animate-duration-150 text-left">
            
            {/* Left: Creator form */}
            <div className="bg-[#11141a] border border-[#45A29E]/20 rounded-2xl p-6 space-y-6 shadow-inner">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 font-display">
                <Ticket className="w-5 h-5 text-[#66FCF1]" />
                จัดสร้างโค้ดส่วนลด & ของรางวัลใหม่
              </h3>

              <form onSubmit={handleCreateRedeemCode} className="space-y-4 font-mono text-xs text-white">
                <div className="space-y-1.5 text-left">
                  <label className="text-white text-[11px] font-bold block uppercase tracking-wider">
                    🎟️ รหัสโค้ดรางวัล (Design Code Input):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น CASH-500 หรือ SPECIAL-35"
                    value={newCodeVal}
                    onChange={(e) => setNewCodeVal(e.target.value)}
                    className="w-full bg-[#0B0C10] border border-[#45A29E]/20 rounded-xl py-3 px-4 focus:outline-none focus:border-[#66FCF1]/50 text-white font-mono"
                  />
                  <p className="text-[9px] text-[#C5C6C7]/55">* อักขระจะถูกแปลงเป็นตัวพิมพ์ใหญ่โดยอัตโนมัติ</p>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-white text-[11px] font-bold block uppercase tracking-wider">
                    ⚙️ ประเภทสิทธิ์รางวัล (Voucher Type):
                  </label>
                  <select
                    value={newCodeType}
                    onChange={(e: any) => {
                      setNewCodeType(e.target.value);
                      if (e.target.value === "cash") setNewCodeAmount(300);
                      else if (e.target.value === "discount_percent") setNewCodeAmount(15);
                      else setNewCodeAmount(50);
                    }}
                    className="w-full bg-[#0B0C10] border border-[#45A29E]/20 rounded-xl py-3 px-4 focus:outline-none focus:border-[#66FCF1]/50 text-white"
                  >
                    <option value="cash">🎟️ บัตรเติมเงินสดขวัญถุง (ฟรีคลังเครดิตพอยท์)</option>
                    <option value="discount_percent">📉 โค้ดส่วนลดคิดอัตราร้อยละ (%)</option>
                    <option value="discount_flat">💰 โค้ดส่วนลดเป็นจำนวนบาท (฿)</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-white text-[11px] font-bold block uppercase tracking-wider">
                    {newCodeType === "cash" 
                      ? "💵 มูลค่าเงินเติมเข้าระบบเมื่อเคลม (บาท / ฿):" 
                      : newCodeType === "discount_percent"
                      ? "📉 อัตราส่วนลดที่ได้หัก (เปอร์เซ็นต์ / %):"
                      : "💰 จำนวนส่วนลดชำระเงินที่ลดตรง (บาท / ฿):"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={newCodeType === "discount_percent" ? 100 : 10000}
                    required
                    value={newCodeAmount}
                    onChange={(e) => setNewCodeAmount(Number(e.target.value))}
                    className="w-full bg-[#0B0C10] border border-[#45A29E]/20 rounded-xl py-3 px-4 focus:outline-none focus:border-[#66FCF1]/50 text-white"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-white text-[11px] font-bold block uppercase tracking-wider">
                    👥 จำกัดสิทธิ์สุ่มเคลมโค้ดได้สูงสุด (Usage Limit):
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCodeUsageLimit}
                    onChange={(e) => setNewCodeUsageLimit(Number(e.target.value))}
                    className="w-full bg-[#0B0C10] border border-[#45A29E]/20 rounded-xl py-3 px-4 focus:outline-none focus:border-[#66FCF1]/50 text-white"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-white text-[11px] font-bold block uppercase tracking-wider">
                    📅 วันที่กำหนดโค้ดหมดอายุการใช้งาน (Expiry Date):
                  </label>
                  <input
                    type="date"
                    required
                    value={newCodeExpiryStr}
                    onChange={(e) => setNewCodeExpiryStr(e.target.value)}
                    className="w-full bg-[#0B0C10] border border-[#45A29E]/20 rounded-xl py-3 px-4 focus:outline-none focus:border-[#66FCF1]/50 text-white text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#66FCF1] hover:bg-white text-[#0B0C10] font-bold py-3 rounded-xl transition-all cursor-pointer text-xs uppercase"
                >
                  ✓ จัดสร้างเปิดทำงานโค้ดส่วนลดนี้
                </button>
              </form>
            </div>

            {/* Right: Active listing */}
            <div className="lg:col-span-2 bg-[#11141a] border border-[#45A29E]/20 rounded-2xl p-6 space-y-4 shadow-inner flex flex-col h-fit text-left">
              <h3 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-2 font-mono">
                🎟️ ตารางสลอตรหัสรางวัลที่ใช้งานอยู่ในระบบ ({redeemCodes.length})
              </h3>

              {redeemCodes.length === 0 ? (
                <p className="text-xs font-mono text-[#C5C6C7]/40 py-8 text-center bg-[#0B0C10] border border-[#45A29E]/10 rounded-xl italic">
                  ไม่มีประวัติคูปองส่วนลดในฐานข้อมูลคลังปัจจุบัน
                </p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {redeemCodes.map((codeItem) => (
                    <div key={codeItem.code} className="bg-[#0B0C10] border border-[#45A29E]/15 rounded-xl p-4 flex justify-between items-center text-xs font-mono">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#66FCF1] font-bold text-sm tracking-wider">{codeItem.code}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            codeItem.type === "cash" 
                              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300" 
                              : "bg-blue-500/10 border border-blue-500/30 text-blue-300"
                          }`}>
                            {codeItem.type === "cash" ? "🎁 CASH REWARD" : codeItem.type === "discount_percent" ? "📉 % OFF" : "💰 FLAT OFF"}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#C5C6C7]/60 mt-1.5 space-y-0.5">
                          <p>มูลค่าเครดิตลด/แถม: <span className="font-bold text-white">{codeItem.value} {codeItem.type === "discount_percent" ? "%" : "฿"}</span></p>
                          <p>วันหมดอายุ: <span className="text-amber-300">{codeItem.expiryDate}</span></p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[10px] text-[#45A29E] uppercase">จำนวนถูกเคลม (Claims)</p>
                          <p className="text-white font-bold">
                            {codeItem.timesClaimed} / {codeItem.usageLimit} สิทธิ์
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteRedeemCode(codeItem.code)}
                          className="bg-rose-950/30 hover:bg-rose-500 border border-rose-500/40 p-2.5 rounded-lg text-[#ff5555] hover:text-white transition-all cursor-pointer text-xs"
                          title="ทำลายโค้ดยกเลิกสิทธิ์"
                        >
                          ลบ / Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
};
