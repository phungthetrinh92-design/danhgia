
import React, { useEffect, useState } from 'react';
import { UserResult } from './types';
import { GeminiService } from './geminiService';

interface Props {
  results: UserResult[];
  playerName: string;
  grade: string;
  onRestart: () => void;
  gemini: GeminiService;
}

const ResultScreen: React.FC<Props> = ({ results, playerName, grade, onRestart, gemini }) => {
  const [assessment, setAssessment] = useState("");
  const [loading, setLoading] = useState(true);

  const totalScore = results.reduce((acc, curr) => acc + curr.score, 0);
  const avgScore = Math.round(totalScore / results.length);

  useEffect(() => {
    const getAiFeedback = async () => {
      const feedback = await gemini.getFinalAssessment(results, grade);
      setAssessment(feedback || "Bé đã hoàn thành rất tốt bài kiểm tra năng lực thể chất!");
      setLoading(false);
    };
    getAiFeedback();
  }, [results, playerName, grade, gemini]);

  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center -mt-16">
        <div className="w-32 h-32 bg-yellow-400 rounded-full flex items-center justify-center text-white text-5xl shadow-2xl border-4 border-white">
          <i className="fas fa-trophy"></i>
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold text-gray-800">Chúc mừng {playerName}!</h2>
        <p className="text-lg text-gray-600">Bé đã hoàn thành bài kiểm tra Lớp {grade}.</p>
      </div>

      <div className="bg-green-50 p-6 rounded-2xl border-2 border-dashed border-green-300">
        <div className="text-sm font-bold text-green-500 uppercase tracking-widest mb-3">Lời nhận xét từ Giáo viên</div>
        {loading ? (
          <div className="flex flex-col items-center justify-center p-4 space-y-2">
            <i className="fas fa-circle-notch fa-spin text-3xl text-green-500"></i>
            <span className="text-sm text-green-600 font-medium">Đang soạn nhận xét...</span>
          </div>
        ) : (
          <p className="text-xl text-green-800 italic leading-relaxed font-medium">"{assessment}"</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border-2 border-green-100 shadow-sm">
          <div className="text-xs text-green-500 font-bold uppercase mb-1">Số nhiệm vụ</div>
          <div className="text-3xl font-black text-green-700">{results.length} / 15</div>
        </div>
        <div className="bg-white p-5 rounded-xl border-2 border-purple-100 shadow-sm">
          <div className="text-xs text-purple-500 font-bold uppercase mb-1">Độ chính xác</div>
          <div className="text-3xl font-black text-purple-700">{avgScore}%</div>
        </div>
      </div>

      <button 
        onClick={onRestart}
        className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-5 px-8 rounded-2xl text-xl shadow-xl transition-all hover:scale-[1.02] active:scale-95"
      >
        LÀM LẠI BÀI KIỂM TRA
      </button>
    </div>
  );
};

export default ResultScreen;
