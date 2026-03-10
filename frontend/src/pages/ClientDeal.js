import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '/api';

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="10" fill="var(--teal-500)"/>
    <path d="M5.5 10l3 3L14.5 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function ClientDeal() {
  const { dealId } = useParams();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState('review');
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState('');
  const [isEmpty, setIsEmpty] = useState(true);

  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef(null);
  const hasDrawn = useRef(false);

  useEffect(() => {
    axios.get(`${API}/deals/${dealId}`)
      .then(res => {
        setDeal(res.data);
        if (res.data.status === 'signed' || res.data.status === 'paid') setStep('done');
      })
      .catch(() => setError('This deal link is invalid or has expired.'))
      .finally(() => setLoading(false));
  }, [dealId]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0] || e;
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDraw = (e) => { e.preventDefault(); isDrawing.current = true; lastPos.current = getPos(e, canvasRef.current); };
  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#111118';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
    hasDrawn.current = true;
    setIsEmpty(false);
  };
  const endDraw = (e) => { e?.preventDefault(); isDrawing.current = false; };

  const clearSig = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
    setIsEmpty(true);
  };

  const handleSign = async () => {
    if (isEmpty) { setSignError('Please draw your signature above to continue.'); return; }
    setSignError(''); setSigning(true);
    try {
      const res = await axios.patch(`${API}/deals/${dealId}/sign`, { signatureData: canvasRef.current.toDataURL('image/png') });
      setDeal(res.data.deal);
      setStep('done');
    } catch (err) {
      setSignError(err.response?.data?.message || 'Signing failed. Please try again.');
    } finally { setSigning(false); }
  };

  const payUPI = () => {
    const link = `upi://pay?pa=${encodeURIComponent(deal.freelancerUpiId)}&pn=${encodeURIComponent(deal.freelancerName)}&am=${deal.amount}&cu=INR&tn=${encodeURIComponent(deal.projectTitle.slice(0, 50))}`;
    window.location.href = link;
  };

  if (loading) return (
    <div style={p.page}><div className="loader"><div className="spinner" /></div></div>
  );

  if (error) return (
    <div style={p.page}>
      <div style={p.errorCard}>
        <div style={p.errorIcon}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="15" stroke="var(--red-200)" strokeWidth="1.5"/><path d="M16 10v8M16 20.5v1" stroke="var(--red-500)" strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
        <h2 style={p.errorTitle}>Deal not found</h2>
        <p style={p.errorSub}>{error}</p>
      </div>
    </div>
  );

  const deliveryStr = new Date(deal.deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={p.page}>
      <div style={p.wrap} className="fade-up">

        {/* Header */}
        <header style={p.header}>
          <div style={p.logoArea}>
            <div style={p.logoMark}>D</div>
            <span style={p.logoText}>DealFlow</span>
          </div>
          <div style={p.headerRight}>
            <span style={p.sentBy}>Proposal from</span>
            <span style={p.sentByName}>{deal.freelancerName}</span>
          </div>
        </header>

        {/* Main deal card */}
        <div style={p.dealCard}>
          {/* Title area */}
          <div style={p.dealTop}>
            <div>
              <p style={p.dealLabel}>Project proposal</p>
              <h1 style={p.dealTitle}>{deal.projectTitle}</h1>
              <p style={p.dealClient}>Prepared for <strong>{deal.clientName}</strong></p>
            </div>
            <div style={p.amountBlock}>
              <div style={p.amountLabel}>Total amount</div>
              <div style={p.amountVal}>₹{deal.amount.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <hr className="divider" />

          {/* Description */}
          <div style={p.descBlock}>
            <div style={p.descLabel}>Scope of work</div>
            <p style={p.descText}>{deal.projectDescription}</p>
          </div>

          <hr className="divider" />

          {/* Terms row */}
          <div style={p.termsRow}>
            <div style={p.termItem}>
              <div style={p.termLabel}>Delivery by</div>
              <div style={p.termVal}>{deliveryStr}</div>
            </div>
            <div style={p.termDivider} />
            <div style={p.termItem}>
              <div style={p.termLabel}>Revisions included</div>
              <div style={p.termVal}>{deal.revisionsIncluded} revision{deal.revisionsIncluded !== 1 ? 's' : ''}</div>
            </div>
            <div style={p.termDivider} />
            <div style={p.termItem}>
              <div style={p.termLabel}>Payment method</div>
              <div style={p.termVal}>UPI</div>
            </div>
          </div>
        </div>

        {/* Step: Review → Sign */}
        {step === 'review' && (
          <div style={p.stepCard}>
            <div style={p.stepHeader}>
              <div style={p.stepNum}>Step 1 of 2</div>
              <h2 style={p.stepTitle}>Review & sign agreement</h2>
              <p style={p.stepSub}>By proceeding, you confirm that you've reviewed the project details and agree to the terms above.</p>
            </div>
            <button className="btn btn-primary btn-full btn-lg" onClick={() => setStep('sign')}>
              Proceed to sign →
            </button>
          </div>
        )}

        {/* Step: Sign */}
        {step === 'sign' && (
          <div style={p.stepCard}>
            <div style={p.stepHeader}>
              <div style={p.stepNum}>Step 1 of 2</div>
              <h2 style={p.stepTitle}>Sign the agreement</h2>
              <p style={p.stepSub}>Draw your signature below using your finger or mouse. This confirms your acceptance of the project terms.</p>
            </div>

            {signError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{signError}</div>}

            <div style={p.canvasWrap}>
              <canvas
                ref={canvasRef}
                width={640}
                height={180}
                style={p.canvas}
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
              />
              {isEmpty && (
                <div style={p.canvasHint}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M4 18l2-5L17.5 1.5a2.121 2.121 0 0 1 3 3L9 16l-5 2Z" stroke="var(--gray-300)" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                  <span>Sign here</span>
                </div>
              )}
              <div style={p.canvasLine} />
            </div>

            <div style={p.signActions}>
              <button className="btn btn-ghost btn-sm" onClick={clearSig} disabled={isEmpty}>Clear</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSign} disabled={signing || isEmpty}>
                {signing ? 'Confirming…' : 'Confirm signature →'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setStep('review')}>Back</button>
            </div>
          </div>
        )}

        {/* Step: Done — Pay */}
        {step === 'done' && (
          <div style={p.stepCard}>
            <div style={p.signedBanner}>
              <CheckIcon />
              <span style={p.signedText}>Agreement signed</span>
            </div>
            <div style={p.stepHeader}>
              <div style={p.stepNum}>Step 2 of 2</div>
              <h2 style={p.stepTitle}>Complete your payment</h2>
              <p style={p.stepSub}>
                Tap the button below to open your UPI app and pay{' '}
                <strong>₹{deal.amount.toLocaleString('en-IN')}</strong> to{' '}
                <span style={{ fontFamily: 'var(--mono)', color: 'var(--teal-600)' }}>{deal.freelancerUpiId}</span>
              </p>
            </div>

            <button className="btn btn-teal btn-full btn-lg" onClick={payUPI}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L17 6.5V10H15V7.5L10 4.5L5 7.5V15H10V17H4a1 1 0 0 1-1-1V6.5L10 2Z" fill="white"/><circle cx="15" cy="14" r="4" fill="white" fillOpacity="0.3" stroke="white" strokeWidth="1.2"/><path d="M13.5 14h3M15 12.5v3" stroke="white" strokeWidth="1.2" strokeLinecap="round"/></svg>
              Pay ₹{deal.amount.toLocaleString('en-IN')} via UPI
            </button>

            <p style={p.upiNote}>Works with Google Pay, PhonePe, Paytm, BHIM, and all UPI apps</p>

            {deal.signatureData && (
              <div style={p.sigPreview}>
                <div style={p.sigLabel}>Your signature</div>
                <img src={deal.signatureData} alt="Your signature" style={{ maxWidth: '100%', height: 56, objectFit: 'contain' }} />
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={p.footer}>
          <div style={p.footerLogo}>
            <div style={{ ...p.logoMark, width: 18, height: 18, fontSize: 10, borderRadius: 4 }}>D</div>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.02em' }}>DealFlow</span>
          </div>
          <span style={p.footerText}>Secure deal management for Indian freelancers</span>
        </div>
      </div>
    </div>
  );
}

const p = {
  page: { minHeight: '100vh', background: 'var(--gray-25)', padding: '24px 16px 48px', display: 'flex', justifyContent: 'center' },
  wrap: { width: '100%', maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 16 },

  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 20px', boxShadow: 'var(--shadow-xs)' },
  logoArea: { display: 'flex', alignItems: 'center', gap: 8 },
  logoMark: { width: 26, height: 26, background: 'var(--ink)', color: 'var(--white)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 },
  logoText: { fontWeight: 800, fontSize: 15, letterSpacing: '-0.03em', color: 'var(--ink)' },
  headerRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  sentBy: { fontSize: 10, color: 'var(--ink-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' },
  sentByName: { fontSize: 14, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' },

  dealCard: { background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px', boxShadow: 'var(--shadow-sm)' },
  dealTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' },
  dealLabel: { fontSize: 11, fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 },
  dealTitle: { fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--ink)', lineHeight: 1.25, marginBottom: 8 },
  dealClient: { fontSize: 13.5, color: 'var(--ink-muted)' },
  amountBlock: { textAlign: 'right', flexShrink: 0 },
  amountLabel: { fontSize: 11, fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 },
  amountVal: { fontSize: 28, fontWeight: 800, color: 'var(--teal-500)', fontFamily: 'var(--mono)', letterSpacing: '-0.03em' },

  descBlock: {},
  descLabel: { fontSize: 11, fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 },
  descText: { fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.75 },

  termsRow: { display: 'flex', gap: 0 },
  termItem: { flex: 1, textAlign: 'center' },
  termDivider: { width: 1, background: 'var(--border)', flexShrink: 0 },
  termLabel: { fontSize: 10.5, fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 },
  termVal: { fontSize: 14, fontWeight: 700, color: 'var(--ink)' },

  stepCard: { background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px', boxShadow: 'var(--shadow-sm)' },
  stepHeader: { marginBottom: 24 },
  stepNum: { fontSize: 11, fontWeight: 700, color: 'var(--teal-500)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 },
  stepTitle: { fontSize: 20, fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--ink)', marginBottom: 8 },
  stepSub: { fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.65 },

  canvasWrap: { position: 'relative', background: 'var(--gray-25)', border: '1.5px dashed var(--border-strong)', borderRadius: 10, overflow: 'hidden', marginBottom: 16, touchAction: 'none', cursor: 'crosshair' },
  canvas: { display: 'block', width: '100%', touchAction: 'none' },
  canvasHint: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--gray-300)', fontSize: 14, fontWeight: 600, pointerEvents: 'none' },
  canvasLine: { position: 'absolute', bottom: 36, left: 20, right: 20, height: 1, background: 'var(--border)' },
  signActions: { display: 'flex', gap: 10, alignItems: 'center' },

  signedBanner: { display: 'flex', alignItems: 'center', gap: 10, background: 'var(--teal-50)', border: '1px solid var(--teal-100)', borderRadius: 10, padding: '12px 16px', marginBottom: 24 },
  signedText: { fontSize: 14, fontWeight: 700, color: 'var(--teal-600)' },
  upiNote: { textAlign: 'center', fontSize: 12, color: 'var(--ink-faint)', marginTop: 12 },
  sigPreview: { background: 'var(--gray-25)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginTop: 20 },
  sigLabel: { fontSize: 11, color: 'var(--ink-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 },

  errorCard: { textAlign: 'center', padding: '60px 24px', margin: 'auto' },
  errorIcon: { display: 'flex', justifyContent: 'center', marginBottom: 16 },
  errorTitle: { fontSize: 20, fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 8 },
  errorSub: { fontSize: 14, color: 'var(--ink-muted)' },

  footer: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '8px 0' },
  footerLogo: { display: 'flex', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 12, color: 'var(--ink-faint)' },
};
