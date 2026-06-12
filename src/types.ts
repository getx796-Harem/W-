export interface Category {
  id: string;
  name: string;
  icon: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  createdAt: number;
}

export interface StockKey {
  id: string;
  productId: string;
  code: string;
  isUsed: boolean;
  usedAt?: number;
  orderId?: string;
}

export interface Order {
  id: string;
  userId: string;
  username: string;
  loginPlatform: "discord" | "google" | "email";
  productId: string;
  productName: string;
  price: number;
  status: "pending" | "completed" | "failed" | "refunded";
  deliveredCode?: string;
  createdAt: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  platform: "discord" | "google" | "email";
  balance: number;
  isAdmin: boolean;
}

export interface TopupRequest {
  id: string;
  userId: string;
  username: string;
  method: "bank" | "truemoney";
  amount: number;
  slipUrl?: string; // Base64 slip image data or mock image URL
  transactionRef?: string; // Transaction reference or slip ID
  rawEnvelopeUrl?: string; // TrueMoney gift link
  status: "pending" | "approved" | "rejected";
  createdAt: number;
  approvedAt?: number;
}

export interface RedeemCode {
  id: string;
  code: string;
  type: "cash" | "discount_percent" | "discount_flat";
  value: number;
  expiryDate: number; // timestamp
  usageLimit: number;
  timesClaimed: number;
  claimedBy: string[]; // User IDs who claimed this
  createdAt: number;
}

export interface DiscordConfig {
  webhookUrl: string;
  webhookRefillUrl?: string;
  webhookSignupUrl?: string;
  webhookPurchaseUrl?: string;
  webhookTopUpUrl?: string;
  enableRefill: boolean;
  enableSignup: boolean;
  enablePurchase: boolean;
  enableTopUp: boolean;
}
