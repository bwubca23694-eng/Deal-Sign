import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || '/api';
const FRONTEND = process.env.REACT_APP_FRONTEND_URL || window.location.origin;

const FILTERS = ['all','created','viewed','signed','paid'];
const STATUS_LABEL = { created:'Created', viewed:'Viewed', signed:'Signed', paid:'Paid' };

function Badge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      <span className="badge-dot" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [deals,      setDeals]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('all');
  const [copied,     setCopied]     = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [deleting,   setDeleting]   = useState(null);
  const [sharing,    setSharing]    = useState(null);

  const fetchDeals = useCallback(async () => {
    try { const res = await axios.get(`${API}/deals`); setDeals(res.data); }
    catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  const copy = async (deal) => {
    await navigator.clipboard.writeText(`${FRONTEND}/deal/${deal.dealId}`);
    setCopied(deal.dealId); setTimeout(() => setCopied(null), 2000);
  };

  const share = async (deal) => {
    const url  = `${FRONTEND}/deal/${deal.dealId}`;
    const text = `📋 Project Proposal: ${deal.projectTitle}\nAmount: ₹${deal.amount.toLocaleString('en-IN')}\n\nReview and sign here:`;
    if (navigator.share) {
      setSharing(deal.dealId);
      try { await navigator.share({ title: `Proposal: ${deal.projectTitle}`, text, url }); }
      catch {} finally { setSharing(null); }
    } else { copy(deal); }
  };

  const markPaid = async (deal) => {
    try {
      await axios.patch(`${API}/deals/${deal.dealId}/paid`);
      setDeals(ds => ds.map(d => d.dealId === deal.dealId ? { ...d, status:'paid', paidAt: new Date() } : d));
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    setConfirming(null);
  };

  const deleteDeal = async (deal) => {
    setDeleting(deal.dealId);
    try {
      await axios.delete(`${API}/deals/${deal.dealId}`);
      setDeals(ds => ds.filter(d => d.dealId !== deal.dealId));
    } catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
    finally { setDeleting(null); }
  };

  const filtered = filter === 'all' ? deals : deals.filter(d => d.status === filter);
  const counts   = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'all' ? deals.length : deals.filter(d => d.status === f).length;
    return acc;
  }, {});
  const revenue  = deals.filter(d => d.status === 'paid').reduce((s,d) => s + d.amount, 0);
  const pending  = deals.filter(d => d.status === 'signed').reduce((s,d) => s + d.amount, 0);

  if (loading) return <div className="loader"><div className="spinner"/></div>;

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Dashboard</h1>
          <p style={s.sub}>Welcome back, {user?.name?.split(' ')[0]} 👋</p>
        </div>
        <button className="btn btn-teal" onClick={() => navigate('/create-deal')}>+ New deal</button>
      </div>

      {/* Stat cards */}
      <div style={s.stats}>
        {[
          { label:'Total revenue', val:`₹${revenue.toLocaleString('en-IN')}`, sub:`${counts.paid} paid` },
          { label:'Awaiting payment', val:`₹${pending.toLocaleString('en-IN')}`, sub:`${counts.signed} signed` },
          { label:'Total deals', val:counts.all, sub:`${counts.viewed} viewed by client` },
        ].map(({ label, val, sub }) => (
          <div key={label} style={s.statCard}>
            <div style={s.statLabel}>{label}</div>
            <div style={s.statVal}>{val}</div>
            <div style={s.statSub}>{sub}</div>
          </div>
        ))}
      </div>

      {!user?.upiId && (
        <div className="alert alert-warning">
          ⚠ Your UPI ID is not set. Clients won't be able to pay you.{' '}
          <button onClick={() => navigate('/profile')} style={{ fontWeight: 700, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            Add it now →
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div style={s.filterRow}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ ...s.filterBtn, ...(filter === f ? s.filterActive : {}) }}>
            {f === 'all' ? 'All' : STATUS_LABEL[f]}
            <span style={{ ...s.filterCount, ...(filter === f ? s.filterCountActive : {}) }}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Deal list */}
      {filtered.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>📋</div>
          <div style={s.emptyTitle}>{filter === 'all' ? 'No deals yet' : `No ${filter} deals`}</div>
          <div style={s.emptySub}>{filter === 'all' ? 'Create your first proposal and share it with a client.' : `Deals will appear here once they're ${filter}.`}</div>
          {filter === 'all' && <button className="btn btn-teal" onClick={() => navigate('/create-deal')} style={{ marginTop: 16 }}>+ Create first deal</button>}
        </div>
      ) : (
        <div style={s.list}>
          {filtered.map(deal => (
            <div key={deal.dealId} style={s.dealCard}>
              <div style={s.dealMain}>
                <div style={s.dealTop}>
                  <Badge status={deal.status} />
                  <span style={s.dealDate}>{new Date(deal.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
                </div>
                <div style={s.dealTitle}>{deal.projectTitle}</div>
                <div style={s.dealClient}>For {deal.clientName}</div>
              </div>
              <div style={s.dealRight}>
                <div style={s.dealAmt}>₹{deal.amount.toLocaleString('en-IN')}</div>
                <div style={s.dealActions}>
                  {/* Share */}
                  <button className="btn btn-ghost btn-sm" title="Share link"
                    onClick={() => share(deal)} disabled={sharing === deal.dealId}>
                    {sharing === deal.dealId ? '…' : '↗'}
                  </button>
                  {/* Copy */}
                  <button className="btn btn-ghost btn-sm" title="Copy link"
                    onClick={() => copy(deal)}>
                    {copied === deal.dealId ? '✓' : '🔗'}
                  </button>
                  {/* Mark paid */}
                  {deal.status === 'signed' && confirming !== deal.dealId && (
                    <button className="btn btn-outline btn-sm" onClick={() => setConfirming(deal.dealId)}>
                      Mark paid
                    </button>
                  )}
                  {confirming === deal.dealId && (
                    <>
                      <button className="btn btn-teal btn-sm" onClick={() => markPaid(deal)}>Confirm</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setConfirming(null)}>Cancel</button>
                    </>
                  )}
                  {/* Delete */}
                  <button className="btn btn-danger-ghost btn-sm" title="Delete"
                    onClick={() => deleteDeal(deal)} disabled={deleting === deal.dealId}>
                    {deleting === deal.dealId ? '…' : '×'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  page:       { maxWidth: 900, width: '100%' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  title:      { fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--ink)' },
  sub:        { fontSize: 14, color: 'var(--ink-muted)', marginTop: 4 },
  stats:      { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 },
  statCard:   { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', boxShadow: 'var(--shadow-xs)' },
  statLabel:  { fontSize: 11, fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 },
  statVal:    { fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--ink)', fontFamily: 'var(--mono)' },
  statSub:    { fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 4 },
  filterRow:  { display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' },
  filterBtn:  { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 13px', fontSize: 13, fontWeight: 600, color: 'var(--ink-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, transition: 'all .12s' },
  filterActive:{ background: 'var(--ink)', color: 'var(--bg)', border: '1px solid var(--ink)' },
  filterCount:{ background: 'var(--surface2)', color: 'var(--ink-faint)', borderRadius: 99, padding: '1px 7px', fontSize: 11, fontWeight: 700 },
  filterCountActive:{ background: 'rgba(255,255,255,.2)', color: 'inherit' },
  empty:      { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '48px 24px', textAlign: 'center', boxShadow: 'var(--shadow-xs)' },
  emptyIcon:  { fontSize: 36, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 6 },
  emptySub:   { fontSize: 13.5, color: 'var(--ink-muted)', lineHeight: 1.6, maxWidth: 360, margin: '0 auto' },
  list:       { display: 'flex', flexDirection: 'column', gap: 10 },
  dealCard:   { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, boxShadow: 'var(--shadow-xs)', transition: 'box-shadow .12s', flexWrap: 'wrap' },
  dealMain:   { flex: 1, minWidth: 0 },
  dealTop:    { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
  dealDate:   { fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--mono)' },
  dealTitle:  { fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  dealClient: { fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 },
  dealRight:  { display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, flexWrap: 'wrap' },
  dealAmt:    { fontSize: 16, fontWeight: 800, color: 'var(--teal-500)', fontFamily: 'var(--mono)', letterSpacing: '-0.02em' },
  dealActions:{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
};
