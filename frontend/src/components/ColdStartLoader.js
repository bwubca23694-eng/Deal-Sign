import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '/api';
const MESSAGES = ['Waking up the server…', 'Connecting to database…', 'Loading your deals…', 'Almost there…'];

export default function ColdStartLoader({ onReady }) {
  const [idx, setIdx]   = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const mT = setInterval(() => setIdx(i => (i + 1) % MESSAGES.length), 2500);
    const dT = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);

    let attempts = 0;
    const poll = async () => {
      try { await axios.get(`${API}/health`, { timeout: 8000 }); clearInterval(mT); clearInterval(dT); onReady(); }
      catch { if (++attempts < 15) setTimeout(poll, 2000); else { clearInterval(mT); clearInterval(dT); onReady(); } }
    };
    poll();
    return () => { clearInterval(mT); clearInterval(dT); };
  }, [onReady]);

  return (
    <div className="cold-splash">
      <div className="cold-logo">D</div>
      <div className="cold-bar"><div className="cold-bar-fill" /></div>
      <p className="cold-text">{MESSAGES[idx]}{dots}</p>
    </div>
  );
}
