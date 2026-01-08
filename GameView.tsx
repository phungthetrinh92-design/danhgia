
import React, { useState, useEffect } from 'react';
import { Question, UserResult } from './types';

interface Props {
  question: Question;
  onNext: (result: UserResult) => void;
  total: number;
  current: number;
}

const GameView: React.FC<Props> = ({ question, onNext, total, current }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    setSelected(null);
    if (question.type === 'ACTION' && question.duration) {
      setTimeLeft(question.duration);
    } else {
      setTimeLeft(null);
    }
  }, [question]);

  useEffect(() => {
    let timer: any;
    if (timerActive && timeLeft && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => (prev ? prev - 1 : 0));
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(timer);
  }, [timerActive, timeLeft]);

  const handleChoice = (option: string) => {
    setSelected(option);
    const score = option === question.correctAnswer ? 100 : 0;
    setTimeout(() => {
      onNext({
        questionId: question.id,
        score: score,
        userAnswer: option,
        feedback: score === 100 ? "Tuyệt vời!" : "Cố gắng hơn nhé!"
      });
    }, 800);
  };

  const handleActionComplete = () => {
    onNext({
      questionId: question.id,
      score: 100,
      feedback: "Bé làm tốt lắm!"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center text-sm font-bold text-gray-400 uppercase tracking-widest">
        <span>Câu {current} / {total}</span>
        <div className="h-2 w-32 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-400 transition-all duration-500" 
            style={{ width: `${(current / total) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{question.title}</h2>
        <div className="bg-green-50 p-6 rounded-2xl text-green-800 border-2 border-green-100 flex flex-col items-center">
          <p className="text-lg font-medium leading-relaxed">{question.instruction}</p>
        </div>
      </div>

      {question.type === 'ACTION' ? (
        <div className="flex flex-col items-center py-8 space-y-6">
          <div className="w-48 h-48 bg-orange-100 rounded-full flex items-center justify-center border-8 border-orange-400 shadow-inner">
            <span className="text-6xl font-black text-orange-600">
              {timeLeft !== null ? timeLeft : "✓"}
            </span>
          </div>
          
          {!timerActive && timeLeft !== 0 && (
            <button 
              onClick={() => setTimerActive(true)}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-12 rounded-2xl text-xl shadow-lg transform transition active:scale-90"
            >
              BẮT ĐẦU NGAY!
            </button>
          )}

          {timeLeft === 0 && (
            <button 
              onClick={handleActionComplete}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-12 rounded-2xl text-xl shadow-lg"
            >
              XÁC NHẬN HOÀN THÀNH
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 py-2">
          {question.options?.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleChoice(opt)}
              disabled={selected !== null}
              className={`text-left p-5 rounded-2xl border-2 transition-all text-lg font-bold flex items-center gap-4 ${
                selected === opt 
                  ? (opt === question.correctAnswer ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-red-700')
                  : 'bg-white border-green-100 hover:border-green-400 hover:bg-green-50 shadow-sm'
              }`}
            >
              <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                selected === opt ? 'bg-white' : 'bg-green-100 text-green-600'
              }`}>
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
              {selected === opt && (
                <span className="ml-auto">
                  {opt === question.correctAnswer ? <i className="fas fa-check-circle text-2xl"></i> : <i className="fas fa-times-circle text-2xl"></i>}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GameView;
