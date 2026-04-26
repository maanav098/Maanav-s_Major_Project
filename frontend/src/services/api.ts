import axios from 'axios';
import type { Candidate, Job, Interview, Question, EvaluationResult, JobInterviewSummary, RecruiterCandidate, JdAnalysis } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  workosLogout: async (): Promise<{ logout_url: string | null }> => {
    const response = await api.get('/auth/workos/logout');
    return response.data;
  },
};

export const candidateApi = {
  getProfile: async (): Promise<Candidate> => {
    const response = await api.get('/candidates/me');
    return response.data;
  },
  updateProfile: async (data: Partial<Candidate>): Promise<Candidate> => {
    const response = await api.put('/candidates/me', data);
    return response.data;
  },
  uploadResume: async (file: File): Promise<Candidate> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/candidates/me/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export const jobApi = {
  list: async (params?: { role?: string; company?: string }): Promise<Job[]> => {
    const response = await api.get('/jobs', { params });
    return response.data;
  },
  get: async (id: number): Promise<Job> => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },
  create: async (data: Partial<Job>): Promise<Job> => {
    const response = await api.post('/jobs', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Job>): Promise<Job> => {
    const response = await api.put(`/jobs/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/jobs/${id}`);
  },
  myJobs: async (): Promise<Job[]> => {
    const response = await api.get('/jobs/my-jobs');
    return response.data;
  },
  listInterviews: async (jobId: number): Promise<JobInterviewSummary[]> => {
    const response = await api.get(`/jobs/${jobId}/interviews`);
    return response.data;
  },
  analyzeJd: async (data: { description: string; role?: string; company?: string }): Promise<JdAnalysis> => {
    const response = await api.post('/jobs/analyze-jd', data);
    return response.data;
  },
};

export const recruiterApi = {
  myCandidates: async (): Promise<RecruiterCandidate[]> => {
    const response = await api.get('/recruiters/me/candidates');
    return response.data;
  },
};

export const interviewApi = {
  start: async (data: { role: string; company?: string; job_id?: number; num_questions?: number }): Promise<Interview> => {
    const response = await api.post('/interviews/start', data);
    return response.data;
  },
  submitAnswer: async (interviewId: number, data: { question_id: number; answer: string }): Promise<Interview> => {
    const response = await api.post(`/interviews/${interviewId}/answer`, data);
    return response.data;
  },
  submitFollowUp: async (interviewId: number, data: { question_id: number; follow_up_answer: string }): Promise<Interview> => {
    const response = await api.post(`/interviews/${interviewId}/follow-up`, data);
    return response.data;
  },
  transcribe: async (audio: Blob, filename = 'recording.webm'): Promise<{ text: string }> => {
    const formData = new FormData();
    formData.append('audio', audio, filename);
    const response = await api.post('/interviews/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  runCode: async (data: {
    language: string;
    version: string;
    source: string;
    stdin?: string;
  }): Promise<{ stdout: string; stderr: string; exitCode: number | null; error?: string }> => {
    const response = await api.post('/interviews/run-code', data);
    return response.data;
  },
  complete: async (interviewId: number): Promise<Interview> => {
    const response = await api.post(`/interviews/${interviewId}/complete`);
    return response.data;
  },
  myInterviews: async (): Promise<Interview[]> => {
    const response = await api.get('/interviews/my-interviews');
    return response.data;
  },
  get: async (id: number): Promise<Interview> => {
    const response = await api.get(`/interviews/${id}`);
    return response.data;
  },
};

export const questionApi = {
  list: async (params?: { role?: string; company?: string; difficulty?: string }): Promise<Question[]> => {
    const response = await api.get('/questions', { params });
    return response.data;
  },
  getRoles: async (): Promise<string[]> => {
    const response = await api.get('/questions/roles');
    return response.data;
  },
  getCompanies: async (): Promise<string[]> => {
    const response = await api.get('/questions/companies');
    return response.data;
  },
};

export const evaluationApi = {
  get: async (interviewId: number): Promise<EvaluationResult> => {
    const response = await api.get(`/evaluations/interview/${interviewId}`);
    return response.data;
  },
};

export default api;
