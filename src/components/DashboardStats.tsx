/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  FolderKanban, 
  Receipt, 
  Coins, 
  Clock, 
  Briefcase, 
  XOctagon, 
  CheckCircle2, 
  HelpCircle,
  FileSpreadsheet
} from "lucide-react";
import { Project, InvoiceStatus } from "../types";
import { ProjectFinances } from "../data";

interface DashboardStatsProps {
  projects: Project[];
  finances: { [projectId: string]: ProjectFinances };
  selectedDateFilter: string; // "all" | "2026" | "2025" | "90days" | "30days"
  onStatClick: (filter: { key: string; value: string }) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  projects,
  finances,
  selectedDateFilter,
  onStatClick
}) => {
  // Current time boundary based on ADDITIONAL_METADATA: 2026-05-31
  const today = new Date("2026-05-31");

  // Helper to check if a payment advice fits the time filter
  const isPaymentInTimeRange = (dateStr: string) => {
    if (selectedDateFilter === "all") return true;
    const paDate = new Date(dateStr);
    
    if (selectedDateFilter === "2026") {
      return paDate.getFullYear() === 2026;
    }
    if (selectedDateFilter === "2025") {
      return paDate.getFullYear() === 2025;
    }
    if (selectedDateFilter === "90days") {
      const diffTime = Math.abs(today.getTime() - paDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 90;
    }
    if (selectedDateFilter === "30days") {
      const diffTime = Math.abs(today.getTime() - paDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }
    return true;
  };

  // Stats calculation
  let openCount = 0;
  let closedCount = 0;
  let totalContractValue = 0;
  let totalInvoicedGross = 0;
  let totalUninvoiced = 0;
  let totalPaidNetFiltered = 0;
  let totalPendingFiltered = 0; // Invoiced approved but unpaid as of selected timing

  // Invoice status counts
  let submittedCount = 0;
  let underReviewCount = 0;
  let approvedCount = 0;
  let disputedCount = 0;

  projects.forEach((proj) => {
    // Open / Closed
    if (proj.status === "OPEN") openCount++;
    else closedCount++;

    const finance = finances[proj.id];
    if (finance) {
      totalContractValue += finance.contractAmount;
      totalInvoicedGross += finance.totalInvoiced;
      totalUninvoiced += finance.uninvoicedAmount;
    }

    // Invoice Status Count
    proj.invoices.forEach((inv) => {
      if (inv.status === InvoiceStatus.SUBMITTED) submittedCount++;
      else if (inv.status === InvoiceStatus.UNDER_REVIEW) underReviewCount++;
      else if (inv.status === InvoiceStatus.APPROVED) approvedCount++;
      else if (inv.status === InvoiceStatus.DISPUTED) disputedCount++;
    });

    // Timing-filtered Payment Advices
    proj.paymentAdvices.forEach((pa) => {
      if (isPaymentInTimeRange(pa.date)) {
        // Calculate Net Cash Received for this specific Advice
        // Net Received = Base Approved + VAT - WHT - Retention - Charges - Credit Note
        const netPaid = (pa.approvedAmount + pa.vat) - pa.wht - pa.retention - pa.charges - pa.creditNote;
        totalPaidNetFiltered += netPaid;
      }
    });

    // Pending payment calculating timings: Invoiced Approved but no payment advice matched yet
    // To filter pending correctly, we check approved invoices minus gross paid within or out
    if (finance) {
      totalPendingFiltered += finance.pendingPaymentAmount;
    }
  });

  const usdFormatter = {
    format: (val: number) => {
      return "₦" + Math.round(val || 0).toLocaleString("en-US");
    }
  };

  return (
    <div id="stats-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Stat 1: Open / Closed Projects */}
      <div 
        id="stat-projects"
        onClick={() => onStatClick({ key: "status", value: "OPEN" })}
        className="glass-panel glass-panel-hover p-5 rounded-2xl cursor-pointer transition-all group duration-200"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
            <Briefcase size={22} id="icon-briefcase" />
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Projects</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-sans font-black tracking-tight text-white">{openCount + closedCount}</span>
          <span className="text-xs font-mono text-slate-400">total</span>
        </div>
        <div className="flex gap-4 mt-4 pt-3.5 border-t border-white/10 text-xs font-semibold text-slate-350">
          <span className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-xs shadow-emerald-500/50"></span>
            {openCount} Open
          </span>
          <span className="flex items-center gap-1.5 hover:text-white transition-colors">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block"></span>
            {closedCount} Closed
          </span>
        </div>
      </div>

      {/* Stat 2: Invoiced vs Uninvoiced */}
      <div 
        id="stat-invoicing"
        onClick={() => onStatClick({ key: "financials", value: "UNINVOICED" })}
        className="glass-panel glass-panel-hover p-5 rounded-2xl cursor-pointer transition-all group duration-200"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/25 rounded-xl group-hover:bg-amber-500/20 transition-colors">
            <Receipt size={22} id="icon-receipt" />
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            Invoiced <Clock size={12} className="text-amber-400" />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-sans font-black tracking-tight text-white">
            {usdFormatter.format(totalInvoicedGross)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-4 pt-3.5 border-t border-white/10 text-[11px] text-slate-350">
          <span className="font-bold text-amber-400">{usdFormatter.format(totalUninvoiced)}</span>
          <span>pending JCC document</span>
        </div>
      </div>

      {/* Stat 3: Amount Paid (based on selected time) */}
      <div 
        id="stat-payments"
        onClick={() => onStatClick({ key: "financials", value: "PAID" })}
        className="glass-panel glass-panel-hover p-5 rounded-2xl cursor-pointer transition-all group duration-200"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
            <Coins size={22} id="icon-coins" />
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
            Net Paid Rec.
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-sans font-black tracking-tight text-white">
            {usdFormatter.format(totalPaidNetFiltered)}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between">
          <span>Net cash paid</span>
          <span className="bg-emerald-500/15 text-emerald-300 text-[9px] px-2 py-0.5 rounded-md font-mono tracking-wider font-bold uppercase border border-emerald-500/20">
            {selectedDateFilter === "all" ? "All Time" : selectedDateFilter}
          </span>
        </div>
      </div>

      {/* Stat 4: Amount Pending (due/uninvoiced or approved waiting) */}
      <div 
        id="stat-pending"
        onClick={() => onStatClick({ key: "financials", value: "PENDING_CASH" })}
        className="glass-panel glass-panel-hover p-5 rounded-2xl cursor-pointer transition-all group duration-200"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-pink-500/10 text-pink-400 border border-pink-500/25 rounded-xl group-hover:bg-pink-500/20 transition-colors">
            <Clock size={22} id="icon-clock" />
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
            Outstanding Payment
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-sans font-black tracking-tight text-white">
            {usdFormatter.format(totalPendingFiltered)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-4 pt-3.5 border-t border-white/10 text-[11px] text-slate-350">
          <span className="font-bold text-pink-400">{approvedCount}</span>
          <span>Approved, awaiting advice</span>
        </div>
      </div>

      {/* Detailed Invoice Workflow Subgrid */}
      <div id="invoice-progress-bar" className="col-span-1 md:col-span-2 lg:col-span-4 bg-white/5 border border-white/10 p-5 rounded-3xl grid grid-cols-2 lg:grid-cols-4 gap-4 mt-1 backdrop-blur-md">
        <div className="flex items-center gap-3.5 cursor-pointer hover:bg-white/5 p-2 rounded-xl transition" onClick={() => onStatClick({ key: "invoiceStatus", value: InvoiceStatus.SUBMITTED })}>
          <div className="w-1.5 h-10 bg-blue-400 rounded-full shadow-xs shadow-blue-400/50"></div>
          <div>
            <div className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider">Submitted</div>
            <div className="text-sm font-bold text-slate-200">{submittedCount} Invoices</div>
          </div>
        </div>
        <div className="flex items-center gap-3.5 cursor-pointer hover:bg-white/5 p-2 rounded-xl transition" onClick={() => onStatClick({ key: "invoiceStatus", value: InvoiceStatus.UNDER_REVIEW })}>
          <div className="w-1.5 h-10 bg-indigo-400 rounded-full shadow-xs shadow-indigo-400/50"></div>
          <div>
            <div className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider">Under Review</div>
            <div className="text-sm font-bold text-slate-200">{underReviewCount} Invoices</div>
          </div>
        </div>
        <div className="flex items-center gap-3.5 cursor-pointer hover:bg-white/5 p-2 rounded-xl transition" onClick={() => onStatClick({ key: "invoiceStatus", value: InvoiceStatus.APPROVED })}>
          <div className="w-1.5 h-10 bg-emerald-500 rounded-full shadow-xs shadow-emerald-500/50"></div>
          <div>
            <div className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider">Approved</div>
            <div className="text-sm font-bold text-slate-200">{approvedCount} Invoices</div>
          </div>
        </div>
        <div className="flex items-center gap-3.5 cursor-pointer hover:bg-white/5 p-2 rounded-xl transition" onClick={() => onStatClick({ key: "invoiceStatus", value: InvoiceStatus.DISPUTED })}>
          <div className="w-1.5 h-10 bg-rose-500 rounded-full shadow-xs shadow-rose-500/50"></div>
          <div>
            <div className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider">Disputed (JCC Audit)</div>
            <div className="text-sm font-bold text-slate-200">{disputedCount} Invoices</div>
          </div>
        </div>
      </div>
    </div>
  );
};
