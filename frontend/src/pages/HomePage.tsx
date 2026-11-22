import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import {
  Briefcase,
  Users,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Layers,
  Sparkles,
  Activity,
  Calendar,
  FileCheck,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Logo } from '../components/ui';
import {
  StaggerContainer,
  StaggerItem,
  MotionCard,
} from '../components/animations';

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-20 pb-20">
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

            {/* Enterprise Platform Badge */}
            <StaggerItem>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50/90 border border-brand-200/90 text-brand-700 text-xs font-semibold tracking-wide shadow-2xs backdrop-blur-xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Intelligent Talent Acquisition & Lifecycle Management
              </motion.div>
            </StaggerItem>

            <StaggerItem>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
                Streamlined Hiring for <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">High-Velocity Teams</span>
              </h1>
            </StaggerItem>

            <StaggerItem>
              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Modernize your hiring workflow with automated pipeline progression, collaborative interview scheduling, immutable audit tracking, and compliance-ready offer management.
              </p>
            </StaggerItem>

            {/* Production Action Buttons */}
            <StaggerItem>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
                <Link to={ROUTES.JOBS}>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Explore Openings
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

                <Link to={ROUTES.CANDIDATE}>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      variant="secondary"
                      size="lg"
                      leftIcon={<Briefcase className="w-4 h-4 text-brand-600" />}
                    >
                      Candidate Portal
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </StaggerItem>
          </StaggerContainer>

          {/* Enterprise Platform Capability Metrics */}
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 max-w-3xl mx-auto text-left" delay={0.2}>
            {/* Security & Access */}
            <StaggerItem>
              <MotionCard className="p-4 rounded-2xl bg-white/90 backdrop-blur border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Enterprise Security
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      Multi-Tenant Isolation
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200/60">
                  Role RBAC
                </span>
              </MotionCard>
            </StaggerItem>

            {/* Pipeline Automation */}
            <StaggerItem>
              <MotionCard className="p-4 rounded-2xl bg-white/90 backdrop-blur border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-brand-50 text-brand-700">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Pipeline Engine
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      6-Stage Concurrency
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-brand-50 text-brand-700 rounded-md border border-brand-200/60">
                  ACID Locked
                </span>
              </MotionCard>
            </StaggerItem>

            {/* Audit & Compliance */}
            <StaggerItem>
              <MotionCard className="p-4 rounded-2xl bg-white/90 backdrop-blur border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Audit Traceability
                    </p>
                    <p className="text-sm font-bold text-purple-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 inline" /> Immutable Logs
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md border border-purple-200/60">
                  Verified
                </span>
              </MotionCard>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Unified Enterprise Platform Architecture & Solutions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            Core Enterprise Solutions
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Engineered for Precision Across Every Hiring Phase
          </h2>
          <p className="text-slate-600 mt-2 text-sm sm:text-base leading-relaxed">
            Eliminate recruitment fragmentation with synchronized workflows connecting candidates, talent acquisition specialists, and executive leadership.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Solution 1: Kanban Pipeline */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Adaptive Pipeline</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Row-level locked transitions prevent race conditions across 6 structured stages with mandatory audit justification notes.
              </p>
            </div>
            <Link
              to={ROUTES.HR_PIPELINE}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 group pt-2 border-t border-slate-100"
            >
              Inspect Pipeline <ChevronRight className="w-3.5 h-3.5 transition group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Solution 2: Interview Loop Coordination */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Interview Operations</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Synchronized scheduling across technical loops, panel assessments, scorecards rubric evaluation, and reschedule audit trails.
              </p>
            </div>
            <Link
              to={ROUTES.HR_INTERVIEWS}
              className="text-xs font-bold text-purple-600 hover:text-purple-700 inline-flex items-center gap-1 group pt-2 border-t border-slate-100"
            >
              View Schedules <ChevronRight className="w-3.5 h-3.5 transition group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Solution 3: Controlled Offers */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Offer Management</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Controlled HTML templates with compensation tokens, SHA-256 cryptographic snapshot archival, and digital acceptance loops.
              </p>
            </div>
            <Link
              to={ROUTES.HR_OFFERS}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 group pt-2 border-t border-slate-100"
            >
              Explore Offers <ChevronRight className="w-3.5 h-3.5 transition group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Solution 4: Analytics & Audit Feed */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Real-Time Intelligence</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Zero-division conversion funnels, time-to-hire analytics, and unified immutable audit feeds tracking all corporate activity.
              </p>
            </div>
            <Link
              to={ROUTES.HR_ANALYTICS}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 inline-flex items-center gap-1 group pt-2 border-t border-slate-100"
            >
              Review Analytics <ChevronRight className="w-3.5 h-3.5 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid: Persona Capabilities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Role-Tailored Workspaces
          </h2>
          <p className="text-slate-600 mt-2 text-sm sm:text-base leading-relaxed">
            Dedicated interfaces optimized for candidates, talent partners, and system administrators.
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
                  Frictionless application submission, validated resume upload with 5 MB quota, profile management, and real-time application stage tracking.
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
                  Interactive Kanban board with 6 stages: Applied, Screening, Interview, Selected, Offered, and Rejected with instant candidate dossiers.
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
                  User and company management, role assignment with custom claims, organization-wide telemetry, and audit activity feed.
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
    </div>
  );
};
