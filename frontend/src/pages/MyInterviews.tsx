import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { interviewApi } from '../services/api';
import type { Interview } from '../types';

export default function MyInterviews() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    try {
      const data = await interviewApi.myInterviews();
      setInterviews(data);
    } catch (error) {
      console.error('Failed to load interviews', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'evaluated':
        return <span className="badge badge-success">Completed</span>;
      case 'completed':
        return <span className="badge badge-info">Evaluating</span>;
      case 'in_progress':
        return <span className="badge badge-warning">In progress</span>;
      default:
        return <span className="badge">Pending</span>;
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
    <div className="max-w-5xl mx-auto px-6 lg:px-10 py-14">
      <div className="flex items-end justify-between flex-wrap gap-6">
        <div>
          <p className="eyebrow">Your record</p>
          <h1
            className="heading-display mt-3"
            style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}
          >
            Past&nbsp;<span className="serif-italic">interviews</span>.
          </h1>
        </div>
        <Link to="/interview/new" className="btn-primary">
          Begin a new round
        </Link>
      </div>

      <div className="mt-12" style={{ borderTop: '1px solid var(--rule)' }}>
        {interviews.length === 0 ? (
          <div className="py-20 text-center">
            <p className="serif-italic text-ink" style={{ fontSize: '20px' }}>
              No interviews yet.
            </p>
            <p className="mt-2 text-ink-muted" style={{ fontSize: '14px' }}>
              Begin a practice round to see your history here.
            </p>
          </div>
        ) : (
          interviews.map((interview, idx) => (
            <Link
              key={interview.id}
              to={
                interview.status === 'evaluated'
                  ? `/interview/${interview.id}/result`
                  : `/interview/${interview.id}`
              }
              className="block py-6 group"
              style={{ borderBottom: '1px solid var(--rule)' }}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <p
                    className="mono text-ink-faint"
                    style={{ fontSize: '11px', letterSpacing: '0.06em' }}
                  >
                    No. {String(idx + 1).padStart(2, '0')} ·{' '}
                    {new Date(interview.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <div className="mt-2 flex items-center flex-wrap gap-3">
                    <h3 className="serif text-ink" style={{ fontSize: '20px' }}>
                      {interview.role}
                      {interview.company && (
                        <span className="text-ink-muted serif-italic">
                          {' '}
                          · {interview.company}
                        </span>
                      )}
                    </h3>
                    {getStatusBadge(interview.status)}
                  </div>
                  <p className="mt-2 text-ink-muted" style={{ fontSize: '13px' }}>
                    {interview.questions_asked?.length || 0} questions
                  </p>
                </div>
                <div className="flex items-center gap-8 flex-shrink-0">
                  {interview.overall_score != null && (
                    <div className="text-right">
                      <p
                        className="numeric text-ink"
                        style={{ fontSize: '32px', lineHeight: 1 }}
                      >
                        {interview.overall_score}
                      </p>
                      <p
                        className="mono text-ink-faint mt-1"
                        style={{ fontSize: '10px', letterSpacing: '0.12em' }}
                      >
                        OVERALL
                      </p>
                    </div>
                  )}
                  <span
                    className="mono text-ink-muted group-hover:text-ink transition-colors"
                    style={{ fontSize: '13px' }}
                  >
                    &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
