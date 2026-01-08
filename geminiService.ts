
import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY;

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
  }

  async generatePEQuestions(grade: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Tạo đúng 15 câu hỏi kiểm tra năng lực thể chất cho học sinh Lớp ${grade}. 
        Hãy phân bổ đa dạng các chủ đề phù hợp với lứa tuổi: 
        1. Tư thế và kỹ năng vận động cơ bản; 
        2. Vệ sinh sân tập và thân thể; 
        3. Nhận biết các loại bóng và dụng cụ thể thao; 
        4. Các bài tập thể dục nhịp điệu hoặc trò chơi vận động. 
        Hãy trộn lẫn các loại câu hỏi: KNOWLEDGE (Kiến thức - Trắc nghiệm), ACTION (Hành động - Yêu cầu bé làm theo và có thời gian đếm ngược), IDENTIFY (Nhận biết hình ảnh/dụng cụ). 
        Trả về định dạng JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER },
                type: { type: Type.STRING, description: 'KNOWLEDGE, ACTION, or IDENTIFY' },
                title: { type: Type.STRING },
                instruction: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                duration: { type: Type.INTEGER, description: 'Chỉ dành cho ACTION, thời gian (giây) để thực hiện' },
                imageHint: { type: Type.STRING }
              },
              required: ["id", "type", "title", "instruction"]
            }
          }
        }
      });

      return JSON.parse(response.text);
    } catch (error) {
      console.error("Error generating questions:", error);
      return null;
    }
  }

  async getFinalAssessment(results: any[], grade: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Dựa trên kết quả bài kiểm tra thể chất lớp ${grade} (tổng cộng 15 câu) sau: ${JSON.stringify(results)}. Hãy đưa ra một bản nhận xét ngắn gọn (khoảng 2-3 câu), khích lệ bé như một giáo viên thể dục tận tâm.`,
      });
      return response.text;
    } catch (error) {
      console.error("Error getting assessment:", error);
      return "Bé đã hoàn thành bài tập rất tốt! Hãy tiếp tục rèn luyện sức khỏe nhé.";
    }
  }
}
