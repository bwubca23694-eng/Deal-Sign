import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API  = process.env.REACT_APP_API_URL || '/api';
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('df-token')}` });

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [name,    setName]    = useState(user?.name  || '');
  const [upiId,   setUpiId]   = useState(user?.upiId || '');
  const [saving,  setSaving]  = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveErr, setSaveErr] = useState('');

  const [qrUploading, setQrUploading] = useState(false);
  const [qrUrl,       setQrUrl]       = useState(user?.upiQrUrl || null);
  const [qrErr,       setQrErr]       = useState('');

  const [sigUploading, setSigUploading] = useState(false);
  const [sigUrl,       setSigUrl]       = useState(user?.signatureUrl || null);
  const [sigErr,       setSigErr]       = useState('');

  const [curPw,   setCurPw]   = useState('');
  const [newPw,   setNewPw]   = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg,   setPwMsg]   = useState('');
  const [pwErr,   setPwErr]   = useState('');

  const qrRef  = useRef();
  const sigRef = useRef();

  const saveProfile = async () => {
    setSaving(true); setSaveMsg(''); setSaveErr('');
    try {
      const res = await axios.patch(`${API}/profile`, { name, upiId }, { headers: authH() });
      updateUser(res.data);
      setSaveMsg('Profile saved ✓');
    } catch (e) { setSaveErr(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const uploadQr = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    setQrUploading(true); setQrErr('');
    try {
      const fd = new FormData(); fd.append('qr', file);
      const res = await axios.post(`${API}/profile/upi-qr`, fd, { headers: { ...authH(), 'Content-Type':'multipart/form-data' } });
      setQrUrl(res.data.upiQrUrl);
      updateUser({ ...user, upiQrUrl: res.data.upiQrUrl });
    } catch (e) { setQrErr(e.response?.data?.message || 'Upload failed'); }
    finally { setQrUploading(false); }
  };

  const removeQr = async () => {
    try {
      await axios.delete(`${API}/profile/upi-qr`, { headers: authH() });
      setQrUrl(null); updateUser({ ...user, upiQrUrl: null });
    } catch (e) { setQrErr(e.response?.data?.message || 'Remove failed'); }
  };

  const uploadSig = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    setSigUploading(true); setSigErr('');
    try {
      const fd = new FormData(); fd.append('signature', file);
      const res = await axios.post(`${API}/profile/signature`, fd, { headers: { ...authH(), 'Content-Type':'multipart/form-data' } });
      setSigUrl(res.data.signatureUrl);
      updateUser({ ...user, signatureUrl: res.data.signatureUrl });
    } catch (e) { setSigErr(e.response?.data?.message || 'Upload failed'); }
    finally { setSigUploading(false); }
  };

  const removeSig = async () => {
    try {
      await axios.delete(`${API}/profile/signature`, { headers: authH() });
      setSigUrl(null); updateUser({ ...user, signatureUrl: null });
    } catch (e) { setSigErr(e.response?.data?.message || 'Remove failed'); }
  };

  const changePassword = async () => {
    setPwSaving(true); setPwMsg(''); setPwErr('');
    try {
      await axios.patch(`${API}/profile/password`, { currentPassword: curPw, newPassword: newPw }, { headers: authH() });
      setPwMsg('Password updated ✓'); setCurPw(''); setNewPw('');
    } catch (e) { setPwErr(e.response?.data?.message || 'Failed'); }
    finally { setPwSaving(false); }
  };

  return (
    <div style={{ maxWidth:600, width:'100%' }}>
      <div style={{ marginBottom:28 }}>
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">Manage your profile, signature and payment details.</p>
      </div>

      {/* Profile */}
      <Section title="Profile">
        <div className="field"><label>Name</label><input value={name} onChange={e => setName(e.target.value)} /></div>
        <div className="field"><label>Email</label><input value={user?.email || ''} disabled style={{ opacity:.6 }} /></div>
        {saveErr && <div className="alert alert-error">{saveErr}</div>}
        {saveMsg && <div className="alert alert-success">{saveMsg}</div>}
        <button className="btn btn-teal" onClick={saveProfile} disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
      </Section>

      {/* Freelancer Signature */}
      <Section title="Your signature" subtitle="Appears on contract PDFs alongside your client's signature.">
        <input ref={sigRef} type="file" accept="image/*" style={{ display:'none' }} onChange={uploadSig} />
        {sigUrl ? (
          <div>
            <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:16, marginBottom:12, display:'flex', alignItems:'center', justifyContent:'center', minHeight:70 }}>
              <img src={sigUrl} alt="Your signature" style={{ maxHeight:60, maxWidth:'100%' }} />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-outline btn-sm" onClick={() => sigRef.current.click()} disabled={sigUploading}>Replace</button>
              <button className="btn btn-ghost btn-sm" style={{ color:'var(--red)' }} onClick={removeSig}>Remove</button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ border:'2px dashed var(--border)', borderRadius:12, padding:'28px 20px', textAlign:'center', marginBottom:12 }}>
              <div style={{ fontSize:24, marginBottom:8 }}>✍</div>
              <div style={{ fontSize:13, color:'var(--ink-muted)', marginBottom:12 }}>Upload an image of your handwritten signature</div>
              <button className="btn btn-outline btn-sm" onClick={() => sigRef.current.click()} disabled={sigUploading}>
                {sigUploading ? 'Uploading…' : 'Upload signature image'}
              </button>
            </div>
            <p style={{ fontSize:11, color:'var(--ink-faint)', lineHeight:1.6 }}>Tip: Sign on white paper, take a clear photo, and upload it. PNG with transparent background works best.</p>
          </div>
        )}
        {sigErr && <div className="alert alert-error" style={{ marginTop:10 }}>{sigErr}</div>}
      </Section>

      {/* UPI details */}
      <Section title="UPI payment details" subtitle="Clients use this to pay you after signing.">
        <div className="field">
          <label>UPI ID *</label>
          <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@upi" />
          <div style={{ fontSize:11, color:'var(--ink-faint)', marginTop:4 }}>Required to create deals. Clients will pay to this ID.</div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={saveProfile} disabled={saving} style={{ marginBottom:20 }}>Save UPI ID</button>

        <div>
          <label style={{ fontSize:12, fontWeight:700, color:'var(--ink-muted)', display:'block', marginBottom:8 }}>UPI QR code <span className="optional">optional</span></label>
          <input ref={qrRef} type="file" accept="image/*" style={{ display:'none' }} onChange={uploadQr} />
          {qrUrl ? (
            <div>
              <img src={qrUrl} alt="UPI QR" style={{ width:120, height:120, objectFit:'contain', borderRadius:10, border:'1px solid var(--border)', padding:8, marginBottom:10 }} />
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn btn-outline btn-sm" onClick={() => qrRef.current.click()} disabled={qrUploading}>Replace QR</button>
                <button className="btn btn-ghost btn-sm" style={{ color:'var(--red)' }} onClick={removeQr}>Remove</button>
              </div>
            </div>
          ) : (
            <button className="btn btn-outline btn-sm" onClick={() => qrRef.current.click()} disabled={qrUploading}>
              {qrUploading ? 'Uploading…' : '↑ Upload QR code'}
            </button>
          )}
          {qrErr && <div className="alert alert-error" style={{ marginTop:10 }}>{qrErr}</div>}
        </div>
      </Section>

      {/* Password */}
      {user?.authProvider !== 'google' && (
        <Section title="Password">
          <div className="field"><label>Current password</label><input type="password" value={curPw} onChange={e => setCurPw(e.target.value)} /></div>
          <div className="field"><label>New password</label><input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} /></div>
          {pwErr && <div className="alert alert-error">{pwErr}</div>}
          {pwMsg && <div className="alert alert-success">{pwMsg}</div>}
          <button className="btn btn-outline" onClick={changePassword} disabled={pwSaving}>{pwSaving ? 'Updating…' : 'Update password'}</button>
        </Section>
      )}

      {user?.authProvider === 'google' && (
        <Section title="Sign-in method">
          <p style={{ fontSize:14, color:'var(--ink-muted)' }}>You signed in with Google. Password management is handled by Google.</p>
        </Section>
      )}
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:'24px', marginBottom:20, boxShadow:'var(--shadow-sm)' }}>
      <div style={{ fontSize:15, fontWeight:800, color:'var(--ink)', marginBottom: subtitle ? 4 : 16 }}>{title}</div>
      {subtitle && <p style={{ fontSize:12, color:'var(--ink-muted)', marginBottom:16, lineHeight:1.55 }}>{subtitle}</p>}
      {children}
    </div>
  );
}
