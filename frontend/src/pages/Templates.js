import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API  = process.env.REACT_APP_API_URL || '/api';
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('df-token')}` });
const fmt   = n => Number(n).toLocaleString('en-IN');

export default function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [renaming,  setRenaming]  = useState(null); // template _id
  const [newName,   setNewName]   = useState('');
  const [deleting,  setDeleting]  = useState(null);

  useEffect(() => {
    axios.get(`${API}/templates`, { headers: authH() })
      .then(r => setTemplates(r.data))
      .finally(() => setLoading(false));
  }, []);

  const total = t => t.paymentType === 'milestone'
    ? t.milestones.reduce((s,m) => s+m.amount, 0) : (t.amount || 0);

  const applyTemplate = t => {
    navigate('/create-deal', {
      state: {
        prefill: {
          projectTitle:       t.projectTitle,
          projectDescription: t.projectDescription,
          revisionsIncluded:  t.revisionsIncluded,
          paymentType:        t.paymentType,
          amount:             t.amount || '',
          milestones:         t.milestones?.length
            ? t.milestones.map(m => ({ title:m.title, amount:m.amount, dueDate:'', description:m.description||'' }))
            : [{ title:'Advance Payment', amount:'', dueDate:'', description:'' }, { title:'Final Payment', amount:'', dueDate:'', description:'' }],
        }
      }
    });
  };

  const rename = async id => {
    if (!newName.trim()) return;
    try {
      const res = await axios.patch(`${API}/templates/${id}`, { name: newName }, { headers: authH() });
      setTemplates(ts => ts.map(t => t._id === id ? res.data : t));
      setRenaming(null);
    } catch (e) { alert(e.response?.data?.message || 'Rename failed'); }
  };

  const del = async id => {
    setDeleting(id);
    try {
      await axios.delete(`${API}/templates/${id}`, { headers: authH() });
      setTemplates(ts => ts.filter(t => t._id !== id));
    } catch (e) { alert(e.response?.data?.message || 'Delete failed'); }
    finally { setDeleting(null); }
  };

  return (
    <div style={{ maxWidth:680, width:'100%' }}>
      <div style={{ marginBottom:28, display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:12 }}>
        <div>
          <h1 className="page-title">Templates</h1>
          <p className="page-sub">Reuse your common proposal structures. Create templates from the New Deal page.</p>
        </div>
        <button className="btn btn-teal btn-sm" onClick={() => navigate('/create-deal')}>+ New deal</button>
      </div>

      {loading && <div style={{ textAlign:'center', padding:40, color:'var(--ink-muted)' }}>Loading…</div>}

      {!loading && templates.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <div className="empty-title">No templates yet</div>
          <div className="empty-sub">When creating a deal, click "Save as template" to store it here for reuse.</div>
          <button className="btn btn-teal" style={{ marginTop:16 }} onClick={() => navigate('/create-deal')}>Create your first deal →</button>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {templates.map(t => (
          <div key={t._id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'18px 20px', boxShadow:'var(--shadow-sm)' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
              <div style={{ flex:1, minWidth:0 }}>
                {renaming === t._id ? (
                  <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                    <input value={newName} onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && rename(t._id)}
                      style={{ fontSize:15, fontWeight:700, flex:1 }} autoFocus />
                    <button className="btn btn-teal btn-sm" onClick={() => rename(t._id)}>Save</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setRenaming(null)}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ fontSize:16, fontWeight:800, color:'var(--ink)', marginBottom:4, display:'flex', alignItems:'center', gap:8 }}>
                    {t.name}
                    <button onClick={() => { setRenaming(t._id); setNewName(t.name); }} style={{ fontSize:11, color:'var(--ink-faint)', background:'none', border:'none', cursor:'pointer', fontWeight:600, padding:'2px 6px' }}>rename</button>
                  </div>
                )}
                <div style={{ fontSize:13, fontWeight:600, color:'var(--ink-muted)', marginBottom:4 }}>{t.projectTitle}</div>
                <div style={{ fontSize:12, color:'var(--ink-faint)', lineHeight:1.5, overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{t.projectDescription}</div>
                <div style={{ display:'flex', gap:12, marginTop:10, flexWrap:'wrap' }}>
                  <Tag>{t.paymentType === 'milestone' ? `${t.milestones.length} milestones` : 'Single payment'}</Tag>
                  {total(t) > 0 && <Tag>₹{fmt(total(t))}</Tag>}
                  <Tag>{t.revisionsIncluded} revision{t.revisionsIncluded !== 1 ? 's' : ''}</Tag>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, flexShrink:0 }}>
                <button className="btn btn-teal btn-sm" onClick={() => applyTemplate(t)}>Use template →</button>
                <button className="btn btn-ghost btn-sm" style={{ color:'var(--red)' }}
                  onClick={() => del(t._id)} disabled={deleting === t._id}>
                  {deleting === t._id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tag({ children }) {
  return <span style={{ fontSize:11, fontWeight:700, color:'var(--ink-faint)', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'2px 8px' }}>{children}</span>;
}
