// src/services/aiService.ts
import config from '../config';
import OpenAI from 'openai';

export interface IMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date | string;
}

const openAiClient = config.openaiApiKey ? new OpenAI({ apiKey: config.openaiApiKey }) : null;

/**
 * Transform your internal messages to the OpenAI chat message shape.
 * We use `any` for messages to avoid mismatched strict SDK types when function messages are not used.
 */
function toOpenAiMessages(history: IMessage[], systemPrompt?: string) {
  const messages: any[] = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });

  for (const m of history) {
    // map our 'assistant'|'user' to allowed roles
    const role = m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user';
    messages.push({ role, content: m.content });
  }
  return messages;
}

/**
 * generateAIResponse
 * - userPrompt: latest user message (string)
 * - history: previous messages (IMessage[])
 * returns { reply, structured }
 */
export async function generateAIResponse(userPrompt: string, history: IMessage[]) {
  try {
    const systemPrompt =
      "Tu es un assistant RH. Pose des questions structurées et claires pour collecter toutes les informations nécessaires (salaire actuel, salaire souhaité, date d'effet, manager, poste, raisons, preuves). Répond en français quand l'utilisateur parle français. Quand tu as toutes les infos, indique clairement 'La demande est complète'.";

    // Build messages for model: system + history + latest user
    const openaiMessages = toOpenAiMessages(history || [], systemPrompt);
    openaiMessages.push({ role: 'user', content: userPrompt });

    if (!openAiClient) {
      // Development fallback (no OpenAI key)
      const fallback = `FALLBACK: Merci pour votre message. Pouvez-vous préciser la date d'effet souhaitée et le montant visé ?`;
      return { reply: fallback, structured: {} };
    }

  const resp: any = await openAiClient.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: openaiMessages as any[], // ✅ bypass strict type union
    temperature: 0.2,
    max_tokens: 800
});

    const reply: string = resp?.choices?.[0]?.message?.content ?? '';

    // Attempt to extract structured fields (best-effort)
    const structured = await extractStructuredData([...history, { role: 'user', content: userPrompt }]);

    return { reply, structured };
  } catch (err: any) {
    console.error('generateAIResponse error:', err?.message || err);
    throw err;
  }
}

/**
 * extractStructuredData(history)
 * Ask the model to return JSON with structured keys. If no OpenAI key -> return {}
 */
export async function extractStructuredData(history: IMessage[]) {
  try {
    if (!openAiClient) return {};

    const systemPrompt =
      `You are an assistant that extracts structured HR data from a conversation. Output ONLY valid JSON (no explanation) with keys (use null if unknown):
{
  "issue_type": "salary_negotiation|promotion|harassment_complaint|workload_concern|training_request|internal_mobility|general_inquiry",
  "current_salary": string|null,
  "desired_salary": string|null,
  "salary_currency": string|null,
  "manager_name": string|null,
  "job_title": string|null,
  "desired_effective_date": string|null,
  "urgency": "low"|"medium"|"high"|"urgent"|null,
  "summary": string
}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(h => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content }))
    ];

  const resp: any = await openAiClient.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: messages as any[],
    temperature: 0,
    max_tokens: 400
});

    const raw: string = resp?.choices?.[0]?.message?.content ?? '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    } catch (parseErr) {
      console.warn('extractStructuredData: failed to parse JSON, returning empty', parseErr);
      return {};
    }
  } catch (err: any) {
    console.error('extractStructuredData error:', err?.message || err);
    return {};
  }
}