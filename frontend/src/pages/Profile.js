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
  const [currPass,setCurrPass]= useState('');
  const [newPass, setNewPass] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');
  const [passLoad,setPassLoad]= useState(false);
  const [qrPreview,setQrPreview]=useState(user?.upiQrUrl||null);
  const [qrLoad,  setQrLoad]  = useState(false);
  const [qrMsg,   setQrMsg]   = useState('');
  const [qrErr,   setQrErr]   = useState('');
  const fileRef = useRef(null);

  const saveProfile = async e => {
    e.preventDefault(); setProfMsg(''); setProfErr('');
    setProfLoad(true);
    try {
      const res = await axios.patch(`${API}/profile`, { name, upiId });
      updateUser(res.data); setProfMsg('Profile updated ✓');
      setTimeout(() => setProfMsg(''), 3000);
    } catch (err) { setProfErr(err.response?.data?.message || 'Update failed'); }
    finally { setProfLoad(false); }
  };

  const savePass = async e => {
    e.preventDefault(); setPassMsg(''); setPassErr('');
    if (newPass.length < 6) { setPassErr('New password must be at least 6 characters'); return; }
    setPassLoad(true);
    try {
      await axios.patch(`${API}/profile/password`, { currentPassword: currPass, newPassword: newPass });
      setPassMsg('Password updated ✓'); setCurrPass(''); setNewPass('');
      setTimeout(() => setPassMsg(''), 3000);
    } catch (err) { setPassErr(err.response?.data?.message || 'Failed'); }
    finally { setPassLoad(false); }
  };

  const handleQr = async e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setQrErr('Please select an image file'); return; }
    if (file.size > 2 * 1024 * 1024)    { setQrErr('Image must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => setQrPreview(ev.target.result);
    reader.readAsDataURL(file);
    setQrLoad(true); setQrErr(''); setQrMsg('');
    const fd = new FormData(); fd.append('qr', file);
    try {
      const res = await axios.post(`${API}/profile/upi-qr`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser({ ...user, upiQrUrl: res.data.upiQrUrl });
      setQrPreview(res.data.upiQrUrl);
      setQrMsg('QR uploaded ✓'); setTimeout(() => setQrMsg(''), 3000);
    } catch (err) { setQrErr(err.response?.data?.message || 'Upload failed'); setQrPreview(user?.upiQrUrl || null); }
    finally { setQrLoad(false); }
  };

  const removeQr = async () => {
    if (!window.confirm('Remove UPI QR?')) return;
    setQrLoad(true);
    try {
      await axios.delete(`${API}/profile/upi-qr`);
      updateUser({ ...user, upiQrUrl: null }); setQrPreview(null);
      setQrMsg('QR removed'); setTimeout(() => setQrMsg(''), 3000);
    } catch (err) { setQrErr(err.response?.data?.message || 'Failed'); }
    finally { setQrLoad(false); }
  };

  const isGoogle = user?.authProvider === 'google';
  const initials = (user?.name||'?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();

  return (
    <div className="prof-page">
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">Manage your profile and payment details.</p>
      </div>

      <div className="prof-grid">
        {/* Left column */}
        <div>
          {/* Profile card */}
          <div className="prof-card">
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20, paddingBottom:20, borderBottom:'1px solid var(--border)' }}>
              <div className="user-av" style={{ width:48, height:48, fontSize:18 }}>
                {user?.avatar ? <img src={user.avatar} alt="av" style={{ width:48, height:48, borderRadius:'50%', objectFit:'cover' }} /> : initials}
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:800, letterSpacing:'-.02em' }}>{user?.name}</div>
                <div style={{ fontSize:12, color:'var(--ink-faint)', fontFamily:'var(--mono)', marginTop:2 }}>{user?.email}</div>
                {isGoogle && <span className="google-badge">Connected with Google</span>}
              </div>
            </div>

            <div className="card-title">Profile</div>
            <form onSubmit={saveProfile}>
              {profErr && <div className="alert alert-error">{profErr}</div>}
              {profMsg && <div className="alert alert-success">{profMsg}</div>}
              <div className="field">
                <label>Display name</label>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="field" style={{ marginBottom:20 }}>
                <label>UPI ID <span style={{ fontSize:11, color:'var(--red)', fontWeight:700, marginLeft:4 }}>* required to receive payments</span></label>
                <input value={upiId} onChange={e=>setUpiId(e.target.value)} placeholder="yourname@upi" style={{ fontFamily:'var(--mono)' }} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={profLoad}>
                {profLoad ? 'Saving…' : 'Save profile'}
              </button>
            </form>
          </div>

          {/* Change password */}
          {!isGoogle && (
            <div className="prof-card" style={{ marginTop:16 }}>
              <div className="card-title">Change password</div>
              <form onSubmit={savePass} style={{ marginTop:16 }}>
                {passErr && <div className="alert alert-error">{passErr}</div>}
                {passMsg && <div className="alert alert-success">{passMsg}</div>}
                <div className="field"><label>Current password</label><input type="password" value={currPass} onChange={e=>setCurrPass(e.target.value)} placeholder="••••••••" /></div>
                <div className="field" style={{ marginBottom:20 }}><label>New password</label><input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Min 6 characters" /></div>
                <button type="submit" className="btn btn-outline" disabled={passLoad}>{passLoad ? 'Updating…' : 'Update password'}</button>
              </form>
            </div>
          )}
        </div>

        {/* Right column — QR */}
        <div className="prof-card">
          <div className="card-title">UPI QR Code</div>
          <p style={{ fontSize:13, color:'var(--ink-muted)', lineHeight:1.65, marginBottom:0 }}>
            Desktop clients will see this QR code instead of just a UPI ID. Upload yours from Google Pay, PhonePe, or your bank.
          </p>

          {qrErr && <div className="alert alert-error" style={{ marginTop:12 }}>{qrErr}</div>}
          {qrMsg && <div className="alert alert-success" style={{ marginTop:12 }}>{qrMsg}</div>}

          <div className="qr-area">
            {qrPreview ? (
              <div style={{ position:'relative', display:'inline-block' }}>
                <img src={qrPreview} alt="UPI QR" style={{ width:160, height:160, objectFit:'contain', background:'#fff', padding:8, borderRadius:10, border:'1px solid var(--border)', display:'block' }} />
                <span className="qr-badge">✓ QR saved</span>
              </div>
            ) : (
              <div className="qr-empty" style={{ padding:'12px 0' }}>
                <div style={{ fontSize:36, marginBottom:10 }}>⬜</div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--ink-muted)' }}>No QR uploaded yet</div>
                <div style={{ fontSize:12, color:'var(--ink-faint)', marginTop:4 }}>Desktop clients will see your UPI ID as text</div>
              </div>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/*" onChange={handleQr} style={{ display:'none' }} />
          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            <button className="btn btn-outline btn-full" onClick={()=>fileRef.current.click()} disabled={qrLoad}>
              {qrLoad ? 'Uploading…' : qrPreview ? '↑ Replace QR' : '↑ Upload QR'}
            </button>
            {qrPreview && <button className="btn btn-danger btn-sm" onClick={removeQr} disabled={qrLoad}>Remove</button>}
          </div>

          <div style={{ marginTop:20, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'14px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-faint)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10 }}>How to get your QR</div>
            {['Google Pay → Profile → QR code → Screenshot', 'PhonePe → My Money → QR Code → Save', 'Paytm → Profile → Your QR → Download'].map(t => (
              <div key={t} style={{ fontSize:12, color:'var(--ink-muted)', marginBottom:6, lineHeight:1.5 }}>· {t}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
