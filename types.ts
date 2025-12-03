// App Data Types
export interface Task {
  id: string;
  text: string;
  isComplete: boolean;
  isProactiveDone: boolean;
  createdAt: number;
}

export interface Concept {
  id: string;
  topic: string;
  confidenceScore: number;
  createdAt: number;
}

export interface Habit {
  id: string;
  name: string;
  lastCompletedDate: string | null;
  streak: number;
  createdAt: number;
}

export interface ActionStep {
  stepNumber: number;
  isCompleted: boolean;
  title: string;
  description: string;
  estimatedTime: string;
}

export interface StudyFeedback {
  score: number;
  understandingLevel: string;
  missingConcepts: string[];
  betterExplanation: string;
  encouragement: string;
}