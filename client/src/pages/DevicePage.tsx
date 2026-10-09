import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Monitor, Smartphone, Laptop, Cpu, Layers,
  HardDrive, Globe, Clock, Wifi, Battery, Copy, Check
} from 'lucide-react';
import { detectRealDevice, DeviceInfo } from '../lib/deviceHelper';

export const DevicePage: React.FC = () => {
  const navigate = useNavigate();
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [copiedUa, setCopiedUa] = useState(false);
  const now = new Date();

  useEffect(() => {
    detectRealDevice().then(setDeviceInfo);
  }, []);

  const handleCopyUa = () => {
    if (deviceInfo?.userAgent) {
      navigator.clipboard.writeText(deviceInfo.userAgent);
      setCopiedUa(true);
      setTimeout(() => setCopiedUa(false), 2000);
    }
  };

  const getDeviceIcon = () => {
    switch (deviceInfo?.deviceType) {
      case 'Mobile':
      case 'Tablet':
        return <Smartphone className="w-7 h-7 text-emerald-400" />;
      case 'Laptop':
        return <Laptop className="w-7 h-7 text-emerald-400" />;
      default:
        return <Monitor className="w-7 h-7 text-emerald-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#090e17] text-white">
      {/* Header */}
      <div className="h-16 px-4 bg-slate-950/80 border-b border-slate-800/60 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/settings')}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            aria-label="Back to settings"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-lg border border-slate-800 bg-slate-900 flex items-center justify-center">
              <img src="/chart-logo.png" alt="Chart" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-bold text-sm block">Device Information</span>
              <span className="text-[10px] text-slate-400">Hardware & browser specifications</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-emerald-950/20 border border-slate-800 shadow-xl"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              {getDeviceIcon()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold text-white break-words">
                  {deviceInfo?.deviceName || 'Detecting Device...'}
                </h1>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Device
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {deviceInfo ? `${deviceInfo.os} • ${deviceInfo.browser}` : 'Gathering system parameters...'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Hardware & Performance */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3"
        >
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hardware & Performance</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: Smartphone, label: 'Device Model', value: deviceInfo?.deviceName || 'Detecting...' },
              { icon: Cpu, label: 'Processor Cores', value: deviceInfo?.cpuCores || 'Unavailable' },
              ...(deviceInfo?.gpu ? [{ icon: Layers, label: 'Graphics Card (GPU)', value: deviceInfo.gpu }] : []),
              ...(deviceInfo?.ram ? [{ icon: HardDrive, label: 'System Memory (RAM)', value: deviceInfo.ram }] : []),
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-800 text-slate-400 flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{label}</p>
                  <p className="text-xs text-slate-200 font-semibold break-words mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Display & Touch */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3"
        >
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Display & Screen</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: Monitor, label: 'Resolution', value: deviceInfo?.screen || `${window.screen.width} × ${window.screen.height} px` },
              { icon: Monitor, label: 'Display Scaling', value: deviceInfo?.displayScale || '1x (100%)' },
              { icon: Smartphone, label: 'Touch Support', value: deviceInfo?.touchSupport || 'No Touch' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-800 text-slate-400 flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{label}</p>
                  <p className="text-xs text-slate-200 font-semibold break-words mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Operating System & Network */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3"
        >
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">System & Network</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: Cpu, label: 'Operating System', value: deviceInfo?.os || 'Detecting...' },
              { icon: Globe, label: 'Web Browser', value: deviceInfo?.browser || 'Detecting...' },
              { icon: Wifi, label: 'Connection Status', value: deviceInfo?.network || (navigator.onLine ? 'Online' : 'Offline') },
              ...(deviceInfo?.battery ? [{ icon: Battery, label: 'Battery', value: deviceInfo.battery }] : []),
              { icon: Globe, label: 'Timezone', value: deviceInfo?.timezone || 'Local' },
              { icon: Clock, label: 'Local Time', value: now.toLocaleString() },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-800 text-slate-400 flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{label}</p>
                  <p className="text-xs text-slate-200 font-semibold break-words mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* User-Agent */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">User-Agent Identifier</h2>
            <button
              onClick={handleCopyUa}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              {copiedUa ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedUa ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-[11px] font-mono text-slate-400 break-all leading-relaxed p-3 rounded-xl bg-slate-950 border border-slate-850">
            {deviceInfo?.userAgent || navigator.userAgent}
          </p>
        </motion.div>
      </div>
    </div>
  );
};
export default DevicePage;
