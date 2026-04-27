import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { interviewApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Interview, RecruiterDecision } from '../types';

const DECISION_OPTIONS: { value: RecruiterDecision; label: string }[] = [
  { value: 'shortlisted', label: 'Shortlist' },
  { value: 'on_hold', label: 'Hold' },
  { value: 'rejected', label: 'Reject' },
  { value: 'pending', label: 'Reset' },
];

function DecisionPanel({
  interview,
  onUpdate,
}: {
  interview: Interview;
  onUpdate: (i: Interview) => void;
}) {
  const persistedDecision: RecruiterDecision = interview.recruiter_decision ?? 'pending';
  const persistedNotes = interview.recruiter_notes ?? '';
  const [decision, setDecision] = useState<RecruiterDecision>(persistedDecision);
  const [notes, setNotes] = useState<string>(persistedNotes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const dirty = decision !== persistedDecision || notes !== persistedNotes;

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await interviewApi.updateDecision(interview.id, {
        decision,
        notes: notes.trim() || undefined,
      });
      onUpdate(updated);
    } catch {
      setError('Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className="card mt-10"
      style={{ borderTop: '1px solid var(--accent)' }}
    >
      <p className="eyebrow text-accent">Decision</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {DECISION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setDecision(opt.value)}
            className={decision === opt.value ? 'pill pill-active' : 'pill'}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <label className="eyebrow block mt-7 mb-2">Notes (optional)</label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        className="input-field-boxed"
        placeholder="Hiring manager comments, follow-up plans, sticking points…"
      />

      {error && (
        <p
          className="mt-3"
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

      <div className="flex items-center justify-between mt-6 flex-wrap gap-3">
        <p className="mono text-ink-faint" style={{ fontSize: '12px' }}>
          {interview.decision_updated_at
            ? `Last updated ${new Date(interview.decision_updated_at).toLocaleString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}`
            : 'No decision recorded yet'}
        </p>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className="btn-primary"
        >
          {saving ? 'Saving…' : 'Save decision'}
        </button>
      </div>
    </section>
  );
}

export default function InterviewResult() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isRecruiter = user?.role === 'recruiter';
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInterview();
  }, [id]);

  const loadInterview = async () => {
    try {
      const data = await interviewApi.get(Number(id));
      setInterview(data);
    } catch {
      console.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!interview || !interview.overall_score) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <p className="serif-italic text-ink" style={{ fontSize: '22px' }}>
          Results not available yet.
        </p>
        <Link to="/dashboard" className="btn-secondary mt-6 inline-flex">
          &larr; Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-10 py-14">
      <Link to="/dashboard" className="btn-text" style={{ fontSize: '13px' }}>
        &larr; Dashboard
      </Link>

      <div className="mt-10">
        <p className="eyebrow">Round complete</p>
        <h1
          className="heading-display mt-3"
          style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}
        >
          A read on{' '}
          <span className="serif-italic">
            {interview.role}
            {interview.company && ` · ${interview.company}`}
          </span>
          .
        </h1>
      </div>

      {isRecruiter && (
        <DecisionPanel interview={interview} onUpdate={setInterview} />
      )}

      {/* Score strip */}
      <div
        className="grid grid-cols-1 sm:grid-cols-3 mt-12"
        style={{ borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}
      >
        {[
          { label: 'Overall', value: interview.overall_score },
          { label: 'Technical', value: interview.technical_score || 0 },
          { label: 'Communication', value: interview.communication_score || 0 },
        ].map((s, i) => (
          <div
            key={s.label}
            style={{
              borderLeft: i === 0 ? undefined : '1px solid var(--rule)',
              padding: '2.5rem 1.75rem',
            }}
          >
            <p className="eyebrow">{s.label}</p>
            <div className="flex items-baseline gap-2 mt-3">
              <p
                className="numeric"
                style={{
                  fontSize: 'clamp(2.6rem, 5vw, 3.6rem)',
                  lineHeight: 1,
                  color: 'var(--ink)',
                }}
              >
                {s.value}
              </p>
              <span className="mono text-ink-faint" style={{ fontSize: '14px' }}>
                / 100
              </span>
            </div>
          </div>
        ))}
      </div>

      {interview.level_prediction && (
        <div className="mt-12 text-center">
          <p className="eyebrow">Estimated level</p>
          <p
            className="heading-display-italic mt-3"
            style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}
          >
            {interview.level_prediction}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16">
        <section>
          <p className="eyebrow">What worked</p>
          <h2 className="serif mt-3" style={{ fontSize: '20px' }}>
            Strengths
          </h2>
          {interview.strengths && interview.strengths.length > 0 ? (
            <ul className="mt-5">
              {interview.strengths.map((strength, index) => (
                <li
                  key={index}
                  className="text-ink py-3"
                  style={{
                    borderTop: '1px solid var(--rule)',
                    fontSize: '15px',
                    lineHeight: 1.55,
                  }}
                >
                  {strength}
                </li>
              ))}
              <li style={{ borderTop: '1px solid var(--rule)' }} />
            </ul>
          ) : (
            <p className="mt-4 text-ink-muted">No specific strengths identified.</p>
          )}
        </section>

        <section>
          <p className="eyebrow">Where to grow</p>
          <h2 className="serif mt-3" style={{ fontSize: '20px' }}>
            Areas to develop
          </h2>
          {interview.weaknesses && interview.weaknesses.length > 0 ? (
            <ul className="mt-5">
              {interview.weaknesses.map((weakness, index) => (
                <li
                  key={index}
                  className="text-ink py-3"
                  style={{
                    borderTop: '1px solid var(--rule)',
                    fontSize: '15px',
                    lineHeight: 1.55,
                  }}
                >
                  {weakness}
                </li>
              ))}
              <li style={{ borderTop: '1px solid var(--rule)' }} />
            </ul>
          ) : (
            <p className="mt-4 text-ink-muted">No specific areas identified.</p>
          )}
        </section>
      </div>

      <section className="mt-16">
        <p className="eyebrow">For next time</p>
        <h2 className="serif mt-3" style={{ fontSize: '20px' }}>
          Suggestions
        </h2>
        {interview.suggestions && interview.suggestions.length > 0 ? (
          <ul className="mt-5">
            {interview.suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="text-ink py-4 flex gap-4"
                style={{
                  borderTop: '1px solid var(--rule)',
                  fontSize: '15px',
                  lineHeight: 1.55,
                }}
              >
                <span
                  className="numeric serif-italic text-ink-faint flex-shrink-0"
                  style={{ minWidth: '2rem' }}
                >
                  {String(index + 1).padStart(2, '0')}.
                </span>
                <span>{suggestion}</span>
              </li>
            ))}
            <li style={{ borderTop: '1px solid var(--rule)' }} />
          </ul>
        ) : (
          <p className="mt-4 text-ink-muted">No specific suggestions.</p>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-6 mt-16">
        {isRecruiter ? (
          <>
            <Link to="/candidates" className="btn-primary">
              Back to candidates
            </Link>
            {interview.job_id && (
              <Link to={`/jobs/${interview.job_id}`} className="btn-text">
                View posting &rarr;
              </Link>
            )}
          </>
        ) : (
          <>
            <Link to="/interview/new" className="btn-primary">
              Practise again
            </Link>
            <Link to="/my-interviews" className="btn-text">
              View all interviews &rarr;
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
