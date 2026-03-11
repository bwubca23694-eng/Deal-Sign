import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import generatePDF from '../utils/generatePDF';

const API = process.env.REACT_APP_API_URL || '/api';
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('df-token')}` });
const fmt   = n => Number(n).toLocaleString('en-IN');
const fmtD  = d => d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—';
const fmtDT = d => d ? new Date(d).toLocaleString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : null;

const STATUS_COLOR = { created:'var(--ink-faint)', viewed:'#E8971A', signed:'var(--teal-500)', paid:'var(--teal-600)', expired:'var(--red)' };
const STATUS_LABEL = { created:'Created', viewed:'Viewed', signed:'Signed', paid:'Paid', expired:'Expired' };

export default function DealDetail() {
  const { dealId } = useParams();
  const navigate   = useNavigate();
  const [deal, setDeal]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]       = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [saveErr,  setSaveErr]  = useState('');
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [extendDays, setExtendDays] = useState(30);
  const [extending,  setExtending]  = useState(false);
  const [markingPaid, setMarkingPaid] = useState(null); // dealId or milestoneId

  const FRONTEND = window.location.origin;

  useEffect(() => { fetchDeal(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDeal = async () => {
    try {
      const res = await axios.get(`${API}/deals/${dealId}/full`, { headers: authH() });
      setDeal(res.data);
      setEditForm(buildEditForm(res.data));
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to load deal');
    } finally { setLoading(false); }
  };

  const buildEditForm = d => ({
    clientName: d.clientName, clientEmail: d.clientEmail || '',
    projectTitle: d.projectTitle, projectDescription: d.projectDescription,
    deliveryDate: d.deliveryDate ? d.deliveryDate.slice(0,10) : '',
    revisionsIncluded: d.revisionsIncluded,
    paymentType: d.paymentType,
    amount: d.amount || '',
    expiresAt: d.expiresAt ? d.expiresAt.slice(0,10) : '',
    milestones: d.milestones?.map(m => ({
      _id: m._id, title: m.title, amount: m.amount,
      dueDate: m.dueDate ? m.dueDate.slice(0,10) : '',
      description: m.description || '',
    })) || [],
  });

  const setE = k => e => setEditForm(f => ({ ...f, [k]: e.target.value }));
  const setEM = (i, k) => e => setEditForm(f => {
    const ms = [...f.milestones]; ms[i] = { ...ms[i], [k]: e.target.value }; return { ...f, milestones: ms };
  });

  const saveEdit = async () => {
    setSaving(true); setSaveErr('');
    try {
      const payload = { ...editForm, amount: Number(editForm.amount) || null };
      if (editForm.paymentType === 'milestone') {
        payload.milestones = editForm.milestones.map(m => ({ ...m, amount: Number(m.amount) }));
      }
      const res = await axios.patch(`${API}/deals/${dealId}`, payload, { headers: authH() });
      setDeal(res.data); setEditing(false);
    } catch (e) { setSaveErr(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const markPaid = async (milestoneId = null) => {
    setMarkingPaid(milestoneId || 'deal');
    try {
      let res;
      if (milestoneId) {
        res = await axios.patch(`${API}/deals/${dealId}/milestones/${milestoneId}/paid`, {}, { headers: authH() });
      } else {
        res = await axios.patch(`${API}/deals/${dealId}/paid`, {}, { headers: authH() });
      }
      setDeal(res.data.deal);
    } catch (e) { alert(e.response?.data?.message || 'Failed to mark as paid'); }
    finally { setMarkingPaid(null); }
  };

  const extendExpiry = async () => {
    setExtending(true);
    try {
      const res = await axios.patch(`${API}/deals/${dealId}/extend`, { days: Number(extendDays) }, { headers: authH() });
      setDeal(res.data.deal);
    } catch (e) { alert(e.response?.data?.message || 'Failed to extend'); }
    finally { setExtending(false); }
  };

  const deleteDeal = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API}/deals/${dealId}`, { headers: authH() });
      navigate('/dashboard');
    } catch (e) { alert(e.response?.data?.message || 'Failed to delete'); setDeleting(false); }
  };

  const downloadPDF = useCallback(async () => {
    setPdfLoading(true);
    try { await generatePDF(deal); }
    catch (e) { alert('PDF generation failed: ' + e.message); }
    finally { setPdfLoading(false); }
  }, [deal]);

  const total = deal
    ? deal.paymentType === 'milestone'
      ? deal.milestones.reduce((s,m) => s+m.amount, 0)
      : (deal.amount || 0)
    : 0;

  if (loading) return <div style={{ padding:40, textAlign:'center', color:'var(--ink-muted)' }}>Loading…</div>;
  if (err)     return <div style={{ padding:40 }}><div className="alert alert-error">{err}</div></div>;
  if (!deal)   return null;

  const dealUrl    = `${FRONTEND}/deal/${deal.dealId}`;
  const isExpired  = deal.status === 'expired' || (deal.expiresAt && new Date() > new Date(deal.expiresAt) && !['signed','paid'].includes(deal.status));
  const canEdit    = deal.status === 'created';

  const TIMELINE = [
    { key:'created',  label:'Created',  date: deal.createdAt },
    { key:'viewed',   label:'Viewed',   date: deal.viewedAt  },
    { key:'signed',   label:'Signed',   date: deal.signedAt  },
    { key:'paid',     label:'Paid',     date: deal.paidAt    },
  ];
  const statusOrder = ['created','viewed','signed','paid'];
  const currentIdx  = statusOrder.indexOf(deal.status === 'expired' ? 'created' : deal.status);

  return (
    <div style={{ maxWidth:780, width:'100%' }}>
      {/* Back + actions */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24, flexWrap:'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>← Dashboard</button>
        <div style={{ flex:1 }} />
        {deal.status === 'signed' && (
          <button className="btn btn-outline btn-sm" onClick={downloadPDF} disabled={pdfLoading}>
            {pdfLoading ? 'Generating…' : '⬇ Contract PDF'}
          </button>
        )}
        {canEdit && !editing && (
          <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>✏ Edit</button>
        )}
        <button className="btn btn-ghost btn-sm" style={{ color:'var(--red)' }} onClick={() => setConfirmDel(true)}>Delete</button>
      </div>

      {/* Status banner */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:'20px 24px', marginBottom:20, boxShadow:'var(--shadow-sm)' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background: STATUS_COLOR[deal.status], display:'inline-block' }} />
              <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color: STATUS_COLOR[deal.status] }}>{STATUS_LABEL[deal.status]}</span>
              {isExpired && deal.status !== 'expired' && <span style={{ fontSize:11, color:'var(--red)', fontWeight:700 }}>EXPIRED</span>}
            </div>
            <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:'-.03em', color:'var(--ink)', marginBottom:4 }}>{deal.projectTitle}</h1>
            <p style={{ fontSize:14, color:'var(--ink-muted)' }}>For <strong>{deal.clientName}</strong>{deal.clientEmail ? ` · ${deal.clientEmail}` : ''}</p>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:22, fontWeight:800, color:'var(--teal-500)', fontFamily:'var(--mono)' }}>₹{fmt(total)}</div>
            <div style={{ fontSize:12, color:'var(--ink-faint)' }}>{deal.paymentType === 'milestone' ? `${deal.milestones.length} milestones` : 'Single payment'}</div>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ display:'flex', gap:0, marginTop:20, position:'relative' }}>
          {TIMELINE.map((t, i) => {
            const done = i <= currentIdx;
            return (
              <div key={t.key} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', position:'relative' }}>
                {i > 0 && <div style={{ position:'absolute', top:11, right:'50%', width:'100%', height:2, background: i <= currentIdx ? 'var(--teal-500)' : 'var(--border)', zIndex:0 }} />}
                <div style={{ width:24, height:24, borderRadius:'50%', background: done ? 'var(--teal-500)' : 'var(--surface2)', border:`2px solid ${done ? 'var(--teal-500)' : 'var(--border)'}`, display:'flex', alignItems:'center', justifyContent:'center', zIndex:1, position:'relative' }}>
                  {done && <span style={{ color:'#fff', fontSize:11, fontWeight:800 }}>✓</span>}
                </div>
                <div style={{ fontSize:10, fontWeight:700, color: done ? 'var(--teal-600)' : 'var(--ink-faint)', marginTop:5, textAlign:'center' }}>{t.label}</div>
                {t.date && <div style={{ fontSize:9, color:'var(--ink-faint)', textAlign:'center', marginTop:2 }}>{fmtDT(t.date)}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Deal link */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'12px 16px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:11, color:'var(--ink-faint)', fontWeight:600, flexShrink:0 }}>DEAL LINK</span>
        <span style={{ fontSize:12, fontFamily:'var(--mono)', color:'var(--ink-muted)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{dealUrl}</span>
        <button className="btn btn-outline btn-sm" onClick={() => { navigator.clipboard.writeText(dealUrl); }}>Copy</button>
        <a href={(() => {
          const isQP = deal.paymentType === 'quickpay';
          const total = deal.paymentType === 'milestone'
            ? deal.milestones.reduce((s,m) => s + m.amount, 0) : deal.amount;
          const txt = isQP
            ? `Hi, here's a payment request 👋\n\n*${deal.projectTitle}*\nAmount due: *₹${Number(total).toLocaleString('en-IN')}*\n\nTap to pay via UPI:\n${dealUrl}`
            : `Hi *${deal.clientName}* 👋\n\nI've sent you a project proposal — please review and sign.\n\n📋 *${deal.projectTitle}*\n💰 Amount: *₹${Number(total).toLocaleString('en-IN')}*\n\n${dealUrl}\n\n_Powered by DealFlow_`;
          return `https://wa.me/?text=${encodeURIComponent(txt)}`;
        })()} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">WA</a>
      </div>

      {/* Expiry / extend */}
      {(isExpired || deal.expiresAt) && !['signed','paid'].includes(deal.status) && (
        <div className={`alert ${isExpired ? 'alert-error' : 'alert-warning'}`} style={{ marginBottom:20 }}>
          <span>{isExpired ? '⛔ This proposal has expired.' : `⏰ Expires: ${fmtD(deal.expiresAt)}`}</span>
          <div style={{ display:'flex', gap:8, marginTop:8, alignItems:'center' }}>
            <input type="number" value={extendDays} onChange={e => setExtendDays(e.target.value)} min="1" max="365" style={{ width:70, padding:'4px 8px', fontSize:13 }} />
            <span style={{ fontSize:12, color:'var(--ink-muted)' }}>days</span>
            <button className="btn btn-outline btn-sm" onClick={extendExpiry} disabled={extending}>{extending ? '…' : 'Extend'}</button>
          </div>
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div style={{ background:'var(--surface)', border:'2px solid var(--teal-100)', borderRadius:16, padding:24, marginBottom:20 }}>
          <h3 style={{ fontSize:15, fontWeight:800, marginBottom:16, color:'var(--ink)' }}>Edit proposal</h3>
          {saveErr && <div className="alert alert-error" style={{ marginBottom:12 }}>{saveErr}</div>}
          <div className="field"><label>Client name</label><input value={editForm.clientName} onChange={setE('clientName')} /></div>
          <div className="field"><label>Client email</label><input value={editForm.clientEmail} onChange={setE('clientEmail')} /></div>
          <div className="field"><label>Project title</label><input value={editForm.projectTitle} onChange={setE('projectTitle')} /></div>
          <div className="field"><label>Description</label><textarea value={editForm.projectDescription} onChange={setE('projectDescription')} rows={4} /></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div className="field"><label>Delivery date</label><input type="date" value={editForm.deliveryDate} onChange={setE('deliveryDate')} /></div>
            <div className="field"><label>Revisions</label><input type="number" value={editForm.revisionsIncluded} onChange={setE('revisionsIncluded')} min="0" /></div>
          </div>
          <div className="field"><label>Expires on <span className="optional">optional</span></label><input type="date" value={editForm.expiresAt} onChange={setE('expiresAt')} /></div>
          {editForm.paymentType === 'single'
            ? <div className="field"><label>Amount (₹)</label><input type="number" value={editForm.amount} onChange={setE('amount')} /></div>
            : editForm.milestones.map((m, i) => (
                <div key={i} style={{ background:'var(--surface2)', borderRadius:10, padding:12, marginBottom:10 }}>
                  <div style={{ fontWeight:700, fontSize:12, color:'var(--ink-faint)', marginBottom:8 }}>Milestone {i+1}</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <div className="field" style={{ marginBottom:0 }}><label>Title</label><input value={m.title} onChange={setEM(i,'title')} /></div>
                    <div className="field" style={{ marginBottom:0 }}><label>Amount (₹)</label><input type="number" value={m.amount} onChange={setEM(i,'amount')} /></div>
                    <div className="field" style={{ marginBottom:0 }}><label>Due date</label><input type="date" value={m.dueDate} onChange={setEM(i,'dueDate')} /></div>
                    <div className="field" style={{ marginBottom:0 }}><label>Note</label><input value={m.description} onChange={setEM(i,'description')} /></div>
                  </div>
                </div>
              ))
          }
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <button className="btn btn-teal" onClick={saveEdit} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
            <button className="btn btn-ghost" onClick={() => { setEditing(false); setSaveErr(''); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Project details */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:24, marginBottom:20, boxShadow:'var(--shadow-sm)' }}>
        <SL>Project details</SL>
        <p style={{ fontSize:14, color:'var(--ink-muted)', lineHeight:1.75, marginBottom:16, whiteSpace:'pre-wrap' }}>{deal.projectDescription}</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12 }}>
          {[['Delivery', fmtD(deal.deliveryDate)], ['Revisions', deal.revisionsIncluded], ['Expires', deal.expiresAt ? fmtD(deal.expiresAt) : 'Never']].map(([k,v]) => (
            <div key={k} style={{ background:'var(--surface2)', borderRadius:10, padding:12 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--ink-faint)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>{k}</div>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--ink)' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment / Milestones */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:24, marginBottom:20, boxShadow:'var(--shadow-sm)' }}>
        <SL>Payment</SL>
        {deal.paymentType === 'quickpay' ? (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--teal-600)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>⚡ Quick Pay</div>
                <div style={{ fontSize:24, fontWeight:800, color:'var(--teal-500)', fontFamily:'var(--mono)' }}>₹{fmt(deal.amount)}</div>
                {deal.quickPayNote && <div style={{ fontSize:13, color:'var(--ink-muted)', marginTop:4 }}>{deal.quickPayNote}</div>}
                <div style={{ fontSize:12, color:'var(--ink-muted)', marginTop:4 }}>UPI: {deal.freelancerUpiId}</div>
              </div>
              <div>
                {deal.status !== 'paid' && (
                  <button className="btn btn-teal" onClick={() => markPaid()} disabled={markingPaid === 'deal'}>
                    {markingPaid === 'deal' ? 'Marking…' : '✓ Mark as paid'}
                  </button>
                )}
                {deal.status === 'paid' && <span style={{ fontSize:13, fontWeight:700, color:'var(--teal-600)' }}>✓ Paid {fmtDT(deal.paidAt)}</span>}
              </div>
            </div>
          </div>
        ) : deal.paymentType === 'milestone' ? (
          <>
            {deal.milestones.map((m, i) => (
              <div key={m._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--border)', gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:'var(--ink)' }}>Milestone {i+1}: {m.title}</div>
                  <div style={{ fontSize:12, color:'var(--ink-muted)' }}>Due: {fmtD(m.dueDate)}{m.description ? ' · ' + m.description : ''}</div>
                  {m.paidAt && <div style={{ fontSize:11, color:'var(--teal-600)', fontWeight:700, marginTop:2 }}>✓ Paid {fmtDT(m.paidAt)}</div>}
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:16, fontWeight:800, color: m.status==='paid' ? 'var(--teal-500)' : 'var(--ink)', fontFamily:'var(--mono)' }}>₹{fmt(m.amount)}</div>
                  {m.status === 'pending' && deal.status === 'signed' && (
                    <button className="btn btn-outline btn-sm" style={{ marginTop:6 }}
                      onClick={() => markPaid(m._id)}
                      disabled={markingPaid === m._id}>
                      {markingPaid === m._id ? '…' : 'Mark paid'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'flex-end', paddingTop:12 }}>
              <span style={{ fontSize:16, fontWeight:800, color:'var(--teal-500)', fontFamily:'var(--mono)' }}>Total: ₹{fmt(total)}</span>
            </div>
          </>
        ) : (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ fontSize:24, fontWeight:800, color:'var(--teal-500)', fontFamily:'var(--mono)' }}>₹{fmt(deal.amount)}</div>
              <div style={{ fontSize:13, color:'var(--ink-muted)' }}>UPI: {deal.freelancerUpiId}</div>
            </div>
            {deal.status === 'signed' && (
              <button className="btn btn-teal" onClick={() => markPaid()} disabled={markingPaid === 'deal'}>
                {markingPaid === 'deal' ? 'Marking…' : '✓ Mark as paid'}
              </button>
            )}
            {deal.status === 'paid' && (
              <span style={{ fontSize:13, fontWeight:700, color:'var(--teal-600)' }}>✓ Paid {fmtDT(deal.paidAt)}</span>
            )}
          </div>
        )}
      </div>

      {/* Signature block */}
      {deal.signatureData && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:24, marginBottom:20, boxShadow:'var(--shadow-sm)' }}>
          <SL>Client signature</SL>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div>
              <div style={{ fontSize:11, color:'var(--ink-faint)', fontWeight:600, marginBottom:8 }}>YOUR SIGNATURE</div>
              <div style={{ background:'var(--surface2)', borderRadius:10, padding:12, minHeight:60, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {deal.freelancerSignature
                  ? <img src={deal.freelancerSignature} alt="Your signature" style={{ maxHeight:50, maxWidth:'100%' }} />
                  : <span style={{ fontSize:12, color:'var(--ink-faint)' }}>Not uploaded — go to Settings</span>
                }
              </div>
            </div>
            <div>
              <div style={{ fontSize:11, color:'var(--ink-faint)', fontWeight:600, marginBottom:8 }}>CLIENT SIGNATURE</div>
              <div style={{ background:'var(--surface2)', borderRadius:10, padding:12 }}>
                <img src={deal.signatureData} alt="Client signature" style={{ maxHeight:60, maxWidth:'100%', display:'block' }} />
                <div style={{ fontSize:10, color:'var(--ink-faint)', marginTop:6 }}>{deal.clientName} · {fmtDT(deal.signedAt)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDel && (
        <div style={{ background:'var(--surface)', border:'2px solid var(--red)', borderRadius:16, padding:20, marginBottom:20 }}>
          <p style={{ fontSize:14, fontWeight:700, color:'var(--ink)', marginBottom:12 }}>Delete this deal permanently? This cannot be undone.</p>
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-ghost" style={{ background:'var(--red)', color:'#fff' }} onClick={deleteDeal} disabled={deleting}>{deleting ? 'Deleting…' : 'Yes, delete'}</button>
            <button className="btn btn-ghost" onClick={() => setConfirmDel(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SL({ children }) {
  return <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-faint)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:14 }}>{children}</div>;
}