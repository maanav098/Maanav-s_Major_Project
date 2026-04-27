import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { jobApi } from '../services/api';
import type { Job, JobInterviewSummary, RecruiterDecision } from '../types';
import { Pencil } from 'lucide-react';

const DECISION_FILTERS: { value: RecruiterDecision | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'on_hold', label: 'Hold' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'pending', label: 'Pending' },
];

function decisionBadge(decision: RecruiterDecision) {
  if (decision === 'pending') {
    return <span className="text-ink-faint" style={{ fontSize: '13px' }}>—</span>;
  }
  const cls =
    decision === 'shortlisted'
      ? 'badge badge-success'
      : decision === 'on_hold'
        ? 'badge badge-warning'
        : 'badge badge-error';
  const label =
    decision === 'shortlisted' ? 'Shortlisted' : decision === 'on_hold' ? 'On hold' : 'Rejected';
  return <span className={cls}>{label}</span>;
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [interviews, setInterviews] = useState<JobInterviewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [decisionFilter, setDecisionFilter] = useState<RecruiterDecision | 'all'>('all');

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [j, list] = await Promise.all([
          jobApi.get(Number(id)),
          jobApi.listInterviews(Number(id)),
        ]);
        setJob(j);
        setInterviews(list);
      } catch (e) {
        console.error(e);
        setError('Failed to load job');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const statusBadge = (status: string) => {
    if (status === 'evaluated') return <span className="badge badge-success">Evaluated</span>;
    if (status === 'completed') return <span className="badge badge-info">Evaluating</span>;
    if (status === 'in_progress') return <span className="badge badge-warning">In progress</span>;
    return <span className="badge">Pending</span>;
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
          {error || 'Job not found.'}
        </p>
        <Link to="/jobs" className="btn-secondary mt-6 inline-flex">
          &larr; Back to postings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 py-14">
      <Link to="/jobs" className="btn-text" style={{ fontSize: '13px' }}>
        &larr; All postings
      </Link>

      <div className="mt-10 flex items-start justify-between gap-6 flex-wrap">
        <div>
          <p className="eyebrow">
            {job.role} · {job.company}
          </p>
          <h1
            className="heading-display mt-3"
            style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}
          >
            {job.title}
          </h1>
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <span className="badge badge-info" style={{ textTransform: 'uppercase' }}>
              {job.status}
            </span>
            {job.location && (
              <span className="text-ink-muted" style={{ fontSize: '14px' }}>
                {job.location}
              </span>
            )}
            {job.salary_range && (
              <span className="text-ink-muted" style={{ fontSize: '14px' }}>
                · {job.salary_range}
              </span>
            )}
            <span className="text-ink-muted" style={{ fontSize: '14px' }}>
              · {job.experience_min}
              {job.experience_max ? `–${job.experience_max}` : '+'} yrs
            </span>
          </div>
        </div>
        <Link to={`/jobs/${job.id}/edit`} className="btn-secondary">
          <Pencil className="h-3.5 w-3.5" />
          <span>Edit</span>
        </Link>
      </div>

      <hr className="rule" style={{ margin: '2.5rem 0 2rem' }} />

      {job.description && (
        <section>
          <p className="eyebrow">About this role</p>
          <p
            className="mt-4 whitespace-pre-wrap text-ink"
            style={{ fontSize: '15px', lineHeight: 1.65 }}
          >
            {job.description}
          </p>
        </section>
      )}

      {job.required_skills?.length > 0 && (
        <section className="mt-10">
          <p className="eyebrow">Required skills</p>
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
              <li key={r} style={{ paddingLeft: '1.25rem', position: 'relative' }}>
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

      <hr className="rule" style={{ margin: '3rem 0 2rem' }} />

      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <p className="eyebrow">Applicants</p>
          <h2 className="serif mt-2" style={{ fontSize: '24px' }}>
            {interviews.length} candidate{interviews.length === 1 ? '' : 's'}
          </h2>
        </div>
      </div>

      {interviews.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {DECISION_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setDecisionFilter(f.value)}
              className={decisionFilter === f.value ? 'pill pill-active' : 'pill'}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {interviews.length === 0 ? (
        <div
          className="py-16 text-center"
          style={{ borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}
        >
          <p className="serif-italic text-ink" style={{ fontSize: '18px' }}>
            No applicants yet.
          </p>
          <p className="mt-2 text-ink-muted" style={{ fontSize: '13px' }}>
            Once a candidate begins interviewing, they'll show up here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto" style={{ borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}>
          <table className="min-w-full" style={{ fontSize: '14px' }}>
            <thead>
              <tr>
                {['Candidate', 'Decision', 'Status', 'Overall', 'Tech.', 'Comm.', 'Level', 'Completed'].map((h) => (
                  <th
                    key={h}
                    className="eyebrow text-left"
                    style={{
                      padding: '0.85rem 1rem',
                      borderBottom: '1px solid var(--rule)',
                      fontSize: '10px',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {interviews
                .filter((row) =>
                  decisionFilter === 'all' ? true : row.recruiter_decision === decisionFilter,
                )
                .map((row) => {
                const target = row.status === 'evaluated'
                  ? `/interview/${row.interview_id}/result`
                  : `/interview/${row.interview_id}`;
                return (
                  <tr
                    key={row.interview_id}
                    onClick={() => { window.location.href = target; }}
                    style={{
                      borderTop: '1px solid var(--rule)',
                      cursor: 'pointer',
                    }}
                    className="hover:bg-[color:var(--surface-2)]"
                  >
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div className="text-ink" style={{ fontWeight: 500 }}>
                        {row.candidate_full_name}
                      </div>
                      <div className="text-ink-faint" style={{ fontSize: '12px' }}>
                        {row.candidate_email}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {decisionBadge(row.recruiter_decision)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>{statusBadge(row.status)}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {row.overall_score != null ? (
                        <span
                          className="numeric text-ink"
                          style={{ fontSize: '17px', fontWeight: 500 }}
                        >
                          {row.overall_score}
                        </span>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                    <td className="text-ink-muted" style={{ padding: '0.85rem 1rem' }}>
                      {row.technical_score ?? '—'}
                    </td>
                    <td className="text-ink-muted" style={{ padding: '0.85rem 1rem' }}>
                      {row.communication_score ?? '—'}
                    </td>
                    <td className="text-ink-muted" style={{ padding: '0.85rem 1rem' }}>
                      {row.level_prediction || '—'}
                    </td>
                    <td className="text-ink-faint" style={{ padding: '0.85rem 1rem' }}>
                      {row.completed_at
                        ? new Date(row.completed_at).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
