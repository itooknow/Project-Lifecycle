/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ProjectStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED"
}

export enum ExecutionStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  ON_HOLD = "ON_HOLD"
}

export enum InvoiceStatus {
  SUBMITTED = "SUBMITTED",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPROVED = "APPROVED",
  DISPUTED = "DISPUTED"
}

export interface RFQInfo {
  date: string;
  amount: number;
}

export interface PFIInfo {
  invoiceNumber: string;
  date: string;
  amount: number;
}

export interface AdditionalPO {
  id: string;
  poNumber: string;
  poAmount: number;
  moNumber?: string;
  mrfNumber?: string;
}

export interface POMOInfo {
  poNumber: string;
  poAmount: number;
  moNumber: string;
  mrfNumber: string;
  poDate?: string;
  additionalPos?: AdditionalPO[];
}

export interface GranularTask {
  id: string;
  title: string;
  isCompleted: boolean;
  deadline: string;
  milestoneDocId?: string; // tied invoice/PFI reference
}

export interface InvoiceEntry {
  id: string;
  invoiceNumber: string;
  invoiceAmount: number;
  submissionDate: string;
  jccNumber: string;
  status: InvoiceStatus;
  jccApprovedDate?: string;
  paymentDueDays?: number;
}

export interface PaymentAdviceEntry {
  id: string;
  adviceNumber: string;
  poNumber: string;
  invoiceNumber: string;
  approvedAmount: number;
  vat: number;
  wht: number;
  retention: number;
  charges: number; // other charges/fees
  creditNote: number;
  date: string;
}

export interface ExpenseEntry {
  id: string;
  category: "Logistics" | "Sundry" | "Other";
  description: string;
  amount: number;
  date: string;
}

export interface DisbursementEntry {
  id: string;
  recipient: string; // subcontractor/engineer, supplier, etc.
  description: string;
  amount: number;
  date: string;
}

export interface ProjectDocument {
  id: string;
  name: string;
  type: "rfq" | "pfi" | "po" | "mo" | "jcc" | "milestone" | "invoice" | "advice" | "expense" | "receipt" | "other";
  fileSize: string;
  uploadDate: string;
  uploadedBy: string;
  docRef?: string; // e.g. "PO-770" or "INV-2026-001"
  dataUrl?: string; // Base64 data for downloadable mock/live documents
}

export interface Project {
  id: string;
  title: string;
  code: string;
  client: string; // e.g. "Federal Ministry of Power", "Shell Dev", etc.
  status: ProjectStatus;
  executionStatus: ExecutionStatus;
  subcontractorOrEngineer: string; // subcontractors/in-house personnel
  personnelType?: "Subcontractor" | "In-House";
  subcontractorPoAmount?: number; // custom PO issued by us to subcontractor, discounted from customer PO
  createdAt: string;
  
  // Stages & Figures
  rfq: RFQInfo;
  pfi?: PFIInfo;
  poMo?: POMOInfo;
  tasks: GranularTask[];
  invoices: InvoiceEntry[];
  paymentAdvices: PaymentAdviceEntry[];
  expenses: ExpenseEntry[];
  disbursements: DisbursementEntry[];
  documents?: ProjectDocument[];
}

export type UserRole = "Administrator" | "Project Manager" | "Finance Officer";

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  passwordHash: string; // SHA-256 local hash representation
  createdAt: string;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
}

export interface UserSession {
  user: User;
  token: string; // secure-looking local token
  loginTime: string;
}
