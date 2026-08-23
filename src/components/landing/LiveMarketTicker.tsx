import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Cpu, Zap, Activity } from 'lucide-react';
import { CryptoAsset } from '../../types';

export const mockCryptoMarket: CryptoAsset[] = [
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    priceUsd: 67450.80,
    change24h: 3.42,
    hashrate: '685.2 EH/s',
    algorithm: 'SHA-256',
    network: 'Bitcoin Mainnet',
    minDeposit: '0.001 BTC',
    estDailyYieldRate: 0.28,
    iconColor: '#F7931A'
  },
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    priceUsd: 3520.40,
    change24h: 2.15,
    hashrate: '1.24 TH/s (PoS Valid.)',
    algorithm: 'Ethash / PoS',
    network: 'Ethereum (ERC-20)',
    minDeposit: '0.02 ETH',
    estDailyYieldRate: 0.25,
    iconColor: '#627EEA'
  },
  {
    id: 'sol',
    name: 'Solana',
    symbol: 'SOL',
    priceUsd: 184.60,
    change24h: 5.87,
    hashrate: 'Turbine Node Matrix',
    algorithm: 'Proof of History',
    network: 'Solana Mainnet',
    minDeposit: '0.5 SOL',
    estDailyYieldRate: 0.31,
    iconColor: '#14F195'
  },
  {
    id: 'usdt',
    name: 'Tether USD',
    symbol: 'USDT',
    priceUsd: 1.00,
    change24h: 0.01,
    hashrate: 'Multi-Pool Treasury',
    algorithm: 'Tether Vault',
    network: 'TRC-20 / ERC-20 / BEP-20',
    minDeposit: '50 USDT',
    estDailyYieldRate: 0.29,
    iconColor: '#26A17B'
  },
  {
    id: 'ltc',
    name: 'Litecoin',
    symbol: 'LTC',
    priceUsd: 84.15,
    change24h: 1.45,
    hashrate: '1.18 PH/s',
    algorithm: 'Scrypt',
    network: 'Litecoin Network',
    minDeposit: '0.2 LTC',
    estDailyYieldRate: 0.26,
    iconColor: '#345D9D'
  },
  {
    id: 'bnb',
    name: 'BNB Chain',
    symbol: 'BNB',
    priceUsd: 592.30,
    change24h: -0.65,
    hashrate: 'Validator Cluster',
    algorithm: 'PoSA',
    network: 'BNB Smart Chain',
    minDeposit: '0.1 BNB',
    estDailyYieldRate: 0.27,
    iconColor: '#F3BA2F'
  }
];

export const LiveMarketTicker: React.FC = () => {
  const [items, setItems] = useState<CryptoAsset[]>(mockCryptoMarket);

  // Subtle real-time price fluctuation simulation to make the UI alive
  useEffect(() => {
    const interval = setInterval(() => {
      setItems(prev => prev.map(item => {
        if (item.symbol === 'USDT') return item;
        const delta = (Math.random() - 0.49) * (item.priceUsd * 0.001);
        const newPrice = Math.round((item.priceUsd + delta) * 100) / 100;
        return {
          ...item,
          priceUsd: newPrice
        };
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-dark-900/90 border-y border-white/5 py-2.5 overflow-hidden backdrop-blur-md relative z-20">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-4">
        
        {/* Ticker Header */}
        <div className="hidden md:flex items-center gap-2 pr-4 border-r border-white/10 text-xs font-mono text-gold-400 shrink-0">
          <Activity className="w-3.5 h-3.5 text-gold-400 animate-pulse" />
          <span className="font-semibold uppercase tracking-wider">LIVE MINING ORACLES</span>
        </div>

        {/* Scrolling Items */}
        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap w-full py-1">
          {items.concat(items).map((crypto, idx) => {
            const isPos = crypto.change24h >= 0;
            return (
              <div 
                key={`${crypto.id}-${idx}`} 
                className="flex items-center gap-2.5 px-3 py-1 rounded-lg bg-dark-850/60 border border-white/5 text-xs font-mono shrink-0 hover:border-gold-500/30 transition-colors"
              >
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: crypto.iconColor }}
                />
                <span className="font-bold text-white">{crypto.symbol}</span>
                <span className="text-slate-300 font-semibold">
                  ${crypto.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                
                <span className={`flex items-center text-[11px] font-medium ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPos ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                  {isPos ? '+' : ''}{crypto.change24h}%
                </span>

                <span className="text-[10px] text-slate-500 pl-1 border-l border-white/10">
                  {crypto.algorithm}
                </span>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
