import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const STEPS = [
  { n:'01', title:'Create a deal',      desc:'Fill in the project details — title, scope, amount, deadline.' },
  { n:'02', title:'Share the link',     desc:'Send one link to your client. No signup needed on their end.' },
  { n:'03', title:'Client signs',       desc:'Client draws their digital signature right in the browser.' },
  { n:'04', title:'Get paid via UPI',   desc:'One tap opens Google Pay, PhonePe or any UPI app, pre-filled.' },
];

const FEATURES = [
  'Works in any browser on any device',
  'Digital signature captured instantly',
  'UPI payment in one tap — no bank details needed',
  'Signed contract PDF downloadable immediately',
];

export default function Landing() {
  const heroRef = useRef(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const handler = e => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left)  / r.width  - 0.5) * 20;
      const y = ((e.clientY - r.top)   / r.height - 0.5) * 10;
      el.style.setProperty('--rx', `${y}deg`);
      el.style.setProperty('--ry', `${x}deg`);
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>

      {/* NAV */}
      <nav style={{ position:'sticky', top:0, zIndex:50, background:'rgba(247,247,248,.94)', backdropFilter:'blur(14px)', borderBottom:'1px solid var(--border)' }}>
        <div style={{ maxWidth:1080, margin:'0 auto', padding:'0 24px', height:58, display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
          <div className="logo">
            <div className="logo-mark">D</div>
            <span className="logo-text">DealFlow</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Link to="/login"    style={{ fontSize:14, fontWeight:600, color:'var(--ink-muted)', padding:'4px 8px' }}>Sign in</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get started →</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth:1080, margin:'0 auto', padding:'72px 24px 60px' }}>
        <div className="land-hero-grid" style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:48, alignItems:'center' }}>
          <div style={{ maxWidth:540 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'var(--teal-50)', color:'var(--teal-600)', border:'1px solid var(--teal-100)', borderRadius:99, padding:'5px 12px', fontSize:12, fontWeight:700, marginBottom:20, textTransform:'uppercase', letterSpacing:'.05em' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--teal-500)', animation:'pulse 2s ease infinite', display:'inline-block' }} />
              Built for Indian freelancers
            </div>
            <h1 style={{ fontSize:'clamp(32px,5vw,54px)', fontWeight:800, letterSpacing:'-.035em', lineHeight:1.1, color:'var(--ink)', marginBottom:20 }}>
              The simplest way to<br />
              <span style={{ color:'var(--teal-500)' }}>close deals &amp; get paid</span>
            </h1>
            <p style={{ fontSize:16, color:'var(--ink-muted)', lineHeight:1.75, marginBottom:32 }}>
              Send a proposal link. Client signs it. Client pays via UPI.<br />
              No invoices. No chasing. No payment gateway fees.
            </p>
            <div className="land-hero-cta" style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
              <Link to="/register" className="btn btn-teal btn-lg">Start for free — it's quick</Link>
              <Link to="/login"    className="btn btn-outline btn-lg">Sign in</Link>
            </div>
            <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
              {['Free to use','No payment gateway','Works on all devices'].map(t => (
                <span key={t} style={{ fontSize:12.5, color:'var(--ink-faint)', display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ color:'var(--teal-500)', fontWeight:700 }}>✓</span> {t}
                </span>
              ))}
            </div>
          </div>

          {/* 3D tilt card mockup */}
          <div className="land-mockup-hide" style={{ perspective:'1000px' }} ref={heroRef}>
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:24, width:300, boxShadow:'var(--shadow-xl)', transform:'rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))', transition:'transform .1s ease', willChange:'transform' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:16 }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--teal-500)', animation:'pulse 2s ease infinite', display:'inline-block' }} />
                <span style={{ fontSize:11, fontWeight:700, color:'var(--teal-600)' }}>VIEWED BY CLIENT</span>
              </div>
              <div style={{ fontSize:18, fontWeight:800, letterSpacing:'-.025em', marginBottom:6, color:'var(--ink)' }}>Mobile App Development</div>
              <div style={{ fontSize:12, color:'var(--ink-faint)', marginBottom:16 }}>Prepared for Raj Mehta</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, background:'var(--surface2)', borderRadius:10, padding:12, marginBottom:16 }}>
                {[['Amount','₹80,000'],['Delivery','45 days'],['Revisions','2']].map(([l,v]) => (
                  <div key={l}>
                    <div style={{ fontSize:9, color:'var(--ink-faint)', textTransform:'uppercase', letterSpacing:'.06em', fontWeight:700, marginBottom:3 }}>{l}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--ink)' }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:'var(--teal-500)', color:'#fff', borderRadius:10, padding:12, textAlign:'center', fontSize:13, fontWeight:700, marginBottom:14 }}>✍ Sign &amp; Pay via UPI</div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:24, height:24, background:'var(--surface2)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'var(--ink-muted)' }}>AK</div>
                <span style={{ fontSize:11, color:'var(--ink-faint)' }}>Proposal by Arjun Kumar</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background:'var(--surface)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', padding:'72px 24px' }}>
        <div style={{ maxWidth:1080, margin:'0 auto' }}>
          <p style={{ fontSize:12, fontWeight:700, color:'var(--teal-500)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12 }}>How it works</p>
          <h2 style={{ fontSize:'clamp(26px,4vw,38px)', fontWeight:800, letterSpacing:'-.03em', color:'var(--ink)', marginBottom:40, lineHeight:1.2 }}>Four steps. That's all.</h2>
          <div className="land-step-grid-r" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:20 }}>
            {STEPS.map(step => (
              <div key={step.n} style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:14, padding:24 }}>
                <div style={{ fontFamily:'var(--mono)', fontSize:11, fontWeight:700, color:'var(--teal-500)', marginBottom:12, letterSpacing:'.05em' }}>{step.n}</div>
                <div style={{ fontSize:16, fontWeight:800, letterSpacing:'-.02em', marginBottom:8 }}>{step.title}</div>
                <div style={{ fontSize:13.5, color:'var(--ink-muted)', lineHeight:1.65 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SPLIT FEATURE */}
      <section style={{ padding:'72px 24px' }}>
        <div className="land-feat-grid" style={{ maxWidth:1080, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center' }}>
          <div>
            <p style={{ fontSize:12, fontWeight:700, color:'var(--teal-500)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12 }}>For your clients</p>
            <h2 style={{ fontSize:'clamp(26px,4vw,38px)', fontWeight:800, letterSpacing:'-.03em', color:'var(--ink)', marginBottom:16, lineHeight:1.2 }}>Zero friction for clients</h2>
            <p style={{ fontSize:15, color:'var(--ink-muted)', lineHeight:1.75, marginBottom:28 }}>
              Clients don't need to sign up, install an app, or create an account.
              They just open the link, read the proposal, sign with their finger, and tap Pay.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {FEATURES.map(f => (
                <div key={f} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                  <div style={{ width:22, height:22, background:'var(--teal-50)', color:'var(--teal-600)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, flexShrink:0 }}>✓</div>
                  <span style={{ fontSize:14, color:'var(--ink-muted)' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="land-phone-hide" style={{ display:'flex', justifyContent:'center' }}>
            <div style={{ width:240, background:'var(--ink)', borderRadius:32, padding:'24px 16px', boxShadow:'var(--shadow-xl)' }}>
              <div style={{ background:'var(--surface)', borderRadius:20, padding:'20px 16px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--teal-600)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>Step 2 of 2</div>
                <div style={{ fontSize:14, fontWeight:800, marginBottom:4, letterSpacing:'-.02em' }}>Complete payment</div>
                <div style={{ fontSize:11, color:'var(--ink-muted)', marginBottom:14, lineHeight:1.5 }}>Pay ₹80,000 to arjun@upi</div>
                <div style={{ background:'var(--teal-500)', color:'#fff', borderRadius:10, padding:12, textAlign:'center', fontSize:13, fontWeight:700 }}>💸 Pay via UPI</div>
                <div style={{ textAlign:'center', fontSize:10, color:'var(--ink-faint)', marginTop:10 }}>Google Pay · PhonePe · Paytm · BHIM</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background:'var(--ink)', padding:'72px 24px' }}>
        <div style={{ maxWidth:600, margin:'0 auto', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
          <h2 style={{ fontSize:'clamp(26px,4vw,36px)', fontWeight:800, letterSpacing:'-.03em', color:'#fff', lineHeight:1.2 }}>Ready to close your next deal?</h2>
          <p style={{ fontSize:15, color:'rgba(255,255,255,.6)', lineHeight:1.7 }}>Join freelancers who send proposals that actually get signed — and paid.</p>
          <Link to="/register" className="btn btn-teal btn-lg">Create your free account →</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:'1px solid var(--border)', padding:24 }}>
        <div style={{ maxWidth:1080, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div className="logo">
            <div style={{ width:22, height:22, background:'var(--ink)', color:'#fff', borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:11 }}>D</div>
            <span style={{ fontWeight:800, fontSize:14, letterSpacing:'-.03em', color:'var(--ink)' }}>DealFlow</span>
          </div>
          <p style={{ fontSize:12, color:'var(--ink-faint)' }}>Built for Indian freelancers · UPI payments · No fees</p>
        </div>
      </footer>
    </div>
  );
}
