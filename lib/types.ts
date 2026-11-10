export interface QuestionOption {
  id: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface QuestionClient {
  id: number;
  questionNumber: number;
  question: string;
  options: QuestionOption[];
}

export interface QuestionServer extends QuestionClient {
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

export interface StudentSession {
  firstName: string;
  lastName: string;
  startTime: number; // timestamp in ms
  durationSeconds: number; // 600 (10 mins)
  questionIdsOrder: number[]; // randomized order of question IDs
  answers: Record<number, 'A' | 'B' | 'C' | 'D'>;
  isSubmitted: boolean;
  submittedAt?: number;
  score?: number;
  total?: number;
  percentage?: number;
  timeSpentSeconds?: number;
  timeSpentFormatted?: string;
  createdAt: number;
}

export interface SubmissionRecord {
  id: string;
  firstName: string;
  lastName: string;
  score: number;
  total: number;
  percentage: number;
  timeSpentSeconds: number;
  timeSpentFormatted: string;
  submittedAt: number;
  createdAt: number;
  answers: Record<number, 'A' | 'B' | 'C' | 'D'>;
}

export interface DeviceRegistration {
  firstName: string;
  lastName: string;
  registeredAt: number;
  expiresAt: number; // 30 days from registration
}
