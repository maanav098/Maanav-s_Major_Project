import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { jobApi } from '../services/api';
import type { Job } from '../types';
import { Pencil, Trash2 } from 'lucide-react';

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const data = await jobApi.myJobs();
      setJobs(data);
    } catch (error) {
      console.error('Failed to load jobs', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this job posting? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await jobApi.delete(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (error) {
      console.error('Failed to delete job', error);
      alert('Failed to delete job');
    } finally {
      setDeletingId(null);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'open') return <span className="badge badge-success">Open</span>;
    if (status === 'closed') return <span className="badge badge-error">Closed</span>;
    return <span className="badge">Draft</span>;
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
          <p className="eyebrow">Postings</p>
          <h1
            className="heading-display mt-3"
            style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}
          >
            Roles you're <span className="serif-italic">running</span>.
          </h1>
        </div>
        <Link to="/jobs/new" className="btn-primary">
          + New posting
        </Link>
      </div>

      <div className="mt-12" style={{ borderTop: '1px solid var(--rule)' }}>
        {jobs.length === 0 ? (
          <div className="py-20 text-center">
            <p className="serif-italic text-ink" style={{ fontSize: '20px' }}>
              No postings yet.
            </p>
            <p className="mt-2 text-ink-muted" style={{ fontSize: '14px' }}>
              Post your first opening to start receiving applicants.
            </p>
            <Link to="/jobs/new" className="btn-primary mt-6 inline-flex">
              Post your first job
            </Link>
          </div>
        ) : (
          jobs.map((job, idx) => (
            <div
              key={job.id}
              className="py-6"
              style={{ borderBottom: '1px solid var(--rule)' }}
            >
              <div className="flex items-start justify-between gap-6">
                <Link to={`/jobs/${job.id}`} className="flex-1 min-w-0 group">
                  <p
                    className="mono text-ink-faint"
                    style={{ fontSize: '11px', letterSpacing: '0.06em' }}
                  >
                    No. {String(idx + 1).padStart(2, '0')} · {job.role} · {job.company}
                  </p>
                  <div className="mt-2 flex items-center gap-3 flex-wrap">
                    <h3
                      className="serif text-ink group-hover:text-accent transition-colors"
                      style={{ fontSize: '22px', lineHeight: 1.2 }}
                    >
                      {job.title}
                    </h3>
                    {statusBadge(job.status)}
                  </div>
                  <div
                    className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-ink-muted"
                    style={{ fontSize: '13px' }}
                  >
                    {job.location && <span>{job.location}</span>}
                    <span>
                      {job.experience_min}
                      {job.experience_max ? `–${job.experience_max}` : '+'} yrs
                    </span>
                  </div>
                </Link>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    to={`/jobs/${job.id}/edit`}
                    className="p-2 text-ink-muted hover:text-ink"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(job.id)}
                    disabled={deletingId === job.id}
                    className="p-2 text-ink-muted hover:text-accent disabled:opacity-50"
                    title="Delete"
                    style={{ background: 'transparent', border: 0, cursor: 'pointer' }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
