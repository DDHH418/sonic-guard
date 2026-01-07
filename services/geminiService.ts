
import { GoogleGenAI, Type } from "@google/genai";
import { DailySummary, AIInsights } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getNoiseInsights(history: DailySummary[]): Promise<AIInsights> {
  const historyString = JSON.stringify(history);

  const prompt = `
    Analyze this noise pollution history for a user: ${historyString}.
    The safe long-term average exposure is 70dB. 
    1. Summarize their noise exposure this week.
    2. Provide 3 specific prevention tips based on their data.
    3. Calculate a "Weekly Noise Budget Remaining" (how many more 'safe' hours or dB intensity they can afford).
    4. Provide 2 funny, sarcastic quotes about noise or silence.
    Return the result in valid JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            preventionTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            remainingBudget: { type: Type.STRING },
            funnyQuotes: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["summary", "preventionTips", "remainingBudget", "funnyQuotes"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      summary: "Data looks a bit noisy! We couldn't process your trends right now.",
      preventionTips: ["Stay away from jackhammers.", "Consider noise-canceling headphones."],
      remainingBudget: "Unknown - please check back later.",
      funnyQuotes: ["Silence is so accurate.", "I tried to catch some fog, but I mist. (Wait, that's the wrong quote)."]
    };
  }
}
