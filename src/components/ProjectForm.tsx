/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Project, ProjectStatus, ExecutionStatus } from "../types";
import { PlusCircle, Sparkles, X } from "lucide-react";

interface ProjectFormProps {
  onAddProject: (newProj: Project) => void;
  onCancel: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  onAddProject,
  onCancel,
}) => {
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [client, setClient] = useState("");
  const [subcontractor, setSubcontractor] = useState("");
  const [personnelType, setPersonnelType] = useState<"Subcontractor" | "In-House">("Subcontractor");
  const [subcontractorPoAmount, setSubcontractorPoAmount] = useState("");
  
  // RFQ Stage 1
  const [rfqDate, setRfqDate] = useState(new Date().toISOString().split("T")[0]);
  const [rfqAmt, setRfqAmt] = useState("");

  // Retroactive Stage 2: PFI (Optional)
  const [pfiNo, setPfiNo] = useState("");
  const [pfiAmt, setPfiAmt] = useState("");
  const [pfiDate, setPfiDate] = useState("");

  // Retroactive Stage 3: PO/MO (Optional)
  const [poNo, setPoNo] = useState("");
  const [poAmt, setPoAmt] = useState("");
  const [poDate, setPoDate] = useState(new Date().toISOString().split("T")[0]);
  const [moNo, setMoNo] = useState("");
  const [mrfNo, setMrfNo] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !code) return;

    // Build retroactive project
    const newProject: Project = {
      id: "proj_" + Date.now(),
      title,
      code,
      client: client || "General Client Portfolio",
      status: ProjectStatus.OPEN,
      executionStatus: ExecutionStatus.NOT_STARTED,
      subcontractorOrEngineer: subcontractor || (personnelType === "Subcontractor" ? "External Contractor Partner" : "In-House Personnel"),
      personnelType,
      subcontractorPoAmount: personnelType === "Subcontractor" ? (parseFloat(subcontractorPoAmount) || 0) : undefined,
      createdAt: new Date().toISOString(),
      rfq: {
        date: rfqDate || new Date().toISOString().split("T")[0],
        amount: parseFloat(rfqAmt) || 0,
      },
      // PFI info
      pfi: pfiNo ? {
        invoiceNumber: pfiNo,
        amount: parseFloat(pfiAmt) || parseFloat(rfqAmt) || 0,
        date: pfiDate || rfqDate
      } : undefined,
      // PO/MO info
      poMo: poNo ? {
        poNumber: poNo,
        poAmount: parseFloat(poAmt) || parseFloat(pfiAmt) || parseFloat(rfqAmt) || 0,
        moNumber: moNo,
        mrfNumber: mrfNo,
        poDate: poDate || rfqDate || new Date().toISOString().split("T")[0]
      } : undefined,
      // empty collections to start with
      tasks: [],
      invoices: [],
      paymentAdvices: [],
      expenses: [],
      disbursements: [],
      documents: []
    };

    onAddProject(newProject);
  };

  // Preset templates
  const applyPresetPlaceholder = (preset: "power" | "pipeline" | "commercial") => {
    if (preset === "power") {
      setTitle("Kaduna Substations Overhaul");
      setCode("KAD-SUB-2026");
      setClient("Federal Ministry of Power");
      setSubcontractor("Kaduna Electric Genco");
      setPersonnelType("Subcontractor");
      setSubcontractorPoAmount("135000");
      setRfqAmt("180000");
      setPfiNo("PFI-KAD-019");
      setPfiAmt("175000");
      setPoNo("PO-900331-KAD");
      setPoAmt("175000");
      setMoNo("MO-810a");
      setMrfNo("MRF-02");
    } else if (preset === "pipeline") {
      setTitle("Port Harcourt Pipeline Scrubbing");
      setCode("PHC-PL-2026");
      setClient("Shell Petroleum Development Co.");
      setSubcontractor("Engr. David Mark (In-house lead)");
      setPersonnelType("In-House");
      setSubcontractorPoAmount("");
      setRfqAmt("125000");
      setPfiNo("PFI-PHC-889");
      setPfiAmt("120000");
      setPoNo("");
      setPoAmt("");
      setMoNo("");
      setMrfNo("");
    } else if (preset === "commercial") {
      setTitle("Lagos Jetty Earthing & Grounding");
      setCode("LAG-JET-2026");
      setClient("MainOne Cable West Africa");
      setSubcontractor("EarthingTech Engineering Ltd");
      setPersonnelType("Subcontractor");
      setSubcontractorPoAmount("55000");
      setRfqAmt("85000");
      setPfiNo("");
      setPfiAmt("");
      setPoNo("");
      setPoAmt("");
      setMoNo("");
      setMrfNo("");
    }
  };

  return (
    <div id="retroactive-project-form-card" className="glass-panel rounded-3xl p-6 mb-6 animate-fadeIn">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
        <div>
          <h3 className="text-base font-sans font-black text-white">Add Project</h3>
        </div>
        <button 
          onClick={onCancel}
          className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Identifier */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5 font-bold">Project Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cathodic Replacement"
              className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5 font-bold">Project Code</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. KNP-CAT-2026"
              className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5 font-bold">Client Partner</label>
            <input
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="e.g. Shell Petroleum"
              className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5 font-bold">Personnel Category</label>
            <select
              value={personnelType}
              onChange={(e) => {
                const val = e.target.value as any;
                setPersonnelType(val);
                if (val === "In-House") setSubcontractorPoAmount("");
              }}
              className="w-full px-3 py-2.5 glass-input bg-[#1e293b] rounded-xl text-xs text-white focus:outline-hidden font-sans"
            >
              <option value="Subcontractor" className="bg-[#1e293b]">Subcontractor Partner</option>
              <option value="In-House" className="bg-[#1e293b]">In-House Engineering</option>
            </select>
          </div>
        </div>

        {/* Lead Identity and Discounted Contractor PO allotment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/2 p-4 border border-white/5 rounded-2xl">
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5 font-bold">
              Engineering / Lead Partner Name
            </label>
            <input
              type="text"
              required
              value={subcontractor}
              onChange={(e) => setSubcontractor(e.target.value)}
              placeholder={personnelType === "Subcontractor" ? "e.g. Abbey Electrical Ltd" : "e.g. Engr. Yusuf Ibrahim"}
              className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white focus:outline-hidden font-sans"
            />
          </div>
          {personnelType === "Subcontractor" ? (
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5 font-bold flex items-center justify-between">
                <span>Subcontractor Custom PO Allotment (₦)</span>
                <span className="text-[10px] text-indigo-400 font-sans tracking-normal font-semibold">
                  Discounted from Client PO
                </span>
              </label>
              <input
                type="number"
                value={subcontractorPoAmount}
                onChange={(e) => setSubcontractorPoAmount(e.target.value)}
                placeholder="e.g. 110000"
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white focus:outline-hidden font-mono"
              />
            </div>
          ) : (
            <div className="flex items-center text-xs text-slate-400 px-2 py-1">
              <span className="leading-relaxed">
                🧑‍🚀 <strong>In-House Team Channel</strong>: Funded directly through site expenses. No third-party subcontractor contract ceiling required.
              </span>
            </div>
          )}
        </div>

        {/* Stage 1 Config */}
        <div className="border-t border-white/10 pt-5">
          <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest mb-4">
            Stage 1: RFQ/BOQ
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs text-slate-350 mb-1.5 font-medium">RFQ/BOQ Receiving Date</label>
              <input
                type="date"
                value={rfqDate}
                onChange={(e) => setRfqDate(e.target.value)}
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-350 mb-1.5 font-medium">RFQ Estimated amount (₦)</label>
              <input
                type="number"
                value={rfqAmt}
                onChange={(e) => setRfqAmt(e.target.value)}
                placeholder="e.g. 150000"
                required
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Stage 2 Config (PFI) */}
        <div className="border-t border-white/10 pt-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
              Stage 2: Proforma Invoice Details
            </h4>
            <span className="text-[10px] font-mono text-slate-400">Leave blank if pending</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs text-slate-350 mb-1.5 font-medium">PFI Unique Identifier No.</label>
              <input
                type="text"
                value={pfiNo}
                onChange={(e) => setPfiNo(e.target.value)}
                placeholder="e.g. PFI-2026-01"
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-350 mb-1.5 font-medium">PFI submission Date</label>
              <input
                type="date"
                value={pfiDate}
                onChange={(e) => setPfiDate(e.target.value)}
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-350 mb-1.5 font-medium">PFI Base Face Amount (₦)</label>
              <input
                type="number"
                value={pfiAmt}
                onChange={(e) => setPfiAmt(e.target.value)}
                placeholder="Defaults to RFQ Amount"
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Stage 3 Config (PO/MO) */}
        <div className="border-t border-white/10 pt-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
              Stage 3: PO, MO or MRF
            </h4>
            <span className="text-[10px] font-mono text-slate-400">Requires Stage 2 validation first</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs text-slate-350 mb-1.5 font-medium">Purchase Order (PO) No.</label>
              <input
                type="text"
                value={poNo}
                onChange={(e) => setPoNo(e.target.value)}
                placeholder="e.g. PO-770"
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-350 mb-1.5 font-medium">PO Award Date</label>
              <input
                type="date"
                value={poDate}
                onChange={(e) => setPoDate(e.target.value)}
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-350 mb-1.5 font-medium">PO Approved Amount (₦)</label>
              <input
                type="number"
                value={poAmt}
                onChange={(e) => setPoAmt(e.target.value)}
                placeholder="Defaults to PFI value"
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-350 mb-1.5 font-medium">Move Order (MO) No.</label>
              <input
                type="text"
                value={moNo}
                onChange={(e) => setMoNo(e.target.value)}
                placeholder="e.g. MO-882"
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-350 mb-1.5 font-medium">Material Request (MRF) No.</label>
              <input
                type="text"
                value={mrfNo}
                onChange={(e) => setMrfNo(e.target.value)}
                placeholder="e.g. MRF-10"
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="pt-5 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-sans font-bold text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 font-sans font-semibold text-xs text-white rounded-xl hover:bg-indigo-505 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle size={15} /> Submit
          </button>
        </div>
      </form>
    </div>
  );
};
