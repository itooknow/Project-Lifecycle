/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Project, ExecutionStatus, ProjectStatus } from "../types";
import { ProjectFinances } from "../data";
import { BarChart3, PieChart, TrendingUp, Info } from "lucide-react";

interface DashboardChartsProps {
  projects: Project[];
  finances: { [projectId: string]: ProjectFinances };
  onChartFilter: (filter: { key: string; value: string }) => void;
  activeFilter: { key: string; value: string } | null;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  projects,
  finances,
  onChartFilter,
  activeFilter,
}) => {
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  // Formatter
  const usdFormatter = {
    format: (val: number) => {
      return "₦" + Math.round(val || 0).toLocaleString("en-US");
    }
  };

  // Calculate Execution Status counts
  const executionCounts = {
    [ExecutionStatus.NOT_STARTED]: 0,
    [ExecutionStatus.IN_PROGRESS]: 0,
    [ExecutionStatus.COMPLETED]: 0,
    [ExecutionStatus.ON_HOLD]: 0,
  };

  projects.forEach((p) => {
    executionCounts[p.executionStatus] = (executionCounts[p.executionStatus] || 0) + 1;
  });

  const totalProjects = projects.length || 1;

  const segments = [
    { label: "Completed", value: executionCounts[ExecutionStatus.COMPLETED], statusKey: ExecutionStatus.COMPLETED, color: "#10b981" },
    { label: "In Progress", value: executionCounts[ExecutionStatus.IN_PROGRESS], statusKey: ExecutionStatus.IN_PROGRESS, color: "#6366f1" },
    { label: "Not Started", value: executionCounts[ExecutionStatus.NOT_STARTED], statusKey: ExecutionStatus.NOT_STARTED, color: "#94a3b8" },
    { label: "On Hold", value: executionCounts[ExecutionStatus.ON_HOLD], statusKey: ExecutionStatus.ON_HOLD, color: "#f59e0b" },
  ];

  // Projects data for comparison bar chart
  const barProjects = projects.slice(0, 5).map((p) => {
    const f = finances[p.id];
    return {
      id: p.id,
      title: p.title.length > 25 ? p.title.slice(0, 22) + "..." : p.title,
      code: p.code,
      rfq: f?.quotedAmount || 0,
      contract: f?.contractAmount || 0,
      invoiced: f?.totalInvoiced || 0,
      paid: f?.totalPaidNet || 0,
    };
  });

  // Find max value in finance for scaling
  let maxValue = 10000;
  barProjects.forEach((bp) => {
    const val = Math.max(bp.rfq, bp.contract, bp.invoiced, bp.paid);
    if (val > maxValue) {
      maxValue = val;
    }
  });
  // Add some buffer
  maxValue = maxValue * 1.1;

  // Donut chart calculations
  let accumulatedAngle = 0;
  const radius = 55;
  const strokeWidth = 24;
  const center = 80;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6" id="charts-wrapper">
      {/* Chart 1: Financial Pipeline Breakdown Bar Chart */}
      <div 
        id="financial-bar-chart-card"
        className="glass-panel p-5 rounded-3xl col-span-1 lg:col-span-2 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-white/5 text-indigo-400 rounded-lg border border-white/10">
                <BarChart3 size={16} />
              </span>
              <h3 className="text-sm font-sans font-black text-white">
                Financial Funnel Comparison (Top 5 Projects)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1">
              <Info size={10} /> Click bar to filter project
            </span>
          </div>

          {/* Bar Chart Graphics */}
          <div className="mt-4 space-y-4">
            {barProjects.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">No projects available. Create a project to populate the chart.</div>
            ) : (
              barProjects.map((bp) => {
                const rfqPct = (bp.rfq / maxValue) * 100;
                const contrPct = (bp.contract / maxValue) * 100;
                const invPct = (bp.invoiced / maxValue) * 100;
                const paidPct = (bp.paid / maxValue) * 100;

                const isCurrentFiltered = activeFilter?.key === "project" && activeFilter?.value === bp.id;

                return (
                  <div 
                    key={bp.id} 
                    className={`p-3 rounded-xl transition-all cursor-pointer ${
                      isCurrentFiltered ? "bg-white/15 border border-indigo-500/30" : "hover:bg-white/5 border border-transparent"
                    }`}
                    onClick={() => onChartFilter({ key: "project", value: bp.id })}
                    onMouseEnter={() => setHoveredBar(bp.id)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-sans font-bold text-slate-200">{bp.title}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                        {bp.code}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {/* RFQ Row */}
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono w-14 text-slate-400 text-right">RFQ</span>
                        <div className="flex-1 bg-white/5 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-slate-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${rfqPct}%` }}
                          ></div>
                        </div>
                        <span className="text-[9px] font-mono w-14 text-slate-400">{usdFormatter.format(bp.rfq)}</span>
                      </div>

                      {/* PO / Contract Row */}
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono w-14 text-slate-400 text-right">Contract</span>
                        <div className="flex-1 bg-white/5 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-full rounded-full transition-all duration-500 shadow-xs shadow-indigo-500/50"
                            style={{ width: `${contrPct}%` }}
                          ></div>
                        </div>
                        <span className="text-[9px] font-mono w-14 text-indigo-400 font-semibold">{usdFormatter.format(bp.contract)}</span>
                      </div>

                      {/* Invoiced Row */}
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-mono w-12 text-slate-400 text-right font-medium">Invoiced</span>
                        <div className="flex-1 bg-white/5 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-purple-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${invPct}%` }}
                          ></div>
                        </div>
                        <span className="text-[9px] font-mono w-14 text-purple-400">{usdFormatter.format(bp.invoiced)}</span>
                      </div>

                      {/* Paid Row */}
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono w-14 text-slate-400 text-right">Paid</span>
                        <div className="flex-1 bg-white/5 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500 shadow-xs shadow-emerald-500/50"
                            style={{ width: `${paidPct}%` }}
                          ></div>
                        </div>
                        <span className="text-[9px] font-mono w-14 text-emerald-400 font-bold">{usdFormatter.format(bp.paid)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chart Legend */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 pt-3.5 border-t border-white/10 text-[10px] font-mono font-medium text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse"></span> RFQ Amount</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Contract (PO) Value</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Total Invoiced</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Net Paid Received</span>
        </div>
      </div>

      {/* Chart 2: Project Execution Status Pie/Donut Chart */}
      <div 
        id="status-pie-chart-card"
        className="glass-panel p-5 rounded-3xl flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="p-1.5 bg-white/5 text-indigo-400 rounded-lg border border-white/10">
              <PieChart size={16} />
            </span>
            <h3 className="text-sm font-sans font-black text-white">
              Execution Status Share
            </h3>
          </div>

          <div className="flex items-center justify-center py-3 relative" id="donut-graphic-wrapper">
            {/* Native SVG responsive Donut Chart */}
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth={strokeWidth}
              />
              {segments.map((seg, i) => {
                if (seg.value === 0) return null;
                const ratio = seg.value / totalProjects;
                const strokeDasharray = `${ratio * circumference} ${circumference}`;
                const strokeDashoffset = -accumulatedAngle;
                accumulatedAngle += ratio * circumference;

                const isHovered = hoveredSegment === seg.statusKey;
                const isSelected = activeFilter?.key === "executionStatus" && activeFilter?.value === seg.statusKey;

                return (
                  <circle
                    key={seg.statusKey}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth={isHovered || isSelected ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredSegment(seg.statusKey)}
                    onMouseLeave={() => setHoveredSegment(null)}
                    onClick={() => onChartFilter({ key: "executionStatus", value: seg.statusKey })}
                  />
                );
              })}
            </svg>

            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black font-sans text-white">{projects.length}</span>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Projects</span>
            </div>
          </div>
        </div>

        {/* Pie Legend & Category Filters */}
        <div className="mt-4 space-y-2 pt-3 border-t border-white/10">
          {segments.map((seg) => {
            const pct = projects.length > 0 ? Math.round((seg.value / projects.length) * 100) : 0;
            const isSelected = activeFilter?.key === "executionStatus" && activeFilter?.value === seg.statusKey;

            return (
              <div 
                key={seg.statusKey}
                onClick={() => onChartFilter({ key: "executionStatus", value: seg.statusKey })}
                className={`flex items-center justify-between text-xs p-1.5 rounded-xl cursor-pointer transition-colors ${
                  isSelected ? "bg-white/10 font-bold text-white border border-white/10" : "hover:bg-white/5 text-slate-300 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }}></span>
                  <span className="font-sans text-slate-200">{seg.label}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-white font-bold">{seg.value}</span>
                  <span className="text-[10px] text-slate-400">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
