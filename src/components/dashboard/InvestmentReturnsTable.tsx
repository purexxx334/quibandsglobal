import React from 'react';

export interface InvestmentRateRow {
  investment: string;
  totalReturn: string;
  netProfit: string;
  roi: string;
  time: string;
  profitPerHour: string;
}

export const INVESTMENT_RATES_DATA: InvestmentRateRow[] = [
  {
    investment: '$100',
    totalReturn: '$1,900 – $2,300',
    netProfit: '$1,800 – $2,200',
    roi: '1,800% – 2,200%',
    time: '3 – 4 hrs',
    profitPerHour: '$450 – $733 /h',
  },
  {
    investment: '$500',
    totalReturn: '$6,900 – $7,400',
    netProfit: '$6,400 – $6,900',
    roi: '1,280% – 1,380%',
    time: '5 – 7 hrs',
    profitPerHour: '$914 – $1,380 /h',
  },
  {
    investment: '$1,000',
    totalReturn: '$12,000 – $14,000',
    netProfit: '$11,000 – $13,000',
    roi: '1,100% – 1,300%',
    time: '7 – 9 hrs',
    profitPerHour: '$1,222 – $1,857 /h',
  },
  {
    investment: '$2,000',
    totalReturn: '$24,000 – $28,000',
    netProfit: '$22,000 – $26,000',
    roi: '1,100% – 1,300%',
    time: '9 – 11 hrs',
    profitPerHour: '$2,000 – $2,889 /h',
  },
  {
    investment: '$3,000',
    totalReturn: '$36,000 – $42,000',
    netProfit: '$33,000 – $39,000',
    roi: '1,100% – 1,300%',
    time: '11 – 13 hrs',
    profitPerHour: '$2,538 – $3,545 /h',
  },
  {
    investment: '$4,000',
    totalReturn: '$48,000 – $56,000',
    netProfit: '$44,000 – $52,000',
    roi: '1,100% – 1,300%',
    time: '13 – 15 hrs',
    profitPerHour: '$2,933 – $4,000 /h',
  },
  {
    investment: '$5,000',
    totalReturn: '$60,000 – $70,000',
    netProfit: '$55,000 – $65,000',
    roi: '1,100% – 1,300%',
    time: '15 – 17 hrs',
    profitPerHour: '$3,235 – $4,333 /h',
  },
  {
    investment: '$6,000',
    totalReturn: '$72,000 – $84,000',
    netProfit: '$66,000 – $78,000',
    roi: '1,100% – 1,300%',
    time: '17 – 19 hrs',
    profitPerHour: '$3,474 – $4,588 /h',
  },
  {
    investment: '$7,000',
    totalReturn: '$84,000 – $98,000',
    netProfit: '$77,000 – $91,000',
    roi: '1,100% – 1,300%',
    time: '19 – 21 hrs',
    profitPerHour: '$3,667 – $4,789 /h',
  },
  {
    investment: '$8,000',
    totalReturn: '$96,000 – $112,000',
    netProfit: '$88,000 – $104,000',
    roi: '1,100% – 1,300%',
    time: '21 – 23 hrs',
    profitPerHour: '$3,826 – $4,952 /h',
  },
  {
    investment: '$9,000',
    totalReturn: '$108,000 – $126,000',
    netProfit: '$99,000 – $117,000',
    roi: '1,100% – 1,300%',
    time: '23 – 25 hrs',
    profitPerHour: '$3,960 – $5,087 /h',
  },
  {
    investment: '$10,000',
    totalReturn: '$120,000 – $140,000',
    netProfit: '$110,000 – $130,000',
    roi: '1,100% – 1,300%',
    time: '25 – 27 hrs',
    profitPerHour: '$4,074 – $5,200 /h',
  },
  {
    investment: '$12,000',
    totalReturn: '$144,000 – $168,000',
    netProfit: '$132,000 – $156,000',
    roi: '1,100% – 1,300%',
    time: '29 – 31 hrs',
    profitPerHour: '$4,258 – $5,379 /h',
  },
  {
    investment: '$15,000',
    totalReturn: '$180,000 – $210,000',
    netProfit: '$165,000 – $195,000',
    roi: '1,100% – 1,300%',
    time: '35 – 37 hrs',
    profitPerHour: '$4,459 – $5,571 /h',
  },
  {
    investment: '$20,000',
    totalReturn: '$240,000 – $280,000',
    netProfit: '$220,000 – $260,000',
    roi: '1,100% – 1,300%',
    time: '45 – 47 hrs',
    profitPerHour: '$4,681 – $5,778 /h',
  },
  {
    investment: '$25,000',
    totalReturn: '$300,000 – $350,000',
    netProfit: '$275,000 – $325,000',
    roi: '1,100% – 1,300%',
    time: '55 – 57 hrs',
    profitPerHour: '$4,825 – $5,909 /h',
  },
  {
    investment: '$30,000',
    totalReturn: '$360,000 – $420,000',
    netProfit: '$330,000 – $390,000',
    roi: '1,100% – 1,300%',
    time: '65 – 67 hrs',
    profitPerHour: '$4,925 – $6,000 /h',
  },
  {
    investment: '$50,000',
    totalReturn: '$600,000 – $700,000',
    netProfit: '$550,000 – $650,000',
    roi: '1,100% – 1,300%',
    time: '105 – 107 hrs',
    profitPerHour: '$5,140 – $6,190 /h',
  },
  {
    investment: '$100,000',
    totalReturn: '$1,200,000 – $1,400,000',
    netProfit: '$1,100,000 – $1,300,000',
    roi: '1,100% – 1,300%',
    time: '205 – 207 hrs',
    profitPerHour: '$5,314 – $6,341 /h',
  }
];

interface InvestmentReturnsTableProps {
  onSelectDepositPlan?: () => void;
}

export const InvestmentReturnsTable: React.FC<InvestmentReturnsTableProps> = ({ onSelectDepositPlan }) => {
  return (
    <div id="investment-returns-matrix" className="rounded-2xl bg-[#090b0e] border border-[#caa34d]/50 p-3 sm:p-5 shadow-xl space-y-3.5 relative overflow-hidden">
      
      {/* 1. Header Banner matching the picture with Gold Bitcoin Badges */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          
          {/* Left Gold Bitcoin Coin */}
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#8f6d23] via-[#e5be59] to-[#fff3a8] p-[1.5px] shadow-sm flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-full bg-[#121008] border border-[#e5be59]/40 flex items-center justify-center text-[#e5be59] font-black text-xs sm:text-sm">
              ₿
            </div>
          </div>

          <h2 className="text-sm sm:text-lg md:text-xl font-black tracking-wide uppercase font-['Outfit']">
            <span className="text-white">INVESTMENT RETURNS, </span>
            <span className="text-[#caa34d]">ROI &amp; HOURLY RATE</span>
          </h2>

          {/* Right Gold Bitcoin Coin */}
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#8f6d23] via-[#e5be59] to-[#fff3a8] p-[1.5px] shadow-sm flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-full bg-[#121008] border border-[#e5be59]/40 flex items-center justify-center text-[#e5be59] font-black text-xs sm:text-sm">
              ₿
            </div>
          </div>

        </div>
      </div>

      {/* 2. Compact Scrollable Table Container */}
      <div className="overflow-x-auto max-h-[380px] overflow-y-auto rounded-xl border border-[#caa34d]/40 shadow-inner bg-[#040608] custom-scrollbar">
        <table className="w-full text-center border-collapse font-mono text-[11px] sm:text-xs">
          
          {/* Sticky Header Row */}
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-[#caa34d]/40 bg-[#0d1017]">
              
              {/* Col 1: Investment (USD) */}
              <th className="py-2.5 px-2 sm:px-3 border-r border-[#caa34d]/40 text-center font-bold">
                <div className="flex items-center justify-center gap-1 text-[#caa34d]">
                  <span className="text-[11px]">💰</span>
                  <div>
                    <span className="block font-bold text-white text-[10px] sm:text-[11px] leading-tight">INVESTMENT</span>
                    <span className="block text-[8px] text-slate-400 font-normal leading-none">(USD)</span>
                  </div>
                </div>
              </th>

              {/* Col 2: Total Return (USD) */}
              <th className="py-2.5 px-2 sm:px-3 border-r border-[#caa34d]/40 text-center font-bold">
                <div className="flex items-center justify-center gap-1 text-[#caa34d]">
                  <span className="text-[11px]">📈</span>
                  <div>
                    <span className="block font-bold text-white text-[10px] sm:text-[11px] leading-tight">TOTAL RETURN</span>
                    <span className="block text-[8px] text-slate-400 font-normal leading-none">(USD)</span>
                  </div>
                </div>
              </th>

              {/* Col 3: Net Profit (USD) */}
              <th className="py-2.5 px-2 sm:px-3 border-r border-[#caa34d]/40 text-center font-bold">
                <div className="flex items-center justify-center gap-1 text-[#caa34d]">
                  <span className="text-[11px] text-[#caa34d]">💲</span>
                  <div>
                    <span className="block font-bold text-white text-[10px] sm:text-[11px] leading-tight">NET PROFIT</span>
                    <span className="block text-[8px] text-slate-400 font-normal leading-none">(RETURN - INVESTMENT)</span>
                  </div>
                </div>
              </th>

              {/* Col 4: % ROI */}
              <th className="py-2.5 px-2 sm:px-3 border-r border-[#caa34d]/40 text-center font-bold">
                <div className="flex items-center justify-center gap-1 text-[#caa34d]">
                  <span className="text-[11px] font-bold text-[#caa34d]">%</span>
                  <div>
                    <span className="block font-bold text-[#caa34d] text-[10px] sm:text-[11px] leading-tight">ROI</span>
                    <span className="block text-[8px] text-slate-400 font-normal leading-none">(PROFIT %)</span>
                  </div>
                </div>
              </th>

              {/* Col 5: Time */}
              <th className="py-2.5 px-2 sm:px-3 border-r border-[#caa34d]/40 text-center font-bold">
                <div className="flex items-center justify-center gap-1 text-[#caa34d]">
                  <span className="text-[11px]">🕒</span>
                  <div>
                    <span className="block font-bold text-white text-[10px] sm:text-[11px] leading-tight">TIME</span>
                    <span className="block text-[8px] text-slate-400 font-normal leading-none">(MAX DURATION)</span>
                  </div>
                </div>
              </th>

              {/* Col 6: Profit per hour (USD) */}
              <th className="py-2.5 px-2 sm:px-3 text-center font-bold">
                <div className="flex items-center justify-center gap-1 text-[#caa34d]">
                  <span className="text-[11px]">⚡</span>
                  <div>
                    <span className="block font-bold text-white text-[10px] sm:text-[11px] leading-tight">PROFIT / HOUR</span>
                    <span className="block text-[8px] text-slate-400 font-normal leading-none">(USD)</span>
                  </div>
                </div>
              </th>

            </tr>
          </thead>

          {/* Compact Table Body */}
          <tbody className="divide-y divide-[#caa34d]/25">
            {INVESTMENT_RATES_DATA.map((row, idx) => (
              <tr 
                key={idx}
                className="hover:bg-[#caa34d]/10 transition-colors duration-100"
              >
                {/* Investment in Gold */}
                <td className="py-1.5 sm:py-2 px-2 sm:px-3 font-bold text-[#caa34d] text-xs sm:text-sm border-r border-[#caa34d]/25 whitespace-nowrap">
                  {row.investment}
                </td>

                {/* Total Return in White */}
                <td className="py-1.5 sm:py-2 px-2 sm:px-3 font-medium text-white border-r border-[#caa34d]/25 whitespace-nowrap">
                  {row.totalReturn}
                </td>

                {/* Net Profit in White */}
                <td className="py-1.5 sm:py-2 px-2 sm:px-3 font-medium text-white border-r border-[#caa34d]/25 whitespace-nowrap">
                  {row.netProfit}
                </td>

                {/* ROI in Vibrant Green */}
                <td className="py-1.5 sm:py-2 px-2 sm:px-3 font-bold text-[#4ade80] border-r border-[#caa34d]/25 whitespace-nowrap">
                  {row.roi}
                </td>

                {/* Time in White */}
                <td className="py-1.5 sm:py-2 px-2 sm:px-3 font-medium text-white border-r border-[#caa34d]/25 whitespace-nowrap">
                  {row.time}
                </td>

                {/* Profit Per Hour in Vibrant Green */}
                <td className="py-1.5 sm:py-2 px-2 sm:px-3 font-bold text-[#4ade80] whitespace-nowrap">
                  {row.profitPerHour}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Optional Compact Deposit Action Button */}
      {onSelectDepositPlan && (
        <div className="text-center pt-1">
          <button
            onClick={onSelectDepositPlan}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#e5be59] via-[#caa34d] to-[#9b7b2c] hover:from-[#f3ce6d] hover:to-[#b38f38] text-dark-950 font-bold text-xs font-mono uppercase tracking-wider shadow-md shadow-[#caa34d]/15 transition-all transform active:scale-95 cursor-pointer"
          >
            Deposit &amp; Start Mining
          </button>
        </div>
      )}

    </div>
  );
};
