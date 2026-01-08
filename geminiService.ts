
export class GeminiService {
  constructor() {
    // No initialization needed for client-side fetch
  }

  async generatePEQuestions(grade: string) {
    try {
      const prompt = `Tạo đúng 15 câu hỏi kiểm tra năng lực thể chất cho học sinh Lớp ${grade}. 
        Hãy phân bổ đa dạng các chủ đề phù hợp với lứa tuổi: 
        1. Tư thế và kỹ năng vận động cơ bản; 
        2. Vệ sinh sân tập và thân thể; 
        3. Nhận biết các loại bóng và dụng cụ thể thao; 
        4. Các bài tập thể dục nhịp điệu hoặc trò chơi vận động. 
        Hãy trộn lẫn các loại câu hỏi: KNOWLEDGE (Kiến thức - Trắc nghiệm), ACTION (Hành động - Yêu cầu bé làm theo và có thời gian đếm ngược), IDENTIFY (Nhận biết hình ảnh/dụng cụ). 
        Trả về định dạng JSON.`;

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  id: { type: "INTEGER" },
                  type: { type: "STRING", description: 'KNOWLEDGE, ACTION, or IDENTIFY' },
                  title: { type: "STRING" },
                  instruction: { type: "STRING" },
                  options: { type: "ARRAY", items: { type: "STRING" } },
                  correctAnswer: { type: "STRING" },
                  duration: { type: "INTEGER", description: 'Chỉ dành cho ACTION, thời gian (giây) để thực hiện' },
                  imageHint: { type: "STRING" }
                },
                required: ["id", "type", "title", "instruction"]
              }
            }
          }
        })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return JSON.parse(data.text);
    } catch (error) {
      console.error("Error generating questions:", error);
      return null;
    }
  }

  async getFinalAssessment(results: any[], grade: string) {
    try {
      const prompt = `Dựa trên kết quả bài kiểm tra thể chất lớp ${grade} (tổng cộng 15 câu) sau: ${JSON.stringify(results)}. Hãy đưa ra một bản nhận xét ngắn gọn (khoảng 2-3 câu), khích lệ bé như một giáo viên thể dục tận tâm.`;
      
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error("Error getting assessment:", error);
      return "Bé đã hoàn thành bài tập rất tốt! Hãy tiếp tục rèn luyện sức khỏe nhé.";
    }
  }
}
