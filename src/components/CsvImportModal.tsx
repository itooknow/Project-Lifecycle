import React, { useState, useRef } from "react";
import { Project, ProjectStatus, ExecutionStatus } from "../types";
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Info,
  Layers
} from "lucide-react";

interface CsvImportModalProps {
  onClose: () => void;
  onImport: (newProjects: Project[], overwrite: boolean) => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ onClose, onImport }) => {
  const [csvText, setCsvText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [parsedProjects, setParsedProjects] = useState<Project[]>([]);
  const [importOption, setImportOption] = useState<"append" | "overwrite">("append");
  const [error, setError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"projects" | "payment_advice">("projects");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download Sample Template CSV for Payment Advice
  const handleDownloadAdviceTemplate = () => {
    const headers = [
      "Payment Advice Number",
      "Invoice Number",
      "Payment Date",
      "Invoice Amount",
      "Amount Withheld",
      "Amount Paid"
    ];
    
    const sampleRows = [
      ["PA/2023/X901", "INV-KAD-001", "2023-04-12", "1500000", "150000", "1350000"],
      ["PA/2024/G104", "INV-PHC-102", "2024-09-25", "4500000", "450000", "4050000"],
      ["PA/2025/M339", "INV-LAG-221", "2025-11-05", "850005", "85000", "765005"]
    ];

    const csvContent = [
      headers.join(","),
      ...sampleRows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Payment_Advice_Audit_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Sample Template CSV
  const handleDownloadTemplate = () => {
    const headers = [
      "Project Title",
      "Project Code",
      "Client Partner",
      "Personnel Category",
      "Lead Personnel / Agency",
      "Status",
      "Stage Milestone",
      "RFQ Bid Amount (₦)",
      "PO Number",
      "Contract Approved Amount (₦)",
      "Move Order (MO) No",
      "Invoice Number",
      "Subcontractor Custom PO Allocation (₦)"
    ];
    
    const sampleRows = [
      ["Lagos Orbital Road Rehab", "LAG-RD-2026", "LSMG", "Subcontractor", "Akins & Sons Ltd", "OPEN", "IN_PROGRESS", "12500000", "PO-LAG-REF-01", "15000000", "MO-LAG-01", "INV-LAG-101", "11000000"],
      ["Lagos Orbital Road Rehab", "LAG-RD-2026", "LSMG", "Subcontractor", "Akins & Sons Ltd", "OPEN", "IN_PROGRESS", "12500000", "PO-LAG-REF-02", "5000000", "MO-LAG-02", "INV-LAG-102", "3000000"],
      ["Ikoyi Flood Drainage Stage II", "", "Federal Ministry of Works", "In-House", "Engr. Yusuf Bello", "OPEN", "NOT_STARTED", "7500000", "PO-IKY-MAIN", "9000000", "MO-IKY-99", "INV-IKY-501", ""]
    ];

    const csvContent = [
      headers.join(","),
      ...sampleRows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Project_Lifecycle_Import_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper code to parse CSV standard strings (handles quoted fields)
  const parseCSVString = (text: string): string[][] => {
    const result: string[][] = [];
    const lines = text.split(/\r?\n/);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const row: string[] = [];
      let insideQuote = false;
      let currentField = "";
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          row.push(currentField.trim());
          currentField = "";
        } else {
          currentField += char;
        }
      }
      row.push(currentField.trim());
      result.push(row);
    }
    return result;
  };

  const handleProcessCSV = (textToProcess: string) => {
    setError(null);
    try {
      if (!textToProcess.trim()) {
        setError("Please select a file or paste CSV text first.");
        return;
      }

      const rows = parseCSVString(textToProcess);
      if (rows.length < 2) {
        setError("CSV must contain at least a header row and one project data row.");
        return;
      }

      if (importMode === "payment_advice") {
        const headers = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
        
        const colIndices = {
          adviceNo: headers.findIndex(h => h.includes("advice") || h.includes("advno") || h.includes("pa")),
          invoiceNo: headers.findIndex(h => h.includes("invoice") || h.includes("inv")),
          paymentDate: headers.findIndex(h => h.includes("date") || h.includes("paymentdate") || h.includes("paydate")),
          invoiceAmt: headers.findIndex(h => h.includes("invoiceamount") || h.includes("invoiceval") || h.includes("invamount") || h === "amount" || h.includes("faceamount")),
          withheld: headers.findIndex(h => h.includes("withheld") || h.includes("withholding") || h.includes("deductions")),
          paid: headers.findIndex(h => h.includes("paid") || h.includes("cash") || h.includes("amountpaid") || h.includes("net"))
        };

        if (colIndices.adviceNo === -1 || colIndices.invoiceNo === -1) {
          setError("Could not automatically map columns. Ensure 'Payment Advice Number' and 'Invoice Number' columns are present in headers.");
          return;
        }

        const cleanNo = (valStr: string) => {
          if (!valStr) return 0;
          return Number(valStr.replace(/[^0-9.]/g, "")) || 0;
        };

        const reconstructedProjects: Project[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length < 2) continue;

          const adviceNumber = (row[colIndices.adviceNo] || "").replace(/"/g, "").trim();
          const invoiceNumber = (row[colIndices.invoiceNo] || "").replace(/"/g, "").trim();
          if (!adviceNumber || !invoiceNumber) continue;

          const paymentDateVal = colIndices.paymentDate !== -1 && row[colIndices.paymentDate] ? row[colIndices.paymentDate].trim() : "2026-01-01";
          const invoiceAmtVal = colIndices.invoiceAmt !== -1 ? cleanNo(row[colIndices.invoiceAmt]) : 0;
          const withheldAmtVal = colIndices.withheld !== -1 ? cleanNo(row[colIndices.withheld]) : 0;
          const paidAmtVal = colIndices.paid !== -1 ? cleanNo(row[colIndices.paid]) : (invoiceAmtVal - withheldAmtVal);

          // Work backwards: extract Code from Invoice Number
          let codeVal = "PH";
          const parts = invoiceNumber.split("-").filter(p => p.length > 0);
          if (parts.length > 1) {
            codeVal = parts[1].toUpperCase();
          } else {
            codeVal = invoiceNumber.replace(/[^a-zA-Z]/g, "").toUpperCase();
            if (codeVal.startsWith("INV")) codeVal = codeVal.replace("INV", "");
            if (!codeVal) codeVal = "GEN";
            codeVal = codeVal.slice(0, 4);
          }

          const year = paymentDateVal.split("-")[0] || "2026";
          const finalCode = `${codeVal}-${year}`;

          let targetProject = reconstructedProjects.find(p => p.code === finalCode);

          if (!targetProject) {
            targetProject = {
              id: `prj_reconstructed_${finalCode}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              code: finalCode,
              title: `Legacy Asset Rehab Segment (${codeVal})`,
              client: codeVal.includes("LAG") ? "Lagos State Works Commission" : "Shell Dev Offshore Lead",
              status: ProjectStatus.OPEN,
              executionStatus: ExecutionStatus.COMPLETED,
              subcontractorOrEngineer: "Recon Resident Lead Engineer",
              personnelType: "In-House",
              createdAt: paymentDateVal,
              rfq: {
                date: new Date(new Date(paymentDateVal).getTime() - 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                amount: invoiceAmtVal * 1.1
              },
              pfi: {
                invoiceNumber: `PFI-${finalCode}`,
                date: new Date(new Date(paymentDateVal).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                amount: invoiceAmtVal
              },
              poMo: {
                poNumber: `PO-RECON-${finalCode}`,
                poAmount: 0, // sum of all matched invoices
                moNumber: `MO-RECON-${finalCode}`,
                mrfNumber: `MRF-RECON-${finalCode}`,
                poDate: new Date(new Date(paymentDateVal).getTime() - 25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                additionalPos: []
              },
              tasks: [
                { id: `task_recon1_${finalCode}`, title: "Mobilization of Recon Tools", isCompleted: true, deadline: paymentDateVal },
                { id: `task_recon2_${finalCode}`, title: "Final Retroactive Audit Match", isCompleted: true, deadline: paymentDateVal }
              ],
              invoices: [],
              paymentAdvices: [],
              expenses: [],
              disbursements: [],
              documents: []
            };
            reconstructedProjects.push(targetProject);
          }

          if (targetProject.poMo) {
            targetProject.poMo.poAmount += invoiceAmtVal;
          }

          const invoiceExists = targetProject.invoices.some(inv => inv.invoiceNumber === invoiceNumber);
          if (!invoiceExists) {
            targetProject.invoices.push({
              id: `inv_recon_${invoiceNumber}_${i}`,
              invoiceNumber: invoiceNumber,
              invoiceAmount: invoiceAmtVal,
              submissionDate: new Date(new Date(paymentDateVal).getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              jccNumber: `JCC-RECON-${invoiceNumber.split("-").pop() || i}`,
              status: "APPROVED" as any
            });
          }

          const adviceExists = targetProject.paymentAdvices.some(adv => adv.adviceNumber === adviceNumber);
          if (!adviceExists) {
            targetProject.paymentAdvices.push({
              id: `adv_recon_${adviceNumber}_${i}`,
              adviceNumber: adviceNumber,
              poNumber: targetProject.poMo?.poNumber || `PO-RECON-${finalCode}`,
              invoiceNumber: invoiceNumber,
              approvedAmount: invoiceAmtVal,
              vat: 0,
              wht: withheldAmtVal,
              retention: 0,
              charges: 0,
              creditNote: 0,
              date: paymentDateVal
            });
          }
        }

        if (reconstructedProjects.length === 0) {
          setError("Could not parse any valid payment advice rows.");
          return;
        }

        setParsedProjects(reconstructedProjects);
        return;
      }

      // Convert header words to clean tags to find matches
      const headers = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
      
      // Map columns
      const colIndices = {
        code: headers.findIndex(h => h.includes("code")),
        title: headers.findIndex(h => h.includes("title") || h.includes("name") || h.includes("project")),
        client: headers.findIndex(h => h.includes("client") || h.includes("partner")),
        personnelType: headers.findIndex(h => h.includes("personnelcategory") || h.includes("type")),
        lead: headers.findIndex(h => h.includes("lead") || h.includes("engineer") || h.includes("agency") || h.includes("subcontractor")),
        status: headers.findIndex(h => h.includes("status")),
        milestone: headers.findIndex(h => h.includes("milestone") || h.includes("stage")),
        rfqAmt: headers.findIndex(h => h.includes("rfq")),
        poAmt: headers.findIndex(h => h.includes("approvedamount") || h.includes("contract") || h.includes("poamount") || h.includes("posum")),
        subAlloc: headers.findIndex(h => h.includes("subcontractor") || h.includes("allocation") || h.includes("allotment")),
        poNo: headers.findIndex(h => h.includes("ponumber") || h === "po" || h.includes("purchaseorder") || h.includes("pocode")),
        moNo: headers.findIndex(h => h.includes("monumber") || h === "mo" || h.includes("moveorder")),
        invoiceNo: headers.findIndex(h => h.includes("invoicenumber") || h === "invoice" || h.includes("invnumber") || h.includes("invno")),
        invoiceAmt: headers.findIndex(h => h.includes("invoiceamount") || h.includes("invoiceval") || h.includes("invamount"))
      };

      if (colIndices.title === -1) {
        setError("Required column 'Project Title' could not be automatically mapping-identified. Ensure headers are present.");
        return;
      }

      const projectsToImport: Project[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 2) continue; // Skip empty/garbage rows

        const titleVal = (row[colIndices.title] || "").replace(/"/g, "").trim();
        if (!titleVal) continue;

        // CodeVal calculation (Project Code is no longer strictly required)
        let codeVal = "";
        if (colIndices.code !== -1 && row[colIndices.code]) {
          codeVal = row[colIndices.code].toUpperCase().replace(/"/g, "").trim();
        }
        if (!codeVal) {
          const words = titleVal.split(/\s+/).filter(w => w.length > 0).map(w => w.replace(/[^a-zA-Z0-9]/g, ""));
          if (words.length > 0) {
            codeVal = words.slice(0, 3).map(w => w.slice(0, 3).toUpperCase()).join("-");
          } else {
            codeVal = "PRJ";
          }
          codeVal += `-${i}`;
        }

        const clientVal = colIndices.client !== -1 && row[colIndices.client] ? row[colIndices.client].replace(/"/g, "") : "Direct Client";
        
        let personnelCat: "Subcontractor" | "In-House" = "In-House";
        if (colIndices.personnelType !== -1 && row[colIndices.personnelType]) {
          const typeStr = row[colIndices.personnelType].toLowerCase();
          if (typeStr.includes("sub")) personnelCat = "Subcontractor";
        } else if (colIndices.lead !== -1 && row[colIndices.lead]) {
          const leadStr = row[colIndices.lead].toLowerCase();
          if (leadStr.includes("subcontractor") || leadStr.includes("ltd") || leadStr.includes("genco")) {
            personnelCat = "Subcontractor";
          }
        }

        const leadVal = colIndices.lead !== -1 && row[colIndices.lead] ? row[colIndices.lead].replace(/"/g, "") : (personnelCat === "Subcontractor" ? "External Agency" : "Resident Engineer");
        
        let statusVal = ProjectStatus.OPEN;
        if (colIndices.status !== -1 && row[colIndices.status]) {
          const s = row[colIndices.status].toUpperCase();
          if (s.includes("CLOSED")) statusVal = ProjectStatus.CLOSED;
        }

        let stageVal = ExecutionStatus.NOT_STARTED;
        if (colIndices.milestone !== -1 && row[colIndices.milestone]) {
          const m = row[colIndices.milestone].toUpperCase().replace(/-/g, "_");
          if (m.includes("PROGRESS")) stageVal = ExecutionStatus.IN_PROGRESS;
          else if (m.includes("COMPLET")) stageVal = ExecutionStatus.COMPLETED;
          else if (m.includes("HOLD")) stageVal = ExecutionStatus.ON_HOLD;
        }

        // Numeric fields parsing
        const cleanNo = (valStr: string) => {
          if (!valStr) return 0;
          return Number(valStr.replace(/[^0-9.]/g, "")) || 0;
        };

        const rfqAmount = colIndices.rfqAmt !== -1 ? cleanNo(row[colIndices.rfqAmt]) : 0;
        const contractAmount = colIndices.poAmt !== -1 ? cleanNo(row[colIndices.poAmt]) : rfqAmount * 1.1; // estimate approved
        const subBudget = colIndices.subAlloc !== -1 ? cleanNo(row[colIndices.subAlloc]) : undefined;

        const rowPoNo = colIndices.poNo !== -1 && row[colIndices.poNo] ? row[colIndices.poNo].replace(/"/g, "").trim() : "";
        const rowMoNo = colIndices.moNo !== -1 && row[colIndices.moNo] ? row[colIndices.moNo].replace(/"/g, "").trim() : "";
        const rowInvoiceNo = colIndices.invoiceNo !== -1 && row[colIndices.invoiceNo] ? row[colIndices.invoiceNo].replace(/"/g, "").trim() : "";
        const rowInvoiceAmt = colIndices.invoiceAmt !== -1 && row[colIndices.invoiceAmt] ? cleanNo(row[colIndices.invoiceAmt]) : 0;

        // Group rows that describe the same project (by Project code or Project title)
        const existingProject = projectsToImport.find(
          p => p.code === codeVal || p.title.toLowerCase() === titleVal.toLowerCase()
        );

        if (existingProject) {
          // Keep existing and append additional POs/Invoices/MOs
          if (rowPoNo) {
            if (!existingProject.poMo) {
              existingProject.poMo = {
                poNumber: rowPoNo,
                poAmount: contractAmount,
                moNumber: rowMoNo || `MO-${codeVal}-00`,
                mrfNumber: `MRF-${codeVal}-01`,
                additionalPos: []
              };
            } else {
              if (!existingProject.poMo.additionalPos) {
                existingProject.poMo.additionalPos = [];
              }
              const exists = existingProject.poMo.poNumber === rowPoNo || existingProject.poMo.additionalPos.some(ap => ap.poNumber === rowPoNo);
              if (!exists) {
                existingProject.poMo.additionalPos.push({
                  id: `add_po_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}`,
                  poNumber: rowPoNo,
                  poAmount: contractAmount,
                  moNumber: rowMoNo || undefined,
                  mrfNumber: `MRF-${codeVal}-${existingProject.poMo.additionalPos.length + 2}`
                });
              }
            }
          }

          if (rowInvoiceNo) {
            const invoiceAmtToUse = rowInvoiceAmt || contractAmount || rfqAmount;
            const invoiceExists = existingProject.invoices.some(inv => inv.invoiceNumber === rowInvoiceNo);
            if (!invoiceExists) {
              existingProject.invoices.push({
                id: `inv_imported_${Date.now()}_${i}`,
                invoiceNumber: rowInvoiceNo,
                invoiceAmount: invoiceAmtToUse,
                submissionDate: new Date().toISOString().split("T")[0],
                jccNumber: `JCC-${codeVal}-${existingProject.invoices.length + 1}`,
                status: "APPROVED" as any
              });
            }
          }
        } else {
          // Construct standard complete project item
          const newProject: Project = {
            id: `prj_${Date.now()}_${i}_${Math.floor(Math.random() * 10000)}`,
            code: codeVal,
            title: titleVal,
            client: clientVal,
            status: statusVal,
            executionStatus: stageVal,
            subcontractorOrEngineer: leadVal,
            personnelType: personnelCat,
            subcontractorPoAmount: personnelCat === "Subcontractor" ? (subBudget !== undefined ? subBudget : Math.round(contractAmount * 0.75)) : undefined,
            createdAt: new Date().toISOString().split("T")[0],
            rfq: {
              date: new Date().toISOString().split("T")[0],
              amount: rfqAmount
            },
            pfi: {
              invoiceNumber: `PFI-${codeVal}-001`,
              date: new Date().toISOString().split("T")[0],
              amount: Math.round(contractAmount * 1.1)
            },
            poMo: {
              poNumber: rowPoNo || `PO-${codeVal}-MAIN`,
              poAmount: contractAmount,
              moNumber: rowMoNo || `MO-${codeVal}-00`,
              mrfNumber: `MRF-${codeVal}-01`,
              additionalPos: []
            },
            tasks: [
              { id: `t_init_${Date.now()}_${i}`, title: "Mobilization & Site Security setup", isCompleted: stageVal !== ExecutionStatus.NOT_STARTED, deadline: new Date().toISOString().split("T")[0] },
              { id: `t_prog_${Date.now()}_${i}`, title: "Interim Milestone Measurement Checks", isCompleted: stageVal === ExecutionStatus.COMPLETED, deadline: new Date().toISOString().split("T")[0] }
            ],
            invoices: [],
            paymentAdvices: [],
            expenses: [],
            disbursements: [],
            documents: []
          };

          if (rowInvoiceNo) {
            newProject.invoices.push({
              id: `inv_imported_${Date.now()}_${i}`,
              invoiceNumber: rowInvoiceNo,
              invoiceAmount: rowInvoiceAmt || contractAmount || rfqAmount,
              submissionDate: new Date().toISOString().split("T")[0],
              jccNumber: `JCC-${codeVal}-1`,
              status: "APPROVED" as any
            });
          }

          projectsToImport.push(newProject);
        }
      }

      if (projectsToImport.length === 0) {
        setError("Could not parse any valid project rows from this CSV file.");
      } else {
        setParsedProjects(projectsToImport);
      }
    } catch (e: any) {
      setError(`Import parsing failed: ${e.message || "Invalid file encoding format"}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        setCsvText(text);
        handleProcessCSV(text);
      };
      reader.readAsText(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        setCsvText(text);
        handleProcessCSV(text);
      };
      reader.readAsText(file);
    }
  };

  const executeImport = () => {
    if (parsedProjects.length === 0) return;
    const isOverwrite = importOption === "overwrite";
    onImport(parsedProjects, isOverwrite);
    alert(`Successfully imported ${parsedProjects.length} projects!`);
    onClose();
  };

  return (
    <div id="csv-import-modal" className="fixed inset-0 bg-[#020617]/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleUp">
        {/* Header Ribbon */}
        <div className="bg-white/5 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <FileSpreadsheet size={16} />
            </div>
            <div>
              <h3 className="text-sm font-sans font-black text-white">Import Previous Project Ledgers</h3>
              <p className="text-[10px] text-slate-400 font-mono">Excel / CSV Bulk Loader (Up to 1,000 Rows)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Tab Selection */}
          <div className="flex bg-slate-950/40 border border-white/5 p-1 rounded-2xl">
            <button
              type="button"
              disabled={parsedProjects.length > 0}
              onClick={() => { setImportMode("projects"); setError(null); }}
              className={`flex-1 py-2 text-center text-xs font-sans font-bold rounded-xl transition-all ${
                importMode === "projects"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-50 cursor-pointer"
              }`}
            >
              📁 Standard Project Import
            </button>
            <button
              type="button"
              disabled={parsedProjects.length > 0}
              onClick={() => { setImportMode("payment_advice"); setError(null); }}
              className={`flex-1 py-2 text-center text-xs font-sans font-bold rounded-xl transition-all ${
                importMode === "payment_advice"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-50 cursor-pointer"
              }`}
            >
              🔍 Payment Advice Reverse Audit
            </button>
          </div>

          {/* Quick instructions & template download */}
          {importMode === "projects" ? (
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-start gap-3 text-xs leading-normal">
              <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <span className="font-extrabold text-indigo-300">Fast Upload over 300+ projects:</span>
                <p className="text-slate-350">
                  Ensure your file is in standard comma-separated <strong>CSV format</strong>. Use standard columns such as <code>Project Code</code>, <code>Project Title</code>, <code>Client Partner</code> etc. to let the mapper capture your rows properly.
                </p>
                <button 
                  type="button" 
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-mono text-[10px] px-2.5 py-1 rounded-md border border-indigo-500/30 transition-all font-bold cursor-pointer mt-1"
                >
                  <Download size={11} /> Download Project Template CSV
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3 text-xs leading-normal">
              <Info size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <span className="font-extrabold text-emerald-300">Reverse-Matching Payment Audit Engine:</span>
                <p className="text-slate-350">
                  Upload a table from your bank or ERP with columns for: <code>Payment Advice Number</code>, <code>Invoice Number</code>, <code>Payment Date</code>, <code>Invoice Amount</code>, <code>Amount Withheld</code>, <code>Amount Paid</code>. The system will reverse-engineer your past project segments, and populate matching milestone invoices and advice logs automatically!
                </p>
                <button 
                  type="button" 
                  onClick={handleDownloadAdviceTemplate}
                  className="inline-flex items-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-mono text-[10px] px-2.5 py-1 rounded-md border border-emerald-500/30 transition-all font-bold cursor-pointer mt-1"
                >
                  <Download size={11} /> Download Payment Advice Template CSV
                </button>
              </div>
            </div>
          )}

          {!parsedProjects.length ? (
            <>
              {/* Drag Drop Field */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  dragActive 
                    ? "border-emerald-400 bg-emerald-500/10 text-emerald-200" 
                    : "border-white/10 bg-slate-900/30 hover:border-white/25 text-slate-400"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 border border-white/5">
                  <Upload size={22} className="animate-pulse" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white font-sans">
                    {dragActive ? "Drop the file here!" : "Select CSV file or Drag & Drop"}
                  </span>
                  <p className="text-[10px] text-slate-450 mt-1">Accepts native Excel-saved `.csv` files</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept=".csv" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
              </div>

              {/* Paste Text fallback */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-slate-450 uppercase tracking-wider">
                  Alternative: Paste CSV Raw Text:
                </label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`Project Code,Project Title,Client Partner,RFQ Bid Amount (₦),Contract Approved Amount (₦)...`}
                  className="w-full h-28 bg-slate-950 border border-white/5 rounded-xl p-3 text-[11px] font-mono whitespace-pre text-slate-200 focus:outline-hidden focus:border-indigo-500/50"
                />
                <button
                  type="button"
                  onClick={() => handleProcessCSV(csvText)}
                  className="w-full py-2 bg-slate-850 hover:bg-slate-800 text-white font-mono text-[11px] font-bold rounded-xl border border-white/10 transition-all cursor-pointer"
                >
                  Parse & Map Raw Text Value
                </button>
              </div>
            </>
          ) : (
            /* Parsed review panel */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-xs">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                <div>
                  <span className="font-extrabold text-emerald-300">Successfully Parsed {parsedProjects.length} Records!</span>
                  <p className="text-slate-400 mt-0.5">Ready for ingestion into the active workspace ledgers.</p>
                </div>
              </div>

              {/* Ingestion Settings */}
              <div className="bg-slate-900/40 border border-white/5 p-4 rounded-xl space-y-3">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                  ⚙️ INGESTION OPTION:
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setImportOption("append")}
                    className={`p-3 text-left border rounded-xl transition-all cursor-pointer ${
                      importOption === "append"
                        ? "bg-indigo-600/15 border-indigo-500 text-indigo-200"
                        : "bg-transparent border-white/5 text-slate-400 hover:bg-white/5"
                    }`}
                  >
                    <div className="text-xs font-bold font-sans">Append and Merge</div>
                    <div className="text-[10px] mt-1 font-mono text-slate-450 leading-tight">Keep current {parsedProjects.length} projects & add them to the top of list.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportOption("overwrite")}
                    className={`p-3 text-left border rounded-xl transition-all cursor-pointer ${
                      importOption === "overwrite"
                        ? "bg-rose-600/15 border-rose-500 text-rose-200"
                        : "bg-transparent border-white/5 text-slate-400 hover:bg-white/5"
                    }`}
                  >
                    <div className="text-xs font-bold font-sans text-rose-450">Overwrite Database</div>
                    <div className="text-[10px] mt-1 font-mono text-slate-450 leading-tight">Purge all active demo entries and replace entirely with these entries.</div>
                  </button>
                </div>
              </div>

              {/* Sample list preview */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-450 uppercase tracking-wider block">
                  Project Ledger Preflight Checks (First 4 rows):
                </span>
                <div className="border border-white/5 rounded-xl overflow-hidden text-[11px] divide-y divide-white/5 font-mono">
                  {parsedProjects.slice(0, 4).map((p, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-950/40 flex justify-between gap-4">
                      <div className="truncate">
                        <span className="text-indigo-400 font-bold mr-2">{p.code}</span>
                        <span className="text-white">{p.title}</span>
                      </div>
                      <div className="shrink-0 text-slate-450 text-[10px]">
                        Owner: {p.subcontractorOrEngineer} • PO: ₦{(p.poMo?.poAmount || 0).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  {parsedProjects.length > 4 && (
                    <div className="p-2 text-center text-[10px] text-slate-500 bg-slate-900/10">
                      + {parsedProjects.length - 4} more projects...
                    </div>
                  )}
                </div>
              </div>

              {/* Action row */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setParsedProjects([])}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-sans font-bold text-xs rounded-xl border border-white/5 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={13} /> Parse Another File
                </button>
                <button
                  type="button"
                  onClick={executeImport}
                  className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 font-sans font-bold text-xs text-white rounded-xl shadow-lg shadow-emerald-600/15 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={13} /> Complete Bulk Ingestion
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-xs text-rose-300 font-mono">
              <AlertTriangle size={15} className="shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
