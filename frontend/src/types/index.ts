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

export type QuestionCategory = 'technical' | 'behavioral' | 'system_design' | 'coding' | 'case_study';

export interface CustomQuestion {
  question_text: string;
  question_type: QuestionCategory;
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
  num_questions: number;
  question_categories: QuestionCategory[];
  custom_questions: CustomQuestion[];
  created_at: string;
}

export interface JdAnalysis {
  suggested_categories: QuestionCategory[];
  suggested_skills: string[];
  suggested_num_questions: number;
  rationale?: string;
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

export type RecruiterDecision = 'pending' | 'shortlisted' | 'on_hold' | 'rejected';

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
  recruiter_decision?: RecruiterDecision;
  recruiter_notes?: string;
  decision_updated_at?: string;
}

export interface QuestionAsked {
  id: number;
  question: string;
  type: string;
  time_limit_minutes?: number;
  source_url?: string;
  source_domain?: string;
}

export interface Response {
  question_id: number;
  answer: string;
  submitted_at: string;
  follow_up_question?: string;
  follow_up_answer?: string;
  follow_up_submitted_at?: string;
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

export interface JobInterviewSummary {
  interview_id: number;
  candidate_id: number;
  candidate_full_name: string;
  candidate_email: string;
  status: 'pending' | 'in_progress' | 'completed' | 'evaluated';
  overall_score?: number;
  technical_score?: number;
  communication_score?: number;
  level_prediction?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  recruiter_decision: RecruiterDecision;
}

export interface RecruiterCandidate {
  candidate_id: number;
  user_id: number;
  full_name: string;
  email: string;
  interview_count: number;
  best_overall_score?: number;
  latest_interview_at?: string;
  latest_interview_id: number;
  latest_decision: RecruiterDecision;
}
