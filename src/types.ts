export interface UserProfile {
  id: number | string;
  name: string;
  age: number;
  weight: number; // in kg
  goal: string;
  intensity: 'low' | 'medium' | 'high';
  schedule?: number;
  created_at?: string;
  email?: string;
}

export interface WorkoutPlanData {
  user_id: number | string;
  original_plan: string;
  updated_plan: string | null;
  nutrition_tip: string;
  feedback_history?: Array<{ feedback: string; timestamp: string }>;
  grounding_sources?: Array<{ title: string; url: string }>;
  created_at?: string;
  updated_at?: string;
}

export interface DayWorkout {
  dayNumber: number;
  dayTitle: string;
  focus: string;
  warmup: string;
  exercises: Array<{
    name: string;
    setsAndReps: string;
    details?: string;
  }>;
  cooldown: string;
  notes?: string;
}

export interface AdminUserRecord {
  id: number | string;
  name: string;
  age: number;
  weight: number;
  goal: string;
  intensity: 'low' | 'medium' | 'high';
  schedule: number;
  created_at: string;
  original_plan: string;
  updated_plan: string | null;
  nutrition_tip: string;
  feedback_history: Array<{ feedback: string; timestamp: string }>;
  has_updated_plan: boolean;
}
