/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Project, InvoiceStatus } from "../types";
import { 
  Briefcase, 
  Search, 
  ArrowUpRight, 
  User, 
  Building, 
  Receipt, 
  FileText, 
  Award, 
  Layers, 
  DollarSign, 
  TrendingUp, 
  Users, 
  PlusCircle, 
  Clock 
} from "lucide-react";

// Matches standard formatting used in other components
const usdFormatter = {
  format: (val: number) => {
    return "₦" + Math.round(val || 0).toLocaleString("en-US");
  }
};

interface RegisterProps {
  projects: Project[];
  finances: { [projectId: string]: any };
  onSelectProject: (projectId: string) => void;
  canEditProjects: boolean;
}

// ----------------------------------------------------
// 1. SUBCONTRACTORS LEDGER
// ----------------------------------------------------
export const SubcontractorsLedger: React.FC<RegisterProps> = ({ projects, finances, onSelectProject }) => {
  const [search, setSearch] = useState("");

  // Extract unique subcontractors
  const subcontractorsMap: { [name: string]: { 
    name: string; 
    projectIds: string[]; 
    poAmountSum: number; 
    disbursedSum: number; 
  } } = {};

  projects.forEach(p => {
    if (p.subcontractorOrEngineer && p.personnelType === "Subcontractor") {
      const name = p.subcontractorOrEngineer.trim();
      const finance = finances[p.id];
      const disb = p.disbursements || [];
      const disbursedVal = disb.reduce((sum, d) => sum + d.amount, 0);

      if (!subcontractorsMap[name]) {
        subcontractorsMap[name] = {
          name,
          projectIds: [p.id],
          poAmountSum: p.subcontractorPoAmount || 0,
          disbursedSum: disbursedVal
        };
      } else {
        subcontractorsMap[name].projectIds.push(p.id);
        subcontractorsMap[name].poAmountSum += p.subcontractorPoAmount || 0;
        subcontractorsMap[name].disbursedSum += disbursedVal;
      }
    }
  });

  const list = Object.values(subcontractorsMap).filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalContracted = list.reduce((sum, i) => sum + i.poAmountSum, 0);
  const totalDisbursed = list.reduce((sum, i) => sum + i.disbursedSum, 0);

  return (
    <div className="space-y-6">
      {/* Search Header and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/40 p-4 border border-white/5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase">Subcontractors Tracked</span>
            <div className="text-xl font-sans font-black text-indigo-400 mt-1">{list.length} Partner firms</div>
          </div>
          <Users className="text-indigo-400 opacity-60" size={24} />
        </div>
        <div className="bg-slate-900/40 p-4 border border-white/5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase">Cumulative Sub-PO Budgets</span>
            <div className="text-xl font-mono font-black text-emerald-400 mt-1">{usdFormatter.format(totalContracted)}</div>
          </div>
          <TrendingUp className="text-emerald-400 opacity-60" size={24} />
        </div>
        <div className="bg-slate-900/40 p-4 border border-white/5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase">Cumulative Released Funds</span>
            <div className="text-xl font-mono font-black text-rose-400 mt-1">{usdFormatter.format(totalDisbursed)}</div>
          </div>
          <DollarSign className="text-rose-400 opacity-60" size={24} />
        </div>
      </div>

      <div className="flex bg-slate-950/40 border border-white/10 p-3 rounded-2xl items-center gap-3">
        <Search className="text-slate-450 shrink-0" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subcontractors by brand or contractor name..."
          className="bg-transparent border-0 outline-hidden w-full text-xs text-white"
        />
      </div>

      {list.length > 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-slate-950/40 border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider font-mono">
                  <th className="py-4 px-5">Subcontractor Name</th>
                  <th className="py-4 px-4 text-center">Associated Projects</th>
                  <th className="py-4 px-4 text-right">Aggregated Sub-PO Sum</th>
                  <th className="py-4 px-4 text-right">Disbursed-to-Date</th>
                  <th className="py-4 px-4 text-right">Outstanding Balance</th>
                  <th className="py-4 px-5 text-center">Quick Navigation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-slate-200">
                {list.map((sub, idx) => {
                  const outstanding = Math.max(0, sub.poAmountSum - sub.disbursedSum);
                  const completionPercentage = sub.poAmountSum > 0 ? (sub.disbursedSum / sub.poAmountSum) * 100 : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-4 px-5 font-bold text-white flex items-center gap-2">
                        <Users size={14} className="text-indigo-400" />
                        {sub.name}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 rounded-md font-mono text-[10px] font-bold">
                          {sub.projectIds.length} Segments
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-slate-300">
                        {usdFormatter.format(sub.poAmountSum)}
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-emerald-400">
                        {usdFormatter.format(sub.disbursedSum)}
                        <div className="w-20 bg-slate-800 h-1 rounded-full overflow-hidden ml-auto mt-1">
                          <div 
                            className="bg-emerald-500 h-full" 
                            style={{ width: `${Math.min(100, completionPercentage)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-rose-400">
                        {usdFormatter.format(outstanding)}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <div className="flex justify-center gap-1.5">
                          {sub.projectIds.map((pId) => {
                            const prj = projects.find(x => x.id === pId);
                            return (
                              <button
                                key={pId}
                                onClick={() => onSelectProject(pId)}
                                title={prj?.title || "View Project Detail"}
                                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-white/5 text-xs text-indigo-300 hover:text-white rounded-md flex items-center gap-0.5 transition-all cursor-pointer font-mono"
                              >
                                {prj?.code.split("-")[0] || "VIEW"} <ArrowUpRight size={10} />
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 bg-slate-950/20 rounded-2xl border border-white/5 italic text-slate-400 text-xs">
          No registered subcontractor partner entries matched the active filter queries.
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// 2. IN-HOUSE ENGINEERS LEDGER
// ----------------------------------------------------
export const InHouseEngineersLedger: React.FC<RegisterProps> = ({ projects, finances, onSelectProject }) => {
  const [search, setSearch] = useState("");

  const engineersMap: { [name: string]: {
    name: string;
    projectIds: string[];
    ovreseenContractSum: number;
    tasksCoordinated: number;
    completedRatio: number;
  } } = {};

  projects.forEach(p => {
    // Treat as In-House if explicitly set, or coordinates engineer
    if (p.subcontractorOrEngineer && (p.personnelType === "In-House" || !p.personnelType)) {
      const name = p.subcontractorOrEngineer.trim();
      const finance = finances[p.id];
      const tasks = p.tasks || [];
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.isCompleted).length;

      if (!engineersMap[name]) {
        engineersMap[name] = {
          name,
          projectIds: [p.id],
          ovreseenContractSum: finance?.contractAmount || p.poMo?.poAmount || 0,
          tasksCoordinated: totalTasks,
          completedRatio: completedTasks
        };
      } else {
        engineersMap[name].projectIds.push(p.id);
        engineersMap[name].ovreseenContractSum += finance?.contractAmount || p.poMo?.poAmount || 0;
        engineersMap[name].tasksCoordinated += totalTasks;
        engineersMap[name].completedRatio += completedTasks;
      }
    }
  });

  const list = Object.values(engineersMap).filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/40 p-4 border border-white/5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase">In-House Engineers Ledger</span>
            <div className="text-xl font-sans font-black text-indigo-400 mt-1">{list.length} Coordinating Contacts</div>
          </div>
          <User className="text-indigo-400 opacity-60" size={24} />
        </div>
        <div className="bg-slate-900/40 p-4 border border-white/5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase">Total Coordinated Valuation</span>
            <div className="text-xl font-mono font-black text-emerald-400 mt-1">
              {usdFormatter.format(list.reduce((sum, item) => sum + item.ovreseenContractSum, 0))}
            </div>
          </div>
          <TrendingUp className="text-emerald-400 opacity-60" size={24} />
        </div>
      </div>

      <div className="flex bg-slate-950/40 border border-white/10 p-3 rounded-2xl items-center gap-3">
        <Search className="text-slate-455 shrink-0" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search coordinating leads and in-house resident engineers on payroll..."
          className="bg-transparent border-0 outline-hidden w-full text-xs text-white"
        />
      </div>

      {list.length > 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-slate-950/40 border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider font-mono">
                  <th className="py-4 px-5">Engineer Lead Representative</th>
                  <th className="py-4 px-4 text-center">Active Portfolios</th>
                  <th className="py-4 px-4 text-right">Oversight Valuation</th>
                  <th className="py-4 px-4 text-center">Milestones Coordinated</th>
                  <th className="py-4 px-5 text-center">Assigned Projects Map</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-slate-200">
                {list.map((eng, idx) => {
                  const compTaskVal = eng.tasksCoordinated > 0 ? (eng.completedRatio / eng.tasksCoordinated) * 100 : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-4 px-5 font-bold text-white flex items-center gap-2">
                        <Briefcase size={14} className="text-sky-400" />
                        {eng.name}
                        <span className="text-[9px] bg-sky-500/10 text-sky-300 px-1.5 py-0.5 rounded-sm border border-sky-500/20 uppercase font-mono font-bold leading-none ml-2">In-House</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-2 py-0.5 bg-sky-500/10 border border-sky-400/20 text-sky-300 rounded-md font-mono text-[10px] font-bold">
                          {eng.projectIds.length} Segments
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-emerald-400 font-bold">
                        {usdFormatter.format(eng.ovreseenContractSum)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="font-mono text-[11px]">
                          <span className="text-indigo-400 font-bold">{eng.completedRatio}</span>
                          <span className="text-slate-500"> / {eng.tasksCoordinated} tasks</span>
                        </div>
                        <div className="w-24 bg-slate-800 h-1 rounded-full overflow-hidden mx-auto mt-1">
                          <div 
                            className="bg-sky-400 h-full" 
                            style={{ width: `${compTaskVal}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <div className="flex justify-center gap-1.5">
                          {eng.projectIds.map((pId) => {
                            const prj = projects.find(x => x.id === pId);
                            return (
                              <button
                                key={pId}
                                onClick={() => onSelectProject(pId)}
                                title={prj?.title || "View Project Detail"}
                                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-white/5 text-xs text-sky-300 hover:text-white rounded-md flex items-center gap-0.5 transition-all cursor-pointer font-mono"
                              >
                                {prj?.code.split("-")[0] || "VIEW"} <ArrowUpRight size={10} />
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 bg-slate-950/20 rounded-2xl border border-white/5 italic text-slate-400 text-xs">
          No registered in-house coordinators matched the active filter queries.
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// 3. CLIENTS/CUSTOMERS LEDGER
// ----------------------------------------------------
export const ClientsLedger: React.FC<RegisterProps> = ({ projects, finances, onSelectProject }) => {
  const [search, setSearch] = useState("");

  const clientsMap: { [name: string]: {
    name: string;
    projectIds: string[];
    portfolioVal: number;
    clearedPaid: number;
  } } = {};

  projects.forEach(p => {
    if (p.client) {
      const name = p.client.trim();
      const finance = finances[p.id];
      const clearedSum = p.paymentAdvices?.reduce((sum, item) => sum + item.approvedAmount, 0) || 0;

      if (!clientsMap[name]) {
        clientsMap[name] = {
          name,
          projectIds: [p.id],
          portfolioVal: finance?.contractAmount || p.poMo?.poAmount || p.rfq.amount || 0,
          clearedPaid: clearedSum
        };
      } else {
        clientsMap[name].projectIds.push(p.id);
        clientsMap[name].portfolioVal += finance?.contractAmount || p.poMo?.poAmount || p.rfq.amount || 0;
        clientsMap[name].clearedPaid += clearedSum;
      }
    }
  });

  const list = Object.values(clientsMap).filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Clients Metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/40 p-4 border border-white/5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase">Clients/Customers Base</span>
            <div className="text-xl font-sans font-black text-indigo-400 mt-1">{list.length} Corporate Accounts</div>
          </div>
          <Building className="text-indigo-400 opacity-60" size={24} />
        </div>
        <div className="bg-slate-900/40 p-4 border border-white/5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase">Cumulative Contract Portfolio</span>
            <div className="text-xl font-mono font-black text-emerald-400 mt-1">
              {usdFormatter.format(list.reduce((sum, item) => sum + item.portfolioVal, 0))}
            </div>
          </div>
          <Award className="text-emerald-400 opacity-60" size={24} />
        </div>
        <div className="bg-slate-900/40 p-4 border border-white/5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase">Total Cash Inflow Received</span>
            <div className="text-xl font-mono font-black text-indigo-400 mt-1">
              {usdFormatter.format(list.reduce((sum, item) => sum + item.clearedPaid, 0))}
            </div>
          </div>
          <DollarSign className="text-indigo-400 opacity-60" size={24} />
        </div>
      </div>

      <div className="flex bg-slate-950/40 border border-white/10 p-3 rounded-2xl items-center gap-3">
        <Search className="text-slate-460 shrink-0" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search major clients, ministries, commissions or corporate customers..."
          className="bg-transparent border-0 outline-hidden w-full text-xs text-white"
        />
      </div>

      {list.length > 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-slate-950/40 border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider font-mono">
                  <th className="py-4 px-5">Client Name</th>
                  <th className="py-4 px-4 text-center">Active Contracts</th>
                  <th className="py-4 px-4 text-right">Portfolio Total Sum</th>
                  <th className="py-4 px-4 text-right">Cleared Payment Receipts</th>
                  <th className="py-4 px-4 text-right">Remaining Recyclable Debt</th>
                  <th className="py-4 px-5 text-center">Associated Projects</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-slate-200">
                {list.map((client, idx) => {
                  const billOutstanding = Math.max(0, client.portfolioVal - client.clearedPaid);
                  const progressPct = client.portfolioVal > 0 ? (client.clearedPaid / client.portfolioVal) * 100 : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-4 px-5 font-bold text-white flex items-center gap-2">
                        <Building size={14} className="text-indigo-400" />
                        {client.name}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 rounded-md font-mono text-[10px] font-bold">
                          {client.projectIds.length} Portfolios
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-slate-300">
                        {usdFormatter.format(client.portfolioVal)}
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-emerald-400">
                        {usdFormatter.format(client.clearedPaid)}
                        <div className="w-20 bg-slate-800 h-1 rounded-full overflow-hidden ml-auto mt-1">
                          <div 
                            className="bg-emerald-500 h-full" 
                            style={{ width: `${Math.min(100, progressPct)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-amber-400">
                        {usdFormatter.format(billOutstanding)}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <div className="flex justify-center gap-1.5">
                          {client.projectIds.map((pId) => {
                            const prj = projects.find(x => x.id === pId);
                            return (
                              <button
                                key={pId}
                                onClick={() => onSelectProject(pId)}
                                title={prj?.title || "View Project Detail"}
                                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-white/5 text-xs text-indigo-350 hover:text-white rounded-md flex items-center gap-0.5 transition-all cursor-pointer font-mono"
                              >
                                {prj?.code.split("-")[0] || "VIEW"} <ArrowUpRight size={10} />
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 bg-slate-950/20 rounded-2xl border border-white/5 italic text-slate-400 text-xs">
          No clients matched the search parameters.
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// 4. GLOBAL INVOICES REGISTER
// ----------------------------------------------------
export const InvoicesRegister: React.FC<RegisterProps> = ({ projects, onSelectProject }) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Gather ALL invoices from all projects
  const allInvoices: {
    invoice: any;
    project: Project;
  }[] = [];

  projects.forEach(p => {
    const invs = p.invoices || [];
    invs.forEach(inv => {
      allInvoices.push({
        invoice: inv,
        project: p
      });
    });
  });

  const filteredInvoices = allInvoices.filter(item => {
    const invNo = item.invoice.invoiceNumber || "";
    const jccNo = item.invoice.jccNumber || "";
    const prjTitle = item.project.title || "";
    const prjCode = item.project.code || "";
    const prjClient = item.project.client || "";

    const matchSearch = 
      invNo.toLowerCase().includes(search.toLowerCase()) ||
      jccNo.toLowerCase().includes(search.toLowerCase()) ||
      prjTitle.toLowerCase().includes(search.toLowerCase()) ||
      prjCode.toLowerCase().includes(search.toLowerCase()) ||
      prjClient.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === "ALL" || item.invoice.status === statusFilter;

    return matchSearch && matchStatus;
  });

  // Calculations
  const invoiceSums = filteredInvoices.reduce((sum, item) => sum + (item.invoice.invoiceAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats counter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/40 p-4 border border-white/5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase">Aggregated Milestone Invoices</span>
            <div className="text-xl font-sans font-black text-indigo-400 mt-1">{filteredInvoices.length} invoices</div>
          </div>
          <Receipt className="text-indigo-400 opacity-60" size={24} />
        </div>
        <div className="bg-slate-900/40 p-4 border border-white/5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase">Financially Invoiced Total</span>
            <div className="text-xl font-mono font-black text-emerald-400 mt-1">{usdFormatter.format(invoiceSums)}</div>
          </div>
          <TrendingUp className="text-emerald-400 opacity-60" size={24} />
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1 flex bg-slate-950/40 border border-white/10 p-3 rounded-2xl items-center gap-3">
          <Search className="text-slate-465 shrink-0" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number, JCC, customer agency description, or segment..."
            className="bg-transparent border-0 outline-hidden w-full text-xs text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider shrink-0">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950/80 text-white font-mono text-xs px-3 py-2 border border-white/10 rounded-xl outline-hidden shrink-0"
          >
            <option value="ALL">ALL STATUSES</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="UNDER_REVIEW">UNDER REVIEW</option>
            <option value="APPROVED">APPROVED</option>
            <option value="DISPUTED">DISPUTED</option>
          </select>
        </div>
      </div>

      {filteredInvoices.length > 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-slate-950/40 border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider font-mono">
                  <th className="py-4 px-5">Invoice Reference</th>
                  <th className="py-4 px-4">Project Segment</th>
                  <th className="py-4 px-4">Client Organ</th>
                  <th className="py-4 px-4">Submission Date</th>
                  <th className="py-4 px-4 text-right">Invoiced Face Value</th>
                  <th className="py-4 px-4 text-center">JCC reference</th>
                  <th className="py-4 px-4 text-center">Appraisal Status</th>
                  <th className="py-4 px-5 text-center">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-slate-200">
                {filteredInvoices.map((item, idx) => {
                  const status = item.invoice.status;
                  const sColors: { [key: string]: string } = {
                    SUBMITTED: "bg-amber-500/10 border-amber-500/20 text-amber-300",
                    UNDER_REVIEW: "bg-teal-500/10 border-teal-500/20 text-teal-300",
                    APPROVED: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
                    DISPUTED: "bg-rose-500/10 border-rose-500/20 text-rose-300"
                  };

                  return (
                    <tr key={idx} className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-4 px-5 font-bold text-white font-mono">
                        🧾 {item.invoice.invoiceNumber}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-205">{item.project.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.project.code}</div>
                      </td>
                      <td className="py-4 px-4 font-bold text-indigo-400">
                        {item.project.client}
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-300 text-center">
                        📅 {item.invoice.submissionDate || "N/A"}
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-emerald-400 font-extrabold text-[13px]">
                        {usdFormatter.format(item.invoice.invoiceAmount)}
                      </td>
                      <td className="py-4 px-4 text-center font-mono font-bold text-slate-350">
                        {item.invoice.jccNumber || "N/A"}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-0.5 border rounded-md text-[10px] font-bold font-mono ${sColors[status] || "bg-slate-800 text-slate-400 border-white/5"}`}>
                          {status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <button
                          onClick={() => onSelectProject(item.project.id)}
                          className="p-1 px-2.5 bg-slate-900 hover:bg-slate-800 border border-white/5 text-[10px] text-indigo-300 rounded-md flex items-center gap-1 mx-auto transition-all cursor-pointer font-mono font-bold"
                        >
                          OPEN <ArrowUpRight size={10} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 bg-slate-950/20 rounded-2xl border border-white/5 italic text-slate-400 text-xs">
          No registered invoices matched your criteria.
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// 5. GLOBAL PO REGISTRY
// ----------------------------------------------------
export const PoRegistry: React.FC<RegisterProps> = ({ projects, onSelectProject }) => {
  const [search, setSearch] = useState("");
  const [poTypeFilter, setPoTypeFilter] = useState<string>("ALL");

  // Classify all POs in the applet
  const allPos: {
    id: string;
    poNumber: string;
    amount: number;
    moNumber?: string;
    mrfNumber?: string;
    poDate?: string;
    type: "Primary" | "Supplementary";
    project: Project;
  }[] = [];

  projects.forEach((p) => {
    // Primary PO
    if (p.poMo && p.poMo.poNumber) {
      allPos.push({
        id: `primary_po_${p.id}`,
        poNumber: p.poMo.poNumber,
        amount: p.poMo.poAmount || 0,
        moNumber: p.poMo.moNumber,
        mrfNumber: p.poMo.mrfNumber,
        poDate: p.poMo.poDate || p.createdAt.split("T")[0],
        type: "Primary",
        project: p
      });
    }

    // Supplementary POs
    const supp = p.poMo?.additionalPos || [];
    supp.forEach((s) => {
      allPos.push({
        id: s.id,
        poNumber: s.poNumber,
        amount: s.poAmount || 0,
        moNumber: s.moNumber,
        mrfNumber: s.mrfNumber,
        poDate: p.poMo?.poDate || p.createdAt.split("T")[0], // default to parent PO date
        type: "Supplementary",
        project: p
      });
    });
  });

  const filteredPos = allPos.filter(item => {
    const matchSearch =
      item.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      (item.moNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.mrfNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      item.project.title.toLowerCase().includes(search.toLowerCase()) ||
      item.project.code.toLowerCase().includes(search.toLowerCase()) ||
      item.project.client.toLowerCase().includes(search.toLowerCase());

    const matchType = poTypeFilter === "ALL" || item.type === poTypeFilter;

    return matchSearch && matchType;
  });

  const totalPoAmount = filteredPos.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/40 p-4 border border-white/5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase">Authorized Corporate PO Agreements</span>
            <div className="text-xl font-sans font-black text-emerald-400 mt-1">{filteredPos.length} contract orders</div>
          </div>
          <Award className="text-emerald-400 opacity-60" size={24} />
        </div>
        <div className="bg-slate-900/40 p-4 border border-white/5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase">Cumulative PO Authorization Capital</span>
            <div className="text-xl font-mono font-black text-indigo-400 mt-1">{usdFormatter.format(totalPoAmount)}</div>
          </div>
          <TrendingUp className="text-indigo-400 opacity-60" size={24} />
        </div>
      </div>

      {/* Filter and Search Row */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1 flex bg-slate-950/40 border border-white/10 p-3 rounded-2xl items-center gap-3">
          <Search className="text-slate-470 shrink-0" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by purchase order number, MO number, project, or client code..."
            className="bg-transparent border-0 outline-hidden w-full text-xs text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider shrink-0">PO Category:</span>
          <select
            value={poTypeFilter}
            onChange={(e) => setPoTypeFilter(e.target.value)}
            className="bg-slate-950/80 text-white font-mono text-xs px-3 py-2 border border-white/10 rounded-xl outline-hidden shrink-0"
          >
            <option value="ALL">ALL AGREEMENTS</option>
            <option value="Primary">PRIMARY PO ONLY</option>
            <option value="Supplementary">SUPPLEMENTARY PO ONLY</option>
          </select>
        </div>
      </div>

      {filteredPos.length > 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-slate-950/40 border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider font-mono">
                  <th className="py-4 px-5">PO Number</th>
                  <th className="py-4 px-4">Project Association</th>
                  <th className="py-4 px-4">Client Partner</th>
                  <th className="py-4 px-4">Award Date</th>
                  <th className="py-4 px-4 text-right">Face Amount (₦)</th>
                  <th className="py-4 px-4 text-center">Category Type</th>
                  <th className="py-4 px-4 text-center">References</th>
                  <th className="py-4 px-5 text-center">Inspect File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-slate-200">
                {filteredPos.map((item, idx) => {
                  return (
                    <tr key={idx} className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-4 px-5 font-bold text-teal-400 font-mono text-[13px]">
                        📝 {item.poNumber}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-205">{item.project.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.project.code}</div>
                      </td>
                      <td className="py-4 px-4 font-bold text-indigo-400">
                        {item.project.client}
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-300 text-center">
                        📅 {item.poDate || "N/A"}
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-emerald-400 font-bold text-[13px]">
                        {usdFormatter.format(item.amount)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-0.5 border rounded-md text-[10px] font-bold font-mono ${
                          item.type === "Primary"
                            ? "bg-teal-500/10 border-teal-500/20 text-teal-300"
                            : "bg-purple-500/10 border-purple-500/20 text-purple-300"
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-mono text-[10px] text-slate-400">
                        {item.moNumber ? `MO: ${item.moNumber}` : ""}
                        {item.moNumber && item.mrfNumber ? " • " : ""}
                        {item.mrfNumber ? `MRF: ${item.mrfNumber}` : ""}
                        {!item.moNumber && !item.mrfNumber ? "—" : ""}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <button
                          onClick={() => onSelectProject(item.project.id)}
                          className="p-1 px-2.5 bg-slate-900 hover:bg-slate-800 border border-white/5 text-[10px] text-indigo-300 rounded-md flex items-center gap-1 mx-auto transition-all cursor-pointer font-mono font-bold"
                        >
                          OPEN <ArrowUpRight size={10} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 bg-slate-950/20 rounded-2xl border border-white/5 italic text-slate-400 text-xs">
          No purchase orders matched your current selection view.
        </div>
      )}
    </div>
  );
};
