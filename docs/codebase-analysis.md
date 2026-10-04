# Codebase Analysis Workflow

## 1. Objective
Enable QA engineers to connect or upload an existing application or test repository, allowing the AI to construct a high-fidelity **Project QA Context** before generating automation or diagnosing failures.

```text
Upload Repository (ZIP / Local Directory)
                │
                ▼
┌──────────────────────────────────────────────┐
│           Security & Exclusion Filter        │
│  - Strip node_modules, .git, dist, build     │
│  - Mask .env files, certificates, secrets    │
│  - Reject binaries > 5MB                     │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│          Static AST & Heuristic Scanner      │
│  - package.json / requirements.txt / pom.xml │
│  - Playwright / Cypress / Selenium / Jest    │
│  - Directory Structure (pages/, tests/)      │
│  - Existing Page Objects & Common Fixtures   │
│  - Custom Assertions & Base Test Classes     │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│            Project QA Context Model          │
│  - Primary Language & Framework              │
│  - Locator Preferences (getByTestId, role)   │
│  - Page Object Inventory                     │
│  - Reusable Utility Index                    │
└──────────────────────────────────────────────┘
```

## 2. Repository-Native Generation
When the QA engineer requests automation for a new user story:
1. The system checks the Page Object Inventory.
2. If `LoginPage` or `CheckoutPage` already exists, it reuses existing methods.
3. If new elements are required, it proposes additive methods matching the project's exact syntax.
4. Changes are presented in a unified side-by-side diff preview for engineer approval before applying.
