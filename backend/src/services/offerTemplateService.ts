/**
 * Offer Letter Template Service
 * Generates deterministic, immutable HTML offer letters with strict XSS sanitization
 * and standardized currency and date formatting.
 */

/**
 * Escapes HTML control characters to prevent Stored XSS attacks in rendered offer documents.
 * Escapes &, <, >, ", and '.
 */
export function escapeHtml(unsafe: string | number | null | undefined): string {
  if (unsafe === null || unsafe === undefined) {
    return '';
  }
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formats a salary amount with fixed two-decimal precision and thousands separators.
 * Handles string or numeric inputs safely without crash or NaN propagation.
 */
export function formatSalary(amount: number | string | null | undefined, currency = 'USD'): string {
  const safeCurrency = escapeHtml((currency || 'USD').trim().toUpperCase());
  if (amount === null || amount === undefined || amount === '') {
    return `0.00 ${safeCurrency}`;
  }

  const numeric = typeof amount === 'number' ? amount : parseFloat(String(amount));
  if (isNaN(numeric)) {
    return `${escapeHtml(String(amount))} ${safeCurrency}`;
  }

  const formattedNumber = numeric.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${formattedNumber} ${safeCurrency}`;
}

/**
 * Formats a Date object or ISO date string into a consistent YYYY-MM-DD format.
 * Gracefully handles invalid dates and missing dates without throwing.
 */
export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) {
    return 'N/A';
  }

  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) {
    return typeof dateInput === 'string' ? escapeHtml(dateInput) : 'N/A';
  }

  return d.toISOString().split('T')[0];
}

export interface OfferLetterTemplateData {
  candidateName: string;
  candidateEmail?: string | null;
  jobTitle: string;
  companyName: string;
  salaryAmount: number | string;
  currency?: string;
  startDate: string | Date;
  expiresAt?: string | Date | null;
}

/**
 * Builds a deterministic, self-contained, professional HTML offer letter.
 * All dynamic parameters are strictly HTML-escaped.
 */
export function generateOfferLetterHtml(data: OfferLetterTemplateData): string {
  const candidateName = escapeHtml(data.candidateName);
  const candidateEmail = escapeHtml(data.candidateEmail || '');
  const jobTitle = escapeHtml(data.jobTitle);
  const companyName = escapeHtml(data.companyName);
  const currency = escapeHtml((data.currency || 'USD').trim().toUpperCase());
  const formattedSalary = formatSalary(data.salaryAmount, data.currency || 'USD');
  const formattedStartDate = formatDate(data.startDate);
  const formattedExpiryDate = formatDate(data.expiresAt);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offer of Employment - ${candidateName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #f8fafc;
      margin: 0;
      padding: 32px 16px;
    }
    .offer-container {
      max-width: 720px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 48px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 24px;
      margin-bottom: 32px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .company-title {
      font-size: 26px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .document-badge {
      display: inline-block;
      font-size: 12px;
      font-weight: 700;
      color: #047857;
      background-color: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 4px 12px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 16px;
    }
    .terms-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin: 28px 0;
      overflow: hidden;
    }
    .terms-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .terms-table th, .terms-table td {
      padding: 14px 20px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }
    .terms-table tr:last-child th, .terms-table tr:last-child td {
      border-bottom: none;
    }
    .terms-table th {
      color: #64748b;
      font-weight: 600;
      width: 38%;
      background-color: #f1f5f9;
    }
    .terms-table td {
      color: #0f172a;
      font-weight: 600;
    }
    .salary-highlight {
      font-size: 16px;
      color: #047857;
      font-weight: 800;
    }
    .signature-section {
      margin-top: 48px;
      padding-top: 28px;
      border-top: 1px dashed #cbd5e1;
    }
    .signature-grid {
      display: table;
      width: 100%;
      margin-top: 24px;
    }
    .signature-col {
      display: table-cell;
      width: 50%;
      vertical-align: top;
      padding-right: 20px;
    }
    .signature-col:last-child {
      padding-right: 0;
      padding-left: 20px;
    }
    .sign-line {
      border-bottom: 1px solid #94a3b8;
      height: 48px;
      margin-bottom: 8px;
    }
    .sign-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .sign-name {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 4px;
    }
    .footer {
      margin-top: 40px;
      font-size: 12px;
      color: #94a3b8;
      text-align: center;
      border-top: 1px solid #f1f5f9;
      padding-top: 16px;
    }
  </style>
</head>
<body>
  <div class="offer-container">
    <div class="header">
      <div>
        <h1 class="company-title">${companyName}</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">Formal Employment Requisition & Offer</p>
      </div>
      <div>
        <span class="document-badge">Official Offer</span>
      </div>
    </div>

    <p class="greeting">Dear ${candidateName}${candidateEmail ? ` (${candidateEmail})` : ''},</p>

    <p>
      On behalf of <strong>${companyName}</strong>, we are thrilled to extend this formal offer of employment
      for the position of <strong>${jobTitle}</strong>. We were thoroughly impressed with your experience,
      skills, and cultural alignment throughout our recruitment process.
    </p>

    <div class="terms-card">
      <table class="terms-table">
        <tbody>
          <tr>
            <th>Position Title</th>
            <td>${jobTitle}</td>
          </tr>
          <tr>
            <th>Annual Compensation</th>
            <td class="salary-highlight">${formattedSalary}</td>
          </tr>
          <tr>
            <th>Currency</th>
            <td>${currency}</td>
          </tr>
          <tr>
            <th>Anticipated Start Date</th>
            <td>${formattedStartDate}</td>
          </tr>
          <tr>
            <th>Offer Expiration Date</th>
            <td>${formattedExpiryDate}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p>
      This offer is contingent upon the successful completion of standard pre-employment verifications.
      Please review the terms stated above carefully. To accept this offer, please sign and date this document
      and return it prior to the expiration date of <strong>${formattedExpiryDate}</strong>.
    </p>

    <div class="signature-section">
      <h3 style="font-size: 15px; margin: 0 0 8px 0; color: #0f172a;">Acceptance of Offer</h3>
      <p style="font-size: 13px; color: #64748b; margin: 0 0 16px 0;">
        I accept the offer of employment as outlined above and confirm my anticipated start date.
      </p>

      <div class="signature-grid">
        <div class="signature-col">
          <div class="sign-line"></div>
          <div class="sign-label">Candidate Signature</div>
          <div class="sign-name">${candidateName}</div>
          <div style="margin-top: 8px; font-size: 12px; color: #64748b;">Date: ____________________</div>
        </div>
        <div class="signature-col">
          <div class="sign-line"></div>
          <div class="sign-label">Authorized Employer Signature</div>
          <div class="sign-name">${companyName}</div>
          <div style="margin-top: 8px; font-size: 12px; color: #64748b;">Date: ____________________</div>
        </div>
      </div>
    </div>

    <div class="footer">
      This document constitutes a confidential employment offer generated by Smart Recruitment & ATS.
    </div>
  </div>
</body>
</html>`;
}
