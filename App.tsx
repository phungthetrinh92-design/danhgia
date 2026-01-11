
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, UserRole, Question, QuizResult, AppView, Difficulty, ExamConfig, GradeConfig } from './types';
import { INITIAL_QUIZ } from './constants';
import { generateAIQuestions } from './geminiService';
import Layout from './components/Layout';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';

const TOPICS = [
  "Đội Hình Đội ngũ",
  "Bài Thể Dục Phát Triển Chung",
  "Kĩ Năng Vận động cơ bản",
  "Thể Thao Tự Chọn: Bóng Đá",
  "Thể Thao Tự Chọn: Bóng Rổ",
  "Thể Thao Tự Chọn: Bơi Lội"
];

const GRADES = ['1', '2', '3', '4', '5'];

const DEFAULT_GRADE_CONFIG: GradeConfig = {
  startTime: 0,
  endTime: 0,
  duration: 15, // Default 15 minutes
  isActive: false
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const shuffleQuestionOptions = (q: Question): Question => {
  const optionsWithMeta = q.options.map((opt, idx) => ({
    text: opt,
    isCorrect: idx === q.correctIndex
  }));
  const shuffled = shuffleArray(optionsWithMeta);
  return {
    ...q,
    options: shuffled.map(o => o.text),
    correctIndex: shuffled.findIndex(o => o.isCorrect)
  };
};

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<Question[]>([]);
  const [quizMode, setQuizMode] = useState<'PRACTICE' | 'EXAM'>('PRACTICE');
  const [selectedExamGrade, setSelectedExamGrade] = useState<string | null>(null);
  
  const [showPracticeGrades, setShowPracticeGrades] = useState(false);
  const [selectedPracticeGrade, setSelectedPracticeGrade] = useState<string | null>(null);
  const [selectedPracticeTopic, setSelectedPracticeTopic] = useState<string | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [historyTab, setHistoryTab] = useState<'LIST' | 'CHARTS'>('LIST');
  
  const [examConfigs, setExamConfigs] = useState<ExamConfig>({
    '1': { ...DEFAULT_GRADE_CONFIG },
    '2': { ...DEFAULT_GRADE_CONFIG },
    '3': { ...DEFAULT_GRADE_CONFIG },
    '4': { ...DEFAULT_GRADE_CONFIG },
    '5': { ...DEFAULT_GRADE_CONFIG },
  });

  const [feedback, setFeedback] = useState<{ message: string, type: 'error' | 'success' | null }>({ message: '', type: null });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [finalScore, setFinalScore] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState(TOPICS[0]);
  const [aiGrade, setAiGrade] = useState("1");
  const [configGrade, setConfigGrade] = useState("1");
  const [adminStartTime, setAdminStartTime] = useState("");
  const [adminEndTime, setAdminEndTime] = useState("");
  const [adminDuration, setAdminDuration] = useState(15);

  const [newQGrade, setNewQGrade] = useState("1");
  const [newQTopic, setNewQTopic] = useState(TOPICS[0]);
  const [newQDifficulty, setNewQDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [newQText, setNewQText] = useState("");
  const [newQOpts, setNewQOpts] = useState(["", "", "", ""]);
  const [newQCorrect, setNewQCorrect] = useState(0);

  const [regName, setRegName] = useState("");
  const [regUser, setRegUser] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regClass, setRegClass] = useState("1");
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const quizLengthRef = useRef(0);
  const currentQuizRef = useRef<Question[]>([]);
  const userAnswersRef = useRef<(number | null)[]>([]);
  const timerRef = useRef<number | undefined>(undefined);

  const isSuperAdmin = currentUser?.username === 'admin';

  useEffect(() => {
    quizLengthRef.current = currentQuiz.length;
    currentQuizRef.current = currentQuiz;
    userAnswersRef.current = userAnswers;
  }, [currentQuiz, userAnswers]);

  useEffect(() => {
    const savedUsers = localStorage.getItem("gdtc_users");
    const savedResults = localStorage.getItem("gdtc_results");
    const savedQuestions = localStorage.getItem("gdtc_custom_questions");
    const savedConfigs = localStorage.getItem("gdtc_exam_configs");
    if (savedUsers) setUsers(JSON.parse(savedUsers));
    if (savedResults) setResults(JSON.parse(savedResults));
    if (savedQuestions) setCustomQuestions(JSON.parse(savedQuestions));
    if (savedConfigs) {
      const parsed = JSON.parse(savedConfigs);
      setExamConfigs(parsed);
      const initial = parsed['1'] || DEFAULT_GRADE_CONFIG;
      if (initial.startTime) setAdminStartTime(new Date(initial.startTime).toISOString().slice(0, 16));
      if (initial.endTime) setAdminEndTime(new Date(initial.endTime).toISOString().slice(0, 16));
      setAdminDuration(initial.duration || 15);
    }
  }, []);

  useEffect(() => {
    if (view === AppView.QUIZ && timeLeft !== null) {
      if (timeLeft <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        finishQuiz(true);
      } else {
        timerRef.current = window.setInterval(() => {
          setTimeLeft(prev => (prev !== null ? prev - 1 : null));
        }, 1000);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [view, timeLeft]);

  useEffect(() => localStorage.setItem("gdtc_users", JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem("gdtc_results", JSON.stringify(results)), [results]);
  useEffect(() => localStorage.setItem("gdtc_custom_questions", JSON.stringify(customQuestions)), [customQuestions]);
  useEffect(() => localStorage.setItem("gdtc_exam_configs", JSON.stringify(examConfigs)), [examConfigs]);

  const filteredResults = useMemo(() => {
    if (!currentUser) return [];
    return results.filter(r => isSuperAdmin || r.userId === currentUser.id);
  }, [results, currentUser, isSuperAdmin]);

  const chartData = useMemo(() => {
    const data = [...filteredResults].reverse().map(r => ({
      name: new Date(r.timestamp).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      score: r.score,
      fullDate: new Date(r.timestamp).toLocaleString('vi-VN'),
      type: r.level
    }));
    return data.slice(-10);
  }, [filteredResults]);

  const radarData = useMemo(() => {
    return TOPICS.map(topic => {
      const topicResults = filteredResults.filter(r => 
        r.level.includes(topic) || r.questions?.some(q => q.topic === topic)
      );
      const avg = topicResults.length > 0 
        ? topicResults.reduce((acc, curr) => acc + curr.score, 0) / topicResults.length 
        : 0;
      let axisName = topic;
      if (topic.includes(':')) axisName = topic.split(':')[1].trim();
      else if (topic.length > 15) axisName = topic.substring(0, 12) + '...';
      return { subject: axisName, fullSubject: topic, A: Number(avg.toFixed(1)), fullMark: 10 };
    });
  }, [filteredResults]);

  const showFeedback = (message: string, type: 'error' | 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: null }), 4000);
  };

  const isExamTimeValid = (grade: string) => {
    const config = examConfigs[grade];
    if (!config || !config.isActive) return false;
    const now = Date.now();
    return now >= config.startTime && now <= config.endTime;
  };

  const getExamStatusText = (grade: string) => {
    const config = examConfigs[grade];
    if (!config || !config.isActive) return "Đang khóa";
    const now = Date.now();
    if (now < config.startTime) return "Sắp mở";
    if (now > config.endTime) return "Đã đóng";
    return "Đang mở";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleUpdateGradeConfig = () => {
    const start = new Date(adminStartTime).getTime();
    const end = new Date(adminEndTime).getTime();
    if (isNaN(start) || isNaN(end) || start >= end) return showFeedback("Thời gian không hợp lệ", "error");
    setExamConfigs(prev => ({
      ...prev,
      [configGrade]: { ...prev[configGrade], startTime: start, endTime: end, duration: adminDuration, isActive: true }
    }));
    showFeedback(`Đã cập nhật kỳ thi Khối ${configGrade} (${adminDuration} phút)`, "success");
  };

  const handleToggleGradeActive = (grade: string) => {
    setExamConfigs(prev => ({ ...prev, [grade]: { ...prev[grade], isActive: !prev[grade].isActive } }));
  };

  const syncAdminInputs = (grade: string) => {
    setConfigGrade(grade);
    const config = examConfigs[grade];
    setAdminStartTime(config.startTime ? new Date(config.startTime).toISOString().slice(0, 16) : "");
    setAdminEndTime(config.endTime ? new Date(config.endTime).toISOString().slice(0, 16) : "");
    setAdminDuration(config.duration || 15);
  };

  const handleLogin = () => {
    const userLower = loginUser.trim().toLowerCase();
    if (userLower === "admin" && loginPass === (localStorage.getItem("admin_pass") || "123")) {
      setCurrentUser({ id: 'admin', name: "Quản Trị Viên", username: 'admin', className: 'Admin', role: UserRole.TEACHER });
      setView(AppView.MENU);
      return;
    }
    const user = users.find(u => u.username.toLowerCase() === userLower && u.password === loginPass);
    if (user) { setCurrentUser(user); setView(AppView.MENU); }
    else showFeedback("Sai tài khoản hoặc mật khẩu", "error");
  };

  const handleRegister = () => {
    if (!regName || !regUser || !regPass) return showFeedback("Vui lòng nhập đủ thông tin", "error");
    if (users.some(u => u.username === regUser)) return showFeedback("Tên đăng nhập đã tồn tại", "error");
    const newUser: User = { id: Date.now().toString(), name: regName, username: regUser, password: regPass, className: regClass, role: UserRole.STUDENT };
    setUsers([...users, newUser]);
    showFeedback("Đăng ký thành công", "success");
    setRegName(""); setRegUser(""); setRegPass("");
  };

  const handleChangePassword = () => {
    if (!newPassword || newPassword !== confirmPassword) return showFeedback("Mật khẩu xác nhận không khớp", "error");
    if (currentUser?.username === 'admin') {
      localStorage.setItem("admin_pass", newPassword);
      showFeedback("Đã đổi mật khẩu Admin", "success");
    } else {
      setUsers(users.map(u => u.id === currentUser?.id ? { ...u, password: newPassword } : u));
      showFeedback("Đã đổi mật khẩu thành công", "success");
    }
    setNewPassword(""); setConfirmPassword(""); setShowSettings(false);
  };

  const handleResetData = () => {
    if (!window.confirm("Xóa dữ liệu vĩnh viễn?")) return;
    if (currentUser?.role === UserRole.TEACHER) { setResults([]); setCustomQuestions([]); }
    else { setResults(results.filter(r => r.userId !== currentUser?.id)); }
    setShowSettings(false);
  };

  const handleAnswerClick = (index: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = index;
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < currentQuiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz();
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const finishQuiz = (isAutoSubmit = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const questions = currentQuizRef.current;
    const answers = userAnswersRef.current;
    const qCount = questions.length;
    
    let totalCorrect = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) totalCorrect++;
    });

    const rawScore = qCount > 0 ? (totalCorrect / qCount) * 10 : 0;
    const calculatedScore = Number(rawScore.toFixed(1));
    
    setFinalScore(calculatedScore);
    const modeName = quizMode === 'EXAM' ? `Kỳ thi Khối ${selectedExamGrade}` : `Ôn tập ${selectedPracticeTopic} - Khối ${selectedExamGrade}`;
    const statusNote = isAutoSubmit ? " (Hết giờ)" : "";
    const newResult: QuizResult = {
      id: Date.now().toString(),
      userId: currentUser?.id || "anon",
      studentName: currentUser?.name || "Ẩn danh",
      className: currentUser?.className || "N/A",
      score: calculatedScore,
      totalQuestions: qCount,
      level: modeName + statusNote,
      timestamp: Date.now(),
      questions: questions,
      userAnswers: answers.map(a => a ?? -1)
    };
    setResults(prev => [newResult, ...prev]);
    setTimeLeft(null);
    setView(AppView.RESULT);
  };

  const startPractice = (grade: string, topic: string, difficulty: Difficulty) => {
    setQuizMode('PRACTICE'); 
    setSelectedExamGrade(grade); 
    setCurrentQuestionIndex(0); 
    setTimeLeft(null);
    const allQuestions = [...INITIAL_QUIZ, ...customQuestions];
    let pool = allQuestions.filter(q => q.grade === grade && q.topic === topic && (q.difficulty === difficulty || !q.difficulty));
    if (pool.length === 0) pool = allQuestions.filter(q => q.grade === grade && q.topic === topic);
    if (pool.length === 0) pool = allQuestions.filter(q => q.grade === grade);
    if (pool.length === 0) pool = allQuestions; 
    const selected = shuffleArray(pool).slice(0, 15).map(q => shuffleQuestionOptions(q));
    setCurrentQuiz(selected);
    setUserAnswers(new Array(selected.length).fill(null));
    setShowPracticeGrades(false); setSelectedPracticeGrade(null); setSelectedPracticeTopic(null); setView(AppView.QUIZ);
  };

  const startExam = (grade: string) => {
    if (currentUser?.role !== UserRole.TEACHER) {
       if (!isExamTimeValid(grade)) return showFeedback(`Kỳ thi Khối ${grade} hiện đang đóng`, "error");
       if (results.some(r => r.userId === currentUser?.id && r.level.includes(`Kỳ thi Khối ${grade}`))) return showFeedback("Bạn đã thi rồi", "error");
    }
    const config = examConfigs[grade];
    const gradePool = customQuestions.filter(q => q.grade === grade);
    let finalExamPool = gradePool.length >= 10 ? shuffleArray(gradePool).slice(0, 10) : shuffleArray([...gradePool, ...INITIAL_QUIZ]).slice(0, 10);
    finalExamPool = finalExamPool.map(q => shuffleQuestionOptions(q));
    setQuizMode('EXAM'); setSelectedExamGrade(grade); setCurrentQuestionIndex(0);
    setCurrentQuiz(finalExamPool);
    setUserAnswers(new Array(finalExamPool.length).fill(null));
    setTimeLeft((config.duration || 15) * 60);
    setView(AppView.QUIZ);
  };

  const handleAddQuestion = () => {
    if (!newQText.trim() || newQOpts.some(o => !o.trim())) return showFeedback("Điền đủ nội dung", "error");
    const newQ: Question = { id: Date.now().toString(), text: newQText, options: [...newQOpts], correctIndex: newQCorrect, grade: newQGrade, topic: newQTopic, difficulty: newQDifficulty };
    setCustomQuestions([...customQuestions, newQ]);
    setNewQText(""); setNewQOpts(["", "", "", ""]);
    showFeedback("Đã lưu câu hỏi", "success");
  };

  const getReviewQuestions = () => {
    const lastResult = results[0];
    if (!lastResult || !lastResult.questions || !lastResult.userAnswers) return [];
    return lastResult.questions.map((q, i) => ({
      question: q,
      userAnswer: lastResult.userAnswers![i]
    })).filter(item => item.userAnswer !== item.question.correctIndex);
  };

  const exportToCSV = () => {
    if (!isSuperAdmin) return;
    const headers = ["Tên Học Sinh", "Lớp", "Điểm Số", "Kỳ Thi / Ôn Tập", "Ngày Giờ"];
    const rows = results.map(r => [r.studentName, r.className, r.score.toString(), r.level, new Date(r.timestamp).toLocaleString('vi-VN')]);
    const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ket_qua_gdtc_${new Date().toLocaleDateString('vi-VN')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFeedback("Đã xuất file CSV thành công", "success");
  };

  const correctAnswersFinal = useMemo(() => {
    const lastResult = results[0];
    if (!lastResult) return 0;
    let count = 0;
    lastResult.questions?.forEach((q, i) => {
      if (lastResult.userAnswers?.[i] === q.correctIndex) count++;
    });
    return count;
  }, [results]);

  return (
    <Layout title="GDTC PRIMARY" onLogout={() => {setCurrentUser(null); setView(AppView.LOGIN);}} showLogout={view !== AppView.LOGIN}>
      
      {feedback.type && (
        <div className={`fixed top-24 right-4 z-[100] p-4 rounded-lg shadow-lg border-l-4 ${feedback.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' : 'bg-green-50 border-green-500 text-green-800'}`}>
          <p className="font-semibold text-sm">{feedback.message}</p>
        </div>
      )}

      {view === AppView.LOGIN && (
        <div className="max-w-md mx-auto space-y-8 py-12">
          <div className="text-center space-y-2">
             <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Đăng Nhập</h2>
             <p className="text-slate-500 text-sm italic font-medium">Trường PTDTBT TH Số 1 Lùng Thẩn Xã Lùng Phình</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
            <div className="space-y-4">
               <input placeholder="Tên đăng nhập" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" value={loginUser} onChange={e => setLoginUser(e.target.value)} />
               <input type="password" placeholder="Mật khẩu" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" value={loginPass} onChange={e => setLoginPass(e.target.value)} />
               <button onClick={handleLogin} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-md">Đăng Nhập</button>
            </div>
            <div className="space-y-4 border-t pt-6 text-left">
               <input placeholder="Họ tên học sinh" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm" value={regName} onChange={e => setRegName(e.target.value)} />
               <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Tên đăng nhập" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm" value={regUser} onChange={e => setRegUser(e.target.value)} />
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm" value={regClass} onChange={e => setRegClass(e.target.value)}>
                     {GRADES.map(v => <option key={v} value={v}>Lớp {v}</option>)}
                  </select>
               </div>
               <input type="password" placeholder="Mật khẩu" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm" value={regPass} onChange={e => setRegPass(e.target.value)} />
               <button onClick={handleRegister} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm transition-all">Học sinh đăng ký</button>
            </div>
          </div>
        </div>
      )}

      {view === AppView.MENU && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-10 rounded-2xl text-white shadow-lg flex items-center justify-between border-b-4 border-orange-700">
             <div className="space-y-2 text-left">
                <h2 className="text-2xl font-bold">Chào mừng, {currentUser?.name}</h2>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded text-[10px] font-bold uppercase tracking-wider">{currentUser?.username === 'admin' ? 'Super Admin' : currentUser?.role === UserRole.TEACHER ? 'Giáo Viên' : `Lớp ${currentUser?.className}`}</span>
             </div>
             <button onClick={() => setShowSettings(!showSettings)} className="p-3 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all">Cài Đặt</button>
          </div>

          {showSettings && (
            <div className="bg-white p-10 rounded-2xl border-2 border-orange-500 shadow-xl space-y-8 animate-in zoom-in-95">
               <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold uppercase tracking-tight text-orange-600">Tài khoản & Bảo mật</h3>
                  <button onClick={() => setShowSettings(false)} className="text-slate-400 font-bold">Đóng</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                     <input type="password" placeholder="Mật khẩu mới" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                     <input type="password" placeholder="Xác nhận mật khẩu" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                     <button onClick={handleChangePassword} className="w-full py-3 bg-orange-600 text-white rounded-lg font-bold text-xs uppercase shadow-md hover:bg-orange-700 transition-all">Cập Nhật Mật Khẩu</button>
                  </div>
                  <div className="space-y-4 p-6 bg-red-50 rounded-xl border border-red-100">
                     <p className="text-xs text-red-600 font-medium text-left">Hành động này sẽ xóa các bản ghi {currentUser?.role === UserRole.TEACHER ? 'hệ thống' : 'của bạn'}.</p>
                     <button onClick={handleResetData} className="w-full py-3 bg-red-600 text-white rounded-lg font-bold text-xs uppercase shadow-md">Reset Dữ Liệu</button>
                  </div>
               </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all">
              <button onClick={() => { setShowPracticeGrades(!showPracticeGrades); setSelectedPracticeGrade(null); setSelectedPracticeTopic(null); }} className="text-left p-8 group w-full">
                 <h3 className="text-xl font-bold text-slate-900 uppercase">Ôn Tập Tự Do</h3>
                 <p className="text-sm text-slate-500 leading-relaxed mt-2">Rèn luyện kiến thức thể chất (15 câu ngẫu nhiên).</p>
              </button>
              {showPracticeGrades && (
                <div className="p-4 bg-slate-50 border-t border-slate-100 animate-in slide-in-from-top duration-300 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <button onClick={() => {setSelectedPracticeGrade(null); setSelectedPracticeTopic(null);}} className="text-[10px] font-bold uppercase text-slate-400 hover:text-blue-600">Ôn tập</button>
                    {selectedPracticeGrade && <><span className="text-slate-300">/</span><button onClick={() => setSelectedPracticeTopic(null)} className="text-[10px] font-bold uppercase text-slate-400 hover:text-blue-600">Lớp {selectedPracticeGrade}</button></>}
                    {selectedPracticeTopic && <><span className="text-slate-300">/</span><span className="text-[10px] font-bold uppercase text-blue-600">{selectedPracticeTopic}</span></>}
                  </div>
                  {!selectedPracticeGrade ? (
                    <div className="grid grid-cols-5 gap-1">
                      {GRADES.map(grade => (
                        <button key={grade} onClick={() => setSelectedPracticeGrade(grade)} className="py-3 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-blue-600 hover:text-white transition-all text-sm">Lớp {grade}</button>
                      ))}
                    </div>
                  ) : !selectedPracticeTopic ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {TOPICS.map(topic => (
                        <button key={topic} onClick={() => setSelectedPracticeTopic(topic)} className="p-3 bg-white border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-blue-600 hover:text-white transition-all text-[10px] uppercase text-left">{topic}</button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => startPractice(selectedPracticeGrade, selectedPracticeTopic, Difficulty.EASY)} className="py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg font-bold text-xs uppercase hover:bg-green-600 hover:text-white transition-all">Dễ</button>
                        <button onClick={() => startPractice(selectedPracticeGrade, selectedPracticeTopic, Difficulty.MEDIUM)} className="py-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg font-bold text-xs uppercase hover:bg-amber-600 hover:text-white transition-all">T.Bình</button>
                        <button onClick={() => startPractice(selectedPracticeGrade, selectedPracticeTopic, Difficulty.HARD)} className="py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg font-bold text-xs uppercase hover:bg-red-600 hover:text-white transition-all">Khó</button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button onClick={() => setView(AppView.AI_GEN)} className="text-left bg-white p-8 rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all group">
               <h3 className="text-xl font-bold text-slate-900 uppercase">Trợ Lý AI</h3>
               <p className="text-sm text-slate-500 leading-relaxed mt-2">Tạo đề thi tự động với Trí tuệ nhân tạo.</p>
            </button>
          </div>

          <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm space-y-8">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900 uppercase">Kỳ Thi Chính Thức</h3>
                {isSuperAdmin && (
                  <button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm">
                    Xuất Dữ Liệu (CSV)
                  </button>
                )}
             </div>
             <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {GRADES.map((grade) => {
                   const config = examConfigs[grade];
                   const attempted = results.some(r => r.userId === currentUser?.id && r.level.includes(`Kỳ thi Khối ${grade}`));
                   const isOngoing = isExamTimeValid(grade);
                   const status = getExamStatusText(grade);
                   const isDisabled = (currentUser?.role !== UserRole.TEACHER && (!isOngoing || attempted));
                   return (
                     <button key={grade} disabled={isDisabled} onClick={() => startExam(grade)}
                       className={`p-6 rounded-xl flex flex-col items-center justify-center gap-3 transition-all border-2 relative ${isDisabled ? 'bg-slate-50 border-slate-100 text-slate-300' : 'bg-white border-slate-200 text-blue-600 hover:border-blue-600 hover:bg-blue-50'}`}>
                       <div className="text-2xl font-bold">Khối {grade}</div>
                       <div className={`text-[10px] font-bold uppercase ${isOngoing ? 'text-green-600' : 'text-slate-400'}`}>{attempted ? "Đã Thi" : status}</div>
                       {config.isActive && (
                         <div className="text-[9px] text-slate-400 font-medium text-center mt-2 border-t pt-2 w-full">
                           {new Date(config.startTime).toLocaleString('vi-VN', {hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'})}
                           <br/>- {config.duration} phút
                         </div>
                       )}
                     </button>
                   );
                })}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <button onClick={() => setView(AppView.RANKING)} className="p-8 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all flex items-center justify-between group">
                <span className="font-bold text-slate-800 text-lg uppercase">Bảng Xếp Hạng</span>
                <span>→</span>
             </button>
             <button onClick={() => { setView(AppView.HISTORY); setHistoryTab('CHARTS'); }} className="p-8 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all flex items-center justify-between group">
                <span className="font-bold text-slate-800 text-lg uppercase">Lịch Sử & Tiến Độ</span>
                <span>→</span>
             </button>
          </div>

          {currentUser?.role === UserRole.TEACHER && (
            <div className="pt-12 border-t border-slate-200 space-y-8">
               <div className="bg-slate-50 rounded-2xl p-10 space-y-8 text-left border-l-4 border-orange-500">
                  <h3 className="text-2xl font-bold uppercase text-orange-600 flex items-center gap-3">
                    <span className="p-2 bg-orange-100 rounded-lg">⚙️</span>
                    Quản Trị Hệ Thống
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Cài Đặt Lịch Thi & Giờ Thi</label>
                           <select className="w-full p-3 border rounded-lg bg-slate-50 font-bold" value={configGrade} onChange={e => syncAdminInputs(e.target.value)}>
                             {GRADES.map(g => <option key={g} value={g}>Cấu hình Khối {g}</option>)}
                           </select>
                           <div className="space-y-3">
                              <div>
                                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Thời gian bắt đầu</label>
                                 <input type="datetime-local" className="w-full p-3 border rounded-lg text-sm bg-slate-50 focus:bg-white transition-all" value={adminStartTime} onChange={e => setAdminStartTime(e.target.value)} />
                              </div>
                              <div>
                                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Thời gian kết thúc</label>
                                 <input type="datetime-local" className="w-full p-3 border rounded-lg text-sm bg-slate-50 focus:bg-white transition-all" value={adminEndTime} onChange={e => setAdminEndTime(e.target.value)} />
                              </div>
                              <div>
                                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Thời gian làm bài (phút)</label>
                                 <input type="number" min="1" max="180" className="w-full p-3 border rounded-lg text-sm bg-slate-50 focus:bg-white transition-all" value={adminDuration} onChange={e => setAdminDuration(parseInt(e.target.value))} />
                              </div>
                           </div>
                           <div className="flex gap-2 pt-2">
                             <button onClick={handleUpdateGradeConfig} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs uppercase shadow-sm transition-all">Lưu Cấu Hình</button>
                             <button onClick={() => handleToggleGradeActive(configGrade)} className={`px-4 py-3 rounded-lg font-bold text-xs text-white ${examConfigs[configGrade]?.isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} shadow-sm transition-all`}>{examConfigs[configGrade]?.isActive ? 'Khóa Đề' : 'Mở Đề'}</button>
                           </div>
                        </div>
                     </div>
                     <div className="space-y-6">
                        <div className="bg-white p-8 rounded-xl border space-y-4">
                           <h4 className="text-sm font-bold uppercase text-slate-500">Soạn Câu Hỏi</h4>
                           <div className="grid grid-cols-2 gap-3">
                              <select className="p-3 border rounded-lg text-xs" value={newQGrade} onChange={e => setNewQGrade(e.target.value)}>{GRADES.map(v => <option key={v} value={v}>Lớp {v}</option>)}</select>
                              <select className="p-3 border rounded-lg text-xs" value={newQDifficulty} onChange={e => setNewQDifficulty(e.target.value as Difficulty)}>{Object.values(Difficulty).map(v => <option key={v} value={v}>{v}</option>)}</select>
                           </div>
                           <select className="w-full p-3 border rounded-lg text-xs" value={newQTopic} onChange={e => setNewQTopic(e.target.value)}>{TOPICS.map(t => <option key={t} value={t}>{t}</option>)}</select>
                           <textarea placeholder="Nhập câu hỏi..." className="w-full p-3 border rounded-lg text-sm h-20 resize-none outline-none focus:ring-1 focus:ring-slate-300" value={newQText} onChange={e => setNewQText(e.target.value)} />
                           {newQOpts.map((opt, i) => (
                             <input key={i} placeholder={`Đáp án ${String.fromCharCode(65+i)}`} className="w-full p-2 border rounded-lg text-xs" value={opt} onChange={e => { const n = [...newQOpts]; n[i] = e.target.value; setNewQOpts(n); }} />
                           ))}
                           <select className="w-full p-3 border rounded-lg text-xs font-bold text-blue-600" value={newQCorrect} onChange={e => setNewQCorrect(parseInt(e.target.value))}>{[0,1,2,3].map(i => <option key={i} value={i}>Đáp án đúng: {String.fromCharCode(65+i)}</option>)}</select>
                           <button onClick={handleAddQuestion} className="w-full py-3 bg-slate-900 text-white rounded-lg font-bold text-xs uppercase shadow-md transition-all hover:bg-black">Lưu Câu Hỏi</button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      )}

      {view === AppView.QUIZ && (
        <div className="max-w-3xl mx-auto py-6 space-y-8 animate-in zoom-in-95 duration-300 pb-32">
           {timeLeft !== null && (
             <div className="sticky top-[80px] z-40 bg-white border-2 border-slate-900 p-4 rounded-xl shadow-lg flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <div className={`w-3 h-3 rounded-full animate-pulse ${timeLeft < 60 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                   <span className="text-sm font-bold uppercase tracking-widest text-slate-500">Thời gian còn lại</span>
                </div>
                <span className={`text-2xl font-black tabular-nums ${timeLeft < 60 ? 'text-red-600 animate-bounce' : 'text-slate-900'}`}>{formatTime(timeLeft)}</span>
             </div>
           )}
           <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 space-y-8 relative overflow-hidden text-left">
              <div className="flex justify-between items-end">
                 <div>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">{quizMode === 'EXAM' ? `Thi Khối ${selectedExamGrade}` : `Ôn tập ${selectedPracticeTopic} - Khối ${selectedExamGrade}`}</span>
                    <h4 className="text-2xl font-bold text-slate-900 mt-2">Câu {currentQuestionIndex + 1}</h4>
                 </div>
                 <span className="text-slate-400 font-bold text-xl">{currentQuestionIndex + 1}/{currentQuiz.length}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600 transition-all duration-300" style={{width: `${((currentQuestionIndex+1)/currentQuiz.length)*100}%`}}></div></div>
              <p className="text-xl font-medium text-slate-800 leading-relaxed">{currentQuiz[currentQuestionIndex].text}</p>
           </div>
           <div className="grid grid-cols-1 gap-4">
              {currentQuiz[currentQuestionIndex].options.map((opt, i) => (
                <button 
                  key={i} 
                  onClick={() => handleAnswerClick(i)} 
                  className={`flex items-center p-6 border rounded-xl transition-all text-left group shadow-sm ${userAnswers[currentQuestionIndex] === i ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700'}`}
                >
                   <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold mr-6 transition-all ${userAnswers[currentQuestionIndex] === i ? 'bg-white text-blue-600' : 'bg-slate-100 group-hover:bg-blue-600 group-hover:text-white'}`}>{String.fromCharCode(65+i)}</div>
                   <span className="font-semibold text-lg">{opt}</span>
                </button>
              ))}
           </div>

           {/* Navigation Controls */}
           <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-6 z-50">
             <div className="max-w-3xl mx-auto flex gap-4">
               <button 
                 onClick={handleBack} 
                 disabled={currentQuestionIndex === 0}
                 className={`flex-1 py-4 font-bold rounded-lg uppercase tracking-wider text-sm shadow-md transition-all ${currentQuestionIndex === 0 ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
               >
                 Quay lại
               </button>
               
               {quizMode === 'PRACTICE' && (
                 <button 
                   onClick={() => { if(window.confirm("Kết thúc lượt ôn tập ngay?")) finishQuiz(); }}
                   className="px-6 py-4 bg-red-50 text-red-600 font-bold rounded-lg uppercase tracking-wider text-[10px] border border-red-200 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                 >
                   Kết thúc sớm
                 </button>
               )}

               <button 
                 onClick={handleNext}
                 disabled={userAnswers[currentQuestionIndex] === null}
                 className={`flex-[2] py-4 font-bold rounded-lg uppercase tracking-wider text-sm shadow-md transition-all ${userAnswers[currentQuestionIndex] === null ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
               >
                 {currentQuestionIndex === currentQuiz.length - 1 ? 'Nộp bài & Kết thúc' : 'Câu tiếp theo'}
               </button>
             </div>
           </div>
        </div>
      )}

      {view === AppView.RESULT && (
        <div className="max-w-2xl mx-auto py-12 space-y-8 animate-in zoom-in-95 duration-500">
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-center">
              <div className="bg-slate-900 p-12 text-white">
                 <h2 className="text-3xl font-bold uppercase tracking-widest mb-4">Kết Quả</h2>
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{results[0]?.level}</p>
              </div>
              <div className="p-12 space-y-10">
                 <div className="flex flex-col items-center gap-2">
                    <span className="text-7xl font-bold text-slate-900 tracking-tighter">{finalScore}</span>
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Điểm Số Cuối Cùng</span>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-6 rounded-xl border">
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Câu đúng</p>
                       <p className="text-2xl font-bold text-slate-800">{correctAnswersFinal}/{currentQuiz.length}</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-xl border">
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Xếp loại</p>
                       <p className="text-xl font-bold text-slate-800">{finalScore >= 9 ? "Xuất sắc" : finalScore >= 7 ? "Khá Giỏi" : "Cần cố gắng"}</p>
                    </div>
                 </div>
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {correctAnswersFinal < currentQuiz.length && (
                <button onClick={() => setView(AppView.REVIEW)} className="w-full py-4 bg-blue-600 text-white font-bold rounded-lg uppercase tracking-wider text-sm transition-all hover:bg-blue-700 shadow-md">Xem lại câu sai</button>
              )}
              <button onClick={() => setView(AppView.MENU)} className={`${correctAnswersFinal < currentQuiz.length ? 'w-full' : 'col-span-2'} py-4 bg-slate-900 text-white font-bold rounded-lg uppercase tracking-wider text-sm hover:bg-black shadow-md`}>Trở về trang chủ</button>
           </div>
        </div>
      )}

      {view === AppView.REVIEW && (
        <div className="max-w-3xl mx-auto py-6 space-y-8 animate-in slide-in-from-right duration-500">
           <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-slate-900 uppercase">Review Câu Sai</h2>
              <p className="text-slate-500 text-sm italic">Cùng xem lại kiến thức để làm tốt hơn ở lần sau!</p>
           </div>
           <div className="space-y-6">
              {getReviewQuestions().map((item, idx) => (
                <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-left space-y-4">
                   <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase tracking-wider">Câu hỏi {idx + 1}</span>
                      {item.question.topic && <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-wider">{item.question.topic}</span>}
                   </div>
                   <p className="text-lg font-bold text-slate-800">{item.question.text}</p>
                   <div className="grid grid-cols-1 gap-2">
                      {item.question.options.map((opt, i) => {
                        const isCorrect = i === item.question.correctIndex;
                        const isUserAnswer = i === item.userAnswer;
                        return (
                          <div key={i} className={`p-4 rounded-xl flex items-center gap-4 border-2 transition-all ${isCorrect ? 'bg-green-50 border-green-500' : isUserAnswer ? 'bg-red-50 border-red-500' : 'bg-slate-50 border-transparent'}`}>
                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${isCorrect ? 'bg-green-600 text-white' : isUserAnswer ? 'bg-red-600 text-white' : 'bg-white text-slate-400'}`}>{String.fromCharCode(65+i)}</div>
                             <span className={`text-sm font-semibold flex-1 ${isCorrect ? 'text-green-800' : isUserAnswer ? 'text-red-800' : 'text-slate-500'}`}>{opt}</span>
                             {isCorrect && <span className="text-green-600 font-bold text-xs uppercase">Đáp án đúng</span>}
                             {isUserAnswer && !isCorrect && <span className="text-red-600 font-bold text-xs uppercase">Bạn chọn</span>}
                          </div>
                        );
                      })}
                   </div>
                </div>
              ))}
           </div>
           <button onClick={() => setView(AppView.MENU)} className="w-full py-4 bg-slate-900 text-white font-bold rounded-lg uppercase tracking-widest text-xs shadow-md">Quay Lại Trang Chủ</button>
        </div>
      )}

      {(view === AppView.RANKING || view === AppView.HISTORY) && (
        <div className="space-y-8 py-6 animate-in slide-in-from-right duration-500 text-left">
           <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-slate-900 uppercase">{view === AppView.RANKING ? "Bảng Xếp Hạng" : "Lịch Sử & Tiến Độ"}</h2>
              {view === AppView.HISTORY && (
                <div className="flex bg-slate-200 p-1 rounded-lg">
                  <button onClick={() => setHistoryTab('CHARTS')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${historyTab === 'CHARTS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Tiến độ</button>
                  <button onClick={() => setHistoryTab('LIST')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${historyTab === 'LIST' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Danh sách</button>
                </div>
              )}
           </div>

           {view === AppView.HISTORY && historyTab === 'CHARTS' ? (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Biểu đồ tiến độ (10 lần gần nhất)</h3>
                   <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94A3B8'}} dy={10} />
                            <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94A3B8'}} />
                            <Tooltip 
                               contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                               itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                            />
                            <Line type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                         </LineChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thống kê năng lực theo chủ đề</h3>
                   <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid stroke="#E2E8F0" />
                            <PolarAngleAxis dataKey="subject" tick={{fontSize: 10, fill: '#475569', fontWeight: 'bold'}} />
                            <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                            <Radar name="Năng lực" dataKey="A" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.6} />
                            <Tooltip 
                               formatter={(value) => [value, 'Điểm TB']}
                               contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                         </RadarChart>
                      </ResponsiveContainer>
                   </div>
                </div>
             </div>
           ) : (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 border-b">
                      <tr>
                         <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thí sinh</th>
                         <th className="px-8 py-5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Điểm</th>
                         <th className="px-8 py-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ngày thi</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y">
                      {(view === AppView.RANKING ? results.filter(r => r.level.includes('Khối')).sort((a,b) => b.score - a.score).slice(0, 10) : filteredResults).map(r => (
                         <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-8 py-6">
                               <div className="font-bold text-slate-800 uppercase text-lg">{r.studentName}</div>
                               <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Lớp {r.className} | {r.level}</div>
                            </td>
                            <td className="px-8 py-6 text-center"><span className="text-4xl font-bold text-blue-600 tracking-tighter">{r.score}</span></td>
                            <td className="px-8 py-6 text-right text-[10px] font-medium text-slate-400">{new Date(r.timestamp).toLocaleString('vi-VN')}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
           )}
           <button onClick={() => setView(AppView.MENU)} className="w-full py-4 bg-slate-900 text-white font-bold rounded-lg uppercase tracking-widest text-xs shadow-md">Quay Lại</button>
        </div>
      )}

      {view === AppView.AI_GEN && (
        <div className="max-w-3xl mx-auto bg-white p-10 rounded-2xl border border-slate-200 shadow-sm space-y-10 animate-in slide-in-from-bottom duration-500 text-left">
           <h2 className="text-3xl font-bold text-slate-900 tracking-tight text-center uppercase">Tạo Đề Với AI</h2>
           <div className="space-y-8">
              <div className="space-y-4">
                 <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Bước 1: Chọn khối lớp</label>
                 <div className="grid grid-cols-5 gap-3">
                   {GRADES.map(grade => (
                     <button key={grade} onClick={() => setAiGrade(grade)} className={`py-4 rounded-xl border-2 font-bold transition-all ${aiGrade === grade ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}>Lớp {grade}</button>
                   ))}
                 </div>
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Bước 2: Chọn chủ đề</label>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {TOPICS.map((topic, idx) => (
                     <button key={idx} onClick={() => setAiTopic(topic)} className={`text-left p-4 rounded-xl border-2 font-bold transition-all ${aiTopic === topic ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' : 'bg-slate-50 border-transparent text-slate-600'}`}>{topic}</button>
                   ))}
                 </div>
              </div>
           </div>
           
           <div className="flex flex-col md:flex-row gap-4">
             <button onClick={() => setView(AppView.MENU)} className="flex-1 py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl shadow-sm uppercase tracking-widest text-sm transition-all active:scale-95">
                Quay Lại
             </button>
             <button disabled={isGenerating} onClick={async () => {
                setIsGenerating(true);
                try {
                  const aiQs = await generateAIQuestions(`${aiTopic} - Khối lớp ${aiGrade}`);
                  setCurrentQuiz(aiQs.map(q => ({ ...q, grade: aiGrade, topic: aiTopic })));
                  setQuizMode('PRACTICE'); setCurrentQuestionIndex(0); 
                  setCurrentQuiz(aiQs.map(q => ({ ...q, grade: aiGrade, topic: aiTopic })));
                  setUserAnswers(new Array(aiQs.length).fill(null));
                  setSelectedExamGrade(aiGrade); setView(AppView.QUIZ);
                } catch { showFeedback("Lỗi AI, vui lòng thử lại.", "error"); }
                finally { setIsGenerating(false); }
             }} className="flex-[2] py-5 bg-indigo-600 text-white font-bold rounded-xl shadow-xl uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all active:scale-95">
               {isGenerating ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> AI đang suy nghĩ...</>) : "Xác Nhận Tạo Đề"}
             </button>
           </div>
        </div>
      )}

    </Layout>
  );
};

export default App;
