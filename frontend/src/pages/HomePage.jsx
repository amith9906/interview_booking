import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  const partnerLogos = [
    { id: 'acme', label: 'ACME' },
    { id: 'nexus', label: 'NEXUS' },
    { id: 'orbit', label: 'ORBIT' },
    { id: 'vertex', label: 'VERTEX' },
    { id: 'pulse', label: 'PULSE' },
    { id: 'apex', label: 'APEX' }
  ];

  const performers = [
    { id: 'p1', initials: 'AK', tone: 'a' },
    { id: 'p2', initials: 'MR', tone: 'b' },
    { id: 'p3', initials: 'SJ', tone: 'c' },
    { id: 'p4', initials: 'DL', tone: 'd' },
    { id: 'p5', initials: 'TP', tone: 'e' }
  ];

  return (
    <div className="hp-page">
      {/* Hero section — full width, centered */}
      <section className="hp-hero-section hp-homeReveal hp-homeReveal-delay-2">
        <h1 className="hp-hero-title">
          You have the{' '}
          <span className="hp-heroAccent">knowledge</span>.
          <br />
          We have the <span className="hp-heroAccent">technique</span>.
        </h1>
        <p className="hp-hero-lead hp-homeReveal hp-homeReveal-delay-3">
          A focused 20-minute realtime interview experience—built to help you move from{' '}
          <strong className="hp-hero-strong">rejection</strong> to{' '}
          <strong className="hp-hero-strong">selection</strong>. You bring the depth; we help you
          show it the way interviewers want to hear it.
        </p>
      </section>

      {/* Bottom band — dark background with 4-column grid */}
      <section className="hp-bottom-band">
        <div className="hp-bottom-grid">
          <aside
            className="hp-side hp-side--partners hp-homeReveal hp-homeReveal-delay-5"
            aria-label="Hiring partners"
          >
            <span className="hp-side-kicker">Hiring partners</span>
            <p className="hp-side-text">
              Companies that have hired students after our platform
            </p>
            <div className="hp-logo-grid" aria-hidden="true">
              {partnerLogos.map((item) => (
                <div key={item.id} className="hp-logo-cell">
                  <span className="hp-logo-cell-text">{item.label}</span>
                </div>
              ))}
            </div>
          </aside>

          <article
            className="hp-premiumCtaCard hp-homeReveal hp-homeReveal-delay-6"
            aria-label="Student mock interview pricing"
          >
            <h2 className="hp-premiumCta-headline">Crack Your Next Interview with Confidence</h2>
            <p className="hp-premiumCta-subtext">
              Real interview simulations designed to turn rejection into selection
            </p>
            <p className="hp-premiumCta-price">
              <span className="hp-premiumCta-priceLabel">Starting at</span>{' '}
              <span className="hp-premiumCta-priceNum">₹499</span>
            </p>
            <p className="hp-premiumCta-support">
              Built for serious students aiming for top placements
            </p>
            <button
              type="button"
              className="hp-premiumCtaBtn"
              onClick={() => navigate('/login')}
            >
              Start Your Mock Interview →
            </button>
            <p className="hp-premiumCta-trust">⭐ 500+ students placed</p>
          </article>

          <article
            className="hp-premiumCtaCard hp-premiumCtaCard--consultant hp-homeReveal hp-homeReveal-delay-7"
            aria-label="Consultant and hiring teams CTA"
          >
            <h2 className="hp-premiumCta-headline hp-premiumCta-headline--wide">
              Hire Interview-Ready Talent, Faster
            </h2>
            <p className="hp-premiumCta-subtext">
              Access candidates who are trained, evaluated, and ready to perform from day one
            </p>
            <p className="hp-premiumCta-badge">Up to 80% Selection Success Rate</p>
            <p className="hp-premiumCta-support">
              Built for consultants and hiring teams who value quality over volume
            </p>
            <button
              type="button"
              className="hp-premiumCtaBtn"
              onClick={() => navigate('/contact')}
            >
              Get Qualified Candidates →
            </button>
            <p className="hp-premiumCta-trust">🚀 Trusted by growing teams</p>
          </article>

          <aside
            className="hp-side hp-side--performers hp-homeReveal hp-homeReveal-delay-8"
            aria-label="Top performers"
          >
            <span className="hp-side-kicker">Top performers</span>
            <p className="hp-side-text">Standout students from recent cohorts</p>
            <ul className="hp-performer-list" role="list">
              {performers.map((p) => (
                <li key={p.id} className="hp-performer-item">
                  <div className={`hp-avatar hp-avatar--${p.tone}`} aria-hidden="true">
                    <span className="hp-avatar-initials">{p.initials}</span>
                    <span className="hp-avatar-badge" aria-hidden="true">
                      ★
                    </span>
                  </div>
                  <span className="hp-performer-label">
                    {p.initials} - Top Performer
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
    </div>
  );
}
