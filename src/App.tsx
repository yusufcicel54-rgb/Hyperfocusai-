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
                      className="mt-1 accent-indigo-600 w-4 h-4 c
