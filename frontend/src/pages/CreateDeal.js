import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || '/api';

export default function CreateDeal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ clientName: '', projectTitle: '', projectDescription: '', amount: '', deliveryDate: '', revisionsIncluded: 1 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.upiId) { setError('Please set your UPI ID in Settings first.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await axios.post(`${API}/deals`, { ...form, amount: Number(form.amount), revisionsIncluded: Number(form.revisionsIncluded) });
      setSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create deal. Try again.');
    } finally { setLoading(false); }
  };

  if (success) {
    const link = `${window.location.origin}/deal/${success.dealId}`;
    const copy = () => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    return (
      <div style={s.successOuter}>
        <div style={s.successCard}>
          <div style={s.successIcon}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="13" fill="var(--teal-50)" stroke="var(--teal-200)" strokeWidth="1.5"/><path d="M8 14l4 4 8-8" stroke="var(--teal-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h2 style={s.successTitle}>Deal created!</h2>
          <p style={s.successSub}>Share this link with <strong>{success.clientName}</strong> — they can review, sign, and pay without signing up.</p>
          <div style={s.linkCard}>
            <span style={{ ...s.linkText, fontFamily: 'var(--mono)', fontSize: 13 }}>{link}</span>
            <button className="btn btn-teal btn-sm" onClick={copy} style={{ flexShrink: 0 }}>
              {copied ? '✓ Copied' : 'Copy link'}
            </button>
          </div>
          <div style={s.successActions}>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
            <button className="btn btn-outline" onClick={() => { setSuccess(null); setForm({ clientName: '', projectTitle: '', projectDescription: '', amount: '', deliveryDate: '', revisionsIncluded: 1 }); }}>
              + Create another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={s.pageHead}>
        <div>
          <button className="btn btn-ghost btn-sm" style={{ marginBottom: 8, padding: '4px 0', color: 'var(--ink-muted)' }} onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <h1 style={s.pageTitle}>New Deal</h1>
          <p style={s.pageSub}>Fill in the project details. A shareable link will be generated instantly.</p>
        </div>
      </div>

      {!user?.upiId && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><path d="M8 1L15 14H1L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 6v4M8 11.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <span>You haven't set a UPI ID yet. <span style={{ fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }} onClick={() => navigate('/profile')}>Go to Settings</span> to add it first.</span>
        </div>
      )}

      {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}

      <div style={s.formGrid}>
        <div style={s.formCard}>
          <form onSubmit={handleSubmit}>
            <h3 style={s.formSection}>Client & Project</h3>
            <div style={s.row}>
              <div className="field" style={{ flex: 1 }}>
                <label>Client name *</label>
                <input value={form.clientName} onChange={set('clientName')} placeholder="Rahul Sharma" required />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Project title *</label>
                <input value={form.projectTitle} onChange={set('projectTitle')} placeholder="E-commerce Redesign" required />
              </div>
            </div>
            <div className="field">
              <label>Project description *</label>
              <textarea value={form.projectDescription} onChange={set('projectDescription')} placeholder="Describe the scope of work, deliverables, and any specific requirements…" required style={{ minHeight: 110 }} />
            </div>

            <h3 style={{ ...s.formSection, marginTop: 28 }}>Terms</h3>
            <div style={s.row}>
              <div className="field" style={{ flex: 1 }}>
                <label>Amount (₹ INR) *</label>
                <input type="number" value={form.amount} onChange={set('amount')} placeholder="25000" min="1" required />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Delivery date *</label>
                <input type="date" value={form.deliveryDate} onChange={set('deliveryDate')} min={new Date().toISOString().split('T')[0]} required />
              </div>
              <div className="field" style={{ flex: '0 0 130px' }}>
                <label>Revisions</label>
                <input type="number" value={form.revisionsIncluded} onChange={set('revisionsIncluded')} min="0" max="20" />
              </div>
            </div>

            <div style={s.upiPreview}>
              <span style={s.upiLabel}>Payment goes to</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: user?.upiId ? 'var(--teal-600)' : 'var(--red-500)', fontWeight: 600 }}>
                {user?.upiId || 'No UPI ID set'}
              </span>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading || !user?.upiId} style={{ marginTop: 4 }}>
              {loading ? 'Creating deal…' : 'Create deal & generate link →'}
            </button>
          </form>
        </div>

        <div style={s.sidebar}>
          <div style={s.tipCard}>
            <div style={s.tipTitle}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--teal-500)' }}><circle cx="7" cy="7" r="6.25" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4.5v.5M7 6.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
              Tips for a great deal
            </div>
            <ul style={s.tipList}>
              {['Be specific in your description — fewer surprises = faster sign-off', 'Set a realistic delivery date to build trust', 'Include 2–3 revisions to avoid scope creep', 'Make sure your UPI ID is correct before sharing'].map((t, i) => (
                <li key={i} style={s.tipItem}><span style={s.tipBullet}>·</span>{t}</li>
              ))}
            </ul>
          </div>
          <div style={s.howCard}>
            <div style={s.tipTitle}>What happens next</div>
            {['Share the link with your client', 'Client reviews, then signs digitally', 'Client taps Pay and opens their UPI app', 'You confirm payment on your dashboard'].map((step, i) => (
              <div key={i} style={s.howStep}>
                <div style={s.howNum}>{i + 1}</div>
                <span style={s.howText}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  pageHead: { marginBottom: 28 },
  pageTitle: { fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--ink)' },
  pageSub: { fontSize: 14, color: 'var(--ink-muted)', marginTop: 3 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start' },
  formCard: { background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px', boxShadow: 'var(--shadow-xs)' },
  formSection: { fontSize: 12, fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' },
  row: { display: 'flex', gap: 14, flexWrap: 'wrap' },
  upiPreview: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--gray-25)', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 14px', marginBottom: 16 },
  upiLabel: { fontSize: 12, fontWeight: 600, color: 'var(--ink-faint)' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: 14 },
  tipCard: { background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px', boxShadow: 'var(--shadow-xs)' },
  tipTitle: { fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7, textTransform: 'uppercase', letterSpacing: '0.05em' },
  tipList: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 },
  tipItem: { display: 'flex', gap: 8, fontSize: 12.5, color: 'var(--ink-muted)', lineHeight: 1.55 },
  tipBullet: { color: 'var(--teal-500)', fontWeight: 700, marginTop: 1, flexShrink: 0 },
  howCard: { background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px', boxShadow: 'var(--shadow-xs)' },
  howStep: { display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  howNum: { width: 22, height: 22, background: 'var(--teal-50)', color: 'var(--teal-600)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 },
  howText: { fontSize: 12.5, color: 'var(--ink-muted)', paddingTop: 3, lineHeight: 1.55 },
  successOuter: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' },
  successCard: { background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 20, padding: '40px', maxWidth: 500, width: '100%', textAlign: 'center', boxShadow: 'var(--shadow-lg)' },
  successIcon: { display: 'flex', justifyContent: 'center', marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 },
  successSub: { fontSize: 14, color: 'var(--ink-muted)', marginBottom: 24, lineHeight: 1.65 },
  linkCard: { display: 'flex', alignItems: 'center', gap: 12, background: 'var(--gray-25)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', marginBottom: 24, textAlign: 'left', overflow: 'hidden' },
  linkText: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--ink-muted)' },
  successActions: { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' },
};
