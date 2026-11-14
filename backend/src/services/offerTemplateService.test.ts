import {
  escapeHtml,
  formatSalary,
  formatDate,
  generateOfferLetterHtml,
  OfferLetterTemplateData,
} from './offerTemplateService';

describe('Offer Template Service - Unit & Security Tests', () => {
  describe('HTML Escaping & XSS Sanitization', () => {
    it('escapes standard HTML control characters (&, <, >, ", \')', () => {
      expect(escapeHtml('&')).toBe('&amp;');
      expect(escapeHtml('<')).toBe('&lt;');
      expect(escapeHtml('>')).toBe('&gt;');
      expect(escapeHtml('"')).toBe('&quot;');
      expect(escapeHtml("'")).toBe('&#39;');
    });

    it('neutralizes malicious script tags and event handlers', () => {
      const maliciousScript = '<script>alert("XSS")</script>';
      expect(escapeHtml(maliciousScript)).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');

      const maliciousAttribute = '" onmouseover="alert(\'pwned\')"';
      expect(escapeHtml(maliciousAttribute)).toBe('&quot; onmouseover=&quot;alert(&#39;pwned&#39;)&quot;');

      const imgPayload = '<img src=x onerror=alert(1)>';
      expect(escapeHtml(imgPayload)).toBe('&lt;img src=x onerror=alert(1)&gt;');
    });

    it('handles null, undefined, empty string, and numeric values safely', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml(12345)).toBe('12345');
    });
  });

  describe('Salary Formatting', () => {
    it('formats numeric amounts with two decimal places and commas', () => {
      expect(formatSalary(145000, 'USD')).toBe('145,000.00 USD');
      expect(formatSalary(145000.5, 'USD')).toBe('145,000.50 USD');
      expect(formatSalary(99999.99, 'EUR')).toBe('99,999.99 EUR');
      expect(formatSalary(0, 'USD')).toBe('0.00 USD');
    });

    it('formats numeric strings with proper two decimal places', () => {
      expect(formatSalary('160000.00', 'USD')).toBe('160,000.00 USD');
      expect(formatSalary('75000', 'GBP')).toBe('75,000.00 GBP');
    });

    it('handles invalid or non-numeric salary values safely without throwing', () => {
      expect(formatSalary('not-a-number', 'USD')).toBe('not-a-number USD');
      expect(formatSalary(null, 'USD')).toBe('0.00 USD');
      expect(formatSalary(undefined, 'USD')).toBe('0.00 USD');
    });

    it('escapes malicious currency inputs to prevent injection', () => {
      const maliciousCurrency = '<script>alert("curr")</script>';
      const result = formatSalary(120000, maliciousCurrency);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;SCRIPT&gt;ALERT(&quot;CURR&quot;)&lt;/SCRIPT&gt;');
    });
  });

  describe('Date Formatting', () => {
    it('formats valid Date objects and ISO strings to YYYY-MM-DD', () => {
      const dateObj = new Date('2026-11-20T10:00:00Z');
      expect(formatDate(dateObj)).toBe('2026-11-20');
      expect(formatDate('2026-12-01')).toBe('2026-12-01');
    });

    it('gracefully handles null, undefined, and empty string dates', () => {
      expect(formatDate(null)).toBe('N/A');
      expect(formatDate(undefined)).toBe('N/A');
      expect(formatDate('')).toBe('N/A');
    });

    it('handles invalid date strings gracefully without throwing', () => {
      expect(formatDate('invalid-date-string')).toBe('invalid-date-string');
    });
  });

  describe('generateOfferLetterHtml', () => {
    const validData: OfferLetterTemplateData = {
      candidateName: 'Jane Doe',
      candidateEmail: 'jane.doe@example.com',
      jobTitle: 'Senior Cloud Architect',
      companyName: 'Acme Corporation',
      salaryAmount: 185000,
      currency: 'USD',
      startDate: '2026-12-15',
      expiresAt: '2026-11-30',
    };

    it('generates a complete HTML document with all expected sections', () => {
      const html = generateOfferLetterHtml(validData);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Acme Corporation');
      expect(html).toContain('Jane Doe');
      expect(html).toContain('jane.doe@example.com');
      expect(html).toContain('Senior Cloud Architect');
      expect(html).toContain('185,000.00 USD');
      expect(html).toContain('2026-12-15');
      expect(html).toContain('2026-11-30');
      expect(html).toContain('Acceptance of Offer');
      expect(html).toContain('Candidate Signature');
      expect(html).toContain('Authorized Employer Signature');
    });

    it('strictly sanitizes all dynamic fields against Stored XSS', () => {
      const maliciousData: OfferLetterTemplateData = {
        candidateName: '<script>alert("candidate-xss")</script>',
        candidateEmail: 'candidate"onload="alert(1)@evil.com',
        jobTitle: 'Hacker & Developer <img src=x onerror=alert(2)>',
        companyName: 'EvilCorp <iframe src="javascript:alert(3)">',
        salaryAmount: '120000" onfocus="alert(4)',
        currency: 'USD<script>alert(5)</script>',
        startDate: '2026-12-01<script>alert(6)</script>',
        expiresAt: '2026-12-15"><script>alert(7)</script>',
      };

      const html = generateOfferLetterHtml(maliciousData);

      // Verify no raw script, iframe, or unescaped HTML tags exist
      expect(html).not.toContain('<script');
      expect(html).not.toContain('<iframe');
      expect(html).not.toContain('<img');

      // Verify escaped equivalents exist safely
      expect(html).toContain('&lt;script&gt;alert(&quot;candidate-xss&quot;)&lt;/script&gt;');
      expect(html).toContain('Hacker &amp; Developer &lt;img src=x onerror=alert(2)&gt;');
      expect(html).toContain('EvilCorp &lt;iframe src=&quot;javascript:alert(3)&quot;&gt;');
      expect(html).toContain('candidate&quot;onload=&quot;alert(1)@evil.com');
    });

    it('renders cleanly even when optional email or expiry date is omitted', () => {
      const minimalData: OfferLetterTemplateData = {
        candidateName: 'John Smith',
        jobTitle: 'Backend Engineer',
        companyName: 'Tech Start',
        salaryAmount: 110000,
        startDate: '2026-12-01',
      };

      const html = generateOfferLetterHtml(minimalData);
      expect(html).toContain('Dear John Smith,');
      expect(html).toContain('110,000.00 USD');
      expect(html).toContain('N/A'); // For missing expiry date
    });
  });
});
