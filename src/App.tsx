/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Project, ProjectStatus, ExecutionStatus } from "./types";
import { INITIAL_PROJECTS, computeProjectFinances, ProjectFinances } from "./data";
import { DashboardStats } from "./components/DashboardStats";
import { DashboardCharts } from "./components/DashboardCharts";
import { ProjectTable } from "./components/ProjectTable";
import { ProjectDetailView } from "./components/ProjectDetailView";
import { ProjectForm } from "./components/ProjectForm";
import { CsvImportModal } from "./components/CsvImportModal";
import { AuthProvider, UserNavWidget, useAuth } from "./components/UserAuth";
import { 
  FolderGit2, 
  Plus, 
  Sparkles, 
  Layers, 
  HelpCircle,
  FileCheck2,
  CalendarDays,
  FileText,
  BadgeAlert,
  ArrowRight,
  FileSpreadsheet,
  ChevronDown,
  Users,
  User,
  Building,
  Receipt,
  Award,
  BookOpen
} from "lucide-react";
import { 
  SubcontractorsLedger, 
  InHouseEngineersLedger, 
  ClientsLedger, 
  InvoicesRegister, 
  PoRegistry 
} from "./components/NavigationRegisters";

function MainApp() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showAddProjectForm, setShowAddProjectForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<{ key: string; value: string } | null>(null);
  const [currentView, setCurrentView] = useState<"dashboard" | "subcontractors" | "engineers" | "clients" | "invoices" | "pos">("dashboard");
  const [activeDropdown, setActiveDropdown] = useState<"portfolios" | "registers" | null>(null);

  const { currentUser, hasPermission } = useAuth();
  const canCreateProjects = hasPermission("create", "projects");
  const canResetDatabase = currentUser?.role === "Administrator";

  // Load from LocalStorage or Default
  useEffect(() => {
    const saved = localStorage.getItem("PRJ_LIFECYCLE_LEDGER");
    const demoIds = ["proj_901_westgrid", "proj_902_kanopipeline", "proj_903_lekkitower", "proj_904_ibadandrain"];
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Project[];
        const filtered = parsed.filter(p => !demoIds.includes(p.id));
        setProjects(filtered);
        if (filtered.length !== parsed.length) {
          localStorage.setItem("PRJ_LIFECYCLE_LEDGER", JSON.stringify(filtered));
        }
      } catch (e) {
        setProjects([]);
      }
    } else {
      setProjects([]);
    }
  }, []);

  // Save changes to local persistence
  const saveProjects = (updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    localStorage.setItem("PRJ_LIFECYCLE_LEDGER", JSON.stringify(updatedProjects));
  };

  // Re-calculate all financials
  const finances: { [projectId: string]: ProjectFinances } = {};
  projects.forEach((p) => {
    finances[p.id] = computeProjectFinances(p);
  });

  const handleUpdateProjectInList = (updatedProj: Project) => {
    const list = projects.map((p) => (p.id === updatedProj.id ? updatedProj : p));
    saveProjects(list);
  };

  const handleAddNewProject = (newProj: Project) => {
    const list = [newProj, ...projects];
    saveProjects(list);
    setShowAddProjectForm(false);
    setSelectedProjectId(newProj.id);
  };

  const handleImportProjects = (newProjs: Project[], overwrite: boolean) => {
    if (overwrite) {
      saveProjects(newProjs);
      setSelectedProjectId(newProjs[0]?.id || null);
    } else {
      const list = [...newProjs, ...projects];
      saveProjects(list);
      setSelectedProjectId(newProjs[0]?.id || null);
    }
    setActiveFilter(null);
  };

  const handleDeleteProject = (projectId: string) => {
    if (window.confirm("Are you sure you want to permanently delete this project entry? This cleans all associated stage contracts, invoice milestones, payment advices, and operations expenses completely.")) {
      const list = projects.filter((p) => p.id !== projectId);
      saveProjects(list);
      setSelectedProjectId(null);
    }
  };

  const handleClearAllData = () => {
    if (window.confirm("⚠️ CRITICAL ACTION: Are you sure you want to DELETE ALL demo project entries? This will completely empty the active database, leaving you with a blank ledger to import your own real project files via CSV or manual entries.")) {
      saveProjects([]);
      setSelectedProjectId(null);
      setActiveFilter(null);
    }
  };

  const handleStatOrChartClick = (filter: { key: string; value: string }) => {
    setActiveFilter(filter);
    const tableEl = document.getElementById("project-table-container");
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleResetToDefault = () => {
    if (!canResetDatabase) {
      alert("Permission Denied: Restorations/resets are restricted to Administrators.");
      return;
    }
    if (window.confirm("Are you sure you want to reset all records to the original preloaded construction & engineering projects?")) {
      setProjects(INITIAL_PROJECTS);
      localStorage.setItem("PRJ_LIFECYCLE_LEDGER", JSON.stringify(INITIAL_PROJECTS));
      setSelectedProjectId(null);
      setActiveFilter(null);
    }
  };

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div 
      className="bg-[#0f172a] text-slate-100 min-h-screen pb-16 font-sans relative overflow-x-hidden print:bg-white print:text-black"
      style={{
        backgroundImage: "radial-gradient(at 0% 0%, #1e293b 0%, transparent 50%), radial-gradient(at 100% 0%, #0f172a 0%, transparent 50%), radial-gradient(at 100% 100%, #1e1b4b 0%, transparent 50%), radial-gradient(at 0% 100%, #0c4a6e 0%, transparent 50%)"
      }}
    >
        {/* Upper Navigation Bar */}
      <header className="bg-white/5 border-b border-white/10 backdrop-blur-md sticky top-0 z-40 print:hidden" onMouseLeave={() => setActiveDropdown(null)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Emerald Green Cog with White C Logo */}
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 100 100" className="w-10 h-10 drop-shadow-[0_0_8px_rgba(34,197,94,0.2)]" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* 6 teeth cog with pointy elongated top tooth (antenna spindle) */}
                <path 
                  d="M50 4 
                     C52.2 4, 53.2 10.5, 53.8 17 
                     C57.5 18.5, 61 21, 64 24 
                     L71 18.5 
                     C72 17.5, 74.5 17.5, 75.5 18.5 
                     L82 25 
                     C83 26, 83 28.5, 82 29.5 
                     L76.5 36.5 
                     C79 39.5, 81 43, 82.5 47 
                     L90.5 48.5 
                     C92 49, 93 51, 93 52.5 
                     L93 61.5 
                     C93 63, 92 65, 90.5 65.5 
                     L82.5 67 
                     C81 71, 79 74.5, 76.5 77.5 
                     L82 84.5 
                     C83 85.5, 83 88, 82 89 
                     L75.5 95.5 
                     C74.5 96.5, 72 96.5, 71 95.5 
                     L64 90 
                     C61 93, 57.5 95.5, 53.8 97 
                     L52.5 103.5 
                     L47.5 103.5 
                     L46.2 97 
                     C42.5 95.5, 39 93, 36 90 
                     L29 95.5 
                     C28 96.5, 25.5 96.5, 24.5 95.5 
                     L18 89 
                     C17 88, 17 85.5, 18 84.5 
                     L23.5 77.5 
                     C21 74.5, 19 71, 17.5 67 
                     L9.5 65.5 
                     C8 65, 7 63, 7 61.5 
                     L7 52.5 
                     C7 51, 8 49, 9.5 48.5 
                     L17.5 47 
                     C19 43, 21 39.5, 23.5 36.5 
                     L18 29.5 
                     C17 28.5, 17 26, 18 25 
                     L24.5 18.5 
                     C25.5 17.5, 28 17.5, 29 18.5 
                     L36 24 
                     C39 21, 42.5 18.5, 46.2 17 
                     C46.8 10.5, 47.8 4, 50 4 Z" 
                  fill="#15803d" 
                  stroke="#22c55e"
                  strokeWidth="2.5"
                  strokeLinejoin="bevel"
                />
                {/* Dark Inner circle core */}
                <circle cx="50" cy="56" r="22" fill="#0f172a" />
                {/* Precise capital letter C in white */}
                <path 
                  d="M 61 47 
                     C 58 42, 54 40, 49 40 
                     C 40.2 40, 33 47.2, 33 56 
                     C 33 64.8, 40.2 72, 49 72 
                     C 54 72, 58 70, 61 65 
                     L 53.5 60.5 
                     C 52.5 62.5, 51 63.5, 49 63.5 
                     C 44.8 63.5, 41.5 60.2, 41.5 56 
                     C 41.5 51.8, 44.8 48.5, 49 48.5 
                     C 51 48.5, 52.5 49.5, 53.5 51.5 
                     Z" 
                  fill="white" 
                />
              </svg>
            </div>
            <div>
              <span className="text-sm font-sans font-black tracking-tight text-white block leading-tight">
                Project<span className="text-emerald-400 ml-0.5 font-semibold">Lifecycle</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Reconciliations Ledger</span>
            </div>
          </div>

          {/* Desktop Central Navigation Menu Hierarchy */}
          <nav className="hidden lg:flex items-center gap-1.5">
            <button
              onClick={() => {
                setCurrentView("dashboard");
                setSelectedProjectId(null);
                setActiveDropdown(null);
              }}
              className={`px-3 py-2 text-xs font-sans font-bold rounded-xl transition-all cursor-pointer ${
                currentView === "dashboard"
                  ? "bg-indigo-600/20 text-white border border-indigo-500/30 shadow-xs"
                  : "text-slate-300 border border-transparent hover:text-white hover:bg-white/5"
              }`}
            >
              📊 Dashboard
            </button>

            {/* Portfolios Dropdown */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === "portfolios" ? null : "portfolios")}
                className={`px-3 py-2 text-xs font-sans font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                  currentView === "clients"
                    ? "bg-indigo-600/20 text-white border border-indigo-500/30"
                    : "text-slate-300 border border-transparent hover:text-white hover:bg-white/5"
                }`}
              >
                📁 Portfolios <ChevronDown size={11} className={`transition-transform duration-200 ${activeDropdown === "portfolios" ? "rotate-180" : ""}`} />
              </button>
              {activeDropdown === "portfolios" && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-slate-950/95 border border-white/10 p-1.5 rounded-2xl shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={() => {
                      setCurrentView("dashboard");
                      setSelectedProjectId(null);
                      setActiveDropdown(null);
                      setTimeout(() => {
                        const el = document.getElementById("project-table-container");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }, 100);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Layers size={14} className="text-indigo-400" />
                    Projects Master Ledger
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView("clients");
                      setSelectedProjectId(null);
                      setActiveDropdown(null);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Building size={14} className="text-emerald-400" />
                    Clients & Customers Base
                  </button>
                </div>
              )}
            </div>

            {/* Personnel Dropdown */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === "personnel" ? null : "personnel")}
                className={`px-3 py-2 text-xs font-sans font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                  ["subcontractors", "engineers"].includes(currentView)
                    ? "bg-indigo-600/20 text-white border border-indigo-500/30"
                    : "text-slate-300 border border-transparent hover:text-white hover:bg-white/5"
                }`}
              >
                👥 Personnel <ChevronDown size={11} className={`transition-transform duration-200 ${activeDropdown === "personnel" ? "rotate-180" : ""}`} />
              </button>
              {activeDropdown === "personnel" && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-slate-950/95 border border-white/10 p-1.5 rounded-2xl shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={() => {
                      setCurrentView("subcontractors");
                      setSelectedProjectId(null);
                      setActiveDropdown(null);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Users size={14} className="text-sky-450" />
                    Sub-contractors Registry
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView("engineers");
                      setSelectedProjectId(null);
                      setActiveDropdown(null);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <User size={14} className="text-orange-400" />
                    In-House Engineers Ledger
                  </button>
                </div>
              )}
            </div>

            {/* Financial Registers Dropdown */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === "registers" ? null : "registers")}
                className={`px-3 py-2 text-xs font-sans font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                  ["invoices", "pos"].includes(currentView)
                    ? "bg-indigo-600/20 text-white border border-indigo-500/30"
                    : "text-slate-300 border border-transparent hover:text-white hover:bg-white/5"
                }`}
              >
                🧾 Registers <ChevronDown size={11} className={`transition-transform duration-200 ${activeDropdown === "registers" ? "rotate-180" : ""}`} />
              </button>
              {activeDropdown === "registers" && (
                <div className="absolute top-full left-0 mt-2 w-60 bg-slate-950/95 border border-white/10 p-1.5 rounded-2xl shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={() => {
                      setCurrentView("invoices");
                      setSelectedProjectId(null);
                      setActiveDropdown(null);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Receipt size={14} className="text-purple-400" />
                    Global Invoices Ledger
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView("pos");
                      setSelectedProjectId(null);
                      setActiveDropdown(null);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Award size={14} className="text-teal-400" />
                    Global Client PO Registry
                  </button>
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-4">
            {canCreateProjects && (
              <div className="flex items-center gap-2">
                <button
                  id="import-csv-btn"
                  onClick={() => setShowImportModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white px-3 py-2 rounded-xl font-sans text-xs font-bold shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet size={13} /> Bulk Import
                </button>
                <button
                  id="new-project-btn"
                  onClick={() => {
                    setShowAddProjectForm(!showAddProjectForm);
                    setSelectedProjectId(null);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white px-3 py-2 rounded-xl font-sans text-xs font-bold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={13} /> New Entry
                </button>
              </div>
            )}
            
            {/* User Session Widget */}
            <UserNavWidget />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6 print:m-0 print:p-0">
        
        {/* Mobile/Tablet Swipe-to-Select Submenus Helper (Hidden on Desktop) */}
        <div className="flex lg:hidden bg-white/5 border border-white/10 p-1.5 rounded-2xl overflow-x-auto gap-1.5 scrollbar-none print:hidden">
          {[
            { id: "dashboard", label: "📊 Dashboard" },
            { id: "clients", label: "🏢 Clients" },
            { id: "subcontractors", label: "👥 Subcontractors" },
            { id: "engineers", label: "👷 In-House staff" },
            { id: "invoices", label: "🧾 Invoices" },
            { id: "pos", label: "📝 POs" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setCurrentView(tab.id as any);
                setSelectedProjectId(null);
                setActiveDropdown(null);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl font-sans shrink-0 transition-all cursor-pointer ${
                currentView === tab.id
                  ? "bg-indigo-600 text-white shadow-md border border-indigo-500/20"
                  : "text-slate-400 hover:text-white bg-transparent border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Global project form modal-style or drawer representation */}
        {showAddProjectForm && canCreateProjects && (
          <div className="print:hidden animate-in fade-in zoom-in-95 duration-200">
            <ProjectForm 
              onAddProject={handleAddNewProject}
              onCancel={() => setShowAddProjectForm(false)}
            />
          </div>
        )}

        {/* Global Active Project Detail Drawer - remains discoverable across any tab inspect action */}
        {activeProject && (
          <div className="print:hidden animate-in slide-in-from-top-6 duration-300" id="project-detail-panel">
            <ProjectDetailView 
              project={activeProject}
              finances={finances[activeProject.id]}
              onClose={() => setSelectedProjectId(null)}
              onUpdateProject={handleUpdateProjectInList}
              onDeleteProject={handleDeleteProject}
            />
          </div>
        )}

        {/* Multi-menu View Routing */}
        {currentView === "dashboard" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Dashboard Title Ribbon */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 border border-white/10 backdrop-blur-lg p-5 rounded-3xl print:hidden">
              <div>
                <h1 className="text-xl font-sans font-extrabold text-white tracking-tight">Active Financial Portal</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Refined by <strong className="text-indigo-400 font-semibold">{currentUser?.role}</strong> role clearance. Click metrics and charts to filter lists.
                </p>
              </div>

              {/* Time select filter for payouts */}
              <div className="flex items-center gap-3.5" id="time-filter-block">
                <span className="text-xs font-mono text-slate-400">Payout Advice Lookup:</span>
                <div className="flex bg-white/5 p-1 border border-white/10 rounded-xl backdrop-blur-md">
                  {[
                    { key: "all", label: "All Time" },
                    { key: "2026", label: "2026" },
                    { key: "2025", label: "2025" },
                    { key: "90days", label: "Last 90d" },
                  ].map((range) => (
                    <button
                      key={range.key}
                      onClick={() => setSelectedDateFilter(range.key)}
                      className={`px-3 py-1.5 text-[11px] font-sans font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                        selectedDateFilter === range.key
                          ? "bg-white/15 text-white shadow-xs"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 1. Statistics Summary Grid */}
            <div className="print:hidden">
              <DashboardStats 
                projects={projects}
                finances={finances}
                selectedDateFilter={selectedDateFilter}
                onStatClick={handleStatOrChartClick}
              />
            </div>

            {/* 2. Interactive Maps & Charts (Donut + Side Funnel) */}
            <div className="print:hidden">
              <DashboardCharts 
                projects={projects}
                finances={finances}
                onChartFilter={handleStatOrChartClick}
                activeFilter={activeFilter}
              />
            </div>

            {/* 3. Main Master Ledger Table */}
            <ProjectTable 
              projects={projects}
              finances={finances}
              onSelectProject={(id) => {
                setSelectedProjectId(id);
                setTimeout(() => {
                  const detailEl = document.getElementById("project-detail-panel");
                  if (detailEl) {
                    detailEl.scrollIntoView({ behavior: "smooth" });
                  }
                }, 100);
              }}
              activeFilter={activeFilter}
              resetFilters={() => setActiveFilter(null)}
            />
          </div>
        )}

        {currentView === "subcontractors" && (
          <div className="animate-in fade-in duration-200">
            <h2 className="text-lg font-extrabold text-white mb-2 flex items-center gap-2">
              <Users className="text-sky-400" size={18} /> Subcontractor Ledger & Account Deficits
            </h2>
            <p className="text-xs text-slate-400 mb-6 font-medium">Reconciling internal subcontract purchase order agreements against outgoing bank advices.</p>
            <SubcontractorsLedger 
              projects={projects}
              finances={finances}
              onSelectProject={(id) => {
                setSelectedProjectId(id);
                setTimeout(() => {
                  document.getElementById("project-detail-panel")?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
              canEditProjects={canCreateProjects}
            />
          </div>
        )}

        {currentView === "engineers" && (
          <div className="animate-in fade-in duration-200">
            <h2 className="text-lg font-extrabold text-white mb-2 flex items-center gap-2">
              <User className="text-orange-400" size={18} /> Coordinated Staff & Resident Construction Leads
            </h2>
            <p className="text-xs text-slate-400 mb-6 font-medium">Tracking physical project milestone delivery and timeline performance relative to in-house engineer personnel leads.</p>
            <InHouseEngineersLedger 
              projects={projects}
              finances={finances}
              onSelectProject={(id) => {
                setSelectedProjectId(id);
                setTimeout(() => {
                  document.getElementById("project-detail-panel")?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
              canEditProjects={canCreateProjects}
            />
          </div>
        )}

        {currentView === "clients" && (
          <div className="animate-in fade-in duration-200">
            <h2 className="text-lg font-extrabold text-white mb-2 flex items-center gap-2">
              <Building className="text-emerald-400" size={18} /> Clients, Ministries & Corporate Project Hosts
            </h2>
            <p className="text-xs text-slate-400 mb-6 font-medium">Global summary of contracts portfolio, cleared cash inflows, and outstanding customer debt.</p>
            <ClientsLedger 
              projects={projects}
              finances={finances}
              onSelectProject={(id) => {
                setSelectedProjectId(id);
                setTimeout(() => {
                  document.getElementById("project-detail-panel")?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
              canEditProjects={canCreateProjects}
            />
          </div>
        )}

        {currentView === "invoices" && (
          <div className="animate-in fade-in duration-200">
            <h2 className="text-lg font-extrabold text-white mb-2 flex items-center gap-2">
              <Receipt className="text-violet-400" size={18} /> Aggregated Milestone Invoices Register
            </h2>
            <p className="text-xs text-slate-400 mb-6 font-medium">Consolidated monitoring for all submitted client payment requests and JCC approvals.</p>
            <InvoicesRegister 
              projects={projects}
              finances={finances}
              onSelectProject={(id) => {
                setSelectedProjectId(id);
                setTimeout(() => {
                  document.getElementById("project-detail-panel")?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
              canEditProjects={canCreateProjects}
            />
          </div>
        )}

        {currentView === "pos" && (
          <div className="animate-in fade-in duration-200">
            <h2 className="text-lg font-extrabold text-white mb-2 flex items-center gap-2">
              <Award className="text-teal-400" size={18} /> Global Client Purchase Order & Supplementary Agreement Registry
            </h2>
            <p className="text-xs text-slate-400 mb-6 font-medium">Holistic tracking of both foundational Primary PO capital and additional supplementary contract awards.</p>
            <PoRegistry 
              projects={projects}
              finances={finances}
              onSelectProject={(id) => {
                setSelectedProjectId(id);
                setTimeout(() => {
                  document.getElementById("project-detail-panel")?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
              canEditProjects={canCreateProjects}
            />
          </div>
        )}

        {/* Minimal Professional Footer */}
        <footer className="mt-12 text-center text-xs text-slate-500 border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <div>
            <span>© 2026 Project Lifecycle Ledger. Secure Internal Portal.</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projects, null, 2));
                const downloadAnchor = document.createElement("a");
                downloadAnchor.setAttribute("href", dataStr);
                downloadAnchor.setAttribute("download", "project_lifecycle_ledger_backup.json");
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
              }}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer text-[11px] font-mono"
            >
              Export Backup (JSON)
            </button>
          </div>
        </footer>

        {/* Bulk CSV Import Modal overlay */}
        {showImportModal && (
          <CsvImportModal 
            onClose={() => setShowImportModal(false)}
            onImport={handleImportProjects}
          />
        )}

      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
