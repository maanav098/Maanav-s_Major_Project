import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { interviewApi, jobApi, recruiterApi } from '../services/api';
import type { Interview, RecruiterCandidate } from '../types';

export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === 'candidate') {
    return <CandidateDashboard />;
  }

  return <RecruiterDashboard />;
}

function StatStrip({
  items,
}: {
  items: { label: string; value: string; sub?: string; href?: string }[];
}) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-3 my-10"
      style={{ borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}
    >
      {items.map((item, i) => {
        const inner = (
          <div
            className="px-1 py-7 sm:py-9"
            style={{
              borderLeft: i === 0 ? 'none' : undefined,
            }}
          >
            <p className="eyebrow">{item.label}</p>
            <p
              className="numeric mt-3"
              style={{
                fontSize: 'clamp(2.6rem, 5vw, 3.6rem)',
                lineHeight: 1,
                color: 'var(--ink)',
              }}
            >
              {item.value}
            </p>
            {item.sub && (
              <p className="mt-2 text-ink-muted" style={{ fontSize: '13px' }}>
                {item.sub}
              </p>
            )}
          </div>
        );

        const cellStyle: React.CSSProperties = {
          borderLeft: i === 0 ? undefined : '1px solid var(--rule)',
          paddingLeft: i === 0 ? 0 : '1.75rem',
          paddingRight: '1.75rem',
        };

        return item.href ? (
          <Link
            key={item.label}
            to={item.href}
            className="block"
            style={cellStyle}
          >
            {inner}
          </Link>
        ) : (
          <div key={item.label} style={cellStyle}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}

function ActionRow({
  to,
  title,
  desc,
}: {
  to: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between gap-4 py-4"
      style={{ borderTop: '1px solid var(--rule)' }}
    >
      <div>
        <p className="text-ink" style={{ fontSize: '15px', fontWeight: 500 }}>
          {title}
        </p>
        <p className="mt-1 text-ink-muted" style={{ fontSize: '13px' }}>
          {desc}
        </p>
      </div>
      <span className="mono text-ink-muted" style={{ fontSize: '13px' }}>
        &rarr;
      </span>
    </Link>
  );
}

function CandidateDashboard() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<Interview[] | null>(null);

  useEffect(() => {
    interviewApi
      .myInterviews()
      .then(setInterviews)
      .catch(() => setInterviews([]));
  }, []);

  const total = interviews?.length ?? null;
  const scored = (interviews ?? []).filter(
    (i) => typeof i.overall_score === 'number',
  );
  const avg =
    scored.length > 0
      ? (scored.reduce((s, i) => s + (i.overall_score as number), 0) / scored.length).toFixed(1)
      : '—';
  const uniqueRoles = new Set((interviews ?? []).map((i) => i.role).filter(Boolean));
  const rolesPractised = interviews ? uniqueRoles.size : null;

  const fmt = (n: number | null) => (n == null ? '—' : n.toString());

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-14">
      <p className="eyebrow">Today's session</p>
      <h1
        className="heading-display mt-3"
        style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}
      >
        Welcome back,{' '}
        <span className="serif-italic">{user?.full_name?.split(' ')[0] || 'there'}</span>.
      </h1>

      <StatStrip
        items={[
          { label: 'Interviews taken', value: fmt(total), sub: 'Across all roles' },
          { label: 'Average score', value: avg, sub: 'Out of 100' },
          { label: 'Roles practised', value: fmt(rolesPractised), sub: 'Distinct roles attempted' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-6">
        <section>
          <p className="eyebrow">What next</p>
          <h2 className="serif mt-3" style={{ fontSize: '22px' }}>
            Pick up where you left off
          </h2>
          <div className="mt-6">
            <ActionRow
              to="/interview/new"
              title="Begin a practice round"
              desc="Choose a role and a company style. Or upload a JD."
            />
            <ActionRow
              to="/openings"
              title="Browse openings"
              desc="See what recruiters are hiring for and apply."
            />
            <ActionRow
              to="/my-interviews"
              title="Past interviews"
              desc="Review scores, transcripts and feedback."
            />
            <div style={{ borderTop: '1px solid var(--rule)' }} />
          </div>
        </section>

        <section>
          <p className="eyebrow">Roles to practise</p>
          <h2 className="serif mt-3" style={{ fontSize: '22px' }}>
            Common destinations
          </h2>
          <div className="mt-6">
            {[
              'Software Development Engineer',
              'ML Engineer',
              'Data Scientist',
              'Frontend Developer',
              'Backend Developer',
            ].map((role) => (
              <Link
                key={role}
                to={`/interview/new?role=${encodeURIComponent(role)}`}
                className="flex items-center justify-between py-4"
                style={{ borderTop: '1px solid var(--rule)' }}
              >
                <span className="text-ink" style={{ fontSize: '15px' }}>
                  {role}
                </span>
                <span className="mono text-ink-faint" style={{ fontSize: '12px' }}>
                  Practise &rarr;
                </span>
              </Link>
            ))}
            <div style={{ borderTop: '1px solid var(--rule)' }} />
          </div>
        </section>
      </div>
    </div>
  );
}

function RecruiterDashboard() {
  const { user } = useAuth();
  const [activeJobs, setActiveJobs] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<RecruiterCandidate[] | null>(null);

  useEffect(() => {
    Promise.all([jobApi.myJobs(), recruiterApi.myCandidates()])
      .then(([jobs, cands]) => {
        setActiveJobs(jobs.filter((j) => j.status === 'open').length);
        setCandidates(cands);
      })
      .catch(() => {
        setActiveJobs(0);
        setCandidates([]);
      });
  }, []);

  const totalCandidates = candidates?.length ?? null;
  const totalInterviews = candidates?.reduce((sum, c) => sum + c.interview_count, 0) ?? null;
  const fmt = (n: number | null) => (n == null ? '—' : n.toString());

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-14">
      <p className="eyebrow">Recruiter view</p>
      <h1
        className="heading-display mt-3"
        style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}
      >
        Hello,{' '}
        <span className="serif-italic">{user?.full_name?.split(' ')[0] || 'there'}</span>.
      </h1>

      <StatStrip
        items={[
          { label: 'Open postings', value: fmt(activeJobs), sub: 'Currently accepting applicants', href: '/jobs' },
          { label: 'Candidates', value: fmt(totalCandidates), sub: 'Across all your postings', href: '/candidates' },
          { label: 'Interviews completed', value: fmt(totalInterviews), sub: 'Submitted for review' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-6">
        <section>
          <p className="eyebrow">What next</p>
          <h2 className="serif mt-3" style={{ fontSize: '22px' }}>
            Manage hiring
          </h2>
          <div className="mt-6">
            <ActionRow to="/jobs/new" title="Post a new role" desc="Compose a JD and have AI propose the interview structure." />
            <ActionRow to="/jobs" title="Manage postings" desc="Edit, close or reopen existing roles." />
            <ActionRow to="/candidates" title="Review candidates" desc="Sort by score, drill into transcripts." />
            <div style={{ borderTop: '1px solid var(--rule)' }} />
          </div>
        </section>

        <section>
          <p className="eyebrow">Recent activity</p>
          <h2 className="serif mt-3" style={{ fontSize: '22px' }}>
            Latest signals
          </h2>
          <div className="mt-6 py-12 text-center text-ink-muted" style={{ borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}>
            <p className="serif-italic" style={{ fontSize: '17px', color: 'var(--ink)' }}>
              Nothing here yet.
            </p>
            <p className="mt-2" style={{ fontSize: '13px' }}>
              Once candidates begin interviewing, their submissions will appear here.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
