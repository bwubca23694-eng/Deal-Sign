import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '/api';
const MESSAGES = [
  'Waking up the server…',
  'Loading your deals…',
  'Almost there…',
  'Connecting to database…',
  'Starting up (Render cold start)…',
];

export default function ColdStartLoader({ onReady }) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [dots, setDots]     = useState('');

  useEffect(() => {
    // Cycle through messages
    const msgTimer = setInterval(() => {
      setMsgIdx(i => (i + 1) % MESSAGES.length);
    }, 2500);

    // Animate dots
    const dotTimer = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);

    // Poll health endpoint until it responds
    let attempts = 0;
    const poll = async () => {
      try {
        await axios.get(`${API}/health`, { timeout: 8000 });
        clearInterval(msgTimer);
        clearInterval(dotTimer);
        onReady();
      } catch {
        attempts++;
        if (attempts < 15) setTimeout(poll, 2000);
        else onReady(); // give up after 30s and let the app handle errors
      }
    };
    poll();

    return () => { clearInterval(msgTimer); clearInterval(dotTimer); };
  }, [onReady]);

  return (
    <div className="cold-splash">
      <div className="cold-splash-logo">D</div>
      <div className="cold-splash-bar">
        <div className="cold-splash-bar-fill" />
      </div>
      <p className="cold-splash-text">{MESSAGES[msgIdx]}{dots}</p>
    </div>
  );
}
