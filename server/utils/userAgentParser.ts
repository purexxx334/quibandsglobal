export interface ParsedUserAgent {
  browser: string;
  operatingSystem: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
}

export function parseUserAgent(uaString?: string): ParsedUserAgent {
  if (!uaString) {
    return {
      browser: 'Unknown Browser',
      operatingSystem: 'Unknown OS',
      deviceType: 'desktop',
    };
  }

  const ua = uaString.toLowerCase();

  // 1. Determine Operating System
  let operatingSystem = 'Unknown OS';
  if (ua.includes('windows nt 10.0')) operatingSystem = 'Windows 10/11';
  else if (ua.includes('windows nt 6.3')) operatingSystem = 'Windows 8.1';
  else if (ua.includes('windows nt 6.1')) operatingSystem = 'Windows 7';
  else if (ua.includes('windows')) operatingSystem = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os x')) operatingSystem = 'macOS';
  else if (ua.includes('iphone')) operatingSystem = 'iOS (iPhone)';
  else if (ua.includes('ipad')) operatingSystem = 'iPadOS';
  else if (ua.includes('android')) operatingSystem = 'Android';
  else if (ua.includes('linux')) operatingSystem = 'Linux';

  // 2. Determine Browser
  let browser = 'Unknown Browser';
  if (ua.includes('edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('chrome/') && !ua.includes('edg/')) browser = 'Google Chrome';
  else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Apple Safari';
  else if (ua.includes('firefox/')) browser = 'Mozilla Firefox';
  else if (ua.includes('opera/') || ua.includes('opr/')) browser = 'Opera';

  // 3. Determine Device Type
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'tablet';
  } else if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
    deviceType = 'mobile';
  }

  return {
    browser,
    operatingSystem,
    deviceType,
  };
}
