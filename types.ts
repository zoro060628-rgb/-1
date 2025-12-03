// Proactivity Types
export interface ActionStep {
  stepNumber: number;
  title: string;
  description: string;
  estimatedTime: string;
  isCompleted?: boolean;
}

// Study Types
export interface StudyFeedback {
  score: number;
  understandingLevel: string;
  missingConcepts: string[];
  betterExplanation: string;
  encouragement: string;
}

// Lifestyle Types
export interface RoutineItem {
  time: string;
  activity: string;
  category: 'Exercise' | 'Study' | 'Rest' | 'Work' | 'Meal';
  note: string;
}

export interface RoutinePlan {
  title: string;
  items: RoutineItem[];
  tips: string;
}

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
  aiFeedback?: string;
}

export interface Habit {
  id: string;
  name: string;
  lastCompletedDate: string | null;
  streak: number;
  createdAt: number;
}