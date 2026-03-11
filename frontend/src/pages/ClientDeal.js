import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import generatePDF from '../utils/generatePDF';

const API = process.env.REACT_APP_API_URL || '/api';
const fmt  = n => Number(n).toLocaleString('en-IN');
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : '—';

// Steps: 'review' → 'agreement' → 'sign' → 'done'

export default function ClientDeal() {
  const { dealId } = useParams();
  const [deal,      setDeal]      = useState(null);
  const [step,      setStep]      = useState('review');
  const [loading,   setLoading]   = useState(true);
  const [err,       setErr]       = useState('');
  const [signing,   setSigning]   = useState(false);
  const [signErr,   setSignErr]   = useState('');
  const [pdfLoading,setPdfLoading]= useState(false);
  const canvasRef   = useRef(null);
  const drawingRef  = useRef(false);
  const [showQR,    setShowQR]    = useState(false);
  // Detect desktop: UPI deep links don't work on desktop browsers
  const isDesktop = !(/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));

  useEffect(() => {
    axios.get(`${API}/deals/${dealId}`)
      .then(res => {
        setDeal(res.data);
        if (res.data.paymentType === 'quickpay') setStep('quickpay');
        else if (['signed','paid'].includes(res.data.status)) setStep('done');
      })
      .catch(e => setErr(e.response?.data?.message || 'This proposal link is invalid or has been removed.'))
      .finally(() => setLoading(false));
  }, [dealId]);

  // ── Canvas drawing ────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 'sign' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    ctx.strokeStyle = '#111118';
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';

    const pos = e => {
      const r = canvas.getBoundingClientRect();
      const t = e.touches?.[0] || e;
      return { x: (t.clientX - r.left) * (canvas.width / r.width), y: (t.clientY - r.top) * (canvas.height / r.height) };
    };
    const start = e => { e.preventDefault(); drawingRef.current = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
    const move  = e => { e.preventDefault(); if (!drawingRef.current) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
    const end   = e => { e.preventDefault(); drawingRef.current = false; };

    canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', move); canvas.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start, { passive:false }); canvas.addEventListener('touchmove', move, { passive:false }); canvas.addEventListener('touchend', end);
    return () => {
      canvas.removeEventListener('mousedown', start); canvas.removeEventListener('mousemove', move); canvas.removeEventListener('mouseup', end);
      canvas.removeEventListener('touchstart', start); canvas.removeEventListener('touchmove', move); canvas.removeEventListener('touchend', end);
    };
  }, [step]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setSignErr('');
  };

  const handleSign = async () => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const data   = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const isEmpty = !data.some((v, i) => i % 4 === 3 && v > 0);
    if (isEmpty) { setSignErr('Please draw your signature to continue.'); return; }

    setSigning(true); setSignErr('');
    try {
      const sigData = canvas.toDataURL('image/png');
      const res     = await axios.patch(`${API}/deals/${dealId}/sign`, { signatureData: sigData });
      setDeal(d => ({ ...d, ...res.data.deal, signatureData: sigData }));
      setStep('done');
    } catch (e) {
      setSignErr(e.response?.data?.message || 'Signing failed, please try again.');
    } finally { setSigning(false); }
  };

  const downloadPDF = useCallback(async () => {
    setPdfLoading(true);
    try { await generatePDF(deal); }
    catch (e) { alert('PDF generation failed: ' + e.message); }
    finally { setPdfLoading(false); }
  }, [deal]);

  const payUPI = () => {
    const total = deal.paymentType === 'milestone'
      ? deal.milestones.filter(m => m.status === 'pending').reduce((s,m) => s+m.amount, 0)
      : (deal.amount || 0);
    window.location.href = `upi://pay?pa=${encodeURIComponent(deal.freelancerUpiId)}&pn=${encodeURIComponent(deal.freelancerName)}&am=${total}&cu=INR&tn=${encodeURIComponent(deal.projectTitle.slice(0,50))}`;
  };

  // ── Total ─────────────────────────────────────────────────────────────
  const total = deal
    ? deal.paymentType === 'milestone'
      ? deal.milestones.reduce((s,m) => s+m.amount, 0)
      : (deal.amount || 0)
    : 0;

  const delivStr  = deal?.deliveryDate ? fmtD(deal.deliveryDate) : '';
  const signedStr = deal?.signedAt ? new Date(deal.signedAt).toLocaleString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '';

  if (loading) return <div style={pageWrap}><div style={{ textAlign:'center', padding:40, color:'var(--ink-muted)' }}>Loading proposal…</div></div>;
  if (err)     return <div style={pageWrap}><div style={card}><div style={{ fontSize:32, marginBottom:16 }}>❌</div><h2 style={{ color:'var(--ink)' }}>Proposal not found</h2><p style={{ color:'var(--ink-muted)' }}>{err}</p></div></div>;
  if (!deal)   return null;

  const isExpired = deal.status === 'expired';

  return (
    <div style={pageWrap}>
      <Helmet>
        <title>{deal.projectTitle} — DealFlow</title>
        <meta property="og:title" content={`${deal.projectTitle} — Proposal from ${deal.freelancerName}`} />
        <meta property="og:description" content={`₹${fmt(total)} · Due ${delivStr} · Tap to review & sign`} />
      </Helmet>

      {/* Header */}
      <div style={{ width:'100%', maxWidth:600, marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <div style={{ width:28, height:28, background:'var(--ink)', color:'#fff', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13 }}>D</div>
          <span style={{ fontWeight:800, fontSize:15, letterSpacing:'-.02em', color:'var(--ink)' }}>DealFlow</span>
        </div>
        <p style={{ fontSize:12, color:'var(--ink-faint)' }}>Digital freelancer agreement platform</p>
      </div>

      <div style={{ ...card, width:'100%', maxWidth:600 }}>
        {/* Deal header */}
        <div style={{ background:'var(--teal-500)', margin:'-28px -28px 24px', borderRadius:'16px 16px 0 0', padding:'24px 28px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.7)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>
            {deal.status === 'signed' || deal.status === 'paid' ? '✓ SIGNED AGREEMENT' : 'PROJECT PROPOSAL'}
          </div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', letterSpacing:'-.025em', marginBottom:6, lineHeight:1.2 }}>{deal.projectTitle}</h1>
          <p style={{ fontSize:13, color:'rgba(255,255,255,.8)' }}>From <strong>{deal.freelancerName}</strong> · For <strong>{deal.clientName}</strong></p>
        </div>

        {/* Key numbers — quickpay: only delivery/revisions if set; others: always show total + delivery + revisions */}
        {deal.paymentType === 'quickpay' ? (
          (deal.deliveryDate || deal.revisionsIncluded > 0) && (
            <div style={{ display:'grid', gridTemplateColumns:`repeat(${(deal.deliveryDate ? 1 : 0) + (deal.revisionsIncluded > 0 ? 1 : 0)},1fr)`, gap:12, marginBottom:20 }}>
              {deal.deliveryDate && <NumCard label="Delivery" val={delivStr} />}
              {deal.revisionsIncluded > 0 && <NumCard label="Revisions" val={deal.revisionsIncluded} />}
            </div>
          )
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${1 + (deal.deliveryDate ? 1 : 0) + (deal.revisionsIncluded > 0 ? 1 : 0)},1fr)`, gap:12, marginBottom:24 }}>
            <NumCard label="Total amount" val={`₹${fmt(total)}`} accent />
            {deal.deliveryDate && <NumCard label="Delivery" val={delivStr} />}
            {deal.revisionsIncluded > 0 && <NumCard label="Revisions" val={deal.revisionsIncluded} />}
          </div>
        )}

        {/* Expiry warning */}
        {isExpired && (
          <div className="alert alert-error" style={{ marginBottom:20 }}>⛔ This proposal has expired. Please ask {deal.freelancerName} to extend it.</div>
        )}

        {/* Signed banner */}
        {(deal.status === 'signed' || deal.status === 'paid') && deal.signatureData && (
          <div style={{ background:'var(--teal-50)', border:'1px solid var(--teal-100)', borderRadius:12, padding:'12px 16px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
            <img src={deal.signatureData} alt="Your signature" style={{ height:36, border:'1px solid var(--teal-100)', borderRadius:6, background:'#fff', padding:'2px 6px' }} />
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--teal-600)' }}>Signed by {deal.clientName}</div>
              <div style={{ fontSize:11, color:'var(--teal-500)' }}>{signedStr}</div>
            </div>
          </div>
        )}

        {/* ── STEP: review ─────────────────────────────────────────────── */}
        {step === 'review' && !isExpired && (
          <>
            {deal.projectDescription && (
              <div style={{ marginBottom:20 }}>
                <SL>Scope of work</SL>
                <p style={{ fontSize:14, color:'var(--ink-muted)', lineHeight:1.75, whiteSpace:'pre-wrap' }}>{deal.projectDescription}</p>
              </div>
            )}

            {deal.paymentType === 'milestone' ? (
              <div style={{ marginBottom:20 }}>
                <SL>Payment milestones</SL>
                {deal.milestones.map((m,i) => (
                  <div key={m._id||i} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)', alignItems:'center', gap:12 }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:13 }}>Milestone {i+1}: {m.title}</div>
                      <div style={{ fontSize:11, color:'var(--ink-muted)' }}>Due: {fmtD(m.dueDate)}{m.description ? ' · '+m.description : ''}</div>
                    </div>
                    <span style={{ fontWeight:800, fontSize:15, color:'var(--teal-500)', fontFamily:'var(--mono)', flexShrink:0 }}>₹{fmt(m.amount)}</span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'flex-end', paddingTop:12 }}>
                  <span style={{ fontWeight:800, fontSize:15, color:'var(--ink)', fontFamily:'var(--mono)' }}>Total: ₹{fmt(total)}</span>
                </div>
              </div>
            ) : (
              <div style={{ background:'var(--surface2)', borderRadius:12, padding:16, marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div><SL>Payment</SL><div style={{ fontSize:12, color:'var(--ink-muted)' }}>via UPI to {deal.freelancerName}</div></div>
                <span style={{ fontWeight:800, fontSize:22, color:'var(--teal-500)', fontFamily:'var(--mono)' }}>₹{fmt(deal.amount)}</span>
              </div>
            )}

            <div style={{ display:'flex', gap:10, marginTop:8 }}>
              <button className="btn btn-outline btn-full" onClick={() => setStep('agreement')}>
                📄 Read full agreement
              </button>
              <button className="btn btn-teal btn-full btn-lg" onClick={() => setStep('sign')}>
                Proceed to sign →
              </button>
            </div>
          </>
        )}

        {/* ── STEP: agreement ──────────────────────────────────────────── */}
        {step === 'agreement' && (
          <div>
            <h3 style={{ fontSize:16, fontWeight:800, marginBottom:16 }}>Full agreement</h3>
            <div style={{ background:'var(--surface2)', borderRadius:12, padding:20, fontSize:13, color:'var(--ink-muted)', lineHeight:1.8, marginBottom:20, maxHeight:480, overflowY:'auto' }}>
              <p><strong>SERVICE AGREEMENT</strong></p>
              <p><strong>1. PARTIES</strong><br/>
              Service Provider: {deal.freelancerName} (UPI: {deal.freelancerUpiId})<br/>
              Client: {deal.clientName}{deal.clientEmail ? ` (${deal.clientEmail})` : ''}</p>
              <p><strong>2. SCOPE OF WORK</strong><br/>
              Project: {deal.projectTitle}<br/>
              {deal.projectDescription && <>{deal.projectDescription}<br/></>}
              {deal.deliveryDate && <>Delivery date: {fmtD(deal.deliveryDate)}<br/></>}
              {deal.revisionsIncluded > 0 && <>Revisions included: {deal.revisionsIncluded}<br/></>}</p>
              {deal.paymentType === 'milestone' ? (
                <p><strong>3. PAYMENT — MILESTONES</strong><br/>
                Total: ₹{fmt(total)}<br/>
                {deal.milestones.map((m,i) => `Milestone ${i+1}: ${m.title} — ₹${fmt(m.amount)} due ${fmtD(m.dueDate)}${m.description?' ('+m.description+')':''}`).join('\n')}<br/>
                Payment via UPI to {deal.freelancerUpiId}.</p>
              ) : (
                <p><strong>3. PAYMENT</strong><br/>
                Amount: ₹{fmt(deal.amount)} (Indian Rupees, inclusive of all charges).<br/>
                Payment via UPI to {deal.freelancerUpiId}. Payment due upon completion.</p>
              )}
              <p><strong>4. INTELLECTUAL PROPERTY</strong><br/>
              Upon receipt of full payment, all intellectual property rights to the final deliverables shall transfer to the Client. The Service Provider retains the right to display the work in their portfolio unless otherwise agreed.</p>
              <p><strong>5. GENERAL TERMS</strong><br/>
              Both parties agree to communicate professionally and in good faith. Disputes shall first be resolved via mutual negotiation. This agreement is binding upon digital signature and constitutes the entire agreement between parties.</p>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-ghost" onClick={() => setStep('review')}>← Back</button>
              <button className="btn btn-teal btn-full btn-lg" onClick={() => setStep('sign')}>I agree — proceed to sign →</button>
            </div>
          </div>
        )}

        {/* ── STEP: sign ───────────────────────────────────────────────── */}
        {step === 'sign' && (
          <div>
            <div style={{ fontSize:12, color:'var(--ink-faint)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>Step 2 of 3</div>
            <h2 style={{ fontSize:18, fontWeight:800, marginBottom:6 }}>Sign here</h2>
            <p style={{ fontSize:13, color:'var(--ink-muted)', marginBottom:16, lineHeight:1.6 }}>
              Draw your signature below. By signing, you confirm you've read and agree to the proposal above.
            </p>
            <div style={{ position:'relative', marginBottom:12 }}>
              <canvas ref={canvasRef} width={520} height={160}
                style={{ width:'100%', height:160, border:'2px solid var(--border)', borderRadius:12, background:'#fafafa', cursor:'crosshair', touchAction:'none', display:'block' }} />
              <div style={{ position:'absolute', bottom:10, left:'50%', transform:'translateX(-50%)', fontSize:11, color:'var(--ink-faint)', pointerEvents:'none', whiteSpace:'nowrap' }}>Draw your signature here</div>
            </div>
            {signErr && <div className="alert alert-error" style={{ marginBottom:12 }}>{signErr}</div>}
            <div style={{ display:'flex', gap:10, marginBottom:20 }}>
              <button className="btn btn-ghost btn-sm" onClick={clearCanvas}>Clear</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setStep('review')}>← Back</button>
            </div>
            <button className="btn btn-teal btn-full btn-lg" onClick={handleSign} disabled={signing}>
              {signing ? 'Signing…' : '✍ Sign agreement →'}
            </button>
          </div>
        )}

        {/* ── STEP: quickpay ──────────────────────────────────────────── */}
        {step === 'quickpay' && (
          <div>
            {/* Quick Pay badge */}
            <div style={{ background:'var(--teal-50)', border:'1px solid var(--teal-100)', borderRadius:12, padding:'12px 16px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:18 }}>⚡</span>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--teal-700)' }}>Quick Pay</div>
                <div style={{ fontSize:12, color:'var(--teal-600)' }}>Tap the button below to pay instantly via UPI.</div>
              </div>
            </div>

            {/* From */}
            <div style={{ marginBottom:16 }}>
              <SL>From</SL>
              <div style={{ fontSize:15, fontWeight:700, color:'var(--ink)' }}>{deal.freelancerName}</div>
              <div style={{ fontSize:13, color:'var(--ink-muted)' }}>UPI: {deal.freelancerUpiId}</div>
            </div>

            {/* Note */}
            {deal.quickPayNote && (
              <div style={{ background:'var(--surface2)', borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
                <SL>Note</SL>
                <p style={{ fontSize:14, color:'var(--ink-muted)', lineHeight:1.65, margin:0 }}>{deal.quickPayNote}</p>
              </div>
            )}

            {/* Scope of work — only if filled */}
            {deal.projectDescription && (
              <div style={{ marginBottom:16 }}>
                <SL>Scope of work</SL>
                <p style={{ fontSize:14, color:'var(--ink-muted)', lineHeight:1.75, whiteSpace:'pre-wrap', margin:0 }}>{deal.projectDescription}</p>
              </div>
            )}

            {/* Amount */}
            <div style={{ background:'var(--teal-50)', border:'1px solid var(--teal-100)', borderRadius:14, padding:'20px', textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--teal-600)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>Amount due</div>
              <div style={{ fontSize:36, fontWeight:800, color:'var(--teal-500)', fontFamily:'var(--mono)' }}>₹{fmt(deal.amount)}</div>
            </div>

            {deal.status !== 'paid' ? (
              <>
                {/* Desktop: no UPI deep link — show QR toggle */}
                {isDesktop ? (
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:13, color:'var(--ink-muted)', marginBottom:12 }}>
                      Scan with Google Pay · PhonePe · Paytm · BHIM
                    </div>
                    {deal.freelancerUpiQr ? (
                      <img src={deal.freelancerUpiQr} alt="UPI QR"
                        style={{ width:180, height:180, objectFit:'contain', border:'1px solid var(--border)', borderRadius:14, padding:12, background:'#fff', display:'block', margin:'0 auto 12px' }} />
                    ) : null}
                    <div style={{ fontSize:13, color:'var(--ink-muted)' }}>
                      UPI ID: <strong style={{ fontFamily:'var(--mono)', color:'var(--ink)' }}>{deal.freelancerUpiId}</strong>
                      <button onClick={() => navigator.clipboard.writeText(deal.freelancerUpiId)}
                        style={{ marginLeft:8, fontSize:11, color:'var(--teal-500)', background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>Copy</button>
                    </div>
                  </div>
                ) : (
                  /* Mobile: UPI deep link works */
                  <>
                    <button className="btn btn-teal btn-full btn-lg" style={{ marginBottom:10 }} onClick={payUPI}>
                      💸 Pay ₹{fmt(deal.amount)} via UPI →
                    </button>
                    <p style={{ fontSize:11, color:'var(--ink-faint)', textAlign:'center', marginBottom:16 }}>Opens Google Pay · PhonePe · Paytm · BHIM</p>
                    {deal.freelancerUpiQr && (
                      <div style={{ textAlign:'center' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowQR(v => !v)} style={{ marginBottom:10 }}>
                          {showQR ? 'Hide QR' : 'Or scan QR code instead'}
                        </button>
                        {showQR && (
                          <img src={deal.freelancerUpiQr} alt="UPI QR"
                            style={{ width:140, height:140, objectFit:'contain', border:'1px solid var(--border)', borderRadius:10, padding:8, display:'block', margin:'0 auto' }} />
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div style={{ background:'var(--teal-50)', border:'1px solid var(--teal-100)', borderRadius:12, padding:'16px', textAlign:'center' }}>
                <div style={{ fontSize:16, fontWeight:800, color:'var(--teal-600)' }}>✓ Payment confirmed</div>
                <div style={{ fontSize:12, color:'var(--teal-500)', marginTop:4 }}>Thank you. This payment has been received.</div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP: done ───────────────────────────────────────────────── */}
        {step === 'done' && (
          <div>
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{ width:56, height:56, background:'var(--teal-50)', border:'2px solid var(--teal-100)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:'var(--teal-500)', margin:'0 auto 12px' }}>✓</div>
              <h2 style={{ fontSize:20, fontWeight:800, color:'var(--ink)', marginBottom:6 }}>Agreement signed!</h2>
              <p style={{ fontSize:13, color:'var(--ink-muted)' }}>
                {deal.status === 'paid' ? 'Payment received. This deal is complete.' : 'Now pay to complete the deal.'}
              </p>
            </div>

            {deal.status !== 'paid' && (
              <>
                {deal.paymentType === 'milestone' ? (
                  <div style={{ marginBottom:20 }}>
                    <SL>Pay by milestone</SL>
                    {deal.milestones.map((m,i) => (
                      <div key={m._id||i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--border)', gap:12 }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13 }}>Milestone {i+1}: {m.title}</div>
                          <div style={{ fontSize:11, color:'var(--ink-muted)' }}>{fmtD(m.dueDate)}</div>
                          {m.status === 'paid' && <div style={{ fontSize:11, color:'var(--teal-600)', fontWeight:700 }}>✓ Paid</div>}
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <div style={{ fontWeight:800, fontSize:15, color: m.status==='paid' ? 'var(--teal-500)' : 'var(--ink)', fontFamily:'var(--mono)' }}>₹{fmt(m.amount)}</div>
                          {m.status === 'pending' && !isDesktop && (
                            <button className="btn btn-teal btn-sm" style={{ marginTop:6 }} onClick={() => {
                              window.location.href = `upi://pay?pa=${encodeURIComponent(deal.freelancerUpiId)}&pn=${encodeURIComponent(deal.freelancerName)}&am=${m.amount}&cu=INR&tn=${encodeURIComponent(m.title.slice(0,30))}`;
                            }}>Pay ₹{fmt(m.amount)} →</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ marginBottom:20 }}>
                    {isDesktop ? (
                      /* Desktop: show QR directly, no explanation */
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontSize:13, color:'var(--ink-muted)', marginBottom:12 }}>
                          Scan with Google Pay · PhonePe · Paytm · BHIM
                        </div>
                        {deal.freelancerUpiQr ? (
                          <img src={deal.freelancerUpiQr} alt="UPI QR"
                            style={{ width:180, height:180, objectFit:'contain', border:'1px solid var(--border)', borderRadius:14, padding:12, background:'#fff', display:'block', margin:'0 auto 12px' }} />
                        ) : null}
                        <div style={{ fontSize:13, color:'var(--ink-muted)' }}>
                          UPI ID: <strong style={{ fontFamily:'var(--mono)', color:'var(--ink)' }}>{deal.freelancerUpiId}</strong>
                          <button onClick={() => navigator.clipboard.writeText(deal.freelancerUpiId)}
                            style={{ marginLeft:8, fontSize:11, color:'var(--teal-500)', background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>Copy</button>
                        </div>
                      </div>
                    ) : (
                      /* Mobile: UPI deep link */
                      <>
                        <button className="btn btn-teal btn-full btn-lg" onClick={payUPI} style={{ marginBottom:10 }}>
                          💸 Pay ₹{fmt(deal.amount)} via UPI →
                        </button>
                        <p style={{ fontSize:11, color:'var(--ink-faint)', textAlign:'center' }}>Opens Google Pay · PhonePe · Paytm · BHIM</p>
                        {deal.freelancerUpiQr && (
                          <div style={{ textAlign:'center', marginTop:12 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowQR(v => !v)} style={{ marginBottom:10 }}>
                              {showQR ? 'Hide QR' : 'Or scan QR instead'}
                            </button>
                            {showQR && (
                              <img src={deal.freelancerUpiQr} alt="UPI QR"
                                style={{ width:140, height:140, objectFit:'contain', border:'1px solid var(--border)', borderRadius:10, padding:8, display:'block', margin:'0 auto' }} />
                            )}
                          </div>
                        )}
                        {!deal.freelancerUpiQr && (
                          <div style={{ textAlign:'center', marginTop:12, padding:'10px 16px', background:'var(--surface2)', borderRadius:10 }}>
                            <div style={{ fontSize:12, color:'var(--ink-muted)' }}>UPI ID: <strong style={{ fontFamily:'var(--mono)' }}>{deal.freelancerUpiId}</strong></div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Download PDF */}
            {deal.signatureData && (
              <button className="btn btn-outline btn-full" onClick={downloadPDF} disabled={pdfLoading}>
                {pdfLoading ? 'Generating PDF…' : '⬇ Download contract'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const pageWrap = { minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', padding:'32px 16px 60px' };
const card     = { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:'28px 28px 32px', boxShadow:'var(--shadow-lg)' };

function NumCard({ label, val, accent }) {
  return (
    <div style={{ background: accent ? 'var(--teal-50)' : 'var(--surface2)', border:`1px solid ${accent ? 'var(--teal-100)' : 'var(--border)'}`, borderRadius:10, padding:'12px', textAlign:'center' }}>
      <div style={{ fontSize:10, fontWeight:700, color: accent ? 'var(--teal-600)' : 'var(--ink-faint)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:15, fontWeight:800, color: accent ? 'var(--teal-500)' : 'var(--ink)', fontFamily: accent ? 'var(--mono)' : 'inherit' }}>{val}</div>
    </div>
  );
}

function SL({ children }) {
  return <div style={{ fontSize:10, fontWeight:700, color:'var(--ink-faint)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:10 }}>{children}</div>;
}