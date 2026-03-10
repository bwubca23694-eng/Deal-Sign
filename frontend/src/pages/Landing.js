import React from 'react';
import { Link } from 'react-router-dom';

const features = [
  { icon: '✦', title: 'Instant proposals', desc: 'Create a professional deal in under 2 minutes. No templates to fight with.' },
  { icon: '✦', title: 'Digital signatures', desc: 'Clients sign directly in their browser. No PDF, no printing, no friction.' },
  { icon: '✦', title: 'UPI payment link', desc: 'One tap and clients land in their UPI app, pre-filled and ready to pay.' },
  { icon: '✦', title: 'Deal tracking', desc: 'Know the moment your proposal is viewed, signed, and paid. Zero chasing.' },
];

export default function Landing() {
  return (
    <div style={s.page}>
      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={s.logo}>
            <div style={s.logoMark}>D</div>
            <span style={s.logoText}>DealFlow</span>
          </div>
          <div style={s.navLinks}>
            <Link to="/login" style={s.navLink}>Sign in</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get started free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.pill}>For independent freelancers</div>
          <h1 style={s.heroTitle}>
            Close deals.<br />
            <span style={s.heroAccent}>Get paid faster.</span>
          </h1>
          <p style={s.heroSubtitle}>
            Send a proposal link. Client signs it. Client pays via UPI.<br />
            That's it — no back-and-forth, no unpaid invoices.
          </p>
          <div style={s.heroCta}>
            <Link to="/register" className="btn btn-primary btn-lg">Start for free →</Link>
            <Link to="/login" className="btn btn-outline btn-lg">Sign in</Link>
          </div>
          <p style={s.heroNote}>No credit card. No setup fee. Works on any device.</p>
        </div>

        {/* Decorative deal card mockup */}
        <div style={s.mockupWrap}>
          <div style={s.mockupCard}>
            <div style={s.mockupHeader}>
              <div style={s.mockupAvatar}>RK</div>
              <div>
                <div style={s.mockupFrom}>Proposal from</div>
                <div style={s.mockupName}>Rohan Kumar</div>
              </div>
            </div>
            <div style={s.mockupTitle}>E-commerce Website Redesign</div>
            <div style={s.mockupMeta}>
              <div style={s.mockupMetaItem}><span style={s.mockupMetaLabel}>Amount</span><span style={s.mockupMetaVal}>₹45,000</span></div>
              <div style={s.mockupMetaItem}><span style={s.mockupMetaLabel}>Delivery</span><span style={s.mockupMetaVal}>30 days</span></div>
              <div style={s.mockupMetaItem}><span style={s.mockupMetaLabel}>Revisions</span><span style={s.mockupMetaVal}>3</span></div>
            </div>
            <div style={s.mockupBtn}>Sign & Pay via UPI</div>
            <div style={s.mockupSigned}>
              <span style={s.mockupSignedDot} />
              Client viewed · 2 min ago
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={s.features}>
        <div style={s.featuresInner}>
          <p style={s.featuresLabel}>How it works</p>
          <h2 style={s.featuresTitle}>Everything you need.<br />Nothing you don't.</h2>
          <div style={s.featureGrid}>
            {features.map((f, i) => (
              <div key={i} style={s.featureCard}>
                <div style={s.featureIcon}>{f.icon}</div>
                <div style={s.featureName}>{f.title}</div>
                <div style={s.featureDesc}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section style={s.ctaStrip}>
        <div style={s.ctaInner}>
          <h2 style={s.ctaTitle}>Ready to close your next deal?</h2>
          <Link to="/register" className="btn btn-teal btn-lg">Create your first deal →</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div style={s.logo}>
            <div style={{ ...s.logoMark, width: 22, height: 22, fontSize: 12, borderRadius: 5 }}>D</div>
            <span style={{ ...s.logoText, fontSize: 14 }}>DealFlow</span>
          </div>
          <p style={s.footerText}>Built for Indian freelancers · Payments via UPI</p>
        </div>
      </footer>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'var(--white)' },

  nav: { position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' },
  navInner: { maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { display: 'flex', alignItems: 'center', gap: 9 },
  logoMark: { width: 30, height: 30, background: 'var(--ink)', color: 'var(--white)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, fontFamily: 'var(--font)', flexShrink: 0 },
  logoText: { fontWeight: 800, fontSize: 17, letterSpacing: '-0.03em', color: 'var(--ink)' },
  navLinks: { display: 'flex', alignItems: 'center', gap: 12 },
  navLink: { fontSize: 14, fontWeight: 600, color: 'var(--ink-muted)' },

  hero: { maxWidth: 1100, margin: '0 auto', padding: '80px 24px 60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' },
  heroInner: {},
  pill: { display: 'inline-block', background: 'var(--teal-50)', color: 'var(--teal-600)', border: '1px solid var(--teal-100)', borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 700, letterSpacing: '0.03em', marginBottom: 20, textTransform: 'uppercase' },
  heroTitle: { fontSize: 54, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.1, color: 'var(--ink)', marginBottom: 20, fontFamily: 'var(--font)' },
  heroAccent: { color: 'var(--teal-500)' },
  heroSubtitle: { fontSize: 17, color: 'var(--ink-muted)', lineHeight: 1.7, marginBottom: 32, maxWidth: 440 },
  heroCta: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 },
  heroNote: { fontSize: 12, color: 'var(--ink-faint)' },

  mockupWrap: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
  mockupCard: { background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 20, padding: '28px 24px', width: 320, boxShadow: 'var(--shadow-xl)' },
  mockupHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  mockupAvatar: { width: 42, height: 42, background: 'var(--teal-50)', color: 'var(--teal-600)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0 },
  mockupFrom: { fontSize: 10, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 2 },
  mockupName: { fontSize: 15, fontWeight: 700, color: 'var(--ink)' },
  mockupTitle: { fontSize: 18, fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--ink)', marginBottom: 20, lineHeight: 1.3 },
  mockupMeta: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20, background: 'var(--gray-25)', borderRadius: 10, padding: 12 },
  mockupMetaItem: { display: 'flex', flexDirection: 'column', gap: 2 },
  mockupMetaLabel: { fontSize: 9, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 },
  mockupMetaVal: { fontSize: 13, fontWeight: 700, color: 'var(--ink)' },
  mockupBtn: { background: 'var(--teal-500)', color: '#fff', borderRadius: 10, padding: '12px', textAlign: 'center', fontSize: 14, fontWeight: 700, marginBottom: 14 },
  mockupSigned: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-faint)' },
  mockupSignedDot: { width: 7, height: 7, borderRadius: '50%', background: 'var(--teal-500)', flexShrink: 0 },

  features: { background: 'var(--gray-25)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '80px 24px' },
  featuresInner: { maxWidth: 1100, margin: '0 auto' },
  featuresLabel: { fontSize: 12, fontWeight: 700, color: 'var(--teal-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 },
  featuresTitle: { fontSize: 38, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--ink)', marginBottom: 48, lineHeight: 1.2 },
  featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 24 },
  featureCard: { background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px', boxShadow: 'var(--shadow-xs)' },
  featureIcon: { fontSize: 20, color: 'var(--teal-500)', marginBottom: 12, fontFamily: 'var(--mono)' },
  featureName: { fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 8, letterSpacing: '-0.02em' },
  featureDesc: { fontSize: 13.5, color: 'var(--ink-muted)', lineHeight: 1.65 },

  ctaStrip: { padding: '80px 24px', textAlign: 'center' },
  ctaInner: { maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 },
  ctaTitle: { fontSize: 34, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2, color: 'var(--ink)' },

  footer: { borderTop: '1px solid var(--border)', padding: '24px' },
  footerInner: { maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' },
  footerText: { fontSize: 12, color: 'var(--ink-faint)' },
};
