/**
 * Mining Tier Engine - Dynamically calculates mining speed, session duration,
 * target profit, and hourly rate based on user's active deposited capital (3% per hour).
 */

export interface MiningConfig {
  tierInvestment: number;
  sessionDurationHours: number;
  sessionDurationSeconds: number;
  profitPerHour: number;
  targetSessionYield: number;
  profitPerSecond: number;
  roiText: string;
  timeRangeText: string;
  hourlyRateText: string;
}

export const MINING_TIERS_CONFIG = [
  { minDeposit: 100, hours: 24, timeStr: '24 hrs', roiStr: '72% / day', hourlyRate: 3.00, hourlyStr: '$3.00/h (3%)' },
  { minDeposit: 500, hours: 24, timeStr: '24 hrs', roiStr: '72% / day', hourlyRate: 15.00, hourlyStr: '$15.00/h (3%)' },
  { minDeposit: 1000, hours: 24, timeStr: '24 hrs', roiStr: '72% / day', hourlyRate: 30.00, hourlyStr: '$30.00/h (3%)' },
  { minDeposit: 2000, hours: 24, timeStr: '24 hrs', roiStr: '72% / day', hourlyRate: 60.00, hourlyStr: '$60.00/h (3%)' },
  { minDeposit: 3000, hours: 24, timeStr: '24 hrs', roiStr: '72% / day', hourlyRate: 90.00, hourlyStr: '$90.00/h (3%)' },
  { minDeposit: 4000, hours: 24, timeStr: '24 hrs', roiStr: '72% / day', hourlyRate: 120.00, hourlyStr: '$120.00/h (3%)' },
  { minDeposit: 5000, hours: 24, timeStr: '24 hrs', roiStr: '72% / day', hourlyRate: 150.00, hourlyStr: '$150.00/h (3%)' },
  { minDeposit: 10000, hours: 24, timeStr: '24 hrs', roiStr: '72% / day', hourlyRate: 300.00, hourlyStr: '$300.00/h (3%)' },
  { minDeposit: 20000, hours: 24, timeStr: '24 hrs', roiStr: '72% / day', hourlyRate: 600.00, hourlyStr: '$600.00/h (3%)' },
  { minDeposit: 50000, hours: 24, timeStr: '24 hrs', roiStr: '72% / day', hourlyRate: 1500.00, hourlyStr: '$1,500.00/h (3%)' },
  { minDeposit: 100000, hours: 24, timeStr: '24 hrs', roiStr: '72% / day', hourlyRate: 3000.00, hourlyStr: '$3,000.00/h (3%)' },
];

/**
 * Get mining configuration for a specific deposit amount (Exact 3.0% of capital per hour)
 */
export function getMiningConfigForDeposit(depositAmount: number): MiningConfig {
  const amount = Math.max(0, depositAmount);

  if (amount <= 0) {
    return {
      tierInvestment: 0,
      sessionDurationHours: 24,
      sessionDurationSeconds: 86400,
      profitPerHour: 0,
      targetSessionYield: 0,
      profitPerSecond: 0,
      roiText: '0%',
      timeRangeText: 'Standby',
      hourlyRateText: '$0.00/h',
    };
  }

  // Exact 3% per hour on active capital
  const hourlyRate = +(amount * 0.03).toFixed(4); // 3.0% per hour
  const profitPerSec = +(hourlyRate / 3600).toFixed(6); // exact rate per second
  const sessionHours = 24; // 24h continuous block cycle
  const durationSec = sessionHours * 3600;
  const targetProfit = +(hourlyRate * sessionHours).toFixed(2); // 72% per 24 hours

  return {
    tierInvestment: amount,
    sessionDurationHours: sessionHours,
    sessionDurationSeconds: durationSec,
    profitPerHour: hourlyRate,
    targetSessionYield: targetProfit,
    profitPerSecond: profitPerSec,
    roiText: '72% / 24h (3% / hr)',
    timeRangeText: '24 hrs',
    hourlyRateText: `$${hourlyRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h (3.0%)`,
  };
}

