'use client';

import { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Clock, Wifi, WifiOff, Shield } from 'lucide-react';

interface HealthData {
  status: string;
  activeSessions: number;
  timestamp: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function StatusBar() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [uptime, setUptime] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/health`, { signal: AbortSignal.timeout(3000) });
        const data = await res.json();
        setHealth(data);
        setBackendOnline(true);
      } catch {
        setBackendOnline(false);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setUptime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const formatUptime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-between h-6 px-3 bg-[#0a0e15] border-t border-kali-border text-[10px] font-mono text-kali-muted shrink-0 select-none">
      {/* Left */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <Shield size={9} className="text-kali-purple" />
          <span className="text-kali-purple">Docker Isolated</span>
        </span>

        <span className="text-kali-border">│</span>

        <span className="flex items-center gap-1">
          {backendOnline ? (
            <Wifi size={9} className="text-kali-green" />
          ) : (
            <WifiOff size={9} className="text-kali-red" />
          )}
          <span className={backendOnline ? 'text-kali-green' : 'text-kali-red'}>
            {backendOnline ? 'Backend Online' : 'Backend Offline'}
          </span>
        </span>

        {health && (
          <>
            <span className="text-kali-border">│</span>
            <span className="flex items-center gap-1">
              <Activity size={9} className="text-kali-cyan" />
              <span>{health.activeSessions} session{health.activeSessions !== 1 ? 's' : ''}</span>
            </span>
          </>
        )}
      </div>

      {/* Center */}
      <div className="flex items-center gap-2">
        <span className="text-kali-muted opacity-60">node-pty + xterm.js</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <Clock size={9} />
          <span>{formatUptime(uptime)}</span>
        </span>

        <span className="text-kali-border">│</span>
        <span>UTF-8</span>
        <span className="text-kali-border">│</span>
        <span>LF</span>
        <span className="text-kali-border">│</span>
        <span className="text-kali-purple">Kali Terminal v1.0</span>
      </div>
    </div>
  );
}
