import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { recruiterApi } from '../services/api';
import type { RecruiterCandidate } from '../types';

export default function Candidates() {
  const [rows, setRows] = useState<RecruiterCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await recruiterApi.myCandidates();
        setRows(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 py-14">
      <p className="eyebrow">Roster</p>
      <h1
        className="heading-display mt-3"
        style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}
      >
        Candidates in <span className="serif-italic">review</span>.
      </h1>
      <p className="mt-4 text-ink-muted max-w-xl" style={{ fontSize: '15px' }}>
        Everyone who has interviewed for one of your postings.
      </p>

      <div className="mt-12" style={{ borderTop: '1px solid var(--rule)' }}>
        {rows.length === 0 ? (
          <div className="py-20 text-center">
            <p className="serif-italic text-ink" style={{ fontSize: '20px' }}>
              No candidates yet.
            </p>
            <p className="mt-2 text-ink-muted" style={{ fontSize: '14px' }}>
              They'll appear here once they begin interviewing.
            </p>
          </div>
        ) : (
          rows.map((c, idx) => (
            <Link
              key={c.candidate_id}
              to={`/interview/${c.latest_interview_id}/result`}
              className="block py-6 group"
              style={{ borderBottom: '1px solid var(--rule)' }}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <p
                    className="mono text-ink-faint"
                    style={{ fontSize: '11px', letterSpacing: '0.06em' }}
                  >
                    No. {String(idx + 1).padStart(2, '0')} · {c.email}
                  </p>
                  <h3
                    className="serif mt-2 text-ink group-hover:text-accent transition-colors"
                    style={{ fontSize: '22px', lineHeight: 1.2 }}
                  >
                    {c.full_name}
                  </h3>
                  <div
                    className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-ink-muted"
                    style={{ fontSize: '13px' }}
                  >
                    <span>
                      {c.interview_count} interview{c.interview_count === 1 ? '' : 's'}
                    </span>
                    {c.latest_interview_at && (
                      <span>
                        Latest{' '}
                        {new Date(c.latest_interview_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                </div>
                {c.best_overall_score != null && (
                  <div className="text-right flex-shrink-0">
                    <p
                      className="numeric text-ink"
                      style={{ fontSize: '32px', lineHeight: 1 }}
                    >
                      {c.best_overall_score}
                    </p>
                    <p
                      className="mono text-ink-faint mt-1"
                      style={{ fontSize: '10px', letterSpacing: '0.12em' }}
                    >
                      BEST
                    </p>
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
