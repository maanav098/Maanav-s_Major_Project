import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobApi } from '../services/api';
import type { CustomQuestion, JdAnalysis, Job, QuestionCategory } from '../types';
import { X, Plus } from 'lucide-react';

type JobStatus = 'draft' | 'open' | 'closed';

const ALL_CATEGORIES: { value: QuestionCategory; label: string }[] = [
  { value: 'technical', label: 'Technical' },
  { value: 'coding', label: 'Coding' },
  { value: 'system_design', label: 'System Design' },
  { value: 'behavioral', label: 'Behavioural' },
  { value: 'case_study', label: 'Case Study' },
];

interface FormState {
  title: string;
  role: string;
  company: string;
  description: string;
  requirements: string[];
  required_skills: string[];
  experience_min: number;
  experience_max: string;
  location: string;
  salary_range: string;
  status: JobStatus;
  num_questions: number;
  question_categories: QuestionCategory[];
  custom_questions: CustomQuestion[];
}

const emptyForm: FormState = {
  title: '',
  role: '',
  company: '',
  description: '',
  requirements: [],
  required_skills: [],
  experience_min: 0,
  experience_max: '',
  location: '',
  salary_range: '',
  status: 'open',
  num_questions: 10,
  question_categories: ['technical', 'behavioral'],
  custom_questions: [],
};

export default function JobForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [skillInput, setSkillInput] = useState('');
  const [reqInput, setReqInput] = useState('');
  const [customText, setCustomText] = useState('');
  const [customType, setCustomType] = useState<QuestionCategory>('technical');
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<JdAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');

  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const job = await jobApi.get(Number(id));
        setForm({
          title: job.title,
          role: job.role,
          company: job.company,
          description: job.description || '',
          requirements: job.requirements || [],
          required_skills: job.required_skills || [],
          experience_min: job.experience_min || 0,
          experience_max: job.experience_max != null ? String(job.experience_max) : '',
          location: job.location || '',
          salary_range: job.salary_range || '',
          status: job.status,
          num_questions: job.num_questions || 10,
          question_categories: (job.question_categories?.length
            ? job.question_categories
            : ['technical', 'behavioral']) as QuestionCategory[],
          custom_questions: job.custom_questions || [],
        });
      } catch {
        setError('Failed to load job');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const addChip = (key: 'required_skills' | 'requirements', value: string) => {
    const v = value.trim();
    if (!v) return;
    setForm((f) => ({ ...f, [key]: Array.from(new Set([...(f[key] as string[]), v])) }));
  };

  const removeChip = (key: 'required_skills' | 'requirements', value: string) => {
    setForm((f) => ({ ...f, [key]: (f[key] as string[]).filter((x) => x !== value) }));
  };

  const handleSkillKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addChip('required_skills', skillInput);
      setSkillInput('');
    }
  };

  const handleReqKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addChip('requirements', reqInput);
      setReqInput('');
    }
  };

  const toggleCategory = (cat: QuestionCategory) => {
    setForm((f) => ({
      ...f,
      question_categories: f.question_categories.includes(cat)
        ? f.question_categories.filter((c) => c !== cat)
        : [...f.question_categories, cat],
    }));
  };

  const addCustomQuestion = () => {
    const text = customText.trim();
    if (!text) return;
    setForm((f) => ({
      ...f,
      custom_questions: [...f.custom_questions, { question_text: text, question_type: customType }],
    }));
    setCustomText('');
  };

  const removeCustomQuestion = (idx: number) => {
    setForm((f) => ({
      ...f,
      custom_questions: f.custom_questions.filter((_, i) => i !== idx),
    }));
  };

  const handleAnalyze = async () => {
    if (!form.description.trim()) {
      setAnalyzeError('Add a job description first.');
      return;
    }
    setAnalyzeError('');
    setAnalyzing(true);
    try {
      const result = await jobApi.analyzeJd({
        description: form.description,
        role: form.role || undefined,
        company: form.company || undefined,
      });
      setAnalysis(result);
    } catch (e) {
      console.error(e);
      setAnalyzeError('Analysis failed. Try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const applyAnalysis = () => {
    if (!analysis) return;
    setForm((f) => ({
      ...f,
      question_categories: analysis.suggested_categories,
      num_questions: analysis.suggested_num_questions,
      required_skills: Array.from(new Set([...f.required_skills, ...analysis.suggested_skills])),
    }));
    setAnalysis(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.title || !form.role || !form.company) {
      setError('Title, role, and company are required');
      return;
    }
    if (form.question_categories.length === 0) {
      setError('Pick at least one question category');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<Job> & { status?: JobStatus } = {
        title: form.title,
        role: form.role,
        company: form.company,
        description: form.description || undefined,
        requirements: form.requirements,
        required_skills: form.required_skills,
        experience_min: Number(form.experience_min) || 0,
        experience_max: form.experience_max ? Number(form.experience_max) : undefined,
        location: form.location || undefined,
        salary_range: form.salary_range || undefined,
        num_questions: Number(form.num_questions) || 10,
        question_categories: form.question_categories,
        custom_questions: form.custom_questions,
      };

      if (isEdit && id) {
        await jobApi.update(Number(id), { ...payload, status: form.status });
        navigate(`/jobs/${id}`);
      } else {
        const created = await jobApi.create(payload);
        navigate(`/jobs/${created.id}`);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to save job');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10 py-14">
      <p className="eyebrow">{isEdit ? 'Edit posting' : 'New posting'}</p>
      <h1
        className="heading-display mt-3"
        style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}
      >
        {isEdit ? (
          <>
            Refine the <span className="serif-italic">listing</span>.
          </>
        ) : (
          <>
            Compose a <span className="serif-italic">listing</span>.
          </>
        )}
      </h1>

      {error && (
        <p
          className="mt-8"
          style={{
            color: 'var(--accent)',
            fontSize: '13px',
            borderLeft: '2px solid var(--accent)',
            paddingLeft: '0.75rem',
          }}
        >
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-12 space-y-12">
        {/* Basics */}
        <section>
          <p className="eyebrow">The basics</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-7 mt-6">
            <div className="md:col-span-2">
              <label className="eyebrow block mb-2">Title *</label>
              <input
                className="input-field"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Senior Backend Engineer"
                required
              />
            </div>
            <div>
              <label className="eyebrow block mb-2">Role *</label>
              <input
                className="input-field"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="e.g. SDE"
                required
              />
            </div>
            <div>
              <label className="eyebrow block mb-2">Company *</label>
              <input
                className="input-field"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="e.g. Acme Corp"
                required
              />
            </div>
            <div>
              <label className="eyebrow block mb-2">Location</label>
              <input
                className="input-field"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Remote / NYC / etc."
              />
            </div>
            <div>
              <label className="eyebrow block mb-2">Salary range</label>
              <input
                className="input-field"
                value={form.salary_range}
                onChange={(e) => setForm({ ...form, salary_range: e.target.value })}
                placeholder="$120k–$160k"
              />
            </div>
            <div>
              <label className="eyebrow block mb-2">Min experience (yrs)</label>
              <input
                type="number"
                min={0}
                className="input-field"
                value={form.experience_min}
                onChange={(e) => setForm({ ...form, experience_min: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="eyebrow block mb-2">Max experience (yrs)</label>
              <input
                type="number"
                min={0}
                className="input-field"
                value={form.experience_max}
                onChange={(e) => setForm({ ...form, experience_max: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>
        </section>

        {/* Description with AI */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="eyebrow">Job description</p>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing || !form.description.trim()}
              className="btn-text text-accent disabled:opacity-40"
              style={{ fontSize: '12px' }}
            >
              {analyzing ? 'Reading…' : 'Analyse with AI →'}
            </button>
          </div>
          <textarea
            className="input-field-boxed"
            rows={6}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="A summary of the role, key responsibilities, and what you're looking for in a candidate."
          />
          {analyzeError && (
            <p
              className="mt-2"
              style={{
                color: 'var(--accent)',
                fontSize: '12px',
              }}
            >
              {analyzeError}
            </p>
          )}
        </section>

        {analysis && (
          <section
            className="card"
            style={{ borderTop: '1px solid var(--accent)', background: 'var(--accent-soft)' }}
          >
            <p className="eyebrow text-accent">AI suggestions</p>
            <div className="mt-4 space-y-3" style={{ fontSize: '14px' }}>
              <div>
                <span className="eyebrow" style={{ marginRight: '0.5rem' }}>Categories</span>
                {analysis.suggested_categories.map((c) => (
                  <span key={c} className="badge badge-info ml-1">
                    {ALL_CATEGORIES.find((a) => a.value === c)?.label || c}
                  </span>
                ))}
              </div>
              <div>
                <span className="eyebrow" style={{ marginRight: '0.5rem' }}>Questions</span>
                <span className="numeric text-ink" style={{ fontSize: '17px' }}>
                  {analysis.suggested_num_questions}
                </span>
              </div>
              <div>
                <span className="eyebrow" style={{ marginRight: '0.5rem' }}>Skills</span>
                {analysis.suggested_skills.map((s) => (
                  <span key={s} className="badge ml-1">
                    {s}
                  </span>
                ))}
              </div>
              {analysis.rationale && (
                <p className="serif-italic text-ink-muted mt-3" style={{ fontSize: '14px' }}>
                  &ldquo;{analysis.rationale}&rdquo;
                </p>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 mt-5">
              <button type="button" onClick={() => setAnalysis(null)} className="btn-text">
                Dismiss
              </button>
              <button type="button" onClick={applyAnalysis} className="btn-primary">
                Apply suggestions
              </button>
            </div>
          </section>
        )}

        {/* Skills */}
        <section>
          <p className="eyebrow">Required skills</p>
          {form.required_skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {form.required_skills.map((s) => (
                <span key={s} className="badge badge-info inline-flex items-center">
                  {s}
                  <button
                    type="button"
                    onClick={() => removeChip('required_skills', s)}
                    className="ml-2"
                    style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', color: 'inherit' }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <input
            className="input-field mt-4"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={handleSkillKey}
            placeholder="Type a skill and press Enter"
          />
        </section>

        {/* Requirements */}
        <section>
          <p className="eyebrow">Requirements</p>
          {form.requirements.length > 0 && (
            <ul className="mt-4">
              {form.requirements.map((r) => (
                <li
                  key={r}
                  className="flex items-center justify-between py-3"
                  style={{ borderTop: '1px solid var(--rule)' }}
                >
                  <span className="text-ink" style={{ fontSize: '14px' }}>
                    {r}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeChip('requirements', r)}
                    className="text-ink-muted hover:text-accent"
                    style={{ background: 'transparent', border: 0, cursor: 'pointer' }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
              <li style={{ borderTop: '1px solid var(--rule)' }} />
            </ul>
          )}
          <input
            className="input-field mt-4"
            value={reqInput}
            onChange={(e) => setReqInput(e.target.value)}
            onKeyDown={handleReqKey}
            placeholder="Type a requirement and press Enter"
          />
        </section>

        {/* Interview setup */}
        <section>
          <hr className="rule" style={{ marginBottom: '1.75rem' }} />
          <p className="eyebrow">Interview setup</p>
          <h2 className="serif mt-2" style={{ fontSize: '22px' }}>
            How candidates will be interviewed
          </h2>

          <div className="mt-8 space-y-8">
            <div>
              <label className="eyebrow block mb-2">Number of questions</label>
              <input
                type="number"
                min={1}
                max={30}
                className="input-field"
                style={{ maxWidth: '160px' }}
                value={form.num_questions}
                onChange={(e) => setForm({ ...form, num_questions: Number(e.target.value) || 10 })}
              />
              <p className="text-ink-faint mt-2" style={{ fontSize: '12px' }}>
                Applies to every candidate who applies to this opening.
              </p>
            </div>

            <div>
              <label className="eyebrow block mb-3">Categories *</label>
              <div className="flex flex-wrap gap-2">
                {ALL_CATEGORIES.map((cat) => {
                  const checked = form.question_categories.includes(cat.value);
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => toggleCategory(cat.value)}
                      className={checked ? 'pill pill-active' : 'pill'}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="eyebrow block mb-3">
                Custom questions <span style={{ textTransform: 'none', color: 'var(--ink-faint)' }}>(optional)</span>
              </label>
              {form.custom_questions.length > 0 && (
                <ul className="mb-4">
                  {form.custom_questions.map((q, idx) => (
                    <li
                      key={idx}
                      className="flex items-start justify-between gap-3 py-3"
                      style={{ borderTop: '1px solid var(--rule)' }}
                    >
                      <div className="flex-1 min-w-0 flex items-start gap-3">
                        <span className="badge badge-info flex-shrink-0">
                          {ALL_CATEGORIES.find((c) => c.value === q.question_type)?.label || q.question_type}
                        </span>
                        <span className="text-ink" style={{ fontSize: '14px' }}>
                          {q.question_text}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCustomQuestion(idx)}
                        className="text-ink-muted hover:text-accent flex-shrink-0"
                        style={{ background: 'transparent', border: 0, cursor: 'pointer' }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                  <li style={{ borderTop: '1px solid var(--rule)' }} />
                </ul>
              )}
              <div className="flex items-stretch gap-2">
                <select
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value as QuestionCategory)}
                  className="input-field-boxed"
                  style={{ maxWidth: '170px' }}
                >
                  {ALL_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <input
                  className="input-field-boxed"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomQuestion();
                    }
                  }}
                  placeholder="Type a question and press Enter"
                />
                <button
                  type="button"
                  onClick={addCustomQuestion}
                  disabled={!customText.trim()}
                  className="btn-secondary"
                  style={{ flex: '0 0 auto' }}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-ink-faint mt-2" style={{ fontSize: '12px' }}>
                Custom questions are asked first; the AI fills the rest up to your question count.
              </p>
            </div>
          </div>
        </section>

        {isEdit && (
          <section>
            <label className="eyebrow block mb-2">Status</label>
            <select
              className="input-field-boxed"
              style={{ maxWidth: '200px' }}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as JobStatus })}
            >
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </section>
        )}

        <hr className="rule" />

        <div className="flex items-center justify-end gap-4">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create posting'}
          </button>
        </div>
      </form>
    </div>
  );
}
