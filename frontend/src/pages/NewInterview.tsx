import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { interviewApi, jobApi } from '../services/api';
import type { Job } from '../types';

const QUESTION_COUNTS = [5, 10, 15, 20];

const ROLES = [
  'SDE',
  'ML Engineer',
  'Data Scientist',
  'Frontend Developer',
  'Backend Developer',
  'DevOps Engineer',
  'Product Manager',
];

const COMPANIES = [
  'Amazon',
  'Google',
  'Microsoft',
  'Meta',
  'Apple',
  'Netflix',
  'Startup',
];

export default function NewInterview() {
  const [searchParams] = useSearchParams();
  const jobIdParam = searchParams.get('job_id');
  const jobId = jobIdParam ? Number(jobIdParam) : null;

  const [role, setRole] = useState(searchParams.get('role') || '');
  const [company, setCompany] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [job, setJob] = useState<Job | null>(null);
  const [jobLoading, setJobLoading] = useState(Boolean(jobId));
  const navigate = useNavigate();

  useEffect(() => {
    if (!jobId) return;
    setJobLoading(true);
    jobApi
      .get(jobId)
      .then((j) => {
        setJob(j);
        setRole(j.role);
        setCompany(j.company);
      })
      .catch(() => setError('Failed to load opening'))
      .finally(() => setJobLoading(false));
  }, [jobId]);

  const effectiveCount = job?.num_questions ?? numQuestions;

  const handleStartInterview = async () => {
    if (!role) {
      setError('Please select a role');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const interview = await interviewApi.start({
        role,
        company: company || undefined,
        job_id: jobId ?? undefined,
        num_questions: effectiveCount,
      });
      navigate(`/interview/${interview.id}`);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to start interview. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (jobLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10 py-14">
      <p className="eyebrow">{job ? 'Application' : 'Practice'}</p>
      <h1
        className="heading-display mt-3"
        style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}
      >
        {job ? (
          <>
            Apply to <span className="serif-italic">{job.title}</span>.
          </>
        ) : (
          <>
            Begin a <span className="serif-italic">practice</span> round.
          </>
        )}
      </h1>
      <p className="mt-4 text-ink-muted max-w-xl" style={{ fontSize: '15px' }}>
        {job
          ? "We'll tailor questions to this role. Your evaluation goes directly to the recruiter."
          : 'Choose a target role and, optionally, a company style. The AI composes the question set from there.'}
      </p>

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

      <div className="mt-12 space-y-12">
        {job ? (
          <section>
            <hr className="rule-accent" />
            <div className="mt-5 flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow text-accent">Applying for</p>
                <h2 className="serif mt-2" style={{ fontSize: '22px' }}>
                  {job.title}
                </h2>
                <p className="mt-1 text-ink-muted" style={{ fontSize: '14px' }}>
                  {job.role} · {job.company}
                </p>
              </div>
              <Link to="/openings" className="btn-text" style={{ fontSize: '13px' }}>
                Change opening
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section>
              <p className="eyebrow">Target role *</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={role === r ? 'pill pill-active' : 'pill'}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <p className="eyebrow">Company style (optional)</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {COMPANIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCompany(company === c ? '' : c)}
                    className={company === c ? 'pill pill-active' : 'pill'}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-ink-faint" style={{ fontSize: '12px' }}>
                Adjusts question style and difficulty.
              </p>
            </section>
          </>
        )}

        {!job && (
          <section>
            <p className="eyebrow">Number of questions</p>
            <div className="grid grid-cols-4 gap-3 mt-4">
              {QUESTION_COUNTS.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setNumQuestions(count)}
                  className={numQuestions === count ? 'pill pill-active' : 'pill'}
                  style={{ justifyContent: 'center' }}
                >
                  {count}
                </button>
              ))}
            </div>
          </section>
        )}

        <section>
          <hr className="rule" />
          <div className="grid grid-cols-1 sm:grid-cols-3 mt-6 gap-y-4">
            <div>
              <p className="eyebrow">Length</p>
              <p className="numeric mt-2" style={{ fontSize: '28px', lineHeight: 1, color: 'var(--ink)' }}>
                {effectiveCount}
              </p>
              <p className="text-ink-muted mt-1" style={{ fontSize: '12px' }}>
                questions
              </p>
            </div>
            <div>
              <p className="eyebrow">Estimated time</p>
              <p className="numeric mt-2" style={{ fontSize: '28px', lineHeight: 1, color: 'var(--ink)' }}>
                {Math.round(effectiveCount * 3)}–{Math.round(effectiveCount * 5)}
              </p>
              <p className="text-ink-muted mt-1" style={{ fontSize: '12px' }}>
                minutes
              </p>
            </div>
            <div>
              <p className="eyebrow">Mix</p>
              <p className="serif-italic text-ink mt-2" style={{ fontSize: '17px', lineHeight: 1.2 }}>
                Technical, behavioural &amp; coding
              </p>
            </div>
          </div>
        </section>

        <button
          onClick={handleStartInterview}
          disabled={loading || !role}
          className="btn-primary"
          style={{ width: '100%', padding: '0.85rem 1.25rem' }}
        >
          {loading ? 'Starting…' : job ? 'Apply & begin interview' : 'Begin interview'}
        </button>
      </div>
    </div>
  );
}
