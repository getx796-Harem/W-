import React, { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import { 
  ShieldAlert, 
  MapPin, 
  Globe, 
  Cpu, 
  Terminal, 
  Wifi, 
  AlertOctagon, 
  Volume2, 
  VolumeX, 
  Eye, 
  Lock, 
  Unlock,
  Maximize2
} from "lucide-react";
import { User } from "../types";
import { getDiscordConfig } from "../utils/discord";

interface DevToolsShieldProps {
  currentUser: User | null;
}

interface IPInfo {
  ip: string;
  city: string;
  region: string;
  country_name: string;
  org: string;
  latitude: number;
  longitude: number;
  network?: string;
  postal?: string;
}

// Global variables to safely persist Web Audio state across HMR/render loops
let audioCtx: AudioContext | null = null;
let oscGroup: any[] = [];
let soundInterval: any = null;

export function DevToolsShield({ currentUser }: DevToolsShieldProps) {
  const [intruded, setIntruded] = useState(false);
  const [ipInfo, setIpInfo] = useState<IPInfo | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [soundMuted, setSoundMuted] = useState(false);
  const [bypassInput, setBypassInput] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  
  // Ref to track if we've already handled the active intrusion to avoid double-processing
  const activeTriggerRef = useRef(false);

  // Initialize event hooks to guard DevTools / F12 activation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. F12 key (code 123)
      // 2. Ctrl + Shift + I (Option + Cmd + I on Mac)
      // 3. Ctrl + Shift + C (Option + Cmd + C on Mac)
      // 4. Ctrl + Shift + J
      // 5. Ctrl + U (View Source)
      const isDevToolsKey = 
        e.code === "F12" || 
        e.keyCode === 123 ||
        (e.ctrlKey && e.shiftKey && (e.key === "i" || e.key === "I" || e.key === "c" || e.key === "C" || e.key === "j" || e.key === "J")) ||
        (e.metaKey && e.altKey && (e.key === "i" || e.key === "I" || e.key === "c" || e.key === "C" || e.key === "j" || e.key === "J")) ||
        ((e.ctrlKey || e.metaKey) && (e.key === "u" || e.key === "U"));

      if (isDevToolsKey) {
        e.preventDefault();
        triggerSecurityDefense();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      // Block standard right-click and count it as a minor probe attempt
      e.preventDefault();
      addLog("⚠️ BLOCKED SECONDARY VIEWPORT CONTEXT PROBE (RIGHT CLICK)");
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("contextmenu", handleContextMenu, { capture: true });

    // Periodic detection check of viewport offsets (inspect window docking detection)
    const checkViewportDiscrepancy = setInterval(() => {
      if (activeTriggerRef.current) return;
      
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;

      // If dimensions are significantly different and not zoomed, DevTools is likely docked
      if (widthDiff > threshold || heightDiff > threshold) {
        // Prevent false triggers on startup by checking active session time
        if (performance.now() > 2000) {
          triggerSecurityDefense();
        }
      }
    }, 1200);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("contextmenu", handleContextMenu, { capture: true });
      clearInterval(checkViewportDiscrepancy);
      stopAlertSound();
    };
  }, []);

  // Web Audio Synth alarm generator
  const startAlertSound = () => {
    if (soundMuted) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }
      
      // Stop existing to prevent duplicate sirens
      stopAlertSound();

      // Low persistent digital hum
      const baseOsc = audioCtx.createOscillator();
      const baseGain = audioCtx.createGain();
      baseOsc.type = "sawtooth";
      baseOsc.frequency.setValueAtTime(45, audioCtx.currentTime); 
      baseGain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      baseOsc.connect(baseGain);
      baseGain.connect(audioCtx.destination);
      baseOsc.start();
      oscGroup.push(baseOsc);

      // Cyber sound sweeping sweep siren
      soundInterval = setInterval(() => {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const sirenOsc1 = audioCtx.createOscillator();
        const sirenGain1 = audioCtx.createGain();
        
        sirenOsc1.type = "sine";
        // Frequency sliding sweep
        sirenOsc1.frequency.setValueAtTime(600, now);
        sirenOsc1.frequency.linearRampToValueAtTime(1200, now + 0.25);
        sirenOsc1.frequency.linearRampToValueAtTime(600, now + 0.5);
        
        sirenGain1.gain.setValueAtTime(0.05, now);
        sirenGain1.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
        
        sirenOsc1.connect(sirenGain1);
        sirenGain1.connect(audioCtx.destination);
        sirenOsc1.start();
        sirenOsc1.stop(now + 0.5);
      }, 500);

    } catch (e) {
      console.warn("Browser blocked Web Audio API dynamic startup", e);
    }
  };

  const stopAlertSound = () => {
    if (soundInterval) {
      clearInterval(soundInterval);
      soundInterval = null;
    }
    oscGroup.forEach(osc => {
      try { osc.stop(); } catch(err){}
    });
    oscGroup = [];
  };

  const addLog = (text: string) => {
    setLogs(prev => [...prev.slice(-30), `[${new Date().toLocaleTimeString()}] ${text}`]);
  };

  // Convert base64 visual capture string into Blob for file uploading
  const base64ToBlob = (base64Str: string): Blob => {
    const parts = base64Str.split(",");
    const byteString = atob(parts[1]);
    const mimeString = parts[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  // Safe wrapper trigger preventing loop conflicts
  const triggerSecurityDefense = async () => {
    if (activeTriggerRef.current) return;
    activeTriggerRef.current = true;
    
    setIntruded(true);
    addLog("🔴 [INTELLIGENCE] SHIELD INTERCEPT ACTIVATED: DEVTOOLS DEVIATION DETECTED!");
    startAlertSound();

    // 1. SILENT CAPTURED LANDSCAPE SCREENSHOT
    let capturedBase64: string | null = null;
    try {
      addLog("📸 [LANDSCAPE] COMPILING SILENT VIEWPORT FRAMEBUFFER RENDER...");
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#0B0C10",
        onclone: (clonedDoc) => {
          // 1. Clean inline styles on elements that could contain unsupported colors
          const allElements = clonedDoc.getElementsByTagName("*");
          for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i] as HTMLElement;
            if (el.getAttribute && el.getAttribute("style")) {
              let styleAttr = el.getAttribute("style") || "";
              if (styleAttr.includes("oklch") || styleAttr.includes("oklab") || styleAttr.includes("color-mix")) {
                styleAttr = styleAttr
                  .replace(/oklch\([^)]+\)/gi, "rgb(102, 252, 241)")
                  .replace(/oklab\([^)]+\)/gi, "rgb(69, 162, 158)")
                  .replace(/color-mix\([^)]+\)/gi, "rgb(31, 40, 51)");
                el.setAttribute("style", styleAttr);
              }
            }
          }

          // 2. Clean internal style blocks dynamically
          const styleTags = clonedDoc.getElementsByTagName("style");
          for (let i = 0; i < styleTags.length; i++) {
            const style = styleTags[i];
            if (style.innerHTML) {
              let css = style.innerHTML;
              if (css.includes("oklch") || css.includes("oklab") || css.includes("color-mix")) {
                css = css
                  .replace(/oklch\([^)]+\)/gi, "rgb(102, 252, 241)")
                  .replace(/oklab\([^)]+\)/gi, "rgb(69, 162, 158)")
                  .replace(/color-mix\([^)]+\)/gi, "rgb(31, 40, 51)");
                style.innerHTML = css;
              }
            }
          }

          // 3. Intercept clonedDoc styleSheets and safely drop any modern CSS rules that html2canvas cannot parse
          try {
            const sheets = clonedDoc.styleSheets;
            for (let i = 0; i < sheets.length; i++) {
              const sheet = sheets[i] as CSSStyleSheet;
              try {
                const rules = sheet.cssRules || sheet.rules;
                if (!rules) continue;
                for (let j = rules.length - 1; j >= 0; j--) {
                  const rule = rules[j] as CSSRule;
                  const cssText = rule.cssText || "";
                  if (cssText.includes("oklch") || cssText.includes("oklab") || cssText.includes("color-mix")) {
                    sheet.deleteRule(j);
                  }
                }
              } catch (e) {
                // Ignore CORS checks for external style sheets
              }
            }
          } catch (e) {
            // Ignore stylesheet traversal failures
          }
        }
      });
      capturedBase64 = canvas.toDataURL("image/png");
      setScreenshotUrl(capturedBase64);
      addLog("✓ [LANDSCAPE] COMPRESSION ENCODING SECURED (Base64 Binary Matrix)");
    } catch (err) {
      console.error("Layout recording crashed", err);
      addLog("⚠️ [LANDSCAPE] SCREEN RENDER FAILURE (DOM Sandboxed / Cross-Origin limitations)");
    }

    // 2. RETRIEVE CLIENT IP / GEOGRAPHIC METADATA
    let derivedInfo: IPInfo | null = null;
    try {
      addLog("🌐 [NETWORK] TARGETING AUDIT CHANNELS AND IP HOPS...");
      // Try ipapi.co first
      const resp = await fetch("https://ipapi.co/json/");
      if (resp.ok) {
        derivedInfo = await resp.json();
      } else {
        // Backup: ip-api.com
        const backup = await fetch("https://ip-api.com/json/");
        if (backup.ok) {
          const raw = await backup.json();
          derivedInfo = {
            ip: raw.query,
            city: raw.city,
            region: raw.regionName,
            country_name: raw.country,
            org: raw.isp,
            latitude: raw.lat,
            longitude: raw.lon,
            network: raw.as
          };
        }
      }
    } catch (err) {
      console.warn("Primary IP mapping failure Hops", err);
    }

    if (derivedInfo) {
      setIpInfo(derivedInfo);
      addLog(`✓ [NETWORK] IP ISOLATED: ${derivedInfo.ip} | ${derivedInfo.org}`);
      addLog(`✓ [GEOLOCATION] LOCALIZED: ${derivedInfo.city}, ${derivedInfo.country_name}`);
    } else {
      addLog("🔴 [NETWORK] DIRECT LOOKUP BLOCKED, ATTEMPTING METADATA APPROXIMATIONS");
    }

    // 3. SECURELY DISPATCH LOGS AND FILE TO ALL WEBHOOKS
    setIsSending(true);
    try {
      const config = getDiscordConfig();
      // Extract target webhook URLs
      const targetUrls = [
        config.webhookUrl,
        config.webhookSignupUrl,
        config.webhookRefillUrl,
        config.webhookPurchaseUrl,
        config.webhookTopUpUrl
      ].filter(u => u && u.startsWith("http"));

      if (targetUrls.length > 0) {
        addLog(`🗼 [RELAY] DISTRIBUTING SECURITY MEMORANDUMS TO DISCORD SECURE RECIPIENTS (${targetUrls.length})...`);
        
        // Prepare Multi-part form payload to deliver actual image representation
        const nowStr = new Date().toLocaleString("th-TH");
        const payloadJson = {
          embeds: [
            {
              title: "🚨 ANTI-INTRUSION DEFENSE RADAR INTERCEPTED",
              description: `🔴 **แจ้งเตือนความปลอดภัยสูงสุด: ตรวจพบผู้ใช้งานพยายามแกะซอร์สโค้ด (DevTools / F12 Inspect Bypass)**\nระบบได้เข้าระเบียบป้องกันความปลอดภัยเพื่อพิทักษ์ข้อมูลร้านค้า ดึงบันทึกข้อมูล พร้อมทำการแคปหน้าจอเก็บไว้เป็นหลักฐานหลักทันทีโดยอัตโนมัติ`,
              color: 16711680, // Alarm red
              fields: [
                { name: "👤 สมาชิกเป้าหมาย (Depositor ID)", value: `\`${currentUser?.username || "Guest / ยังไม่ได้ล๊อกอิน"}\` (ID: \`${currentUser?.id || "N/A"}\`)`, inline: false },
                { name: "🌐 เลขไอพีเครื่อง (Client IP Address)", value: `**${derivedInfo?.ip || "ตรวจไม่สำเร็จ / Cloudflare Tunnel Proxy"}**`, inline: true },
                { name: "⚡ หน่วยงานเครือข่ายเน็ต (ISP Provider)", value: `\`${derivedInfo?.org || "ไม่มีข้อมูลผู้ให้บริการเน็ต"}\``, inline: true },
                { name: "📍 ที่อยู่เครื่อง / เมือง-ประเทศ (Locations)", value: `\`${derivedInfo?.city || "Unknown City"}, ${derivedInfo?.region || "Unknown Region"}, ${derivedInfo?.country_name || "Unknown Country"}\``, inline: false },
                { name: "🧭 พิกัดกูเกิลพิกเซล (GPS Coordinates)", value: `\`${derivedInfo?.latitude || "N/A"}, ${derivedInfo?.longitude || "N/A"}\``, inline: true },
                { name: "💻 ข้อมูลระบบ OS/บราวเซอร์ (User Agent)", value: `\`${navigator.userAgent}\``, inline: false },
                { name: "📐 สัดส่วนหน้าจอ (Desktop Resolution)", value: `\`${window.innerWidth} x ${window.innerHeight} px\``, inline: true },
                { name: "⏰ เวลาเกิดเหตุการณ์ (Timestamp)", value: `\`${nowStr}\``, inline: true }
              ],
              image: { url: "attachment://screenshot.png" },
              footer: {
                text: "NEXUS DEFENSIVE SHIELD CAPTURE SYSTEM",
                icon_url: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&q=80&w=150"
              }
            }
          ]
        };

        // We cycle through each unique Webhook address
        for (const url of targetUrls) {
          const formData = new FormData();
          formData.append("payload_json", JSON.stringify(payloadJson));

          if (capturedBase64) {
            const fileBlob = base64ToBlob(capturedBase64);
            formData.append("files[0]", fileBlob, "screenshot.png");
          }

          await fetch(url, {
            method: "POST",
            body: formData
          });
        }
        addLog("✓ [RELAY] PACKET METADATA AND GRAPHICS SECURELY TRANSMITTED!");
      } else {
        addLog("🔔 [RELAY] LOCAL DIAGNOSTIC DUMP: DISCORD WEBHOOK LOGS NOT LINKED IN CONFIG.");
      }
    } catch (webhookErr) {
      console.error("Payload transmission failed", webhookErr);
      addLog("⚠️ [RELAY] TRANSMISSION HOP ERROR (Network unreachable or rate limits active)");
    } finally {
      setIsSending(false);
    }
  };

  // Deescalate or debug disarm sequence
  const handleDisarm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = bypassInput.trim().toUpperCase();
    
    // Admins or holders of standard compliance PIN code "ADMIN" can disarm
    if (cleanInput === "ADMIN" || cleanInput === "DISARM" || currentUser?.isAdmin) {
      stopAlertSound();
      setIntruded(false);
      setBypassInput("");
      setScreenshotUrl(null);
      activeTriggerRef.current = false;
      addLog("✓ [SECURITY] SAFE SYSTEM STATE DE-ESCALATED: MONITOR RESUMED.");
    } else {
      setBypassInput("");
      addLog("❌ [DE-ESCALATE] COMPLIANCE CERTIFICATE DENIED. DISARM ACCESS PIN INCORRECT.");
    }
  };

  const toggleMute = () => {
    if (soundMuted) {
      setSoundMuted(false);
      // Restart loop
      if (intruded) startAlertSound();
    } else {
      setSoundMuted(true);
      stopAlertSound();
    }
  };

  if (!intruded) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-[#050608] text-white flex flex-col justify-between overflow-y-auto select-none font-mono">
      {/* Visual scanning grid backdrop layer */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(235,50,50,0.12)_0%,rgba(0,0,0,0.95)_90%)] z-0" />
      <div className="absolute inset-x-0 h-1 bg-red-600/30 animate-[bounce_5s_infinite] pointer-events-none z-10 blur-sm" style={{ animationTimingFunction: "ease-in-out" }} />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] pointer-events-none z-10 bg-[length:100%_4px,6px_100%]" />

      {/* Cyber shield alert header */}
      <header className="border-b border-red-500/30 bg-red-950/20 px-6 py-4 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg animate-pulse">
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider text-red-500 font-display">NEXUS ANTI-INTRUSION DEFENSE ACTIVE</h1>
            <p className="text-[10px] text-zinc-400">UNAUTHORIZED INSPECTION VECTOR SHUNNED BY CORE INTEL</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleMute}
            className="p-2 rounded-lg border border-red-500/20 bg-red-950/10 text-red-400 hover:text-white transition-colors cursor-pointer text-xs"
          >
            {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-bounce" />}
          </button>
          <span className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/30 font-bold px-3 py-1 rounded">
            LEVEL-4 LOCKED
          </span>
        </div>
      </header>

      {/* Main compliance telemetry output layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-20">
        
        {/* Column Left: Visual layout showing the captured viewport & maps */}
        <section className="lg:col-span-7 space-y-6 flex flex-col justify-start">
          
          {/* Captured Screenshot Frame representing silently taken UI screen grabs */}
          <div className="bg-[#0b0c10] border border-red-500/30 rounded-2xl p-4 shadow-[0_0_20px_rgba(239,68,68,0.1)] space-y-3">
            <div className="flex justify-between items-center font-mono text-[11px] text-red-400 font-bold">
              <span className="flex items-center gap-1.5 uppercase">
                <Eye className="w-4 h-4 animate-pulse text-red-500" /> screenshot_cache.png (Captured Silently)
              </span>
              <span className="text-zinc-500 font-light text-[9px]">{window.innerWidth} x {window.innerHeight} px</span>
            </div>
            
            <div className="relative aspect-video rounded-xl border border-zinc-800 bg-black/60 overflow-hidden flex items-center justify-center group">
              {screenshotUrl ? (
                <>
                  <img 
                    src={screenshotUrl} 
                    alt="Intruding Viewport Screen Grab" 
                    className="w-full h-full object-cover opacity-80 filter brightness-90 grayscale-[25%]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-red-950/40 to-transparent pointer-events-none" />
                  <div className="absolute top-3 left-3 bg-red-650 text-[#0b0c10] bg-red-500 font-bold text-[9px] uppercase px-1.5 py-0.5 rounded tracking-widest animate-pulse">
                    PRIMARY EXHIBIT A
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center p-6">
                  <div className="w-8 h-8 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
                  <p className="text-[10px] text-zinc-400 font-mono">RENDERING SCREEN LAYOUT MATRICES...</p>
                </div>
              )}
              {/* Retro monitor look */}
              <div className="absolute inset-0 pointer-events-none border border-red-500/20 rounded-xl" />
            </div>
            <p className="text-[10px] text-zinc-500 text-left">
              * ภาพด้านบนคือส่วนหนึ่งของหลักฐานโครงร่าง DOM Layout ของคุณก่อนที่จะกระทำการละเมิดเงื่อนไขเปิด F12 บันทึกหลักฐานนี้เรียบร้อยแล้ว
            </p>
          </div>

          {/* Precise OpenStreetMap Embedded visual map for precise pinpoint */}
          {ipInfo && ipInfo.latitude && ipInfo.longitude && (
            <div className="bg-[#0b0c10] border border-zinc-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-zinc-400 text-[11px] font-bold">
                <MapPin className="w-4 h-4 text-red-500" />
                <span>📍 NETWORK COORDINATES MAP (approximate)</span>
              </div>
              <div className="h-56 rounded-xl overflow-hidden border border-zinc-800 relative bg-black/40">
                <iframe
                  title="Target IP Physical Coordinates map"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight={0}
                  marginWidth={0}
                  src={`https://maps.google.com/maps?q=${ipInfo.latitude},${ipInfo.longitude}&z=13&output=embed`}
                  className="filter invert contrast-125 opacity-70"
                />
                <div className="absolute bottom-2 right-2 bg-black/90 border border-zinc-700 text-[9px] px-2 py-0.5 rounded text-zinc-400">
                  LAT: {ipInfo.latitude} | LON: {ipInfo.longitude}
                </div>
              </div>
            </div>
          )}

        </section>

        {/* Column Right: Terminal diagnosis outputs & bypass PIN codes */}
        <section className="lg:col-span-5 space-y-6 flex flex-col h-full justify-between">
          
          {/* Target Network & Identity Audit Panel details */}
          <div className="bg-[#11141a]/60 border border-zinc-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-xs font-bold text-red-400 tracking-wider uppercase border-b border-zinc-800 pb-3 flex items-center gap-2 font-mono">
              <Cpu className="w-4 h-4 text-red-500" /> TARGET ENVIRONMENT DIAGNOSTICS
            </h2>

            <div className="space-y-4 text-xs font-mono">
              <div className="bg-black/40 border border-zinc-800 p-3 rounded-lg flex justify-between items-center">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-zinc-500">USER IDENTITY IP (ไอพีสิทธิ์เครื่อง)</p>
                  <p className="text-red-500 font-bold tracking-widest text-[13px]">{ipInfo?.ip || "SCANNING HETZNER HIERARCHY..."}</p>
                </div>
                <Globe className="w-5 h-5 text-zinc-600 shrink-0" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/40 border border-zinc-800 p-3 rounded-lg space-y-0.5">
                  <p className="text-[9px] text-zinc-500">CITY/REGION (จังหวัดคาดคะเน)</p>
                  <p className="text-zinc-200 font-semibold">{ipInfo?.city || "ดึงข้อมูล..."}</p>
                </div>
                <div className="bg-black/40 border border-zinc-800 p-3 rounded-lg space-y-0.5">
                  <p className="text-[9px] text-zinc-500">COUNTRY (ประเทศเป้าหมาย)</p>
                  <p className="text-zinc-200 font-semibold">{ipInfo?.country_name || "ดึงข้อมูล..."}</p>
                </div>
              </div>

              <div className="bg-black/40 border border-zinc-800 p-3 rounded-lg space-y-1">
                <p className="text-[10px] text-zinc-500 uppercase">TELECOM ISP (ค่ายบริการ/ผู้ให้บริการเครือข่าย)</p>
                <p className="text-[#66FCF1] font-semibold text-[11px] truncate">{ipInfo?.org || "ดึงข้อมูลโครงข่ายไอทีสัญญาณ..."}</p>
              </div>

              <div className="bg-black/40 border border-zinc-800 p-3 rounded-lg space-y-1 text-left text-[11px] space-y-2">
                <p className="text-[9px] text-zinc-500 uppercase">🖥️ CLIENT WORKSTATION ARCHITECTURE</p>
                <div className="text-[10px] text-zinc-400 space-y-1 font-mono">
                  <p>OS Platform: <span className="text-white font-bold">{navigator.platform}</span></p>
                  <p className="truncate">Browser Engine: <span className="text-white font-bold">{navigator.userAgent.split(" ").slice(-2).join(" ")}</span></p>
                  <p>Active Portal: <span className="text-red-400 font-bold">{currentUser?.username || "Guest (Unregistered)"}</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Secure Interactive Terminal Output Logs (Dynamic traces) */}
          <div className="bg-black border border-zinc-800 rounded-2xl p-4 flex-1 min-h-[160px] flex flex-col justify-between overflow-hidden">
            <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-2 text-[10px] text-zinc-500 uppercase font-bold">
              <Terminal className="w-3.5 h-3.5 text-red-500 animate-pulse" /> Live Audit Log Handoff Traces
            </div>
            
            <div className="flex-1 overflow-y-auto py-2.5 space-y-1 font-mono text-[9px] text-zinc-400 max-h-[180px] scrollbar-thin scrollbar-thumb-zinc-800 text-left">
              {logs.length === 0 ? (
                <p className="text-zinc-600 italic">SYSTEM INITIALIZED...</p>
              ) : (
                logs.map((log, index) => (
                  <p key={index} className={log.includes("✓") ? "text-emerald-400" : log.includes("⚠️") || log.includes("🔴") ? "text-red-400 font-bold" : "text-zinc-400"}>
                    {log}
                  </p>
                ))
              )}
              {isSending && (
                <p className="text-[#66FCF1] animate-pulse">⚡ DISCORD LOG INTEGRITY RELAY TRANSMITTING IN REALTIME...</p>
              )}
            </div>
          </div>

          {/* compliance system disarm authorization prompt (Keeps developers from permanent locking) */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase mb-1">
              <Lock className="w-3.5 h-3.5 text-amber-500" /> Authorized Developer Compliance Disarm
            </div>
            
            <form onSubmit={handleDisarm} className="flex gap-2">
              <input
                type="text"
                placeholder="กรอก PIN หรือพิมพ์ 'ADMIN' เพื่อปลดล็อค"
                value={bypassInput}
                onChange={(e) => setBypassInput(e.target.value)}
                className="flex-1 bg-black/60 border border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500/50 uppercase"
              />
              <button
                type="submit"
                className="bg-red-500 hover:bg-red-650 text-[#0b0c10] hover:text-white px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all uppercase flex items-center gap-1 shrink-0"
              >
                <Unlock className="w-3.5 h-3.5" /> ปลดล็อค
              </button>
            </form>
            <p className="text-[9px] text-zinc-500 text-left">
              * สำหรับผู้พัฒนาเว็บ / เจ้าของร้านค้า: สามารถพิมพ์คำว่า <span className="text-[#66FCF1] font-bold">"ADMIN"</span> หรือใช้ไอดี แอดมิน เพื่อข้ามระบบล็อคป้องกันเครื่องนี้ได้ทันที
            </p>
          </div>

        </section>
      </main>

      {/* Compliance footprint footer */}
      <footer className="border-t border-zinc-800 bg-[#050608] py-4 text-center text-[9px] text-zinc-500 tracking-wider">
        INTELLIGENT REVERSE ENGINEERING DEFENSE ENGINE • SYSTEM AUDITED FROM IP {ipInfo?.ip || "LOCAL_HOST"}
      </footer>
    </div>
  );
}
