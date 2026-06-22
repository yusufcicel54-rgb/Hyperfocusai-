import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Check if system default key is available (helps the UI render initial states)
  app.get("/api/gemini/status", (req, res) => {
    res.json({
      hasSystemKey: !!process.env.GEMINI_API_KEY
    });
  });

  // Verify an API Key by making a simple request
  app.post("/api/gemini/verify", async (req, res) => {
    const { apiKey } = req.body;
    const targetKey = apiKey || process.env.GEMINI_API_KEY;

    if (!targetKey) {
      return res.status(400).json({
        success: false,
        error: "API anahtarı bulunamadı."
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: targetKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });

      // Quick test call to verify authenticity
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: "Aktif",
        config: {
          maxOutputTokens: 5
        }
      });

      if (response && response.text) {
        return res.json({
          success: true,
          message: "API anahtarı başarıyla doğrulandı!"
        });
      } else {
        return res.status(400).json({
          success: false,
          error: "API anahtarı geçerli bir yanıt döndürmedi."
        });
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      return res.status(400).json({
        success: false,
        error: error.message || "API anahtarı doğrulanamadı. Lütfen doğru olduğundan emin olun."
      });
    }
  });

  // Chat/Completion endpoint
  app.post("/api/gemini/chat", async (req, res) => {
    const { apiKey, model, messages, systemPrompt, rules, temperature } = req.body;
    const targetKey = apiKey || process.env.GEMINI_API_KEY;

    if (!targetKey) {
      return res.status(400).json({
        error: "API anahtarı bulunamadı. Lütfen uygulamayı aktif edin."
      });
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: "Geçersiz mesaj formatı veya boş konuşma geçmişi."
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: targetKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });

      // Assemble system instruction combining base instruction, custom system prompt, and ethical rules
      const actualSystemPrompt = systemPrompt || "Şu andan itibaren Hyperfocus AI adında, yüksek oranda odaklanmış ve son derece yardımcı bir yapay zeka asistanısın.";
      
      let fullInstruction = `${actualSystemPrompt}\n\n`;
      if (rules && rules.trim()) {
        fullInstruction += `=== ÖZEL KURALLAR VE ETİK SINIRLAR ===\nUymak zorunda olduğun özel kurallar şunlardır (her zaman etik sınırlar dahilinde kal):\n${rules}\n`;
      } else {
        fullInstruction += `=== ÖZEL KURALLAR VE ETİK SINIRLAR ===\nHer zaman dürüst, profesyonel, etik ve faydalı ol.\n`;
      }

      // Map roles for Google GenAI SDK: 'user' and 'model'
      const contents = messages.map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: model || "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: fullInstruction,
          temperature: typeof temperature === "number" ? temperature : 0.7
        }
      });

      return res.json({
        success: true,
        text: response.text || ""
      });
    } catch (error: any) {
      console.error("Chat error:", error);
      return res.status(500).json({
        error: error.message || "Yapay zeka yanıtı üretirken bir hata oluştu."
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
