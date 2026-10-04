import { AIProvider, AIContextPayload } from './AIProvider';

export class LocalQAProvider implements AIProvider {
  name = 'Local QA Engine';

  isAvailable(): boolean {
    return true; // Always available out of the box
  }

  async generateCompletion(prompt: string, context?: AIContextPayload): Promise<string> {
    // 0. Bug Analysis & Bug Report Generation
    if (prompt.includes('Analyze Bug and Generate Professional Defect Report')) {
      const titleMatch = prompt.match(/Title:\s*(.*?)(?:\n|$)/i);
      const modMatch = prompt.match(/Module:\s*(.*?)(?:\n|$)/i);
      const descMatch = prompt.match(/Description:\s*([\s\S]*?)(?:Steps:|$)/i);
      const errorMatch = prompt.match(/Error Logs:\s*([\s\S]*?)(?:Expected:|$)/i);
      const expectedMatch = prompt.match(/Expected:\s*([\s\S]*?)(?:Actual:|$)/i);
      const actualMatch = prompt.match(/Actual:\s*([\s\S]*?)(?:Environment:|$)/i);

      const title = titleMatch ? titleMatch[1].trim() : 'Uncaught Exception in Application Flow';
      const mod = modMatch ? modMatch[1].trim() : 'Core System';
      const desc = descMatch ? descMatch[1].trim() : 'Unexpected defect observed during test execution.';
      const logs = errorMatch ? errorMatch[1].trim() : 'N/A';
      const expected = expectedMatch ? expectedMatch[1].trim() : 'Operation should complete without error.';
      const actual = actualMatch ? actualMatch[1].trim() : 'System returned unhandled error response.';

      const report = {
        title: `[DEFECT] ${title}`,
        module: mod,
        environment: 'Staging / QA Build (Chrome 128 / Windows 11)',
        preconditions: '1. User is logged in with standard account privileges.\n2. Target application services and database connections are healthy.',
        stepsToReproduce: `1. Navigate to target module "${mod}".\n2. Perform transaction sequence leading to defect: "${desc}".\n3. Trigger action and observe execution failure.`,
        expectedResult: expected,
        actualResult: actual,
        severity: logs.includes('500') || logs.includes('Crash') || logs.includes('NullPointer') ? 'Critical' : 'Major',
        priority: 'High',
        bugType: logs.includes('Token') || logs.includes('401') ? 'Security / Auth' : 'Functional Logic',
        rootCauseHypothesis: 'Likely unhandled null/undefined reference or missing asynchronous await during state mutation before response dispatch.',
        evidence: logs !== 'N/A' ? `Console/Network Error: ${logs.slice(0, 300)}` : 'Captured network error 500 on action trigger.',
        suggestedFix: 'Implement defensive null-check guards on request payload parameters and wrap downstream database operations in try/catch block with sanitized error response.',
        regressionRisk: 'High - affects all adjacent transactional flows dependent on this shared service module.',
      };

      return JSON.stringify(report, null, 2);
    }

    // 0.1 API Test Suite & Postman Generation
    if (prompt.includes('Generate API Test Suite & Postman Scripts')) {
      const endpointMatch = prompt.match(/Endpoint:\s*(.*?)(?:\n|$)/i);
      const methodMatch = prompt.match(/Method:\s*(.*?)(?:\n|$)/i);
      const endpoint = endpointMatch ? endpointMatch[1].trim() : '/api/v1/resource';
      const method = methodMatch ? methodMatch[1].trim().toUpperCase() : 'GET';

      const suite = {
        name: `${method} ${endpoint} Test Suite`,
        endpoint,
        method,
        scenarios: [
          {
            id: 'API_POS_200',
            name: `Positive 200/201 Success - ${method} ${endpoint}`,
            type: 'Positive',
            expectedStatus: method === 'POST' ? 201 : 200,
            description: 'Verify endpoint returns expected HTTP status and compliant JSON schema on valid payload.',
          },
          {
            id: 'API_NEG_400',
            name: `Negative 400 Bad Request - Missing Parameters`,
            type: 'Validation',
            expectedStatus: 400,
            description: 'Verify endpoint rejects payload missing required attributes with clear error schema.',
          },
          {
            id: 'API_NEG_401',
            name: `Negative 401 Unauthorized - Invalid / Expired Token`,
            type: 'Security',
            expectedStatus: 401,
            description: 'Verify requests without valid Bearer authorization header are rejected.',
          },
          {
            id: 'API_BND_422',
            name: `Boundary 422 Unprocessable Entity - Payload Limits`,
            type: 'Boundary',
            expectedStatus: 422,
            description: 'Verify string length or numeric range boundaries exceed allowed limits.',
          },
        ],
        postmanScript: `// Test Status Code
pm.test("Status code is 200/201 OK", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201]);
});

// Test Response Time Under SLA
pm.test("Response time is acceptable (< 1500ms)", function () {
    pm.expect(pm.response.responseTime).to.be.below(1500);
});

// Test JSON Schema Structure
pm.test("Response has valid JSON payload", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.be.an("object");
});

// Test Content-Type Header
pm.test("Content-Type is application/json", function () {
    pm.response.to.have.header("Content-Type");
    pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
});`,
        newmanCommand: `newman run postman_collection.json --environment qa_environment.json --reporters cli,htmlextra`,
      };

      return JSON.stringify(suite, null, 2);
    }

    // 1. Scenario Generation
    if (prompt.includes('Generate comprehensive QA Test Scenarios')) {
      const modMatch = prompt.match(/Module:\s*(.*?)(?:\n|$)/i);
      const reqMatch = prompt.match(/Requirement:\s*([\s\S]*?)(?:Acceptance Criteria:|$)/i);
      const mod = modMatch ? modMatch[1].trim() : 'General';
      const req = reqMatch ? reqMatch[1].trim() : 'Module testing flow';
      const base = mod.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'MOD';

      const scenarios = [
        {
          scenarioId: `SCN_${base}_POS_01`,
          title: `Verify successful user journey for ${mod} with valid inputs`,
          type: 'Positive',
          priority: 'High',
          risk: 'Low',
        },
        {
          scenarioId: `SCN_${base}_POS_02`,
          title: `Verify optional fields acceptance and default value persistence in ${mod}`,
          type: 'Positive',
          priority: 'Medium',
          risk: 'Low',
        },
        {
          scenarioId: `SCN_${base}_NEG_01`,
          title: `Verify mandatory field validation error upon blank submission in ${mod}`,
          type: 'Negative',
          priority: 'High',
          risk: 'Medium',
        },
        {
          scenarioId: `SCN_${base}_NEG_02`,
          title: `Verify rejection of malformed or invalid syntax payload in ${mod}`,
          type: 'Negative',
          priority: 'High',
          risk: 'High',
        },
        {
          scenarioId: `SCN_${base}_BND_01`,
          title: `Verify maximum length boundary value limits on ${mod} input fields`,
          type: 'Boundary Value',
          priority: 'Medium',
          risk: 'Low',
        },
        {
          scenarioId: `SCN_${base}_SEC_01`,
          title: `Verify authorization guard and XSS/SQLi payload sanitization on ${mod}`,
          type: 'Security',
          priority: 'High',
          risk: 'High',
        },
        {
          scenarioId: `SCN_${base}_REG_01`,
          title: `Verify existing active session remains consistent after executing ${mod}`,
          type: 'Regression',
          priority: 'Medium',
          risk: 'Medium',
        },
      ];

      return JSON.stringify(scenarios, null, 2);
    }

    // 2. Test Cases Generation
    if (prompt.includes('Generate detailed, production-grade QA Test Cases')) {
      const modMatch = prompt.match(/Module:\s*(.*?)(?:\n|$)/i);
      const mod = modMatch ? modMatch[1].trim() : 'Feature';
      const prefix = mod.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'TC';

      const testCases = [
        {
          testCaseId: `TC_${prefix}_001`,
          title: `Verify Happy Path functionality for ${mod}`,
          module: mod,
          preconditions: 'User is authenticated and target page is loaded.',
          testData: 'Valid input dataset populated with standard parameters.',
          steps: '1. Navigate to target URL.\\n2. Enter all mandatory fields with valid test data.\\n3. Click Submit button.\\n4. Observe confirmation toast and updated status.',
          expectedResult: 'System processes the submission successfully and displays confirmation.',
          priority: 'High',
          severity: 'Critical',
          type: 'Functional',
        },
        {
          testCaseId: `TC_${prefix}_002`,
          title: `Verify Missing Required Parameters in ${mod}`,
          module: mod,
          preconditions: 'Target form is active.',
          testData: 'Empty strings in mandatory inputs.',
          steps: '1. Clear all required input fields.\\n2. Click Submit button.\\n3. Check client and server-side responses.',
          expectedResult: 'Form submission is halted; error highlights indicate required fields.',
          priority: 'High',
          severity: 'Major',
          type: 'Negative',
        },
        {
          testCaseId: `TC_${prefix}_003`,
          title: `Verify Input Length Upper Boundary for ${mod}`,
          module: mod,
          preconditions: 'Form input field is active and focused.',
          testData: 'String of length equal to maximum allowed + 1 character.',
          steps: '1. Paste maximum boundary string into target field.\\n2. Submit the form.\\n3. Check character truncation or validation prompt.',
          expectedResult: 'Input is trimmed to max allowed length or validation message displayed.',
          priority: 'Medium',
          severity: 'Minor',
          type: 'Boundary',
        },
        {
          testCaseId: `TC_${prefix}_004`,
          title: `Verify Injection and Input Sanitization on ${mod}`,
          module: mod,
          preconditions: 'User is on the input form.',
          testData: '<script>alert("xss")</script> and `\' OR \'1\'=\'1`',
          steps: '1. Enter malicious script payload into text inputs.\\n2. Submit form.\\n3. Verify returned response and HTML rendering.',
          expectedResult: 'Payload is encoded and rendered harmlessly without script execution.',
          priority: 'High',
          severity: 'Critical',
          type: 'Security',
        },
      ];

      return JSON.stringify(testCases, null, 2);
    }

    // 3. Expand Single Scenario to Test Case
    if (prompt.includes('Expand this single QA Test Scenario')) {
      const titleMatch = prompt.match(/Scenario Title:\s*(.*?)(?:\n|$)/i);
      const modMatch = prompt.match(/Module:\s*(.*?)(?:\n|$)/i);
      const typeMatch = prompt.match(/Type:\s*(.*?)(?:\n|$)/i);
      const scnTitle = titleMatch ? titleMatch[1].trim() : 'Test Scenario';
      const scnMod = modMatch ? modMatch[1].trim() : 'General';
      const scnType = typeMatch ? typeMatch[1].trim() : 'Functional';

      const singleTc = {
        testCaseId: `TC_${Date.now()}`,
        title: scnTitle,
        module: scnMod,
        preconditions: `Target page for module "${scnMod}" is open and application services are operational.`,
        testData: 'Standard test data aligned with test condition criteria.',
        steps: `1. Open module "${scnMod}".\\n2. Perform test action: "${scnTitle}".\\n3. Capture response status and UI element states.`,
        expectedResult: `System behaves strictly according to expectations for: ${scnTitle}`,
        priority: 'High',
        severity: 'Major',
        type: scnType,
      };

      return JSON.stringify(singleTc, null, 2);
    }

    // 4. Default: Requirement Analysis
    const titleMatch = prompt.match(/Title:\s*(.*?)(?:\n|$)/i);
    const storyMatch = prompt.match(/User Story:\s*(.*?)(?:\n|$)/i);
    const acMatch = prompt.match(/Acceptance Criteria:\s*([\s\S]*?)(?:Additional Context:|$)/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Requirement Analysis';
    const userStory = storyMatch ? storyMatch[1].trim() : 'Standard QA User Story';
    const acText = acMatch ? acMatch[1].trim() : '';

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
