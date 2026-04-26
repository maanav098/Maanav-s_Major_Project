import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { jobApi } from '../services/api';
import type { Job } from '../types';
import { Search } from 'lucide-react';

export default function Openings() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await jobApi.list();
        setJobs(data.filter((j) => j.status === 'open'));
      } catch (e) {
        console.error('Failed to load openings', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = search.trim()
    ? jobs.filter((j) => {
        const q = search.toLowerCase();
        return (
          j.title.toLowerCase().includes(q) ||
          j.role.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.required_skills?.some((s) => s.toLowerCase().includes(q))
        );
      })
    : jobs;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 py-14">
      <p className="eyebrow">Openings</p>
      <h1 className="heading-display mt-3" style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}>
        Roles in&nbsp;<span className="serif-italic">circulation</span>.
      </h1>
      <p className="mt-4 max-w-xl text-ink-muted" style={{ fontSize: '15px' }}>
        Apply to a real opening — your evaluation goes straight to the recruiter who posted it.
      </p>

      <div className="mt-10 max-w-md relative">
        <Search
          className="absolute left-0 top-1/2 -translate-y-1/2"
          style={{ height: 14, width: 14, color: 'var(--ink-faint)' }}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, role, company, or skill"
          className="input-field"
          style={{ paddingLeft: '1.5rem' }}
        />
      </div>

      <div className="mt-10" style={{ borderTop: '1px solid var(--rule)' }}>
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="serif-italic text-ink" style={{ fontSize: '20px' }}>
              {jobs.length === 0 ? 'Nothing on the books just yet.' : 'No matches for that search.'}
            </p>
            <p className="mt-2 text-ink-muted" style={{ fontSize: '14px' }}>
              {jobs.length === 0
                ? 'Recruiters are still posting; check back shortly.'
                : 'Try a different term.'}
            </p>
          </div>
        ) : (
          filtered.map((job, idx) => (
            <Link
              key={job.id}
              to={`/openings/${job.id}`}
              className="block py-7 group"
              style={{ borderBottom: '1px solid var(--rule)' }}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <p
                    className="mono text-ink-faint"
                    style={{ fontSize: '11px', letterSpacing: '0.06em' }}
                  >
                    No. {String(idx + 1).padStart(2, '0')} · {job.role} · {job.company}
                  </p>
                  <h3
                    className="serif mt-2 text-ink"
                    style={{ fontSize: '24px', lineHeight: 1.2 }}
                  >
                    {job.title}
                  </h3>
                  <div
                    className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-ink-muted"
                    style={{ fontSize: '13px' }}
                  >
                    {job.location && <span>{job.location}</span>}
                    {job.salary_range && <span>{job.salary_range}</span>}
                    <span>
                      {job.experience_min}
                      {job.experience_max ? `–${job.experience_max}` : '+'} yrs experience
                    </span>
                  </div>
                  {job.required_skills?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {job.required_skills.slice(0, 6).map((s) => (
                        <span key={s} className="badge badge-info">
                          {s}
                        </span>
                      ))}
                      {job.required_skills.length > 6 && (
                        <span
                          className="mono text-ink-faint self-center"
                          style={{ fontSize: '11px' }}
                        >
                          +{job.required_skills.length - 6}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <span
                  className="mono text-ink-muted group-hover:text-ink transition-colors"
                  style={{ fontSize: '13px', whiteSpace: 'nowrap' }}
                >
                  View &rarr;
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
