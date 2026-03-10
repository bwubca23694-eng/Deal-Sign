import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || '/api';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [upiId, setUpiId] = useState(user?.upiId || '');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg(''); setProfileErr('');
    setProfileLoading(true);
    try {
      const res = await axios.patch(`${API}/profile`, { name, upiId });
      updateUser(res.data);
      setProfileMsg('Profile updated successfully');
    } catch (err) {
      setProfileErr(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPassMsg(''); setPassErr('');
    setPassLoading(true);
    try {
      await axios.patch(`${API}/profile/password`, { currentPassword: currPass, newPassword: newPass });
      setPassMsg('Password changed successfully');
      setCurrPass(''); setNewPass('');
    } catch (err) {
      setPassErr(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Settings</h1>
        <p style={styles.pageSubtitle}>Manage your profile and UPI configuration</p>
      </div>

      <div style={styles.grid}>
        {/* Profile card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Profile</h2>
          {profileMsg && <div className="alert alert-success">{profileMsg}</div>}
          {profileErr && <div className="alert alert-error">{profileErr}</div>}
          <form onSubmit={saveProfile}>
            <div className="field">
              <label>Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required />
            </div>
            <div className="field">
              <label>Email</label>
              <input value={user?.email} disabled style={{ opacity: 0.5 }} />
            </div>
            <div className="field">
              <label>UPI ID</label>
              <input
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                placeholder="yourname@upi"
              />
              <div style={styles.hint}>
                Example: aditya@upi, 9876543210@paytm<br />
                New deals will automatically use your updated UPI ID.
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={profileLoading}>
              {profileLoading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Password card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Change Password</h2>
          {passMsg && <div className="alert alert-success">{passMsg}</div>}
          {passErr && <div className="alert alert-error">{passErr}</div>}
          <form onSubmit={changePassword}>
            <div className="field">
              <label>Current Password</label>
              <input type="password" value={currPass} onChange={e => setCurrPass(e.target.value)} placeholder="••••••••" required />
            </div>
            <div className="field">
              <label>New Password</label>
              <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min. 6 characters" required minLength={6} />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={passLoading}>
              {passLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageHeader: { marginBottom: 32 },
  pageTitle: { fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' },
  pageSubtitle: { color: 'var(--text-muted)', marginTop: 4 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: 24,
  },
  card: {
    background: 'var(--surface)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '28px',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: '1.5px solid var(--border)',
  },
  hint: {
    fontSize: 11,
    color: 'var(--text-dim)',
    marginTop: 6,
    lineHeight: 1.6,
  },
};
