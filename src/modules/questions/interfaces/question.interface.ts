export interface IQuestion {
  id: string;
  subjectId: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface ICreateQuestionDto {
  subjectId: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface IUpdateQuestionDto {
  question?: string;
  options?: string[];
  correctAnswer?: number;
  isActive?: boolean;
}
