# Automation Generation Workflow

## 1. Supported Frameworks & Targets

| Framework | Primary Language | Pattern | Key Capabilities |
|---|---|---|---|
| **Playwright** | TypeScript / JavaScript | Page Object Model (POM) | Modern auto-waiting, network mocking, trace capture, role-based locators. |
| **Selenium** | Python / Java | Page Object Model (POM) | Explicit waits, WebDriverManager, modular assertions, Cross-browser compatibility. |

## 2. Generation Lifecycle

1. **Input Collection**:
   - Acceptance criteria or manual test case steps.
   - Target URL, DOM snippet, or accessibility tree.
   - Selected target framework (Playwright + TypeScript prioritized).
2. **Context Enrichment**:
   - Inject repository Page Objects and base classes from active Project Context.
   - Inject team QA Knowledge Base rules (e.g. "Do not use arbitrary `page.waitForTimeout`").
3. **Synthesis**:
   - Code generation produces clean, strongly-typed files:
     - Page Object Class (`pages/TargetPage.ts`)
     - Specification Test (`tests/target.spec.ts`)
     - Fixture definition (if repository uses custom fixtures)
4. **Validation & Code Inspection**:
   - Syntax validation.
   - Code formatting and clean comments.
   - Download as individual files or ZIP archive.
