/**
 * Mining Tier Engine - Dynamically calculates mining speed, session duration,
 * target profit, and hourly rate based on user's active deposited capital according to
 * the Investment Returns ROI & Hourly Rate Table.
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
  { minDeposit: 100, hours: 3.5, targetProfit: 2000, hourlyRate: 571.43, timeStr: '3 – 4 hrs', roiStr: '1,800% – 2,200%', hourlyStr: '$450 – $733 /h' },
  { minDeposit: 500, hours: 6.0, targetProfit: 6650, hourlyRate: 1108.33, timeStr: '5 – 7 hrs', roiStr: '1,280% – 1,380%', hourlyStr: '$914 – $1,380 /h' },
  { minDeposit: 1000, hours: 8.0, targetProfit: 12000, hourlyRate: 1500.00, timeStr: '7 – 9 hrs', roiStr: '1,100% – 1,300%', hourlyStr: '$1,222 – $1,857 /h' },
  { minDeposit: 2000, hours: 10.0, targetProfit: 24000, hourlyRate: 2400.00, timeStr: '9 – 11 hrs', roiStr: '1,100% – 1,300%', hourlyStr: '$2,000 – $2,889 /h' },
  { minDeposit: 3000, hours: 12.0, targetProfit: 36000, hourlyRate: 3000.00, timeStr: '11 – 13 hrs', roiStr: '1,100% – 1,300%', hourlyStr: '$2,538 – $3,545 /h' },
  { minDeposit: 4000, hours: 14.0, targetProfit: 48000, hourlyRate: 3428.57, timeStr: '13 – 15 hrs', roiStr: '1,100% – 1,300%', hourlyStr: '$2,933 – $4,000 /h' },
  { minDeposit: 5000, hours: 16.0, targetProfit: 60000, hourlyRate: 3750.00, timeStr: '15 – 17 hrs', roiStr: '1,100% – 1,300%', hourlyStr: '$3,235 – $4,333 /h' },
  { minDeposit: 6000, hours: 18.0, targetProfit: 72000, hourlyRate: 4000.00, timeStr: '17 – 19 hrs', roiStr: '1,100% – 1,300%', hourlyStr: '$3,474 – $4,588 /h' },
  { minDeposit: 7000, hours: 20.0, targetProfit: 84000, hourlyRate: 4200.00, timeStr: '19 – 21 hrs', roiStr: '1,100% – 1,300%', hourlyStr: '$3,667 – $4,789 /h' },
  { minDeposit: 8000, hours: 22.0, targetProfit: 96000, hourlyRate: 4363.64, timeStr: '21 – 23 hrs', roiStr: '1,100% – 1,300%', hourlyStr: '$3,826 – $4,952 /h' },
  { minDeposit: 9000, hours: 24.0, targetProfit: 108000, hourlyRate: 4500.00, timeStr: '23 – 25 hrs', roiStr: '1,100% – 1,300%', hourlyStr: '$3,960 – $5,087 /h' },
  { minDeposit: 10000, hours: 26.0, targetProfit: 120000, hourlyRate: 4615.38, timeStr: '25 – 27 hrs', roiStr: '1,100% – 1,300%', hourlyStr: '$4,074 – $5,200 /h' },
  { minDeposit: 12000, hours: 30.0, targetProfit: 144000, hourlyRate: 4800.00, timeStr: '29 – 31 hrs', roiStr: '1,100% – 1,300%', hourlyStr: '$4,258 – $5,379 /h' },
  { minDeposit: 15000, hours: 36.0, targetProfit: 180000, hourlyRate: 5000.00, timeStr: '35 – 37 hrs', roiStr: '1,100% – 1,300%', hourlyStr: '$4,459 – $5,571 /h' },
  { minDeposit: 20000, hours: 46.0, targetProfit: 240000, hourlyRate: 5217.39, timeStr: '45 – 47 hrs', roiStr: '1,100% – 1,300%', hourlyStr: '$4,681 – $5,778 /h' },
  { minDeposit: 25000, hours: 56.0, targetProfit: 300000, hourlyRate: 5357.14, timeStr: '55 – 57 hrs', roiStr: '1,100% – 1,300%', hourlyStr: '$4,825 – $5,909 /h' },
  { minDeposit: 30000, hours: 66.0, targetProfit: 360000, hourlyRate: 5454.55, timeStr: '65 – 67 hrs', roiStr: '1,100% – 1,300%', hourlyStr: '$4,925 – $6,000 /h' },
  { minDeposit: 50000, hours: 106.0, targetProfit: 600000, hourlyRate: 5660.38, timeStr: '105 – 107 hrs', roiStr: '1,100% – 1,300%', hourlyStr: '$5,140 – $6,190 /h' },
  { minDeposit: 100000, hours: 206.0, targetProfit: 1200000, hourlyRate: 5825.24, timeStr: '205 – 207 hrs', roiStr: '1,100% – 1,300%', hourlyStr: '$5,314 – $6,341 /h' },
];

/**
 * Get mining configuration for a specific deposit amount
 */
export function getMiningConfigForDeposit(depositAmount: number): MiningConfig {
  const amount = Math.max(0, depositAmount);

  if (amount <= 0) {
    return {
      tierInvestment: 0,
      sessionDurationHours: 3.5,
      sessionDurationSeconds: 12600,
      profitPerHour: 0,
      targetSessionYield: 0,
      profitPerSecond: 0,
      roiText: '0%',
      timeRangeText: 'Standby',
      hourlyRateText: '$0.00/h',
    };
  }

  // Find the highest tier that matches the deposit amount
  let matchedTier = MINING_TIERS_CONFIG[0];
  for (let i = MINING_TIERS_CONFIG.length - 1; i >= 0; i--) {
    if (amount >= MINING_TIERS_CONFIG[i].minDeposit) {
      matchedTier = MINING_TIERS_CONFIG[i];
      break;
    }
  }

  // If deposit is less than the minimum tier ($100), scale down proportionally from $100 tier
  const scale = amount < 100 ? amount / 100 : 1;
  const targetProfit = +(matchedTier.targetProfit * scale).toFixed(2);
  const hourlyRate = +(matchedTier.hourlyRate * scale).toFixed(2);
  const durationSec = Math.round(matchedTier.hours * 3600);

  return {
    tierInvestment: matchedTier.minDeposit,
    sessionDurationHours: matchedTier.hours,
    sessionDurationSeconds: durationSec,
    profitPerHour: hourlyRate,
    targetSessionYield: targetProfit,
    profitPerSecond: +(hourlyRate / 3600).toFixed(6),
    roiText: matchedTier.roiStr,
    timeRangeText: matchedTier.timeStr,
    hourlyRateText: matchedTier.hourlyStr,
  };
}
