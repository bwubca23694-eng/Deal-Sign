import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || '/api';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name,    setName]    = useState(user?.name  || '');
  const [upiId,   setUpiId]   = useState(user?.upiId || '');
  const [profMsg, setProfMsg] = useState('');
  const [profErr, setProfErr] = useState('');
  const [profLoad,setProfLoad]= useState(false);

  const [currPass, setCurrPass] = useState('');
  const [newPass,  setNewPass]  = useState('');
  const [passMsg,  setPassMsg]  = useState('');
  const [passErr,  setPassErr]  = useState('');
  const [passLoad, setPassLoad] = useState(false);

  const [qrPreview, setQrPreview] = useState(user?.upiQrUrl || null);
  const [qrLoad,    setQrLoad]    = useState(false);
  const [qrMsg,     setQrMsg]     = useState('');
  const [qrErr,     setQrErr]     = useState('');
  const fileRef = useRef(null);

  const saveProfile = async e => {
    e.preventDefault(); setProfMsg(''); setProfErr('');
    if (!name.trim()) { setProfErr('Name is required'); return; }
    setProfLoad(true);
    try {
      const res = await axios.patch(`${API}/profile`, { name, upiId });
      updateUser(res.data); setProfMsg('Profile updated ✓');
      setTimeout(() => setProfMsg(''), 3000);
    } catch (err) { setProfErr(err.response?.data?.message || 'Update failed'); }
    finally { setProfLoad(false); }
  };

  const savePassword = async e => {
    e.preventDefault(); setPassMsg(''); setPassErr('');
    if (newPass.length < 6) { setPassErr('New password must be at least 6 characters'); return; }
    setPassLoad(true);
    try {
      await axios.patch(`${API}/profile/password`, { currentPassword: currPass, newPassword: newPass });
      setPassMsg('Password updated ✓'); setCurrPass(''); setNewPass('');
      setTimeout(() => setPassMsg(''), 3000);
    } catch (err) { setPassErr(err.response?.data?.message || 'Update failed'); }
    finally { setPassLoad(false); }
  };

  const handleQrFile = async e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setQrErr('Please select an image file'); return; }
    if (file.size > 2 * 1024 * 1024)    { setQrErr('Image must be under 2MB'); return; }

    // Preview
    const reader = new FileReader();
    reader.onload = ev => setQrPreview(ev.target.result);
    reader.readAsDataURL(file);

    // Upload
    setQrLoad(true); setQrErr(''); setQrMsg('');
    const fd = new FormData(); fd.append('qr', file);
    try {
      const res = await axios.post(`${API}/profile/upi-qr`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser({ ...user, upiQrUrl: res.data.upiQrUrl });
      setQrPreview(res.data.upiQrUrl);
      setQrMsg('QR uploaded ✓');
      setTimeout(() => setQrMsg(''), 3000);
    } catch (err) { setQrErr(err.response?.data?.message || 'Upload failed'); setQrPreview(user?.upiQrUrl || null); }
    finally { setQrLoad(false); }
  };

  const removeQr = async () => {
    if (!window.confirm('Remove your UPI QR code?')) return;
    setQrLoad(true);
    try {
      await axios.delete(`${API}/profile/upi-qr`);
      updateUser({ ...user, upiQrUrl: null }); setQrPreview(null);
      setQrMsg('QR removed'); setTimeout(() => setQrMsg(''), 3000);
    } catch (err) { setQrErr(err.response?.data?.message || 'Remove failed'); }
    finally { setQrLoad(false); }
  };

  const isGoogle = user?.authProvider === 'google';
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '?';

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Settings</h1>
        <p style={s.sub}>Manage your profile and payment details.</p>
      </div>

      <div style={s.grid}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Profile card */}
          <div style={s.card}>
            <div style={s.cardTop}>
              <div style={s.avatarSection}>
                {user?.avatar
                  ? <img src={user.avatar} alt="avatar" style={s.avatarImg} />
                  : <div style={s.avatar}>{initials}</div>}
                <div>
                  <div style={s.profileName}>{user?.name}</div>
                  <div style={s.profileEmail}>{user?.email}</div>
                  {isGoogle && <div style={s.googleBadge}>Connected with Google</div>}
                </div>
              </div>
            </div>

            <hr className="divider" />

            <form onSubmit={saveProfile}>
              {profErr && <div className="alert alert-error">{profErr}</div>}
              {profMsg && <div className="alert alert-success">{profMsg}</div>}
              <div className="field"><label>Display name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" /></div>
              <div className="field">
                <label>UPI ID <span style={{ fontSize:11,color:'var(--red-500)',fontWeight:700 }}>* required to receive payments</span></label>
                <input value={upiId} onChange={e=>setUpiId(e.target.value)} placeholder="yourname@upi" style={{ fontFamily:'var(--mono)' }} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={profLoad}>
                {profLoad ? 'Saving…' : 'Save profile'}
              </button>
            </form>
          </div>

          {/* Change password */}
          {!isGoogle && (
            <div style={s.card}>
              <div style={s.cardTitle}>Change password</div>
              <form onSubmit={savePassword} style={{ marginTop: 16 }}>
                {passErr && <div className="alert alert-error">{passErr}</div>}
                {passMsg && <div className="alert alert-success">{passMsg}</div>}
                <div className="field"><label>Current password</label><input type="password" value={currPass} onChange={e=>setCurrPass(e.target.value)} placeholder="••••••••" /></div>
                <div className="field"><label>New password</label><input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Min 6 characters" /></div>
                <button type="submit" className="btn btn-outline" disabled={passLoad}>
                  {passLoad ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* UPI QR card */}
        <div style={s.card}>
          <div style={s.cardTitle}>UPI QR Code</div>
          <p style={s.cardDesc}>Desktop clients will see this QR code to scan and pay. Upload a QR from Google Pay, PhonePe, or your bank app.</p>

          {qrErr && <div className="alert alert-error" style={{ marginTop: 12 }}>{qrErr}</div>}
          {qrMsg && <div className="alert alert-success" style={{ marginTop: 12 }}>{qrMsg}</div>}

          <div style={s.qrArea}>
            {qrPreview ? (
              <div style={s.qrPreviewWrap}>
                <img src={qrPreview} alt="UPI QR" style={s.qrPreview} />
                <div style={s.qrBadge}>✓ QR set</div>
              </div>
            ) : (
              <div style={s.qrEmpty}>
                <div style={s.qrEmptyIcon}>⬜</div>
                <div style={s.qrEmptyText}>No QR uploaded yet</div>
                <div style={s.qrEmptyNote}>Desktop clients will see your UPI ID as text</div>
              </div>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/*" onChange={handleQrFile} style={{ display:'none' }} />

          <div style={{ display:'flex', gap:10, marginTop:16, flexWrap:'wrap' }}>
            <button className="btn btn-outline" onClick={() => fileRef.current.click()} disabled={qrLoad} style={{ flex:1 }}>
              {qrLoad ? 'Uploading…' : qrPreview ? '↑ Replace QR' : '↑ Upload QR'}
            </button>
            {qrPreview && (
              <button className="btn btn-danger-ghost btn-sm" onClick={removeQr} disabled={qrLoad}>Remove</button>
            )}
          </div>

          <div style={s.qrTips}>
            <div style={s.qrTipTitle}>How to get your QR code</div>
            {[
              'Google Pay → Profile → QR code → Screenshot',
              'PhonePe → My Money → QR Code → Save',
              'Paytm → Profile → Your QR → Download',
            ].map(tip => <div key={tip} style={s.qrTip}>· {tip}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:       { maxWidth: 860, width: '100%' },
  header:     { marginBottom: 28 },
  title:      { fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--ink)' },
  sub:        { fontSize: 14, color: 'var(--ink-muted)', marginTop: 4 },
  grid:       { display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18, alignItems: 'start' },
  card:       { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px', boxShadow: 'var(--shadow-sm)' },
  cardTitle:  { fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink)' },
  cardDesc:   { fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.65, marginTop: 6 },
  cardTop:    { marginBottom: 0 },
  avatarSection:{ display: 'flex', alignItems: 'center', gap: 14 },
  avatar:     { width: 48, height: 48, background: 'var(--ink)', color: 'var(--bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, flexShrink: 0 },
  avatarImg:  { width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  profileName:{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink)' },
  profileEmail:{ fontSize: 12.5, color: 'var(--ink-faint)', fontFamily: 'var(--mono)', marginTop: 2 },
  googleBadge:{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--blue-50)', color: 'var(--blue-500)', borderRadius: 99, padding: '2px 9px', fontSize: 10.5, fontWeight: 700, marginTop: 6, border: '1px solid var(--blue-200)' },
  qrArea:     { marginTop: 16, background: 'var(--surface2)', border: '1.5px dashed var(--border-strong)', borderRadius: 12, padding: '24px', display: 'flex', justifyContent: 'center' },
  qrPreviewWrap:{ position: 'relative' },
  qrPreview:  { width: 180, height: 180, objectFit: 'contain', borderRadius: 10, background: '#fff', padding: 6, border: '1px solid var(--border)' },
  qrBadge:    { position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', background: 'var(--teal-500)', color: '#fff', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' },
  qrEmpty:    { textAlign: 'center', padding: '8px 0' },
  qrEmptyIcon:{ fontSize: 32, marginBottom: 10 },
  qrEmptyText:{ fontSize: 13, fontWeight: 700, color: 'var(--ink-muted)' },
  qrEmptyNote:{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 4 },
  qrTips:     { marginTop: 20, padding: '14px', background: 'var(--surface2)', borderRadius: 10 },
  qrTipTitle: { fontSize: 11, fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 },
  qrTip:      { fontSize: 12, color: 'var(--ink-muted)', marginBottom: 5, lineHeight: 1.5 },
};
