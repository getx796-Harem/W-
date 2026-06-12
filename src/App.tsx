import React, { useState, useEffect } from "react";
import { Authentication } from "./components/Authentication";
import { ProductCatalog } from "./components/ProductCatalog";
import { AdminPanel } from "./components/AdminPanel";
import { BackgroundEffect } from "./components/BackgroundEffect";
import { DevToolsShield } from "./components/DevToolsShield";
import { User } from "./types";
import { db } from "./dbMock";
import { sendDiscordWebhook } from "./utils/discord";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [appInitializing, setAppInitializing] = useState(true);

  // Check if session is stored locally to persist experience
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cyber_store_active_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        // Sync balance from our main users storage mock to keep it consistent
        const allUsers = db.getUsers();
        const activeDbUser = allUsers.find(u => u.id === parsed.id);
        if (activeDbUser) {
          setUser(activeDbUser);
        } else {
          setUser(parsed);
        }
      }
    } catch (e) {
      console.error("Local session loading failed", e);
    } finally {
      setAppInitializing(false);
    }
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem("cyber_store_active_user", JSON.stringify(loggedInUser));

    // Save user to active list if not already present
    const existingUsers = db.getUsers();
    if (!existingUsers.some(u => u.id === loggedInUser.id)) {
      existingUsers.push(loggedInUser);
      db.saveUsers(existingUsers);

      // Trigger Discord signup announcement
      sendDiscordWebhook({
        title: "👤 สมาชิกใหม่เข้าสู่ระบบสำเร็จ! / New User Registered",
        description: `มีบัญชีผู้ใช้งานใหม่ลงทะเบียนเข้าร่วมแพลตฟอร์มสำเร็จเรียบร้อยแล้ว`,
        color: 15855631, // Gold
        fields: [
          { name: "ชื่อผู้ใช้ (Username)", value: `\`${loggedInUser.username}\``, inline: true },
          { name: "ID บัญชี (User ID)", value: `\`${loggedInUser.id}\``, inline: true },
          { name: "ช่องทาง (Platform)", value: `\`${loggedInUser.platform.toUpperCase()}\``, inline: true },
          { name: "อีเมล (Email Address)", value: loggedInUser.email || "`ไม่ระบุ`", inline: false },
          { name: "เงินตั้งต้น (Initial Balance)", value: `**${loggedInUser.balance.toLocaleString()} ฿**`, inline: true }
        ],
        thumbnailUrl: loggedInUser.avatarUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150"
      }, "enableSignup");
    }
  };


  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("cyber_store_active_user");
  };

  const handleRefreshUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("cyber_store_active_user", JSON.stringify(updatedUser));
  };

  if (appInitializing) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center font-mono text-xs text-brand-silver/50">
        <div className="space-y-4 text-center">
          <div className="w-8 h-8 border-2 border-brand-cyan/20 border-t-brand-cyan rounded-full animate-spin mx-auto" />
          <p className="animate-pulse tracking-widest text-[#66FCF1]">LOADING CORES...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen UniContainer font-sans bg-brand-bg text-brand-silver relative overflow-hidden flex flex-col justify-between select-none">
      
      {/* Background canvas effects active on all pages */}
      <BackgroundEffect />

      {/* Extreme DevOps F12/Inspect anti-intrusion safety shield */}
      <DevToolsShield currentUser={user} />

      {/* Main Page routing */}
      <div className="flex-1 w-full flex flex-col justify-between min-h-0 relative z-10">
        {user === null ? (
          <Authentication onLoginSuccess={handleLoginSuccess} />
        ) : (
          <main className="flex-1 flex flex-col">
            <ProductCatalog 
              user={user} 
              onLogout={handleLogout} 
              onOpenAdmin={() => setIsAdminOpen(true)}
              onRefreshUser={handleRefreshUser}
            />

            {/* Admin Panel overlay mount */}
            {isAdminOpen && (
              <AdminPanel onClose={() => setIsAdminOpen(false)} />
            )}
          </main>
        )}
      </div>

      {/* Humble Footer containing system copyright */}
      <footer className="w-full text-center py-6 font-mono text-[10px] text-brand-silver/55 tracking-widest relative z-25 bg-brand-sidebar/40 border-t border-brand-card/30">
        CYBER CORE DIGITAL AUTO-DELIVERY ARCHITECTURE © 1997 - {new Date().getFullYear()} ALL RIGHTS RESERVED.
      </footer>
    </div>
  );
}
