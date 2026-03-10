import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '/api';

export default function ClientDeal() {
  const { dealId } = useParams();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState('review'); // review | sign | done
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState('');
  const [isEmpty, setIsEmpty] = useState(true);

  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef(null);

  useEffect(() => {
    axios.get(`${API}/deals/${dealId}`)
      .then(res => {
        setDeal(res.data);
        if (res.data.status === 'signed' || res.data.status === 'paid') {
          setStep('done');
        }
      })
      .catch(() => setError('Deal not found or link is invalid'))
      .finally(() => setLoading(false));
  }, [dealId]);

  // Canvas drawing logic
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    isDrawing.current = true;
    lastPos.current = getPos(e, canvasRef.current);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#7EFF8B';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPos.current = pos;
    setIsEmpty(false);
  };

  const endDraw = (e) => {
    e?.preventDefault();
    isDrawing.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const handleSign = async () => {
    if (isEmpty) {
      setSignError('Please draw your signature first');
      return;
    }
    setSignError('');
    setSigning(true);
    try {
      const canvas = canvasRef.current;
      const signatureData = canvas.toDataURL('image/png');
      const res = await axios.patch(`${API}/deals/${dealId}/sign`, { signatureData });
      setDeal(res.data.deal);
      setStep('done');
    } catch (err) {
      setSignError(err.response?.data?.message || 'Failed to sign. Please try again.');
    } finally {
      setSigning(false);
    }
  };

  const handleUPIPayment = () => {
    if (!deal) return;
    const upiLink = `upi://pay?pa=${encodeURIComponent(deal.freelancerUpiId)}&pn=${encodeURIComponent(deal.freelancerName)}&am=${deal.amount}&cu=INR&tn=${encodeURIComponent(deal.projectTitle)}`;
    window.location.href = upiLink;
  };

  if (loading) return (
    <div style={clientStyles.page}>
      <div className="loader"><div className="spinner" /></div>
    </div>
  );

  if (error) return (
    <div style={clientStyles.page}>
      <div style={clientStyles.errorBox}>
        <div style={clientStyles.errorIcon}>✕</div>
        <h2 style={clientStyles.errorTitle}>Deal Not Found</h2>
        <p style={clientStyles.errorText}>{error}</p>
      </div>
    </div>
  );

  return (
    <div style={clientStyles.page}>
      <div style={clientStyles.wrap} className="page-enter">
        {/* Header */}
        <div style={clientStyles.header}>
          <div style={clientStyles.logoMark}>D</div>
          <div>
            <div style={clientStyles.from}>Proposal from</div>
            <div style={clientStyles.freelancerName}>{deal.freelancerName}</div>
          </div>
        </div>

        {/* Project card */}
        <div style={clientStyles.projectCard}>
          <div style={clientStyles.projectTitle}>{deal.projectTitle}</div>
          <div style={clientStyles.projectClient}>Prepared for: <strong>{deal.clientName}</strong></div>
          <hr className="divider" />
          <div style={clientStyles.description}>{deal.projectDescription}</div>
          <hr className="divider" />

          <div style={clientStyles.detailsGrid}>
            <div style={clientStyles.detail}>
              <div style={clientStyles.detailLabel}>Amount</div>
              <div style={{ ...clientStyles.detailValue, color: 'var(--accent)', fontSize: 28 }}>
                ₹{deal.amount.toLocaleString('en-IN')}
              </div>
            </div>
            <div style={clientStyles.detail}>
              <div style={clientStyles.detailLabel}>Delivery By</div>
              <div style={clientStyles.detailValue}>{new Date(deal.deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
            <div style={clientStyles.detail}>
              <div style={clientStyles.detailLabel}>Revisions</div>
              <div style={clientStyles.detailValue}>{deal.revisionsIncluded} included</div>
            </div>
          </div>
        </div>

        {/* Steps */}
        {step === 'review' && (
          <div style={clientStyles.actionCard}>
            <h3 style={clientStyles.actionTitle}>Step 1 of 2 — Review & Sign</h3>
            <p style={clientStyles.actionText}>
              By signing below, you agree to the project scope, amount, and delivery timeline stated above.
            </p>
            <button
              className="btn btn-primary btn-full"
              style={{ marginTop: 8 }}
              onClick={() => setStep('sign')}
            >
              ✍️ Proceed to Sign Agreement
            </button>
          </div>
        )}

        {step === 'sign' && (
          <div style={clientStyles.actionCard}>
            <h3 style={clientStyles.actionTitle}>Sign the Agreement</h3>
            <p style={clientStyles.actionText}>Draw your signature below using your finger or mouse</p>

            {signError && <div className="alert alert-error">{signError}</div>}

            <div style={clientStyles.signatureWrap}>
              <canvas
                ref={canvasRef}
                width={600}
                height={180}
                style={clientStyles.canvas}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
              <div style={clientStyles.signatureLine} />
              <div style={clientStyles.signatureHint}>Sign here</div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={clearSignature} style={{ flex: 1 }}>
                Clear
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSign}
                disabled={signing || isEmpty}
                style={{ flex: 2 }}
              >
                {signing ? 'Confirming...' : '✓ Confirm Signature'}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div style={clientStyles.actionCard}>
            <div style={clientStyles.signedBadge}>
              <span>✓</span> Agreement Signed
            </div>
            <h3 style={clientStyles.actionTitle}>Step 2 of 2 — Pay ₹{deal.amount.toLocaleString('en-IN')}</h3>
            <p style={clientStyles.actionText}>
              Tap the button below to open your UPI app and complete the payment to <strong style={{ fontFamily: 'var(--mono)' }}>{deal.freelancerUpiId}</strong>
            </p>

            <button
              className="btn btn-primary btn-full"
              style={{ fontSize: 16, padding: '16px', marginTop: 8 }}
              onClick={handleUPIPayment}
            >
              💸 Pay ₹{deal.amount.toLocaleString('en-IN')} via UPI
            </button>

            <div style={clientStyles.upiApps}>
              Works with Google Pay, PhonePe, Paytm, and all UPI apps
            </div>

            {deal.signatureData && (
              <div style={clientStyles.sigPreview}>
                <div style={clientStyles.sigPreviewLabel}>Your signature</div>
                <img src={deal.signatureData} alt="Signature" style={{ maxWidth: '100%', height: 60, objectFit: 'contain' }} />
              </div>
            )}
          </div>
        )}

        <div style={clientStyles.footer}>
          Powered by <strong>DealFlow</strong> — Simple deals for freelancers
        </div>
      </div>
    </div>
  );
}

const clientStyles = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    padding: '24px 16px',
    display: 'flex',
    justifyContent: 'center',
  },
  wrap: {
    width: '100%',
    maxWidth: 560,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  logoMark: {
    width: 44,
    height: 44,
    background: 'var(--accent)',
    color: '#000',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 20,
    flexShrink: 0,
  },
  from: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 },
  freelancerName: { fontSize: 18, fontWeight: 800 },
  projectCard: {
    background: 'var(--surface)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '24px',
    marginBottom: 16,
  },
  projectTitle: { fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 },
  projectClient: { fontSize: 13, color: 'var(--text-muted)', marginBottom: 0 },
  description: { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
  },
  detail: {},
  detailLabel: { fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 },
  detailValue: { fontSize: 16, fontWeight: 700 },
  actionCard: {
    background: 'var(--surface)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '24px',
    marginBottom: 16,
  },
  actionTitle: { fontSize: 16, fontWeight: 700, marginBottom: 8 },
  actionText: { fontSize: 13, color: 'var(--text-muted)', marginBottom: 0, lineHeight: 1.6 },
  signatureWrap: {
    background: 'var(--surface2)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    position: 'relative',
    overflow: 'hidden',
    marginTop: 16,
    touchAction: 'none',
  },
  canvas: {
    display: 'block',
    width: '100%',
    cursor: 'crosshair',
    touchAction: 'none',
  },
  signatureLine: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    right: 24,
    height: 1,
    background: 'var(--border)',
  },
  signatureHint: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 11,
    color: 'var(--text-dim)',
    fontWeight: 600,
    letterSpacing: '0.06em',
  },
  signedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 12px',
    background: 'rgba(126,255,139,0.1)',
    border: '1px solid rgba(126,255,139,0.25)',
    borderRadius: 999,
    color: 'var(--accent)',
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 16,
  },
  upiApps: {
    textAlign: 'center',
    fontSize: 11,
    color: 'var(--text-dim)',
    marginTop: 12,
  },
  sigPreview: {
    marginTop: 20,
    padding: '12px',
    background: 'var(--surface2)',
    borderRadius: 'var(--radius-sm)',
  },
  sigPreviewLabel: { fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: 'var(--text-dim)',
    padding: '24px 0',
  },
  errorBox: {
    textAlign: 'center',
    padding: '60px 24px',
  },
  errorIcon: {
    width: 56, height: 56,
    background: 'rgba(255,107,107,0.1)',
    color: 'var(--accent2)',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, fontWeight: 800,
    margin: '0 auto 16px',
  },
  errorTitle: { fontSize: 20, fontWeight: 800, marginBottom: 8 },
  errorText: { color: 'var(--text-muted)' },
};
