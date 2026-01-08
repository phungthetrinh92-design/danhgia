
import React, { useState } from 'react';

interface Props {
  onStart: (name: string, grade: string) => void;
  loading: boolean;
}

const StartScreen: React.FC<Props> = ({ onStart, loading }) => {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("1");

  const handleStart = () => {
    if (name.trim()) {
      onStart(name, grade);
    } else {
      alert("Bé hãy nhập tên của mình nhé!");
    }
  };

  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center text-white text-5xl bounce shadow-lg border-4 border-white">
          <i className="fas fa-running"></i>
        </div>
      </div>
      <h1 className="text-4xl font-bold text-green-600 uppercase tracking-tight">Vui Cùng Thể Thao</h1>
      <p className="text-lg text-gray-600 font-medium">Bé đã sẵn sàng cho bài kiểm tra thể chất chưa?</p>
      
      <div className="mt-8 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-500 uppercase">Tên của bé</label>
          <input 
            type="text" 
            placeholder="Nhập tên tại đây..."
            className="w-full px-6 py-4 rounded-2xl border-2 border-green-200 focus:border-green-500 outline-none text-xl text-center font-bold text-gray-700"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-500 uppercase">Chọn Lớp</label>
          <div className="grid grid-cols-3 gap-3">
            {["1", "2", "3"].map((g) => (
              <button
                key={g}
                onClick={() => setGrade(g)}
                className={`py-3 px-4 rounded-xl font-bold text-lg border-2 transition-all ${
                  grade === g 
                  ? "bg-green-500 border-green-600 text-white shadow-md transform scale-105" 
                  : "bg-white border-green-100 text-green-600 hover:border-green-300"
                }`}
              >
                Lớp {g}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleStart}
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-5 px-8 rounded-2xl text-2xl shadow-xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <i className="fas fa-spinner fa-spin mr-2"></i> Đang chuẩn bị bài tập...
            </span>
          ) : (
            "BẮT ĐẦU NGAY!"
          )}
        </button>
      </div>
      <p className="text-sm text-gray-400">Ứng dụng Giáo dục thể chất • Tương tác thông minh</p>
    </div>
  );
};

export default StartScreen;
