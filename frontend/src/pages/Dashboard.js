import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || '/api';

const statusOrder = ['created', 'viewed', 'signed', 'paid'];
const statusLabel = { created: 'Created', viewed: 'Viewed', signed: 'Signed', paid: 'Paid' };

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(null);
  const [confirming, setConfirming] = useState(null);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const res = await axios.get(`${API}/deals`);
      setDeals(res.data);
    } catch {
      setError('Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (dealId) => {
    const link = `${window.location.origin}/deal/${dealId}`;
    navigator.clipboard.writeText(link);
    setCopied(dealId);
    setTimeout(() => setCopied(null), 2000);
  };

  const confirmPayment = async (dealId) => {
    try {
      await axios.patch(`${API}/deals/${dealId}/paid`);
      setDeals(prev => prev.map(d => d.dealId === dealId ? { ...d, status: 'paid', paidAt: new Date() } : d));
      setConfirming(null);
    } catch {
      alert('Failed to confirm payment');
    }
  };

  const deleteDeal = async (dealId) => {
    if (!window.confirm('Delete this deal?')) return;
    try {
      await axios.delete(`${API}/deals/${dealId}`);
      setDeals(prev => prev.filter(d => d.dealId !== dealId));
    } catch {
      alert('Failed to delete deal');
    }
  };

  const stats = {
    total: deals.length,
    paid: deals.filter(d => d.status === 'paid').length,
    signed: deals.filter(d => d.status === 'signed').length,
    totalEarned: deals.filter(d => d.status === 'paid').reduce((s, d) => s + d.amount, 0),
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Dashboard</h1>
          <p style={styles.pageSubtitle}>Welcome back, {user?.name?.split(' ')[0]}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/create-deal')}>
          + New Deal
        </button>
      </div>

      {/* Stats row */}
      <div style={styles.statsGrid}>
        {[
          { label: 'Total Deals', value: stats.total },
          { label: 'Paid', value: stats.paid, accent: true },
          { label: 'Awaiting Payment', value: stats.signed },
          { label: 'Total Earned', value: `₹${stats.totalEarned.toLocaleString('en-IN')}`, accent: true },
        ].map(s => (
          <div key={s.label} style={styles.statCard}>
            <div style={{ ...styles.statValue, ...(s.accent ? { color: 'var(--accent)' } : {}) }}>
              {s.value}
            </div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* No UPI warning */}
      {!user?.upiId && (
        <div style={styles.upiWarning}>
          <span>⚠️ Set your UPI ID in <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => navigate('/profile')}>Settings</span> before creating deals</span>
        </div>
      )}

      {/* Deals list */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Your Deals</h2>

        {deals.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>◈</div>
            <p style={styles.emptyText}>No deals yet</p>
            <p style={styles.emptyHint}>Create your first deal and share it with a client</p>
            <button className="btn btn-primary" onClick={() => navigate('/create-deal')}>
              + Create Deal
            </button>
          </div>
        ) : (
          <div style={styles.dealList}>
            {deals.map(deal => (
              <div key={deal.dealId} style={styles.dealCard}>
                <div style={styles.dealTop}>
                  <div>
                    <div style={styles.dealTitle}>{deal.projectTitle}</div>
                    <div style={styles.dealClient}>Client: {deal.clientName}</div>
                  </div>
                  <div style={styles.dealRight}>
                    <div style={styles.dealAmount}>₹{deal.amount.toLocaleString('en-IN')}</div>
                    <span className={`badge badge-${deal.status}`}>
                      {statusLabel[deal.status]}
                    </span>
                  </div>
                </div>

                {/* Status progress */}
                <div style={styles.progress}>
                  {statusOrder.map((s, i) => (
                    <div key={s} style={styles.progressStep}>
                      <div style={{
                        ...styles.progressDot,
                        ...(statusOrder.indexOf(deal.status) >= i ? styles.progressDotActive : {})
                      }} />
                      <div style={styles.progressLabel}>{statusLabel[s]}</div>
                    </div>
                  ))}
                  <div style={styles.progressLine} />
                </div>

                <div style={styles.dealMeta}>
                  <span style={styles.metaItem}>📅 {new Date(deal.deliveryDate).toLocaleDateString('en-IN')}</span>
                  <span style={styles.metaItem}>🔄 {deal.revisionsIncluded} revision{deal.revisionsIncluded !== 1 ? 's' : ''}</span>
                  <span style={styles.metaItem}>🆔 <span className="mono">{deal.dealId}</span></span>
                </div>

                <div style={styles.dealActions}>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: 12, padding: '7px 14px' }}
                    onClick={() => copyLink(deal.dealId)}
                  >
                    {copied === deal.dealId ? '✓ Copied!' : '🔗 Copy Link'}
                  </button>

                  {deal.status === 'signed' && (
                    confirming === deal.dealId ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary" style={{ fontSize: 12, padding: '7px 14px' }} onClick={() => confirmPayment(deal.dealId)}>
                          Confirm ✓
                        </button>
                        <button className="btn btn-ghost" style={{ fontSize: 12, padding: '7px 14px' }} onClick={() => setConfirming(null)}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-primary" style={{ fontSize: 12, padding: '7px 14px' }} onClick={() => setConfirming(deal.dealId)}>
                        Mark as Paid
                      </button>
                    )
                  )}

                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: 12, padding: '7px 14px', marginLeft: 'auto', color: 'var(--accent2)', borderColor: 'rgba(255,107,107,0.3)' }}
                    onClick={() => deleteDeal(deal.dealId)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  pageHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 16,
    flexWrap: 'wrap',
  },
  pageTitle: { fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' },
  pageSubtitle: { color: 'var(--text-muted)', marginTop: 4 },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    background: 'var(--surface)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '20px',
  },
  statValue: { fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 },
  statLabel: { fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' },
  upiWarning: {
    background: 'rgba(255,193,7,0.08)',
    border: '1px solid rgba(255,193,7,0.25)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 16px',
    fontSize: 13,
    color: '#FFC107',
    marginBottom: 24,
  },
  section: {},
  sectionTitle: { fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 12 },
  dealList: { display: 'flex', flexDirection: 'column', gap: 16 },
  dealCard: {
    background: 'var(--surface)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '20px',
    transition: 'border-color 0.2s',
  },
  dealTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 16,
  },
  dealTitle: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  dealClient: { fontSize: 13, color: 'var(--text-muted)' },
  dealRight: { textAlign: 'right', flexShrink: 0 },
  dealAmount: { fontSize: 20, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.02em', marginBottom: 6 },
  progress: {
    display: 'flex',
    justifyContent: 'space-between',
    position: 'relative',
    marginBottom: 16,
    padding: '8px 0',
  },
  progressLine: {
    position: 'absolute',
    top: 14,
    left: '12.5%',
    right: '12.5%',
    height: '1.5px',
    background: 'var(--border)',
    zIndex: 0,
  },
  progressStep: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, zIndex: 1 },
  progressDot: {
    width: 10, height: 10,
    borderRadius: '50%',
    background: 'var(--border)',
    border: '2px solid var(--surface2)',
  },
  progressDotActive: { background: 'var(--accent)' },
  progressLabel: { fontSize: 10, color: 'var(--text-dim)', fontWeight: 600 },
  dealMeta: { display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 },
  metaItem: { fontSize: 12, color: 'var(--text-muted)' },
  dealActions: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  empty: {
    background: 'var(--surface)',
    border: '1.5px dashed var(--border)',
    borderRadius: 'var(--radius)',
    padding: '48px 24px',
    textAlign: 'center',
  },
  emptyIcon: { fontSize: 40, marginBottom: 16, color: 'var(--text-dim)' },
  emptyText: { fontSize: 18, fontWeight: 700, marginBottom: 8 },
  emptyHint: { color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 },
};
