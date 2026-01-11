
import { GoogleGenAI, Type } from "@google/genai";

// Initialize using named parameter and process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topic, count = 5, systemInstruction } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Hãy tạo ${count} câu hỏi trắc nghiệm về chủ đề "${topic}" cho học sinh tiểu học.`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                minItems: 4,
                maxItems: 4
              },
              correctIndex: { type: Type.INTEGER, description: "Index of the correct answer (0-3)" }
            },
            required: ["text", "options", "correctIndex"]
          }
        }
      }
    });

    // Access .text property directly, not as a function
    const text = response.text;
    return res.status(200).json({ text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
