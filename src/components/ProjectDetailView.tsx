/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { 
  Project, 
  ProjectStatus, 
  ExecutionStatus, 
  InvoiceStatus, 
  GranularTask, 
  InvoiceEntry, 
  PaymentAdviceEntry, 
  ExpenseEntry, 
  DisbursementEntry, 
  ProjectDocument,
  AdditionalPO 
} from "../types";
import { ProjectFinances } from "../data";
import { useAuth } from "./UserAuth";
import { 
  X, 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Calendar, 
  Check, 
  ChevronDown, 
  Clock, 
  DollarSign, 
  FileText, 
  Paperclip, 
  TrendingUp, 
  Truck, 
  Lock, 
  Unlock, 
  Search, 
  UploadCloud, 
  Download, 
  AlertCircle 
} from "lucide-react";

interface ProjectDetailViewProps {
  project: Project;
  finances: ProjectFinances;
  onClose: () => void;
  onUpdateProject: (updated: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  finances,
  onClose,
  onUpdateProject,
  onDeleteProject,
}) => {
  const { currentUser, hasPermission } = useAuth();
  const [activeFormTab, setActiveFormTab] = useState<
    "general" | "tasks" | "invoices" | "advices" | "expenses" | "disbursements" | "documents"
  >("general");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Forms states
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");
  const [newTaskDocId, setNewTaskDocId] = useState("");

  const [newInvNo, setNewInvNo] = useState("");
  const [newInvAmt, setNewInvAmt] = useState("");
  const [newInvDate, setNewInvDate] = useState("");
  const [newInvJcc, setNewInvJcc] = useState("");
  const [newInvStatus, setNewInvStatus] = useState<InvoiceStatus>(InvoiceStatus.SUBMITTED);

  const [newAdviceNo, setNewAdviceNo] = useState("");
  const [newAdvicePo, setNewAdvicePo] = useState(project.poMo?.poNumber || "");
  const [newAdviceInv, setNewAdviceInv] = useState("");
  const [newAdviceAmt, setNewAdviceAmt] = useState("");
  const [newAdviceVat, setNewAdviceVat] = useState("");
  const [newAdviceWht, setNewAdviceWht] = useState("");
  const [newAdviceRetention, setNewAdviceRetention] = useState("");
  const [newAdviceCharges, setNewAdviceCharges] = useState("");
  const [newAdviceCredit, setNewAdviceCredit] = useState("");
  const [newAdviceDate, setNewAdviceDate] = useState("");

  const [newExpCategory, setNewExpCategory] = useState<"Logistics" | "Sundry" | "Other">("Logistics");
  const [newExpDesc, setNewExpDesc] = useState("");
  const [newExpAmt, setNewExpAmt] = useState("");
  const [newExpDate, setNewExpDate] = useState("");

  const [newDisbRecipient, setNewDisbRecipient] = useState("");
  const [newDisbDesc, setNewDisbDesc] = useState("");
  const [newDisbAmt, setNewDisbAmt] = useState("");
  const [newDisbDate, setNewDisbDate] = useState("");

  // Document Forms states
  const [newDocName, setNewDocName] = useState("");
  const [newDocType, setNewDocType] = useState<ProjectDocument["type"]>("rfq");
  const [newDocRef, setNewDocRef] = useState("");
  const [docSearchQuery, setDocSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Edit RFQ/PFI/POMO inline
  const [rfqAmt, setRfqAmt] = useState(project.rfq.amount.toString());
  const [rfqDate, setRfqDate] = useState(project.rfq.date);
  
  const [pfiNo, setPfiNo] = useState(project.pfi?.invoiceNumber || "");
  const [pfiAmt, setPfiAmt] = useState(project.pfi?.amount.toString() || "");
  const [pfiDate, setPfiDate] = useState(project.pfi?.date || "");

  const [poNo, setPoNo] = useState(project.poMo?.poNumber || "");
  const [poAmt, setPoAmt] = useState(project.poMo?.poAmount.toString() || "");
  const [moNo, setMoNo] = useState(project.poMo?.moNumber || "");
  const [mrfNo, setMrfNo] = useState(project.poMo?.mrfNumber || "");
  const [poDateVal, setPoDateVal] = useState(project.poMo?.poDate || project.createdAt.split("T")[0]);

  const [additionalPos, setAdditionalPos] = useState<AdditionalPO[]>(project.poMo?.additionalPos || []);
  const [newAddPoNo, setNewAddPoNo] = useState("");
  const [newAddPoAmt, setNewAddPoAmt] = useState("");
  const [newAddMoNo, setNewAddMoNo] = useState("");
  const [newAddMrfNo, setNewAddMrfNo] = useState("");

  const handleAddSupplementaryPo = () => {
    if (!newAddPoNo) {
      alert("Please enter a PO Number first.");
      return;
    }
    const val: AdditionalPO = {
      id: `add_po_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      poNumber: newAddPoNo,
      poAmount: parseFloat(newAddPoAmt) || 0,
      moNumber: newAddMoNo || undefined,
      mrfNumber: newAddMrfNo || undefined
    };
    setAdditionalPos([...additionalPos, val]);
    setNewAddPoNo("");
    setNewAddPoAmt("");
    setNewAddMoNo("");
    setNewAddMrfNo("");
  };

  const handleRemoveSupplementaryPo = (id: string) => {
    setAdditionalPos(additionalPos.filter(p => p.id !== id));
  };

  // Update root properties
  const [statusVal, setStatusVal] = useState<ProjectStatus>(project.status);
  const [execStatusVal, setExecStatusVal] = useState<ExecutionStatus>(project.executionStatus);
  const [subcontractorVal, setSubcontractorVal] = useState(project.subcontractorOrEngineer);
  const [personnelTypeVal, setPersonnelTypeVal] = useState<"Subcontractor" | "In-House">(
    project.personnelType || (project.subcontractorOrEngineer.toLowerCase().includes("subcontractor") ? "Subcontractor" : "In-House")
  );
  const [subcontractorPoAmountVal, setSubcontractorPoAmountVal] = useState<string>(
    project.subcontractorPoAmount?.toString() || ""
  );

  const usdFormatter = {
    format: (val: number) => {
      return "₦" + Math.round(val || 0).toLocaleString("en-US");
    }
  };

  const canEditProjects = hasPermission("edit", "projects");
  const canEditFinancials = hasPermission("edit", "financials");
  const canEditTasks = hasPermission("edit", "tasks");
  const canDeleteData = currentUser?.role === "Administrator"; // System deletions restricted to Admin

  // Saving general contract
  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditProjects) return;
    
    const updated: Project = {
      ...project,
      status: statusVal,
      executionStatus: execStatusVal,
      subcontractorOrEngineer: subcontractorVal,
      personnelType: personnelTypeVal,
      subcontractorPoAmount: personnelTypeVal === "Subcontractor" ? (parseFloat(subcontractorPoAmountVal) || 0) : undefined,
      rfq: {
        amount: parseFloat(rfqAmt) || 0,
        date: rfqDate,
      },
      pfi: pfiNo ? {
        invoiceNumber: pfiNo,
        amount: parseFloat(pfiAmt) || 0,
        date: pfiDate
      } : undefined,
      poMo: poNo ? {
        poNumber: poNo,
        poAmount: parseFloat(poAmt) || 0,
        moNumber: moNo,
        mrfNumber: mrfNo,
        poDate: poDateVal,
        additionalPos: additionalPos
      } : undefined,
    };
    onUpdateProject(updated);
    alert("Project core contract parameters successfully synchronized!");
  };

  // Tasks actions
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditTasks || !newTaskTitle) return;

    const newTask: GranularTask = {
      id: "task_" + Date.now(),
      title: newTaskTitle,
      isCompleted: false,
      deadline: newTaskDeadline || new Date().toISOString().split("T")[0],
      milestoneDocId: newTaskDocId || undefined
    };

    const updated: Project = {
      ...project,
      tasks: [...project.tasks, newTask]
    };
    onUpdateProject(updated);
    setNewTaskTitle("");
    setNewTaskDeadline("");
    setNewTaskDocId("");
  };

  const handleToggleTask = (taskId: string) => {
    if (!canEditTasks) return;
    const updatedTasks = project.tasks.map(t => 
      t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
    );
    const updated: Project = {
      ...project,
      tasks: updatedTasks
    };
    onUpdateProject(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!canDeleteData) {
      alert("Permission Denied: System deletions are restricted to Administrators.");
      return;
    }
    const updated: Project = {
      ...project,
      tasks: project.tasks.filter(t => t.id !== taskId)
    };
    onUpdateProject(updated);
  };

  // Invoices actions
  const handleAddInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditFinancials) return;
    if (!newInvNo || !newInvAmt) return;

    const invoice: InvoiceEntry = {
      id: "inv_" + Date.now(),
      invoiceNumber: newInvNo,
      invoiceAmount: parseFloat(newInvAmt) || 0,
      submissionDate: newInvDate || new Date().toISOString().split("T")[0],
      jccNumber: newInvJcc,
      status: newInvStatus,
    };

    const updated: Project = {
      ...project,
      invoices: [...project.invoices, invoice]
    };
    onUpdateProject(updated);
    setNewInvNo("");
    setNewInvAmt("");
    setNewInvDate("");
    setNewInvJcc("");
  };

  const handleUpdateInvoiceStatus = (invId: string, status: InvoiceStatus) => {
    if (!canEditFinancials) return;
    const updatedInvoices = project.invoices.map(inv => 
      inv.id === invId ? { ...inv, status } : inv
    );
    const updated: Project = {
      ...project,
      invoices: updatedInvoices
    };
    onUpdateProject(updated);
  };

  const handleDeleteInvoice = (invId: string) => {
    if (!canDeleteData) {
      alert("Permission Denied: System deletions are restricted to Administrators.");
      return;
    }
    const updated: Project = {
      ...project,
      invoices: project.invoices.filter(inv => inv.id !== invId)
    };
    onUpdateProject(updated);
  };

  // Advices actions
  const handleAddAdvice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditFinancials) return;
    if (!newAdviceNo || !newAdviceAmt) return;

    const advice: PaymentAdviceEntry = {
      id: "adv_" + Date.now(),
      adviceNumber: newAdviceNo,
      poNumber: newAdvicePo,
      invoiceNumber: newAdviceInv,
      approvedAmount: parseFloat(newAdviceAmt) || 0,
      vat: parseFloat(newAdviceVat) || 0,
      wht: parseFloat(newAdviceWht) || 0,
      retention: parseFloat(newAdviceRetention) || 0,
      charges: parseFloat(newAdviceCharges) || 0,
      creditNote: parseFloat(newAdviceCredit) || 0,
      date: newAdviceDate || new Date().toISOString().split("T")[0],
    };

    const updated: Project = {
      ...project,
      paymentAdvices: [...project.paymentAdvices, advice]
    };
    onUpdateProject(updated);
    setNewAdviceNo("");
    setNewAdviceAmt("");
    setNewAdviceVat("");
    setNewAdviceWht("");
    setNewAdviceRetention("");
    setNewAdviceCharges("");
    setNewAdviceCredit("");
    setNewAdviceDate("");
    setNewAdviceInv("");
  };

  const handleDeleteAdvice = (adviceId: string) => {
    if (!canDeleteData) {
      alert("Permission Denied: System deletions are restricted to Administrators.");
      return;
    }
    const updated: Project = {
      ...project,
      paymentAdvices: project.paymentAdvices.filter(pa => pa.id !== adviceId)
    };
    onUpdateProject(updated);
  };

  // Expenses actions
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditFinancials) return;
    if (!newExpDesc || !newExpAmt) return;

    const expense: ExpenseEntry = {
      id: "exp_" + Date.now(),
      category: newExpCategory,
      description: newExpDesc,
      amount: parseFloat(newExpAmt) || 0,
      date: newExpDate || new Date().toISOString().split("T")[0],
    };

    const updated: Project = {
      ...project,
      expenses: [...project.expenses, expense]
    };
    onUpdateProject(updated);
    setNewExpDesc("");
    setNewExpAmt("");
    setNewExpDate("");
  };

  const handleDeleteExpense = (expId: string) => {
    if (!canDeleteData) {
      alert("Permission Denied: System deletions are restricted to Administrators.");
      return;
    }
    const updated: Project = {
      ...project,
      expenses: project.expenses.filter(exp => exp.id !== expId)
    };
    onUpdateProject(updated);
  };

  // Disbursements actions
  const handleAddDisbursement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditFinancials) return;
    if (!newDisbRecipient || !newDisbAmt) return;

    const disbursement: DisbursementEntry = {
      id: "disb_" + Date.now(),
      recipient: newDisbRecipient,
      description: newDisbDesc,
      amount: parseFloat(newDisbAmt) || 0,
      date: newDisbDate || new Date().toISOString().split("T")[0],
    };

    const updated: Project = {
      ...project,
      disbursements: [...project.disbursements, disbursement]
    };
    onUpdateProject(updated);
    setNewDisbRecipient("");
    setNewDisbDesc("");
    setNewDisbAmt("");
    setNewDisbDate("");
  };

  const handleDeleteDisbursement = (disbId: string) => {
    if (!canDeleteData) {
      alert("Permission Denied: System deletions are restricted to Administrators.");
      return;
    }
    const updated: Project = {
      ...project,
      disbursements: project.disbursements.filter(disb => disb.id !== disbId)
    };
    onUpdateProject(updated);
  };

  // Document management actions
  const handleAddDocumentFromForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName) return;

    const newDoc: ProjectDocument = {
      id: "doc_" + Date.now(),
      name: newDocName.toLowerCase().endsWith(".pdf") ? newDocName : `${newDocName}.pdf`,
      type: newDocType,
      fileSize: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
      uploadDate: new Date().toISOString().split("T")[0],
      uploadedBy: currentUser?.username || "Authorized Crew",
      docRef: newDocRef || undefined,
    };

    const updated: Project = {
      ...project,
      documents: [...(project.documents || []), newDoc]
    };
    onUpdateProject(updated);
    setNewDocName("");
    setNewDocRef("");
    alert(`Mock file attachment added! Added document: "${newDoc.name}" associated with ${newDoc.type.toUpperCase()}`);
  };

  const handleNativeFileUpload = (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      
      // Attempt to intelligently auto-detect type based on file name contents
      let calculatedType: ProjectDocument["type"] = "other";
      const nameLower = file.name.toLowerCase();
      if (nameLower.includes("rfq")) calculatedType = "rfq";
      else if (nameLower.includes("pfi")) calculatedType = "pfi";
      else if (nameLower.includes("po") || nameLower.includes("mrf") || nameLower.includes("p.o.")) calculatedType = "po";
      else if (nameLower.includes("mo") || nameLower.includes("move")) calculatedType = "mo";
      else if (nameLower.includes("jcc")) calculatedType = "jcc";
      else if (nameLower.includes("invoice") || nameLower.includes("inv")) calculatedType = "invoice";
      else if (nameLower.includes("advice") || nameLower.includes("pa")) calculatedType = "advice";
      else if (nameLower.includes("receipt") || nameLower.includes("exp")) calculatedType = "receipt";
      else if (nameLower.includes("milestone") || nameLower.includes("completion")) calculatedType = "milestone";

      const sizeKB = file.size / 1024;
      const sizeStr = sizeKB > 1024 
        ? `${(sizeKB / 1024).toFixed(1)} MB` 
        : `${sizeKB.toFixed(0)} KB`;

      const newDoc: ProjectDocument = {
        id: `doc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: file.name,
        type: calculatedType,
        fileSize: sizeStr,
        uploadDate: new Date().toISOString().split("T")[0],
        uploadedBy: currentUser?.username || "Authorized User",
        docRef: newDocRef || undefined,
        dataUrl,
      };

      const updated: Project = {
        ...project,
        documents: [...(project.documents || []), newDoc]
      };
      onUpdateProject(updated);
      setNewDocName("");
      setNewDocRef("");
      alert(`Successfully saved native file: "${file.name}"! Attached to Stage Categories: ${calculatedType.toUpperCase()}`);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteDoc = (docId: string) => {
    if (!canDeleteData) {
      alert("Permission Denied: Only Administrators can permanently delete project file attachments.");
      return;
    }
    const updated: Project = {
      ...project,
      documents: (project.documents || []).filter(d => d.id !== docId)
    };
    onUpdateProject(updated);
  };

  const triggerDownload = (doc: ProjectDocument) => {
    if (doc.dataUrl) {
      // Real file downloaded
      const link = document.createElement("a");
      link.href = doc.dataUrl;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Mock doc download
      const fakeContent = `Project Reconcile Document File\nName: ${doc.name}\nType: ${doc.type}\nUploaded By: ${doc.uploadedBy}\nUpload Date: ${doc.uploadDate}\nCode Identifier: ${doc.docRef || "None"}\nStatus: Audited Reconciled`;
      const blob = new Blob([fakeContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Drag-and-drop triggers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleNativeFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Filters search for documents
  const allDocuments = project.documents || [];
  const filteredDocs = allDocuments.filter(doc => {
    const matchesQuery = 
      doc.name.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
      (doc.docRef || "").toLowerCase().includes(docSearchQuery.toLowerCase()) ||
      doc.uploadedBy.toLowerCase().includes(docSearchQuery.toLowerCase());
    return matchesQuery;
  });

  // Checklist milestones for Stage visual tracker
  const stepRFQ = true;
  const stepPFI = !!project.pfi;
  const stepPOMO = !!project.poMo;
  const stepTasks = project.tasks.length > 0;
  const stepInvoices = project.invoices.length > 0;
  const stepAdvices = project.paymentAdvices.length > 0;

  return (
    <div id="project-detail-panel" className="glass-panel rounded-3xl p-6 mb-6 animate-fadeIn">
      
      {/* Upper Title Block */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-white/10 pb-5 mb-5 gap-4">
        <div className="flex items-center gap-3">
          <button 
            id="close-drawer-btn"
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-sans font-black text-white">{project.title}</h2>
              <span className="text-[10px] bg-white/10 text-indigo-300 px-2.5 py-0.5 font-mono rounded-md border border-white/10 font-bold shrink-0">
                {project.code}
              </span>
              <span className="text-[10px] bg-sky-500/10 text-sky-300 px-2 py-0.5 font-mono rounded border border-sky-500/20 max-w-[200px] truncate shrink-0">
                Client: {project.client || "Unspecified"}
              </span>
            </div>
            <p className="text-xs text-slate-450 mt-1 flex items-center gap-1.5 font-sans">
              Subcontractor lead: <strong className="text-slate-300 font-semibold">{project.subcontractorOrEngineer || "N/A"}</strong>
            </p>
          </div>
        </div>

        {/* Global Finances Badges & Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-950/40 border border-white/10 px-4 py-2.5 rounded-2xl flex items-center gap-4 text-right">
            <div>
              <div className="text-[9px] font-mono text-slate-450 uppercase tracking-widest font-black">Contract PO Value</div>
              <div className="text-xs font-mono font-bold text-white mt-0.5">
                {usdFormatter.format(finances.contractAmount)}
              </div>
            </div>
            <div className="border-l border-white/10 pl-4">
              <div className="text-[9px] font-mono text-slate-450 uppercase tracking-widest font-black">Net Cash Received</div>
              <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                {usdFormatter.format(finances.totalPaidNet)}
              </div>
            </div>
            <div className="border-l border-white/10 pl-4">
              <div className="text-[9px] font-mono text-slate-450 uppercase tracking-widest font-black">Project Margins</div>
              <div className={`text-xs font-mono font-black mt-0.5 ${finances.grossProfit >= 0 ? "text-indigo-400" : "text-rose-450"}`}>
                {usdFormatter.format(finances.grossProfit)}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onDeleteProject(project.id)}
            className="p-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/35 rounded-2xl flex items-center gap-1.5 transition-all text-xs font-sans font-bold cursor-pointer shrink-0"
            title="Delete this project entry permanently"
          >
            <Trash2 size={13} /> Delete Project
          </button>
        </div>
      </div>

      {/* 6 Stage Timeline */}
      <div id="project-timeline-6-steps" className="mb-6 bg-white/2 border border-white/5 p-4 rounded-2xl">
        <h3 className="text-[10px] font-mono font-bold text-slate-400 uppercase mb-3 tracking-widest">
          Project 6-Stage Checklist Verification
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5">
          {[
            { step: 1, name: "RFQ Quoted", val: usdFormatter.format(project.rfq.amount), active: stepRFQ },
            { step: 2, name: "PFI Submitted", val: project.pfi ? usdFormatter.format(project.pfi.amount) : "Pending", active: stepPFI },
            { step: 3, name: "PO/MO Received", val: project.poMo ? usdFormatter.format(project.poMo.poAmount) : "Pending", active: stepPOMO },
            { step: 4, name: "Tasks Checklist", val: `${project.tasks.filter(t => t.isCompleted).length}/${project.tasks.length} Done`, active: stepTasks },
            { step: 5, name: "Milestone Invs", val: usdFormatter.format(finances.totalInvoiced), active: stepInvoices },
            { step: 6, name: "Payment Advices", val: `${project.paymentAdvices.length} Reconciled`, active: stepAdvices },
          ].map((inf) => (
            <div 
              key={inf.step}
              className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                inf.active 
                  ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-200" 
                  : "bg-slate-900/40 border-white/5 text-slate-500"
              }`}
            >
              <div>
                <span className="text-[9px] font-mono font-extrabold uppercase">ST{inf.step}</span>
                <div className="text-[10px] font-sans font-bold leading-tight mt-0.5 line-clamp-1">{inf.name}</div>
              </div>
              <div className="mt-2 text-[10px] font-mono font-semibold truncate">{inf.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Tax Reconciliation & Subcontractor Compliance Audit */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 bg-[#0f172a]/50 p-4 border border-white/5 rounded-2xl shadow-lg relative overflow-hidden backdrop-blur-md">
        {/* Card 1: VAT Audit */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-indigo-400 font-extrabold tracking-wider">VAT Audit (7.5%)</span>
            {Math.abs(finances.vatVariance) < 1 ? (
              <span className="text-[9px] bg-emerald-500/15 text-emerald-300 font-mono px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">RECONCILED</span>
            ) : finances.vatVariance > 0 ? (
              <span className="text-[9px] bg-amber-500/15 text-amber-300 font-mono px-1.5 py-0.5 rounded border border-amber-500/20 font-bold">SHORTFALL</span>
            ) : (
              <span className="text-[9px] bg-purple-500/15 text-purple-300 font-mono px-1.5 py-0.5 rounded border border-purple-500/20 font-bold">SURPLUS</span>
            )}
          </div>
          <div className="text-xs text-slate-350 flex justify-between mt-1">
            <span>Expected 7.5%:</span>
            <span className="font-mono text-white font-semibold">{usdFormatter.format(finances.expectedVAT)}</span>
          </div>
          <div className="text-xs text-slate-350 flex justify-between">
            <span>Actual (PA matches):</span>
            <span className="font-mono text-white font-semibold">{usdFormatter.format(finances.totalVAT)}</span>
          </div>
          <div className="border-t border-white/5 pt-1 text-[10px] flex justify-between font-mono">
            <span className="text-slate-450">VAT Variance:</span>
            <span className={`font-black ${finances.vatVariance > 0 ? "text-amber-300" : finances.vatVariance < 0 ? "text-purple-300" : "text-emerald-400"}`}>
              {usdFormatter.format(finances.vatVariance)}
            </span>
          </div>
        </div>

        {/* Card 2: WHT Audit */}
        <div className="space-y-1 border-t md:border-t-0 md:border-l border-white/10 md:pt-0 pt-3 md:pl-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-indigo-400 font-extrabold tracking-wider">WHT Withholding (5%)</span>
            {Math.abs(finances.whtVariance) < 1 ? (
              <span className="text-[9px] bg-emerald-500/15 text-emerald-300 font-mono px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">RECONCILED</span>
            ) : finances.whtVariance > 0 ? (
              <span className="text-[9px] bg-amber-500/15 text-amber-300 font-mono px-1.5 py-0.5 rounded border border-amber-500/20 font-bold">OUTSTANDING</span>
            ) : (
              <span className="text-[9px] bg-purple-500/15 text-purple-300 font-mono px-1.5 py-0.5 rounded border border-purple-500/20 font-bold">OVER-DEDUCTED</span>
            )}
          </div>
          <div className="text-xs text-slate-350 flex justify-between mt-1">
            <span>Expected 5%:</span>
            <span className="font-mono text-white font-semibold">{usdFormatter.format(finances.expectedWHT)}</span>
          </div>
          <div className="text-xs text-slate-350 flex justify-between">
            <span>Actual Withholding:</span>
            <span className="font-mono text-white font-semibold">{usdFormatter.format(finances.totalWHT)}</span>
          </div>
          <div className="border-t border-white/5 pt-1 text-[10px] flex justify-between font-mono">
            <span className="text-slate-450">Withholding Gap:</span>
            <span className={`font-black ${finances.whtVariance > 0 ? "text-amber-300" : finances.whtVariance < 0 ? "text-purple-300" : "text-emerald-400"}`}>
              {usdFormatter.format(finances.whtVariance)}
            </span>
          </div>
        </div>

        {/* Card 3: Subcontractor vs In-House Compliance */}
        <div className="space-y-1 border-t md:border-t-0 md:border-l border-white/10 md:pt-0 pt-3 md:pl-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-indigo-400 font-extrabold tracking-wider">Subcontractor Allocation PO</span>
            {finances.subcontractorPoBudget !== undefined ? (
              finances.subcontractorVariance! >= 0 ? (
                <span className="text-[9px] bg-emerald-500/15 text-emerald-300 font-mono px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">WITHIN BUDGET</span>
              ) : (
                <span className="text-[9px] bg-rose-500/15 text-rose-300 font-mono px-1.5 py-0.5 rounded border border-rose-500/20 font-bold">OVERWARDS OUTLAY</span>
              )
            ) : (
              <span className="text-[9px] bg-teal-500/15 text-teal-300 font-mono px-1.5 py-0.5 rounded border border-teal-500/20 font-bold">DIRECT IN-HOUSE</span>
            )}
          </div>
          {finances.subcontractorPoBudget !== undefined ? (
            <>
              <div className="text-xs text-slate-350 flex justify-between mt-1">
                <span>Custom Subcontract PO Cap:</span>
                <span className="font-mono text-white font-semibold">{usdFormatter.format(finances.subcontractorPoBudget)}</span>
              </div>
              <div className="text-xs text-slate-350 flex justify-between">
                <span>Total Disbursed Sum:</span>
                <span className="font-mono text-white font-semibold">{usdFormatter.format(finances.totalDisbursed)}</span>
              </div>
              <div className="border-t border-white/5 pt-1 text-[10px] flex justify-between font-mono">
                <span className="text-slate-450">Remaining Subcontract PO Cap:</span>
                <span className={`font-black ${finances.subcontractorVariance! >= 0 ? "text-emerald-400" : "text-rose-450"}`}>
                  {usdFormatter.format(finances.subcontractorVariance!)}
                </span>
              </div>
            </>
          ) : (
            <div className="text-[11px] text-slate-405 pt-1 leading-snug">
              🧑‍🚀 Funded in-house operations. Direct operational outlays are captured securely inside <strong>Spent Expenses (₦)</strong> category. No subcontractor contracts are assigned.
            </div>
          )}
        </div>
      </div>

      {/* Primary Tab Bar Routing */}
      <div className="flex border-b border-white/10 overflow-x-auto gap-4 mb-5 scrollbar-none pb-1">
        {[
          { key: "general", label: "Core Contract" },
          { key: "tasks", label: `Tasks (${project.tasks.length})` },
          { key: "invoices", label: `Invoices & JCC (${project.invoices.length})` },
          { key: "advices", label: `Advices (${project.paymentAdvices.length})` },
          { key: "expenses", label: `Spent Expenses (${project.expenses.length})` },
          { key: "disbursements", label: `Disbursals (${project.disbursements.length})` },
          { key: "documents", label: `System Files (${allDocuments.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFormTab(tab.key as any)}
            className={`py-2 px-1 text-xs font-sans font-medium whitespace-nowrap border-b-2 -mb-px transition-all duration-150 cursor-pointer ${
              activeFormTab === tab.key 
                ? "border-indigo-400 text-indigo-400 font-bold" 
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: GENERAL CONTRACT FIELDS */}
      {activeFormTab === "general" && (
        <form onSubmit={handleSaveGeneral} className="space-y-5">
          {!canEditProjects && (
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
              <Lock size={13} className="shrink-0" />
              <span>Viewing Core Contract. Edits are restricted to Project Managers or Administrators.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1 font-bold">Project status</label>
              <select
                disabled={!canEditProjects}
                value={statusVal}
                onChange={(e) => setStatusVal(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2.5 glass-input bg-[#1e293b] rounded-xl text-xs text-white focus:outline-hidden disabled:opacity-50"
              >
                <option value={ProjectStatus.OPEN} className="bg-[#1e293b]">OPEN</option>
                <option value={ProjectStatus.CLOSED} className="bg-[#1e293b]">CLOSED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1 font-bold">Execution Milestone</label>
              <select
                disabled={!canEditProjects}
                value={execStatusVal}
                onChange={(e) => setExecStatusVal(e.target.value as ExecutionStatus)}
                className="w-full px-3 py-2.5 glass-input bg-[#1e293b] rounded-xl text-xs text-white focus:outline-hidden disabled:opacity-50"
              >
                <option value={ExecutionStatus.NOT_STARTED} className="bg-[#1e293b]">NOT STARTED</option>
                <option value={ExecutionStatus.IN_PROGRESS} className="bg-[#1e293b]">IN PROGRESS</option>
                <option value={ExecutionStatus.COMPLETED} className="bg-[#1e293b]">COMPLETED</option>
                <option value={ExecutionStatus.ON_HOLD} className="bg-[#1e293b]">ON HOLD</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1 font-bold">Engineering / Lead Partner Name</label>
              <input
                disabled={!canEditProjects}
                type="text"
                value={subcontractorVal}
                onChange={(e) => setSubcontractorVal(e.target.value)}
                placeholder="Name or agency entity"
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white focus:outline-hidden disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-white/5 bg-white/2 rounded-2xl">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1 font-bold">Personnel Category</label>
              <select
                disabled={!canEditProjects}
                value={personnelTypeVal}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setPersonnelTypeVal(val);
                  if (val === "In-House") setSubcontractorPoAmountVal("");
                }}
                className="w-full px-3 py-2.5 glass-input bg-[#1e293b] rounded-xl text-xs text-white focus:outline-hidden disabled:opacity-50 font-sans"
              >
                <option value="Subcontractor" className="bg-[#1e293b]">Subcontractor Partner</option>
                <option value="In-House" className="bg-[#1e293b]">In-House Engineering</option>
              </select>
            </div>

            {personnelTypeVal === "Subcontractor" ? (
              <div className="md:col-span-2">
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1 font-bold flex items-center justify-between">
                  <span>Subcontractor Custom PO Allocation (₦)</span>
                  <span className="text-[10px] text-indigo-400 font-sans tracking-normal">Discounted from client contract PO</span>
                </label>
                <input
                  disabled={!canEditProjects}
                  type="number"
                  value={subcontractorPoAmountVal}
                  onChange={(e) => setSubcontractorPoAmountVal(e.target.value)}
                  placeholder="e.g. 110000"
                  className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white focus:outline-hidden disabled:opacity-50 font-mono"
                />
              </div>
            ) : (
              <div className="md:col-span-2 flex items-center text-xs text-slate-400 px-2 py-1 leading-relaxed">
                🧑‍🚀 In-house leads represent internal teams funded directly by operational overhead. No contractor discount schedules or contractor-facing PO bounds are parsed.
              </div>
            )}
          </div>

          <div className="border-t border-white/5 pt-4">
            <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest mb-3">Stage 1: RFQ Configuration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">RFQ Date</label>
                <input
                  disabled={!canEditProjects}
                  type="date"
                  value={rfqDate}
                  onChange={(e) => setRfqDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white focus:outline-hidden disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">RFQ Quoted Value (₦)</label>
                <input
                  disabled={!canEditProjects}
                  type="number"
                  value={rfqAmt}
                  onChange={(e) => setRfqAmt(e.target.value)}
                  className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white focus:outline-hidden disabled:opacity-20"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4">
            <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest mb-3">Stage 2: Proforma Invoice Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">PFI Identifier Code</label>
                <input
                  disabled={!canEditProjects}
                  type="text"
                  value={pfiNo}
                  onChange={(e) => setPfiNo(e.target.value)}
                  placeholder="PFI-2026-0XX"
                  className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white focus:outline-hidden disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">PFI Date</label>
                <input
                  disabled={!canEditProjects}
                  type="date"
                  value={pfiDate}
                  onChange={(e) => setPfiDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white focus:outline-hidden disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">PFI Face Amount (₦)</label>
                <input
                  disabled={!canEditProjects}
                  type="number"
                  value={pfiAmt}
                  onChange={(e) => setPfiAmt(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white focus:outline-hidden disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4">
            <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest mb-3">Stage 3: Signed Client PO & MRF Registry</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">PO Number</label>
                <input
                  disabled={!canEditProjects}
                  type="text"
                  value={poNo}
                  onChange={(e) => setPoNo(e.target.value)}
                  placeholder="PO-CONT-XX"
                  className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white focus:outline-hidden disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">PO Award Date</label>
                <input
                  disabled={!canEditProjects}
                  type="date"
                  value={poDateVal}
                  onChange={(e) => setPoDateVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white focus:outline-hidden disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">PO Approved Amount (₦)</label>
                <input
                  disabled={!canEditProjects}
                  type="number"
                  value={poAmt}
                  onChange={(e) => setPoAmt(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white focus:outline-hidden disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Move Order (MO) No.</label>
                <input
                  disabled={!canEditProjects}
                  type="text"
                  value={moNo}
                  onChange={(e) => setMoNo(e.target.value)}
                  placeholder="MO-9901"
                  className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white focus:outline-hidden disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Material Request (MRF)</label>
                <input
                  disabled={!canEditProjects}
                  type="text"
                  value={mrfNo}
                  onChange={(e) => setMrfNo(e.target.value)}
                  placeholder="MRF-501"
                  className="w-full px-3.5 py-2.5 glass-input rounded-xl text-xs text-white focus:outline-hidden disabled:opacity-50"
                />
              </div>
            </div>

            {/* Supplementary / Multiple POs List */}
            <div className="mt-5 pt-4 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                  Supplementary / Additional Client POs ({additionalPos.length})
                </h5>
                <span className="text-[10px] font-mono text-emerald-400 font-extrabold">
                  Cumulated Supplement: {usdFormatter.format(additionalPos.reduce((sum, p) => sum + p.poAmount, 0))}
                </span>
              </div>

              {/* Add New PO Input Row (only if canEditProjects) */}
              {canEditProjects && (
                <div className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl space-y-3">
                  <div className="text-[10px] text-indigo-400 uppercase font-mono font-bold">
                    ➕ Register New Supplementary Client PO
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">PO Number</label>
                      <input
                        type="text"
                        value={newAddPoNo}
                        onChange={(e) => setNewAddPoNo(e.target.value)}
                        placeholder="e.g. PO-PH-ADD-01"
                        className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Approved Amount (₦)</label>
                      <input
                        type="number"
                        value={newAddPoAmt}
                        onChange={(e) => setNewAddPoAmt(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">MO Number (Optional)</label>
                      <input
                        type="text"
                        value={newAddMoNo}
                        onChange={(e) => setNewAddMoNo(e.target.value)}
                        placeholder="e.g. MO-4022"
                        className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">MRF Number (Optional)</label>
                      <input
                        type="text"
                        value={newAddMrfNo}
                        onChange={(e) => setNewAddMrfNo(e.target.value)}
                        placeholder="e.g. MRF-190"
                        className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddSupplementaryPo}
                      className="px-3.5 py-1.5 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 font-sans font-bold text-xs rounded-lg transition-all cursor-pointer"
                    >
                      Add Supplementary PO
                    </button>
                  </div>
                </div>
              )}

              {/* Render Existing Supplementary POs */}
              {additionalPos.length > 0 ? (
                <div className="border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5 font-mono text-[11px]">
                  {additionalPos.map((pos) => (
                    <div key={pos.id} className="p-3 bg-slate-950/20 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-indigo-400 font-bold mr-2">{pos.poNumber}</span>
                        <span className="text-emerald-400 font-extrabold">{usdFormatter.format(pos.poAmount)}</span>
                        {(pos.moNumber || pos.mrfNumber) && (
                          <span className="text-slate-400 text-[10px] ml-3">
                            ({pos.moNumber ? `MO: ${pos.moNumber}` : ""} {pos.moNumber && pos.mrfNumber ? "•" : ""} {pos.mrfNumber ? `MRF: ${pos.mrfNumber}` : ""})
                          </span>
                        )}
                      </div>
                      {canEditProjects && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSupplementaryPo(pos.id)}
                          className="p-1 hover:bg-rose-500/10 text-rose-400 rounded-md transition-colors cursor-pointer"
                          title="Remove supplementary PO"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 italic font-sans py-1">
                  No additional/supplementary Client PO entries registered for this project segment.
                </div>
              )}
            </div>
          </div>

          {canEditProjects && (
            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 font-sans font-bold text-xs text-white rounded-xl hover:bg-indigo-500 transition-all duration-150 cursor-pointer shadow-md"
              >
                Save Core Contract Details
              </button>
            </div>
          )}
        </form>
      )}

      {/* TAB 2: TASKS CHECKLIST (PM FIELD) */}
      {activeFormTab === "tasks" && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/3 space-y-4">
            <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
              Add Milestone Task
            </h4>
            
            {canEditTasks ? (
              <form onSubmit={handleAddTask} className="bg-slate-900/30 p-4 border border-white/5 rounded-2xl space-y-3.5">
                <div>
                  <label className="block text-[11px] text-slate-450 mb-1">Task Description</label>
                  <input
                    type="text"
                    required
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Conduct earth wire loop splicing"
                    className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-slate-450 mb-1">Deadline Date</label>
                    <input
                      type="date"
                      value={newTaskDeadline}
                      onChange={(e) => setNewTaskDeadline(e.target.value)}
                      className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-450 mb-1">Doc Reference</label>
                    <input
                      type="text"
                      value={newTaskDocId}
                      onChange={(e) => setNewTaskDocId(e.target.value)}
                      placeholder="DOC-SOIL-01"
                      className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-white"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 text-xs font-sans font-bold text-white rounded-xl hover:bg-indigo-500 transition-colors"
                >
                  Insert Milestone Task
                </button>
              </form>
            ) : (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-center gap-1.5 leading-snug">
                <Lock size={13} className="shrink-0" />
                <span>Locked: Subcontractor logs can only be queued by project managers.</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
              Project Execution Task Chain
            </h4>
            {project.tasks.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-white/5 text-xs text-slate-400 rounded-2xl">
                No active construction/engineering tasks assigned yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {project.tasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-white/2 border border-white/5 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        disabled={!canEditTasks}
                        onClick={() => handleToggleTask(t.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                          t.isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : "border-white/20 hover:border-indigo-400"
                        }`}
                      >
                        {t.isCompleted && <Check size={10} />}
                      </button>
                      <div>
                        <span className={`text-xs font-sans ${t.isCompleted ? "line-through text-slate-500" : "text-slate-205"}`}>
                          {t.title}
                        </span>
                        <div className="text-[10px] text-slate-450 mt-1 font-mono">
                          Deadline: {t.deadline} {t.milestoneDocId && `| Associated Doc: ${t.milestoneDocId}`}
                        </div>
                      </div>
                    </div>
                    {canDeleteData && (
                      <button onClick={() => handleDeleteTask(t.id)} className="p-1 text-slate-400 hover:text-rose-400">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: INVOICES & JCC (FINANCE FIELD) */}
      {activeFormTab === "invoices" && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/3 space-y-4">
            <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
              Log Milestone Invoice
            </h4>
            
            {canEditFinancials ? (
              <form onSubmit={handleAddInvoice} className="bg-slate-900/30 p-4 border border-white/5 rounded-2xl space-y-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Invoice Code</label>
                  <input
                    type="text"
                    required
                    value={newInvNo}
                    onChange={(e) => setNewInvNo(e.target.value)}
                    placeholder="INV-2026-X1"
                    className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Invoice Face Amount (₦)</label>
                  <input
                    type="number"
                    required
                    value={newInvAmt}
                    onChange={(e) => setNewInvAmt(e.target.value)}
                    placeholder="75000"
                    className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Date</label>
                    <input
                      type="date"
                      value={newInvDate}
                      onChange={(e) => setNewInvDate(e.target.value)}
                      className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">JCC Number</label>
                    <input
                      type="text"
                      value={newInvJcc}
                      onChange={(e) => setNewInvJcc(e.target.value)}
                      placeholder="JCC-IBD-101"
                      className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Initial Status</label>
                  <select
                    value={newInvStatus}
                    onChange={(e) => setNewInvStatus(e.target.value as InvoiceStatus)}
                    className="w-full px-3 py-2.5 glass-input bg-[#1e293b] rounded-xl text-xs text-white"
                  >
                    <option value={InvoiceStatus.SUBMITTED}>Submitted</option>
                    <option value={InvoiceStatus.UNDER_REVIEW}>Under Review</option>
                    <option value={InvoiceStatus.APPROVED}>Approved</option>
                    <option value={InvoiceStatus.DISPUTED}>Disputed / Rejected</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 text-xs font-sans font-bold text-white rounded-xl hover:bg-indigo-500 transition-colors"
                >
                  Generate & Submit Invoice
                </button>
              </form>
            ) : (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-center gap-1.5 leading-snug">
                <Lock size={13} className="shrink-0" />
                <span>Locked: Submitting and approving client invoices requires Finance authorization.</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
              Submitted Milestone Invoices Summary
            </h4>
            {project.invoices.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-white/5 text-xs text-slate-400 rounded-2xl">
                No milestone invoices have been logged.
              </div>
            ) : (
              <div className="space-y-2">
                {project.invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 bg-white/2 border border-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-300">
                        <FileText size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold font-mono text-white">
                          Code: {inv.invoiceNumber} | <strong className="text-slate-200">{usdFormatter.format(inv.invoiceAmount)}</strong>
                        </div>
                        <div className="text-[10px] text-slate-405 font-mono mt-0.5">
                          Submitted: {inv.submissionDate} {inv.jccNumber && `| JCC Check No: ${inv.jccNumber}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        disabled={!canEditFinancials}
                        value={inv.status}
                        onChange={(e) => handleUpdateInvoiceStatus(inv.id, e.target.value as InvoiceStatus)}
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                          inv.status === InvoiceStatus.APPROVED 
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20" 
                            : "bg-amber-500/15 text-amber-300 border-amber-500/25"
                        }`}
                      >
                        <option value={InvoiceStatus.SUBMITTED}>SUBMITTED</option>
                        <option value={InvoiceStatus.UNDER_REVIEW}>UNDER REVIEW</option>
                        <option value={InvoiceStatus.APPROVED}>APPROVED</option>
                        <option value={InvoiceStatus.DISPUTED}>DISPUTED</option>
                      </select>
                      {canDeleteData && (
                        <button onClick={() => handleDeleteInvoice(inv.id)} className="p-1 text-slate-400 hover:text-rose-400">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENT ADVICES */}
      {activeFormTab === "advices" && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/3 space-y-4">
            <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
              Unpack Payment Advice
            </h4>
            {canEditFinancials ? (
              <form onSubmit={handleAddAdvice} className="bg-slate-900/30 p-4 border border-white/5 rounded-2xl space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">PA Code No.</label>
                    <input
                      type="text" required value={newAdviceNo}
                      onChange={(e) => setNewAdviceNo(e.target.value)}
                      placeholder="PA-44901" className="w-full px-2.5 py-2 glass-input rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Approved Invoice</label>
                    <select
                      value={newAdviceInv}
                      onChange={(e) => {
                        const invNo = e.target.value;
                        setNewAdviceInv(invNo);
                        const matchedInv = project.invoices.find(iv => iv.invoiceNumber === invNo);
                        if (matchedInv) {
                          const amt = matchedInv.invoiceAmount;
                          setNewAdviceAmt(amt.toString());
                          setNewAdviceVat((amt * 0.075).toFixed(2));
                          setNewAdviceWht((amt * 0.05).toFixed(2));
                          setNewAdviceRetention((amt * 0.10).toFixed(2));
                        }
                      }}
                      required
                      className="w-full px-2.5 py-2 bg-[#1e293b] text-xs text-white border border-white/10 rounded-xl"
                    >
                      <option value="">-- Choose Invoice --</option>
                      {project.invoices.map(i => (
                        <option key={i.id} value={i.invoiceNumber}>{i.invoiceNumber} ({usdFormatter.format(i.invoiceAmount)})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Approved Gross (₦)</label>
                    <input
                      type="number" required value={newAdviceAmt}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewAdviceAmt(val);
                        const amt = parseFloat(val);
                        if (!isNaN(amt)) {
                          setNewAdviceVat((amt * 0.075).toFixed(2));
                          setNewAdviceWht((amt * 0.05).toFixed(2));
                          setNewAdviceRetention((amt * 0.10).toFixed(2));
                        }
                      }}
                      placeholder="70000" className="w-full px-2.5 py-2 glass-input rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Date Paid</label>
                    <input
                      type="date" value={newAdviceDate}
                      onChange={(e) => setNewAdviceDate(e.target.value)}
                      className="w-full px-2.5 py-2 glass-input rounded-xl text-xs text-white"
                    />
                  </div>
                </div>

                <div className="border-t border-white/5 pt-2 grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] text-slate-450 leading-none mb-1">VAT 7.5%</label>
                    <input
                      type="number" value={newAdviceVat}
                      onChange={(e) => setNewAdviceVat(e.target.value)}
                      placeholder="0" className="w-full px-2 py-1.5 glass-input rounded-lg text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-450 leading-none mb-1">WHT 5%</label>
                    <input
                      type="number" value={newAdviceWht}
                      onChange={(e) => setNewAdviceWht(e.target.value)}
                      placeholder="0" className="w-full px-2 py-1.5 glass-input rounded-lg text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-450 leading-none mb-1">Retention 10%</label>
                    <input
                      type="number" value={newAdviceRetention}
                      onChange={(e) => setNewAdviceRetention(e.target.value)}
                      placeholder="0" className="w-full px-2 py-1.5 glass-input rounded-lg text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-slate-450 leading-none mb-1">Other Charges</label>
                    <input
                      type="number" value={newAdviceCharges}
                      onChange={(e) => setNewAdviceCharges(e.target.value)}
                      placeholder="0" className="w-full px-2 py-1.5 glass-input rounded-lg text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-450 leading-none mb-1">Credit Note Minus</label>
                    <input
                      type="number" value={newAdviceCredit}
                      onChange={(e) => setNewAdviceCredit(e.target.value)}
                      placeholder="0" className="w-full px-2 py-1.5 glass-input rounded-lg text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 text-xs font-sans font-bold text-white rounded-xl hover:bg-indigo-500 transition-colors cursor-pointer"
                >
                  Map Payment Advice
                </button>
              </form>
            ) : (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-center gap-1.5">
                <Lock size={13} className="shrink-0" />
                <span>Locked: Auditing bank advice structures is restricted to Finance.</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
              Reconciled Advice Logs
            </h4>
            {project.paymentAdvices.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-white/5 text-xs text-slate-400 rounded-2xl">
                No bank payment advices mapped for this construction contract.
              </div>
            ) : (
              <div className="space-y-2">
                {project.paymentAdvices.map((pa) => (
                  <div key={pa.id} className="p-3 bg-white/2 border border-white/5 rounded-xl text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-white">PA-No: {pa.adviceNumber} | Date: {pa.date}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-mono font-extrabold font-bold">
                          Approved Gross: {usdFormatter.format(pa.approvedAmount)}
                        </span>
                        {canDeleteData && (
                          <button onClick={() => handleDeleteAdvice(pa.id)} className="text-slate-450 hover:text-rose-450">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-6 gap-2 text-[10px] text-slate-400 border-t border-white/5 pt-2 font-mono">
                      <div>VAT: +{usdFormatter.format(pa.vat)}</div>
                      <div className="text-rose-300">WHT: -{usdFormatter.format(pa.wht)}</div>
                      <div className="text-rose-300">Ret: -{usdFormatter.format(pa.retention)}</div>
                      <div className="text-rose-300">Chg: -{usdFormatter.format(pa.charges)}</div>
                      <div className="text-rose-300">CrNote: -{usdFormatter.format(pa.creditNote)}</div>
                      <div className="text-white font-bold bg-white/5 text-center px-1 rounded">
                        Net: {usdFormatter.format(pa.approvedAmount + pa.vat - pa.wht - pa.retention - pa.charges - pa.creditNote)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: SPENT EXPENSES */}
      {activeFormTab === "expenses" && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/3 space-y-4">
            <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
              Log Expenditures
            </h4>
            {canEditFinancials ? (
              <form onSubmit={handleAddExpense} className="bg-slate-900/30 p-4 border border-white/5 rounded-2xl space-y-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Expense Category</label>
                  <select
                    value={newExpCategory}
                    onChange={(e) => setNewExpCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 glass-input bg-[#1e293b] rounded-xl text-xs text-white"
                  >
                    <option value="Logistics">Logistics (Travel, Crane, Fuel)</option>
                    <option value="Sundry">Sundry (PPE, Consumables)</option>
                    <option value="Other">Other Operational Spend</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Detailed Description</label>
                  <input
                    type="text" required value={newExpDesc}
                    onChange={(e) => setNewExpDesc(e.target.value)}
                    placeholder="Crane transport & flatbed delivery" className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-404 mb-1">Amount Spent (₦)</label>
                    <input
                      type="number" required value={newExpAmt}
                      onChange={(e) => setNewExpAmt(e.target.value)}
                      placeholder="0.00" className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-404 mb-1">Date</label>
                    <input
                      type="date" value={newExpDate}
                      onChange={(e) => setNewExpDate(e.target.value)}
                      className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-white"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 text-xs font-sans font-bold text-white rounded-xl hover:bg-indigo-500 transition-colors"
                >
                  Post Operational Expense
                </button>
              </form>
            ) : (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-center gap-1.5 font-sans">
                <Lock size={13} className="shrink-0" />
                <span>Locked: Ledger expenses strictly restricted to Finance personnel.</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
              Site Operational Expenditures
            </h4>
            {project.expenses.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-white/5 text-xs text-slate-400 rounded-2xl">
                No expense receipts associated with this construction lifecycle yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {project.expenses.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between p-3 bg-white/2 border border-white/5 rounded-xl text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{exp.description}</span>
                        <span className="bg-sky-500/10 text-sky-300 px-1.5 py-0.2 rounded text-[9px] font-mono">{exp.category}</span>
                      </div>
                      <span className="text-[10px] text-slate-450 mt-1 block font-mono">Date Filed: {exp.date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-rose-400">-{usdFormatter.format(exp.amount)}</span>
                      {canDeleteData && (
                        <button onClick={() => handleDeleteExpense(exp.id)} className="p-1 text-slate-400 hover:text-rose-455">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: DISBURSEMENT DETAILS */}
      {activeFormTab === "disbursements" && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/3 space-y-4">
            <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
              Disburse Site Outflow
            </h4>
            {canEditFinancials ? (
              <form onSubmit={handleAddDisbursement} className="bg-slate-900/30 p-4 border border-white/5 rounded-2xl space-y-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Contractor / recipient</label>
                  <input
                    type="text" required value={newDisbRecipient}
                    onChange={(e) => setNewDisbRecipient(e.target.value)}
                    placeholder="Simeon Roadworks Ltd" className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Disbursal Work Scope Purpose</label>
                  <input
                    type="text" value={newDisbDesc}
                    onChange={(e) => setNewDisbDesc(e.target.value)}
                    placeholder="Milestone Release / Procurement fund" className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Outflow Sum (₦)</label>
                    <input
                      type="number" required value={newDisbAmt}
                      onChange={(e) => setNewDisbAmt(e.target.value)}
                      placeholder="0" className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Execute Date</label>
                    <input
                      type="date" value={newDisbDate}
                      onChange={(e) => setNewDisbDate(e.target.value)}
                      className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-white"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 text-xs font-sans font-bold text-white rounded-xl hover:bg-indigo-500 transition-colors"
                >
                  Pay Down Contractor
                </button>
              </form>
            ) : (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-center gap-1.5 font-sans">
                <Lock size={13} className="shrink-0" />
                <span>Locked: Disbursement triggers require Finance Officer clearance.</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
              Subcontractor Milestone Cash Outflows
            </h4>
            {project.disbursements.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-white/5 text-xs text-slate-400 rounded-2xl">
                No outbound subcontractor dispersals found in the ledger.
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {project.disbursements.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-3 bg-white/2 border border-white/5 rounded-xl text-xs">
                    <div>
                      <div className="font-bold text-white">{d.recipient}</div>
                      <div className="text-[10px] text-slate-450 mt-0.5">{d.description || "Subcontractor fee"}</div>
                      <span className="text-[9px] text-slate-455 font-mono">Paid Date: {d.date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-rose-400">-{usdFormatter.format(d.amount)}</span>
                      {canDeleteData && (
                        <button onClick={() => handleDeleteDisbursement(d.id)} className="p-1 text-slate-400 hover:text-rose-455">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: PROJECT DOCUMENTS (DOCUMENT MANAGEMENT SYSTEM) */}
      {activeFormTab === "documents" && (
        <div className="space-y-5 animate-fadeIn">
          
          {/* Documents Header & Search Toolbelt */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
                Lifecycle Document Management Vault
              </h4>
              <p className="text-[11px] text-slate-400">Upload, categorize, or download documents associated with engineering stages.</p>
            </div>

            {/* Document Search */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
              <input
                type="text"
                placeholder="Search specs, invoice numbers, refs..."
                value={docSearchQuery}
                onChange={(e) => setDocSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 glass-input rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Core DMS Splitter Pane */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Upload Controls */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Native Drag-and-Drop Area */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                  isDragging 
                    ? "border-indigo-400 bg-indigo-500/10 text-indigo-200 shadow-lg shadow-indigo-500/5 scale-[1.01]" 
                    : "border-white/10 bg-slate-900/20 hover:border-white/20 text-slate-400"
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                  <UploadCloud size={24} />
                </div>
                <div>
                  <span className="text-xs font-sans font-bold text-white">Drag & drop files or click to browse</span>
                  <p className="text-[10px] text-slate-450 mt-1">Supports PDF, XLSX, images, and receipt text logs up to 10MB</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleNativeFileUpload(e.target.files[0]);
                    }
                  }}
                />
              </div>

              {/* Manual/Mock Form Attachment (Alternative) */}
              <form onSubmit={handleAddDocumentFromForm} className="bg-slate-900/35 border border-white/5 p-4 rounded-2xl space-y-3.5">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                  Add Document Manually:
                </span>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Document File Name</label>
                  <input
                    type="text" required value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    placeholder="e.g. JCC_Witness_Signoff_Abbey_Electrical.pdf"
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Categorized Stage Type</label>
                    <select
                      value={newDocType}
                      onChange={(e) => setNewDocType(e.target.value as any)}
                      className="w-full px-2.5 py-2 bg-[#1e293b] text-xs text-white border border-white/10 rounded-xl"
                    >
                      <option value="rfq">ST1: RFQ Specifications</option>
                      <option value="pfi">ST2: Proforma Invoice (PFI)</option>
                      <option value="po">ST3: Purchase Order (PO)</option>
                      <option value="mo">ST3: Move Order (MO)</option>
                      <option value="jcc">ST5: Joint Comp. Cert (JCC)</option>
                      <option value="milestone">ST4: Milestone Release Docs</option>
                      <option value="invoice">ST5: Submitted Milestone Invoice</option>
                      <option value="advice">ST6: Signed Payment Advice</option>
                      <option value="receipt">Site Expense Receipts</option>
                      <option value="other">Other Auditable Docs</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Link Reference No.</label>
                    <input
                      type="text" value={newDocRef}
                      onChange={(e) => setNewDocRef(e.target.value)}
                      placeholder="e.g. PO-CONT-770"
                      className="w-full px-3 py-2 glass-input rounded-xl text-xs text-white"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 font-sans font-bold text-xs text-white rounded-xl transition-all"
                >
                  Link Document to Project
                </button>
              </form>

            </div>

            {/* Right Document Log / Grid */}
            <div className="lg:col-span-7 space-y-3">
              <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest flex items-center justify-between">
                <span>Active Vault Folders ({filteredDocs.length} files)</span>
                {docSearchQuery && <span className="text-[10px] text-indigo-300 normal-case">Filtered active</span>}
              </h4>

              {filteredDocs.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl text-xs text-slate-450 bg-[#0f172a]/30">
                  <AlertCircle size={20} className="mx-auto text-slate-500 mb-2.5 animate-bounce" />
                  No documents found matching your search term. <br />
                  <span className="text-[10px] text-slate-500 block mt-1">Try searching by extension or upload code ref keys.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
                  {filteredDocs.map((doc) => {
                    
                    // Specific Category Color Mapping
                    const colorMap: { [key: string]: { bg: string, txt: string, bdr: string } } = {
                      rfq: { bg: "bg-rose-500/10", txt: "text-rose-300", bdr: "border-rose-500/25" },
                      pfi: { bg: "bg-orange-500/10", txt: "text-orange-300", bdr: "border-orange-500/25" },
                      po: { bg: "bg-amber-500/10", txt: "text-amber-300", bdr: "border-amber-500/25" },
                      mo: { bg: "bg-blue-500/10", txt: "text-blue-300", bdr: "border-blue-500/25" },
                      milestone: { bg: "bg-indigo-500/10", txt: "text-indigo-300", bdr: "border-indigo-500/25" },
                      jcc: { bg: "bg-purple-500/10", txt: "text-purple-300", bdr: "border-purple-500/25" },
                      invoice: { bg: "bg-pink-500/10", txt: "text-pink-300", bdr: "border-pink-500/25" },
                      advice: { bg: "bg-emerald-500/10", txt: "text-emerald-300", bdr: "border-emerald-500/25" },
                      receipt: { bg: "bg-teal-500/10", txt: "text-teal-300", bdr: "border-teal-500/25" },
                      other: { bg: "bg-slate-500/10", txt: "text-slate-300", bdr: "border-slate-500/25" }
                    };

                    const style = colorMap[doc.type] || colorMap.other;

                    return (
                      <div 
                        key={doc.id}
                        className="p-3.5 bg-[#1e293b]/40 hover:bg-[#1e293b]/60 border border-white/5 rounded-2xl flex flex-col justify-between hover:border-white/15 hover:shadow-lg transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${style.bg} ${style.txt} ${style.bdr}`}>
                              {doc.type.toUpperCase()}
                            </span>
                            <span className="text-[9px] font-mono text-slate-450">{doc.fileSize}</span>
                          </div>

                          <div className="text-xs font-sans font-extrabold text-white leading-snug break-all line-clamp-2">
                            {doc.name}
                          </div>

                          {doc.docRef && (
                            <span className="inline-block bg-white/5 text-slate-300 px-1.5 py-0.5 font-mono text-[9px] font-bold rounded mt-2 uppercase border border-white/5">
                              Ref: {doc.docRef}
                            </span>
                          )}
                        </div>

                        {/* File Action Tray */}
                        <div className="flex items-center justify-between border-t border-white/5 pt-2.5 mt-3">
                          <span className="text-[9px] font-mono text-slate-450 truncate max-w-[120px]" title={`By ${doc.uploadedBy}`}>
                            By: {doc.uploadedBy}
                          </span>
                          
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => triggerDownload(doc)}
                              className="p-1 px-1.5 bg-indigo-500/10 hover:bg-indigo-550/20 text-indigo-300 rounded hover:text-white transition-all text-[10px] font-sans font-bold flex items-center gap-1 cursor-pointer"
                              title="Download document output logs"
                            >
                              <Download size={10} /> Download
                            </button>
                            {canDeleteData && (
                              <button
                                type="button"
                                onClick={() => handleDeleteDoc(doc.id)}
                                className="p-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded hover:text-white transition-all cursor-pointer"
                                title="Delete document permanently"
                              >
                                <Trash2 size={10} />
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
