
export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER'
}

export enum Difficulty {
  EASY = 'Dễ',
  MEDIUM = 'Trung bình',
  HARD = 'Khó',
  EXTREME = 'Cực khó'
}

export interface GradeConfig {
  startTime: number;
  endTime: number;
  duration: number; // Duration in minutes
  isActive: boolean;
}

export interface ExamConfig {
  [grade: string]: GradeConfig;
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  className: string;
  role: UserRole;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  grade?: string;
  topic?: string;
  lesson?: string;
  difficulty?: Difficulty;
}

export interface QuizResult {
  id: string;
  userId: string;
  studentName: string;
  className: string;
  score: number;
  totalQuestions: number;
  level: string;
  timestamp: number;
  questions?: Question[];
  userAnswers?: number[];
}

export enum AppView {
  LOGIN = 'LOGIN',
  MENU = 'MENU',
  QUIZ = 'QUIZ',
  RESULT = 'RESULT',
  RANKING = 'RANKING',
  HISTORY = 'HISTORY',
  AI_GEN = 'AI_GEN',
  REVIEW = 'REVIEW'
}
