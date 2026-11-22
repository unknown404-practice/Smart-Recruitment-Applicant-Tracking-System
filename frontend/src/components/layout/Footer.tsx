import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { Logo } from '../ui';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand info */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2">
              <Logo variant="horizontal" size="sm" />
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Enterprise-grade applicant tracking system designed for collaborative hiring teams, automated pipelines, and seamless candidate journeys.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Platform Navigation (Universal Access Only) */}
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
              Platform
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to={ROUTES.JOBS} className="text-slate-400 hover:text-white transition">
                  Browse Open Positions
                </Link>
              </li>
              <li>
                <Link to={ROUTES.HOME} className="text-slate-400 hover:text-white transition">
                  Platform Overview
                </Link>
              </li>
              <li>
                <Link to={ROUTES.LOGIN} className="text-slate-400 hover:text-white transition">
                  Account Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Security */}
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
              Trust & Compliance
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-1.5 text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Multi-Tenant Data Isolation</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Immutable Stage Audit Logs</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Cryptographic Offer Hashes</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Role-Based Access Control</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} Smart Employee Inc. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Enterprise Grade Security</span>
            </span>
            <span className="text-slate-600">•</span>
            <span>GDPR Ready</span>
            <span className="text-slate-600">•</span>
            <span>AES-256 Protected</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
