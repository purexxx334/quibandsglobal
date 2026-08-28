/**
 * Pure Real-Time Mining Engine
 * 
 * Rules:
 * 1. Yield: Exactly 3.0% hourly rate based on active deposited capital (deposit_balance).
 * 2. Cycle: 1-hour cycle (3600 seconds), continuous and seamless across restarts/refresh.
 * 3. Single Source of Truth: (currentTimestampMs - miningStartedAtMs).
 *    Everything is purely derived from this wall-clock delta.
 */

export interface MiningSnapshot {
  isActive: boolean;
  depositBalance: number;
  miningStartedAtMs: number;
  totalElapsedSeconds: number;
  totalAccruedProfit: number;
  cycleElapsedSeconds: number;
  cycleSecondsLeft: number;
  cycleProgressPercent: number;
  cycleYieldEarned: number;
  cycleIndex: number;
  blockNumber: number;
  hourlyYieldRate: number;
  hashrate: number;
  formattedTimeLeft: string;
}

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

/**
 * Format total seconds as HH:MM:SS
 */
export function formatSecondsToHms(totalSec: number): string {
  const safeSec = Math.max(0, Math.floor(totalSec));
  const hrs = Math.floor(safeSec / 3600);
  const mins = Math.floor((safeSec % 3600) / 60);
  const secs = safeSec % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate the exact real-time mining snapshot given the user's capital and start anchor
 */
export function calculateMiningSnapshot(
  depositBalance: number,
  miningStartedAtMs: number,
  currentTimestampMs: number = Date.now()
): MiningSnapshot {
  const capital = Math.max(0, Number(depositBalance) || 0);

  if (capital <= 0 || !miningStartedAtMs || isNaN(miningStartedAtMs) || miningStartedAtMs <= 0) {
    return {
      isActive: false,
      depositBalance: 0,
      miningStartedAtMs: 0,
      totalElapsedSeconds: 0,
      totalAccruedProfit: 0,
      cycleElapsedSeconds: 0,
      cycleSecondsLeft: 3600,
      cycleProgressPercent: 0,
      cycleYieldEarned: 0,
      cycleIndex: 0,
      blockNumber: 884219,
      hourlyYieldRate: 0,
      hashrate: 0,
      formattedTimeLeft: '01:00:00',
    };
  }

  // Exact 3% of capital per 1-hour (3600s) cycle
  const hourlyYieldRate = +(capital * 0.03).toFixed(4);
  const profitPerSecond = capital * 0.03 / 3600;

  // Real-time wall-clock continuous elapsed time
  const totalElapsedSeconds = Math.max(0, Math.floor((currentTimestampMs - miningStartedAtMs) / 1000));
  const cycleElapsedSeconds = totalElapsedSeconds % 3600;
  const cycleSecondsLeft = Math.max(1, 3600 - cycleElapsedSeconds);
  const cycleProgressPercent = Math.min(100, Math.max(0, Math.round(((3600 - cycleSecondsLeft) / 3600) * 100)));

  const totalAccruedProfit = +(totalElapsedSeconds * profitPerSecond).toFixed(4);
  const cycleYieldEarned = +(cycleElapsedSeconds * profitPerSecond).toFixed(4);
  const cycleIndex = Math.floor(totalElapsedSeconds / 3600);
  const blockNumber = 884219 + cycleIndex;

  return {
    isActive: true,
    depositBalance: capital,
    miningStartedAtMs,
    totalElapsedSeconds,
    totalAccruedProfit,
    cycleElapsedSeconds,
    cycleSecondsLeft,
    cycleProgressPercent,
    cycleYieldEarned,
    cycleIndex,
    blockNumber,
    hourlyYieldRate,
    hashrate: 142.84,
    formattedTimeLeft: formatSecondsToHms(cycleSecondsLeft),
  };
}

/**
 * Backward compatibility helper for components querying tier metadata
 */
export function getMiningConfigForDeposit(depositAmount: number): MiningConfig {
  const amount = Math.max(0, depositAmount || 0);

  if (amount <= 0) {
    return {
      tierInvestment: 0,
      sessionDurationHours: 1,
      sessionDurationSeconds: 3600,
      profitPerHour: 0,
      targetSessionYield: 0,
      profitPerSecond: 0,
      roiText: '0%',
      timeRangeText: 'Standby',
      hourlyRateText: '$0.00/h',
    };
  }

  const hourlyRate = +(amount * 0.03).toFixed(4);
  const profitPerSec = +(hourlyRate / 3600).toFixed(6);

  return {
    tierInvestment: amount,
    sessionDurationHours: 1,
    sessionDurationSeconds: 3600,
    profitPerHour: hourlyRate,
    targetSessionYield: hourlyRate,
    profitPerSecond: profitPerSec,
    roiText: '3.0% / hr',
    timeRangeText: '1 hr',
    hourlyRateText: `$${hourlyRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h (3.0%)`,
  };
}
