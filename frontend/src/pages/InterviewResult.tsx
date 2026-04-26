import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { interviewApi } from '../services/api';
import type { Interview } from '../types';

export default function InterviewResult() {
  const { id } = useParams<{ id: string }>();
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
        <Link to="/interview/new" className="btn-primary">
          Practise again
        </Link>
        <Link to="/my-interviews" className="btn-text">
          View all interviews &rarr;
        </Link>
      </div>
    </div>
  );
}
