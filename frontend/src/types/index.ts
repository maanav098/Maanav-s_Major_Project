export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'candidate' | 'recruiter' | 'admin';
  is_active: boolean;
  created_at: string;
}

export interface Candidate {
  id: number;
  user_id: number;
  resume_text?: string;
  skills: string[];
  experience_years: number;
  education?: string;
  phone?: string;
  linkedin_url?: string;
  github_url?: string;
  created_at: string;
}

export interface Job {
  id: number;
  recruiter_id: number;
  title: string;
  role: string;
  company: string;
  description?: string;
  requirements: string[];
  required_skills: string[];
  experience_min: number;
  experience_max?: number;
  location?: string;
  salary_range?: string;
  status: 'draft' | 'open' | 'closed';
  created_at: string;
}

export interface Question {
  id: number;
  role: string;
  company?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question_type: 'technical' | 'behavioral' | 'system_design' | 'coding' | 'case_study';
  topic?: string;
  question_text: string;
  expected_answer?: string;
  time_limit_minutes: number;
}

export interface Interview {
  id: number;
  candidate_id: number;
  job_id?: number;
  role: string;
  company?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'evaluated';
  questions_asked: QuestionAsked[];
  responses: Response[];
  technical_score?: number;
  communication_score?: number;
  overall_score?: number;
  feedback?: Record<string, unknown>;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  level_prediction?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface QuestionAsked {
  id: number;
  question: string;
  type: string;
  time_limit_minutes?: number;
}

export interface Response {
  question_id: number;
  answer: string;
  submitted_at: string;
  follow_up_question?: string;
  follow_up_answer?: string;
  follow_up_submitted_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface EvaluationResult {
  interview_id: number;
  technical_score: number;
  communication_score: number;
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  level_prediction: string;
  detailed_feedback: Record<string, unknown>;
}
