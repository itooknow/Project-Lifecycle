/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Project, ProjectStatus, ExecutionStatus, InvoiceStatus } from "../types";
import { ProjectFinances, computeProjectFinances } from "../data";
import { 
  Search, 
  ArrowUpDown, 
  Tag, 
  User2, 
  ChevronRight, 
  Sparkles, 
  RefreshCw,
  FileSpreadsheet,
  Printer,
  CalendarDays,
  UserCheck,
  Building,
  TrendingUp,
  Coins,
  Receipt
} from "lucide-react";

interface ProjectTableProps {
  projects: Project[];
  finances: { [projectId: string]: ProjectFinances };
  onSelectProject: (projectId: string) => void;
  activeFilter: { key: string; value: string } | null;
  resetFilters: () => void;
}

type SortField = "title" | "code" | "contractAmount" | "totalPaidNet" | "grossProfit" | "createdAt" | "poDate";
type SortOrder = "asc" | "desc";

export const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  finances,
  onSelectProject,
  activeFilter,
  resetFilters,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [clientFilter, setClientFilter] = useState<string>("ALL");
  const [subcontractorFilter, setSubcontractorFilter] = useState<string>("ALL");
  
  // Date range state
  const [datePreset, setDatePreset] = useState<string>("ALL"); // "ALL", "LQ" (Last Quarter), "YTD" (Year-to-date), "90D" (Last 90 days), "CUSTOM"
  const [startDateStr, setStartDateStr] = useState<string>("");
  const [endDateStr, setEndDateStr] = useState<string>("");

  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Format currency
  const usdFormatter = {
    format: (val: number) => {
      return "₦" + Math.round(val || 0).toLocaleString("en-US");
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Compile unique lists from active projects for filter lists
  const uniqueClients = Array.from(new Set(projects.map(p => p.client).filter(Boolean).sort()));
  const uniqueSubcontractors = Array.from(new Set(projects.map(p => p.subcontractorOrEngineer).filter(Boolean).sort()));

  // Filter and Sort implementations
  const filteredProjects = projects.filter((proj) => {
    const fin = finances[proj.id];
    
    // 1. Dashboard Interactions Filters
    if (activeFilter) {
      if (activeFilter.key === "status" && proj.status !== activeFilter.value) return false;
      if (activeFilter.key === "executionStatus" && proj.executionStatus !== activeFilter.value) return false;
      if (activeFilter.key === "project" && proj.id !== activeFilter.value) return false;
      if (activeFilter.key === "invoiceStatus") {
        const hasInvoiceWithStatus = proj.invoices.some(inv => inv.status === activeFilter.value);
        if (!hasInvoiceWithStatus) return false;
      }
      if (activeFilter.key === "financials") {
        if (activeFilter.value === "UNINVOICED" && (!fin || fin.uninvoicedAmount === 0)) return false;
        if (activeFilter.value === "PAID" && (!fin || fin.totalPaidNet === 0)) return false;
        if (activeFilter.value === "PENDING_CASH" && (!fin || fin.pendingPaymentAmount === 0)) return false;
      }
    }

    // 2. Global Text Search
    const matchesSearch = 
      proj.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proj.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (proj.client || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      proj.subcontractorOrEngineer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proj.expenses.some(exp => exp.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (proj.pfi?.invoiceNumber.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (proj.poMo?.poNumber.toLowerCase() || "").includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // 3. Status Filters (Includes meta financial statuses)
    if (statusFilter !== "ALL") {
      if (statusFilter === "OPEN" && proj.status !== ProjectStatus.OPEN) return false;
      if (statusFilter === "CLOSED" && proj.status !== ProjectStatus.CLOSED) return false;
      if (statusFilter === "IN_PROGRESS" && proj.executionStatus !== ExecutionStatus.IN_PROGRESS) return false;
      if (statusFilter === "INVOICED" && proj.invoices.length === 0) return false;
      
      if (fin) {
        if (statusFilter === "FULLY_PAID" && !(fin.totalPaidGross >= fin.contractAmount && fin.contractAmount > 0)) return false;
        if (statusFilter === "PARTIALLY_PAID" && !(fin.totalPaidGross > 0 && fin.totalPaidGross < fin.contractAmount)) return false;
      }
    }

    // 4. Clients Filters
    if (clientFilter !== "ALL" && proj.client !== clientFilter) return false;

    // 5. Subcontractor Lead Filters
    if (subcontractorFilter !== "ALL" && proj.subcontractorOrEngineer !== subcontractorFilter) return false;

    // 6. Custom and Preset Date ranges (Checks target project creation boundary)
    const pjDate = new Date(proj.createdAt);
    
    // Dynamic offsets in context of 2026 local time
    const localNow = new Date("2026-05-31T17:04:34Z");
    
    if (datePreset === "LQ") { // Q1 2026 (Jan 1 - Mar 31)
      const qStart = new Date("2026-01-01T00:00:00Z");
      const qEnd = new Date("2026-03-31T23:59:59Z");
      if (pjDate < qStart || pjDate > qEnd) return false;
    } else if (datePreset === "YTD") { // 2026 YTD
      const yStart = new Date("2026-01-01T00:00:00Z");
      if (pjDate < yStart || pjDate > localNow) return false;
    } else if (datePreset === "90D") { // Last 90 Days Relative to 2026 date
      const boundary = new Date(localNow.getTime() - 90 * 24 * 60 * 60 * 1000);
      if (pjDate < boundary) return false;
    } else if (datePreset === "CUSTOM") {
      if (startDateStr) {
        const start = new Date(startDateStr + "T00:00:00");
        if (pjDate < start) return false;
      }
      if (endDateStr) {
        const end = new Date(endDateStr + "T23:59:59");
        if (pjDate > end) return false;
      }
    }

    return true;
  });

  // Sort visibly filtered projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const finA = finances[a.id];
    const finB = finances[b.id];

    let valA: any = a[sortField as keyof Project] || "";
    let valB: any = b[sortField as keyof Project] || "";

    if (sortField === "poDate") {
      valA = a.poMo?.poDate || a.createdAt || "";
      valB = b.poMo?.poDate || b.createdAt || "";
    } else if (sortField === "contractAmount") {
      valA = finA?.contractAmount || 0;
      valB = finB?.contractAmount || 0;
    } else if (sortField === "totalPaidNet") {
      valA = finA?.totalPaidNet || 0;
      valB = finB?.totalPaidNet || 0;
    } else if (sortField === "grossProfit") {
      valA = finA?.grossProfit || 0;
      valB = finB?.grossProfit || 0;
    }

    if (typeof valA === "string") {
      return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else {
      return sortOrder === "asc" ? valA - valB : valB - valA;
    }
  });

  // Financial summary aggregation for filtered view reports
  const totalFilteredPO = sortedProjects.reduce((sum, p) => sum + (finances[p.id]?.contractAmount || 0), 0);
  const totalFilteredPaid = sortedProjects.reduce((sum, p) => sum + (finances[p.id]?.totalPaidNet || 0), 0);
  const totalFilteredCosts = sortedProjects.reduce((sum, p) => sum + (finances[p.id]?.totalCost || 0), 0);
  const totalFilteredProfits = sortedProjects.reduce((sum, p) => sum + (finances[p.id]?.grossProfit || 0), 0);

  // Export to CSV Function
  const handleExportCSV = () => {
    const headers = [
      "Project Code",
      "Project Title",
      "Client Partner",
      "Personnel Category",
      "Lead Personnel / Agency",
      "Status",
      "Stage Milestone",
      "RFQ Bid Amount (₦)",
      "Contract Approved Amount (₦)",
      "Expected Client VAT (7.5%) (₦)",
      "Actual Paid VAT (₦)",
      "VAT Variance (₦)",
      "Expected Client WHT (5.0%) (₦)",
      "Actual Deducted WHT (₦)",
      "WHT Variance (₦)",
      "Subcontractor Custom PO Allocation (₦)",
      "Actual Disbursed Sum (₦)",
      "Subcontractor Variance (₦)",
      "Net Reconciled Cash (₦)",
      "Logistics & Operations Cost (₦)",
      "Clean Profit Margins (₦)",
      "Creation Timestamp"
    ];

    const rows = sortedProjects.map(proj => {
      const fin = finances[proj.id];
      const personnelCat = proj.personnelType || (proj.subcontractorOrEngineer.toLowerCase().includes("subcontractor") ? "Subcontractor" : "In-House");
      const subPoAmt = proj.subcontractorPoAmount !== undefined ? proj.subcontractorPoAmount : (personnelCat === "Subcontractor" ? 0 : "N/A");
      const subVar = fin?.subcontractorVariance !== undefined ? fin.subcontractorVariance : (personnelCat === "Subcontractor" ? 0 : "N/A");
      return [
        `"${proj.code}"`,
        `"${proj.title.replace(/"/g, '""')}"`,
        `"${(proj.client || "Other").replace(/"/g, '""')}"`,
        `"${personnelCat}"`,
        `"${proj.subcontractorOrEngineer.replace(/"/g, '""')}"`,
        proj.status,
        proj.executionStatus,
        proj.rfq.amount,
        fin?.contractAmount || 0,
        fin?.expectedVAT || 0,
        fin?.totalVAT || 0,
        fin?.vatVariance || 0,
        fin?.expectedWHT || 0,
        fin?.totalWHT || 0,
        fin?.whtVariance || 0,
        subPoAmt,
        fin?.totalDisbursed || 0,
        subVar,
        fin?.totalPaidNet || 0,
        fin?.totalCost || 0,
        fin?.grossProfit || 0,
        proj.createdAt
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Master_Lifecycle_Reconciliation_Report_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF (Triggers pristine print styles window)
  const handleExportPDF = () => {
    window.print();
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setClientFilter("ALL");
    setSubcontractorFilter("ALL");
    setDatePreset("ALL");
    setStartDateStr("");
    setEndDateStr("");
    resetFilters();
  };

  const getLifecycleStageStep = (p: Project) => {
    if (p.paymentAdvices.length > 0) return "S6: Advice Mapped";
    if (p.invoices.length > 0) return "S5: Inv Submitted";
    if (p.tasks.length > 0 && p.tasks.some(t => t.isCompleted)) return "S4: Mid Execution";
    if (p.poMo) return "S3: PO Received";
    if (p.pfi) return "S2: PFI Dispatched";
    return "S1: RFQ Registered";
  };

  return (
    <div id="project-table-container" className="glass-panel rounded-3xl p-6 print:p-0 print:border-none print:bg-white print:text-black">
      
      {/* Table Title Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 print:hidden">
        <div>
          <h3 className="text-base font-sans font-black text-white">Reconciliation Ledger</h3>
          <p className="text-xs text-slate-400 mt-1">
            Displaying <strong className="text-slate-200">{sortedProjects.length}</strong> of {projects.length} matching construction entries
          </p>
        </div>

        {/* Global actions and exports */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="p-2.5 px-3.5 bg-indigo-500/15 border border-indigo-500/25 hover:border-indigo-400 font-sans text-xs font-bold rounded-xl text-indigo-300 hover:text-white transition-all flex items-center gap-2 cursor-pointer"
            title="Download CSV format coordinates"
          >
            <FileSpreadsheet size={14} /> Export CSV Spreadsheet
          </button>
          <button
            onClick={handleExportPDF}
            className="p-2.5 px-3.5 bg-indigo-505 bg-indigo-600 hover:bg-indigo-500 font-sans text-xs font-bold rounded-xl text-white transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/10"
            title="Compile printable auditor financial statement sheet"
          >
            <Printer size={14} /> Export PDF Report
          </button>
        </div>
      </div>

      {/* 2. Interactive Search & Filters Matrix Area */}
      <div className="bg-slate-900/30 border border-white/5 p-4.5 rounded-2xl mb-6 space-y-4 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Global Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Search projects, client, lead, JCC, PO codes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 glass-input rounded-xl text-xs text-slate-205 placeholder-slate-500 font-sans focus:outline-hidden"
            />
          </div>

          {/* Combined Projects Status Filter Matrix */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 glass-input bg-[#1e293b] rounded-xl text-xs text-slate-300 font-sans cursor-pointer focus:outline-hidden"
            >
              <option value="ALL">Status: All Records</option>
              <option value="OPEN">Status: Open Projects Only</option>
              <option value="CLOSED">Status: Closed Contracts Only</option>
              <option value="IN_PROGRESS">Milestone: Under In-Progress Execution</option>
              <option value="INVOICED">Stage: Invoiced Milestones</option>
              <option value="FULLY_PAID">Reconciled: Fully Client Paid (100%)</option>
              <option value="PARTIALLY_PAID">Reconciled: Marginally Paid (1-99%)</option>
            </select>
          </div>

          {/* Clients Dynamic Dropdown */}
          <div className="relative">
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full px-3 py-2.5 glass-input bg-[#1e293b] rounded-xl text-xs text-slate-300 font-sans cursor-pointer focus:outline-hidden"
            >
              <option value="ALL">Client: All Partners</option>
              {uniqueClients.map(cl => (
                <option key={cl} value={cl}>{cl}</option>
              ))}
            </select>
          </div>

          {/* Subcontractor leads Dropdown */}
          <div className="relative">
            <select
              value={subcontractorFilter}
              onChange={(e) => setSubcontractorFilter(e.target.value)}
              className="w-full px-3 py-2.5 glass-input bg-[#1e293b] rounded-xl text-xs text-slate-300 font-sans cursor-pointer focus:outline-hidden"
            >
              <option value="ALL">Assigned Lead: All Personnel</option>
              {uniqueSubcontractors.map(sc => (
                <option key={sc} value={sc}>{sc}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Filters Row 2: Advanced Date Presets and Custom range */}
        <div className="border-t border-white/5 pt-3 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-450 font-bold block">Date filters:</span>
            {[
              { key: "ALL", label: "All Time" },
              { key: "LQ", label: "Last Completed Quarter" },
              { key: "YTD", label: "Year-To-Date (YTD)" },
              { key: "90D", label: "Last 90 Days" },
              { key: "CUSTOM", label: "Custom Range..." }
            ].map(range => (
              <button
                key={range.key}
                type="button"
                onClick={() => setDatePreset(range.key)}
                className={`p-1.5 px-3 rounded-lg text-[11px] font-medium transition-all duration-150 cursor-pointer ${
                  datePreset === range.key 
                    ? "bg-indigo-505 hover:bg-indigo-600 bg-indigo-600 text-white" 
                    : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Custom start/end inputs */}
          {datePreset === "CUSTOM" && (
            <div className="flex items-center gap-2 animate-fadeIn bg-slate-950/20 p-1.5 border border-white/5 rounded-xl">
              <input
                type="date"
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
                className="px-2 py-1.5 bg-slate-900 border border-white/10 text-[10px] font-mono text-white rounded focus:outline-hidden"
                placeholder="From Date"
              />
              <span className="text-slate-500 text-[10px]">to</span>
              <input
                type="date"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                className="px-2 py-1.5 bg-slate-900 border border-white/10 text-[10px] font-mono text-white rounded focus:outline-hidden"
                placeholder="To Date"
              />
            </div>
          )}

          {/* Active Badge Status indicators */}
          {(searchTerm || statusFilter !== "ALL" || clientFilter !== "ALL" || subcontractorFilter !== "ALL" || datePreset !== "ALL" || activeFilter) && (
            <button
              onClick={clearAllFilters}
              className="text-[10px] font-bold text-rose-300 hover:text-rose-250 flex items-center gap-1 self-end lg:self-center bg-rose-500/10 hover:bg-rose-500/15 p-1.5 px-3 rounded-xl transition-all cursor-pointer"
            >
              <RefreshCw size={11} className="animate-spin" /> Clear Multi Filter Reset
            </button>
          )}

        </div>
      </div>

      {/* 3. Primary Interactive Table Grid */}
      <div className="overflow-x-auto print:overflow-x-visible" id="table-scroll-view">
        <table className="w-full min-w-[1020px] print:min-w-full text-left border-collapse print:table">
          <thead>
            <tr className="border-b border-white/10 print:border-slate-300 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-450 print:text-slate-800">
              <th className="py-3 px-4 text-center w-12 shrink-0">Stage</th>
              <th className="py-3 px-4 cursor-pointer hover:text-indigo-400 transition-colors" onClick={() => handleSort("title")}>
                Project Specs {sortField === "title" && (sortOrder === "asc" ? " ↑" : " ↓")}
              </th>
              <th className="py-3 px-4">Client Partner</th>
              <th className="py-3 px-4">Assigned Personnel Lead</th>
              <th className="py-3 px-4 text-center cursor-pointer hover:text-indigo-400 transition-colors" onClick={() => handleSort("poDate")}>
                Award Date {sortField === "poDate" && (sortOrder === "asc" ? " ↑" : " ↓")}
              </th>
              <th className="py-3 px-4 text-right cursor-pointer hover:text-indigo-400 transition-colors" onClick={() => handleSort("contractAmount")}>
                Contract Sum {sortField === "contractAmount" && (sortOrder === "asc" ? " ↑" : " ↓")}
              </th>
              <th className="py-3 px-4 text-right cursor-pointer hover:text-indigo-400 transition-colors" onClick={() => handleSort("totalPaidNet")}>
                Net Cash Rec. {sortField === "totalPaidNet" && (sortOrder === "asc" ? " ↑" : " ↓")}
              </th>
              <th className="py-3 px-4 text-right cursor-pointer hover:text-indigo-400 transition-colors" onClick={() => handleSort("grossProfit")}>
                Gross Profit {sortField === "grossProfit" && (sortOrder === "asc" ? " ↑" : " ↓")}
              </th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-2 print:hidden w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 print:divide-slate-200">
            {sortedProjects.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-455 text-xs font-sans">
                  No construction records matching the specified filtration parameters.
                </td>
              </tr>
            ) : (
              sortedProjects.map((p) => {
                const fin = finances[p.id];
                const stageStr = getLifecycleStageStep(p);
                
                const stageColors: { [key: string]: string } = {
                  "S1": "bg-rose-500/15 text-rose-300 border-rose-500/20 print:bg-slate-100 print:text-black print:border-slate-300",
                  "S2": "bg-orange-500/15 text-orange-300 border-orange-500/20 print:bg-slate-100 print:text-black print:border-slate-300",
                  "S3": "bg-amber-500/15 text-amber-300 border-amber-500/20 print:bg-slate-100 print:text-black print:border-slate-300",
                  "S4": "bg-indigo-500/15 text-indigo-300 border-indigo-500/20 print:bg-slate-100 print:text-black print:border-slate-300",
                  "S5": "bg-purple-500/15 text-purple-300 border-purple-500/20 print:bg-slate-100 print:text-black print:border-slate-300",
                  "S6": "bg-emerald-500/15 text-emerald-300 border-emerald-500/20 print:bg-slate-200 print:text-emerald-800 print:border-slate-300"
                };

                const flag = stageStr.substring(0, 2);
                const colorClass = stageColors[flag] || stageColors["S1"];

                return (
                  <tr 
                    key={p.id}
                    onClick={() => onSelectProject(p.id)}
                    className="hover:bg-white/3 transition-all duration-100 group cursor-pointer text-slate-200 print:hover:bg-transparent print:text-slate-900"
                  >
                    <td className="py-4 px-4 text-center shrink-0">
                      <span className={`text-[10px] font-mono font-black border px-2 py-0.5 rounded-full ${colorClass}`}>
                        {flag}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-sans max-w-[200px]">
                      <div className="font-extrabold text-white group-hover:text-indigo-400 transition-colors print:text-black font-semibold">
                        {p.title}
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-slate-450 mt-1 font-mono print:text-slate-500">
                        <Tag size={9} /> Code: {p.code}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs font-medium text-slate-300 print:text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Building size={11} className="text-slate-500 print:hidden" />
                        <span>{p.client || "General Partner"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-300 print:text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <UserCheck size={11} className="text-slate-500 print:hidden" />
                        <span className="truncate max-w-[150px]">{p.subcontractorOrEngineer}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-xs text-slate-300 print:text-slate-700">
                      📅 {p.poMo?.poDate || p.createdAt.split("T")[0]}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-xs font-bold text-slate-200 print:text-slate-800">
                      {usdFormatter.format(fin?.contractAmount || 0)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-xs font-extrabold text-emerald-400 print:text-emerald-700">
                      {usdFormatter.format(fin?.totalPaidNet || 0)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-xs font-black text-indigo-300 print:text-indigo-800">
                      {usdFormatter.format(fin?.grossProfit || 0)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`text-[9px] font-mono font-black border px-1.5 py-0.2 rounded ${
                          p.status === ProjectStatus.OPEN 
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20 print:bg-emerald-50 print:text-emerald-700 print:border-emerald-300"
                            : "bg-white/5 text-slate-400 border-white/5 print:bg-slate-100 print:text-slate-600 print:border-slate-300"
                        }`}>
                          {p.status}
                        </span>
                        <span className="text-[8px] font-extrabold text-slate-450 uppercase tracking-wide">
                          {p.executionStatus.replace("_", " ")}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-right print:hidden">
                      <ChevronRight size={14} className="text-slate-550 group-hover:translate-x-1 duration-150 transition-transform" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. PDF AUDIT PRINT VIEW REPORT SHEET ONLY (Visible strictly in print layout context via Media Queries) */}
      <div className="hidden print:block fixed inset-0 bg-white text-slate-900 p-8 z-50">
        
        {/* Invoice styled print banner */}
        <div className="border-b-4 border-slate-900 pb-5 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 font-sans">
              Master Reconciliation Report
            </h1>
            <p className="text-xs text-slate-600 mt-1 uppercase tracking-widest font-mono">
              Engineering stage 1-6 audit logs and financial statement clearances
            </p>
          </div>
          <div className="text-right font-mono text-xs text-slate-600">
            <div>Print Date: {new Date().toLocaleDateString()}</div>
            <div>Total Records: {sortedProjects.length} visible</div>
            <div>Status: SECURED AUDITED</div>
          </div>
        </div>

        {/* Filter boundaries overview */}
        <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl mb-6 flex flex-wrap gap-4 text-xs font-mono">
          <div><strong className="text-slate-800">STATUS FILTER:</strong> {statusFilter}</div>
          <div><strong className="text-slate-800">CLIENT:</strong> {clientFilter}</div>
          <div><strong className="text-slate-800">ENGINEER/SUB:</strong> {subcontractorFilter}</div>
          <div><strong className="text-slate-800">DATE PRESET:</strong> {datePreset}</div>
        </div>

        {/* Aggregate statistics overview sheet */}
        <div className="grid grid-cols-4 gap-4 mb-6 text-center">
          <div className="border border-slate-300 p-4 rounded-xl bg-slate-50/50">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500">Cumulative Approved POs</span>
            <div className="text-lg font-black text-slate-900 mt-1 font-mono">{usdFormatter.format(totalFilteredPO)}</div>
          </div>
          <div className="border border-slate-300 p-4 rounded-xl bg-slate-50/50">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500">Cumulative Cash Net Received</span>
            <div className="text-lg font-black text-emerald-800 mt-1 font-mono">{usdFormatter.format(totalFilteredPaid)}</div>
          </div>
          <div className="border border-slate-300 p-4 rounded-xl bg-slate-50/50">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500">Cumulative Spent Margins</span>
            <div className="text-lg font-black text-rose-800 mt-1 font-mono">{usdFormatter.format(totalFilteredCosts)}</div>
          </div>
          <div className="border border-slate-300 p-4 rounded-xl bg-slate-100">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-600">Net Operational Profits</span>
            <div className="text-lg font-black text-indigo-900 mt-1 font-mono">{usdFormatter.format(totalFilteredProfits)}</div>
          </div>
        </div>

        <h3 className="text-xs font-mono uppercase font-bold tracking-widest text-slate-800 mb-3 border-b pb-2">
          Project-By-Project Details Reconciled
        </h3>

        {/* Dynamic standard table print replication */}
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-400 font-mono text-slate-600 font-bold uppercase text-[9px]">
              <th className="py-2 px-3">Code</th>
              <th className="py-2 px-3">Project Title</th>
              <th className="py-2 px-3">Client</th>
              <th className="py-2 px-3">Lead Lead</th>
              <th className="py-2 px-3 text-right">PO Sum</th>
              <th className="py-2 px-3 text-right">Net Cash Received</th>
              <th className="py-2 px-3 text-right">Spend Outflow</th>
              <th className="py-2 px-3 text-right">Margins Profit</th>
              <th className="py-2 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-350">
            {sortedProjects.map(p => {
              const f = finances[p.id];
              return (
                <tr key={p.id} className="text-slate-800">
                  <td className="py-2 px-3 font-mono font-bold">{p.code}</td>
                  <td className="py-2 px-3 font-semibold">{p.title}</td>
                  <td className="py-2 px-3">{p.client || "GeneralPartner"}</td>
                  <td className="py-2 px-3">{p.subcontractorOrEngineer}</td>
                  <td className="py-2 px-3 text-right font-mono">{usdFormatter.format(f?.contractAmount || 0)}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">{usdFormatter.format(f?.totalPaidNet || 0)}</td>
                  <td className="py-2 px-3 text-right font-mono text-rose-800">{usdFormatter.format(f?.totalCost || 0)}</td>
                  <td className="py-2 px-3 text-right font-mono font-black">{usdFormatter.format(f?.grossProfit || 0)}</td>
                  <td className="py-2 px-3 text-center">
                    <span className="font-bold border px-1 rounded uppercase text-[9px] border-slate-300 bg-slate-100">
                      {p.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Auditor signoff block */}
        <div className="border-t-2 border-slate-350 pt-8 mt-12 grid grid-cols-2 gap-8 text-xs font-sans">
          <div>
            <div className="uppercase font-bold tracking-widest text-slate-500 text-[10px] font-mono">Prepared By Authorization</div>
            <div className="border-b border-slate-400 h-10 w-64 mt-2"></div>
            <div className="text-[10px] text-slate-450 mt-1 font-mono">Authorized Accountant Officer: Signature Code</div>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="uppercase font-bold tracking-widest text-slate-500 text-[10px] font-mono">Rigorous Financial Audit Cleared</div>
            <div className="border border-slate-400 p-4 px-6 w-fit mt-3 rounded-xl uppercase font-mono font-bold text-slate-700 bg-slate-50/50">
              STAMP SECURED
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
