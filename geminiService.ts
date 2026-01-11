
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "./constants";
import { Question } from "./types";

export const generateAIQuestions = async (topic: string, count: number = 5): Promise<Question[]> => {
  try {
    // Correctly initialize with a named parameter from process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Hãy tạo ${count} câu hỏi trắc nghiệm về chủ đề "${topic}" cho học sinh tiểu học.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        // Recommended thinkingBudget for complex tasks with Pro model
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }
              },
              correctIndex: { type: Type.INTEGER }
            },
            required: ["text", "options", "correctIndex"]
          }
        }
      }
    });

    // Extract text directly from property, not method
    const text = response.text || "[]";
    const questions = JSON.parse(text);
    
    return questions.map((q: any, index: number) => ({
      ...q,
      id: `ai-${Date.now()}-${index}`
    }));
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};
