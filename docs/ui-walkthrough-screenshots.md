# Smart ATS — High-Resolution UI Walkthrough & Operational Dashboards

> **Floor 24 Milestone Documentation:** High-resolution UI captures and operational catalog across all 7 role workflows in the Smart Recruitment & Applicant Tracking System.

For the complete catalog with embedded Full HD (1920×1080) walkthrough screenshots and architectural specifications, see:
👉 **[docs/screenshots/README.md](./screenshots/README.md)**

---

## 📸 Cataloged Operational Dashboards

1. **[Candidate Portal](./screenshots/01-candidate-portal.png)** (`/candidate`) — Candidate application pipeline steppers, scheduled video interview launch card, and pre-hire onboarding checklist progress.
2. **[Public Job Board](./screenshots/02-job-board.png)** (`/jobs`) — Requisition catalog, skill taxonomy tags, compensation transparency disclosures, and 1-click application modals.
3. **[HR Recruitment Pipeline Kanban](./screenshots/03-hr-pipeline.png)** (`/hr/pipeline`) — Visual 5-stage recruitment board (`Applied` → `Screening` → `Interview` → `Offer` → `Hired`), candidate dossiers, and stage velocity metrics.
4. **[Interviewer Evaluation & Scorecard](./screenshots/04-interviewer-evaluation.png)** (`/hr/interviews`) — 5-criteria structured rubric, weighted percentile calculation (4.8/5.0), recommendation decisions (`Strong Hire`), and automated pipeline trigger hooks.
5. **[Executive Offer Desk](./screenshots/05-offer-desk.png)** (`/hr/offers`) — Offer ledger, salary & ISO equity option modeling, formal legal offer letter preview, and SHA-256 cryptographic signature audit.
6. **[Enterprise System Activity Audit Log](./screenshots/06-system-activity-audit-log.png)** (`/admin?tab=activity`) — Live WebSocket activity feed, actor identity and IP attribution, stage transitions, and Anti-IDOR boundary validation evidence.
7. **[Master Admin Control Panel & RBAC](./screenshots/07-admin-control-panel.png)** (`/admin`) — Tenant organization governance, granular RBAC user directory (`SUPER_ADMIN`, `ADMIN`, `HR_LEAD`, `INTERVIEWER`, `RECRUITER`, `CANDIDATE`), mandatory MFA status, and security policies.

---

## 🛠️ Automated Regeneration

To regenerate all 7 high-resolution screenshots:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/capture_dashboards.ps1
```
All assets are saved losslessly to `docs/screenshots/*.png`.
