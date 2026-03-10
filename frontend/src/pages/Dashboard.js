import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || '/api';

const STATUS_META = {
  created: { label: 'Created',  color: 'var(--gray-400)',  bg: 'var(--gray-100)' },
  viewed:  { label: 'Viewed',   color: 'var(--blue-500)',  bg: 'var(--blue-50)'  },
  signed:  { label: 'Signed',   color: 'var(--amber-500)', bg: 'var(--amber-50)' },
  paid:    { label: 'Paid',     color: 'var(--teal-500)',  bg: 'var(--teal-50)'  },
};
const STATUS_ORDER = ['created', 'viewed', 'signed', 'paid'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchDeals = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/deals`);
      setDeals(res.data);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  const copyLink = (dealId) => {
    navigator.clipboard.writeText(`${window.location.origin}/deal/${dealId}`);
    setCopied(dealId);
    setTimeout(() => setCopied(null), 2000);
  };

  const confirmPayment = async (dealId) => {
    await axios.patch(`${API}/deals/${dealId}/paid`);
    setDeals(prev => prev.map(d => d.dealId === dealId ? { ...d, status: 'paid' } : d));
    setConfirming(null);
  };

  const deleteDeal = async (dealId) => {
    setDeleting(dealId);
    try {
      await axios.delete(`${API}/deals/${dealId}`);
      setDeals(prev => prev.filter(d => d.dealId !== dealId));
    } finally { setDeleting(null); }
  };

  const stats = {
    total: deals.length,
    signed: deals.filter(d => d.status === 'signed').length,
    paid: deals.filter(d => d.status === 'paid').length,
    earned: deals.filter(d => d.status === 'paid').reduce((s, d) => s + d.amount, 0),
    pending: deals.filter(d => d.status === 'signed').reduce((s, d) => s + d.amount, 0),
  };

  const filtered = filter === 'all' ? deals : deals.filter(d => d.status === filter);

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <div>
      {/* Page header */}
      <div style={s.pageHead}>
        <div>
          <h1 style={s.pageTitle}>Dashboard</h1>
          <p style={s.pageSub}>Good to see you, {user?.name?.split(' ')[0]}.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/create-deal')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          New Deal
        </button>
      </div>

      {/* UPI warning */}
      {!user?.upiId && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><path d="M8 1L15 14H1L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 6v4M8 11.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <span>Set your UPI ID in <span style={{ fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }} onClick={() => navigate('/profile')}>Settings</span> before creating deals so clients can pay you.</span>
        </div>
      )}

      {/* Stats */}
      <div style={s.statsGrid}>
        {[
          { label: 'Total deals', value: stats.total, mono: false },
          { label: 'Awaiting payment', value: stats.signed, sub: stats.pending > 0 ? `₹${stats.pending.toLocaleString('en-IN')} pending` : null },
          { label: 'Paid deals', value: stats.paid },
          { label: 'Total earned', value: `₹${stats.earned.toLocaleString('en-IN')}`, accent: true, mono: true },
        ].map((stat, i) => (
          <div key={i} style={s.statCard}>
            <div style={s.statLabel}>{stat.label}</div>
            <div style={{ ...s.statValue, ...(stat.accent ? { color: 'var(--teal-500)' } : {}), fontFamily: stat.mono ? 'var(--mono)' : 'var(--font)' }}>{stat.value}</div>
            {stat.sub && <div style={s.statSub}>{stat.sub}</div>}
          </div>
        ))}
      </div>

      {/* Deals section */}
      <div style={s.section}>
        <div style={s.sectionHead}>
          <h2 style={s.sectionTitle}>Your deals</h2>
          <div style={s.filterRow}>
            {['all', ...STATUS_ORDER].map(f => (
              <button key={f} style={{ ...s.filterBtn, ...(filter === f ? s.filterBtnActive : {}) }} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : STATUS_META[f].label}
                {f !== 'all' && <span style={s.filterCount}>{deals.filter(d => d.status === f).length}</span>}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyIllustration}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="8" y="6" width="32" height="36" rx="4" stroke="var(--gray-200)" strokeWidth="2"/><path d="M15 16h18M15 23h18M15 30h10" stroke="var(--gray-200)" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <p style={s.emptyTitle}>{filter === 'all' ? 'No deals yet' : `No ${STATUS_META[filter]?.label.toLowerCase()} deals`}</p>
            <p style={s.emptySub}>{filter === 'all' ? 'Create your first deal and share it with a client.' : 'Deals in this status will appear here.'}</p>
            {filter === 'all' && <button className="btn btn-primary btn-sm" onClick={() => navigate('/create-deal')}>Create your first deal</button>}
          </div>
        ) : (
          <div style={s.dealList}>
            {filtered.map(deal => {
              const meta = STATUS_META[deal.status];
              const isPendingConfirm = confirming === deal.dealId;
              return (
                <div key={deal.dealId} style={s.dealRow}>
                  <div style={s.dealLeft}>
                    <div style={s.dealTitleRow}>
                      <span style={s.dealTitle}>{deal.projectTitle}</span>
                      <span className="badge" style={{ background: meta.bg, color: meta.color }}>
                        <span className="badge-dot" style={{ background: meta.color }} />
                        {meta.label}
                      </span>
                    </div>
                    <div style={s.dealMeta}>
                      <span style={s.metaChip}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5.25" stroke="currentColor" strokeWidth="1.2"/><path d="M6 3.5v2.75L8 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                        {new Date(deal.deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span style={s.metaChip}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1.5 10.5C1.5 8.567 3.067 7 5 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M8 8v4M6 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                        {deal.clientName}
                      </span>
                      <span style={{ ...s.metaChip, fontFamily: 'var(--mono)', fontSize: 10.5 }}>{deal.dealId}</span>
                    </div>
                  </div>

                  <div style={s.dealRight}>
                    <div style={s.dealAmount}>₹{deal.amount.toLocaleString('en-IN')}</div>
                    <div style={s.dealActions}>
                      <button className="btn btn-outline btn-sm" onClick={() => copyLink(deal.dealId)} style={{ minWidth: 100 }}>
                        {copied === deal.dealId ? '✓ Copied' : '🔗 Copy link'}
                      </button>

                      {deal.status === 'signed' && (
                        isPendingConfirm ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-teal btn-sm" onClick={() => confirmPayment(deal.dealId)}>Confirm paid ✓</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setConfirming(null)}>Cancel</button>
                          </div>
                        ) : (
                          <button className="btn btn-teal btn-sm" onClick={() => setConfirming(deal.dealId)}>Mark as paid</button>
                        )
                      )}

                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--red-500)' }}
                        onClick={() => deleteDeal(deal.dealId)}
                        disabled={deleting === deal.dealId}
                      >
                        {deleting === deal.dealId ? '…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  pageHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' },
  pageTitle: { fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--ink)' },
  pageSub: { fontSize: 14, color: 'var(--ink-muted)', marginTop: 3 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 32 },
  statCard: { background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', boxShadow: 'var(--shadow-xs)' },
  statLabel: { fontSize: 11.5, fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 },
  statValue: { fontSize: 26, fontWeight: 800, letterSpacing: '-0.035em', color: 'var(--ink)', lineHeight: 1 },
  statSub: { fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 5, fontFamily: 'var(--mono)' },
  section: {},
  sectionHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' },
  filterRow: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  filterBtn: { background: 'transparent', border: '1px solid transparent', borderRadius: 7, padding: '5px 10px', fontSize: 12.5, fontWeight: 600, color: 'var(--ink-muted)', cursor: 'pointer', fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.1s' },
  filterBtnActive: { background: 'var(--white)', border: '1px solid var(--border)', color: 'var(--ink)', boxShadow: 'var(--shadow-xs)' },
  filterCount: { background: 'var(--gray-100)', color: 'var(--ink-faint)', borderRadius: 4, padding: '1px 5px', fontSize: 11, fontFamily: 'var(--mono)' },
  dealList: { display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-xs)' },
  dealRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', gap: 16, borderBottom: '1px solid var(--border)', transition: 'background 0.1s' },
  dealLeft: { flex: 1, minWidth: 0 },
  dealTitleRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7, flexWrap: 'wrap' },
  dealTitle: { fontSize: 14.5, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.015em' },
  dealMeta: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  metaChip: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--ink-faint)', fontWeight: 500 },
  dealRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 },
  dealAmount: { fontSize: 18, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.03em', fontFamily: 'var(--mono)' },
  dealActions: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' },
  empty: { background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 14, padding: '48px 24px', textAlign: 'center', boxShadow: 'var(--shadow-xs)' },
  emptyIllustration: { display: 'flex', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 },
  emptySub: { fontSize: 13.5, color: 'var(--ink-muted)', marginBottom: 20, lineHeight: 1.6 },
};
