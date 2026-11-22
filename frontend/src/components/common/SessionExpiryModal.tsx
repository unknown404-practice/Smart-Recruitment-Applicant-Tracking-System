import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, RefreshCw, LogOut } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants/routes';

export interface SessionExpiryModalProps {
  checkIntervalMs?: number;
}

export const SessionExpiryModal: React.FC<SessionExpiryModalProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for global unauthorized 401 signal from apiClient
    const handleUnauthorized = () => {
      if (user) {
        setIsOpen(true);
      }
    };

    window.addEventListener('ats:auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('ats:auth-unauthorized', handleUnauthorized);
  }, [user]);

  const handleExtendSession = async () => {
    if (!user) {
      setIsOpen(false);
      return;
    }
    setIsRefreshing(true);
    try {
      // Force token refresh to renew session credentials
      await user.getIdToken(true);
      await refreshProfile();
      setIsOpen(false);
    } catch (err) {
      console.error('[SessionExpiryModal] Failed to refresh token:', err);
      // Fallback to sign out if refresh fails
      await handleSignOut();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    try {
      await signOut();
      navigate(ROUTES.LOGIN, { replace: true });
    } catch {
      navigate(ROUTES.LOGIN, { replace: true });
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Session Timeout Notice"
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Sign Out
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExtendSession}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Extend Session
          </Button>
        </div>
      }
    >
      <div className="py-2 space-y-3">
        <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold">Your authentication session needs renewal</p>
            <p className="text-amber-700 mt-0.5">
              To protect your organization's hiring data, sessions automatically require periodic validation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>Click "Extend Session" to keep working or "Sign Out" to end your session.</span>
        </div>
      </div>
    </Modal>
  );
};
