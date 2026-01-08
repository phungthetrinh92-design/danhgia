
import React, { useState } from 'react';
import { GameState, Question, UserResult } from './types';
import { GeminiService } from './services/geminiService';
import StartScreen from './components/StartScreen';
import GameView from './components/GameView';
import ResultScreen from './components/ResultScreen';

const gemini = new GeminiService();

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("1");

  const startGame = async (name: string, grade: string) => {
    setPlayerName(name);
    setSelectedGrade(grade);
    setLoading(true);
    const q = await gemini.generatePEQuestions(grade);
    if (q) {
      setQuestions(q);
      setGameState(GameState.PLAYING);
      setCurrentIndex(0);
      setResults([]);
    }
    setLoading(false);
  };

  const handleNext = (result: UserResult) => {
    const newResults = [...results, result];
    setResults(newResults);
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setGameState(GameState.ASSESSMENT);
    }
  };

  const restart = () => {
    setGameState(GameState.START);
    setCurrentIndex(0);
    setResults([]);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#f0fdf4] relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-10 left-10 w-24 h-24 bg-yellow-200 rounded-full opacity-50 blur-xl"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-green-200 rounded-full opacity-50 blur-xl"></div>
      <div className="absolute top-1/2 left-0 w-16 h-16 bg-pink-200 rounded-full opacity-50 blur-lg"></div>

      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 z-10 border-4 border-green-400">
        {gameState === GameState.START && (
          <StartScreen onStart={startGame} loading={loading} />
        )}
        {gameState === GameState.PLAYING && questions.length > 0 && (
          <GameView 
            question={questions[currentIndex]} 
            onNext={handleNext} 
            total={questions.length}
            current={currentIndex + 1}
          />
        )}
        {gameState === GameState.ASSESSMENT && (
          <ResultScreen 
            results={results} 
            playerName={playerName} 
            grade={selectedGrade}
            onRestart={restart}
            gemini={gemini}
          />
        )}
      </div>
    </div>
  );
};

export default App;
