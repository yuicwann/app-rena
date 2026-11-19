export type StepStatus = 'completed' | 'active' | 'locked';

export type StepType = 'material' | 'quiz' | 'troubleshoot' | 'practical';

export interface TimelineStepItem {
  id: string;
  stepNumber: number;
  type: StepType;
  status: StepStatus;
  title: string;
  description: string;
  score?: number;
  conditionText?: string;
  buttonLabel?: string;
}

export interface LearningModule {
  id: string;
  moduleNumber: number;
  title: string;
  description: string;
  status: 'in_progress' | 'ready' | 'locked';
  progressPercentage: number;
  steps: TimelineStepItem[];
}

export interface StudentProfile {
  name: string;
  progressPercentage: number;
  program: string;
  semester: string;
  initials: string;
}
