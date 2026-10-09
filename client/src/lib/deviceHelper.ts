export interface DeviceInfo {
  deviceName: string;
  deviceType: 'Desktop' | 'Laptop' | 'Mobile' | 'Tablet';
  os: string;
  browser: string;
  gpu?: string;
  cpuCores?: string;
  ram?: string;
  screen: string;
  displayScale: string;
  touchSupport: string;
  network: string;
  timezone: string;
  language: string;
  battery?: string;
  userAgent: string;
}

// Helper to extract WebGL unmasked renderer (real GPU model)
function getGpuRenderer(): string | undefined {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return undefined;
    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return undefined;
    const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    if (!renderer || typeof renderer !== 'string') return undefined;
    // Clean up Angle / Direct3D wrapping strings if present
    const clean = renderer
      .replace(/ANGLE \((.*)\)/, '$1')
      .replace(/vs_\d+_\d+ ps_\d+_\d+/, '')
      .replace(/Direct3D\d+ vs_\S+ ps_\S+/, '')
      .replace(/\(0x[0-9A-Fa-f]+\)/g, '')
      .trim();
    return clean || renderer;
  } catch {
    return undefined;
  }
}

// Known iPhone screen specs (logical width x height, pixel ratio)
function getIPhoneModel(w: number, h: number, pr: number): string {
  const [min, max] = [Math.min(w, h), Math.max(w, h)];
  if (min === 440 && max === 956) return 'iPhone 16 Pro Max';
  if (min === 402 && max === 874) return 'iPhone 16 Pro';
  if (min === 430 && max === 932) return pr >= 3 ? 'iPhone 15 Pro Max / 14 Pro Max' : 'iPhone 15 Plus';
  if (min === 393 && max === 852) return 'iPhone 15 / 15 Pro / 14 Pro';
  if (min === 428 && max === 926) return 'iPhone 14 Plus / 13 Pro Max / 12 Pro Max';
  if (min === 390 && max === 844) return 'iPhone 14 / 13 / 13 Pro / 12 / 12 Pro';
  if (min === 375 && max === 812) return pr === 3 ? 'iPhone 13 mini / 12 mini / X / XS / 11 Pro' : 'iPhone';
  if (min === 414 && max === 896) return pr === 3 ? 'iPhone 11 Pro Max / XS Max' : 'iPhone 11 / XR';
  if (min === 414 && max === 736) return 'iPhone 8 Plus / 7 Plus / 6s Plus';
  if (min === 375 && max === 667) return 'iPhone SE (2nd/3rd Gen) / 8 / 7';
  if (min === 320 && max === 568) return 'iPhone SE (1st Gen) / 5s';
  return 'Apple iPhone';
}

// Known Android model brand map
function formatAndroidModel(rawModel: string): string {
  const m = rawModel.trim();
  // Samsung models (SM-xxxx)
  if (/^SM-S928/i.test(m)) return 'Samsung Galaxy S24 Ultra';
  if (/^SM-S926/i.test(m)) return 'Samsung Galaxy S24+';
  if (/^SM-S921/i.test(m)) return 'Samsung Galaxy S24';
  if (/^SM-S918/i.test(m)) return 'Samsung Galaxy S23 Ultra';
  if (/^SM-S916/i.test(m)) return 'Samsung Galaxy S23+';
  if (/^SM-S911/i.test(m)) return 'Samsung Galaxy S23';
  if (/^SM-S908/i.test(m)) return 'Samsung Galaxy S22 Ultra';
  if (/^SM-F946/i.test(m)) return 'Samsung Galaxy Z Fold 5';
  if (/^SM-F731/i.test(m)) return 'Samsung Galaxy Z Flip 5';
  if (/^SM-A/i.test(m)) return `Samsung Galaxy A-Series (${m})`;
  if (/^SM-/i.test(m)) return `Samsung Device (${m})`;

  // Google Pixel
  if (/pixel\s*8\s*pro/i.test(m)) return 'Google Pixel 8 Pro';
  if (/pixel\s*8/i.test(m)) return 'Google Pixel 8';
  if (/pixel\s*7\s*pro/i.test(m)) return 'Google Pixel 7 Pro';
  if (/pixel\s*7a/i.test(m)) return 'Google Pixel 7a';
  if (/pixel\s*7/i.test(m)) return 'Google Pixel 7';
  if (/pixel\s*6/i.test(m)) return 'Google Pixel 6';
  if (/pixel/i.test(m)) return `Google ${m}`;

  // Xiaomi / Redmi
  if (/23127PN0CG|Xiaomi\s*14/i.test(m)) return 'Xiaomi 14';
  if (/2211133G|Xiaomi\s*13/i.test(m)) return 'Xiaomi 13';
  if (/redmi/i.test(m)) return m;
  if (/poco/i.test(m)) return m;

  return m;
}

export async function detectRealDevice(): Promise<DeviceInfo> {
  const ua = navigator.userAgent;
  const w = window.screen.width;
  const h = window.screen.height;
  const pixelRatio = window.devicePixelRatio || 1;
  const hasTouch = navigator.maxTouchPoints > 0;

  // 1. Check User-Agent Client Hints (Modern Chrome / Edge / Android)
  let highEntropy: any = null;
  const navAny = navigator as any;
  if (navAny.userAgentData && typeof navAny.userAgentData.getHighEntropyValues === 'function') {
    try {
      highEntropy = await navAny.userAgentData.getHighEntropyValues([
        'model',
        'platform',
        'platformVersion',
        'architecture',
        'bitness',
      ]);
    } catch {
      // ignore
    }
  }

  // 2. Identify Device Type
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua)
    || (navigator.platform === 'MacIntel' && hasTouch && Math.max(w, h) >= 1024);
  const isMobile = !isTablet && (/Mobi|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || (highEntropy?.mobile ?? false));
  let deviceType: DeviceInfo['deviceType'] = 'Desktop';
  if (isTablet) deviceType = 'Tablet';
  else if (isMobile) deviceType = 'Mobile';
  else if (hasTouch && Math.max(w, h) < 1440) deviceType = 'Laptop';
  else deviceType = 'Desktop';

  // 3. Identify OS & Version
  let os = 'Unknown OS';
  if (/Windows NT 10.0/i.test(ua) || highEntropy?.platform === 'Windows') {
    // Check if Windows 11 using platformVersion in Client Hints (version >= 13 is Win 11)
    const ver = highEntropy?.platformVersion ? parseInt(highEntropy.platformVersion.split('.')[0], 10) : 0;
    if (ver >= 13) {
      os = 'Windows 11';
    } else {
      os = 'Windows 10 / 11';
    }
  } else if (/Windows NT 6.3/i.test(ua)) os = 'Windows 8.1';
  else if (/Windows NT 6.2/i.test(ua)) os = 'Windows 8';
  else if (/Windows NT 6.1/i.test(ua)) os = 'Windows 7';
  else if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && hasTouch)) {
    const match = ua.match(/OS (\d+[._]\d+([._]\d+)?)/);
    const v = match ? match[1].replace(/_/g, '.') : '';
    os = /iPad/i.test(ua) || (navigator.platform === 'MacIntel' && hasTouch)
      ? `iPadOS ${v}`.trim()
      : `iOS ${v}`.trim();
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    const match = ua.match(/Mac OS X (\d+[._]\d+([._]\d+)?)/);
    const v = match ? match[1].replace(/_/g, '.') : '';
    os = `macOS ${v}`.trim() || 'macOS';
  } else if (/Android/i.test(ua)) {
    const match = ua.match(/Android\s+([0-9.]+)/i);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (/CrOS/i.test(ua)) os = 'ChromeOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  // 4. Identify Device Name / Model
  let deviceName = '';

  // Case A: High-Entropy Model available (Android phones or laptops)
  if (highEntropy?.model && highEntropy.model.trim()) {
    deviceName = formatAndroidModel(highEntropy.model);
  }

  // Case B: Apple devices
  if (!deviceName) {
    if (/iPhone/i.test(ua)) {
      deviceName = getIPhoneModel(w, h, pixelRatio);
    } else if (/iPad/i.test(ua) || (navigator.platform === 'MacIntel' && hasTouch)) {
      deviceName = Math.max(w, h) >= 1366 ? 'iPad Pro 12.9"' : Math.max(w, h) >= 1194 ? 'iPad Pro 11"' : 'Apple iPad';
    } else if (/Macintosh|Mac OS X/i.test(ua)) {
      const gpu = getGpuRenderer() || '';
      if (/Apple M\d/i.test(gpu)) {
        const chip = gpu.match(/Apple M\d(\s+(Pro|Max|Ultra))?/)?.[0] || 'Apple Silicon';
        deviceName = `Apple Mac (${chip})`;
      } else {
        deviceName = 'Apple Mac';
      }
    }
  }

  // Case C: Android UA parsing
  if (!deviceName && /Android/i.test(ua)) {
    const androidMatch = ua.match(/;\s*([^;]+?)\s+Build\//i) || ua.match(/\(([^;]+);\s*([^;]+);\s*([^;)]+)\)/);
    if (androidMatch) {
      const raw = androidMatch[1].includes('Android') ? androidMatch[3] || androidMatch[2] : androidMatch[1];
      if (raw) deviceName = formatAndroidModel(raw.trim());
    }
    if (!deviceName) deviceName = 'Android Device';
  }

  // Case D: Windows PC
  if (!deviceName && (/Windows/i.test(os) || /Windows/i.test(ua))) {
    const arch = highEntropy?.architecture || (/WOW64|Win64|x64/i.test(ua) ? 'x64' : 'x86');
    const gpu = getGpuRenderer() || '';
    if (gpu.includes('NVIDIA') || gpu.includes('Radeon') || gpu.includes('RTX') || gpu.includes('GTX')) {
      deviceName = `Windows Gaming / Performance PC (${arch})`;
    } else {
      deviceName = `Windows PC (${arch})`;
    }
  }

  // Fallback
  if (!deviceName) {
    deviceName = `${os} ${deviceType}`;
  }

  // 5. Identify Browser
  let browser = 'Unknown Browser';
  if (/Edg\//i.test(ua)) {
    const v = ua.match(/Edg\/([0-9.]+)/)?.[1] || '';
    browser = `Microsoft Edge ${v.split('.')[0]}`;
  } else if (/OPR\/|Opera\//i.test(ua)) {
    const v = ua.match(/(?:OPR|Opera)\/([0-9.]+)/)?.[1] || '';
    browser = `Opera ${v.split('.')[0]}`;
  } else if (/SamsungBrowser\//i.test(ua)) {
    const v = ua.match(/SamsungBrowser\/([0-9.]+)/)?.[1] || '';
    browser = `Samsung Internet ${v.split('.')[0]}`;
  } else if (/Chrome\//i.test(ua)) {
    const v = ua.match(/Chrome\/([0-9.]+)/)?.[1] || '';
    browser = `Google Chrome ${v.split('.')[0]}`;
  } else if (/Firefox\//i.test(ua)) {
    const v = ua.match(/Firefox\/([0-9.]+)/)?.[1] || '';
    browser = `Mozilla Firefox ${v.split('.')[0]}`;
  } else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) {
    const v = ua.match(/Version\/([0-9.]+)/)?.[1] || '';
    browser = `Apple Safari ${v.split('.')[0]}`;
  }

  // 6. GPU
  const gpu = getGpuRenderer();

  // 7. CPU & RAM
  const cpuCores = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} Logical Cores` : undefined;
  const ram = navAny.deviceMemory ? `>= ${navAny.deviceMemory} GB RAM` : undefined;

  // 8. Screen & Display Scale
  const scalePct = Math.round(pixelRatio * 100);
  const displayScale = `${pixelRatio}x (${scalePct}%)`;
  const screen = `${w} × ${h} px (${window.screen.colorDepth}-bit)`;

  // 9. Network
  let network = navigator.onLine ? 'Connected' : 'Offline';
  const conn = navAny.connection || navAny.mozConnection || navAny.webkitConnection;
  if (conn?.effectiveType) {
    network = `Online (${conn.effectiveType.toUpperCase()}${conn.downlink ? ` ~${conn.downlink} Mbps` : ''})`;
  }

  // 10. Battery (optional)
  let battery: string | undefined = undefined;
  if (typeof navAny.getBattery === 'function') {
    try {
      const b = await navAny.getBattery();
      const pct = Math.round(b.level * 100);
      battery = `${pct}% ${b.charging ? '⚡ Charging' : '🔋'}`;
    } catch {
      // ignore
    }
  }

  // 11. Locale & Timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
  const language = navigator.language || 'English';

  return {
    deviceName,
    deviceType,
    os,
    browser,
    gpu,
    cpuCores,
    ram,
    screen,
    displayScale,
    touchSupport: hasTouch ? `Supported (${navigator.maxTouchPoints} touch points)` : 'None (Mouse / Keyboard)',
    network,
    timezone,
    language,
    battery,
    userAgent: ua,
  };
}
