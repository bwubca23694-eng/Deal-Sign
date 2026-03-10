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
    } catch (err) { setProfileErr(err.response?.data?.message || 'Update failed'); }
    finally { setProfileLoading(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPassMsg(''); setPassErr('');
    setPassLoading(true);
    try {
      await axios.patch(`${API}/profile/password`, { currentPassword: currPass, newPassword: newPass });
      setPassMsg('Password updated');
      setCurrPass(''); setNewPass('');
    } catch (err) { setPassErr(err.response?.data?.message || 'Password change failed'); }
    finally { setPassLoading(false); }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const isGoogleOnly = user?.authProvider === 'google';

  return (
    <div>
      <div style={s.pageHead}>
        <h1 style={s.pageTitle}>Settings</h1>
        <p style={s.pageSub}>Manage your profile and account preferences.</p>
      </div>

      <div style={s.grid}>
        {/* Account overview */}
        <div style={s.accountCard}>
          <div style={s.accountAvatarWrap}>
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" style={s.accountAvatarImg} />
            ) : (
              <div style={s.accountAvatar}>{initials}</div>
            )}
          </div>
          <div style={s.accountName}>{user?.name}</div>
          <div style={s.accountEmail}>{user?.email}</div>
          {user?.authProvider && (
            <div style={s.authPill}>
              {isGoogleOnly ? '🔗 Google account' : '📧 Email account'}
            </div>
          )}
          <hr className="divider" style={{ margin: '20px 0' }} />
          <div style={s.upiBlock}>
            <div style={s.upiTitle}>Your UPI ID</div>
            {user?.upiId ? (
              <div style={s.upiVal}>{user.upiId}</div>
            ) : (
              <div style={s.upiEmpty}>Not set — clients can't pay you yet</div>
            )}
          </div>
        </div>

        <div style={s.formCol}>
          {/* Profile form */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>Profile details</h3>
            {profileMsg && <div className="alert alert-success">{profileMsg}</div>}
            {profileErr && <div className="alert alert-error">{profileErr}</div>}
            <form onSubmit={saveProfile}>
              <div className="field">
                <label>Full name</label>
                <input value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="field">
                <label>Email</label>
                <input value={user?.email} disabled />
              </div>
              <div className="field" style={{ marginBottom: 24 }}>
                <label>UPI ID</label>
                <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@upi or 9876543210@paytm" />
                <p style={s.hint}>This appears on every deal you create. Clients pay to this address.</p>
              </div>
              <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                {profileLoading ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </div>

          {/* Password form — hidden for Google-only accounts */}
          {!isGoogleOnly && (
            <div style={s.card}>
              <h3 style={s.cardTitle}>Change password</h3>
              {passMsg && <div className="alert alert-success">{passMsg}</div>}
              {passErr && <div className="alert alert-error">{passErr}</div>}
              <form onSubmit={changePassword}>
                <div className="field">
                  <label>Current password</label>
                  <input type="password" value={currPass} onChange={e => setCurrPass(e.target.value)} placeholder="••••••••" required />
                </div>
                <div className="field" style={{ marginBottom: 24 }}>
                  <label>New password</label>
                  <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min. 6 characters" required minLength={6} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={passLoading}>
                  {passLoading ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  pageHead: { marginBottom: 28 },
  pageTitle: { fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--ink)' },
  pageSub: { fontSize: 14, color: 'var(--ink-muted)', marginTop: 3 },
  grid: { display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' },
  accountCard: { background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px 20px', textAlign: 'center', boxShadow: 'var(--shadow-xs)', position: 'sticky', top: 24 },
  accountAvatarWrap: { display: 'flex', justifyContent: 'center', marginBottom: 12 },
  accountAvatar: { width: 64, height: 64, background: 'var(--gray-800)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22 },
  accountAvatarImg: { width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' },
  accountName: { fontSize: 16, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 4 },
  accountEmail: { fontSize: 12.5, color: 'var(--ink-faint)', fontFamily: 'var(--mono)' },
  authPill: { display: 'inline-block', marginTop: 10, background: 'var(--gray-50)', border: '1px solid var(--border)', borderRadius: 99, padding: '4px 10px', fontSize: 11.5, color: 'var(--ink-muted)', fontWeight: 600 },
  upiBlock: { textAlign: 'left' },
  upiTitle: { fontSize: 11, fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 },
  upiVal: { fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--teal-600)', fontWeight: 600, wordBreak: 'break-all' },
  upiEmpty: { fontSize: 12.5, color: 'var(--red-500)', fontWeight: 600 },
  formCol: { display: 'flex', flexDirection: 'column', gap: 20 },
  card: { background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px 28px', boxShadow: 'var(--shadow-xs)' },
  cardTitle: { fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' },
  hint: { fontSize: 12, color: 'var(--ink-faint)', marginTop: 6, lineHeight: 1.6 },
};
