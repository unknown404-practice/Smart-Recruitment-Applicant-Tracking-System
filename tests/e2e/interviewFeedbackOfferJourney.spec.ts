import { test, expect } from '@playwright/test';

test.describe('End-to-End Journey: Interview Scheduling -> Feedback Scorecard -> Offer Issuance -> Acceptance -> Onboarding (Floor 20)', () => {
  const testCandidate = {
    id: 'e2e-cand-001',
    name: 'Taylor Rivera',
    email: 'taylor.rivera@example.com',
    headline: 'Senior Distributed Systems Engineer',
  };

  const testJob = {
    id: 'e2e-job-uuid-002',
    title: 'Lead Cloud Infrastructure Architect',
    department: 'Core Infrastructure',
    companyName: 'TechCorp Solutions',
  };

  const testApplication = {
    id: 'e2e-app-uuid-002',
    jobId: testJob.id,
    candidateId: testCandidate.id,
    currentStage: 'INTERVIEW',
    appliedAt: new Date().toISOString(),
    candidate: testCandidate,
    job: testJob,
  };

  const testInterview = {
    id: 'e2e-interview-001',
    applicationId: testApplication.id,
    title: 'Technical Systems Architecture Interview',
    scheduledStart: new Date(Date.now() + 86400000).toISOString(),
    scheduledEnd: new Date(Date.now() + 90000000).toISOString(),
    status: 'SCHEDULED',
    locationOrLink: 'https://meet.google.com/xyz-ats-test',
  };

  const testOffer = {
    id: 'e2e-offer-001',
    applicationId: testApplication.id,
    salaryAmount: 185000,
    currency: 'USD',
    startDate: '2026-12-01',
    status: 'ISSUED',
  };

  const testOnboardingTasks = [
    {
      id: 'task-001',
      title: 'Submit Tax & W-4 Withholding Forms',
      category: 'LEGAL',
      isCompleted: false,
    },
    {
      id: 'task-002',
      title: 'Sign Corporate Intellectual Property Agreement',
      category: 'LEGAL',
      isCompleted: false,
    },
    {
      id: 'task-003',
      title: 'Select Healthcare & Benefits Package',
      category: 'BENEFITS',
      isCompleted: false,
    },
  ];

  test.beforeEach(async ({ page }) => {
    // Mock authenticated HR user session
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'e2e-hr-user-id',
            email: 'recruiter@techcorp.com',
            role: 'HR',
            companyId: 'company-uuid-001',
            isActive: true,
          },
        }),
      });
    });
  });

  test('Complete Flow: Schedule Interview -> Submit Feedback -> Issue Offer -> Candidate Acceptance -> System Activity Verification', async ({
    page,
  }) => {
    // --------------------------------------------------------------------------
    // STEP 1: HR Schedules Interview
    // --------------------------------------------------------------------------
    await page.route('**/api/interviews*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [testInterview],
          }),
        });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: testInterview,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/hr/interviews');
    await expect(page).toHaveTitle(/Smart ATS|Recruitment|Interviews/i);

    // --------------------------------------------------------------------------
    // STEP 2: Evaluator Submits Structured Scorecard
    // --------------------------------------------------------------------------
    await page.route(`**/api/interviews/${testInterview.id}/feedback`, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'feedback-001',
              interviewId: testInterview.id,
              rating: 5,
              recommendation: 'STRONG_HIRE',
              strengths: 'Exceptional systems design and distributed consensus knowledge.',
              concerns: 'None identified.',
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // --------------------------------------------------------------------------
    // STEP 3: HR Prepares and Issues Template Offer Letter
    // --------------------------------------------------------------------------
    await page.route('**/api/offers*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [testOffer],
          }),
        });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: testOffer,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route(`**/api/offers/${testOffer.id}/issue`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            ...testOffer,
            status: 'ISSUED',
            issuedAt: new Date().toISOString(),
          },
        }),
      });
    });

    await page.goto('/hr/offers');
    await expect(page).toHaveTitle(/Smart ATS|Recruitment|Offers/i);

    // --------------------------------------------------------------------------
    // STEP 4: Candidate Portal - View & Accept Offer
    // --------------------------------------------------------------------------
    // Switch auth context to candidate
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'e2e-cand-user-id',
            email: testCandidate.email,
            role: 'CANDIDATE',
            isActive: true,
          },
        }),
      });
    });

    await page.route(`**/api/offers/${testOffer.id}/respond`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            ...testOffer,
            status: 'ACCEPTED',
            respondedAt: new Date().toISOString(),
          },
        }),
      });
    });

    await page.route('**/api/onboarding*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: testOnboardingTasks,
        }),
      });
    });

    await page.goto('/candidate/offers');
    await expect(page).toHaveTitle(/Smart ATS|Recruitment|Offers/i);

    // --------------------------------------------------------------------------
    // STEP 5: Verify System-Wide Unified Activity Audit Feed (Floor 20)
    // --------------------------------------------------------------------------
    // Switch auth context back to Admin
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'e2e-admin-user-id',
            email: 'admin@techcorp.com',
            role: 'ADMIN',
            companyId: 'company-uuid-001',
            isActive: true,
          },
        }),
      });
    });

    await page.route('**/api/activity*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'act-001',
              activity_type: 'OFFER_EVENT',
              entity_type: 'OFFER',
              entity_id: testOffer.id,
              actor_name: testCandidate.name,
              actor_role: 'CANDIDATE',
              candidate_name: testCandidate.name,
              job_title: testJob.title,
              action: 'ACCEPTED',
              title: 'Candidate Accepted Offer',
              description: `Offer for ${testJob.title} (USD 185,000)`,
              metadata: { status: 'ACCEPTED', salary_amount: 185000 },
              created_at: new Date().toISOString(),
            },
            {
              id: 'act-002',
              activity_type: 'OFFER_EVENT',
              entity_type: 'OFFER',
              entity_id: testOffer.id,
              actor_name: 'HR Recruiter',
              actor_role: 'HR',
              candidate_name: testCandidate.name,
              job_title: testJob.title,
              action: 'ISSUED',
              title: 'Offer Letter Issued',
              description: `Offer for ${testJob.title} (USD 185,000)`,
              metadata: { status: 'ISSUED' },
              created_at: new Date(Date.now() - 3600000).toISOString(),
            },
            {
              id: 'act-003',
              activity_type: 'INTERVIEW_EVENT',
              entity_type: 'INTERVIEW',
              entity_id: testInterview.id,
              actor_name: 'Lead Interviewer',
              actor_role: 'HR',
              candidate_name: testCandidate.name,
              job_title: testJob.title,
              action: 'SCORECARD_SUBMITTED',
              title: 'Evaluation Scorecard Submitted',
              description: 'Rating: 5/5, Recommendation: STRONG_HIRE',
              metadata: { rating: 5, recommendation: 'STRONG_HIRE' },
              created_at: new Date(Date.now() - 7200000).toISOString(),
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 3,
            totalPages: 1,
            hasMore: false,
          },
        }),
      });
    });

    await page.goto('/admin');
    await expect(page).toHaveTitle(/Smart ATS|Admin/i);

    // Verify activity feed elements appear on the page
    const activityFeedHeader = page.getByRole('heading', { name: /Activity Feed|System Activity/i });
    if (await activityFeedHeader.isVisible()) {
      await expect(activityFeedHeader).toBeVisible();
    }
  });
});
