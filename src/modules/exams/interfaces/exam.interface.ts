export interface IExamSession {
  id: string;
  userId: string;
  subjectId: string;
  questions: IExamQuestion[];
  startedAt: Date;
  endedAt?: Date;
  timeLimit: number; // minutes
  status: 'active' | 'completed' | 'expired';
  score?: number;
  totalQuestions: number;
  correctAnswers?: number;
}

export interface IExamQuestion {
  questionId: string;
  question: string;
  options: string[];
  userAnswer?: number;
  isCorrect?: boolean;
}

export interface IStartExamDto {
  subjectId?: string;
  ticketId?: string;
  type: 'SUBJECT' | 'TICKET' | 'RANDOM';
}

export interface ISubmitAnswerDto {
  questionId: string;
  answer: number;
}

export interface ISubmitExamDto {
  answers: {
    questionId: string;
    answer: number;
  }[];
}

export interface IExamResult {
  id: string;
  userId: string;
  subjectId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  completedAt: Date;
  timeSpent: number; // minutes
}
