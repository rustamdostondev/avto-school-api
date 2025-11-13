export interface IQuestion {
  id: string;
  subjectId: string;
  ticketId: string;
  title: {
    oz: string;
    uz: string;
    ru: string;
  };
  info?: {
    oz: string;
    uz: string;
    ru: string;
  };
  fileId?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string;
}

export interface ICreateQuestionDto {
  ticketId: string;
  subjectId: string;
  title: {
    oz: string;
    uz: string;
    ru: string;
  };
  info?: {
    oz: string;
    uz: string;
    ru: string;
  };
  fileId?: string;
}

export interface IUpdateQuestionDto {
  ticketId?: string;
  subjectId?: string;
  title?: {
    oz: string;
    uz: string;
    ru: string;
  };
  info?: {
    oz: string;
    uz: string;
    ru: string;
  };
  fileId?: string;
}
