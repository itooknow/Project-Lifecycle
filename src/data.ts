/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project, ProjectStatus, ExecutionStatus, InvoiceStatus, ProjectDocument } from "./types";

export const INITIAL_PROJECTS: Project[] = [];

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
