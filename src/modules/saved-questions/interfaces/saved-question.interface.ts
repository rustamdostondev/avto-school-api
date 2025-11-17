export interface ISavedQuestion {
  id: string;
  userId: string;
  questionId: string;
  status: 'NEW' | 'IN_PROGRESS' | 'LEARNED';
  note?: {
    oz?: string;
    uz?: string;
    ru?: string;
  };
  viewCount: number;
  lastViewedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string;
}

export interface ICreateSavedQuestionDto {
  questionId: string;
  status?: 'NEW' | 'IN_PROGRESS' | 'LEARNED';
  note?: {
    oz?: string;
    uz?: string;
    ru?: string;
  };
}

export interface IUpdateSavedQuestionDto {
  status?: 'NEW' | 'IN_PROGRESS' | 'LEARNED';
  note?: {
    oz?: string;
    uz?: string;
    ru?: string;
  };
}
