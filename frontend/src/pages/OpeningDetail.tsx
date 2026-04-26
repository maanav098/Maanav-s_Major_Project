import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { jobApi } from '../services/api';
import type { Job } from '../types';

export default function OpeningDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await jobApi.get(Number(id));
        setJob(data);
      } catch (e) {
        console.error(e);
        setError('Opening not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleApply = () => {
    if (!job) return;
    navigate(`/interview/new?job_id=${job.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <p className="serif-italic text-ink" style={{ fontSize: '22px' }}>
          {error || 'Opening not found.'}
        </p>
        <Link to="/openings" className="btn-secondary mt-6 inline-flex">
          &larr; Back to openings
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto px-6 lg:px-10 py-14">
      <Link to="/openings" className="btn-text" style={{ fontSize: '13px' }}>
        &larr; All openings
      </Link>

      <p className="eyebrow mt-8">
        {job.role} &nbsp;·&nbsp; {job.company}
      </p>
      <h1
        className="heading-display mt-3"
        style={{ fontSize: 'clamp(2.2rem, 4.6vw, 3.2rem)' }}
      >
        {job.title}
      </h1>

      <div
        className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-ink-muted"
        style={{ fontSize: '14px' }}
      >
        {job.location && <span>{job.location}</span>}
        {job.salary_range && <span>{job.salary_range}</span>}
        <span>
          {job.experience_min}
          {job.experience_max ? `–${job.experience_max}` : '+'} yrs experience
        </span>
      </div>

      <hr className="rule" style={{ margin: '2.5rem 0 2rem' }} />

      {job.description && (
        <section>
          <p className="eyebrow">About this role</p>
          <p
            className="mt-4 whitespace-pre-wrap text-ink"
            style={{ fontSize: '16px', lineHeight: 1.65 }}
          >
            {job.description}
          </p>
        </section>
      )}

      {job.required_skills?.length > 0 && (
        <section className="mt-10">
          <p className="eyebrow">What you'll bring</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {job.required_skills.map((s) => (
              <span key={s} className="badge badge-info">
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      {job.requirements?.length > 0 && (
        <section className="mt-10">
          <p className="eyebrow">Requirements</p>
          <ul className="mt-4 space-y-2 text-ink" style={{ fontSize: '15px' }}>
            {job.requirements.map((r) => (
              <li
                key={r}
                style={{
                  paddingLeft: '1.25rem',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '0.7em',
                    width: '8px',
                    height: '1px',
                    background: 'var(--ink-muted)',
                  }}
                />
                {r}
              </li>
            ))}
          </ul>
        </section>
      )}

      <hr className="rule-accent" style={{ margin: '3rem 0 2rem' }} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <p className="eyebrow text-accent">How applying works</p>
          <p className="mt-3 text-ink-muted max-w-md" style={{ fontSize: '14px' }}>
            Clicking apply begins an AI-tailored interview for this role. Your evaluation goes
            straight to the recruiter; no separate application required.
          </p>
        </div>
        <button onClick={handleApply} className="btn-primary flex-shrink-0">
          Apply &amp; begin interview
        </button>
      </div>
    </article>
  );
}
