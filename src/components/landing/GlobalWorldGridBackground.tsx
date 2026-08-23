import React from 'react';

interface DataCenterNode {
  id: string;
  name: string;
  country: string;
  x: number; // percentage on SVG coordinate system 0-1000
  y: number; // percentage on SVG coordinate system 0-500
  hashrate: string;
  status: 'active' | 'synced';
  type: string;
}

export const GlobalWorldGridBackground: React.FC = () => {
  // Key global green-energy and institutional datacenter hubs
  const nodes: DataCenterNode[] = [
    { id: 'is', name: 'Reykjavik Hub', country: 'Iceland (Geothermal)', x: 440, y: 110, hashrate: '168.4 EH/s', status: 'active', type: 'Primary Hydro' },
    { id: 'no', name: 'Oslo Array', country: 'Norway (Alpine Hydro)', x: 510, y: 125, hashrate: '112.1 EH/s', status: 'active', type: 'Immersion Sub' },
    { id: 'ch', name: 'Zurich Vault', country: 'Switzerland (Cold Storage)', x: 505, y: 175, hashrate: 'Multi-Sig Key', status: 'synced', type: 'Custody Vault' },
    { id: 'us-tx', name: 'Texas Grid', country: 'USA (Solar Hybrid)', x: 230, y: 220, hashrate: '94.8 EH/s', status: 'active', type: 'ASIC Array' },
    { id: 'us-wa', name: 'Washington Site', country: 'USA (Columbia River)', x: 190, y: 160, hashrate: '62.5 EH/s', status: 'active', type: 'Hydro Cluster' },
    { id: 'sg', name: 'Singapore Gateway', country: 'Singapore (Asia Relay)', x: 770, y: 310, hashrate: 'Low Latency', status: 'synced', type: 'Routing Node' },
    { id: 'jp', name: 'Tokyo Terminal', country: 'Japan (Pacific Edge)', x: 860, y: 200, hashrate: 'Telemetry API', status: 'synced', type: 'Edge Oracle' },
    { id: 'ae', name: 'Dubai Relay', country: 'UAE (Middle East Gateway)', x: 615, y: 235, hashrate: 'Zero-Tax Settlement', status: 'synced', type: 'Treasury Node' }
  ];

  // Connections between mining hubs
  const connections = [
    { from: [440, 110], to: [510, 125] }, // Iceland -> Norway
    { from: [440, 110], to: [190, 160] }, // Iceland -> US West
    { from: [510, 125], to: [505, 175] }, // Norway -> Switzerland
    { from: [190, 160], to: [230, 220] }, // US West -> Texas
    { from: [505, 175], to: [615, 235] }, // Switzerland -> Dubai
    { from: [615, 235], to: [770, 310] }, // Dubai -> Singapore
    { from: [770, 310], to: [860, 200] }, // Singapore -> Tokyo
    { from: [440, 110], to: [230, 220] }, // Iceland -> Texas
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      
      {/* 1. Global Ambient Floating Light Orbs */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[750px] h-[500px] bg-gradient-to-b from-gold-500/15 via-amber-600/10 to-transparent rounded-full glow-orb animate-pulse-slow" />
      <div className="absolute top-1/4 -left-40 w-[550px] h-[550px] bg-blue-600/10 rounded-full glow-orb animate-float-delayed" />
      <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-emerald-500/10 rounded-full glow-orb animate-float-slow" />

      {/* 2. Cybernetic Precision Grid Background */}
      <div className="absolute inset-0 tech-grid-bg opacity-45" />

      {/* 3. Subtle World Dot Matrix Pattern */}
      <div className="absolute inset-0 world-map-grid opacity-25" />

      {/* 4. High-Tech Globe SVG Projection with Live Mining Nodes & Arcs */}
      <div className="absolute top-12 sm:top-6 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[460px] sm:h-[580px] opacity-40 sm:opacity-55 transition-opacity">
        <svg 
          viewBox="0 0 1000 500" 
          className="w-full h-full preserve-3d"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Golden Gradient for connecting arcs */}
            <linearGradient id="arcGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#FBDA5E" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
            </linearGradient>

            {/* Glowing filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            {/* Radial glow for nodes */}
            <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="1" />
              <stop offset="40%" stopColor="#F59E0B" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Latitude & Longitude Coordinate Circles (Radar Globe Aesthetic) */}
          <g className="stroke-white/5" fill="none" strokeWidth="1">
            <ellipse cx="500" cy="250" rx="460" ry="210" strokeDasharray="4,6" />
            <ellipse cx="500" cy="250" rx="360" ry="165" strokeDasharray="3,5" />
            <ellipse cx="500" cy="250" rx="240" ry="110" strokeDasharray="2,4" />
            <line x1="40" y1="250" x2="960" y2="250" strokeDasharray="5,5" className="stroke-gold-500/15" />
            <line x1="500" y1="40" x2="500" y2="460" strokeDasharray="5,5" className="stroke-gold-500/15" />
          </g>

          {/* Simplified Stylized World Continents Outlines (Cyber Matrix) */}
          <g fill="rgba(255, 255, 255, 0.02)" stroke="rgba(245, 158, 11, 0.18)" strokeWidth="1.2">
            {/* North America */}
            <path d="M 140,90 Q 220,70 300,100 Q 320,150 260,210 Q 220,270 190,240 Q 150,220 120,160 Z" />
            {/* South America */}
            <path d="M 270,260 Q 340,280 320,380 Q 290,440 260,450 Q 240,380 250,300 Z" />
            {/* Europe */}
            <path d="M 440,90 Q 550,80 580,140 Q 540,190 480,190 Q 430,150 440,90 Z" />
            {/* Africa */}
            <path d="M 460,200 Q 580,210 590,320 Q 550,420 500,430 Q 450,340 450,250 Z" />
            {/* Asia */}
            <path d="M 590,90 Q 820,70 880,180 Q 840,290 730,290 Q 640,240 600,160 Z" />
            {/* Australia */}
            <path d="M 770,340 Q 870,330 880,410 Q 820,440 760,400 Z" />
          </g>

          {/* Inter-Datacenter Curved Connecting Network Paths */}
          {connections.map((c, i) => {
            const midX = (c.from[0] + c.to[0]) / 2;
            const midY = (c.from[1] + c.to[1]) / 2 - 35; // Curve upward
            return (
              <g key={`conn-${i}`}>
                <path
                  d={`M ${c.from[0]},${c.from[1]} Q ${midX},${midY} ${c.to[0]},${c.to[1]}`}
                  fill="none"
                  stroke="url(#arcGold)"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                  className="opacity-70"
                />
                {/* Moving Packet Dot along path */}
                <circle r="2.5" fill="#FBDA5E" filter="url(#glow)">
                  <animateMotion
                    path={`M ${c.from[0]},${c.from[1]} Q ${midX},${midY} ${c.to[0]},${c.to[1]}`}
                    dur={`${4 + (i % 3) * 1.5}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })}

          {/* Datacenter Nodes with Pulsing Signals */}
          {nodes.map((node) => (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              {/* Outer Pulse Waves */}
              <circle r="14" fill="url(#nodeGlow)" className="animate-pulse-slow opacity-60" />
              <circle r="8" fill="none" stroke="#F59E0B" strokeWidth="1" opacity="0.6">
                <animate attributeName="r" values="4;16;4" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0;0.8" dur="3s" repeatCount="indefinite" />
              </circle>
              
              {/* Solid Core Dot */}
              <circle r="4" fill="#F8C327" filter="url(#glow)" />
              <circle r="2" fill="#FFFFFF" />

              {/* Node Label (Visible on desktop) */}
              <text
                x="8"
                y="4"
                fill="#E2E8F0"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="600"
                className="opacity-80 select-none"
              >
                {node.name}
              </text>
              <text
                x="8"
                y="14"
                fill="#F59E0B"
                fontSize="7.5"
                fontFamily="JetBrains Mono, monospace"
                className="opacity-70 select-none"
              >
                {node.hashrate}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* 5. Floating Cybernetic Telemetry Badges (Foreground Decor) */}
      <div className="hidden xl:block absolute top-36 left-12 animate-float-slow">
        <div className="px-3.5 py-2.5 rounded-xl bg-dark-900/80 border border-gold-500/30 backdrop-blur-md floating-badge flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <div className="text-left font-mono">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest">NORDIC HYDRO ARRAY</div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>280.5 EH/s</span>
              <span className="text-emerald-400 text-[10px]">100% RE</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden xl:block absolute top-56 right-12 animate-float-delayed">
        <div className="px-3.5 py-2.5 rounded-xl bg-dark-900/80 border border-emerald-500/30 backdrop-blur-md floating-badge flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-gold-400 animate-pulse" />
          <div className="text-left font-mono">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest">COLD STORAGE CUSTODY</div>
            <div className="text-xs font-bold text-gold-400">
              MULTI-SIG PROTECTED
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
