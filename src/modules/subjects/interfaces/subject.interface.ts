export interface ISubject {
  id: string;
  name: string;
  description?: string;
  timeLimit: number; // minutes
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface ICreateSubjectDto {
  name: string;
  description?: string;
  timeLimit: number;
}

export interface IUpdateSubjectDto {
  name?: string;
  description?: string;
  timeLimit?: number;
  isActive?: boolean;
}
