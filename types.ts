
export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  ASSESSMENT = 'ASSESSMENT',
}

export interface Question {
  id: number;
  type: 'KNOWLEDGE' | 'ACTION' | 'IDENTIFY';
  title: string;
  instruction: string;
  options?: string[];
  correctAnswer?: string;
  duration?: number; // for action tasks
  imageHint?: string;
}

export interface UserResult {
  questionId: number;
  score: number;
  feedback: string;
  userAnswer?: string;
}
