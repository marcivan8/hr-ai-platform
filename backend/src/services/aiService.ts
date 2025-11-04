// src/services/aiService.ts
import config from '../config';
import OpenAI from 'openai';

export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date | string;
}

const openAiClient = config.openaiApiKey ? new OpenAI({ apiKey: config.openaiApiKey }) : null;

// Generate a conversational reply using the message history (array of IMessage)
// Returns { reply: string, structured?: Record<string, any> }
export async function generateAIResponse(userPrompt: string, history: IMessage[]) {
  try {
    // Build messages for the model (system + history + latest user)
    const messages = [
      {
        role: 'system',
        content:
          "You are an HR assistant. Ask structured clarifying questions to collect all details needed to prepare an HR dossier (salary expectations, current salary, manager, job title, dates, reasons, supporting evidence). When you have enough information say clearly: 'La demande est complète' (in French). Prefer French answers if the user speaks French."
      },
      // history -> map to model format
      ...history.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      })),
      { role: 'user', content: userPrompt }
    ];

    if (!openAiClient) {
      // Fallback simple heuristic if no API key set (development)
      const fallbackReply = "Réponse IA (mode fallback) — merci, pouvez-vous préciser la date d'effet et le montant souhaité ?";
      return { reply: fallbackReply, structured: {} };
    }

    // call OpenAI chat completion
    const resp: any = await openAiClient.chat.completions.create({
      model: 'gpt-4o-mini', // change to available model in your plan
      messages,
      temperature: 0.2,
      max_tokens: 800
    });

    const reply = resp?.choices?.[0]?.message?.content ?? '';

    // attempt to extract structured data after assistant reply
    const structured = await extractStructuredData([...history, { role: 'user', content: userPrompt }]);

    return { reply, structured };
  } catch (err: any) {
    console.error('AI service error:', err?.message || err);
    throw err;
  }
}

// Extract structured fields from the conversation (returns an object)
export async function extractStructuredData(history: IMessage[]) {
  try {
    if (!openAiClient) return {};

    const systemPrompt =
      `You are an assistant that extracts structured HR data from a conversation. 
Output ONLY valid JSON (no explanation) with these keys (use null when unknown): 
{
  "issue_type": string, // salary_negotiation|promotion|harassment_complaint|workload_concern|training_request|internal_mobility|general_inquiry
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
      ...history.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
    ];

    const resp: any = await openAiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0,
      max_tokens: 400
    });

    const raw = resp?.choices?.[0]?.message?.content ?? '';
    // Try to parse first JSON block in response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
  } catch (err: any) {
    console.error('extractStructuredData error:', err?.message || err);
    return {};
  }
}