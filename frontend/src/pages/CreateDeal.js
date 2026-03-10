import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API      = process.env.REACT_APP_API_URL || '/api';
const FRONTEND = window.location.origin;

export default function CreateDeal() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [form, setForm] = useState({
    clientName:'', projectTitle:'', projectDescription:'',
    amount:'', deliveryDate:'', revisionsIncluded:1,
  });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied,  setCopied]  = useState(false);
  const [sharing, setSharing] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!user?.upiId) { setError('Please set your UPI ID in Settings before creating a deal.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await axios.post(`${API}/deals`, {
        ...form, amount: Number(form.amount), revisionsIncluded: Number(form.revisionsIncluded),
      });
      setSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create deal. Please try again.');
    } finally { setLoading(false); }
  };

  const dealUrl = success ? `${FRONTEND}/deal/${success.dealId}` : '';

  const copyLink = async () => {
    await navigator.clipboard.writeText(dealUrl);
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };

  const shareLink = async () => {
    const text = `Here's my project proposal for "${success.projectTitle}" — ₹${Number(success.amount).toLocaleString('en-IN')}. Click to review and sign.`;
    if (navigator.share) {
      setSharing(true);
      try { await navigator.share({ title: `Proposal: ${success.projectTitle}`, text, url: dealUrl }); }
      catch {} finally { setSharing(false); }
    } else { copyLink(); }
  };

  const whatsappUrl = success
    ? `https://wa.me/?text=${encodeURIComponent(`📋 *Project Proposal*\n\n*${success.projectTitle}*\nAmount: ₹${Number(success.amount).toLocaleString('en-IN')}\n\nClick to review and sign:\n${dealUrl}`)}`
    : '';

  // ── Success state ───────────────────────────────────────
  if (success) return (
    <div style={{ maxWidth:900, width:'100%' }}>
      <div className="fade-up" style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:'40px 32px', maxWidth:520, width:'100%', display:'flex', flexDirection:'column', gap:20, boxShadow:'var(--shadow-lg)' }}>
        <div style={{ width:56, height:56, background:'var(--teal-50)', color:'var(--teal-500)', border:'2px solid var(--teal-100)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800 }}>✓</div>
        <div>
          <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:'-.03em', color:'var(--ink)', marginBottom:6 }}>Proposal created!</h1>
          <p style={{ fontSize:14, color:'var(--ink-muted)', lineHeight:1.65 }}>Share this link with <strong>{success.clientName}</strong> to review, sign, and pay.</p>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', overflow:'hidden' }}>
          <div style={{ fontSize:12, fontFamily:'var(--mono)', color:'var(--ink-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{dealUrl}</div>
          <button className="btn btn-outline btn-sm" onClick={copyLink} style={{ flexShrink:0 }}>{copied ? '✓ Copied' : 'Copy'}</button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <button className="btn btn-teal btn-full btn-lg" onClick={shareLink} disabled={sharing}>
            {sharing ? 'Opening…' : '↗ Share proposal'}
          </button>
          <a href={whatsappUrl} target="_blank" rel="noreferrer"
            className="btn btn-outline btn-full"
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/></svg>
            Share on WhatsApp
          </a>
        </div>

        <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12, padding:'16px', display:'flex', flexDirection:'column', gap:10 }}>
          {[['Project',success.projectTitle],['Client',success.clientName]].map(([k,v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:12, color:'var(--ink-faint)', fontWeight:600 }}>{k}</span>
              <span style={{ fontSize:13.5, fontWeight:700, color:'var(--ink)' }}>{v}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:12, color:'var(--ink-faint)', fontWeight:600 }}>Amount</span>
            <span style={{ fontSize:15, fontWeight:800, color:'var(--teal-500)', fontFamily:'var(--mono)' }}>₹{Number(success.amount).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => { setSuccess(null); setForm({ clientName:'', projectTitle:'', projectDescription:'', amount:'', deliveryDate:'', revisionsIncluded:1 }); }}>
            + Create another
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>View all deals</button>
        </div>
      </div>
    </div>
  );

  // ── Create form ─────────────────────────────────────────
  return (
    <div style={{ maxWidth:900, width:'100%' }}>
      <div style={{ marginBottom:28 }}>
        <h1 className="page-title">New proposal</h1>
        <p className="page-sub">Fill in the details — your client will review, sign, and pay.</p>
      </div>

      {!user?.upiId && (
        <div className="alert alert-warning" style={{ marginBottom:20 }}>
          ⚠ You haven't set a UPI ID yet.{' '}
          <button onClick={() => navigate('/profile')} style={{ fontWeight:700, textDecoration:'underline', background:'none', border:'none', cursor:'pointer', color:'inherit' }}>
            Add it in Settings →
          </button>
        </div>
      )}

      <div className="cd-outer-grid" style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:24, alignItems:'start' }}>
        <form onSubmit={handleSubmit} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:28, boxShadow:'var(--shadow-sm)' }}>
          {error && <div className="alert alert-error">{error}</div>}

          <div style={{ marginBottom:4 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-faint)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:16 }}>Client &amp; project</div>
            <div className="field"><label>Client name</label><input value={form.clientName} onChange={set('clientName')} placeholder="Raj Mehta" required /></div>
            <div className="field"><label>Project title</label><input value={form.projectTitle} onChange={set('projectTitle')} placeholder="Mobile App Development" required /></div>
            <div className="field"><label>Scope of work</label><textarea value={form.projectDescription} onChange={set('projectDescription')} placeholder="Describe deliverables, what's included, what's not…" rows={4} required /></div>
          </div>

          <hr className="divider" />

          <div style={{ marginBottom:4 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-faint)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:16 }}>Terms</div>
            <div className="cd-two-col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div className="field"><label>Amount (₹)</label><input type="number" value={form.amount} onChange={set('amount')} placeholder="50000" min="1" required /></div>
              <div className="field"><label>Delivery date</label><input type="date" value={form.deliveryDate} onChange={set('deliveryDate')} required /></div>
            </div>
            <div className="field">
              <label>Revisions included <span className="optional">optional</span></label>
              <input type="number" value={form.revisionsIncluded} onChange={set('revisionsIncluded')} min="0" max="20" />
            </div>
          </div>

          <button type="submit" className="btn btn-teal btn-full btn-lg" disabled={loading} style={{ marginTop:8 }}>
            {loading ? 'Creating…' : 'Create proposal →'}
          </button>
        </form>

        <div className="cd-tips-panel" style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:22, boxShadow:'var(--shadow-sm)', display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--ink-faint)', textTransform:'uppercase', letterSpacing:'.07em' }}>Tips for getting signed fast</div>
          {[
            ['Be specific',      'List exact deliverables so clients know what to expect.'],
            ['Clear deadline',   'A firm date makes the project feel real.'],
            ['Price confidently','Your rate reflects your value — don\'t undersell.'],
            ['Send on WhatsApp', 'Clients sign faster when they can tap the link directly.'],
          ].map(([t,d]) => (
            <div key={t} style={{ borderLeft:'2px solid var(--border)', paddingLeft:12 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--ink)', marginBottom:3 }}>{t}</div>
              <div style={{ fontSize:12.5, color:'var(--ink-muted)', lineHeight:1.6 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
