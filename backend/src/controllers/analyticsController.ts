import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { pool } from '../config/database';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class AnalyticsController {
  /**
   * GET /api/analytics/summary
   * Computes Volume, Stage Conversion, Time-to-Hire, Offer Acceptance, and Funnel Breakdown.
   */
  public static async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      // Restrict access to authorized staff roles
      const role = user.role;
      if (!['ADMIN', 'SUPER_ADMIN', 'HR', 'RECRUITER'].includes(role)) {
        res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions for analytics' });
        return;
      }

      // Resolve tenant company_id
      let companyId = user.companyId;
      if (!companyId) {
        try {
          const staffLookup = await pool.query<{ company_id: string | null }>(
            'SELECT company_id FROM users WHERE firebase_uid = $1 LIMIT 1;',
            [user.uid]
          );
          companyId = staffLookup?.rows?.[0]?.company_id || null;
        } catch {
          companyId = null;
        }
      }

      if (!companyId) {
        res.status(403).json({
          success: false,
          message: 'Corporate tenant assignment required to access hiring analytics',
        });
        return;
      }

      const { jobId, department, startDate, endDate } = req.query;

      // Validate optional jobId UUID
      if (jobId && typeof jobId === 'string') {
        if (!UUID_REGEX.test(jobId)) {
          res.status(400).json({ success: false, message: 'Invalid jobId parameter: must be a valid UUID' });
          return;
        }
      }

      // Validate date filters
      let normalizedStart: string | null = null;
      let normalizedEnd: string | null = null;

      if (startDate && typeof startDate === 'string') {
        const d = new Date(startDate);
        if (isNaN(d.getTime())) {
          res.status(400).json({ success: false, message: 'Invalid startDate format: must be valid ISO date' });
          return;
        }
        normalizedStart = d.toISOString();
      }

      if (endDate && typeof endDate === 'string') {
        const d = new Date(endDate);
        if (isNaN(d.getTime())) {
          res.status(400).json({ success: false, message: 'Invalid endDate format: must be valid ISO date' });
          return;
        }
        // If passed as YYYY-MM-DD, set to end-of-day UTC
        if (/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
          d.setUTCHours(23, 59, 59, 999);
        }
        normalizedEnd = d.toISOString();
      }

      if (normalizedStart && normalizedEnd) {
        if (new Date(normalizedStart).getTime() > new Date(normalizedEnd).getTime()) {
          res.status(400).json({
            success: false,
            message: 'Invalid date range: startDate must not be after endDate',
          });
          return;
        }
      }

      const summary = await AnalyticsService.getHiringAnalyticsSummary({
        companyId,
        jobId: typeof jobId === 'string' ? jobId : null,
        department: typeof department === 'string' && department.trim() ? department.trim() : null,
        startDate: normalizedStart,
        endDate: normalizedEnd,
      });

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (err: any) {
      console.error('[Analytics Error]', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error while aggregating recruitment analytics',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }

  /**
   * GET /api/analytics/filters
   * Returns available filter facets (jobs and departments) for the caller's tenant.
   */
  public static async getFilters(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const role = user.role;
      if (!['ADMIN', 'SUPER_ADMIN', 'HR', 'RECRUITER'].includes(role)) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      let companyId = user.companyId;
      if (!companyId) {
        try {
          const staffLookup = await pool.query<{ company_id: string | null }>(
            'SELECT company_id FROM users WHERE firebase_uid = $1 LIMIT 1;',
            [user.uid]
          );
          companyId = staffLookup?.rows?.[0]?.company_id || null;
        } catch {
          companyId = null;
        }
      }

      if (!companyId) {
        res.status(403).json({
          success: false,
          message: 'Corporate tenant assignment required',
        });
        return;
      }

      const filterOptions = await AnalyticsService.getFilterOptions(companyId);

      res.status(200).json({
        success: true,
        data: filterOptions,
      });
    } catch (err: any) {
      console.error('[Analytics Filters Error]', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching analytics filters',
      });
    }
  }
}
