import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const SunIcon  = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const MoonIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.5 10A6 6 0 0 1 6 2.5a6 6 0 1 0 7.5 7.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>;

const STEPS = [
  { n:'01', title:'Create a deal', desc:'Fill in the project details — title, scope, amount, deadline.' },
  { n:'02', title:'Share the link', desc:'Send one link to your client. They open it instantly, no signup needed.' },
  { n:'03', title:'Client signs', desc:'Client draws their digital signature right in the browser.' },
  { n:'04', title:'Get paid via UPI', desc:'One tap opens Google Pay, PhonePe or any UPI app, pre-filled.' },
];

export default function Landing() {
  const { theme, toggle } = useTheme();
  const heroRef = useRef(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const handler = (e) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 20;
      const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 10;
      el.style.setProperty('--rx', `${y}deg`);
      el.style.setProperty('--ry', `${x}deg`);
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return (
    <div style={s.page}>
      {/* NAV */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={s.logo}><div style={s.logoMark}>D</div><span style={s.logoText}>DealFlow</span></div>
          <div style={s.navRight}>
            <button style={s.themeBtn} onClick={toggle} title="Toggle theme">
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <Link to="/login" style={s.navLink}>Sign in</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get started →</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={s.hero}>
        <div style={s.heroText}>
          <div style={s.heroBadge}>
            <span style={s.badgeDot} />
            Built for Indian freelancers
          </div>
          <h1 style={s.h1}>
            The simplest way to<br />
            <span style={s.h1Accent}>close deals & get paid</span>
          </h1>
          <p style={s.heroSub}>
            Send a proposal link. Client signs it. Client pays via UPI.<br />
            No invoices. No chasing. No payment gateway fees.
          </p>
          <div style={s.heroCta}>
            <Link to="/register" className="btn btn-teal btn-lg">Start for free — it's quick</Link>
            <Link to="/login"    className="btn btn-outline btn-lg">Sign in</Link>
          </div>
          <div style={s.heroMeta}>
            <span style={s.metaItem}><span style={s.metaDot}>✓</span> Free to use</span>
            <span style={s.metaItem}><span style={s.metaDot}>✓</span> No payment gateway</span>
            <span style={s.metaItem}><span style={s.metaDot}>✓</span> Works on all devices</span>
          </div>
        </div>

        {/* Deal card mockup with 3D tilt */}
        <div style={s.mockupOuter} ref={heroRef}>
          <div style={s.mockupCard}>
            <div style={s.mockupStatus}>
              <span style={s.mockupStatusDot} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal-600)' }}>VIEWED BY CLIENT</span>
            </div>
            <div style={s.mockupTitle}>Mobile App Development</div>
            <div style={s.mockupClient}>Prepared for Raj Mehta</div>
            <div style={s.mockupGrid}>
              {[['Amount','₹80,000'],['Delivery','45 days'],['Revisions','2']].map(([l,v]) => (
                <div key={l} style={s.mockupCell}>
                  <div style={s.mcLabel}>{l}</div>
                  <div style={s.mcVal}>{v}</div>
                </div>
              ))}
            </div>
            <div style={s.mockupBtn}>✍ Sign & Pay via UPI</div>
            <div style={s.mockupFooter}>
              <div style={s.mockupAvatar}>AK</div>
              <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>Proposal by Arjun Kumar</span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={s.steps}>
        <div style={s.stepsInner}>
          <p style={s.sectionLabel}>How it works</p>
          <h2 style={s.h2}>Four steps. That's all.</h2>
          <div style={s.stepGrid}>
            {STEPS.map((step, i) => (
              <div key={i} style={s.stepCard}>
                <div style={s.stepNum}>{step.n}</div>
                <div style={s.stepTitle}>{step.title}</div>
                <div style={s.stepDesc}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SPLIT FEATURE */}
      <section style={s.feature}>
        <div style={s.featureInner}>
          <div style={s.featureText}>
            <p style={s.sectionLabel}>For your clients</p>
            <h2 style={s.h2}>Zero friction for clients</h2>
            <p style={s.featureDesc}>
              Clients don't need to sign up, install an app, or create an account.
              They just open the link, read the proposal, sign with their finger, and tap Pay.
              It's that simple.
            </p>
            <div style={s.featureList}>
              {['Works in any browser on any device','Digital signature captured instantly','UPI payment in one tap — no bank details needed','Signed contract PDF downloadable immediately'].map((f, i) => (
                <div key={i} style={s.featureItem}>
                  <div style={s.featureCheck}>✓</div>
                  <span style={{ fontSize: 14, color: 'var(--ink-muted)' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={s.featureVisual}>
            <div style={s.phoneFrame}>
              <div style={s.phoneScreen}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal-600)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Step 2 of 2</div>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.02em' }}>Complete payment</div>
                <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 14, lineHeight: 1.5 }}>Pay ₹80,000 to arjun@upi</div>
                <div style={{ background: 'var(--teal-500)', color: '#fff', borderRadius: 10, padding: '12px', textAlign: 'center', fontSize: 13, fontWeight: 700 }}>
                  💸 Pay via UPI
                </div>
                <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--ink-faint)', marginTop: 10 }}>
                  Google Pay · PhonePe · Paytm · BHIM
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={s.cta}>
        <div style={s.ctaInner}>
          <h2 style={s.ctaTitle}>Ready to close your next deal?</h2>
          <p style={s.ctaSub}>Join freelancers who send proposals that actually get signed — and paid.</p>
          <Link to="/register" className="btn btn-teal btn-lg">Create your free account →</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div style={s.logo}><div style={{ ...s.logoMark, width: 22, height: 22, fontSize: 11, borderRadius: 5 }}>D</div><span style={{ ...s.logoText, fontSize: 14 }}>DealFlow</span></div>
          <p style={{ fontSize: 12, color: 'var(--ink-faint)' }}>Built for Indian freelancers · UPI payments · No fees</p>
        </div>
      </footer>
    </div>
  );
}

const s = {
  page:       { minHeight: '100vh', background: 'var(--bg)' },
  nav:        { position: 'sticky', top: 0, zIndex: 50, background: 'rgba(var(--bg-rgb, 247,247,248),.92)', backdropFilter: 'blur(14px)', borderBottom: '1px solid var(--border)' },
  navInner:   { maxWidth: 1080, margin: '0 auto', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  logo:       { display: 'flex', alignItems: 'center', gap: 8 },
  logoMark:   { width: 30, height: 30, background: 'var(--ink)', color: 'var(--bg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0 },
  logoText:   { fontWeight: 800, fontSize: 17, letterSpacing: '-0.03em', color: 'var(--ink)' },
  navRight:   { display: 'flex', alignItems: 'center', gap: 10 },
  navLink:    { fontSize: 14, fontWeight: 600, color: 'var(--ink-muted)', padding: '4px 8px' },
  themeBtn:   { background: 'none', border: '1px solid var(--border)', borderRadius: 7, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink-muted)' },

  hero:       { maxWidth: 1080, margin: '0 auto', padding: '72px 24px 60px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 48, alignItems: 'center' },
  heroText:   { maxWidth: 540 },
  heroBadge:  { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--teal-50)', color: 'var(--teal-600)', border: '1px solid var(--teal-100)', borderRadius: 99, padding: '5px 12px', fontSize: 12, fontWeight: 700, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '.05em' },
  badgeDot:   { width: 6, height: 6, borderRadius: '50%', background: 'var(--teal-500)', animation: 'pulse 2s ease infinite' },
  h1:         { fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.1, color: 'var(--ink)', marginBottom: 20 },
  h1Accent:   { color: 'var(--teal-500)' },
  heroSub:    { fontSize: 16, color: 'var(--ink-muted)', lineHeight: 1.75, marginBottom: 32 },
  heroCta:    { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 },
  heroMeta:   { display: 'flex', gap: 20, flexWrap: 'wrap' },
  metaItem:   { fontSize: 12.5, color: 'var(--ink-faint)', display: 'flex', alignItems: 'center', gap: 5 },
  metaDot:    { color: 'var(--teal-500)', fontWeight: 700 },

  mockupOuter:{ perspective: '1000px' },
  mockupCard: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 20, padding: '24px', width: 300,
    boxShadow: 'var(--shadow-xl)',
    transform: 'rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))',
    transition: 'transform .1s ease',
    willChange: 'transform',
  },
  mockupStatus:{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 },
  mockupStatusDot: { width: 7, height: 7, borderRadius: '50%', background: 'var(--teal-500)', animation: 'pulse 2s ease infinite' },
  mockupTitle:{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 6, color: 'var(--ink)' },
  mockupClient:{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 16 },
  mockupGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, background: 'var(--surface2)', borderRadius: 10, padding: 12, marginBottom: 16 },
  mockupCell: {},
  mcLabel:    { fontSize: 9, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700, marginBottom: 3 },
  mcVal:      { fontSize: 13, fontWeight: 700, color: 'var(--ink)' },
  mockupBtn:  { background: 'var(--teal-500)', color: '#fff', borderRadius: 10, padding: 12, textAlign: 'center', fontSize: 13, fontWeight: 700, marginBottom: 14 },
  mockupFooter:{ display: 'flex', alignItems: 'center', gap: 8 },
  mockupAvatar:{ width: 24, height: 24, background: 'var(--surface2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--ink-muted)' },

  steps:      { background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '72px 24px' },
  stepsInner: { maxWidth: 1080, margin: '0 auto' },
  sectionLabel:{ fontSize: 12, fontWeight: 700, color: 'var(--teal-500)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 },
  h2:         { fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--ink)', marginBottom: 40, lineHeight: 1.2 },
  stepGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 },
  stepCard:   { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 },
  stepNum:    { fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--teal-500)', marginBottom: 12, letterSpacing: '.05em' },
  stepTitle:  { fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 },
  stepDesc:   { fontSize: 13.5, color: 'var(--ink-muted)', lineHeight: 1.65 },

  feature:    { padding: '72px 24px' },
  featureInner:{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' },
  featureText:{ },
  featureDesc:{ fontSize: 15, color: 'var(--ink-muted)', lineHeight: 1.75, marginBottom: 28 },
  featureList:{ display: 'flex', flexDirection: 'column', gap: 12 },
  featureItem:{ display: 'flex', alignItems: 'flex-start', gap: 10 },
  featureCheck:{ width: 22, height: 22, background: 'var(--teal-50)', color: 'var(--teal-600)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 },
  featureVisual:{ display: 'flex', justifyContent: 'center' },
  phoneFrame: { width: 240, background: 'var(--ink)', borderRadius: 32, padding: '24px 16px', boxShadow: 'var(--shadow-xl)' },
  phoneScreen:{ background: 'var(--surface)', borderRadius: 20, padding: '20px 16px' },

  cta:        { background: 'var(--ink)', padding: '72px 24px' },
  ctaInner:   { maxWidth: 600, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 },
  ctaTitle:   { fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.2 },
  ctaSub:     { fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 8 },

  footer:     { borderTop: '1px solid var(--border)', padding: '24px' },
  footerInner:{ maxWidth: 1080, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
};

// Responsive landing CSS
const style = document.createElement('style');
style.textContent = `
@media(max-width:768px){
  .landing-hero{grid-template-columns:1fr!important;}
  .landing-mockup{display:none;}
  .landing-feature{grid-template-columns:1fr!important;}
  .landing-phone{display:none;}
}`;
if (!document.querySelector('[data-landing-style]')) {
  style.setAttribute('data-landing-style', '');
  document.head.appendChild(style);
}
