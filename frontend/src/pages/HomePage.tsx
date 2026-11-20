import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import {
  Briefcase,
  Users,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Server,
  Database,
  Layers,
  Sparkles,
  Lock,
  Activity,
} from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Button, Badge, Modal, Input, Select, Logo } from '../components/ui';
import { isEmulatorActive } from '../config/firebaseClient';
import {
  StaggerContainer,
  StaggerItem,
  MotionCard,
  AnimatedNumber,
} from '../components/animations';

interface HealthData {
  status?: string;
  uptime?: number;
  environment?: string;
  service?: string;
  success?: boolean;
  message?: string;
}

export const HomePage: React.FC = () => {
  const [backendHealth, setBackendHealth] = useState<HealthData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Day 3 Interactive Modal Test State
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoInput, setDemoInput] = useState('');
  const [demoRole, setDemoRole] = useState('CANDIDATE');
  const [btnLoading, setBtnLoading] = useState(false);

  useEffect(() => {
    // Check backend health endpoint
    axios
      .get('/api/health')
      .then((res) => {
        setBackendHealth(res.data);
        setLoadingHealth(false);
      })
      .catch((err) => {
        setHealthError(err.message || 'Could not connect to backend');
        setLoadingHealth(false);
      });
  }, []);

  const handleSimulateAction = () => {
    setBtnLoading(true);
    setTimeout(() => {
      setBtnLoading(false);
      setDemoModalOpen(false);
    }, 1200);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section with Ambient Glow Orbs */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-white to-slate-50 border-b border-slate-200/80 py-16 lg:py-24">
        {/* Subtle Ambient Background Orbs */}
        <motion.div
          animate={{
            x: [0, 20, 0],
            y: [0, -15, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[550px] h-[320px] bg-gradient-to-r from-emerald-200/30 via-brand-200/25 to-teal-200/20 rounded-full blur-3xl -z-10"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <StaggerContainer className="flex flex-col items-center space-y-5">
            <StaggerItem>
              <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="flex justify-center mb-1"
              >
                <Logo variant="horizontal" size="xl" className="drop-shadow-sm" />
              </motion.div>
            </StaggerItem>

            <StaggerItem>
              <Link to="/admin?tab=activity">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50/90 border border-emerald-300 text-emerald-800 text-xs font-bold uppercase tracking-wider shadow-2xs backdrop-blur-xs hover:bg-emerald-100 transition cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Day 20 Live: Real-Time System Activity Feed & Audit Trail
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-700 ml-1" />
                </motion.div>
              </Link>
            </StaggerItem>

            <StaggerItem>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
                Streamlined Hiring for <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">High-Velocity Teams</span>
              </h1>
            </StaggerItem>

            <StaggerItem>
              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Enterprise-grade Applicant Tracking System engineered with Express, PostgreSQL, Firebase Auth Emulator, and React Vite.
              </p>
            </StaggerItem>

            <StaggerItem>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
                <Link to={ROUTES.JOBS}>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Explore Openings
                    </Button>
                  </motion.div>
                </Link>

                <Link to="/admin?tab=activity">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      variant="primary"
                      size="lg"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      leftIcon={<Activity className="w-4 h-4" />}
                    >
                      Live Activity Feed
                    </Button>
                  </motion.div>
                </Link>

                <Link to={ROUTES.HR_PIPELINE}>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button variant="outline" size="lg" leftIcon={<Users className="w-5 h-5" />}>
                      HR Workspace
                    </Button>
                  </motion.div>
                </Link>

                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="secondary"
                    size="lg"
                    leftIcon={<Sparkles className="w-4 h-4 text-brand-600" />}
                    onClick={() => setDemoModalOpen(true)}
                  >
                    Interactive Modal Demo
                  </Button>
                </motion.div>
              </div>
            </StaggerItem>
          </StaggerContainer>

          {/* System Connectivity Diagnostics Bar with Motion Cards */}
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 max-w-3xl mx-auto text-left" delay={0.2}>
            {/* Backend API Probe */}
            <StaggerItem>
              <MotionCard className="p-4 rounded-2xl bg-white/90 backdrop-blur border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Express API
                    </p>
                    <p className="text-sm font-medium text-slate-800">
                      {loadingHealth ? (
                        <span className="text-slate-400">Pinging :5000...</span>
                      ) : backendHealth ? (
                        <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-4 h-4 inline" /> Online
                        </span>
                      ) : (
                        <span className="text-amber-600 text-xs">{healthError}</span>
                      )}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 bg-slate-100/90 rounded-md text-slate-600 font-semibold border border-slate-200/50">
                  :5000
                </span>
              </MotionCard>
            </StaggerItem>

            {/* PostgreSQL Database Schema */}
            <StaggerItem>
              <MotionCard className="p-4 rounded-2xl bg-white/90 backdrop-blur border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      PostgreSQL Engine
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      15 Migrations Active
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md font-bold border border-emerald-200/60">
                  <AnimatedNumber value={15} suffix=" SQL" />
                </span>
              </MotionCard>
            </StaggerItem>

            {/* Firebase Auth Emulator */}
            <StaggerItem>
              <MotionCard className="p-4 rounded-2xl bg-white/90 backdrop-blur border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Auth Emulator
                    </p>
                    <p className="text-sm font-semibold text-purple-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 inline" /> {isEmulatorActive() ? 'Connected' : 'Configured'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md font-bold border border-purple-200/60">
                  :9099
                </span>
              </MotionCard>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Day 2 & Day 3 Interactive Showcase Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            Live Implementation Gallery
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Day 2 & Day 3 Architectural Deliverables
          </h2>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            Verify the database schemas, UI component primitives, and client SDK integration added across Floors 2 and 3.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: Day 3 UI Primitives Showcase */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-600" />
                  Day 3: Reusable UI Primitives
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                  Frontend 1
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Standardized design system primitives for buttons, form controls, badges, and modals.
              </p>
            </div>

            {/* Badge Showcase */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Application Stage Badges (Live Component)
              </label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="APPLIED" dot>Applied</Badge>
                <Badge variant="SCREENING" dot>Screening</Badge>
                <Badge variant="INTERVIEW" dot>Interview</Badge>
                <Badge variant="SELECTED" dot>Selected</Badge>
                <Badge variant="OFFERED" dot>Offered</Badge>
                <Badge variant="REJECTED" dot>Rejected</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Job Lifecycle Badges (Live Component)
              </label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="DRAFT">Draft</Badge>
                <Badge variant="PUBLISHED">Published</Badge>
                <Badge variant="CLOSED">Closed</Badge>
                <Badge variant="ARCHIVED">Archived</Badge>
              </div>
            </div>

            {/* Button Showcase */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Interactive Buttons
              </label>
              <div className="flex flex-wrap gap-3 items-center">
                <Button variant="primary" size="sm">Primary</Button>
                <Button variant="secondary" size="sm">Secondary</Button>
                <Button variant="outline" size="sm">Outline</Button>
                <Button variant="danger" size="sm">Danger</Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={btnLoading}
                  onClick={() => {
                    setBtnLoading(true);
                    setTimeout(() => setBtnLoading(false), 1500);
                  }}
                >
                  {btnLoading ? 'Processing' : 'Click for Spinner'}
                </Button>
              </div>
            </div>
          </div>

          {/* Card 2: Day 2 & Day 3 Database & Cloud Architecture */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-600" />
                  Day 2 & 3: Relational SQL DDL & Cloud Storage
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Backend & Cloud
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Relational tables, foreign key constraints, triggers, and storage policies.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  001
                </span>
                <div className="text-xs">
                  <p className="font-semibold text-slate-900">001_users_companies.sql</p>
                  <p className="text-slate-600 mt-0.5">
                    Tables: <code className="text-brand-600 font-semibold">companies</code>, <code className="text-brand-600 font-semibold">users</code>, <code className="text-brand-600 font-semibold">user_role</code> ENUM (ADMIN, HR, CANDIDATE), automated timestamp triggers.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  002
                </span>
                <div className="text-xs">
                  <p className="font-semibold text-slate-900">002_jobs_candidates_applications.sql</p>
                  <p className="text-slate-600 mt-0.5">
                    Tables: <code className="text-emerald-700 font-semibold">jobs</code>, <code className="text-emerald-700 font-semibold">candidate_profiles</code>, <code className="text-emerald-700 font-semibold">resume_metadata</code>, <code className="text-emerald-700 font-semibold">applications</code>, <code className="text-emerald-700 font-semibold">application_stage_history</code>.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  IAM
                </span>
                <div className="text-xs">
                  <p className="font-semibold text-slate-900">Private Resume Storage & Migration Runner</p>
                  <p className="text-slate-600 mt-0.5">
                    UUID file obfuscation, SHA-256 integrity, 5 MB quota, and automated <code className="text-purple-700 font-semibold">scripts/migrate.ts</code> runner.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Engineered for Every Stage of Recruitment
          </h2>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            Contract-first development connecting candidates, recruiters, and hiring managers.
          </p>
        </div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StaggerItem>
            <MotionCard className="bg-white/95 backdrop-blur p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 h-full flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-3 shadow-2xs">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Candidate Experience</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Frictionless application submission, resume upload with 5 MB quota, and real-time application stage tracking.
                </p>
              </div>
              <div className="pt-4">
                <Link to={ROUTES.CANDIDATE} className="text-sm font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1.5 group">
                  View Candidate Portal <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
                </Link>
              </div>
            </MotionCard>
          </StaggerItem>

          <StaggerItem>
            <MotionCard className="bg-white/95 backdrop-blur p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 h-full flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-brand-600 flex items-center justify-center font-bold mb-3 shadow-2xs">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">HR Hiring Pipeline</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Interactive Kanban board with 6 stages: Applied, Screening, Interview, Selected, Offered, and Rejected.
                </p>
              </div>
              <div className="pt-4">
                <Link to={ROUTES.HR_PIPELINE} className="text-sm font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1.5 group">
                  Open Pipeline Board <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
                </Link>
              </div>
            </MotionCard>
          </StaggerItem>

          <StaggerItem>
            <MotionCard className="bg-white/95 backdrop-blur p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 h-full flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-3 shadow-2xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Admin Governance</h3>
                <p className="text-sm text-slate-600 mt-1">
                  User and company management, role assignment with custom claims, and system-wide audit activity feed.
                </p>
              </div>
              <div className="pt-4">
                <Link to={ROUTES.ADMIN} className="text-sm font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1.5 group">
                  Manage Organization <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
                </Link>
              </div>
            </MotionCard>
          </StaggerItem>
        </StaggerContainer>
      </section>

      {/* Interactive Day 3 Modal Primitive Dialog */}
      <Modal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        title="Day 3 Modal Primitive Demo"
        subtitle="Accessible dialog component rendered with custom input and select primitives"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDemoModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={btnLoading}
              onClick={handleSimulateAction}
            >
              Submit Application
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Candidate Full Name"
            placeholder="e.g. Alex Johnson"
            value={demoInput}
            onChange={(e) => setDemoInput(e.target.value)}
            helperText="Input component handles labels, focus states, and validation."
          />

          <Select
            label="Preferred Role Category"
            value={demoRole}
            onChange={(e) => setDemoRole(e.target.value)}
            options={[
              { value: 'CANDIDATE', label: 'Software Engineer (Frontend)' },
              { value: 'HR', label: 'Backend Developer (Node.js)' },
              { value: 'ADMIN', label: 'DevOps / Cloud Architect' },
            ]}
            helperText="Select component populated with recruitment role options."
          />

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <strong>Modal Features Tested:</strong> Escape key listener, backdrop blur dismissal, focus trap, and body scroll lock.
          </div>
        </div>
      </Modal>
    </div>
  );
};
