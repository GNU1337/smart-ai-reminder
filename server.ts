import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

/**
 * Lazy-initializer helper for Google GenAI SDK.
 */
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required to prompt AI.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Generate Day Summary (Morning or Evening digest)
  app.post("/api/generate-briefing", async (req, res) => {
    try {
      const { briefingType, notifications, subscriptions, notes } = req.body;

      // Validate or fallback keys
      let ai;
      try {
        ai = getGenAI();
      } catch (keyErr: any) {
        return res.status(400).json({
          error: "API-nyckel saknas",
          message: "Lägg till din GEMINI_API_KEY i inställningarna (Settings > Secrets) för att kunna generera AI-sammanfattningar."
        });
      }

      const formattedNotifications = Array.isArray(notifications)
        ? notifications.map((n: any) => `- [${n.app || "Okänd"}] ${n.title || ""}: ${n.content || ""} (${n.timestamp || ""})`).join("\n")
        : "Inga aktuella notiser registrerade.";

      const formattedSubscriptions = Array.isArray(subscriptions)
        ? subscriptions.map((s: any) => `- ${s.name || s.title} (${s.type || "Hemsida"}): ${s.url || ""}`).join("\n")
        : "Inga prenumerationer sparade.";

      const formattedNotes = Array.isArray(notes)
        ? notes.map((no: any) => `- [Memo]: ${no.title || ""} - ${no.content || ""} (Sparat: ${no.date || ""})`).join("\n")
        : "Inga kom-ihåg-saker eller anteckningar i minnesbanken.";

      const isMorning = briefingType === "morning";
      const digestName = isMorning ? "Morgonsammanfattning" : "Kvällssammanfattning";

      const systemInstruction = `Du är en omtänksam, lugnande och pedagogisk personlig minnesassistent för användaren som har svårt att komma ihåg och sammanfatta händelser i sitt liv.
Ditt syfte är att tillhandahålla en klar, enkel och stressfri överblick av dagen, utan kognitiv överbelastning.
Använd klarspråk, korta meningar och punktlistor. Dela upp informationen i tydliga sektioner med en varm, uppmuntrande ton.
Du måste kommunicera helt på svenska.

Strukturera svaret strikt enligt följande rubriker (använd vacker markdown):

### 🌅 En lugn start (eller 🌌 Kvällens avrundning beroende på briefingType)
[Ett varmt, välkomnande stycke som sätter tonen. Ge ett lugnt fokus. Påminn dem om att ta ett djupt andetag.]

### 📌 Prioriterat att uppmärksamma
[Gå igenom viktiga notiser och anteckningar. Lyft fram meddelanden från "Anna" eller andra personer, möten, kalenderpåminnelser eller viktiga händelser. Sammanfatta det viktigaste så de slipper leta.]

### 📝 Kom ihåg (Dina Anteckningar)
[Korta konkreta punkter från användarens anteckningar/minnesbank som är extra relevanta. Hjälp dem att komma ihåg det de har skrivit ner.]

### 🌐 Din Omvärld (Prenumerationer & Sidor)
[En sammanfattande blick på de hemsidor de följer. Skapa en intressant mjuk sammanfattning eller uppdatering (du kan simulera dagens nyhetsfokus eller ge ett lugnt och trevligt råd baserat på deras intressen).]

### 💡 Dagens lilla minnes-tanke / Tips
[Ett snällt och enkelt råd för att hantera minnet eller hålla fokus idag, t.ex. att lägga nycklarna på samma ställe, dricka lite vatten, ta pauser, eller skriva ner nya tankar direkt.]`;

      const prompt = `Skapa en ${digestName} baserat på följande aktuella data från min mobil och prenumerationer:

--- INFORMATION FRÅN MINA NOTISER ---
${formattedNotifications}

--- DINA MINNESANTECKNINGAR & KOM-IHÅG ---
${formattedNotes}

--- PRENUMERATIONER OCH HEMSIDOR JAG FÖLJER ---
${formattedSubscriptions}

Aktuell tid: ${new Date().toISOString()}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({
        briefing: response.text,
        generatedAt: new Date().toISOString()
      });

    } catch (err: any) {
      console.error("Fel vid generering av briefing:", err);
      res.status(500).json({ error: "Ett fel uppstod på servern vid genereringen", details: err.message });
    }
  });

  // API Route: Generate Weekly Briefing (Consolidated long-term memory summary)
  app.post("/api/generate-weekly-briefing", async (req, res) => {
    try {
      const { notifications, subscriptions, notes } = req.body;

      let ai;
      try {
        ai = getGenAI();
      } catch (keyErr: any) {
        return res.status(400).json({
          error: "API-nyckel saknas",
          message: "Lägg till din GEMINI_API_KEY i inställningarna (Settings > Secrets) för att kunna generera en veckosammanfattning."
        });
      }

      const formattedNotifications = Array.isArray(notifications) && notifications.length > 0
        ? notifications.map((n: any) => `- [${n.app || "Okänd"}] ${n.title || ""}: ${n.content || ""} (${n.timestamp || ""})`).join("\n")
        : "Inga aktuella veckonotiser registrerade.";

      const formattedSubscriptions = Array.isArray(subscriptions) && subscriptions.length > 0
        ? subscriptions.map((s: any) => `- ${s.name} (${s.type}): ${s.url}`).join("\n")
        : "Inga tillagda bevakningar.";

      const formattedNotes = Array.isArray(notes) && notes.length > 0
        ? notes.map((no: any) => `- [Minnespunkt] ${no.title}: ${no.content} (Sparad/uppdaterad: ${no.date})`).join("\n")
        : "Inga kom-ihåg-saker sparade i minnesbanken.";

      const systemInstruction = `Du är en omtänksam, analytisk och varm personlig minnescoach för en användare med minnessvårigheter.
Ditt syfte är att sammanställa en välstrukturerad, fyllig och längre VEKKOVIS SAMMANFATTNING på ren svenska.
Målet är att hjälpa dem se mönster i vardagen, känna sig trygga i sitt minne och minska kognitiv stress genom att sammanfatta all historik i minnesbanken.

Strukturera din veckorapport strikt med följande rubriker (använd vacker markdown):

### 📅 Veckans Översikt & Retrospektiv
[Skriv 2-3 längre men lättlästa meningar som reflekterar över veckan. Ge användaren mycket bekräftelse och trygghet.]

### ❤️ Anna & Viktiga Överenskommelser
[Fokusera särskilt på händelser, meddelanden, känslor eller överenskommelser som rör "Anna" alternativt viktiga personliga kontakter. Om det finns en tvättid eller möte under veckan, konsolidera detta.]

### 🏛️ Minnesbankens Hjärta (Bestående Memos)
[Analysera de sparade anteckningarna (notes/memos). Gör en lättförståelig, konsoliderad sammanfattning av de absolut viktigaste sakerna de har skrivit ner (t.ex. medicindoseringar, portkoder, nycklars positioner).]

### 📊 Vardagsmönster & Kognitiv Avlastning
[Ge insikter baserat på veckans flöde. Beröm användaren för att de använder minnesverktyget. Erbjud 2-3 konkreta tips för att hålla minnet piggt men stressfritt i helgen.]

### 🚀 Inför Nästa Vecka
[Vad bör användaren hålla ett extra öga på inför de kommande dagarna? Sammanfatta detta som 2-3 korta, mycket konkreta och enkla punkter.]

Använd en upplyftande, personlig, och professionell ton utan att vara överdrivet säljande. Använd korta, klara meningar på svenska.`;

      const prompt = `Var god generera en fyllig och detaljerad veckosammanfattning utifrån min sparade data i minnesbanken:

--- Sparade Minnespunkter ---
${formattedNotes}

--- Notiser och händelser från veckan ---
${formattedNotifications}

--- Mina bevakade sidor ---
${formattedSubscriptions}

Dagens datum och tid: ${new Date().toLocaleDateString('sv-SE')} (UTC: 08:55)`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.6,
        }
      });

      res.json({
        briefing: response.text,
        generatedAt: new Date().toISOString()
      });

    } catch (err: any) {
      console.error("Fel vid generering av veckovis sammanfattning:", err);
      res.status(500).json({ error: "Ett fel uppstod på servern vid genereringen", details: err.message });
    }
  });

  // API Route: Query Memory (Ask Gemini questions directly about logs and data)
  app.post("/api/query-memory", async (req, res) => {
    try {
      const { question, notifications, subscriptions, notes } = req.body;

      if (!question) {
        return res.status(400).json({ error: "Fråga saknas i anropet." });
      }

      let ai;
      try {
        ai = getGenAI();
      } catch (keyErr) {
        return res.status(400).json({
          error: "API-nyckel saknas",
          message: "Lägg till din GEMINI_API_KEY i inställningarna."
        });
      }

      const formattedNotifications = Array.isArray(notifications)
        ? notifications.map((n: any) => `- [App: ${n.app || "Okänd"}] ${n.title || ""}: ${n.content || ""} (${n.timestamp || ""})`).join("\n")
        : "Inga.";

      const formattedNotes = Array.isArray(notes)
        ? notes.map((no: any) => `- Anteckning: ${no.title || ""} - ${no.content || ""} (${no.date || ""})`).join("\n")
        : "Inga.";

      const prompt = `Jag har problem med minnet och behöver din hjälp att svara på min fråga baserat på mina registrerade mobilnotiser och sparade minnesanteckningar.
Svara kort, koncist och med stor vänlighet. Om svaret inte finns i datan, säg det men erbjud ett vettigt nästa steg eller lugnande råd.

MIN FRÅGA:
"${question}"

HÄR ÄR DATA FRÅN MIN MOBIL (NOTISER):
${formattedNotifications}

HÄR ÄR MINA PERSONALISERA ANTECKNINGAR:
${formattedNotes}

Svara mig enkelt och direkt på svenska.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({
        answer: response.text,
        generatedAt: new Date().toISOString()
      });

    } catch (err: any) {
      console.error("Fel vid minnesfråga:", err);
      res.status(500).json({ error: "Ett fel uppstod vid minnesfrågan", details: err.message });
    }
  });

  // Serve static assets or mount Vite dev middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
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
    console.log(`Server started running on port ${PORT}`);
  });
}

startServer();
