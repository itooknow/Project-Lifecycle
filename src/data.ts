/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project, ProjectStatus, ExecutionStatus, InvoiceStatus, ProjectDocument } from "./types";

export const INITIAL_PROJECTS: Project[] = [
  {
    id: "proj_901_westgrid",
    title: "West Grid Expansion Substation",
    code: "WGR-SUB-2026",
    client: "Federal Ministry of Power",
    status: ProjectStatus.OPEN,
    executionStatus: ExecutionStatus.COMPLETED,
    subcontractorOrEngineer: "Abbey Electrical Ltd (Subcontractor)",
    personnelType: "Subcontractor",
    subcontractorPoAmount: 110000,
    createdAt: "2026-01-05T08:00:00Z",
    rfq: {
      date: "2026-01-10",
      amount: 150000,
    },
    pfi: {
      invoiceNumber: "PFI-2026-011",
      date: "2026-01-15",
      amount: 145000,
    },
    poMo: {
      poNumber: "PO-CONT-7701",
      poAmount: 145000,
      moNumber: "MO-9901",
      mrfNumber: "MRF-501",
    },
    tasks: [
      { id: "task_1", title: "Soil Resistivity Testing & Excavatation", isCompleted: true, deadline: "2026-01-25", milestoneDocId: "DOC-SOIL-01" },
      { id: "task_2", title: "Concrete Foundation & Earth Mat Installation", isCompleted: true, deadline: "2026-02-10", milestoneDocId: "DOC-FOUND-02" },
      { id: "task_3", title: "Transformer Mounting & Busbar Alignment", isCompleted: true, deadline: "2026-03-05", milestoneDocId: "DOC-TRANS-03" },
      { id: "task_4", title: "Pre-commissioning Testing & Client Witness Hookup", isCompleted: true, deadline: "2026-03-20", milestoneDocId: "DOC-COMM-04" },
    ],
    invoices: [
      {
        id: "inv_3001",
        invoiceNumber: "INV-2026-001",
        invoiceAmount: 70000,
        submissionDate: "2026-02-15",
        jccNumber: "JCC-FE-301",
        status: InvoiceStatus.APPROVED,
      },
      {
        id: "inv_3002",
        invoiceNumber: "INV-2026-024",
        invoiceAmount: 75000,
        submissionDate: "2026-03-22",
        jccNumber: "JCC-FE-349",
        status: InvoiceStatus.APPROVED,
      },
    ],
    paymentAdvices: [
      {
        id: "adv_5001",
        adviceNumber: "PA-44901",
        poNumber: "PO-CONT-7701",
        invoiceNumber: "INV-2026-001",
        approvedAmount: 70000,
        vat: 5250,      // 7.5%
        wht: 3500,      // 5%
        retention: 7000, // 10%
        charges: 450,
        creditNote: 0,
        date: "2026-03-05",
      },
      {
        id: "adv_5002",
        adviceNumber: "PA-44988",
        poNumber: "PO-CONT-7701",
        invoiceNumber: "INV-2026-024",
        approvedAmount: 75000,
        vat: 5625,
        wht: 3750,
        retention: 7500,
        charges: 550,
        creditNote: 1200,
        date: "2026-04-18",
      },
    ],
    expenses: [
      { id: "exp_1", category: "Logistics", description: "Heavy Duty Crane Rental & Transport", amount: 4800, date: "2026-01-20" },
      { id: "exp_2", category: "Logistics", description: "Site Fuel & Generator Logistics", amount: 1500, date: "2026-02-10" },
      { id: "exp_3", category: "Sundry", description: "Safety PPE Gear & Site Signage", amount: 1200, date: "2026-01-08" },
      { id: "exp_4", category: "Sundry", description: "Local Council Site Permits", amount: 800, date: "2026-01-12" },
    ],
    disbursements: [
      { id: "disb_1", recipient: "Abbey Electrical Ltd", description: "Subcontractor Milestone 1 Payment", amount: 35000, date: "2026-02-20" },
      { id: "disb_2", recipient: "Abbey Electrical Ltd", description: "Subcontractor Milestone 2 Release", amount: 40000, date: "2026-04-01" },
      { id: "disb_3", recipient: "FastMesh Galvanizing", description: "Fencing & Earthing Material supply", amount: 18000, date: "2026-01-22" },
    ],
    documents: [
      {
        id: "doc_1",
        name: "RFQ_Specification_WGR-SUB-2026.pdf",
        type: "rfq",
        fileSize: "1.2 MB",
        uploadDate: "2026-01-10",
        uploadedBy: "Project Manager Chief",
        docRef: "WGR-SUB-2026"
      },
      {
        id: "doc_2",
        name: "Proforma_Invoice_PFI-2581.pdf",
        type: "pfi",
        fileSize: "780 KB",
        uploadDate: "2026-01-15",
        uploadedBy: "Project Manager Chief",
        docRef: "PFI-2026-011"
      },
      {
        id: "doc_3",
        name: "Contract_Signed_PO-CONT-7701.pdf",
        type: "po",
        fileSize: "3.4 MB",
        uploadDate: "2026-01-20",
        uploadedBy: "Project Manager Chief",
        docRef: "PO-CONT-7701"
      },
      {
        id: "doc_4",
        name: "Joint_Completion_Certificate_INV-001.pdf",
        type: "jcc",
        fileSize: "450 KB",
        uploadDate: "2026-02-15",
        uploadedBy: "Finance Lead",
        docRef: "JCC-FE-301"
      }
    ]
  },
  {
    id: "proj_902_kanopipeline",
    title: "Kano Pipeline Cathodic Replacement",
    code: "KNP-CAT-2026",
    client: "Shell Petroleum Development Co.",
    status: ProjectStatus.OPEN,
    executionStatus: ExecutionStatus.IN_PROGRESS,
    subcontractorOrEngineer: "Engr. Yusuf Ibrahim (In-house lead)",
    personnelType: "In-House",
    createdAt: "2026-02-01T09:00:00Z",
    rfq: {
      date: "2026-02-05",
      amount: 250000,
    },
    pfi: {
      invoiceNumber: "PFI-2026-014",
      date: "2026-02-12",
      amount: 240000,
    },
    poMo: {
      poNumber: "PO-KNP-8822",
      poAmount: 240000,
      moNumber: "MO-7731",
      mrfNumber: "MRF-612",
    },
    tasks: [
      { id: "task_5", title: "Site mobilization & pipeline coating survey", isCompleted: true, deadline: "2026-02-25", milestoneDocId: "DOC-MOBS-01" },
      { id: "task_6", title: "Installation of sacrificial anode beads", isCompleted: true, deadline: "2026-03-15", milestoneDocId: "DOC-ANOD-02" },
      { id: "task_7", title: "Backfill compaction & post-install testing", isCompleted: false, deadline: "2026-06-15", milestoneDocId: "DOC-POST-03" },
      { id: "task_8", title: "Final handover & JCC sign-off", isCompleted: false, deadline: "2026-06-30" },
    ],
    invoices: [
      {
        id: "inv_3003",
        invoiceNumber: "INV-2026-048",
        invoiceAmount: 120000,
        submissionDate: "2026-03-20",
        jccNumber: "JCC-KN-012",
        status: InvoiceStatus.APPROVED,
      },
      {
        id: "inv_3004",
        invoiceNumber: "INV-2026-092",
        invoiceAmount: 120000,
        submissionDate: "2026-05-20",
        jccNumber: "JCC-KN-044-PND",
        status: InvoiceStatus.SUBMITTED,
      },
    ],
    paymentAdvices: [
      {
        id: "adv_5003",
        adviceNumber: "PA-45012",
        poNumber: "PO-KNP-8822",
        invoiceNumber: "INV-2026-048",
        approvedAmount: 120000,
        vat: 9000,
        wht: 6000,
        retention: 12000,
        charges: 1200,
        creditNote: 0,
        date: "2026-04-10",
      },
    ],
    expenses: [
      { id: "exp_5", category: "Logistics", description: "Kano flight tickets & site 4x4 vehicle rental", amount: 5600, date: "2026-02-15" },
      { id: "exp_6", category: "Logistics", description: "Anode cargo haulage Lagos-Kano", amount: 4200, date: "2026-02-20" },
      { id: "exp_7", category: "Sundry", description: "Staff local feeding & incidentals allowance", amount: 3100, date: "2026-03-01" },
    ],
    disbursements: [
      { id: "disb_4", recipient: "Anode Tech Supplies Ltd", description: "Sacrificial Anode procurement batch 1", amount: 65000, date: "2026-02-18" },
      { id: "disb_5", recipient: "Engr. Yusuf Ibrahim", description: "Cash advance for site casual labor", amount: 15000, date: "2026-02-22" },
    ],
    documents: [
      {
        id: "doc_5",
        name: "Pipeline_Cathodic_RFQ_Specs.pdf",
        type: "rfq",
        fileSize: "2.1 MB",
        uploadDate: "2026-02-05",
        uploadedBy: "Project Manager Chief",
        docRef: "KNP-CAT-2026"
      }
    ]
  },
  {
    id: "proj_903_lekkitower",
    title: "Lekki Tower Fiber Optic Link",
    code: "LEK-FIB-2026",
    client: "MainOne Cable West Africa",
    status: ProjectStatus.OPEN,
    executionStatus: ExecutionStatus.NOT_STARTED,
    subcontractorOrEngineer: "Engr. Sarah Connor (In-house lead)",
    personnelType: "In-House",
    createdAt: "2026-05-10T14:30:00Z",
    rfq: {
      date: "2026-05-12",
      amount: 95000,
    },
    pfi: {
      invoiceNumber: "PFI-2026-090",
      date: "2026-05-18",
      amount: 95000,
    },
    tasks: [
      { id: "task_9", title: "Duct visual inspection & clearing", isCompleted: false, deadline: "2026-06-10" },
      { id: "task_10", title: "Fiber cable blowing & loop reservation", isCompleted: false, deadline: "2026-06-20" },
      { id: "task_11", title: "OTDR testing & splicing core termination", isCompleted: false, deadline: "2026-06-28" },
    ],
    invoices: [],
    paymentAdvices: [],
    expenses: [
      { id: "exp_8", category: "Logistics", description: "Lekki site initial site survey taxi", amount: 150, date: "2026-05-14" },
    ],
    disbursements: [],
    documents: []
  },
  {
    id: "proj_904_ibadandrain",
    title: "Ibadan Road Stormwater Drainage",
    code: "IBA-DRA-2026",
    client: "Oyo State Development Board",
    status: ProjectStatus.CLOSED,
    executionStatus: ExecutionStatus.COMPLETED,
    subcontractorOrEngineer: "Simeon Roadworks Ltd (Subcontractor)",
    personnelType: "Subcontractor",
    subcontractorPoAmount: 240050,
    createdAt: "2026-01-02T10:00:00Z",
    rfq: {
      date: "2026-01-04",
      amount: 320000,
    },
    pfi: {
      invoiceNumber: "PFI-2026-002",
      date: "2026-01-10",
      amount: 310000,
    },
    poMo: {
      poNumber: "PO-IBA-0094",
      poAmount: 310000,
      moNumber: "MO-4402",
      mrfNumber: "MRF-201",
    },
    tasks: [
      { id: "task_12", title: "Right of way clearing & heavy equipment positioning", isCompleted: true, deadline: "2026-01-20", milestoneDocId: "DOC-CLEAR-10" },
      { id: "task_13", title: "Excavation of trench & pre-cast channel layout", isCompleted: true, deadline: "2026-02-15", milestoneDocId: "DOC-EXCAV-11" },
      { id: "task_14", title: "Concrete reinforcement pouring & curing", isCompleted: true, deadline: "2026-03-10", milestoneDocId: "DOC-CONC-12" },
      { id: "task_15", title: "Trench cover mounting & joint sealing", isCompleted: true, deadline: "2026-03-31", milestoneDocId: "DOC-FIN-13" },
    ],
    invoices: [
      {
        id: "inv_3005",
        invoiceNumber: "INV-2026-010",
        invoiceAmount: 150000,
        submissionDate: "2026-02-05",
        jccNumber: "JCC-IBD-101",
        status: InvoiceStatus.APPROVED,
      },
      {
        id: "inv_3006",
        invoiceNumber: "INV-2026-050",
        invoiceAmount: 160000,
        submissionDate: "2026-04-10",
        jccNumber: "JCC-IBD-102-REV",
        status: InvoiceStatus.DISPUTED,
      },
    ],
    paymentAdvices: [
      {
        id: "adv_5005",
        adviceNumber: "PA-44810",
        poNumber: "PO-IBA-0094",
        invoiceNumber: "INV-2026-010",
        approvedAmount: 150000,
        vat: 11250,
        wht: 7500,
        retention: 15000,
        charges: 1800,
        creditNote: 0,
        date: "2026-03-02",
      },
    ],
    expenses: [
      { id: "exp_9", category: "Logistics", description: "Lagos-Ibadan equipment transport flatbed", amount: 14000, date: "2026-01-12" },
      { id: "exp_10", category: "Logistics", description: "Fuel for excavators & site rollers (Diesel)", amount: 9200, date: "2026-02-01" },
      { id: "exp_11", category: "Sundry", description: "Food catering for site laborers (3 weeks)", amount: 4800, date: "2026-01-20" },
    ],
    disbursements: [
      { id: "disb_6", recipient: "Simeon Roadworks Ltd", description: "Excavator rental and operators mobilization", amount: 80000, date: "2026-01-15" },
      { id: "disb_7", recipient: "Simeon Roadworks Ltd", description: "Materials procurement downpayment", amount: 70000, date: "2026-02-01" },
    ],
    documents: [
      {
        id: "doc_6",
        name: "Ibadan_Drainage_RFQ_Specs.pdf",
        type: "rfq",
        fileSize: "1.8 MB",
        uploadDate: "2026-01-04",
        uploadedBy: "Project Manager Chief",
        docRef: "IBA-DRA-2026"
      },
      {
        id: "doc_7",
        name: "Ibadan_PFI_Approved.pdf",
        type: "pfi",
        fileSize: "510 KB",
        uploadDate: "2026-01-10",
        uploadedBy: "Project Manager Chief",
        docRef: "PFI-2026-002"
      }
    ]
  },
];

export interface ProjectFinances {
  quotedAmount: number;     // RFQ
  proformaAmount: number;   // PFI
  contractAmount: number;   // PO
  totalInvoiced: number;    // Gross Invoiced
  totalApprovedInvoiced: number; // Invoiced approved
  totalPaidGross: number;   // Sum of approved amounts of matched payment advices
  totalPaidNet: number;     // Net cash paid = gross - wht - retention - charges - credit_notes + vat
  totalVAT: number;
  totalWHT: number;
  totalRetention: number;
  totalCharges: number;
  totalCreditNotes: number;
  totalExpenses: number;    // Logistics + Sundry + Other
  totalLogistics: number;
  totalSundry: number;
  totalDisbursed: number;   // Monies disbursed (subcontractor/others)
  totalCost: number;        // Disbursements + Expenses
  grossProfit: number;      // PaidNet - totalCost
  uninvoicedAmount: number; // PFI or PO Amount - Invoiced
  pendingPaymentAmount: number; // Invoiced Approved - Gross Paid
  
  // Tax & Subcontractor Reconciliation Added Fields
  expectedVAT: number;      // 7.5% of PO amount
  expectedWHT: number;      // 5% of PO amount
  vatVariance: number;      // expected - actual paid
  whtVariance: number;      // expected - actual withheld
  subcontractorPoBudget?: number; // from project
  subcontractorVariance?: number; // budget - disbursed
}

export function computeProjectFinances(project: Project): ProjectFinances {
  const quotedAmount = project.rfq.amount;
  const proformaAmount = project.pfi ? project.pfi.amount : 0;
  let contractAmount = project.poMo ? project.poMo.poAmount : proformaAmount;
  if (project.poMo?.additionalPos) {
    for (const addPo of project.poMo.additionalPos) {
      contractAmount += addPo.poAmount;
    }
  }

  let totalInvoiced = 0;
  let totalApprovedInvoiced = 0;
  for (const inv of project.invoices) {
    totalInvoiced += inv.invoiceAmount;
    if (inv.status === InvoiceStatus.APPROVED) {
      totalApprovedInvoiced += inv.invoiceAmount;
    }
  }

  let totalPaidGross = 0;
  let totalPaidNet = 0;
  let totalVAT = 0;
  let totalWHT = 0;
  let totalRetention = 0;
  let totalCharges = 0;
  let totalCreditNotes = 0;

  for (const pa of project.paymentAdvices) {
    totalPaidGross += pa.approvedAmount;
    totalVAT += pa.vat;
    totalWHT += pa.wht;
    totalRetention += pa.retention;
    totalCharges += pa.charges;
    totalCreditNotes += pa.creditNote;
    // Net cash paid formula: Approved Gross - WHT - Retention - Charges - Credit Note + VAT
    totalPaidNet += (pa.approvedAmount + pa.vat) - pa.wht - pa.retention - pa.charges - pa.creditNote;
  }

  let totalLogistics = 0;
  let totalSundry = 0;
  let totalOtherExp = 0;
  for (const exp of project.expenses) {
    if (exp.category === "Logistics") totalLogistics += exp.amount;
    else if (exp.category === "Sundry") totalSundry += exp.amount;
    else totalOtherExp += exp.amount;
  }
  const totalExpenses = totalLogistics + totalSundry + totalOtherExp;

  let totalDisbursed = 0;
  for (const disb of project.disbursements) {
    totalDisbursed += disb.amount;
  }

  const totalCost = totalExpenses + totalDisbursed;
  // Profit = Net cash received minus what we spent
  const grossProfit = totalPaidNet - totalCost;

  // Uninvoiced: contracted amount minus gross invoiced
  const uninvoicedAmount = Math.max(0, contractAmount - totalInvoiced);

  // Pending payment: invoiced approved but not paid gross yet
  const pendingPaymentAmount = Math.max(0, totalApprovedInvoiced - totalPaidGross);

  // Expected taxes
  const expectedVAT = contractAmount * 0.075;
  const expectedWHT = contractAmount * 0.05;

  // Variance: expect vs actual
  const vatVariance = expectedVAT - totalVAT;
  const whtVariance = expectedWHT - totalWHT;

  // Subcontractor PO metrics
  const isSub = project.personnelType === "Subcontractor" || (!project.personnelType && project.subcontractorOrEngineer.toLowerCase().includes("subcontractor"));
  const subcontractorPoBudget = isSub ? (project.subcontractorPoAmount || 0) : undefined;
  const subcontractorVariance = subcontractorPoBudget !== undefined ? subcontractorPoBudget - totalDisbursed : undefined;

  return {
    quotedAmount,
    proformaAmount,
    contractAmount,
    totalInvoiced,
    totalApprovedInvoiced,
    totalPaidGross,
    totalPaidNet,
    totalVAT,
    totalWHT,
    totalRetention,
    totalCharges,
    totalCreditNotes,
    totalExpenses,
    totalLogistics,
    totalSundry,
    totalDisbursed,
    totalCost,
    grossProfit,
    uninvoicedAmount,
    pendingPaymentAmount,
    expectedVAT,
    expectedWHT,
    vatVariance,
    whtVariance,
    subcontractorPoBudget,
    subcontractorVariance,
  };
}
