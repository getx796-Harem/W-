import { DiscordConfig } from "../types";

const DEFAULT_CONFIG: DiscordConfig = {
  webhookUrl: "",
  webhookRefillUrl: "",
  webhookSignupUrl: "",
  webhookPurchaseUrl: "",
  webhookTopUpUrl: "",
  enableRefill: true,
  enableSignup: true,
  enablePurchase: true,
  enableTopUp: true,
};

export const getDiscordConfig = (): DiscordConfig => {
  try {
    const raw = localStorage.getItem("cyber_store_discord_config");
    if (raw) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error("Failed to load discord config", e);
  }
  return DEFAULT_CONFIG;
};

export const saveDiscordConfig = (config: DiscordConfig): void => {
  try {
    localStorage.setItem("cyber_store_discord_config", JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save discord config", e);
  }
};

// Main function to trigger Discord notifications via webhooks
export const sendDiscordWebhook = async (
  payload: {
    title: string;
    description: string;
    color: number;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
    thumbnailUrl?: string;
  },
  configType: keyof Omit<DiscordConfig, "webhookUrl" | "webhookRefillUrl" | "webhookSignupUrl" | "webhookPurchaseUrl" | "webhookTopUpUrl">
) => {
  const config = getDiscordConfig();
  
  // Decide which webhook URL to use: specific URL first, else fallback to the major general webhookUrl
  let targetWebhookUrl = "";
  if (configType === "enableRefill") {
    targetWebhookUrl = config.webhookRefillUrl || config.webhookUrl;
  } else if (configType === "enableSignup") {
    targetWebhookUrl = config.webhookSignupUrl || config.webhookUrl;
  } else if (configType === "enablePurchase") {
    targetWebhookUrl = config.webhookPurchaseUrl || config.webhookUrl;
  } else if (configType === "enableTopUp") {
    targetWebhookUrl = config.webhookTopUpUrl || config.webhookUrl;
  } else {
    targetWebhookUrl = config.webhookUrl;
  }

  if (!targetWebhookUrl) {
    console.log("Discord Webhook is not configured for this category. Skipping notification:", payload.title);
    return;
  }

  // Check if this notification subtype is enabled
  if (!config[configType]) {
    console.log(`Notification for ${configType} is disabled/muted.`);
    return;
  }

  const embed: any = {
    title: payload.title,
    description: payload.description,
    color: payload.color,
    timestamp: new Date().toISOString(),
    footer: {
      text: "NEXUS MARKET • Cyber Auto-Delivery",
      icon_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150",
    },
  };

  if (payload.fields) {
    embed.fields = payload.fields;
  }

  if (payload.thumbnailUrl) {
    embed.thumbnail = { url: payload.thumbnailUrl };
  }

  try {
    const response = await fetch(targetWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });

    if (!response.ok) {
      console.warn("Discord Webhook responded with error status:", response.status);
    }
  } catch (error) {
    console.error("Error posting to Discord Webhook:", error);
  }
};

// Send a testing message to confirm the webhook works
export const sendTestWebhook = async (webhookUrl: string): Promise<boolean> => {
  const embed = {
    title: "⚡ ระบบทดสอบการเชื่อมต่อ DISCORD SUCCESSFUL",
    description: "ยินดีด้วย! บอทรับส่งข้อมูลประวัติต่างๆ ปลายทางของร้านค้าได้รับการเปิดใช้งานสำเร็จแล้ว รายการออเดอร์, การเติมคีย์, และสถิติสมาชิกจะถูกอัปเดตแจ้งเตือนทางช่องนี้แบบเรียลไทม์",
    color: 6749425, // #66FCF1 - Cyan
    timestamp: new Date().toISOString(),
    footer: {
      text: "NEXUS MARKET • Discord Bot Setup Verification",
    },
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });
    return response.ok;
  } catch (error) {
    console.error("Test Webhook failed", error);
    return false;
  }
};
