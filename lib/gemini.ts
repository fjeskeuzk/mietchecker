// Gemini LLM integration for property chatbot
// Server-side only - never call from client

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Project, ProjectMetric, Conversation } from '@/types/database';
import { METRIC_CONFIGS } from './score';

// Initialize Gemini client
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
const MOCK_MODE = process.env.GEMINI_MOCK === 'true';

// System prompt for the Mietchecker assistant
const SYSTEM_PROMPT = `Du bist der Mietchecker-Assistent — ein hilfreicher Assistent, der auf die Bewertung deutscher Immobilien spezialisiert ist.

WICHTIGE REGELN:
- Du verwendest nur die bereitgestellten Projekt-Metriken und vertrauenswürdige öffentliche Quellen.
- Wenn Daten fehlen, gib an, was fehlt und schlage vor, wie man sie erhalten kann.
- Gib kurze, umsetzbare Empfehlungen und eine Zusammenfassung der Bewertung (0-100, wobei höher besser ist).
- Bei Fragen zu rechtlichen oder medizinischen Themen lehnst du ab und empfiehlst, einen Fachmann aufzusuchen.
- Antworte auf Deutsch für Endbenutzer; verwende Englisch nur für interne Logs.
- Sei präzise, hilfsber and objektiv in deinen Bewertungen.
- Zitiere immer die Datenquellen für deine Schlussfolgerungen (z.B., "basierend auf Lärmmessungen des Datensatzes X vom YYYY-MM-DD").
- Halte deine Hauptantwort unter 300 Wörtern und biete dann umsetzbare Checklisten-Punkte an.

FORMATIERUNG:
- Verwende Markdown für bessere Lesbarkeit
- Nutze Aufzählungszeichen für Listen
- Hebe wichtige Punkte hervor

BEISPIEL-ANTWORTEN:

Frage: "Wie ist die Lärmbelastung?"
Antwort: "Die Lärmbelastung in dieser Gegend beträgt 65,5 dB (basierend auf Daten der Stadt Berlin vom 2024-01-15). Dies entspricht einem Score von 72/100.

**Bewertung:** Dies ist ein moderater Lärmpegel, typisch für zentrale städtische Lagen. Hauptverkehrsstraßen und öffentliche Verkehrsmittel tragen zur Geräuschkulisse bei.

**Empfehlungen:**
- Besichtigen Sie die Wohnung zu verschiedenen Tageszeiten (Morgen, Mittag, Abend)
- Prüfen Sie die Schalldämmung der Fenster
- Erkundigen Sie sich nach ruhigeren Räumen zur Hofseite
- Beachten Sie die Nähe zu Hauptverkehrsstraßen"

Frage: "Was sind die Vorteile dieser Lage?"
Antwort: "Diese Lage bietet mehrere Vorteile basierend auf den aktuellen Daten:

**Infrastruktur (90/100):**
- 8 Lebensmittelgeschäfte im Umkreis von 500m
- Sehr gute Versorgungslage für den täglichen Bedarf

**Internet (95/100):**
- Geschwindigkeit von 250 Mbps verfügbar
- Excellent für Home-Office geeignet

**Sicherheit (87/100):**
- Niedrige Kriminalitätsrate von 12,5 pro 1000 Einwohner

**Checkliste für den Umzug:**
- Internetanbieter vorab kontaktieren
- Einkaufsmöglichkeiten vor Ort erkunden
- Nachbarschaft kennenlernen"`;

// User prompt template
function createUserPrompt(
  project: Project,
  metrics: ProjectMetric[],
  userMessage: string
): string {
  const metricsJson = metrics.map((m) => ({
    key: m.metric_key,
    value: m.metric_value,
    score: m.normalized_score,
    label: METRIC_CONFIGS[m.metric_key]?.label,
    source: m.source,
    fetched_at: m.fetched_at,
  }));

  return `Benutzer fragt über Immobilie: "${project.title}", Adresse: ${project.address || 'Nicht angegeben'}, Koordinaten: ${project.latitude},${project.longitude}.

PROJEKT-METRIKEN (JSON):
${JSON.stringify(metricsJson, null, 2)}

GESAMT-BEWERTUNG: ${project.overall_score ? `${project.overall_score}/100` : 'Noch nicht berechnet'}

BENUTZERNACHRICHT:
${userMessage}

ANWEISUNGEN:
- Antworte auf Deutsch, es sei denn, der Benutzer hat ausdrücklich Englisch angefordert.
- Halte deine Hauptantwort unter 300 Wörtern, biete dann umsetzbare Checklisten-Punkte an.
- Zitiere, woher die Schlussfolgerungen stammen (z.B., "basierend auf Lärmmessungen des Datensatzes X vom YYYY-MM-DD)".
- Verwende Markdown für bessere Formatierung.`;
}

// Mock response for testing
function getMockResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('lärm') || lowerMessage.includes('noise')) {
    return `Die Lärmbelastung in dieser Gegend ist moderat. Basierend auf den verfügbaren Daten liegt der Lärmpegel bei etwa 65 dB, was einem Score von 72/100 entspricht.

**Bewertung:** Dies ist ein typischer Wert für eine zentrale städtische Lage. Hauptverkehrsstraßen und öffentliche Verkehrsmittel tragen zur Geräuschkulisse bei.

**Empfehlungen:**
- Besichtigung zu verschiedenen Tageszeiten durchführen
- Schalldämmung der Fenster prüfen
- Nach ruhigeren Räumen zur Hofseite fragen`;
  }

  if (lowerMessage.includes('einkauf') || lowerMessage.includes('geschäft')) {
    return `Die Einkaufsmöglichkeiten in der Nähe sind ausgezeichnet! Es gibt 8 Lebensmittelgeschäfte im Umkreis von 500 Metern (Score: 90/100).

**Verfügbare Geschäftstypen:**
- Supermärkte
- Bio-Läden
- Discounter

Diese Vielfalt ermöglicht flexible Einkaufsmöglichkeiten zu verschiedenen Preislagen.`;
  }

  // Default response
  return `Vielen Dank für Ihre Frage! Basierend auf den verfügbaren Daten für diese Immobilie kann ich Ihnen folgende Information geben:

**Gesamt-Bewertung:** Die Immobilie hat eine solide Bewertung mit guten Infrastruktur- und Versorgungsmöglichkeiten.

**Wichtige Aspekte:**
- Gute Verkehrsanbindung
- Ausreichende Einkaufsmöglichkeiten
- Durchschnittliche Lärmbelastung für städtische Lage

**Empfehlungen:**
- Besichtigung vor Ort durchführen
- Nachbarschaft erkunden
- Verfügbarkeit von Internet und Versorgern prüfen

Haben Sie weitere spezifische Fragen zur Immobilie?`;
}

// Convert conversation history to Gemini format
function formatConversationHistory(conversations: Conversation[]) {
  return conversations.map((conv) => ({
    role: conv.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: conv.message }],
  }));
}

// Generate chat response using Gemini
export async function generateChatResponse(
  project: Project,
  metrics: ProjectMetric[],
  userMessage: string,
  conversationHistory: Conversation[] = []
): Promise<string> {
  // Use mock mode for testing
  if (MOCK_MODE || !genAI) {
    console.info('Using mock Gemini response (GEMINI_MOCK=true or no API key)');
    return getMockResponse(userMessage);
  }

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Prepare chat history
    const history = formatConversationHistory(
      conversationHistory.slice(-10) // Limit to last 10 messages for context
    );

    // Start chat with history
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: SYSTEM_PROMPT }],
        },
        {
          role: 'model',
          parts: [
            {
              text: 'Verstanden. Ich bin der Mietchecker-Assistent und helfe Ihnen bei der Bewertung deutscher Immobilien. Ich verwende nur die bereitgestellten Daten und gebe konkrete, umsetzbare Empfehlungen auf Deutsch.',
            },
          ],
        },
        ...history,
      ],
    });

    // Generate response
    const userPrompt = createUserPrompt(project, metrics, userMessage);
    const result = await chat.sendMessage(userPrompt);
    const response = result.response;

    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);

    // Fallback to mock response on error
    return getMockResponse(userMessage);
  }
}

// Stream chat response (for real-time UI updates)
export async function* streamChatResponse(
  project: Project,
  metrics: ProjectMetric[],
  userMessage: string,
  conversationHistory: Conversation[] = []
): AsyncGenerator<string, void, unknown> {
  // Mock mode doesn't support streaming
  if (MOCK_MODE || !genAI) {
    yield getMockResponse(userMessage);
    return;
  }

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const history = formatConversationHistory(conversationHistory.slice(-10));

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: SYSTEM_PROMPT }],
        },
        {
          role: 'model',
          parts: [
            {
              text: 'Verstanden. Ich bin der Mietchecker-Assistent und helfe Ihnen bei der Bewertung deutscher Immobilien.',
            },
          ],
        },
        ...history,
      ],
    });

    const userPrompt = createUserPrompt(project, metrics, userMessage);
    const result = await chat.sendMessageStream(userPrompt);

    for await (const chunk of result.stream) {
      yield chunk.text();
    }
  } catch (error) {
    console.error('Gemini streaming error:', error);
    yield getMockResponse(userMessage);
  }
}

// Rate limiting helper (per-user)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_PER_MINUTE = parseInt(process.env.RATE_LIMIT_PER_MINUTE || '10', 10);

export function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + 60000, // 1 minute
    });
    return { allowed: true, remaining: RATE_LIMIT_PER_MINUTE - 1 };
  }

  if (userLimit.count >= RATE_LIMIT_PER_MINUTE) {
    return { allowed: false, remaining: 0 };
  }

  userLimit.count++;
  return { allowed: true, remaining: RATE_LIMIT_PER_MINUTE - userLimit.count };
}
