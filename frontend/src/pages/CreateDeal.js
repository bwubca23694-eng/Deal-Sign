import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || '/api';

export default function CreateDeal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    clientName: '',
    projectTitle: '',
    projectDescription: '',
    amount: '',
    deliveryDate: '',
    revisionsIncluded: 1,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.upiId) {
      setError('Please set your UPI ID in Settings before creating a deal');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/deals`, {
        ...form,
        amount: Number(form.amount),
        revisionsIncluded: Number(form.revisionsIncluded),
      });
      setSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create deal');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/deal/${success.dealId}`;
    navigator.clipboard.writeText(link);
  };

  if (success) {
    const link = `${window.location.origin}/deal/${success.dealId}`;
    return (
      <div style={styles.successWrap} className="page-enter">
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.successTitle}>Deal Created!</h2>
          <p style={styles.successSub}>Share this link with <strong>{success.clientName}</strong></p>

          <div style={styles.linkBox}>
            <span style={styles.linkText} className="mono">{link}</span>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={copyLink}>
              📋 Copy Link
            </button>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
          </div>

          <button
            className="btn btn-ghost btn-full"
            style={{ marginTop: 12 }}
            onClick={() => { setSuccess(null); setForm({ clientName: '', projectTitle: '', projectDescription: '', amount: '', deliveryDate: '', revisionsIncluded: 1 }); }}
          >
            + Create Another Deal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>New Deal</h1>
          <p style={styles.pageSubtitle}>Fill in the project details for your client</p>
        </div>
      </div>

      {!user?.upiId && (
        <div className="alert alert-error" style={{ marginBottom: 24 }}>
          ⚠️ You haven't set a UPI ID. <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => navigate('/profile')}>Go to Settings</span> to add it first.
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <div style={styles.formCard}>
        <form onSubmit={handleSubmit}>
          <div style={styles.row}>
            <div className="field" style={{ flex: 1 }}>
              <label>Client Name *</label>
              <input value={form.clientName} onChange={set('clientName')} placeholder="Rahul Sharma" required />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Project Title *</label>
              <input value={form.projectTitle} onChange={set('projectTitle')} placeholder="E-commerce Website Redesign" required />
            </div>
          </div>

          <div className="field">
            <label>Project Description *</label>
            <textarea
              value={form.projectDescription}
              onChange={set('projectDescription')}
              placeholder="Describe the scope of work, deliverables, and any specific requirements..."
              required
              style={{ minHeight: 120 }}
            />
          </div>

          <div style={styles.row}>
            <div className="field" style={{ flex: 1 }}>
              <label>Amount (₹ INR) *</label>
              <input
                type="number"
                value={form.amount}
                onChange={set('amount')}
                placeholder="25000"
                min="1"
                required
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Delivery Date *</label>
              <input
                type="date"
                value={form.deliveryDate}
                onChange={set('deliveryDate')}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Revisions Included</label>
              <input
                type="number"
                value={form.revisionsIncluded}
                onChange={set('revisionsIncluded')}
                min="0"
                max="20"
              />
            </div>
          </div>

          <hr className="divider" />

          <div style={styles.preview}>
            <div style={styles.previewLabel}>Your UPI ID</div>
            <div style={styles.previewValue} className="mono">{user?.upiId || 'Not set'}</div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading || !user?.upiId} style={{ marginTop: 8 }}>
            {loading ? 'Creating...' : 'Create Deal & Generate Link →'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  pageHeader: { marginBottom: 32 },
  pageTitle: { fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' },
  pageSubtitle: { color: 'var(--text-muted)', marginTop: 4 },
  formCard: {
    background: 'var(--surface)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '32px',
    maxWidth: 720,
  },
  row: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
  },
  preview: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    padding: '12px 16px',
    background: 'var(--surface2)',
    borderRadius: 'var(--radius-sm)',
  },
  previewLabel: { fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 },
  previewValue: { fontSize: 14, color: 'var(--accent)' },
  successWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
  },
  successCard: {
    background: 'var(--surface)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '40px',
    maxWidth: 480,
    width: '100%',
    textAlign: 'center',
  },
  successIcon: {
    width: 64, height: 64,
    background: 'rgba(126,255,139,0.15)',
    color: 'var(--accent)',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 28, fontWeight: 800,
    margin: '0 auto 20px',
  },
  successTitle: { fontSize: 24, fontWeight: 800, marginBottom: 8 },
  successSub: { color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 },
  linkBox: {
    background: 'var(--surface2)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 16px',
    marginBottom: 24,
    wordBreak: 'break-all',
    textAlign: 'left',
  },
  linkText: { fontSize: 12, color: 'var(--accent3)' },
};
