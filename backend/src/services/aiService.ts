import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateAIResponse(prompt: string, history: ChatCompletionMessageParam[] = []) {
  try {
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: "You are a helpful HR assistant specialized in talent screening, interview support, and candidate evaluation." },
      ...history,
      { role: "user", content: prompt }
    ];

    const response = await client.chat.completions.create({
      model: "gpt-4.1", // switch to GPT‑5 if available
      messages,
      temperature: 0.4,
      max_tokens: 800
    });

    return response.choices[0]?.message?.content ?? "";
  } catch (error: any) {
    console.error("Error generating AI response:", error.response?.data || error.message);
    throw new Error("AI generation failed");
  }
}
