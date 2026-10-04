import { AIProvider, AIContextPayload } from './AIProvider';

export class LocalQAProvider implements AIProvider {
  name = 'Local QA Engine';

  isAvailable(): boolean {
    return true; // Always available out of the box
  }

  async generateCompletion(prompt: string, context?: AIContextPayload): Promise<string> {
    // If prompt requests JSON requirement analysis:
    const titleMatch = prompt.match(/Title:\s*(.*?)(?:\n|$)/i);
    const storyMatch = prompt.match(/User Story:\s*(.*?)(?:\n|$)/i);
    const acMatch = prompt.match(/Acceptance Criteria:\s*([\s\S]*?)(?:Additional Context:|$)/i);
    const contextMatch = prompt.match(/Additional Context:\s*([\s\S]*?)(?:$)/i);

    const title = titleMatch ? titleMatch[1].trim() : 'Requirement Analysis';
    const userStory = storyMatch ? storyMatch[1].trim() : 'Standard QA User Story';
    const acText = acMatch ? acMatch[1].trim() : '';
    const additional = contextMatch ? contextMatch[1].trim() : '';

    const acLines = acText
      .split('\n')
      .map((l) => l.trim().replace(/^[-*•\d.]\s*/, ''))
      .filter((l) => l.length > 0);

    const analysis = {
      summary: `Automated QA Analysis for: ${title}`,
      frameworkTarget: context?.testFramework || 'Playwright',
      functionalRequirements: [
        `Core User Flow: Ensure the system allows user to complete the primary objective described in '${userStory}'.`,
        ...acLines.map((ac, idx) => `Functional Rule ${idx + 1}: System must adhere to criteria: "${ac}"`),
        'Input Validation: Verify all client and server-side mandatory field checks and type constraints.',
        'State Mutation: Confirm persistence and proper status transitions upon transaction completion.',
      ],
      nonFunctionalRequirements: [
        'Performance & Latency: Response time should not exceed 2.0s under standard peak concurrency.',
        'Security & Data Protection: Sanitize all inputs to prevent SQL Injection, XSS, and CSRF; mask confidential tokens.',
        'Accessibility: Ensure UI elements comply with WCAG 2.1 AA standards and support keyboard navigation.',
        'Resilience & Fault Tolerance: System should gracefully handle network timeouts or downstream service degradation.',
      ],
      missingRequirements: [
        'Concurrency behavior: What happens if multiple users perform this action on the same entity simultaneously?',
        'Session expiry handling: Behavior when user authorization token expires mid-transaction.',
        'Audit logging requirements: Should administrative changes or financial mutations be captured in an immutable audit trail?',
      ],
      ambiguousStatements: [
        'Vague error messaging: Requirement does not explicitly define localized user-facing copy for edge-case errors.',
        'Undefined throttling rates: No specification of rate limits for repeated rapid submissions.',
      ],
      acceptanceCriteriaGaps: [
        'Negative test data constraints (e.g. boundary length, unsupported special characters).',
        'Mobile responsive viewport expectations and touch interaction fidelity.',
      ],
      positiveScenarios: [
        {
          id: 'SCN_POS_001',
          title: `Successful happy path execution of ${title}`,
          type: 'Positive',
          priority: 'High',
          risk: 'Low',
        },
        {
          id: 'SCN_POS_002',
          title: 'Validation of default values and optional parameter acceptance',
          type: 'Positive',
          priority: 'Medium',
          risk: 'Low',
        },
      ],
      negativeScenarios: [
        {
          id: 'SCN_NEG_001',
          title: 'Submission with missing required parameters triggers inline validation',
          type: 'Negative',
          priority: 'High',
          risk: 'Medium',
        },
        {
          id: 'SCN_NEG_002',
          title: 'Malformed data payload or unauthorized token returns 401/403 status',
          type: 'Negative',
          priority: 'High',
          risk: 'High',
        },
      ],
      edgeCases: [
        {
          id: 'SCN_EDGE_001',
          title: 'Rapid double-clicking submit button should prevent duplicate record creation',
          type: 'Edge Case',
          priority: 'High',
          risk: 'High',
        },
        {
          id: 'SCN_EDGE_002',
          title: 'Network interruption during payload transmission triggers retry without corruption',
          type: 'Edge Case',
          priority: 'Medium',
          risk: 'Medium',
        },
      ],
      boundaryConditions: [
        {
          id: 'SCN_BND_001',
          title: 'Test maximum allowed character length on input fields (Upper Boundary)',
          type: 'Boundary Value',
          priority: 'Medium',
          risk: 'Low',
        },
        {
          id: 'SCN_BND_002',
          title: 'Test zero / empty string input values (Lower Boundary)',
          type: 'Boundary Value',
          priority: 'Medium',
          risk: 'Low',
        },
      ],
      qaClarificationQuestions: [
        'Is there a specific timeout duration after which an in-progress request should be aborted?',
        'Are there specific third-party integration webhooks that require mock servers during automated test execution?',
        'What are the exact roles or permission levels permitted to execute this action in production?',
      ],
      potentialRisks: [
        'Race conditions during concurrent resource allocation.',
        'Data inconsistency between frontend optimistic state and backend database commit.',
        'Uncaught unhandled exceptions resulting in uncaught 500 server crashes.',
      ],
      suggestedTestCoverage: [
        'Unit Test: Business logic validators and entity model constraints.',
        'API Integration: Contract tests verifying request/response schema and status codes.',
        'End-to-End Automation: Critical user journey covered with Playwright Page Object Model.',
        'Security Smoke: Penetration check for header sanitation and authorization boundary bypassing.',
      ],
    };

    return JSON.stringify(analysis, null, 2);
  }
}
