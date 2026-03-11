import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API      = process.env.REACT_APP_API_URL || '/api';
const FRONTEND = window.location.origin;

const EMPTY_FORM = {
  clientName:'', clientEmail:'', projectTitle:'', projectDescription:'',
  amount:'', deliveryDate:'', revisionsIncluded:1,
  paymentType:'single', expiresAt:'',
  milestones:[{ title:'Advance Payment', amount:'', dueDate:'', description:'' },
              { title:'Final Payment',   amount:'', dueDate:'', description:'' }],
  quickPayNote:'',
};

export default function CreateDeal() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [form, setForm]     = useState(EMPTY_FORM);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied,  setCopied]  = useState(false);
  const [sharing, setSharing] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [showTmpl, setShowTmpl]   = useState(false);
  const [savingTmpl, setSavingTmpl] = useState(false);
  const [tmplName,  setTmplName]    = useState('');
  const [showSaveTmpl, setShowSaveTmpl] = useState(false);

  // Load templates + check if navigated from template page with prefill
  useEffect(() => {
    axios.get(`${API}/templates`, { headers: authHeader() }).then(r => setTemplates(r.data)).catch(() => {});
    if (location.state?.prefill) {
      const p = location.state.prefill;
      setForm(f => ({ ...f, ...p }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('df-token')}` });
  const set  = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const setM = (i, k) => e => setForm(f => {
    const ms = [...f.milestones]; ms[i] = { ...ms[i], [k]: e.target.value }; return { ...f, milestones: ms };
  });
  const addMilestone    = () => setForm(f => ({ ...f, milestones: [...f.milestones, { title:'', amount:'', dueDate:'', description:'' }] }));
  const removeMilestone = i  => setForm(f => ({ ...f, milestones: f.milestones.filter((_, j) => j !== i) }));

  const loadTemplate = tmpl => {
    setForm(f => ({
      ...f,
      projectTitle:       tmpl.projectTitle,
      projectDescription: tmpl.projectDescription,
      revisionsIncluded:  tmpl.revisionsIncluded,
      paymentType:        tmpl.paymentType,
      amount:             tmpl.amount || '',
      milestones:         tmpl.milestones?.length
        ? tmpl.milestones.map(m => ({ title:m.title, amount:m.amount, dueDate:'', description:m.description||'' }))
        : EMPTY_FORM.milestones,
    }));
    setShowTmpl(false);
  };

  const saveTemplate = async () => {
    if (!tmplName.trim()) return;
    setSavingTmpl(true);
    try {
      await axios.post(`${API}/templates`, {
        name: tmplName,
        projectTitle:       form.projectTitle,
        projectDescription: form.projectDescription,
        revisionsIncluded:  form.revisionsIncluded,
        paymentType:        form.paymentType,
        amount:             form.paymentType === 'single' ? Number(form.amount) : null,
        milestones:         form.paymentType === 'milestone'
          ? form.milestones.map(m => ({ title:m.title, amount:Number(m.amount), description:m.description||'' }))
          : [],
      }, { headers: authHeader() });
      setShowSaveTmpl(false); setTmplName('');
      // Refresh templates list
      axios.get(`${API}/templates`, { headers: authHeader() }).then(r => setTemplates(r.data)).catch(() => {});
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save template');
    } finally { setSavingTmpl(false); }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!user?.upiId) { setError('Please set your UPI ID in Settings before creating a deal.'); return; }
    setError(''); setLoading(true);
    try {
      const isQP = form.paymentType === 'quickpay';
      const payload = {
        clientName:   form.clientName,
        clientEmail:  form.clientEmail,
        projectTitle: form.projectTitle,
        paymentType:  form.paymentType,
        expiresAt:    form.expiresAt || null,
      };
      if (!isQP) {
        payload.projectDescription = form.projectDescription;
        payload.deliveryDate       = form.deliveryDate;
        payload.revisionsIncluded  = Number(form.revisionsIncluded);
      } else {
        // quickpay: include optional fields only if filled
        if (form.projectDescription) payload.projectDescription = form.projectDescription;
        if (form.deliveryDate)       payload.deliveryDate       = form.deliveryDate;
        if (form.revisionsIncluded)  payload.revisionsIncluded  = Number(form.revisionsIncluded);
      }
      if (form.paymentType === 'milestone') {
        payload.milestones = form.milestones.map(m => ({ ...m, amount: Number(m.amount) }));
      } else {
        payload.amount = Number(form.amount);
      }
      if (isQP) payload.quickPayNote = form.quickPayNote || '';
      const res = await axios.post(`${API}/deals`, payload, { headers: authHeader() });
      setSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create deal. Please try again.');
    } finally { setLoading(false); }
  };

  const dealUrl = success ? `${FRONTEND}/deal/${success.dealId}` : '';
  const copyLink = async () => { await navigator.clipboard.writeText(dealUrl); setCopied(true); setTimeout(() => setCopied(false), 2500); };
  const shareLink = async () => {
    const text = `Here's my project proposal for "${success.projectTitle}" — click to review and sign.`;
    if (navigator.share) { setSharing(true); try { await navigator.share({ title:`Proposal: ${success.projectTitle}`, text, url:dealUrl }); } catch{} finally { setSharing(false); } }
    else copyLink();
  };
  const totalAmount = form.paymentType === 'milestone'
    ? form.milestones.reduce((s,m) => s + (Number(m.amount)||0), 0) : Number(form.amount)||0;

  // ── Success ──────────────────────────────────────────────────────────────
  if (success) {
    const total = success.paymentType === 'milestone'
      ? success.milestones.reduce((s,m) => s + m.amount, 0) : success.amount;
    const wa = `https://wa.me/?text=${encodeURIComponent(`📋 *Project Proposal*\n\n*${success.projectTitle}*\nAmount: ₹${Number(total).toLocaleString('en-IN')}\n\nClick to review and sign:\n${dealUrl}`)}`;
    return (
      <div style={{ maxWidth:520, width:'100%' }}>
        <div className="fade-up" style={card}>
          <div style={tick}>✓</div>
          <h1 style={{ fontSize:24, fontWeight:800, letterSpacing:'-.03em', color:'var(--ink)' }}>Proposal created!</h1>
          <p style={{ fontSize:14, color:'var(--ink-muted)', lineHeight:1.65, marginTop:-8 }}>
            Share this link with <strong>{success.clientName}</strong> to review, sign, and pay.
          </p>
          <div style={{ display:'flex', alignItems:'center', gap:10, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', overflow:'hidden' }}>
            <div style={{ fontSize:12, fontFamily:'var(--mono)', color:'var(--ink-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{dealUrl}</div>
            <button className="btn btn-outline btn-sm" onClick={copyLink} style={{ flexShrink:0 }}>{copied ? '✓ Copied' : 'Copy'}</button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <button className="btn btn-teal btn-full btn-lg" onClick={shareLink} disabled={sharing}>{sharing ? 'Opening…' : '↗ Share proposal'}</button>
            <a href={wa} target="_blank" rel="noreferrer" className="btn btn-outline btn-full" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/></svg>
              WhatsApp
            </a>
          </div>
          <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12, padding:16, display:'flex', flexDirection:'column', gap:10 }}>
            {[['Project',success.projectTitle],['Client',success.clientName]].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:12, color:'var(--ink-faint)', fontWeight:600 }}>{k}</span>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--ink)' }}>{v}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:12, color:'var(--ink-faint)', fontWeight:600 }}>Amount</span>
              <span style={{ fontSize:15, fontWeight:800, color:'var(--teal-500)', fontFamily:'var(--mono)' }}>₹{Number(total).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => { setSuccess(null); setForm(EMPTY_FORM); }}>+ Create another</button>
            <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth:720, width:'100%' }}>
      <div style={{ marginBottom:24, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
        <div>
          <h1 className="page-title">New proposal</h1>
          <p className="page-sub">Fill in details — your client will review, sign, and pay.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => setShowTmpl(v => !v)}>
          📄 Load template {templates.length > 0 ? `(${templates.length})` : ''}
        </button>
      </div>

      {/* Template picker */}
      {showTmpl && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:16, marginBottom:20 }}>
          {templates.length === 0
            ? <p style={{ fontSize:13, color:'var(--ink-muted)', textAlign:'center', padding:'8px 0' }}>No templates yet. Create a deal and save it as a template.</p>
            : templates.map(t => (
                <div key={t._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13, color:'var(--ink)' }}>{t.name}</div>
                    <div style={{ fontSize:12, color:'var(--ink-muted)' }}>{t.projectTitle} · {t.paymentType === 'milestone' ? `${t.milestones.length} milestones` : `₹${Number(t.amount||0).toLocaleString('en-IN')}`}</div>
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={() => loadTemplate(t)}>Use</button>
                </div>
              ))
          }
        </div>
      )}

      {!user?.upiId && (
        <div className="alert alert-warning" style={{ marginBottom:20 }}>
          ⚠ No UPI ID set.{' '}
          <button onClick={() => navigate('/profile')} style={{ fontWeight:700, textDecoration:'underline', background:'none', border:'none', cursor:'pointer', color:'inherit' }}>Add it in Settings →</button>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:28, boxShadow:'var(--shadow-sm)', display:'flex', flexDirection:'column', gap:0 }}>
        {error && <div className="alert alert-error" style={{ marginBottom:20 }}>{error}</div>}

        <SectionTitle>Client</SectionTitle>
        <div className="cd-two-col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div className="field"><label>Client name *</label><input value={form.clientName} onChange={set('clientName')} placeholder="Raj Mehta" required /></div>
          <div className="field"><label>Client email <span className="optional">optional</span></label><input type="email" value={form.clientEmail} onChange={set('clientEmail')} placeholder="raj@email.com" /></div>
        </div>

        <hr className="divider" />
        <SectionTitle>Project</SectionTitle>
        <div className="field"><label>{form.paymentType === 'quickpay' ? 'Payment title *' : 'Project title *'}</label><input value={form.projectTitle} onChange={set('projectTitle')} placeholder={form.paymentType === 'quickpay' ? 'e.g. Logo design, Invoice #42' : 'Mobile App Development'} required /></div>
        <div className="field">
          <label>Scope of work {form.paymentType === 'quickpay' ? <span className="optional">optional</span> : '*'}</label>
          <textarea value={form.projectDescription} onChange={set('projectDescription')} placeholder="Describe deliverables, what's included, what's not…" rows={4} required={form.paymentType !== 'quickpay'} />
        </div>
        <div className="cd-two-col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div className="field">
            <label>Delivery date {form.paymentType === 'quickpay' ? <span className="optional">optional</span> : '*'}</label>
            <input type="date" value={form.deliveryDate} onChange={set('deliveryDate')} required={form.paymentType !== 'quickpay'} />
          </div>
          <div className="field"><label>Revisions <span className="optional">optional</span></label><input type="number" value={form.revisionsIncluded} onChange={set('revisionsIncluded')} min="0" max="20" /></div>
        </div>

        <hr className="divider" />
        <SectionTitle>Payment</SectionTitle>
        <div style={{ display:'flex', gap:10, marginBottom:16 }}>
          {[['single','Single payment'],['milestone','Milestones'],['quickpay','⚡ Quick Pay']].map(([v,l]) => (
            <button key={v} type="button"
              onClick={() => setForm(f => ({ ...f, paymentType:v }))}
              style={{ padding:'7px 16px', borderRadius:8, border:`2px solid ${form.paymentType===v ? 'var(--teal-500)' : 'var(--border)'}`, background: form.paymentType===v ? 'var(--teal-50)' : 'var(--surface2)', color: form.paymentType===v ? 'var(--teal-600)' : 'var(--ink-muted)', fontWeight:700, fontSize:13, cursor:'pointer' }}>
              {l}
            </button>
          ))}
        </div>

        {form.paymentType === 'quickpay' ? (
          <div>
            <div style={{ background:'var(--teal-50)', border:'1px solid var(--teal-100)', borderRadius:12, padding:'14px 16px', marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--teal-700)', marginBottom:4 }}>⚡ Quick Pay</div>
              <div style={{ fontSize:12, color:'var(--teal-600)', lineHeight:1.6 }}>No contract, no signature required. Client sees the amount and pays via UPI directly.</div>
            </div>
            <div className="field"><label>Amount (₹) *</label><input type="number" value={form.amount} onChange={set('amount')} placeholder="5000" min="1" required /></div>
            <div className="field"><label>Note to client <span className="optional">optional</span></label><input value={form.quickPayNote} onChange={set('quickPayNote')} placeholder="e.g. Logo design advance, Invoice #42" /></div>
          </div>
        ) : form.paymentType === 'single' ? (
          <div className="field"><label>Amount (₹) *</label><input type="number" value={form.amount} onChange={set('amount')} placeholder="50000" min="1" required /></div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {form.milestones.map((m, i) => (
              <div key={i} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12, padding:14, display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontWeight:700, fontSize:13, color:'var(--ink)' }}>Milestone {i + 1}</span>
                  {form.milestones.length > 2 && (
                    <button type="button" onClick={() => removeMilestone(i)} style={{ fontSize:11, color:'var(--ink-faint)', background:'none', border:'none', cursor:'pointer' }}>Remove</button>
                  )}
                </div>
                <div className="cd-two-col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div className="field" style={{ marginBottom:0 }}><label>Title *</label><input value={m.title} onChange={setM(i,'title')} placeholder="Advance Payment" required /></div>
                  <div className="field" style={{ marginBottom:0 }}><label>Amount (₹) *</label><input type="number" value={m.amount} onChange={setM(i,'amount')} placeholder="25000" min="1" required /></div>
                </div>
                <div className="cd-two-col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div className="field" style={{ marginBottom:0 }}><label>Due date *</label><input type="date" value={m.dueDate} onChange={setM(i,'dueDate')} required /></div>
                  <div className="field" style={{ marginBottom:0 }}><label>Note <span className="optional">optional</span></label><input value={m.description} onChange={setM(i,'description')} placeholder="Before work begins" /></div>
                </div>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addMilestone}>+ Add milestone</button>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--teal-500)' }}>Total: ₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}

        <hr className="divider" />
        <SectionTitle>Proposal expiry <span className="optional" style={{ textTransform:'none', fontWeight:400 }}>— client cannot sign after this date</span></SectionTitle>
        <div className="field"><label>Expires on <span className="optional">optional</span></label><input type="date" value={form.expiresAt} onChange={set('expiresAt')} /></div>

        <div style={{ display:'flex', gap:10, marginTop:8, flexWrap:'wrap' }}>
          <button type="submit" className="btn btn-teal btn-lg" style={{ flex:1 }} disabled={loading}>
            {loading ? 'Creating…' : 'Create proposal →'}
          </button>
          <button type="button" className="btn btn-outline btn-lg" onClick={() => setShowSaveTmpl(v => !v)}>Save as template</button>
        </div>

        {showSaveTmpl && (
          <div style={{ marginTop:12, display:'flex', gap:10 }}>
            <input value={tmplName} onChange={e => setTmplName(e.target.value)} placeholder="Template name e.g. Standard Web Dev" style={{ flex:1 }} />
            <button type="button" className="btn btn-outline btn-sm" onClick={saveTemplate} disabled={savingTmpl}>{savingTmpl ? 'Saving…' : 'Save'}</button>
          </div>
        )}
      </form>
    </div>
  );
}

const card = { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:'36px 28px', display:'flex', flexDirection:'column', gap:18, boxShadow:'var(--shadow-lg)' };
const tick = { width:52, height:52, background:'var(--teal-50)', color:'var(--teal-500)', border:'2px solid var(--teal-100)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800 };

function SectionTitle({ children }) {
  return <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-faint)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:14 }}>{children}</div>;
}