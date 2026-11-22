import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import {
  ArrowRight,
  Users,
  Calendar,
  FileCheck,
} from 'lucide-react';
import { Button, Logo } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { StaggerContainer, StaggerItem } from '../components/animations';

export const HomePage: React.FC = () => {
  const { dbUser, user } = useAuth();

  // Determine contextual primary action based on logged-in role
  const getContextualActions = () => {
    if (user && dbUser) {
      if (dbUser.role === 'ADMIN') {
        return (
          <>
            <Link to={ROUTES.ADMIN}>
              <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Go to Admin Console
              </Button>
            </Link>
            <Link to={ROUTES.JOBS}>
              <Button variant="outline" size="lg">
                Browse Openings
              </Button>
            </Link>
          </>
        );
      }
      if (dbUser.role === 'HR') {
        return (
          <>
            <Link to={ROUTES.HR_PIPELINE}>
              <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Open HR Workspace
              </Button>
            </Link>
            <Link to={ROUTES.JOBS}>
              <Button variant="outline" size="lg">
                Browse Openings
              </Button>
            </Link>
          </>
        );
      }
      return (
        <>
          <Link to={ROUTES.CANDIDATE}>
            <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Candidate Portal
            </Button>
          </Link>
          <Link to={ROUTES.JOBS}>
            <Button variant="outline" size="lg">
              Browse Openings
            </Button>
          </Link>
        </>
      );
    }

    return (
      <>
        <Link to={ROUTES.JOBS}>
          <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Explore Openings
          </Button>
        </Link>
        <Link to={ROUTES.LOGIN}>
          <Button variant="outline" size="lg">
            Sign In to Account
          </Button>
        </Link>
      </>
    );
  };

  return (
    <div className="space-y-24 pb-20">
      {/* ----------------------------------------------------------------- */}
      {/* 1. Hero Section                                                   */}
      {/* ----------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/50 via-white to-slate-50 border-b border-slate-200/80 pt-20 pb-20 lg:pt-24 lg:pb-28">
        {/* Subtle Ambient Background Gradient Blur */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-gradient-to-tr from-brand-200/20 via-indigo-200/15 to-emerald-200/15 rounded-full blur-3xl -z-10" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <StaggerContainer className="flex flex-col items-center space-y-6">
            <StaggerItem>
              <div className="flex justify-center mb-2">
                <Logo variant="horizontal" size="xl" className="drop-shadow-xs" />
              </div>
            </StaggerItem>

            <StaggerItem>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
                The Modern Standard for{' '}
                <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                  Enterprise Recruitment
                </span>
              </h1>
            </StaggerItem>

            <StaggerItem>
              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Empowering high-velocity hiring teams to source exceptional talent, orchestrate collaborative interview loops, and extend tamper-evident employment offers.
              </p>
            </StaggerItem>

            {/* Role-Aware Universal Action Buttons */}
            <StaggerItem>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                {getContextualActions()}
              </div>
            </StaggerItem>
          </StaggerContainer>

          {/* ------------------------------------------------------------- */}
          {/* Visual Platform Showcase (High-Fidelity Interface Mockup)      */}
          {/* ------------------------------------------------------------- */}
          <div className="pt-10 max-w-5xl mx-auto">
            <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-2 sm:p-3 overflow-hidden text-left">
              {/* Window Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="text-xs font-mono text-slate-400 ml-2 hidden sm:inline-block">
                    smart-ats.internal/pipeline
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">Active Multi-Tenant Session</span>
                </div>
              </div>

              {/* Window Body: Visual Pipeline Dashboard Preview */}
              <div className="bg-slate-950 rounded-xl p-4 sm:p-6 space-y-6">
                {/* Metric Summary Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pb-4 border-b border-slate-800/80">
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                    <p className="text-2xs text-slate-400 uppercase font-bold tracking-wider">Active Requisitions</p>
                    <p className="text-lg sm:text-xl font-extrabold text-white mt-0.5">24 Roles</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                    <p className="text-2xs text-slate-400 uppercase font-bold tracking-wider">Candidates In Loop</p>
                    <p className="text-lg sm:text-xl font-extrabold text-brand-400 mt-0.5">86 In Review</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                    <p className="text-2xs text-slate-400 uppercase font-bold tracking-wider">Avg Loop Duration</p>
                    <p className="text-lg sm:text-xl font-extrabold text-emerald-400 mt-0.5">14.2 Days</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                    <p className="text-2xs text-slate-400 uppercase font-bold tracking-wider">Audit Integrity</p>
                    <p className="text-lg sm:text-xl font-extrabold text-purple-400 mt-0.5">100% Verified</p>
                  </div>
                </div>

                {/* Pipeline Stages Mini Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Column 1: Screening */}
                  <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-400" /> Screening
                      </span>
                      <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-slate-800 text-slate-400">12</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/90 space-y-1">
                      <p className="text-xs font-semibold text-slate-200">Alex Morgan</p>
                      <p className="text-2xs text-slate-400">Senior Full Stack Engineer</p>
                      <div className="flex items-center justify-between pt-1 text-2xs text-slate-500">
                        <span>Match: 96%</span>
                        <span className="text-emerald-400 font-medium">Ready for Loop</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Interview */}
                  <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-400" /> Technical Loops
                      </span>
                      <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-slate-800 text-slate-400">6</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/90 space-y-1">
                      <p className="text-xs font-semibold text-slate-200">Elena Rostova</p>
                      <p className="text-2xs text-slate-400">Principal Product Designer</p>
                      <div className="flex items-center justify-between pt-1 text-2xs text-slate-500">
                        <span>Round 3 of 4</span>
                        <span className="text-purple-400 font-medium">Scorecard 4.9/5</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Offer */}
                  <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" /> Offer & Onboarding
                      </span>
                      <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-slate-800 text-slate-400">4</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/90 space-y-1">
                      <p className="text-xs font-semibold text-slate-200">Marcus Vance</p>
                      <p className="text-2xs text-slate-400">Lead Cloud Architect</p>
                      <div className="flex items-center justify-between pt-1 text-2xs text-slate-500">
                        <span>SHA-256 Signed</span>
                        <span className="text-emerald-400 font-medium">Awaiting Signature</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 2. Core Pillars (Narrative Solutions, Zero Banners)               */}
      {/* ----------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <p className="text-xs font-bold text-brand-600 uppercase tracking-widest">
            Architecture Highlights
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Designed for Modern Hiring Velocity
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Every layer engineered for speed, transparency, and strict organizational security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1 */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Row-Locked Concurrency</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              ACID database transactions with exclusive row-level locking prevent race conditions and candidate stage collisions when multiple recruiters collaborate simultaneously.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Calibrated Evaluations</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Eliminate evaluation bias through structured scorecards, numerical rating rubrics, and collaborative interview feedback logged to immutable audit records.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Tamper-Evident Offers</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Generate standardized contracts injected with approved compensation tokens and archived with cryptographic SHA-256 verification hashes for compliance.
            </p>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 3. Enterprise Trust & Compliance Bar                              */}
      {/* ----------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white text-center space-y-8">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Enterprise Trust Built In
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Robust multi-tenant boundaries guarantee that candidate dossiers, compensation details, and internal discussions remain strictly isolated within your organization.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-slate-800">
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black text-emerald-400">99.9%</p>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">System Availability</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black text-brand-400">100%</p>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Audit Log Traceability</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black text-purple-400">AES-256</p>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Storage Encryption</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black text-amber-400">Zero</p>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Cross-Tenant Leakage</p>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 4. Elegant Bottom CTA                                             */}
      {/* ----------------------------------------------------------------- */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Ready to Modernize Your Hiring Process?
        </h2>
        <p className="text-slate-600 text-base max-w-xl mx-auto">
          Explore active career opportunities or connect your recruitment team with our structured workflow platform.
        </p>
        <div className="flex justify-center pt-2">
          <Link to={ROUTES.JOBS}>
            <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Browse Open Positions
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};
