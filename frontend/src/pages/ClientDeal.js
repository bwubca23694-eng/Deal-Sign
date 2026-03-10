import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API = process.env.REACT_APP_API_URL || '/api';

// Detect mobile
const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export default function ClientDeal() {
  const { dealId } = useParams();
  const [deal,     setDeal]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [step,     setStep]     = useState('review');
  const [signing,  setSigning]  = useState(false);
  const [signErr,  setSignErr]  = useState('');
  const [isEmpty,  setIsEmpty]  = useState(true);
  const [sharing,  setSharing]  = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showQr,   setShowQr]   = useState(false);

  const canvasRef  = useRef(null);
  const contractRef = useRef(null);
  const drawing    = useRef(false);
  const lastPos    = useRef(null);

  useEffect(() => {
    axios.get(`${API}/deals/${dealId}`)
      .then(res => {
        setDeal(res.data);
        if (res.data.status === 'signed' || res.data.status === 'paid') setStep('done');
      })
      .catch(() => setError('This proposal link is invalid or has expired.'))
      .finally(() => setLoading(false));
  }, [dealId]);

  // ── Canvas drawing ─────────────────────────────────────────────────
  const getPos = (e, c) => {
    const r = c.getBoundingClientRect();
    const t = e.touches?.[0] || e;
    return { x:(t.clientX-r.left)*(c.width/r.width), y:(t.clientY-r.top)*(c.height/r.height) };
  };
  const startDraw = e => { e.preventDefault(); drawing.current=true; lastPos.current=getPos(e,canvasRef.current); };
  const draw = e => {
    e.preventDefault();
    if (!drawing.current) return;
    const c=canvasRef.current, ctx=c.getContext('2d'), pos=getPos(e,c);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x,lastPos.current.y);
    ctx.lineTo(pos.x,pos.y);
    ctx.strokeStyle='var(--ink)'; ctx.lineWidth=2.2; ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.stroke();
    lastPos.current=pos; setIsEmpty(false);
  };
  const endDraw = e => { e?.preventDefault(); drawing.current=false; };
  const clearSig = () => {
    canvasRef.current.getContext('2d').clearRect(0,0,canvasRef.current.width,canvasRef.current.height);
    setIsEmpty(true);
  };

  // ── Sign ────────────────────────────────────────────────────────────
  const handleSign = async () => {
    if (isEmpty) { setSignErr('Please draw your signature to continue.'); return; }
    setSignErr(''); setSigning(true);
    try {
      const res = await axios.patch(`${API}/deals/${dealId}/sign`, { signatureData: canvasRef.current.toDataURL('image/png') });
      setDeal(res.data.deal); setStep('done');
    } catch (err) { setSignErr(err.response?.data?.message || 'Signing failed. Please try again.'); }
    finally { setSigning(false); }
  };

  // ── UPI Pay ─────────────────────────────────────────────────────────
  const payUPI = () => {
    const link = `upi://pay?pa=${encodeURIComponent(deal.freelancerUpiId)}&pn=${encodeURIComponent(deal.freelancerName)}&am=${deal.amount}&cu=INR&tn=${encodeURIComponent(deal.projectTitle.slice(0,50))}`;
    window.location.href = link;
  };

  // ── Share deal link ─────────────────────────────────────────────────
  const shareLink = async () => {
    const url  = window.location.href;
    const text = `Here's my proposal for "${deal.projectTitle}" — ₹${deal.amount.toLocaleString('en-IN')}. Review, sign and pay via UPI.`;
    if (navigator.share) {
      try {
        setSharing(true);
        await navigator.share({ title: `Proposal: ${deal.projectTitle}`, text, url });
      } catch {} finally { setSharing(false); }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  // ── Download signed contract as PDF ────────────────────────────────
  const downloadContract = useCallback(async () => {
    if (!contractRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(contractRef.current, {
        scale: 2, useCORS: true, backgroundColor: '#ffffff',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`DealFlow-Contract-${deal.dealId}.pdf`);
    } catch (err) {
      alert('PDF generation failed. Please try again.');
    } finally { setDownloading(false); }
  }, [deal]);

  // ── Render states ────────────────────────────────────────────────────
  if (loading) return (
    <div style={p.page}><div className="loader"><div className="spinner"/></div></div>
  );
  if (error) return (
    <div style={p.page}>
      <div style={p.errBox}>
        <div style={p.errIcon}>✕</div>
        <h2 style={p.errTitle}>Proposal not found</h2>
        <p style={p.errSub}>{error}</p>
      </div>
    </div>
  );

  const delivStr = new Date(deal.deliveryDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
  const signedStr = deal.signedAt ? new Date(deal.signedAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '';
  const shareUrl = window.location.href;

  const mobile = isMobile();

  return (
    <>
      {/* Dynamic OG / WhatsApp meta tags */}
      <Helmet>
        <title>{`Proposal: ${deal.projectTitle} — ₹${deal.amount.toLocaleString('en-IN')}`}</title>
        <meta name="description" content={`${deal.freelancerName} sent you a project proposal for "${deal.projectTitle}". Amount: ₹${deal.amount.toLocaleString('en-IN')}. Delivery: ${delivStr}. Review and sign online.`} />
        <meta property="og:title"       content={`📋 Proposal: ${deal.projectTitle}`} />
        <meta property="og:description" content={`From ${deal.freelancerName} · ₹${deal.amount.toLocaleString('en-IN')} · Due ${delivStr} · Click to review & sign`} />
        <meta property="og:type"        content="website" />
        <meta property="og:url"         content={shareUrl} />
        <meta property="og:image"       content={`${window.location.origin}/og-deal.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card"       content="summary_large_image" />
        <meta name="twitter:title"      content={`📋 Proposal: ${deal.projectTitle}`} />
        <meta name="twitter:description" content={`From ${deal.freelancerName} · ₹${deal.amount.toLocaleString('en-IN')}`} />
      </Helmet>

      <div style={p.page}>
        <div style={p.wrap} className="fade-up">

          {/* Header */}
          <header style={p.header}>
            <div style={p.headerLogo}><div style={p.logoMark}>D</div><span style={p.logoText}>DealFlow</span></div>
            <div style={p.headerRight}>
              <div style={p.sentLabel}>Proposal from</div>
              <div style={p.sentName}>{deal.freelancerName}</div>
            </div>
          </header>

          {/* ── Printable contract area ── */}
          <div ref={contractRef} style={{ background: '#ffffff', borderRadius: 16, overflow: 'hidden' }}>

            {/* Deal card */}
            <div style={p.dealCard}>
              <div style={p.dealHead}>
                <div>
                  <div style={p.dealLabel}>Project Proposal</div>
                  <h1 style={p.dealTitle}>{deal.projectTitle}</h1>
                  <p style={p.dealFor}>Prepared for <strong>{deal.clientName}</strong></p>
                </div>
                <div style={p.amtBlock}>
                  <div style={p.amtLabel}>Total</div>
                  <div style={p.amtVal}>₹{deal.amount.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <hr className="divider" />

              <div style={p.descWrap}>
                <div style={p.descLabel}>Scope of work</div>
                <p style={p.descText}>{deal.projectDescription}</p>
              </div>

              <hr className="divider" />

              <div style={p.termsRow}>
                {[['Delivery by', delivStr], ['Revisions', `${deal.revisionsIncluded} included`], ['Payment', 'UPI']].map(([l, v]) => (
                  <div key={l} style={p.term}>
                    <div style={p.termLabel}>{l}</div>
                    <div style={p.termVal}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Signature block — shown when signed */}
            {deal.signatureData && (
              <div style={p.sigBlock}>
                <div style={p.sigBlockLeft}>
                  <div style={p.sigLabel}>Client signature</div>
                  <img src={deal.signatureData} alt="Signature" style={p.sigImg} />
                  <div style={p.sigMeta}>{deal.clientName} · {signedStr}</div>
                </div>
                <div style={p.sigBlockRight}>
                  <div style={p.sigLabel}>Deal reference</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#666', marginTop: 4 }}>{deal.dealId}</div>
                  <div style={p.sigLabel2}>Issued by</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{deal.freelancerName}</div>
                </div>
              </div>
            )}
          </div>
          {/* ── End printable area ── */}

          {/* ── STEP: Review ── */}
          {step === 'review' && (
            <div style={p.stepCard}>
              <div style={p.stepNum}>Step 1 of 2</div>
              <h2 style={p.stepTitle}>Review & sign</h2>
              <p style={p.stepSub}>By proceeding, you confirm you've read and agree to the project scope, amount, and timeline above.</p>
              <button className="btn btn-primary btn-full btn-lg" style={{ marginTop: 8 }} onClick={() => setStep('sign')}>
                Proceed to sign →
              </button>
            </div>
          )}

          {/* ── STEP: Sign ── */}
          {step === 'sign' && (
            <div style={p.stepCard}>
              <div style={p.stepNum}>Step 1 of 2</div>
              <h2 style={p.stepTitle}>Draw your signature</h2>
              <p style={p.stepSub}>Use your finger or mouse to sign below. This is your digital signature on the agreement.</p>

              {signErr && <div className="alert alert-error">{signErr}</div>}

              <div style={p.canvasWrap}>
                <canvas
                  ref={canvasRef} width={640} height={180} style={p.canvas}
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                  onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
                />
                {isEmpty && <div style={p.canvasHint}>✍ Sign here</div>}
                <div style={p.canvasLine} />
              </div>

              <div style={p.signRow}>
                <button className="btn btn-ghost btn-sm" onClick={clearSig} disabled={isEmpty}>Clear</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSign} disabled={signing || isEmpty}>
                  {signing ? 'Confirming…' : 'Confirm signature →'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setStep('review')}>Back</button>
              </div>
            </div>
          )}

          {/* ── STEP: Done — Pay ── */}
          {step === 'done' && (
            <div style={p.stepCard}>
              <div style={p.signedBanner}>
                <span style={p.signedTick}>✓</span>
                Agreement signed
              </div>

              <div style={p.stepNum}>Step 2 of 2</div>
              <h2 style={p.stepTitle}>Complete payment</h2>
              <p style={p.stepSub}>
                Pay <strong>₹{deal.amount.toLocaleString('en-IN')}</strong> to{' '}
                <span style={{ fontFamily: 'var(--mono)', color: 'var(--teal-600)', fontWeight: 600 }}>{deal.freelancerUpiId}</span>
              </p>

              {/* Mobile: UPI deep link button */}
              {mobile && (
                <>
                  <button className="btn btn-teal btn-full btn-lg" onClick={payUPI} style={{ marginTop: 12 }}>
                    💸 Pay ₹{deal.amount.toLocaleString('en-IN')} via UPI
                  </button>
                  <p style={p.upiNote}>Opens Google Pay, PhonePe, Paytm, BHIM and all UPI apps</p>
                </>
              )}

              {/* Desktop: Show QR code */}
              {!mobile && deal.freelancerUpiQr && (
                <div style={p.qrSection}>
                  <div style={p.qrCard}>
                    <div style={p.qrLabel}>Scan to pay with any UPI app</div>
                    <img src={deal.freelancerUpiQr} alt="UPI QR Code" style={p.qrImg} />
                    <div style={p.qrUpiId}>{deal.freelancerUpiId}</div>
                    <div style={p.qrAmount}>₹{deal.amount.toLocaleString('en-IN')}</div>
                  </div>
                  <p style={p.qrNote}>Open any UPI app → Scan QR → Confirm the amount</p>
                </div>
              )}

              {/* Desktop with no QR: show UPI ID to copy */}
              {!mobile && !deal.freelancerUpiQr && (
                <div style={p.noQrBox}>
                  <div style={p.noQrLabel}>Pay to this UPI ID</div>
                  <div style={p.noQrId}>{deal.freelancerUpiId}</div>
                  <button className="btn btn-outline btn-sm" style={{ marginTop: 10 }}
                    onClick={() => { navigator.clipboard.writeText(deal.freelancerUpiId); }}>
                    Copy UPI ID
                  </button>
                </div>
              )}

              {/* Download contract */}
              <button
                className="btn btn-outline btn-full"
                style={{ marginTop: 16 }}
                onClick={downloadContract}
                disabled={downloading}
              >
                {downloading ? 'Generating PDF…' : '⬇ Download signed contract PDF'}
              </button>
            </div>
          )}

          {/* Footer */}
          <div style={p.foot}>
            <div style={p.footLogo}><div style={{ ...p.logoMark, width:18,height:18,fontSize:9,borderRadius:4 }}>D</div><span style={{ fontSize:12,fontWeight:700 }}>DealFlow</span></div>
            <span style={{ fontSize:12,color:'var(--ink-faint)' }}>Secure deal management for freelancers</span>
          </div>

        </div>
      </div>
    </>
  );
}

const p = {
  page:       { minHeight:'100vh', background:'var(--bg)', padding:'20px 16px 48px', display:'flex', justifyContent:'center' },
  wrap:       { width:'100%', maxWidth:600, display:'flex', flexDirection:'column', gap:14 },

  header:     { display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 18px', boxShadow:'var(--shadow-xs)' },
  headerLogo: { display:'flex', alignItems:'center', gap:8 },
  logoMark:   { width:26,height:26,background:'var(--ink)',color:'var(--bg)',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:13,flexShrink:0 },
  logoText:   { fontWeight:800,fontSize:15,letterSpacing:'-0.03em',color:'var(--ink)' },
  headerRight:{ textAlign:'right' },
  sentLabel:  { fontSize:10,color:'var(--ink-faint)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em' },
  sentName:   { fontSize:14,fontWeight:800,color:'var(--ink)' },

  dealCard:   { background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:'24px',boxShadow:'var(--shadow-sm)' },
  dealHead:   { display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16,flexWrap:'wrap',marginBottom:0 },
  dealLabel:  { fontSize:10,fontWeight:700,color:'var(--ink-faint)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:6 },
  dealTitle:  { fontSize:22,fontWeight:800,letterSpacing:'-0.03em',lineHeight:1.25,color:'var(--ink)',marginBottom:6 },
  dealFor:    { fontSize:13,color:'var(--ink-muted)' },
  amtBlock:   { textAlign:'right',flexShrink:0 },
  amtLabel:   { fontSize:10,fontWeight:700,color:'var(--ink-faint)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:4 },
  amtVal:     { fontSize:28,fontWeight:800,color:'var(--teal-500)',fontFamily:'var(--mono)',letterSpacing:'-0.03em' },

  descWrap:   {},
  descLabel:  { fontSize:10,fontWeight:700,color:'var(--ink-faint)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:8 },
  descText:   { fontSize:14,color:'var(--ink-muted)',lineHeight:1.75 },

  termsRow:   { display:'flex',gap:0 },
  term:       { flex:1,textAlign:'center',padding:'0 8px' },
  termLabel:  { fontSize:10,fontWeight:700,color:'var(--ink-faint)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:5 },
  termVal:    { fontSize:13.5,fontWeight:700,color:'var(--ink)' },

  sigBlock:   { background:'var(--surface)',borderTop:'1px solid var(--border)',padding:'20px 24px',display:'flex',justifyContent:'space-between',gap:20,flexWrap:'wrap' },
  sigBlockLeft:{ flex:1 },
  sigBlockRight:{ textAlign:'right' },
  sigLabel:   { fontSize:10,fontWeight:700,color:'#999',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6 },
  sigLabel2:  { fontSize:10,fontWeight:700,color:'#999',textTransform:'uppercase',letterSpacing:'.06em',marginTop:12,marginBottom:4 },
  sigImg:     { maxWidth:180,height:56,objectFit:'contain',background:'#f9f9f9',borderRadius:6,padding:4,border:'1px solid #eee' },
  sigMeta:    { fontSize:11,color:'#aaa',marginTop:4 },

  stepCard:   { background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:'24px',boxShadow:'var(--shadow-sm)' },
  stepNum:    { fontSize:11,fontWeight:700,color:'var(--teal-500)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:6 },
  stepTitle:  { fontSize:20,fontWeight:800,letterSpacing:'-0.025em',marginBottom:8 },
  stepSub:    { fontSize:14,color:'var(--ink-muted)',lineHeight:1.65,marginBottom:0 },

  canvasWrap: { position:'relative',background:'var(--bg)',border:'1.5px dashed var(--border-strong)',borderRadius:10,overflow:'hidden',margin:'16px 0',touchAction:'none',cursor:'crosshair' },
  canvas:     { display:'block',width:'100%',touchAction:'none' },
  canvasHint: { position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:600,color:'var(--ink-faint)',pointerEvents:'none',letterSpacing:'-.01em' },
  canvasLine: { position:'absolute',bottom:32,left:20,right:20,height:1,background:'var(--border)' },
  signRow:    { display:'flex',gap:10,alignItems:'center' },

  signedBanner:{ display:'flex',alignItems:'center',gap:10,background:'var(--teal-50)',border:'1px solid var(--teal-100)',borderRadius:10,padding:'12px 16px',marginBottom:20,fontSize:14,fontWeight:700,color:'var(--teal-600)' },
  signedTick: { width:22,height:22,background:'var(--teal-500)',color:'#fff',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,flexShrink:0 },

  upiNote:    { textAlign:'center',fontSize:11.5,color:'var(--ink-faint)',marginTop:10 },

  qrSection:  { marginTop:16,display:'flex',flexDirection:'column',alignItems:'center',gap:10 },
  qrCard:     { background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:14,padding:'20px 24px',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:10 },
  qrLabel:    { fontSize:12,fontWeight:700,color:'var(--ink-muted)',textTransform:'uppercase',letterSpacing:'.05em' },
  qrImg:      { width:200,height:200,objectFit:'contain',borderRadius:10,background:'#fff',padding:8,border:'1px solid var(--border)' },
  qrUpiId:    { fontFamily:'var(--mono)',fontSize:13,color:'var(--ink)',fontWeight:600 },
  qrAmount:   { fontSize:22,fontWeight:800,color:'var(--teal-500)',fontFamily:'var(--mono)',letterSpacing:'-0.02em' },
  qrNote:     { fontSize:12,color:'var(--ink-faint)',textAlign:'center' },

  noQrBox:    { background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:12,padding:'20px',textAlign:'center',marginTop:16 },
  noQrLabel:  { fontSize:11,fontWeight:700,color:'var(--ink-faint)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8 },
  noQrId:     { fontFamily:'var(--mono)',fontSize:16,fontWeight:700,color:'var(--teal-600)',letterSpacing:'-0.01em' },

  foot:       { display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'8px 0' },
  footLogo:   { display:'flex',alignItems:'center',gap:6 },

  errBox:     { textAlign:'center',padding:'60px 24px',margin:'auto' },
  errIcon:    { width:56,height:56,background:'var(--red-50)',color:'var(--red-500)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:800,margin:'0 auto 16px' },
  errTitle:   { fontSize:20,fontWeight:800,marginBottom:8 },
  errSub:     { fontSize:14,color:'var(--ink-muted)' },
};
