import prisma from '../config/db';

export interface CreateKnowledgeItemInput {
  title: string;
  category?: string;
  content: string;
  tags?: string;
  isActive?: boolean;
  projectId?: string;
}

export interface UpdateKnowledgeItemInput {
  title?: string;
  category?: string;
  content?: string;
  tags?: string;
  isActive?: boolean;
}

export interface CreatePromptTemplateInput {
  title: string;
  description?: string;
  category?: string;
  systemRole?: string;
  promptText: string;
  variables?: Array<{ name: string; label: string; defaultValue?: string; description?: string }>;
  isCustom?: boolean;
  isFavorite?: boolean;
  tags?: string;
  targetModule?: string;
  projectId?: string;
}

export interface UpdatePromptTemplateInput {
  title?: string;
  description?: string;
  category?: string;
  systemRole?: string;
  promptText?: string;
  variables?: Array<{ name: string; label: string; defaultValue?: string; description?: string }>;
  isCustom?: boolean;
  isFavorite?: boolean;
  tags?: string;
  targetModule?: string;
}

export const CURATED_PROMPT_TEMPLATES = [
  {
    title: 'Requirement Dissection & Edge Case Hunter',
    description: 'Deconstruct complex user stories to reveal hidden ambiguities, edge cases, and missing acceptance criteria.',
    category: 'Requirement Analysis',
    systemRole: 'Senior Principal QA Architect',
    promptText: `Act as a Senior Principal QA Architect. Dissect the following requirement:

Requirement Title: {{title}}
User Story / Description:
{{userStory}}

Perform the following analysis:
1. Ambiguity & Missing Acceptance Criteria audit.
2. Boundary Value & Equivalence Partitioning conditions.
3. Edge cases involving concurrency, network latency, and session timeouts.
4. Risk prioritization score (Critical / High / Medium / Low).`,
    variablesJson: JSON.stringify([
      { name: 'title', label: 'Requirement Title', defaultValue: 'User Checkout Flow', description: 'Name of the feature or story' },
      { name: 'userStory', label: 'User Story / Spec', defaultValue: 'As a customer, I want to pay with credit card so that my order is placed.', description: 'Full description of the requirement' }
    ]),
    isCustom: false,
    isFavorite: true,
    tags: 'requirements,edge-cases,risk,analysis',
    targetModule: 'requirement-analyzer'
  },
  {
    title: 'Equivalence Partitioning & Boundary Value Matrix',
    description: 'Generate mathematical boundary value analysis and equivalence partition test vectors.',
    category: 'Test Design',
    systemRole: 'Test Design Specialist (ISTQB Advanced)',
    promptText: `Design comprehensive test scenarios using Equivalence Partitioning (EP) and Boundary Value Analysis (BVA) for:

Target Input / Field: {{fieldName}}
Valid Domain: {{validRange}}
Validation Rules: {{rules}}

Format output with:
- Valid Partitions & sample values
- Invalid Partitions & sample values
- Two-point and three-point boundary values (Min-1, Min, Min+1, Max-1, Max, Max+1)`,
    variablesJson: JSON.stringify([
      { name: 'fieldName', label: 'Field Name', defaultValue: 'Age / Quantity / Price', description: 'Input parameter under test' },
      { name: 'validRange', label: 'Valid Range', defaultValue: '1 to 100 inclusive', description: 'Allowed mathematical interval' },
      { name: 'rules', label: 'Validation Rules', defaultValue: 'Must be positive integers only.', description: 'Business constraints' }
    ]),
    isCustom: false,
    isFavorite: true,
    tags: 'test-design,bva,equivalence,scenarios',
    targetModule: 'test-design'
  },
  {
    title: 'WCAG 2.1 AA Accessibility (a11y) Smoke Audit',
    description: 'Verify accessibility conformance including ARIA roles, color contrast, keyboard navigability, and screen reader compatibility.',
    category: 'Security & Compliance',
    systemRole: 'Certified Accessibility Specialist (CPACC)',
    promptText: `Conduct a WCAG 2.1 AA Accessibility inspection for the target component:

Component: {{componentName}}
HTML / Markup:
{{htmlSnippet}}

Audit for:
1. Keyboard accessibility (Tab order, focus trapping, Escape dismiss).
2. Screen reader announcements (aria-live, role, aria-expanded).
3. Name, Role, Value computation.
4. Recommended Playwright axe-core automated assertions.`,
    variablesJson: JSON.stringify([
      { name: 'componentName', label: 'Component Name', defaultValue: 'Modal Dialog / Dropdown', description: 'UI widget under audit' },
      { name: 'htmlSnippet', label: 'HTML Markup', defaultValue: '<div class="dialog"><h2>Order Summary</h2><button>Close</button></div>', description: 'Rendered DOM structure' }
    ]),
    isCustom: false,
    isFavorite: false,
    tags: 'accessibility,wcag,a11y,compliance',
    targetModule: 'test-cases'
  },
  {
    title: 'OWASP Top 10 API Security & Auth Verification',
    description: 'Synthesize negative and penetration test cases checking for Broken Object Level Authorization (BOLA), mass assignment, and rate limiting.',
    category: 'API Testing',
    systemRole: 'Application Security Engineer & API QA Lead',
    promptText: `Generate security smoke tests for endpoint:

Endpoint: {{method}} {{path}}
Payload Schema: {{payloadSchema}}
Authentication: {{authType}}

Generate test cases addressing:
1. Broken Object Level Authorization (BOLA / IDOR): Attempt accessing resource ID of another tenant.
2. Broken Authentication: Expired tokens, missing Bearer prefix, tampered claims.
3. Mass Assignment: Injecting administrative properties (e.g., isAdmin: true, role: 'admin').
4. Rate Limiting: Burst of 100 requests in 5 seconds expecting 429 Too Many Requests.`,
    variablesJson: JSON.stringify([
      { name: 'method', label: 'HTTP Method', defaultValue: 'POST', description: 'HTTP method' },
      { name: 'path', label: 'Endpoint Path', defaultValue: '/api/v1/orders', description: 'URI route' },
      { name: 'payloadSchema', label: 'Payload Schema', defaultValue: '{ "items": [{ "id": 1, "qty": 2 }] }', description: 'JSON structure' },
      { name: 'authType', label: 'Auth Type', defaultValue: 'JWT Bearer', description: 'Token authentication mechanism' }
    ]),
    isCustom: false,
    isFavorite: true,
    tags: 'api,security,owasp,bola,idor',
    targetModule: 'api-testing'
  },
  {
    title: 'Flaky Test Post-Mortem & De-Flaking Recipe',
    description: 'Diagnose intermittent test run failures, locator race conditions, and generate resilient auto-waiting code.',
    category: 'Automation',
    systemRole: 'Senior SDET / Automation Reliability Lead',
    promptText: `Analyze intermittent test failure:

Test Title: {{testTitle}}
Framework: {{framework}}
Failure Error: {{errorMessage}}
Test Code:
{{testCode}}

Provide:
1. Root cause hypothesis of flakiness (DOM detachment, animation race, or unhandled promise).
2. Elimination of arbitrary sleep timers (waitForTimeout, Thread.sleep).
3. Resilient Playwright/Cypress auto-waiting assertions.
4. Hardened Page Object method.`,
    variablesJson: JSON.stringify([
      { name: 'testTitle', label: 'Test Title', defaultValue: 'checkout_spec - complete order', description: 'Name of the flaky test' },
      { name: 'framework', label: 'Framework', defaultValue: 'Playwright', description: 'Testing tool' },
      { name: 'errorMessage', label: 'Error Message', defaultValue: 'TimeoutError: locator.click: Timeout 30000ms exceeded', description: 'CI log error' },
      { name: 'testCode', label: 'Test Code', defaultValue: 'await page.waitForTimeout(3000);\nawait page.click(".btn-pay");', description: 'Existing implementation' }
    ]),
    isCustom: false,
    isFavorite: false,
    tags: 'flakiness,self-healing,reliability,automation',
    targetModule: 'maintenance'
  },
  {
    title: 'Gherkin BDD Feature Specification Generator',
    description: 'Transform user stories into structured Gherkin Scenario Outlines with Given/When/Then steps and Example tables.',
    category: 'Test Design',
    systemRole: 'BDD Specialist / Agile Test Lead',
    promptText: `Create executable Gherkin feature specification for:

Feature: {{featureName}}
Description: {{featureDesc}}

Write:
1. Background block for common authentication/preconditions.
2. Positive Scenario with concrete data.
3. Negative Scenario with failure outcomes.
4. Scenario Outline with Examples data table for boundary combinations.`,
    variablesJson: JSON.stringify([
      { name: 'featureName', label: 'Feature Name', defaultValue: 'Shopping Cart Discounts', description: 'Feature title' },
      { name: 'featureDesc', label: 'Feature Description', defaultValue: 'Apply coupon codes to shopping cart to receive percentage or dollar discounts.', description: 'Acceptance criteria summary' }
    ]),
    isCustom: false,
    isFavorite: true,
    tags: 'bdd,gherkin,cucumber,scenarios',
    targetModule: 'test-design'
  }
];

export const CURATED_KNOWLEDGE_ITEMS = [
  {
    title: 'Team Definition of Done (DoD) for Test Automation',
    category: 'Standards',
    content: `### Test Automation Definition of Done
1. **Zero Arbitrary Sleeps**: Never commit \`page.waitForTimeout()\` or \`Thread.sleep()\`. Use auto-waiting assertions like \`expect(locator).toBeVisible()\`.
2. **Resilient Locators**: Locator precedence must follow:
   - \`page.getByRole()\` (Accessible User-Facing)
   - \`page.getByTestId()\` (Dedicated QA contract)
   - \`page.getByLabel()\` / \`page.getByText()\`
   - Strict ban on absolute XPaths (\`/html/body/...\`) and dynamic CSS hashes.
3. **Test Data Isolation**: Tests must create their own entities or use dedicated test accounts. Never share mutating state between test runs.
4. **CI Retries**: Local test runs must achieve 100% pass rate. Max 1 retry allowed on CI pipeline.`,
    tags: 'dod,standards,automation,ci',
  },
  {
    title: 'Defect Severity & Priority Triage Matrix',
    category: 'Defect Triage',
    content: `### Defect Classification Matrix
- **Critical (Blocker)**: System crash, data corruption, security vulnerability (e.g., auth bypass, SQLi), checkout blocked. Immediate hotfix required.
- **Major**: Core workflow blocked with no workaround (e.g., invoice generation fails, search returns 500 error). Fix within sprint.
- **Moderate / Minor**: Non-critical flow defect with available workaround, UI alignment glitch, or copy/label error.
- **Priority P1 (Immediate)**: Blocker on production or blocking release gate.
- **Priority P2 (High)**: Major business impact affecting significant percentage of users.`,
    tags: 'triage,severity,bugs,matrix',
  },
  {
    title: 'REST API Testing Standards & Status Code Conventions',
    category: 'API Standards',
    content: `### API QA Guidelines
- **200 OK**: Successful GET/PUT/PATCH with response entity.
- **201 Created**: Successful POST resulting in entity persistence; must verify \`Location\` header or returned resource \`id\`.
- **204 No Content**: Successful DELETE.
- **400 Bad Request**: Invalid payload schema or validation constraint failure.
- **401 Unauthorized**: Missing or expired auth token.
- **403 Forbidden**: Valid token without permissions for target resource.
- **404 Not Found**: Entity ID not found in database.
- **409 Conflict**: Duplicate uniqueness constraint violation.
- **422 Unprocessable Entity**: Syntactically valid JSON failing business logic invariants.`,
    tags: 'api,rest,http,standards',
  },
  {
    title: 'Flaky Test Quarantine & Remediation Protocol',
    category: 'Reliability',
    content: `### Flaky Test Management
1. When a test fails intermittently in CI (>5% flake rate), move to quarantine suite (\`test.describe('@quarantine', ...)\`).
2. Log a ticket with CI trace logs, video recordings, and failure timestamps.
3. Perform root-cause inspection using Failure Intelligence to classify if App Defect vs. Automation Flaw.
4. Tests remain in quarantine for a maximum of 5 business days before resolution or removal.`,
    tags: 'flakiness,quarantine,ci,reliability',
  }
];

export const knowledgeService = {
  // Knowledge Items
  async getKnowledgeItems(projectId?: string, category?: string, search?: string) {
    const where: any = {};

    if (projectId) {
      where.OR = [{ projectId }, { projectId: null }];
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.AND = [
        {
          OR: [
            { title: { contains: q } },
            { content: { contains: q } },
            { tags: { contains: q } },
          ],
        },
      ];
    }

    const items = await prisma.knowledgeItem.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    return items;
  },

  async getKnowledgeItemById(id: string) {
    const item = await prisma.knowledgeItem.findUnique({
      where: { id },
      include: { project: { select: { id: true, name: true } } },
    });
    if (!item) throw new Error(`Knowledge item ${id} not found.`);
    return item;
  },

  async createKnowledgeItem(input: CreateKnowledgeItemInput) {
    const { title, category = 'Automation Rules', content, tags, isActive = true, projectId } = input;

    const item = await prisma.knowledgeItem.create({
      data: {
        title,
        category,
        content,
        tags: tags || null,
        isActive,
        projectId: projectId || null,
      },
      include: { project: { select: { id: true, name: true } } },
    });

    await prisma.activityLog.create({
      data: {
        action: 'KNOWLEDGE_CREATED',
        target: title,
        details: `Created knowledge item in "${category}".`,
        projectId: projectId || null,
      },
    });

    return item;
  },

  async updateKnowledgeItem(id: string, input: UpdateKnowledgeItemInput) {
    const item = await prisma.knowledgeItem.update({
      where: { id },
      data: input,
      include: { project: { select: { id: true, name: true } } },
    });

    await prisma.activityLog.create({
      data: {
        action: 'KNOWLEDGE_UPDATED',
        target: item.title,
        details: `Updated knowledge item "${item.title}".`,
        projectId: item.projectId || null,
      },
    });

    return item;
  },

  async deleteKnowledgeItem(id: string) {
    const item = await prisma.knowledgeItem.delete({
      where: { id },
    });

    await prisma.activityLog.create({
      data: {
        action: 'KNOWLEDGE_DELETED',
        target: item.title,
        details: `Deleted knowledge item "${item.title}".`,
        projectId: item.projectId || null,
      },
    });

    return { deletedId: id };
  },

  async getActiveContextRules(projectId?: string): Promise<string[]> {
    const where: any = { isActive: true };
    if (projectId) {
      where.OR = [{ projectId }, { projectId: null }];
    }

    const activeItems = await prisma.knowledgeItem.findMany({
      where,
      select: { title: true, content: true },
      take: 8,
    });

    return activeItems.map((item) => `[${item.title}]: ${item.content}`);
  },

  // Prompt Templates
  async getPromptTemplates(
    projectId?: string,
    category?: string,
    search?: string,
    favoritesOnly?: boolean
  ) {
    // Ensure curated presets are seeded
    await this.seedCuratedPrompts();

    const where: any = {};

    if (projectId) {
      where.OR = [{ projectId }, { projectId: null }];
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (favoritesOnly) {
      where.isFavorite = true;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.AND = [
        {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { promptText: { contains: q } },
            { tags: { contains: q } },
          ],
        },
      ];
    }

    const templates = await prisma.promptTemplate.findMany({
      where,
      orderBy: [{ isFavorite: 'desc' }, { updatedAt: 'desc' }],
    });

    return templates.map((t) => ({
      ...t,
      variables: JSON.parse(t.variablesJson || '[]'),
    }));
  },

  async getPromptTemplateById(id: string) {
    const template = await prisma.promptTemplate.findUnique({
      where: { id },
    });
    if (!template) throw new Error(`Prompt template ${id} not found.`);
    return {
      ...template,
      variables: JSON.parse(template.variablesJson || '[]'),
    };
  },

  async createPromptTemplate(input: CreatePromptTemplateInput) {
    const {
      title,
      description,
      category = 'Test Design',
      systemRole = 'Senior QA Engineer',
      promptText,
      variables = [],
      isCustom = true,
      isFavorite = false,
      tags,
      targetModule = 'test-cases',
      projectId,
    } = input;

    const template = await prisma.promptTemplate.create({
      data: {
        title,
        description: description || null,
        category,
        systemRole,
        promptText,
        variablesJson: JSON.stringify(variables),
        isCustom,
        isFavorite,
        tags: tags || null,
        targetModule,
        projectId: projectId || null,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'PROMPT_CREATED',
        target: title,
        details: `Created prompt template in "${category}".`,
        projectId: projectId || null,
      },
    });

    return {
      ...template,
      variables,
    };
  },

  async updatePromptTemplate(id: string, input: UpdatePromptTemplateInput) {
    const data: any = { ...input };
    if (input.variables) {
      data.variablesJson = JSON.stringify(input.variables);
      delete data.variables;
    }

    const template = await prisma.promptTemplate.update({
      where: { id },
      data,
    });

    return {
      ...template,
      variables: JSON.parse(template.variablesJson || '[]'),
    };
  },

  async deletePromptTemplate(id: string) {
    await prisma.promptTemplate.delete({
      where: { id },
    });
    return { deletedId: id };
  },

  async toggleFavorite(id: string) {
    const existing = await prisma.promptTemplate.findUnique({ where: { id } });
    if (!existing) throw new Error(`Prompt template ${id} not found.`);

    const updated = await prisma.promptTemplate.update({
      where: { id },
      data: { isFavorite: !existing.isFavorite },
    });

    return {
      ...updated,
      variables: JSON.parse(updated.variablesJson || '[]'),
    };
  },

  async seedCuratedPrompts() {
    const count = await prisma.promptTemplate.count();
    if (count === 0) {
      for (const t of CURATED_PROMPT_TEMPLATES) {
        await prisma.promptTemplate.create({
          data: t,
        });
      }
    }
  },

  async seedInitialKnowledge(projectId?: string) {
    const count = await prisma.knowledgeItem.count();
    if (count <= 1) {
      for (const k of CURATED_KNOWLEDGE_ITEMS) {
        await prisma.knowledgeItem.create({
          data: {
            ...k,
            projectId: projectId || null,
          },
        });
      }
    }
  },
};
