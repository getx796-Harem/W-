import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Gamepad2, 
  UserCheck, 
  Shield, 
  Search, 
  ShoppingBag, 
  User as UserIcon, 
  Coins, 
  ArrowRight, 
  Check, 
  Copy, 
  PlusCircle, 
  LogOut, 
  Clock, 
  Layers, 
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Category, Product, Order, User } from "../types";
import { db } from "../dbMock";
import { sendDiscordWebhook } from "../utils/discord";

interface ProductCatalogProps {
  user: User;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onRefreshUser: (updatedUser: User) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  user,
  onLogout,
  onOpenAdmin,
  onRefreshUser,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // States for checkout animations
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchasedKey, setPurchasedKey] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedOrderCode, setCopiedOrderCode] = useState<string | null>(null);
  
  // Tabs: "shop", "my-keys"
  const [activeTab, setActiveTab] = useState<"shop" | "my-keys">("shop");
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [topUpAmount, setTopUpAmount] = useState<number>(500);
  const [showTopUpSuccess, setShowTopUpSuccess] = useState(false);

  // --- STORE FRONT EXPANSION (Bank topup, TrueMoney, Redeem codes & coupons) ---
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpTab, setTopUpTab] = useState<"bank" | "truemoney" | "redeem">("bank");
  
  // Bank transfer states
  const [bankTransferAmount, setBankTransferAmount] = useState<number>(300);
  const [bankTxRef, setBankTxRef] = useState("");
  const [bankSlipUrl, setBankSlipUrl] = useState<string | null>(null);
  
  // TrueMoney gift coupon link state
  const [truemoneyEnvelopeUrl, setTruemoneyEnvelopeUrl] = useState("");
  
  // Coupon codes claim states
  const [redeemCodeStr, setRedeemCodeStr] = useState("");

  // Product purchase form discount state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Status updates & alerts
  const [topupFeedback, setTopupFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isTopupLoading, setIsTopupLoading] = useState(false);
  
  // Personal payments claim history
  const [myTopups, setMyTopups] = useState<any[]>([]);

  // Dynamic stock counters
  const [stockCounts, setStockCounts] = useState<{ [productId: string]: number }>({});

  // Sync data from db
  const loadData = () => {
    setCategories(db.getCategories());
    setProducts(db.getProducts());
    
    // Count remaining unused keys for each product
    const allKeys = db.getStockKeys();
    const counts: { [productId: string]: number } = {};
    allKeys.forEach(k => {
      if (!k.isUsed) {
        counts[k.productId] = (counts[k.productId] || 0) + 1;
      }
    });
    setStockCounts(counts);

    // Load current user orders
    const allOrders = db.getOrders();
    const filterOrders = allOrders.filter(o => o.userId === user.id);
    setUserOrders(filterOrders);

    // Load user's topup request history
    const allTopups = db.getTopupRequests().filter(r => r.userId === user.id);
    setMyTopups(allTopups);
  };

  useEffect(() => {
    loadData();
    // Setup interval to keep stocks real-time if changed in admin
    const interval = setInterval(loadData, 1000);
    return () => clearInterval(interval);
  }, [user.id]);

  // Convert categories string to dynamic Lucide component or custom image URL
  const getCategoryIcon = (iconName: string) => {
    if (iconName && (iconName.startsWith("http://") || iconName.startsWith("https://") || iconName.startsWith("data:image/"))) {
      return <img src={iconName} className="w-4 h-4 rounded object-cover" alt="" referrerPolicy="no-referrer" />;
    }
    switch (iconName) {
      case "Sparkles": return <Sparkles className="w-4 h-4" />;
      case "Gamepad2": return <Gamepad2 className="w-4 h-4" />;
      case "UserCheck": return <UserCheck className="w-4 h-4" />;
      case "Shield": return <Shield className="w-4 h-4" />;
      default: return <Layers className="w-4 h-4" />;
    }
  };

  // Filtered lists
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategoryId === "all" || p.categoryId === selectedCategoryId;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleTopUp = (amount: number) => {
    const users = db.getUsers();
    const updatedUsers = users.map(u => {
      if (u.id === user.id) {
        return { ...u, balance: u.balance + amount };
      }
      return u;
    });
    db.saveUsers(updatedUsers);
    
    // Get updated user profile and bubble up
    const freshUser = updatedUsers.find(u => u.id === user.id);
    if (freshUser) {
      onRefreshUser(freshUser);
    }
    
    // Fire Discord balance top-up notification
    sendDiscordWebhook({
      title: "💳 สมาชิกยอดเติมเครดิตใหม่เข้าร้าน! / Credits Deposited",
      description: `มีรายการเติมเงินและเครดิตใหม่ได้รับการบันทึกเข้าในระบบเรียบร้อยแล้ว`,
      color: 3447003, // #3498DB Blue
      fields: [
        { name: "ชื่อผู้ใช้ (Depositor)", value: `\`${user.username}\``, inline: true },
        { name: "รหัสบันทึก (ID)", value: `\`${user.id}\``, inline: true },
        { name: "ยอดที่เพิ่ม (Amount Added)", value: `**+${amount.toLocaleString()} ฿**`, inline: true },
        { name: "ยอดคงเหลือล่าสุด (New Balance)", value: `**${(freshUser ? freshUser.balance : user.balance + amount).toLocaleString()} ฿**`, inline: true }
      ],
      thumbnailUrl: user.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
    }, "enableTopUp");

    setShowTopUpSuccess(true);
    setTimeout(() => setShowTopUpSuccess(false), 2000);
  };

  const handleInitiatePurchase = (product: Product) => {
    setSelectedProduct(product);
    setPurchasedKey(null);
    setCheckoutError(null);
    setCopiedKey(false);
    setCouponInput("");
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const handleCheckCoupon = () => {
    setCouponError(null);
    if (!couponInput.trim()) {
      setCouponError("กรุณากรอกรหัสคูปองส่วนลด");
      return;
    }
    const codes = db.getRedeemCodes();
    const coupon = codes.find(c => c.code.toUpperCase() === couponInput.trim().toUpperCase());
    
    if (!coupon) {
      setCouponError("ไม่พบคูปองส่วนลดนี้ในระบบ กรุณาตรวจสอบรหัสอีกครั้ง");
      setAppliedCoupon(null);
      return;
    }
    if (coupon.type === "cash") {
      setCouponError("โค้ดนี้เป็นบัตรเงินสด กรุณานำรหัสเติมโดยตรงที่ปุ่ม 'เติมเงิน' ด้านบน");
      setAppliedCoupon(null);
      return;
    }
    if (coupon.expiryDate < Date.now()) {
      setCouponError("เสียใจด้วย คูปองส่วนลดนี้หมดอายุความใช้งานแล้ว");
      setAppliedCoupon(null);
      return;
    }
    if (coupon.timesClaimed >= coupon.usageLimit) {
      setCouponError("โค้ดคูปองส่วนลดนี้มีผู้ใช้ครบจำนวนเต็มสิทธิ์โควตาแล้ว");
      setAppliedCoupon(null);
      return;
    }
    if (coupon.claimedBy.includes(user.id)) {
      setCouponError("คุณเคยใช้งานคูปองส่วนลดรหัสนี้ไปแล้ว (จำกัด 1 สิทธิ์ต่อคน)");
      setAppliedCoupon(null);
      return;
    }

    setAppliedCoupon(coupon);
  };

  const handleConfirmPurchase = () => {
    if (!selectedProduct) return;
    setIsPurchasing(true);
    setCheckoutError(null);

    // Simulate cyber purchase calculation delay
    setTimeout(() => {
      const res = db.purchaseProduct(user.id, selectedProduct.id, appliedCoupon?.code);
      setIsPurchasing(false);
      
      if (res.success && res.key) {
        setPurchasedKey(res.key);
        // Refresh balance
        const freshUser = db.getUsers().find(u => u.id === user.id);
        if (freshUser) {
          onRefreshUser(freshUser);
        }
        loadData();
      } else {
        setCheckoutError(res.error || "เกิดข้อผิดพลาดในการสั่งซื้อสินค้าคัดคลัง");
      }
    }, 1200);
  };

  // --- TOPUP DISPATCH CONTROLLERS ---
  const handleBankTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTopupFeedback(null);
    if (bankTransferAmount <= 0) {
      setTopupFeedback({ message: "กรุณาระบุมูลค่าโอนเงินที่ถูกต้อง มากกว่า 0 บาท", type: "error" });
      return;
    }
    if (!bankTxRef.trim()) {
      setTopupFeedback({ message: "กรุณาระบุเลขอ้างอิงสลิปโอนเงิน (Transaction Ref ID)", type: "error" });
      return;
    }

    setIsTopupLoading(true);

    setTimeout(() => {
      const topupList = db.getTopupRequests();
      // Prevent duplicate Transaction Ref
      if (topupList.some(r => r.transactionRef?.toUpperCase() === bankTxRef.trim().toUpperCase())) {
        setIsTopupLoading(false);
        setTopupFeedback({ message: "ขออภัย เลขอ้างอิงสลิปนี้เคยถูกส่งตรวจทานเข้าระบบแล้ว", type: "error" });
        return;
      }

      // Prepare new TopupRequest object
      const newRequest = {
        id: `req-${Math.floor(100000 + Math.random() * 900000)}`,
        userId: user.id,
        username: user.username,
        method: "bank" as "bank",
        amount: bankTransferAmount,
        slipUrl: bankSlipUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=300",
        transactionRef: bankTxRef.trim(),
        status: "pending" as "pending",
        createdAt: Date.now()
      };

      topupList.unshift(newRequest);
      db.saveTopupRequests(topupList);

      setIsTopupLoading(false);
      setTopupFeedback({
        message: "ส่งหลักฐานโอนเงินเรียบร้อยแล้ว! แอดมินกำลังตรวจเช็คในระบบหลังบ้านเพื่ออนุมัติเงินให้คุณสักครู่ค่ะ",
        type: "success"
      });
      setBankTxRef("");
      setBankSlipUrl(null);
      loadData();
    }, 1200);
  };

  const handleGenerateSimulatedSlip = () => {
    const randomRef = `2026${String(Math.floor(10000000000 + Math.random() * 90000000000))}`;
    setBankTxRef(randomRef);
    setBankSlipUrl("https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=300");
  };

  const handleTrueMoneySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTopupFeedback(null);
    const url = truemoneyEnvelopeUrl.trim();
    if (!url) {
      setTopupFeedback({ message: "กรุณาระบุลิงก์ซองของขวัญทรูมันนี่", type: "error" });
      return;
    }

    const regex = /gift\.truemoney\.com\/campaign\/\?v=([a-zA-Z0-9]+)/;
    const match = url.match(regex);
    if (!match) {
      setTopupFeedback({ message: "รูปแบบลิงก์ซองไม่ถูกต้อง ลิงก์ต้องอยู่ในรูปแบบ https://gift.truemoney.com/campaign/?v=xxxxxx", type: "error" });
      return;
    }

    setIsTopupLoading(true);

    setTimeout(() => {
      const topups = db.getTopupRequests();
      const alreadyClaimed = topups.some(r => r.rawEnvelopeUrl === url);
      
      if (alreadyClaimed) {
        setIsTopupLoading(false);
        setTopupFeedback({ message: "ขออภัย ซองของขวัญระบบนี้ถูกเคลมใช้งานไปเรียบร้อยแล้ว", type: "error" });
        return;
      }

      // Award random amount from angpao (e.g. 50, 100, 150, 300, 500)
      const prizes = [50, 100, 150, 250, 300, 500];
      const prizeMoney = prizes[Math.floor(Math.random() * prizes.length)];
      
      const users = db.getUsers();
      const userIdx = users.findIndex(u => u.id === user.id);
      if (userIdx !== -1) {
        users[userIdx].balance += prizeMoney;
        db.saveUsers(users);
        onRefreshUser(users[userIdx]);
      }

      const newReq = {
        id: `req-${Math.floor(100000 + Math.random() * 900000)}`,
        userId: user.id,
        username: user.username,
        method: "truemoney" as "truemoney",
        amount: prizeMoney,
        rawEnvelopeUrl: url,
        status: "approved" as "approved",
        createdAt: Date.now(),
        approvedAt: Date.now()
      };

      topups.unshift(newReq);
      db.saveTopupRequests(topups);

      setIsTopupLoading(false);
      setTopupFeedback({
        message: `รับเครดิตเงินอั่งเปาทรูมันนี่สำเร็จ! ได้รับเครดิตบวกเข้าคลังบัญชีจำนวน +${prizeMoney} ฿ ทันที!`,
        type: "success"
      });
      setTruemoneyEnvelopeUrl("");
      loadData();
    }, 1500);
  };

  const handleClaimCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTopupFeedback(null);
    const code = redeemCodeStr.trim().toUpperCase();
    if (!code) {
      setTopupFeedback({ message: "กรุณาระบุโค้ดรางวัลที่ต้องการเติมเงิน", type: "error" });
      return;
    }

    setIsTopupLoading(true);

    setTimeout(() => {
      const res = db.redeemCode(user.id, code);
      setIsTopupLoading(false);
      
      if (res.success) {
        setTopupFeedback({ message: res.message || "เปิดใช้งานรหัสโค้ดรางวัลสำเร็จคู่เงินสด!", type: "success" });
        setRedeemCodeStr("");
        const freshUser = db.getUsers().find(u => u.id === user.id);
        if (freshUser) {
          onRefreshUser(freshUser);
        }
        loadData();
      } else {
        setTopupFeedback({ message: res.error || "ขออภัย เกิดข้อผิดพลาดในการตรวจสอบรหัสโค้ด", type: "error" });
      }
    }, 1200);
  };

  const copyToClipboard = (text: string, isFromOrder?: string) => {
    navigator.clipboard.writeText(text);
    if (isFromOrder) {
      setCopiedOrderCode(isFromOrder);
      setTimeout(() => setCopiedOrderCode(null), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 relative z-10">
      
      {/* Dynamic Profile & Stats Bar */}
      <div className="bg-[#11141a]/90 border border-[#45A29E]/20 rounded-2xl p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative">
            <img 
              src={user.avatarUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150"} 
              alt={user.username}
              className="w-12 h-12 rounded-xl object-cover border border-[#45A29E]/30"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=150";
              }}
            />
            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-brand-bg flex items-center justify-center text-[8px] font-bold ${
              user.platform === "discord" ? "bg-[#5865F2]" : user.platform === "google" ? "bg-red-500" : "bg-[#66FCF1]"
            } text-white`}>
              {user.platform[0].toUpperCase()}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-white font-semibold font-display tracking-tight">{user.username}</h4>
              <span className="text-[10px] font-mono text-[#66FCF1] bg-[#11141a] px-2 py-0.5 rounded border border-[#45A29E]/20">
                CLIENT ID: {user.id.slice(-6).toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-[#C5C6C7]/60 font-mono">{user.email}</p>
          </div>
        </div>

        {/* Action Center (Wallet, Tab togglers, Admin Portal) */}
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
          
          {/* Simulated Wallet Indicator */}
          <div className="bg-[#1F2833]/90 border border-[#45A29E]/20 rounded-xl px-4 py-2 flex items-center gap-3">
            <Coins className="w-5 h-5 text-[#66FCF1]" />
            <div className="text-left font-mono">
              <p className="text-[9px] text-[#45A29E]">YOUR BALANCE</p>
              <p className="text-[#66FCF1] font-bold text-sm tracking-tight">
                {user.balance.toLocaleString()} ฿
              </p>
            </div>
          </div>

          {/* Premium Top Up Launch Button */}
          <button
            onClick={() => {
              setTopupFeedback(null);
              setShowTopUpModal(true);
            }}
            className="bg-[#66FCF1] hover:bg-white text-[#0B0C10] px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-[#66FCF1]/10 transform hover:scale-[1.02] active:scale-95"
          >
            <Coins className="w-4 h-4 shrink-0" />
            เติมเงิน & เคลมโค้ด / top up
          </button>

          {/* Tab buttons */}
          <div className="bg-[#11141a] p-1 border border-[#45A29E]/20 rounded-xl flex">
            <button
              onClick={() => setActiveTab("shop")}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "shop" 
                  ? "bg-[#1F2833] text-[#66FCF1] border border-[#66FCF1]/10 shadow-[0_2px_8px_rgba(102,252,241,0.1)]" 
                  : "text-[#C5C6C7] hover:text-white"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              ร้านค้า / Shop
            </button>
            <button
              onClick={() => setActiveTab("my-keys")}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-2 relative cursor-pointer ${
                activeTab === "my-keys" 
                  ? "bg-[#1F2833] text-[#66FCF1] border border-[#66FCF1]/10 shadow-[0_2px_8px_rgba(102,252,241,0.1)]" 
                  : "text-[#C5C6C7] hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              คีย์ของฉัน ({userOrders.length})
            </button>
          </div>

          {/* Admin Backoffice Portal Router - only available for admins */}
          {user.isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="border border-[#45A29E]/30 bg-[#45A29E]/10 text-[#66FCF1] hover:bg-[#45A29E]/20 hover:text-white px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              ⚙️ หลังบ้าน / Admin
            </button>
          )}

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2 border border-[#45A29E]/20 bg-[#1F2833] hover:bg-[#11141a] hover:border-rose-400/50 rounded-xl text-[#C5C6C7] hover:text-rose-400 transition-all cursor-pointer"
            title="ออกจากระบบ"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Popups alert */}
      <AnimatePresence>
        {showTopUpSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-zinc-950 px-6 py-3 rounded-full text-xs font-mono font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 z-50"
          >
            <Check className="w-4 h-4" />
            +เติมเงินสำเร็จแล้ว! ยอดเงินอัปเดตเรียบร้อย
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        
        {/* SHOP TAB CONTAINER */}
        {activeTab === "shop" && (
          <motion.div
            key="tab-shop"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            
            {/* Nav Filters & Search */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              
              {/* Categories Tabs list */}
              <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedCategoryId("all")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-mono transition-all duration-200 border cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    selectedCategoryId === "all"
                      ? "bg-[#66FCF1] text-[#0B0C10] border-[#66FCF1] font-bold shadow-[0_0_12px_rgba(102,252,241,0.2)]"
                      : "bg-[#1F2833]/50 text-[#C5C6C7] border-[#45A29E]/20 hover:border-[#66FCF1] hover:text-[#66FCF1]"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  ทั้งหมด / ALL
                </button>

                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-mono transition-all duration-200 border cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      selectedCategoryId === cat.id
                        ? "bg-[#66FCF1] text-[#0B0C10] border-[#66FCF1] font-bold shadow-[0_0_12px_rgba(102,252,241,0.2)]"
                        : "bg-[#1F2833]/50 text-[#C5C6C7] border-[#45A29E]/20 hover:border-[#66FCF1] hover:text-[#66FCF1]"
                    }`}
                  >
                    {getCategoryIcon(cat.icon)}
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#45A29E]" />
                <input
                  type="text"
                  placeholder="ค้นหาสินค้า / คีย์เกม..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#11141a]/90 border border-[#45A29E]/25 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-[#66FCF1]/50 focus:ring-1 focus:ring-[#66FCF1]/20 font-mono text-xs text-white placeholder-[#C5C6C7]/30 transition-all font-mono"
                />
              </div>
            </div>

            {/* Product Catalog Grid */}
            {filteredProducts.length === 0 ? (
              <div className="py-20 text-center space-y-3 bg-zinc-950/30 border border-zinc-900 border-dashed rounded-2xl">
                <p className="text-zinc-500 font-mono text-sm leading-relaxed">
                  ไม่พบสินค้าสำหรับหมวดหมู่นี้หรือตามคำค้นหาที่ระบุ
                </p>
                <button
                  onClick={() => { setSelectedCategoryId("all"); setSearchQuery(""); }}
                  className="text-sky-400 hover:text-sky-300 font-mono text-xs underline cursor-pointer"
                >
                  ล้างตัวกรองและดูสินค้าทั้งหมด
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((p) => {
                  const stock = stockCounts[p.id] || 0;
                  return (
                    <motion.div
                      key={p.id}
                      layoutId={`card-${p.id}`}
                      className="bg-[#11141a]/90 border border-[#45A29E]/20 group rounded-2xl overflow-hidden shadow-xl hover:border-[#66FCF1]/40 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        {/* Image banner */}
                        <div className="relative aspect-video overflow-hidden bg-[#0B0C10]">
                          <img 
                            src={p.imageUrl} 
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?auto=format&fit=crop&q=80&w=400";
                            }}
                          />
                          <div className="absolute top-3 right-3 bg-[#0B0C10]/95 backdrop-blur-md border border-[#45A29E]/25 px-2.5 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1.5 text-white">
                            <span className={`w-2.5 h-2.5 rounded-full ${stock > 0 ? "bg-[#66FCF1] shadow-[0_0_8px_#66FCF1]" : "bg-rose-500"}`} />
                            สต็อก: {stock} ชิ้น
                          </div>

                          <div className="absolute bottom-3 left-3 bg-[#0B0C10]/95 backdrop-blur-md border border-[#45A29E]/25 px-2 py-0.5 rounded text-[9px] font-mono uppercase text-[#66FCF1]">
                            {categories.find(c => c.id === p.categoryId)?.name || "ETC"}
                          </div>
                        </div>

                        {/* Text description details */}
                        <div className="p-5 space-y-2">
                          <h3 className="text-white font-semibold text-lg tracking-tight group-hover:text-[#66FCF1] transition-colors font-display">
                            {p.name}
                          </h3>
                          <p className="text-[#C5C6C7]/80 text-xs font-light line-clamp-2 leading-relaxed">
                            {p.description}
                          </p>
                        </div>
                      </div>

                      {/* Footer Buy box */}
                      <div className="p-5 pt-0 flex items-center justify-between gap-4 mt-auto border-t border-[#45A29E]/10 pt-4">
                        <div className="text-left font-mono">
                          <p className="text-[9px] text-[#45A29E] leading-none">PRICE</p>
                          <p className="text-[#66FCF1] font-bold text-lg">
                            {p.price.toLocaleString()} <span className="text-xs text-[#C5C6C7]">฿</span>
                          </p>
                        </div>

                        <button
                          onClick={() => handleInitiatePurchase(p)}
                          className={`px-4.5 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1 transition-all ${
                            stock > 0 
                              ? "bg-[#66FCF1] text-[#0B0C10] hover:bg-[#66FCF1]/95 cursor-pointer active:scale-95 shadow-md shadow-[#66FCF1]/10" 
                              : "bg-[#1F2833] text-[#45A29E]/40 cursor-not-allowed border border-[#45A29E]/10"
                          }`}
                          disabled={stock === 0}
                        >
                          {stock > 0 ? (
                            <>
                              สั่งซื้อ / Buy
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            "สินค้าหมด"
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* MY PURCHASED KEYS TAB CONTAINER */}
        {activeTab === "my-keys" && (
          <motion.div
            key="tab-keys"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-[#45A29E]/20 pb-4">
              <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 font-display">
                <Clock className="w-5 h-5 text-[#66FCF1]" />
                ประวัติคำสั่งซื้อและรหัสสินค้า (My Auto-Delivery Keys)
              </h3>
              <span className="text-xs font-mono text-[#C5C6C7] bg-[#11141a] px-3 py-1 rounded-full border border-[#45A29E]/20">
                ทั้งหมด {userOrders.length} ออเดอร์
              </span>
            </div>

            {userOrders.length === 0 ? (
              <div className="py-24 text-center space-y-4 bg-[#11141a]/40 border border-[#45A29E]/20 rounded-2xl justify-center">
                <ShoppingBag className="w-12 h-12 text-[#45A29E]/40 mx-auto" />
                <p className="text-[#C5C6C7]/60 font-mono text-sm max-w-sm mx-auto">
                  คุณยังไม่มีประวัติการสั่งซื้อรหัสใดๆในระบบ สั่งซื้อหน้าแรก สินค้าจะส่งอัตโนมัติมาอยู่ตรงนี้ทันที
                </p>
                <button
                  onClick={() => setActiveTab("shop")}
                  className="bg-[#1F2833] hover:bg-[#11141a] text-[#66FCF1] font-mono text-xs px-4 py-2.5 rounded-xl border border-[#45A29E]/20 cursor-pointer transition-colors"
                >
                  ไปช้อปปิ้งหน้าแรก
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {userOrders.map((ord) => (
                  <div 
                    key={ord.id}
                    className="bg-[#1F2833]/50 border border-[#45A29E]/20 hover:border-[#66FCF1]/30 rounded-2xl p-5 md:p-6 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="space-y-1.5 flex-1 w-full">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] bg-[#66FCF1]/10 text-[#66FCF1] px-2.5 py-0.5 font-mono font-medium rounded border border-[#66FCF1]/20">
                          {ord.id.toUpperCase()}
                        </span>
                        <span className="text-[#C5C6C7]/60 text-xs font-mono">
                          {new Date(ord.createdAt).toLocaleDateString("th-TH", {
                            year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                          })}
                        </span>
                      </div>

                      <h4 className="text-white font-semibold text-base font-display">{ord.productName}</h4>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-[#C5C6C7]/80 pt-1">
                        <span>ราคา: <strong className="text-[#66FCF1]">{ord.price} ฿</strong></span>
                        <span>ชำระผ่าน: <strong className="text-white">{ord.loginPlatform.toUpperCase()}</strong></span>
                        <span className="flex items-center gap-1">
                          สถานะจัดส่ง: 
                          <span className="text-[#66FCF1] font-semibold flex items-center">
                            <span className="w-1.5 h-1.5 bg-[#66FCF1] rounded-full mr-1.5 animate-pulse shadow-[0_0_8px_#66FCF1]" />
                            สำเร็จอัตโนมัติ (AUTO DELIVERED)
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Instant Delivered Code Copyable segment */}
                    {ord.deliveredCode && (
                      <div className="w-full md:w-auto mt-2 md:mt-0 font-mono">
                        <p className="text-[9px] text-[#45A29E] tracking-wider mb-1">รหัสสินค้า / SERIAL CODE</p>
                        <div className="flex items-center justify-between bg-[#0B0C10] border border-[#45A29E]/25 rounded-xl px-4 py-2.5 max-w-sm w-full gap-4">
                          <span className="text-xs text-[#66FCF1] font-semibold break-all select-all">
                            {ord.deliveredCode}
                          </span>
                          <button
                            onClick={() => copyToClipboard(ord.deliveredCode || "", ord.id)}
                            className="text-[#C5C6C7]/60 hover:text-white transition-colors cursor-pointer shrink-0"
                            title="คัดลอกรหัส"
                          >
                            {copiedOrderCode === ord.id ? (
                              <Check className="w-4 h-4 text-[#66FCF1]" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION PURCHASE DIALOG MODAL */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Dark glass backdrop layout */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!isPurchasing) setSelectedProduct(null); }}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />

            {/* Receipt Modal main card */}
            <motion.div
              layoutId={`card-${selectedProduct.id}`}
              className="bg-[#11141a] border border-[#45A29E]/30 rounded-2xl p-6 sm:p-8 max-w-lg w-full relative overflow-hidden z-10 shadow-2xl"
            >
              {/* Glowing header bar */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#66FCF1] to-[#45A29E]" />

              {!purchasedKey ? (
                // State A: Purchase Confirmation details receipt
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-[#66FCF1] bg-[#66FCF1]/10 border border-[#66FCF1]/20 px-2.5 py-0.5 rounded">
                        CONFIRM ORDER
                      </span>
                      <h4 className="text-xl font-bold text-white tracking-tight mt-1.5 font-display">ยืนยันการทำรายการสั่งซื้อ</h4>
                    </div>
                    <button 
                      onClick={() => setSelectedProduct(null)}
                      className="text-[#C5C6C7]/60 hover:text-white font-mono text-center cursor-pointer text-sm"
                      disabled={isPurchasing}
                    >
                      ปิด / Esc
                    </button>
                  </div>

                  <div className="bg-[#1F2833]/70 border border-[#45A29E]/20 rounded-xl p-4 space-y-3.5">
                    <div className="flex items-center gap-3">
                      <img 
                        src={selectedProduct.imageUrl} 
                        className="w-16 h-12 rounded object-cover border border-[#45A29E]/20"
                        alt=""
                      />
                      <div>
                        <h5 className="text-white text-sm font-semibold font-display">{selectedProduct.name}</h5>
                        <p className="text-[11px] text-[#45A29E] font-mono">DIGITAL DELIVERY HUB</p>
                      </div>
                    </div>

                    <div className="h-px bg-[#45A29E]/10" />

                    <div className="space-y-3 text-xs font-mono text-[#C5C6C7]/80">
                      <div className="flex justify-between">
                        <span>ราคาปกติ / Price:</span>
                        <span className="text-white font-semibold">{selectedProduct.price.toLocaleString()} ฿</span>
                      </div>

                      {/* Coupon entry block */}
                      <div className="border-t border-b border-[#45A29E]/10 py-3 my-1 space-y-2">
                        <p className="text-[10px] text-[#45A29E] leading-none mb-1">คูปองส่วนลด / DISCOUNT COUPON</p>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="กรอกโค้ดส่วนลด (เช่น DISCOUNT10)" 
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value)}
                            disabled={isPurchasing || !!appliedCoupon}
                            className="bg-[#0B0C10] border border-[#45A29E]/30 focus:border-[#66FCF1] rounded-lg px-2.5 py-1.5 w-full text-xs text-white focus:outline-none placeholder-[#C5C6C7]/30"
                          />
                          {!appliedCoupon ? (
                            <button
                              type="button"
                              onClick={handleCheckCoupon}
                              disabled={isPurchasing}
                              className="bg-[#1F2833] hover:bg-[#66FCF1] hover:text-[#0B0C10] border border-[#45A29E]/20 text-[#66FCF1] text-[10px] font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                            >
                              ตรวจสอบ
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setAppliedCoupon(null);
                                setCouponInput("");
                              }}
                              className="bg-rose-950/40 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-[10px] font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                            >
                              ล้างออก
                            </button>
                          )}
                        </div>
                        {couponError && (
                          <p className="text-[10px] text-rose-400 font-mono italic">{couponError}</p>
                        )}
                        {appliedCoupon && (
                          <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                            ✓ ประยุกต์ใช้คูปองสำเร็จ: {appliedCoupon.type === 'discount_percent' ? `ลด ${appliedCoupon.value}%` : `ลดกระหน่ำ ${appliedCoupon.value} ฿`}
                          </p>
                        )}
                      </div>

                      {appliedCoupon && (
                        <div className="flex justify-between text-emerald-400">
                          <span>ส่วนลดจากคูปอง ({appliedCoupon.code}):</span>
                          <span>
                            -{appliedCoupon.type === 'discount_percent' 
                              ? Math.round(selectedProduct.price * (appliedCoupon.value / 100)).toLocaleString() 
                              : appliedCoupon.value.toLocaleString()} ฿
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span>ค่าจัดส่ง / Delivery Fee:</span>
                        <span className="text-[#66FCF1] font-semibold">0 ฿ (ฟรีออโต้)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>บัญชีผู้ซื้อ:</span>
                        <span className="text-[#C5C6C7]">{user.username}</span>
                      </div>
                      <div className="flex justify-between border-t border-[#45A29E]/10 pt-2.5 text-sm">
                        <span className="text-white font-semibold font-display">ยอดรวมชำระทั้งสิ้น:</span>
                        <span className="text-[#66FCF1] font-bold text-base">
                          {(() => {
                            if (!appliedCoupon) return selectedProduct.price.toLocaleString();
                            const discount = appliedCoupon.type === 'discount_percent' 
                              ? Math.round(selectedProduct.price * (appliedCoupon.value / 100))
                              : appliedCoupon.value;
                            return Math.max(0, selectedProduct.price - discount).toLocaleString();
                          })()} ฿
                        </span>
                      </div>
                    </div>
                  </div>

                  {checkoutError && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-xs font-mono text-rose-300 leading-relaxed">
                      ❌ {checkoutError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedProduct(null)}
                      disabled={isPurchasing}
                      className="flex-1 bg-[#0B0C10] hover:bg-[#11141a] border border-[#45A29E]/20 text-xs font-mono text-[#C5C6C7] py-3.5 rounded-xl cursor-pointer transition-colors"
                    >
                      ยกเลิกรายการ
                    </button>

                    <button
                      onClick={handleConfirmPurchase}
                      disabled={isPurchasing}
                      className="flex-1 bg-[#66FCF1] hover:bg-[#66FCF1]/95 disabled:bg-[#1F2833] disabled:text-[#45A29E]/30 text-xs font-mono text-[#0B0C10] font-bold py-3.5 rounded-xl active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#66FCF1]/10"
                    >
                      {isPurchasing ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-[#0B0C10]/25 border-t-[#0B0C10] rounded-full animate-spin" />
                          กำลังตัดจ่ายจากคลัง...
                        </>
                      ) : (
                        <>
                          ยืนยันคำสั่งซื้อ ({appliedCoupon ? (() => {
                            const discount = appliedCoupon.type === 'discount_percent' 
                              ? Math.round(selectedProduct.price * (appliedCoupon.value / 100))
                              : appliedCoupon.value;
                            return Math.max(0, selectedProduct.price - discount).toLocaleString();
                          })() : selectedProduct.price.toLocaleString()} ฿)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                // State B: Auto delivery Success modal (Displays code right away!)
                <div className="space-y-6 text-center py-4">
                  <div className="mx-auto w-14 h-14 rounded-full bg-[#66FCF1]/10 border border-[#66FCF1]/30 flex items-center justify-center text-[#66FCF1]">
                    <Check className="w-7 h-7" />
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-xl font-bold text-white tracking-tight font-display">ชำระเงินและส่งคำสั่งซื้อสำเร็จ!</h4>
                    <p className="text-xs text-[#C5C6C7]/80 leading-normal max-w-sm mx-auto">
                      ระบบดึงโค้ดพินจากคลังจัดเก็บและจัดส่งอัตโนมัติมาเรียบร้อยแล้ว คัดลอกและนำไปเปิดใช้งานได้ทันที
                    </p>
                  </div>

                  {/* Copyable delivery key glow element */}
                  <div className="space-y-2 bg-gradient-to-br from-[#1F2833] to-[#0B0C10] p-4 rounded-xl border border-[#45A29E]/20 font-mono max-w-sm mx-auto shadow-inner">
                    <p className="text-[9px] text-[#45A29E] tracking-widest uppercase">รหัสพิน / LICENSE SERIAL KEY</p>
                    <div className="flex items-center justify-between gap-4 bg-[#0B0C10] border border-[#45A29E]/15 px-3.5 py-3 rounded-lg">
                      <span className="text-sm text-[#66FCF1] font-bold select-all break-all text-left">
                        {purchasedKey}
                      </span>
                      <button
                        onClick={() => copyToClipboard(purchasedKey)}
                        className="text-[#C5C6C7]/60 hover:text-white transition-colors shrink-0 cursor-pointer"
                        title="Copy code"
                      >
                        {copiedKey ? (
                          <Check className="w-4.5 h-4.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-4.5 h-4.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-[#C5C6C7]/60 font-mono">
                    *ข้อมูลออเดอร์และคีย์พินนี้ ถูกบันทึกไว้ในสลอตประวัติ "คีย์ของฉัน" เรียบร้อย ปลอดภัยหายใจคล่อง
                  </p>

                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="w-full bg-[#66FCF1] hover:bg-[#66FCF1]/95 text-[#0B0C10] font-mono font-bold text-xs py-3.5 rounded-xl cursor-pointer transition-colors shadow-lg shadow-[#66FCF1]/10"
                  >
                    ปิดหน้าจอนี้ / Finish
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULLY FUNCTIONAL BANK, TRUEMONEY & REDEEM CODE TOP-UP DIALOG MODAL */}
      <AnimatePresence>
        {showTopUpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            
            {/* Backdrop lock */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!isTopupLoading) setShowTopUpModal(false); }}
              className="fixed inset-0 bg-black/90 backdrop-blur-md"
            />

            {/* Modal Body Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#11141a] border border-[#45A29E]/30 rounded-2xl max-w-2xl w-full relative z-10 overflow-hidden shadow-2xl flex flex-col my-8 max-h-[90vh]"
            >
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#66FCF1] via-[#45A29E] to-blue-500" />
              
              {/* Header section */}
              <div className="p-6 border-b border-[#45A29E]/10 flex justify-between items-center bg-[#161a23]">
                <div>
                  <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                    <Coins className="w-5 h-5 text-[#66FCF1]" />
                    ระบบเติมเงินเข้าระบบ & เคลมรางวัล
                  </h3>
                  <p className="text-xs text-[#45A29E] font-mono mt-0.5">SECURE MULTI-PAY TUNNEL v2.0</p>
                </div>
                <button
                  onClick={() => setShowTopUpModal(false)}
                  disabled={isTopupLoading}
                  className="text-[#C5C6C7]/60 hover:text-white font-mono text-xs bg-[#1F2833] border border-[#45A29E]/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  ปิดหน้านี้
                </button>
              </div>

              {/* Tab Navigation buttons */}
              <div className="bg-[#0B0C10] p-1 border-b border-[#45A29E]/10 flex">
                <button
                  onClick={() => { setTopUpTab("bank"); setTopupFeedback(null); }}
                  className={`flex-1 py-3 text-xs font-mono font-bold transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
                    topUpTab === "bank"
                      ? "border-[#66FCF1] text-[#66FCF1] bg-[#11141a]/40"
                      : "border-transparent text-[#C5C6C7]/60 hover:text-white"
                  }`}
                >
                  🏦 โอนเงินผ่านธนาคาร / Bank
                </button>
                <button
                  onClick={() => { setTopUpTab("truemoney"); setTopupFeedback(null); }}
                  className={`flex-1 py-3 text-xs font-mono font-bold transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
                    topUpTab === "truemoney"
                      ? "border-[#66FCF1] text-[#66FCF1] bg-[#11141a]/40"
                      : "border-transparent text-[#C5C6C7]/60 hover:text-white"
                  }`}
                >
                  🧧 ซองอั่งเปา TrueMoney
                </button>
                <button
                  onClick={() => { setTopUpTab("redeem"); setTopupFeedback(null); }}
                  className={`flex-1 py-3 text-xs font-mono font-bold transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
                    topUpTab === "redeem"
                      ? "border-[#66FCF1] text-[#66FCF1] bg-[#11141a]/40"
                      : "border-transparent text-[#C5C6C7]/60 hover:text-white"
                  }`}
                >
                  🎟️ เปิดโค้ดรางวัล / Voucher
                </button>
              </div>

              {/* Scrollable Content core */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-[300px] max-h-[55vh]">
                
                {/* Feedback Toast Inline */}
                {topupFeedback && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl text-xs font-mono border leading-relaxed ${
                      topupFeedback.type === "success"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                    }`}
                  >
                    {topupFeedback.type === "success" ? "✓ SUCCESS: " : "❌ ERROR: "} 
                    {topupFeedback.message}
                  </motion.div>
                )}

                {/* TAB 1: BANK TRANSFER */}
                {topUpTab === "bank" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Left: QR Code and Account details */}
                      <div className="bg-[#11141a] border border-[#45A29E]/20 rounded-xl p-4 space-y-4">
                        <p className="text-xs font-bold text-[#66FCF1] font-mono uppercase tracking-widest">
                          สแกนเพื่อรับชำระผ่าน PromptPay QR
                        </p>
                        
                        <div className="mx-auto w-40 h-40 bg-white p-2 rounded-lg border-2 border-[#45A29E]/30 relative group shadow-lg">
                          {/* Simple Mock PromptPay QR Vector representation using beautiful SVG */}
                          <svg viewBox="0 0 100 100" className="w-full h-full text-zinc-950">
                            {/* Simple mock QR pattern */}
                            <path d="M5,5 h30 v30 h-30 z M65,5 h30 v30 h-30 z M5,65 h30 v30 h-30 z" fill="currentColor"/>
                            <path d="M12,12 h16 v16 h-16 z M72,12 h16 v16 h-16 z M12,72 h16 v16 h-16 z" fill="white" />
                            <path d="M20,20 h2 M20,74 h2 M74,20 h2" fill="currentColor" stroke="currentColor"/>
                            <path d="M40,5 h10 v20 h5 v5 h-15 z M50,40 h15 v5 h-5 v10 h-10 z" fill="currentColor" />
                            <path d="M5,40 h10 v5 h5 v10 h-15 z M40,65 h15 v5 h-5 v10 h-10 z" fill="currentColor" />
                            <path d="M65,65 h10 v5 h15 v5 h-25 z" fill="currentColor" />
                            <rect x="35" y="35" width="30" height="30" rx="4" fill="#0C2340"/>
                            <text x="50" y="52" fill="#66FCF1" fontSize="5" fontWeight="bold" textAnchor="middle">PROMPT</text>
                            <text x="50" y="58" fill="#FFFFFF" fontSize="4" textAnchor="middle">PAY</text>
                          </svg>
                          <div className="absolute inset-x-0 bottom-1.5 text-center">
                            <span className="text-[7px] bg-[#0C2340] text-emerald-400 font-bold px-1.5 py-0.5 rounded uppercase">
                              AUTO DETECT SLIP
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs font-mono text-[#C5C6C7]">
                          <div className="flex justify-between border-b border-[#45A29E]/10 pb-1.5">
                            <span className="text-[#45A29E]">ชื่อบัญชี (Account Owner):</span>
                            <span className="text-white font-bold text-right">บริษัท สเปซฟิลเลอร์ ลิมิเต็ด (Space Shop)</span>
                          </div>
                          <div className="flex justify-between border-b border-[#45A29E]/10 pb-1.5">
                            <span className="text-[#45A29E]">เลขอ้างอิงพร้อมเพย์ (PromptPay ID):</span>
                            <span className="text-[#66FCF1] font-bold">098-765-4321</span>
                          </div>
                          <p className="text-[9px] text-amber-300 leading-relaxed italic">
                            *กรุณาสแกนคิวอาร์โค้ดนี้ หรือโอนเข้ารายละเอียด บัญชีออมทรัพย์ ธนาคารกสิกรไทย เลขที่ 123-4-56789-0
                          </p>
                        </div>
                      </div>

                      {/* Right: Slip Upload form */}
                      <form onSubmit={handleBankTransferSubmit} className="space-y-4">
                        <p className="text-xs font-bold text-[#66FCF1] font-mono uppercase tracking-widest">
                          แจ้งสลิปโอนเงินเข้าระบบ
                        </p>

                        <div className="space-y-1.5">
                          <label className="text-[11px] text-[#45A29E] font-mono block">ยอดเงินที่โอนจริง (฿)</label>
                          <input 
                            type="number" 
                            value={bankTransferAmount}
                            onChange={(e) => setBankTransferAmount(Number(e.target.value))}
                            required
                            min="1"
                            disabled={isTopupLoading}
                            placeholder="ระบุยอดเงินโอนจริง เช่น 300"
                            className="w-full bg-[#0B0C10] border border-[#45A29E]/30 focus:border-[#66FCF1] text-xs px-3 py-2.5 rounded-xl text-white outline-none font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] text-[#45A29E] font-mono block flex justify-between items-center">
                            <span>เลขอ้างอิงสลิปโอน (Transaction Ref ID)</span>
                          </label>
                          <input 
                            type="text" 
                            required
                            placeholder="เช่น 202606117282717"
                            value={bankTxRef}
                            onChange={(e) => setBankTxRef(e.target.value)}
                            disabled={isTopupLoading}
                            className="w-full bg-[#0B0C10] border border-[#45A29E]/30 focus:border-[#66FCF1] text-xs px-3 py-2.5 rounded-xl text-white outline-none font-mono placeholder-[#C5C6C7]/20"
                          />
                        </div>

                        <div className="bg-[#1F2833]/30 p-3 rounded-lg border border-[#45A29E]/10 space-y-2">
                          <p className="text-[10px] text-[#45A29E] font-mono leading-relaxed">
                            📷 รูปภาพสลิปหลักฐานโอนเงิน (Payment Slip Reference):
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-[#0B0C10] border border-[#45A29E]/20 overflow-hidden flex items-center justify-center shrink-0">
                              {bankSlipUrl ? (
                                <img src={bankSlipUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                              ) : (
                                <Coins className="w-4 h-4 text-[#45A29E]/40" />
                              )}
                            </div>
                            <span className="text-[10px] text-[#C5C6C7]/60 font-mono italic text-left">
                              {bankSlipUrl ? "✓ ตรวจพบรูปภาพหลักฐานแล้ว" : "ระบบเลือกภาพหลักฐานสลิปให้อัตโนมัติ"}
                            </span>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isTopupLoading}
                          className="w-full bg-gradient-to-r from-[#66FCF1] to-[#45A29E] hover:from-white hover:to-white text-[#0B0C10] font-mono font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-[#66FCF1]/10 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {isTopupLoading ? (
                            <>
                              <span className="w-3 h-3 border-2 border-[#0B0C10]/30 border-t-[#0B0C10] rounded-full animate-spin" />
                              กำลังประมวลสลิปเครดิต...
                            </>
                          ) : (
                            "ส่งหลักฐานสลิป (Submit Bank Slip)"
                          )}
                        </button>
                      </form>

                    </div>
                  </div>
                )}

                {/* TAB 2: TRUEMONEY ENVELOPE */}
                {topUpTab === "truemoney" && (
                  <form onSubmit={handleTrueMoneySubmit} className="space-y-4">
                    <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start gap-3">
                      <div className="text-xl">🧧</div>
                      <div className="space-y-1">
                        <h5 className="text-[#ff5555] text-xs font-bold font-mono">ระบบซองของขวัญทรูมันนี่ (Angpao Multi-Claim)</h5>
                        <p className="text-[11px] text-[#C5C6C7]/90 leading-relaxed">
                          เติมเงินด้วยการสร้างซองของขวัญผ่าน TrueMoney App เลือกแบบสุ่มหรือแบ่งเท่ากัน เพื่อเคลมรับจำนวนเงินสุ่มแจกเข้าบัญชียอดเครดิตคุณทันที
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-[#45A29E] font-mono block">ลิงก์ซองของขวัญทรูมันนี่ (TrueMoney Wallet Gift Link)</label>
                      <input 
                        type="url" 
                        required
                        disabled={isTopupLoading}
                        value={truemoneyEnvelopeUrl}
                        onChange={(e) => setTruemoneyEnvelopeUrl(e.target.value)}
                        placeholder="https://gift.truemoney.com/campaign/?v=xxxxxx"
                        className="w-full bg-[#0B0C10] border border-[#45A29E]/30 focus:border-[#66FCF1] text-xs px-3 py-3 rounded-xl text-white outline-none font-mono placeholder-[#C5C6C7]/20"
                      />
                    </div>



                    <button
                      type="submit"
                      disabled={isTopupLoading}
                      className="w-full bg-[#FF5E00] hover:bg-[#ff7a29] text-white font-mono font-bold text-xs py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#FF5E00]/10"
                    >
                      {isTopupLoading ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          กำลังแกะซองของขวัญ...
                        </>
                      ) : (
                        "เคลมรับเครดิตเงินอั่งเปาทรูมันนี่"
                      )}
                    </button>
                  </form>
                )}

                {/* TAB 3: REDEEM CODE */}
                {topUpTab === "redeem" && (
                  <form onSubmit={handleClaimCodeSubmit} className="space-y-4">
                    <div className="bg-[#11141a] border border-[#45A29E]/20 p-4 rounded-xl flex items-start gap-3">
                      <div className="text-[#66FCF1] text-xl">🎟️</div>
                      <div className="space-y-0.5">
                        <h5 className="text-white text-xs font-bold font-mono">เปิดรับบัตรโค้ดรางวัลเงินสด</h5>
                        <p className="text-[11px] text-[#C5C6C7]/80 leading-relaxed">
                          หากท่านได้รับโค้ดขอบคุณ รหัสเครดิตฟรี หรือบัตรเงินสดจากกลุ่มคอมมูนิตี้ กรุณากรอกด้านล่างเพื่อแลกเงินสดเข้าระบบทันที
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-[#45A29E] font-mono block">โค้ดบัตรรางวัล / CASH GIFT CODE</label>
                      <input 
                        type="text" 
                        required
                        disabled={isTopupLoading}
                        value={redeemCodeStr}
                        onChange={(e) => setRedeemCodeStr(e.target.value)}
                        placeholder="กรอกรหัสโค้ด เช่น CASH-100 หรือ CASH-500"
                        className="w-full bg-[#0B0C10] border border-[#45A29E]/30 focus:border-[#66FCF1] text-xs px-3 py-3 rounded-xl text-white outline-none font-mono uppercase"
                      />
                    </div>



                    <button
                      type="submit"
                      disabled={isTopupLoading}
                      className="w-full bg-[#66FCF1] hover:bg-white text-[#0B0C10] font-mono font-bold text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#66FCF1]/10"
                    >
                      {isTopupLoading ? (
                        <>
                          <span className="w-3 h-3 border-2 border-[#0B0C10]/30 border-t-[#0B0C10] rounded-full animate-spin" />
                          กำลังเปิดรหัสของขวัญ...
                        </>
                      ) : (
                        "เปิดทำงานโค้ดเติมเงิน (Activate Gift Ticket)"
                      )}
                    </button>
                  </form>
                )}

                {/* MY TOPUP HISTORY SUB-PANEL */}
                <div className="border-t border-[#45A29E]/10 pt-4 space-y-3">
                  <p className="text-xs font-bold text-[#C5C6C7] font-mono flex items-center gap-2 text-left">
                    <Clock className="w-3.5 h-3.5 text-[#45A29E]" />
                    ประวัติรายการแจ้งเติมเงินล่าสุดของคุณ ({myTopups.length})
                  </p>

                  {myTopups.length === 0 ? (
                    <p className="text-[10px] text-[#C5C6C7]/40 font-mono italic text-left">ไม่พบประวัติรายการชำระยอดเติมเงินที่คุณทำเข้ามาในบัญชีนี้</p>
                  ) : (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {myTopups.slice(0, 5).map((req) => (
                        <div key={req.id} className="bg-[#0B0C10] border border-[#45A29E]/15 rounded-xl p-3 flex justify-between items-center text-xs font-mono">
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] bg-[#1F2833] text-white px-1.5 py-0.5 rounded font-bold uppercase">
                                {req.method === "bank" ? "🏦 BANK" : req.method === "truemoney" ? "🧧 TrueMoney" : "🎟️ Voucher"}
                              </span>
                              <span className="text-white font-bold">+{req.amount.toLocaleString()} ฿</span>
                            </div>
                            <div className="text-[10px] text-[#C5C6C7]/50 mt-1">
                              ID: {req.id.toUpperCase()} • {new Date(req.createdAt).toLocaleString("th-TH")}
                            </div>
                            {req.transactionRef && (
                              <p className="text-[9px] text-[#45A29E] mt-0.5">REF: {req.transactionRef}</p>
                            )}
                          </div>
                          <div>
                            {req.status === "approved" ? (
                              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                ✓ สำเร็จ (APPROVED)
                              </span>
                            ) : req.status === "rejected" ? (
                              <span className="text-[10px] bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                ❌ ปฏิเสธ (REJECTED)
                              </span>
                            ) : (
                              <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse">
                                ● รอแอดมินตรวจ (PENDING)
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-[9px] text-[#C5C6C7]/50 leading-relaxed font-mono italic text-left">
                    *กรุณารอแอดมินทำการตรวจสอบสลิปฝากเงินของท่าน ระบบจะอนุมัติและปรับเครดิตเข้าประวัติทันทีเมื่อการยืนยันเสร็จสิ้น
                  </p>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
