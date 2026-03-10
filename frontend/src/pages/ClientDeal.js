import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import jsPDF from 'jspdf';

const API      = process.env.REACT_APP_API_URL || '/api';
const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// ── Professional PDF generator (no html2canvas – pure jsPDF) ──────────────
function generateContractPDF(deal) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210, PH = 297;
  const ML = 20, MR = 20, TW = PW - ML - MR;

  let y = 0;

  // ── Header bar ─────────────────────────────────────────
  pdf.setFillColor(17, 17, 24);
  pdf.rect(0, 0, PW, 28, 'F');

  // Logo mark
  pdf.setFillColor(15, 169, 122);
  pdf.roundedRect(ML, 7, 14, 14, 2, 2, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('D', ML + 7, 16.5, { align: 'center' });

  // Company name
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DealFlow', ML + 18, 14.5);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(180, 180, 190);
  pdf.text('Freelancer Deal Platform', ML + 18, 19.5);

  // "CONTRACT" label top right
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(100, 200, 160);
  pdf.text('SERVICE AGREEMENT', PW - MR, 14.5, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(150, 150, 165);
  pdf.setFontSize(7.5);
  pdf.text(`REF: ${deal.dealId.toUpperCase()}`, PW - MR, 20, { align: 'right' });

  y = 38;

  // ── Deal title ───────────────────────────────────────────
  pdf.setTextColor(17, 17, 24);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text(deal.projectTitle, ML, y);
  y += 8;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(90, 90, 101);
  pdf.text(`Prepared for ${deal.clientName}  ·  Issued by ${deal.freelancerName}`, ML, y);
  y += 5;

  // Divider
  pdf.setDrawColor(228, 228, 232);
  pdf.setLineWidth(0.4);
  pdf.line(ML, y, PW - MR, y);
  y += 8;

  // ── Info grid (3 columns) ────────────────────────────────
  const cols = [
    { label: 'TOTAL AMOUNT', value: `Rs. ${deal.amount.toLocaleString('en-IN')}` },
    { label: 'DELIVERY BY',  value: new Date(deal.deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
    { label: 'REVISIONS',    value: `${deal.revisionsIncluded} included` },
  ];

  cols.forEach((col, i) => {
    const cx = ML + (i * (TW / 3));
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(152, 152, 163);
    pdf.text(col.label, cx, y);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(i === 0 ? 13 : 11);
    pdf.setTextColor(i === 0 ? 15 : 17, i === 0 ? 169 : 17, i === 0 ? 122 : 24);
    pdf.text(col.value, cx, y + 6);
  });

  y += 18;

  // Light rule
  pdf.setFillColor(242, 242, 244);
  pdf.rect(ML, y, TW, 0.4, 'F');
  y += 8;

  // ── Section: Parties ─────────────────────────────────────
  const sectionHeader = (title, yPos) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(152, 152, 163);
    pdf.text(title.toUpperCase(), ML, yPos);
    return yPos + 5;
  };

  y = sectionHeader('1. PARTIES', y);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(17, 17, 24);
  const partiesText = `This Service Agreement ("Agreement") is entered into between ${deal.freelancerName} ("Service Provider") and ${deal.clientName} ("Client"). The Service Provider agrees to deliver the services described herein under the terms stated below.`;
  const partiesLines = pdf.splitTextToSize(partiesText, TW);
  pdf.text(partiesLines, ML, y);
  y += partiesLines.length * 5 + 6;

  // ── Section: Scope ────────────────────────────────────────
  y = sectionHeader('2. SCOPE OF WORK', y);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(17, 17, 24);
  const scopeLines = pdf.splitTextToSize(deal.projectDescription, TW);
  pdf.text(scopeLines, ML, y);
  y += scopeLines.length * 5 + 6;

  // ── Section: Terms ────────────────────────────────────────
  y = sectionHeader('3. PAYMENT TERMS', y);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(17, 17, 24);
  const payTerms = `The Client agrees to pay Rs. ${deal.amount.toLocaleString('en-IN')} (Indian Rupees) to the Service Provider upon completion of the project. Payment shall be made via UPI to ${deal.freelancerUpiId}. The total fee is inclusive of all applicable charges.`;
  const payLines = pdf.splitTextToSize(payTerms, TW);
  pdf.text(payLines, ML, y);
  y += payLines.length * 5 + 6;

  // ── Section: Revisions ───────────────────────────────────
  y = sectionHeader('4. REVISIONS & DELIVERY', y);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  const revText = `The project shall be delivered by ${new Date(deal.deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. This Agreement includes ${deal.revisionsIncluded} round(s) of revisions at no additional charge. Further revisions may be subject to additional fees to be agreed upon separately.`;
  const revLines = pdf.splitTextToSize(revText, TW);
  pdf.text(revLines, ML, y);
  y += revLines.length * 5 + 6;

  // ── Section: IP & Confidentiality ────────────────────────
  y = sectionHeader('5. INTELLECTUAL PROPERTY', y);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  const ipText = 'Upon receipt of full payment, all intellectual property rights to the final deliverables shall be transferred to the Client. The Service Provider retains the right to display the work in their portfolio unless otherwise agreed in writing.';
  const ipLines = pdf.splitTextToSize(ipText, TW);
  pdf.text(ipLines, ML, y);
  y += ipLines.length * 5 + 10;

  // ── Signature section ────────────────────────────────────
  // Separator
  pdf.setDrawColor(228, 228, 232);
  pdf.setLineWidth(0.4);
  pdf.line(ML, y, PW - MR, y);
  y += 8;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(152, 152, 163);
  pdf.text('6. SIGNATURES', ML, y);
  y += 7;

  // Two-column signatures
  const col1x = ML;
  const col2x = ML + TW / 2 + 8;
  const colW  = TW / 2 - 8;

  // ── Service Provider column ──
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(17, 17, 24);
  pdf.text('Service Provider', col1x, y);
  y += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(90, 90, 101);
  pdf.text(deal.freelancerName, col1x, y);
  y += 10;

  pdf.setDrawColor(200, 200, 208);
  pdf.setLineWidth(0.5);
  pdf.line(col1x, y, col1x + colW, y);
  y += 4;
  pdf.setFontSize(7.5);
  pdf.setTextColor(152, 152, 163);
  pdf.text('Authorized signature', col1x, y);

  // ── Client column (with actual signature) ──
  let sigY = y - 14;

  // Signature box
  pdf.setFillColor(249, 250, 251);
  pdf.setDrawColor(228, 228, 232);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(col2x, sigY - 2, colW, 16, 1, 1, 'FD');

  // Embed signature image
  if (deal.signatureData) {
    try {
      pdf.addImage(deal.signatureData, 'PNG', col2x + 2, sigY - 1, colW - 4, 14);
    } catch (e) {}
  }

  sigY += 14;
  pdf.setDrawColor(200, 200, 208);
  pdf.setLineWidth(0.5);
  pdf.line(col2x, sigY, col2x + colW, sigY);
  sigY += 4;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(152, 152, 163);
  pdf.text(`${deal.clientName} — Client signature`, col2x, sigY);

  // Reset y to below signatures
  y = sigY + 10;

  // Signed date + deal ID
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(152, 152, 163);
  if (deal.signedAt) {
    const dt = new Date(deal.signedAt).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    pdf.text(`Digitally signed on ${dt}`, col2x, y);
  }

  y += 12;

  // ── Footer band ─────────────────────────────────────────
  pdf.setFillColor(242, 242, 244);
  pdf.rect(0, PH - 14, PW, 14, 'F');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(152, 152, 163);
  pdf.text('Generated by DealFlow  ·  dealflow.onrender.com', ML, PH - 5.5);
  pdf.text(`Document ID: ${deal.dealId.toUpperCase()}`, PW - MR, PH - 5.5, { align: 'right' });

  return pdf;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ClientDeal() {
  const { dealId }  = useParams();
  const [deal,      setDeal]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [step,      setStep]      = useState('review');
  const [signing,   setSigning]   = useState(false);
  const [signErr,   setSignErr]   = useState('');
  const [isEmpty,   setIsEmpty]   = useState(true);
  const [downloading, setDownloading] = useState(false);

  const canvasRef = useRef(null);
  const drawing   = useRef(false);
  const lastPos   = useRef(null);

  useEffect(() => {
    axios.get(`${API}/deals/${dealId}`)
      .then(res => {
        setDeal(res.data);
        if (['signed','paid'].includes(res.data.status)) setStep('done');
      })
      .catch(() => setError('This proposal link is invalid or has expired.'))
      .finally(() => setLoading(false));
  }, [dealId]);

  // ── Canvas drawing ──────────────────────────────────────
  const getPos = (e, c) => {
    const r = c.getBoundingClientRect();
    const t = e.touches?.[0] || e;
    return { x: (t.clientX - r.left) * (c.width / r.width), y: (t.clientY - r.top) * (c.height / r.height) };
  };
  const startDraw = e => { e.preventDefault(); drawing.current = true; lastPos.current = getPos(e, canvasRef.current); };
  const draw = e => {
    e.preventDefault();
    if (!drawing.current) return;
    const c = canvasRef.current, ctx = c.getContext('2d'), pos = getPos(e, c);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#111118'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    lastPos.current = pos; setIsEmpty(false);
  };
  const endDraw = e => { e?.preventDefault(); drawing.current = false; };
  const clearSig = () => {
    canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setIsEmpty(true);
  };

  const handleSign = async () => {
    if (isEmpty) { setSignErr('Please draw your signature to continue.'); return; }
    setSignErr(''); setSigning(true);
    try {
      const res = await axios.patch(`${API}/deals/${dealId}/sign`, { signatureData: canvasRef.current.toDataURL('image/png') });
      setDeal(res.data.deal); setStep('done');
    } catch (err) { setSignErr(err.response?.data?.message || 'Signing failed. Please try again.'); }
    finally { setSigning(false); }
  };

  const payUPI = () => {
    window.location.href = `upi://pay?pa=${encodeURIComponent(deal.freelancerUpiId)}&pn=${encodeURIComponent(deal.freelancerName)}&am=${deal.amount}&cu=INR&tn=${encodeURIComponent(deal.projectTitle.slice(0, 50))}`;
  };

  const downloadContract = useCallback(async () => {
    setDownloading(true);
    try {
      const pdf = generateContractPDF(deal);
      pdf.save(`DealFlow-Contract-${deal.dealId}.pdf`);
    } catch { alert('Could not generate PDF. Please try again.'); }
    finally { setDownloading(false); }
  }, [deal]);

  // ── Renders ─────────────────────────────────────────────
  if (loading) return <div className="client-page"><div className="loader"><div className="spinner" /></div></div>;
  if (error)   return (
    <div className="client-page">
      <div style={{ textAlign: 'center', padding: '80px 24px', margin: 'auto' }}>
        <div style={{ width: 56, height: 56, background: 'var(--red-bg)', color: 'var(--red)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, margin: '0 auto 16px' }}>✕</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Proposal not found</h2>
        <p style={{ fontSize: 14, color: 'var(--ink-muted)' }}>{error}</p>
      </div>
    </div>
  );

  const delivStr = new Date(deal.deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const signedStr = deal.signedAt ? new Date(deal.signedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  const mobile = isMobile();

  return (
    <>
      <Helmet>
        <title>{`Proposal: ${deal.projectTitle} — ₹${deal.amount.toLocaleString('en-IN')}`}</title>
        <meta name="description" content={`${deal.freelancerName} sent you a project proposal. Amount: ₹${deal.amount.toLocaleString('en-IN')}. Delivery: ${delivStr}.`} />
        <meta property="og:title"       content={`📋 Proposal: ${deal.projectTitle}`} />
        <meta property="og:description" content={`From ${deal.freelancerName} · ₹${deal.amount.toLocaleString('en-IN')} · Due ${delivStr} · Tap to review & sign`} />
        <meta property="og:type"        content="website" />
      </Helmet>

      <div className="client-page">
        <div className="client-wrap fade-up">

          {/* Header */}
          <header className="deal-header-bar">
            <div className="logo"><div className="logo-mark">D</div><span className="logo-text">DealFlow</span></div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'var(--ink-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Proposal from</div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{deal.freelancerName}</div>
            </div>
          </header>

          {/* Deal card */}
          <div className="deal-card-main">
            <div className="deal-card-head">
              <div>
                <div className="deal-proj-label">Project Proposal</div>
                <h1 className="deal-proj-title">{deal.projectTitle}</h1>
                <p className="deal-proj-for">Prepared for <strong>{deal.clientName}</strong></p>
              </div>
              <div className="deal-amount">
                <div className="deal-amt-label">Total</div>
                <div className="deal-amt-val">₹{deal.amount.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <hr className="divider" />

            <div className="deal-desc-label">Scope of work</div>
            <p className="deal-desc-text">{deal.projectDescription}</p>

            <hr className="divider" />

            <div className="deal-terms">
              {[['Delivery by', delivStr], ['Revisions', `${deal.revisionsIncluded} included`], ['Payment', 'via UPI']].map(([l, v]) => (
                <div className="deal-term" key={l}>
                  <div className="deal-term-label">{l}</div>
                  <div className="deal-term-val">{v}</div>
                </div>
              ))}
            </div>

            {/* Signed indicator inline */}
            {deal.signatureData && (
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 20, height: 20, background: 'var(--green)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>✓</div>
                <span style={{ fontSize: 13, color: 'var(--green-dark)', fontWeight: 600 }}>Signed by {deal.clientName} · {signedStr}</span>
              </div>
            )}
          </div>

          {/* ── REVIEW step ── */}
          {step === 'review' && (
            <div className="step-card">
              <div className="step-label">Step 1 of 2</div>
              <h2 className="step-title">Review & sign</h2>
              <p className="step-sub" style={{ marginBottom: 16 }}>By proceeding you confirm you've read and agree to the scope, amount, and timeline above.</p>
              <button className="btn btn-primary btn-full btn-lg" onClick={() => setStep('sign')}>Proceed to sign →</button>
            </div>
          )}

          {/* ── SIGN step ── */}
          {step === 'sign' && (
            <div className="step-card">
              <div className="step-label">Step 1 of 2</div>
              <h2 className="step-title">Draw your signature</h2>
              <p className="step-sub">Use your finger or mouse. This becomes your digital signature on the agreement.</p>
              {signErr && <div className="alert alert-error" style={{ marginTop: 14 }}>{signErr}</div>}
              <div className="canvas-wrap">
                <canvas ref={canvasRef} width={640} height={180} style={{ display: 'block', width: '100%', touchAction: 'none' }}
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                  onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
                {isEmpty && <div className="canvas-hint">✍ Sign here</div>}
                <div className="canvas-line" />
              </div>
              <div className="sign-row">
                <button className="btn btn-ghost btn-sm" onClick={clearSig} disabled={isEmpty}>Clear</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSign} disabled={signing || isEmpty}>
                  {signing ? 'Confirming…' : 'Confirm signature →'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setStep('review')}>Back</button>
              </div>
            </div>
          )}

          {/* ── DONE step ── */}
          {step === 'done' && (
            <div className="step-card">
              <div className="signed-banner">
                <div className="signed-tick">✓</div>
                Agreement signed
              </div>

              <div className="step-label">Step 2 of 2</div>
              <h2 className="step-title">Complete payment</h2>
              <p className="step-sub">
                Pay <strong>₹{deal.amount.toLocaleString('en-IN')}</strong> to{' '}
                <span style={{ fontFamily: 'var(--mono)', color: 'var(--green-dark)', fontWeight: 600 }}>{deal.freelancerUpiId}</span>
              </p>

              {/* Mobile: UPI deep link */}
              {mobile && (
                <>
                  <button className="btn btn-green btn-full btn-lg" style={{ marginTop: 16 }} onClick={payUPI}>
                    💸 Pay ₹{deal.amount.toLocaleString('en-IN')} via UPI
                  </button>
                  <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 8 }}>
                    Opens Google Pay · PhonePe · Paytm · BHIM
                  </p>
                </>
              )}

              {/* Desktop: QR code */}
              {!mobile && deal.freelancerUpiQr && (
                <div className="qr-section">
                  <div className="qr-card">
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>Scan with any UPI app</div>
                    <img src={deal.freelancerUpiQr} alt="UPI QR" style={{ width: 190, height: 190, objectFit: 'contain', background: '#fff', padding: 8, borderRadius: 10, border: '1px solid var(--border)', margin: '0 auto' }} />
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, marginTop: 10, color: 'var(--ink)' }}>{deal.freelancerUpiId}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--mono)', letterSpacing: '-.02em', marginTop: 4 }}>₹{deal.amount.toLocaleString('en-IN')}</div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--ink-faint)', textAlign: 'center' }}>Open UPI app → Scan QR → Verify amount → Pay</p>
                </div>
              )}

              {/* Desktop: no QR fallback */}
              {!mobile && !deal.freelancerUpiQr && (
                <div className="no-qr-box" style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Pay to this UPI ID</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: 'var(--green-dark)' }}>{deal.freelancerUpiId}</div>
                  <button className="btn btn-outline btn-sm" style={{ marginTop: 10 }}
                    onClick={() => { navigator.clipboard.writeText(deal.freelancerUpiId); }}>
                    Copy UPI ID
                  </button>
                </div>
              )}

              {/* Download PDF */}
              <button className="btn btn-outline btn-full" style={{ marginTop: 16 }} onClick={downloadContract} disabled={downloading}>
                {downloading ? 'Generating PDF…' : '⬇ Download signed contract (PDF)'}
              </button>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '4px 0' }}>
            <div style={{ width: 18, height: 18, background: 'var(--ink)', color: '#fff', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800 }}>D</div>
            <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>Secure deal management · DealFlow</span>
          </div>

        </div>
      </div>
    </>
  );
}
