import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API  = process.env.REACT_APP_API_URL || '/api';
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('df-token')}` });

const LABEL = { created:'Created', viewed:'Viewed', signed:'Signed', paid:'Paid', expired:'Expired' };
const FILTERS = ['all','created','viewed','signed','paid','expired'];

function Badge({ status }) {
  return <span className={`badge badge-${status}`}><span className="badge-dot"/>{LABEL[status]}</span>;
}

function totalAmt(d) {
  if (d.paymentType === 'milestone') return d.milestones.reduce((s,m) => s+m.amount, 0);
  return d.amount || 0;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [deals,   setDeals]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
  const [search,  setSearch]  = useState('');
  const [sort,    setSort]    = useState('newest');
  const [confirming, setConfirming] = useState(null);

  useEffect(() => {
    axios.get(`${API}/deals`, { headers: authH() })
      .then(r => setDeals(r.data))
      .finally(() => setLoading(false));
  }, []);

  const markPaid = async d => {
    try {
      const res = await axios.patch(`${API}/deals/${d.dealId}/paid`, {}, { headers: authH() });
      setDeals(ds => ds.map(x => x.dealId === d.dealId ? res.data.deal : x));
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
    setConfirming(null);
  };

  const deleteDeal = async d => {
    try {
      await axios.delete(`${API}/deals/${d.dealId}`, { headers: authH() });
      setDeals(ds => ds.filter(x => x.dealId !== d.dealId));
    } catch (e) { alert(e.response?.data?.message || 'Failed to delete'); }
  };

  const filtered = useMemo(() => {
    let ds = filter === 'all' ? deals : deals.filter(d => d.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      ds = ds.filter(d => d.clientName?.toLowerCase().includes(q) || d.projectTitle?.toLowerCase().includes(q));
    }
    switch (sort) {
      case 'oldest':   return [...ds].sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'highest':  return [...ds].sort((a,b) => totalAmt(b) - totalAmt(a));
      case 'lowest':   return [...ds].sort((a,b) => totalAmt(a) - totalAmt(b));
      default:         return [...ds].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }, [deals, filter, search, sort]);

  const counts   = FILTERS.reduce((a,f) => ({ ...a, [f]: f==='all' ? deals.length : deals.filter(d=>d.status===f).length }), {});
  const revenue  = deals.filter(d=>d.status==='paid').reduce((s,d)=>s+totalAmt(d),0);
  const pending  = deals.filter(d=>d.status==='signed').reduce((s,d)=>s+totalAmt(d),0);

  const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '';

  return (
    <div style={{ maxWidth:900, width:'100%' }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:24, gap:12, flexWrap:'wrap' }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">All your deals in one place.</p>
        </div>
        <button className="btn btn-teal btn-sm" onClick={() => navigate('/create-deal')}>+ New deal</button>
      </div>

      {/* Stats */}
      <div className="dash-stats" style={{ marginBottom:24 }}>
        {[
          { label:'Total revenue',  val:`₹${revenue.toLocaleString('en-IN')}`, sub:`${counts.paid} paid deal${counts.paid!==1?'s':''}` },
          { label:'Awaiting payment',val:`₹${pending.toLocaleString('en-IN')}`,sub:`${counts.signed} signed deal${counts.signed!==1?'s':''}` },
          { label:'Active deals',   val:counts.all - counts.paid - counts.expired, sub:'Total proposals sent' },
        ].map(({ label, val, sub }) => (
          <div className="stat-card" key={label}>
            <div className="stat-label">{label}</div>
            <div className="stat-val">{val}</div>
            <div className="stat-sub">{sub}</div>
          </div>
        ))}
      </div>

      {/* Search + sort */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by client or project…"
          style={{ flex:1, minWidth:180 }}
        />
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', fontSize:13, color:'var(--ink)', background:'var(--surface)' }}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="highest">Highest amount</option>
          <option value="lowest">Lowest amount</option>
        </select>
      </div>

      {/* Filters */}
      <div className="filter-row" style={{ marginBottom:20 }}>
        {FILTERS.map(f => (
          <button key={f} className={`filter-btn${filter===f?' active':''}`} onClick={() => setFilter(f)}>
            {LABEL[f]||'All'}
            <span className="filter-count">{counts[f]}</span>
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign:'center', padding:40, color:'var(--ink-muted)' }}>Loading deals…</div>}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">{search ? '🔍' : '📋'}</div>
          <div className="empty-title">{search ? 'No results found' : filter==='all' ? 'No deals yet' : `No ${LABEL[filter]?.toLowerCase()} deals`}</div>
          <div className="empty-sub">{search ? `No deals match "${search}"` : filter==='all' ? 'Create your first proposal.' : `Deals appear here once they're ${LABEL[filter]?.toLowerCase()}.`}</div>
          {filter==='all' && !search && <button className="btn btn-teal" onClick={() => navigate('/create-deal')} style={{ marginTop:16 }}>+ Create first deal</button>}
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.map(d => {
          const amt   = totalAmt(d);
          const isMs  = d.paymentType === 'milestone';
          const paidMs = isMs ? d.milestones.filter(m => m.status==='paid').length : 0;
          return (
            <div key={d.dealId}
              onClick={() => navigate(`/deal-detail/${d.dealId}`)}
              style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'16px 20px', cursor:'pointer', transition:'box-shadow .15s,border-color .15s', boxShadow:'var(--shadow-sm)' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow='var(--shadow-md)'; e.currentTarget.style.borderColor='var(--teal-200,#a7f3d0)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow='var(--shadow-sm)'; e.currentTarget.style.borderColor='var(--border)'; }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                    <Badge status={d.status} />
                    {isMs && <span style={{ fontSize:11, color:'var(--ink-faint)', fontWeight:600 }}>MILESTONES {paidMs}/{d.milestones.length}</span>}
                  {d.paymentType === 'quickpay' && <span style={{ fontSize:11, color:'var(--teal-600)', fontWeight:700, background:'var(--teal-50)', padding:'1px 7px', borderRadius:5, border:'1px solid var(--teal-100)' }}>⚡ QUICK PAY</span>}
                  </div>
                  <div style={{ fontWeight:800, fontSize:15, color:'var(--ink)', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.projectTitle}</div>
                  <div style={{ fontSize:13, color:'var(--ink-muted)' }}>{d.clientName}{d.clientEmail ? ` · ${d.clientEmail}` : ''}</div>
                  <div style={{ fontSize:11, color:'var(--ink-faint)', marginTop:4 }}>
                    Created {fmtD(d.createdAt)}
                    {d.expiresAt && !['signed','paid'].includes(d.status) && ` · Expires ${fmtD(d.expiresAt)}`}
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:17, fontWeight:800, color:'var(--teal-500)', fontFamily:'var(--mono)' }}>₹{amt.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize:11, color:'var(--ink-faint)', marginTop:2 }}>{isMs ? 'milestone' : d.paymentType === 'quickpay' ? 'quick pay' : 'single'}</div>
                </div>
              </div>

              {/* Inline actions — stop propagation */}
              <div style={{ display:'flex', gap:8, marginTop:12, paddingTop:10, borderTop:'1px solid var(--border)' }}
                onClick={e => e.stopPropagation()}>
                {d.status==='signed' && d.paymentType==='single' && confirming!==d.dealId && (
                  <button className="btn btn-outline btn-sm" onClick={() => setConfirming(d.dealId)}>Mark paid</button>
                )}
                {d.status==='signed' && d.paymentType==='single' && confirming===d.dealId && (
                  <>
                    <button className="btn btn-teal btn-sm" onClick={() => markPaid(d)}>Confirm paid</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setConfirming(null)}>Cancel</button>
                  </>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/deal-detail/${d.dealId}`)}>View details →</button>
                <button className="btn btn-ghost btn-sm" style={{ marginLeft:'auto', color:'var(--ink-faint)' }}
                  onClick={e => { e.stopPropagation(); if (window.confirm('Delete this deal?')) deleteDeal(d); }}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}