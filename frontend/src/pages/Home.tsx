import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="surface">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 lg:px-10 pt-20 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow fade-rise fade-rise-1">
              Interview Practice &nbsp;·&nbsp; Recruitment, since 2025
            </p>
            <h1
              className="heading-display mt-7 fade-rise fade-rise-2"
              style={{ fontSize: 'clamp(2.6rem, 6.4vw, 5rem)' }}
            >
              Considered,&nbsp;
              <span className="serif-italic" style={{ fontStyle: 'italic' }}>
                candid
              </span>
              <br />
              interviews.
            </h1>
            <p
              className="mt-8 max-w-xl text-ink-muted fade-rise fade-rise-3"
              style={{ fontSize: '17px', lineHeight: 1.6 }}
            >
              A quiet place to practise interviews and screen candidates. No
              gamification, no leaderboards — just thoughtful questions, careful
              listening, and feedback that reads like it was written by someone
              who cares.
            </p>
            <div className="mt-10 flex items-center gap-7 fade-rise fade-rise-4">
              {user ? (
                <Link to="/dashboard" className="btn-primary">
                  Go to dashboard
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary">
                    Begin
                  </Link>
                  <Link to="/login" className="btn-text">
                    Already a member &rarr;
                  </Link>
                </>
              )}
            </div>
          </div>

          <aside className="lg:col-span-5 fade-rise fade-rise-5">
            <div
              className="card-bordered"
              style={{
                transform: 'rotate(-0.6deg)',
                padding: '1.75rem 1.85rem',
                background: 'var(--surface)',
              }}
            >
              <p className="eyebrow" style={{ marginBottom: '1rem' }}>
                Question 04 / 10 &nbsp;·&nbsp; Backend Engineer
              </p>
              <p
                className="serif"
                style={{ fontSize: '19px', lineHeight: 1.45, color: 'var(--ink)' }}
              >
                "Walk me through a system you designed where the obvious
                approach turned out to be wrong. What did the second draft look
                like, and what did the first one teach you?"
              </p>
              <hr className="rule" style={{ margin: '1.4rem 0 1rem' }} />
              <p
                className="mono"
                style={{ fontSize: '11px', color: 'var(--ink-muted)', letterSpacing: '0.04em' }}
              >
                Auto-transcribed &nbsp;·&nbsp; 02:14 elapsed
              </p>
            </div>
            <p
              className="mono mt-4 text-ink-faint"
              style={{ fontSize: '11px', letterSpacing: '0.06em', textAlign: 'right' }}
            >
              Sample · not a real candidate
            </p>
          </aside>
        </div>
      </section>

      <hr className="rule" style={{ maxWidth: '72rem', margin: '0 auto' }} />

      {/* Three pillars */}
      <section className="max-w-6xl mx-auto px-6 lg:px-10 py-24">
        <p className="eyebrow">What you get</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-10">
          <div>
            <p
              className="numeric"
              style={{ fontSize: '64px', lineHeight: 0.95, color: 'var(--ink)' }}
            >
              I.
            </p>
            <h3 className="serif mt-4" style={{ fontSize: '20px' }}>
              Honest evaluation
            </h3>
            <p className="mt-3 text-ink-muted" style={{ fontSize: '15px' }}>
              Each answer is read for clarity, depth and reasoning — and graded
              the way a senior engineer would, not by keyword count.
            </p>
          </div>
          <div>
            <p
              className="numeric"
              style={{ fontSize: '64px', lineHeight: 0.95, color: 'var(--ink)' }}
            >
              II.
            </p>
            <h3 className="serif mt-4" style={{ fontSize: '20px' }}>
              Tailored to the role
            </h3>
            <p className="mt-3 text-ink-muted" style={{ fontSize: '15px' }}>
              Recruiters set the categories and a job description; the AI
              composes a question set that matches the seniority and the work
              that is actually being hired for.
            </p>
          </div>
          <div>
            <p
              className="numeric"
              style={{ fontSize: '64px', lineHeight: 0.95, color: 'var(--ink)' }}
            >
              III.
            </p>
            <h3 className="serif mt-4" style={{ fontSize: '20px' }}>
              Quiet by design
            </h3>
            <p className="mt-3 text-ink-muted" style={{ fontSize: '15px' }}>
              No timers shouting, no streaks, no rainbow badges. The interface
              gets out of the way so the conversation can happen.
            </p>
          </div>
        </div>
      </section>

      <hr className="rule" style={{ maxWidth: '72rem', margin: '0 auto' }} />

      {/* Quote */}
      <section className="max-w-3xl mx-auto px-6 py-28 text-center">
        <p
          className="heading-display-italic"
          style={{ fontSize: 'clamp(1.7rem, 3.4vw, 2.4rem)', lineHeight: 1.25 }}
        >
          &ldquo;A practice interview should feel like a conversation,
          not&nbsp;a&nbsp;quiz.&rdquo;
        </p>
        <p className="eyebrow mt-8">— A principle we keep returning to</p>
      </section>

      <hr className="rule" style={{ maxWidth: '72rem', margin: '0 auto' }} />

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 lg:px-10 py-24">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <p className="eyebrow">Ready when you are</p>
            <h2
              className="heading-display mt-4"
              style={{ fontSize: 'clamp(1.8rem, 3.6vw, 2.6rem)' }}
            >
              Sit down for an interview that
              <br />
              <span className="serif-italic">remembers what you said</span>.
            </h2>
          </div>
          {!user && (
            <Link to="/register" className="btn-primary">
              Create an account
            </Link>
          )}
          {user && (
            <Link to="/interview/new" className="btn-primary">
              Begin a practice round
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
        <hr className="rule" style={{ marginBottom: '1.75rem' }} />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="serif-italic text-ink" style={{ fontSize: '17px' }}>
            Interview&nbsp;<span style={{ color: 'var(--accent)' }}>&amp;</span>&nbsp;Co.
          </p>
          <p className="eyebrow">© {new Date().getFullYear()} · A major project</p>
        </div>
      </footer>
    </div>
  );
}
