"use client";

import { useState } from "react";
import { DollarSign, TrendingUp, Users, Zap } from "lucide-react";

interface PlanSummary {
  key: string;
  name: string;
  price: number | null;
  calls: number | null;
}

export function RoiCalculator({ plans }: { plans: PlanSummary[] }) {
  const [calls, setCalls] = useState(500);
  const [humanRate, setHumanRate] = useState(30);

  const callsPerHourPerPerson = 7.5;
  const costPerCall = 0.35;
  const humanCostPerCall = humanRate / callsPerHourPerPerson;

  const skawkCost = calls * costPerCall;
  const humanCost = calls * humanCostPerCall;
  const savings = humanCost - skawkCost;
  const roi = skawkCost > 0 ? Math.round((savings / skawkCost) * 100) : 0;
  const humanDays = Math.ceil(calls / 60);

  // Recommend a plan based on call volume
  const recommended = plans
    .filter((p) => p.calls !== null && p.calls >= calls)
    .sort((a, b) => (a.calls ?? 0) - (b.calls ?? 0))[0]
    ?? plans.find((p) => p.key === "enterprise")
    ?? plans[plans.length - 1];

  return (
    <section className="py-24 px-6 bg-[#0D1117]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-bold text-primary uppercase tracking-wider mb-3">
            ROI Calculator
          </p>
          <h2 className="text-4xl font-black text-white mb-4">
            See what you save
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">
            Compare the cost of a human team vs Skawk for your call volume.
          </p>
        </div>

        <div className="bg-[#161b22] border border-[#21262d] rounded-2xl p-8">
          {/* Sliders */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-white/50">Monthly calls</p>
                <p className="text-lg font-bold text-white">{calls.toLocaleString()}</p>
              </div>
              <input
                type="range"
                min={50}
                max={10000}
                step={50}
                value={calls}
                onChange={(e) => setCalls(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #e85d04 ${(calls / 10000) * 100}%, rgba(255,255,255,0.1) 0%)`,
                }}
              />
              <div className="flex justify-between text-xs text-white/30 mt-1">
                <span>50</span>
                <span>10,000</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-white/50">Human hourly rate</p>
                <p className="text-lg font-bold text-white">${humanRate}/hr</p>
              </div>
              <input
                type="range"
                min={15}
                max={75}
                step={5}
                value={humanRate}
                onChange={(e) => setHumanRate(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #00D4FF ${((humanRate - 15) / 60) * 100}%, rgba(255,255,255,0.1) 0%)`,
                }}
              />
              <div className="flex justify-between text-xs text-white/30 mt-1">
                <span>$15</span>
                <span>$75</span>
              </div>
            </div>
          </div>

          {/* Comparison */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 rounded-xl p-5 border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-white/40" />
                <p className="text-xs text-white/40 uppercase tracking-wider font-bold">
                  Human Team
                </p>
              </div>
              <p className="text-3xl font-black text-white">
                ${humanCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-white/30 mt-1">
                {humanDays} working days @ ${humanRate}/hr
              </p>
            </div>
            <div className="bg-primary/10 rounded-xl p-5 border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-primary" />
                <p className="text-xs text-primary uppercase tracking-wider font-bold">
                  Skawk
                </p>
              </div>
              <p className="text-3xl font-black text-primary">
                ${skawkCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-white/30 mt-1">
                Done in minutes, not days
              </p>
            </div>
          </div>

          {/* Savings bar */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-xs text-green-400 uppercase tracking-wider font-bold mb-1">
                Monthly savings
              </p>
              <p className="text-4xl font-black text-green-400">
                ${savings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-black text-green-400">{roi}%</p>
                <p className="text-xs text-green-400/60">ROI</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-white">{recommended.name}</p>
                <p className="text-xs text-white/40">Recommended plan</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-white/20 mt-4 text-center">
            Based on {callsPerHourPerPerson} calls/hr per human, 8-hour days. Skawk avg $0.35/call.
          </p>
        </div>
      </div>

      <style jsx global>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #e85d04;
          cursor: pointer;
          border: 2px solid #0D1117;
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #e85d04;
          cursor: pointer;
          border: 2px solid #0D1117;
        }
      `}</style>
    </section>
  );
}
