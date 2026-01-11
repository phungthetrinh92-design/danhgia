
import { Question } from './types';

export const INITIAL_QUIZ: Question[] = [
  {
    id: '1',
    text: "Khi đứng nghiêm, mắt nhìn như thế nào?",
    options: ["Xuống đất", "Nhìn thẳng", "Sang bên", "Lên cao"],
    correctIndex: 1
  },
  {
    id: '2',
    text: "Đi đều cần chú ý điều gì?",
    options: ["Tự do", "Theo nhịp", "Nói chuyện", "Chạy nhanh"],
    correctIndex: 1
  },
  {
    id: '3',
    text: "Chạy nhẹ thường dùng khi nào?",
    options: ["Khởi động", "Nghỉ", "Ăn", "Ngủ"],
    correctIndex: 0
  },
  {
    id: '4',
    text: "Đội hình giúp giờ học?",
    options: ["Lộn xộn", "An toàn", "Buồn", "Mệt"],
    correctIndex: 1
  },
  {
    id: '5',
    text: "Phối hợp động tác giúp?",
    options: ["Ít vận động", "Hiệu quả", "Chán", "Mệt"],
    correctIndex: 1
  }
];

export const SYSTEM_INSTRUCTION = `Bạn là một chuyên gia giáo dục thể chất cho học sinh tiểu học tại Việt Nam. 
Nhiệm vụ của bạn là tạo ra các câu hỏi trắc nghiệm ôn tập kiến thức GDTC theo chương trình hiện hành.
Câu hỏi phải phù hợp với tâm lý lứa tuổi tiểu học, ngôn ngữ trong sáng, dễ hiểu.
Mỗi câu hỏi có 4 phương án lựa chọn, trong đó chỉ có 1 phương án đúng.`;
