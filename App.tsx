import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Settings as SettingsIcon,
  ShieldAlert,
  Loader2,
  Send,
  Trash2,
  Cpu,
  Sliders,
  CheckCircle2,
  Key,
  Info,
  ChevronRight,
  RefreshCw,
  Plus,
  Clock,
  LogOut,
  SlidersHorizontal,
  X,
  Languages,
  BookOpen,
  Terminal,
  ShieldCheck,
  FileText
} from "lucide-react";
import { Message, ModelOption, Settings } from "./types";

// Supported models based on the official guidelines
const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    description: "Temel metin işleri, hızlı özetleme, sadeleştirme ve genel sohbet için ideal.",
    badge: "Hızlı & Önerilen"
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro (Preview)",
    description: "Derin akıl yürütme, ileri kodlama, mantık ve karmaşık STEM soruları için uygun.",
    badge: "Gelişmiş"
  },
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    description: "Minimum gecikme ve hızlı yanıt süreleri için optimize edilmiş hafif model.",
    badge: "Hafif"
  }
];

// Presets for Custom Rules to make it extremely easy to use
const RULES_PRESETS = [
  {
    title: "Eleştirel & Diyalektik",
    description: "Tezin antitezini de sun, olası mantık hatalarını göster.",
    prompt: "Yanıtlarında her zaman tezin antitezini de sun, olası mantık hatalarını (logical fallacies) açıkça belirt ve her durumu çok yönlü ele al."
  },
  {
    title: "Big-O Kodlama",
    description: "Kod yazarken performans ve karmaşıklık analizi sun.",
    prompt: "Kod yazarken her işlev için mutlaka performans, Big-O karmaşıklığı analizini ekle."
  },
  {
    title: "Sokratik Öğretim",
    description: "Doğrudan cevap verme, düşündürücü sorular sor.",
    prompt: "Kullanıcıya doğrudan cevapları vermek yerine, onları doğru cevaba yönlendirecek felsefi sorular sor."
  },
  {
    title: "ELI5 (Basit Anlatım)",
    description: "Karmaşık konuları 10 yaşında bir çocuğa anlatır gibi basitleştir.",
    prompt: "Konuları 10 yaşındaki bir çocuğun dahi rahatlıkla anlayabileceği analojiler ve günlük yaşam örnekleri ile açıkla."
  },
  {
    title: "Özenli Türkçe",
    description: "Kusursuz Türkçe kuralları.",
    prompt: "Yalnızca kusursuz Türkçe kullan, imla kurallarına dikkat et."
  }
];

// Default Settings
const DEFAULT_SETTINGS: Settings = {
  systemPrompt: "Şu andan itibaren Hyperfocus AI adında, yüksek seviyede odaklanmış, rasyonel ve etik sınırlara bağlı bir yapay zeka asistanısın.",
  rules: "1. Yanıtlarını dürüstlük, netlik ve etik sınırlar çerçevesinde oluştur.\n2. Gereksiz dolaylı cümlelerden kaçın, doğrudan hedefe odaklı cevaplar ver.\n3. Bilgi kaynağı belirsiz olan konularda varsayımlar yerine kanıtlanmış gerçeklere dayan.",
  temperature: 0.7,
  model: "gemini-3.5-flash"
};

export default function App() {
  // Authentication & Activation State (Always expects User's own API Key)
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem("hfa_api_key") || "");
  const [isActivated, setIsActivated] = useState<boolean>(() => localStorage.getItem("hfa_is_activated") === "true");
  
  // Privacy & Terms agreement state for GDPR and Data Integrity compliance
  const [agreedToPrivacyPolicy, setAgreedToPrivacyPolicy] = useState<boolean>(() => localStorage.getItem("hfa_agreed_privacy") === "true");

  // Chat & Configuration States
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("hfa_messages");
    return saved ? JSON.parse(saved) : [];
  });
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Panel Control
  const [showSettingsSidebar, setShowSettingsSidebar] = useState<boolean>(true);
  const [showKeyInfoModal, setShowKeyInfoModal] = useState<boolean>(false);
  const [showPrivacyDetailsModal, setShowPrivacyDetailsModal] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  // Form Settings Settings
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem("hfa_settings");
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // UI Control States
  const [activationError, setActivationError] = useState<string>("");
  const [activationSuccess, setActivationSuccess] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync state changes with localstorage
  useEffect(() => {
    localStorage.setItem("hfa_messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("hfa_settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem("hfa_api_key", apiKey);
    localStorage.setItem("hfa_is_activated", String(isActivated));
    localStorage.setItem("hfa_agreed_privacy", String(agreedToPrivacyPolicy));
  }, [apiKey, isActivated, agreedToPrivacyPolicy]);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle Application Activation
  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError("");
    
    if (!agreedToPrivacyPolicy) {
      setActivationError("Devam etmek için Gizlilik Politikası ve Şartlar beyanını onaylamalısınız.");
      return;
    }

    const actualKeyToVerify = apiKey.trim();

    if (!actualKeyToVerify) {
      setActivationError("Lütfen geçerli bir Google Gemini API anahtarı girin.");
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch("/api/gemini/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: actualKeyToVerify })
      });

      const data = await response.json();

      if (data.success) {
        setActivationSuccess(true);
        setTimeout(() => {
          setIsActivated(true);
          setActivationSuccess(false);
          // Initial greeting message if history is empty
          if (messages.length === 0) {
            setMessages([
              {
                id: "welcome",
                role: "model",
                content: "Greetings. I am running with your custom ruleset. How can we maintain your hyperfocus session today?",
                timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
              }
            ]);
          }
        }, 1200);
      } else {
        setActivationError(data.error || "Girdiğiniz API anahtarı doğrulanamadı. Lütfen kontrol edip tekrar deneyin.");
      }
    } catch (err: any) {
      setActivationError("Sunucu ile iletişim kurulurken bir sorun oluştu.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Chat Message Submit
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    // Prepare message structure for API
    const chatHistoryPayload = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content
    }));

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey,
          model: settings.model,
          messages: chatHistoryPayload,
          systemPrompt: settings.systemPrompt,
          rules: settings.rules,
          temperature: settings.temperature
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const aiMsg: Message = {
          id: Math.random().toString(36).substring(7),
          role: "model",
          content: data.text,
          timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const errorMsg: Message = {
          id: Math.random().toString(36).substring(7),
          role: "model",
          content: `⚠️ **İşlem Başarısız Oldu**: ${data.error || "Yapay zeka yanıt oluştururken bilinmeyen bir hataya rastladı."}`,
          timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      const errorMsg: Message = {
          id: Math.random().toString(36).substring(7),
          role: "model",
          content: `⚠️ **Bağlantı Hatası**: Sunucu API uç noktasına erişilemiyor. Lütfen ağınızı kontrol edin ve tekrar deneyin.`,
          timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Preset Click Handler
  const applyRulePreset = (rulePrompt: string) => {
    setSettings((prev) => {
      const currentRules = prev.rules.trim();
      const combinedRules = currentRules 
        ? `${currentRules}\n- ${rulePrompt}`
        : `- ${rulePrompt}`;
      return { ...prev, rules: combinedRules };
    });
  };

  // Complete Reset Chat
  const triggerClearChatHistory = () => {
    setShowClearConfirm(true);
  };

  const confirmClearChatHistory = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "model",
        content: "Sohbet başarıyla temizlendi. Kuralların korumasında yeni bir derin odaklanma seansına başlamaya hazırsınız.",
        timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
      }
    ]);
    setShowClearConfirm(false);
  };

  // Exit Activation / Deactivate
  const triggerDeactivate = () => {
    setShowLogoutConfirm(true);
  };

  const confirmDeactivate = () => {
    setIsActivated(false);
    localStorage.removeItem("hfa_is_activated");
    setApiKey("");
    setShowLogoutConfirm(false);
  };

  // Format code blocks & normal text lines
  const renderMessageContent = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const withoutTicks = part.slice(3, -3);
        const firstNewLine = withoutTicks.indexOf("\n");
        let language = "code";
        let code = withoutTicks;

        if (firstNewLine !== -1) {
          language = withoutTicks.substring(0, firstNewLine).trim() || "code";
          code = withoutTicks.substring(firstNewLine + 1);
        }

        return (
          <div key={index} className="my-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 overflow-hidden font-mono text-sm max-w-full shadow-md">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-950/80 border-b border-slate-800 text-xs text-slate-400 capitalize">
              <span>{language}</span>
              <button
                onClick={() => navigator.clipboard.writeText(code)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-sans transition-colors cursor-pointer py-1 px-2 rounded hover:bg-slate-855"
              >
                Kopyala
              </button>
            </div>
            <pre className="p-4 overflow-x-auto whitespace-pre-wrap break-all select-text font-mono">
              <code>{code.trim()}</code>
            </pre>
          </div>
        );
      }

      const lines = part.split("\n");
      return (
        <div key={index} className="space-y-2">
          {lines.map((line, lIdx) => {
            if (!line.trim()) return <div key={lIdx} className="h-2" />;

            const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
            const isNumbered = /^\d+\.\s/.test(line.trim());
            const displayLine = isBullet ? line.trim().substring(2) : isNumbered ? line.trim().replace(/^\d+\.\s/, "") : line;

            const formatInline = (textSegment: string) => {
              const boldRegex = /\*\*(.*?)\*\*/g;
              const inlineCodeRegex = /`(.*?)`/g;

              let contentArray: React.ReactNode[] = [textSegment];

              // Bold replacing
              let tempArray: React.ReactNode[] = [];
              for (const item of contentArray) {
                if (typeof item !== "string") {
                  tempArray.push(item);
                  continue;
                }

                const pieces = item.split(boldRegex);
                pieces.forEach((piece, pIndex) => {
                  if (pIndex % 2 === 1) {
                    tempArray.push(<strong key={`b-${pIndex}`} className="font-semibold text-indigo-600">{piece}</strong>);
                  } else {
                    tempArray.push(piece);
                  }
                });
              }
              contentArray = tempArray;

              // Inline code replacing
              tempArray = [];
              for (const item of contentArray) {
                if (typeof item !== "string") {
                  tempArray.push(item);
                  continue;
                }

                const pieces = item.split(inlineCodeRegex);
                pieces.forEach((piece, pIndex) => {
                  if (pIndex % 2 === 1) {
                    tempArray.push(<code key={`c-${pIndex}`} className="px-1.5 py-0.5 rounded bg-slate-100 text-indigo-600 font-mono text-xs border border-slate-200">{piece}</code>);
                  } else {
                    tempArray.push(piece);
                  }
                });
              }
              return tempArray;
            };

            if (isBullet) {
              return (
                <li key={lIdx} className="ml-5 list-disc leading-relaxed text-slate-700">
                  {formatInline(displayLine)}
                </li>
              );
            }

            if (isNumbered) {
              const getNum = line.trim().match(/^(\d+)\.\s/);
              const numStr = getNum ? getNum[1] : "1";
              return (
                <li key={lIdx} className="ml-5 list-decimal leading-relaxed text-slate-700">
                  <span className="font-mono text-xs text-slate-400 mr-1">{numStr}.</span> {formatInline(displayLine)}
                </li>
              );
            }

            return (
              <p key={lIdx} className="leading-relaxed text-slate-700">
                {formatInline(line)}
              </p>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div id="app-root" className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      <AnimatePresence mode="wait">
        {!isActivated ? (
          /* ================= GORGEOUS WHITE BENTO ACTIVATION SCREEN ================= */
          <motion.div
            key="activation-screen"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6"
          >
            <div className="absolute top-6 left-6 flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span className="text-xs font-mono tracking-wider font-semibold uppercase text-slate-500">Focus-Pro-v1 (Kimlik Doğrulama)</span>
            </div>

            <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-lg shadow-slate-200/50 p-6 sm:p-8 relative overflow-hidden">
              {/* Background Bento Grid accent line */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-50/40 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-50/40 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-14 h-14 bg-indigo-650 bg-indigo-650 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-100 text-white">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-850 mb-1">Hyperfocus AI</h1>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Bento Grid Workspace</p>
                <p className="text-slate-550 text-sm leading-relaxed px-1">
                  Güçlü felsefi kurallar, özelleştirilebilir sistem yanıtları ve derin odaklanma yeteneğiyle tasarlanmış gelişmiş yapay zeka deneyimine erişmek için kendi API anahtarınızı tanımlayın.
                </p>
              </div>

              {/* Activation Form */}
              <form onSubmit={handleActivate} className="space-y-5">
                
                {/* Manual API Key input */}
                <div className="space-y-2 bg-slate-50/80 p-4 border border-slate-200 rounded-2xl">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase flex items-center space-x-1.5 font-mono">
                      <Key className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Google Gemini API Key</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowKeyInfoModal(true)}
                      className="text-[11px] text-indigo-600 hover:underline flex items-center space-x-0.5 font-semibold cursor-pointer"
                    >
                      <Info className="w-2.5 h-2.5" />
                      <span>Nasıl Alınır?</span>
                    </button>
                  </div>
                  <input
                    type="password"
                    placeholder="AIzaSy... ile başlayan anahtarınızı buraya yapıştırın"
                    autoComplete="off"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all font-mono placeholder:text-slate-400"
                    required
                  />
                  <p className="text-[10px] text-slate-450 mt-1 pl-1">
                    * Girdiğiniz API anahtarı hiçbir harici veri tabanına kaydedilmez. Doğrudan Google API geçitleriyle iletişim kurulur.
                  </p>
                </div>

                {/* Privacy & Terms Policy Consent Bento Box */}
                <div className="bg-slate-50/55 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="privacy-consent"
                      checked={agreedToPrivacyPolicy}
                      onChange={(e) => setAgreedToPrivacyPolicy(e.target.checked)}
                      className="mt-1 accent-indigo-600 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="privacy-consent" className="text-xs text-slate-600 leading-normal select-none cursor-pointer">
                      Uygulamanın sunduğu <button type="button" onClick={() => setShowPrivacyDetailsModal(true)} className="text-indigo-650 font-bold hover:underline">Veri Gizliliği Sözleşmesi</button>'ni ve <button type="button" onClick={() => setShowPrivacyDetailsModal(true)} className="text-indigo-650 font-bold hover:underline">Kullanım Şartları</button>'nı okudum, anladım ve onaylıyorum.
                    </label>
                  </div>

                  <div className="flex gap-2 bg-white/80 border border-slate-150 p-2.5 rounded-lg text-[10.5px] text-slate-500 leading-tight">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>
                      Girdiğiniz API anahtarı tamamen sizin kontrolünüzdedir. İstediğiniz zaman sağ üst köşeden oturumunuzu sonlandırarak anahtarı sunucu hafızasından silebilirsiniz.
                    </span>
                  </div>
                </div>

                {/* Process Errors */}
                {activationError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex gap-2 font-medium"
                  >
                    <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{activationError}</span>
                  </motion.div>
                )}

                {/* Process Successes */}
                {activationSuccess && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 bg-green-55/10 border border-green-100 text-green-700 rounded-xl text-xs flex items-center gap-2 font-semibold"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>API anahtarı kabul edildi! Bento arayüzü kuruluyor...</span>
                  </motion.div>
                )}

                {/* Verification/Trigger Button */}
                <button
                  type="submit"
                  disabled={isVerifying || !agreedToPrivacyPolicy}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-150 disabled:text-slate-450 text-white font-semibold px-4 py-3 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-100 disabled:shadow-none active:scale-98 cursor-pointer text-sm"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>API Anahtarı Doğrulanıyor...</span>
                    </>
                  ) : (
                    <>
                      <span>Doğrula ve Çalıştır</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          /* ================= BRIGHT BENTO GRID INTERFACE ================= */
          <motion.div
            key="chat-interface"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 space-y-6 max-w-[1700px] mx-auto w-full h-screen overflow-hidden"
          >
            {/* Top Header Bento Section */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
              <div>
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-800">Hyperfocus AI</h1>
                </div>
                <p className="text-slate-550 text-xs font-semibold uppercase tracking-wider mt-1 flex items-center gap-1 font-mono">
                  <span>Operational Mode</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-indigo-600">Focus-Pro-v1</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-full border border-green-100">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-semibold text-green-700 uppercase font-mono">
                    Özel API Key Aktif ({apiKey.substring(0, 6)}••••)
                  </span>
                </div>

                <button
                  onClick={triggerDeactivate}
                  title="Oturumu kapat ve API anahtarını temizle"
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Bento Grid Body Map */}
            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
              {/* PRIMARY CHAT CORE BOX (LEFT GRID - SPANS 8 ON LARGE SCREENS) */}
              <div className="col-span-12 xl:col-span-8 bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm min-h-[400px] xl:h-full overflow-hidden">
                {/* Chat Top Banner bar */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    <span className="font-mono uppercase font-semibold">Odaklanmış Sohbet Akışı</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={triggerClearChatHistory}
                      title="Sohbet geçmişini sıfırla"
                      className="text-xs text-slate-400 hover:text-red-500 font-semibold font-mono flex items-center gap-1 transition-colors cursor-pointer bg-slate-100/80 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg border border-slate-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Temizle</span>
                    </button>
                    
                    <button
                      onClick={() => setShowSettingsSidebar(!showSettingsSidebar)}
                      className="xl:hidden text-xs text-slate-400 hover:text-slate-800 font-semibold font-mono flex items-center gap-1 transition-colors cursor-pointer bg-slate-100/80 px-2.5 py-1.5 rounded-lg border border-slate-200"
                    >
                      <SettingsIcon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Parametreler</span>
                    </button>
                  </div>
                </div>

                {/* Messages Panel Container */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 select-text bg-white">
                  <AnimatePresence initial={false}>
                    {messages.map((m) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`flex gap-3 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                          {/* Avatar Indicator */}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            m.role === "user"
                              ? "bg-slate-100 text-slate-650 border border-slate-200"
                              : "bg-indigo-150 bg-indigo-50 text-indigo-700"
                          }`}>
                            {m.role === "user" ? "BEN" : "AI"}
                          </div>

                          {/* Text Card content */}
                          <div
                            className={`rounded-2xl p-4 border transition-all ${
                              m.role === "user"
                                ? "bg-indigo-600 border-indigo-500 text-white rounded-tr-none"
                                : "bg-slate-50 border-slate-200 text-slate-800 rounded-tl-none"
                            }`}
                          >
                            <p className={`text-[10px] uppercase tracking-wider font-semibold font-mono mb-1 ${
                              m.role === "user" ? "text-indigo-200" : "text-indigo-600"
                            }`}>
                              {m.role === "user" ? "Siz" : "Hyperfocus AI"} • {m.timestamp}
                            </p>

                            <div className={`text-sm leading-relaxed ${m.role === "user" ? "text-white" : "text-slate-700"}`}>
                              {m.role === "user" ? m.content : renderMessageContent(m.content)}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0 animate-pulse">
                        AI
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none p-4 max-w-md flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                        <span className="text-xs font-semibold text-slate-500 font-mono animate-pulse">
                          Kurallar süzülüyor, yanıt oluşturuluyor...
                        </span>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Bottom Write panel */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                  <form onSubmit={handleSendMessage} className="flex space-x-3 items-center bg-white border border-slate-200 p-2 rounded-xl shadow-inner">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Sohbet edin veya kuralları işletin..."
                      className="flex-1 px-4 py-2 focus:outline-none text-sm text-slate-700 bg-transparent min-w-0 font-sans"
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || isLoading}
                      className="bg-indigo-600 text-white p-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                  
                  {/* Quick suggest prompts */}
                  {messages.length <= 1 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-slate-400 font-mono font-medium">Önerilenler:</span>
                      <button
                        type="button"
                        onClick={() => setInputMessage("Geliştirmekte olduğum yazılım mimarisini rasyonel kısıtlara göre test et.")}
                        className="bg-white hover:bg-slate-100 text-slate-650 border border-slate-200 px-2.5 py-1 rounded-lg transition-all text-xs cursor-pointer focus:outline-none"
                      >
                        Mimari Analizi
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputMessage("Kuantum hesaplamanın çalışma prensibini çok basit analojilerle açıkla.")}
                        className="bg-white hover:bg-slate-100 text-slate-650 border border-slate-200 px-2.5 py-1 rounded-lg transition-all text-xs cursor-pointer focus:outline-none"
                      >
                        Kuantum Konsepti
                      </button>
                    </div>
                  )}
                </div>
              </div>


              {/* WIDGETS COLUMN (RIGHT GRID - SPANS 4 ON LARGE SCREENS) */}
              <div className={`col-span-12 xl:col-span-4 flex flex-col space-y-6 xl:h-full overflow-y-auto ${
                showSettingsSidebar ? "block" : "hidden xl:flex"
              }`}>
                {/* WIDGET 1: MODEL ENGINE SELECTOR */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
                  <label className="text-xs font-bold text-slate-400 uppercase mb-2 block font-mono tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Model Engine</span>
                  </label>
                  <select
                    value={settings.model}
                    onChange={(e) => setSettings((prev) => ({ ...prev, model: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                  >
                    {AVAILABLE_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.badge || "Aktif"})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-450 leading-normal mt-2">
                    {AVAILABLE_MODELS.find((m) => m.id === settings.model)?.description}
                  </p>
                </div>

                {/* WIDGET 2: RULES AND CONFIGURATIONS (Bento Box Center) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col flex-1 min-h-[300px]">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Custom Rules</span>
                    </label>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded">ACTIVE</span>
                  </div>

                  <p className="text-[11.5px] text-slate-500 leading-normal mb-3">
                    Yapay zekanın yanıt yazarken uyması gereken kuralları etik sınırlar içinde belirtin:
                  </p>

                  <textarea
                    value={settings.rules}
                    onChange={(e) => setSettings((prev) => ({ ...prev, rules: e.target.value }))}
                    placeholder="Örn:\n1. Extreme brevity\n2. Ciddiyet..."
                    rows={6}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-mono leading-relaxed text-slate-600 focus:outline-none resize-none flex-1"
                  />

                  {/* Preset Quick Loader Buttons */}
                  <div className="mt-4 space-y-2">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-bold">Kural Şablonları ekle:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {RULES_PRESETS.map((p) => (
                        <button
                          key={p.title}
                          type="button"
                          onClick={() => applyRulePreset(p.prompt)}
                          className="text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-indigo-500 text-slate-650 hover:text-indigo-600 font-semibold py-1 px-2.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>{p.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 mt-4">
                    <label className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider mb-2 block">System Instruc. (Özet)</label>
                    <input
                      type="text"
                      value={settings.systemPrompt}
                      onChange={(e) => setSettings((prev) => ({ ...prev, systemPrompt: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* WIDGET 3: TEMPERATURE CONTROLLER (DEEP INDIGO SPACE BOX) */}
                <div className="bg-indigo-950 border border-indigo-900 rounded-2xl p-5 shadow-sm text-indigo-100">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold text-indigo-200 uppercase font-mono tracking-wider flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-300" />
                      <span>Temperature</span>
                    </label>
                    <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-900/50 px-2 py-0.5 rounded border border-indigo-800">
                      {settings.temperature.toFixed(2)}
                    </span>
                  </div>

                  <p className="text-[11px] text-indigo-300 leading-normal mb-3">
                    Düşük değerler net ve tutarlı, yüksek değerler ise özgün ve yaratıcı yanıtlar üretir.
                  </p>

                  <div className="space-y-2 mt-4">
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.05"
                      value={settings.temperature}
                      onChange={(e) => setSettings((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                      className="w-full accent-indigo-400 h-1.5 bg-indigo-900 rounded-lg cursor-pointer outline-none"
                    />
                    <div className="flex justify-between text-[10px] text-indigo-400 font-mono">
                      <span>Deterministik (0.0)</span>
                      <span>Dengeli</span>
                      <span>Yaratıcı (2.0)</span>
                    </div>
                  </div>

                  <div className="border-t border-indigo-900 pt-3 mt-4 flex items-center justify-between">
                    <span className="text-[10px] text-indigo-400 font-mono">* Enforced by Bento kernel</span>
                    <button
                      type="button"
                      onClick={() => setSettings(DEFAULT_SETTINGS)}
                      className="text-[10.5px] text-indigo-300 hover:text-white font-mono flex items-center gap-1 bg-transparent cursor-pointer"
                    >
                      <RefreshCw className="w-3" />
                      <span>Varsayılana Sıfırla</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HOW TO KEY INFO MODAL */}
      <AnimatePresence>
        {showKeyInfoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative text-slate-800"
            >
              <button
                onClick={() => setShowKeyInfoModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-705 p-1 rounded-lg cursor-pointer focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Key className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-800">Gemini API Anahtarı Almak</h3>
              </div>

              <div className="space-y-4 text-sm text-slate-600 leading-relaxed font-sans">
                <p>
                  Hyperfocus AI, gücünü doğrudan Google Gemini modellerinden alan bir arabirimdir. Kendi geliştirici anahtarınızı kolayca tanımlayabilirsiniz:
                </p>
                <ol className="list-decimal pl-5 space-y-2 font-medium text-slate-700">
                  <li>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline font-bold"
                    >
                      Google AI Studio API Key
                    </a>{" "}
                    sayfasını ziyaret edin.
                  </li>
                  <li>
                    Yeni bir geliştirici anahtarı oluşturarak kopyalayın.
                  </li>
                  <li>
                    Uygulamaya kopyaladığınız anahtarı tanımlayarak doğrudan "Doğrula ve Çalıştır" butonuna basın.
                  </li>
                </ol>
                <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 p-3.5 rounded-xl text-xs flex gap-2">
                  <Info className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <span>
                    Google AI Studio, her kullanıcıya belirli kotalarda yapay zeka entegrasyonu için tamamen ücretsiz anahtarlar sunmaktadır.
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRIVACY POLICY & TERMS MODAL */}
      <AnimatePresence>
        {showPrivacyDetailsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-slate-800 flex flex-col max-h-[85vh]"
            >
              <button
                onClick={() => setShowPrivacyDetailsModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Veri Gizliliği ve Şartlar</h3>
                  <p className="text-xs text-slate-400 font-mono">Hyperfocus AI • Güvenlik Protokolü</p>
                </div>
              </div>

              {/* Scrollable content of privacy agreement */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-sm text-slate-600 leading-relaxed font-sans">
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">1. API Anahtarı Güvenliği</h4>
                  <p>
                    Giriş formunda belirttiğiniz Google Gemini API anahtarı, hiçbir üçüncü taraf sunucuya veya veri tabanına iletilmez ya da kaydedilmez. Anahtarınız tarayıcınızın yerel depolama alanında (<code className="bg-slate-100 p-0.5 rounded text-xs">localStorage</code>) saklanır ve yalnızca bu applet'in barındırıldığı sunucu üzerinden doğrudan güvenli HTTPS hatları ile resmi Google API sunucularına proxy edilir.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 mb-1">2. Sohbet ve Geçmiş Verileri</h4>
                  <p>
                    Tüm sohbet yazışmaları, sistem promptu, temperature ayarları ve özel kurallardan oluşan verileriniz tamamen yerel tarayıcı belleğinizde saklanır. Sunucu tarafında hiçbir kalıcı veri tutulmamaktadır. "Temizle" butonuna basarak sohbet geçmişini, sağ üst köşedeki "Çıkış" butonuna basarak da API anahtarınızı sistemden tamamen kalıcı olarak silebilirsiniz.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 mb-1">3. Etik Kullanım ve Sorumluluk</h4>
                  <p>
                    Model çıktıları doğrudan Google Gemini altyapısı tarafından üretilir. Kullanıcılar, yapay zekayı yasal ve etik sınırlar çerçevesinde kullanmakla yükümlüdür. Oluşturulan sistem promptları veya girilen özel kurallar genel ahlak, telif hakları ve insan hakları kurallarına uygun olmalıdır.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 mb-1">4. GDPR ve KVKK Uyumluluğu</h4>
                  <p>
                    Uygulamamız, kullanıcı odaklı tam kontrol felsefesi ile çalışmaktadır. Hiçbir arka plan izleyicisi, çerez veya analitik veri toplama mekanizması barındırmamaktadır. Verilerinizin tek sahibi sizsiniz.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between flex-shrink-0">
                <span className="text-xs text-slate-400 font-mono">Sürüm: ISO-Focus-1.1</span>
                <button
                  type="button"
                  onClick={() => {
                    setAgreedToPrivacyPolicy(true);
                    setShowPrivacyDetailsModal(false);
                  }}
                  className="bg-indigo-605 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-xs cursor-pointer transition-colors shadow shadow-indigo-100"
                >
                  Okudum, Onaylıyorum
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LOGOUT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative text-slate-800"
            >
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
                  <LogOut className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-800 font-sans">Oturumu Kapat</h3>
              </div>

              <p className="text-sm text-slate-650 leading-relaxed font-sans mb-6">
                Mevcut derin odaklanma seansınızı sonlandırmak, oturumunuzu kapatmak ve Gemini API anahtarını bu cihazdan temizlemek istediğinizden emin misiniz?
              </p>

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-4 py-2 rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={confirmDeactivate}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-xl text-xs cursor-pointer transition-colors shadow shadow-red-100"
                >
                  Oturumu Kapat ve Sil
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CLEAR CHAT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative text-slate-800"
            >
              <button
                onClick={() => setShowClearConfirm(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-800 font-sans">Geçmişi Temizle</h3>
              </div>

              <p className="text-sm text-slate-650 leading-relaxed font-sans mb-6">
                Şu ana kadar yaptığınız bütün sohbet geçmişini sıfırlamak istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </p>

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-4 py-2 rounded-xl text-xs cursor-pointer transition-colors"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={confirmClearChatHistory}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded-xl text-xs cursor-pointer transition-colors shadow shadow-amber-100"
                >
                  Sohbeti Sıfırla
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
