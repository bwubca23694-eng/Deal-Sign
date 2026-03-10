import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API      = process.env.REACT_APP_API_URL || '/api';
const FRONTEND = window.location.origin;
const FILTERS  = ['all','created','viewed','signed','paid'];
const LABEL    = { created:'Created', viewed:'Viewed', signed:'Signed', paid:'Paid' };

function Badge({ status }) {
  return <span className={`badge badge-${status}`}><span className="badge-dot"/>{LABEL[status]}</span>;
}

export default function Dashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [deals,      setDeals]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('all');
  const [copied,     setCopied]     = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [deleting,   setDeleting]   = useState(null);
  const [sharing,    setSharing]    = useState(null);

  const fetch_ = useCallback(async () => {
    try { const r = await axios.get(`${API}/deals`); setDeals(r.data); }
    catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch_(); }, [fetch_]);

  const copy = async d => {
    await navigator.clipboard.writeText(`${FRONTEND}/deal/${d.dealId}`);
    setCopied(d.dealId); setTimeout(() => setCopied(null), 2000);
  };
  const share = async d => {
    const url = `${FRONTEND}/deal/${d.dealId}`;
    if (navigator.share) {
      setSharing(d.dealId);
      try { await navigator.share({ title: `Proposal: ${d.projectTitle}`, text: `Here's my proposal for "${d.projectTitle}" — ₹${d.amount.toLocaleString('en-IN')}`, url }); }
      catch {} finally { setSharing(null); }
    } else { copy(d); }
  };
  const markPaid = async d => {
    try { await axios.patch(`${API}/deals/${d.dealId}/paid`); setDeals(ds => ds.map(x => x.dealId === d.dealId ? { ...x, status:'paid' } : x)); }
    catch (e) { alert(e.response?.data?.message || 'Failed'); }
    setConfirming(null);
  };
  const del = async d => {
    setDeleting(d.dealId);
    try { await axios.delete(`${API}/deals/${d.dealId}`); setDeals(ds => ds.filter(x => x.dealId !== d.dealId)); }
    catch (e) { alert(e.response?.data?.message || 'Delete failed'); }
    finally { setDeleting(null); }
  };

  const counts   = FILTERS.reduce((a,f) => ({ ...a, [f]: f==='all' ? deals.length : deals.filter(d=>d.status===f).length }), {});
  const filtered = filter==='all' ? deals : deals.filter(d=>d.status===filter);
  const revenue  = deals.filter(d=>d.status==='paid').reduce((s,d)=>s+d.amount,0);
  const pending  = deals.filter(d=>d.status==='signed').reduce((s,d)=>s+d.amount,0);

  if (loading) return <div className="loader"><div className="spinner"/></div>;

  return (
    <div className="dash-page">
      <div className="dash-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Welcome back, {user?.name?.split(' ')[0]} 👋</p>
        </div>
        <button className="btn btn-green" onClick={() => navigate('/create-deal')}>+ New deal</button>
      </div>

      <div className="dash-stats">
        {[
          { label:'Total revenue',     val:`₹${revenue.toLocaleString('en-IN')}`, sub:`${counts.paid} paid deal${counts.paid!==1?'s':''}` },
          { label:'Awaiting payment',  val:`₹${pending.toLocaleString('en-IN')}`, sub:`${counts.signed} signed` },
          { label:'Total deals',       val:String(counts.all),                    sub:`${counts.viewed} viewed by client` },
        ].map(({ label, val, sub }) => (
          <div className="stat-card" key={label}>
            <div className="stat-label">{label}</div>
            <div className="stat-val">{val}</div>
            <div className="stat-sub">{sub}</div>
          </div>
        ))}
      </div>

      {!user?.upiId && (
        <div className="alert alert-warning">
          ⚠ Your UPI ID is not set — clients can't pay you.{' '}
          <button onClick={() => navigate('/profile')} style={{ fontWeight:700, textDecoration:'underline', background:'none', border:'none', cursor:'pointer', color:'inherit' }}>Add it now →</button>
        </div>
      )}

      <div className="filter-row">
        {FILTERS.map(f => (
          <button key={f} className={`filter-btn${filter===f?' active':''}`} onClick={() => setFilter(f)}>
            {f==='all'?'All':LABEL[f]}
            <span className="filter-count">{counts[f]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">{filter==='all'?'No deals yet':`No ${LABEL[filter]?.toLowerCase()} deals`}</div>
          <div className="empty-sub">{filter==='all'?'Create your first proposal and share it with a client.':  `Deals will appear here once they're ${filter}.`}</div>
          {filter==='all' && <button className="btn btn-green" onClick={()=>navigate('/create-deal')} style={{marginTop:16}}>+ Create first deal</button>}
        </div>
      ) : (
        <div className="deal-list">
          {filtered.map(d => (
            <div className="deal-card" key={d.dealId}>
              <div className="deal-main">
                <div className="deal-top">
                  <Badge status={d.status}/>
                  <span className="deal-date">{new Date(d.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                </div>
                <div className="deal-title">{d.projectTitle}</div>
                <div className="deal-client">For {d.clientName}</div>
              </div>
              <div className="deal-right">
                <div className="deal-amt">₹{d.amount.toLocaleString('en-IN')}</div>
                <div className="deal-actions">
                  <button className="btn btn-ghost btn-sm" title="Share" onClick={()=>share(d)} disabled={sharing===d.dealId}>{sharing===d.dealId?'…':'↗'}</button>
                  <button className="btn btn-ghost btn-sm" title="Copy link" onClick={()=>copy(d)}>{copied===d.dealId?'✓':'🔗'}</button>
                  {d.status==='signed' && confirming!==d.dealId && <button className="btn btn-outline btn-sm" onClick={()=>setConfirming(d.dealId)}>Mark paid</button>}
                  {confirming===d.dealId && <>
                    <button className="btn btn-green btn-sm" onClick={()=>markPaid(d)}>Confirm</button>
                    <button className="btn btn-ghost btn-sm" onClick={()=>setConfirming(null)}>Cancel</button>
                  </>}
                  <button className="btn btn-danger btn-sm" title="Delete" onClick={()=>del(d)} disabled={deleting===d.dealId}>{deleting===d.dealId?'…':'×'}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
