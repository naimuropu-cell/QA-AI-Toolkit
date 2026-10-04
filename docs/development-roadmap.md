# Development Roadmap

## Phase Overview

- [x] **Phase 1: Foundation**
  - Project architecture & monorepo structure.
  - Server (Express + TypeScript + Prisma ORM + SQLite).
  - Client (React 18 + Vite + TypeScript + Tailwind CSS).
  - Authentication (JWT + bcryptjs + session persistence).
  - Main navigation & QA Engineering Dashboard.
  - Project Management (CRUD, tech stack, testing framework).
  - Activity audit logging.
  - Documentation & Git workflow setup.

- [x] **Phase 2: Requirement Intelligence**
  - Requirement Analyzer engine with 12 structured QA analysis categories.
  - Multi-provider AI abstraction layer (OpenAI, Anthropic, Gemini, Local QA Provider).
  - Secret scrubber utility preventing credential and token leakage.
  - Functional / non-functional / risk / gap analysis breakdown.
  - Conversion pipeline: Requirements -> Database Test Scenarios.
  - Export to Markdown & JSON.

- [ ] **Phase 3: Test Design & Test Cases**
  - Equivalence partitioning & boundary value scenario generation.
  - Full test case specification (preconditions, steps, data, expected results).
  - Export utilities (CSV, Excel, JSON, Markdown).

- [ ] **Phase 4: Bug & API Testing Assistant**
  - Defect report builder with root-cause hypotheses and regression test converter.
  - API Testing Assistant supporting GET, POST, PUT, PATCH, DELETE.
  - Postman collection & Newman test generation with automatic secret masking.

- [ ] **Phase 5: Automation Generator**
  - Playwright (TypeScript/JavaScript) generator.
  - Selenium (Python/Java) generator.
  - Page Object Model synthesis with locator prioritization.

- [ ] **Phase 6: Codebase Intelligence**
  - ZIP / folder scanner with secret filter.
  - AST / static framework and locator detection.
  - Project QA Context generation for repository-native automation.

- [ ] **Phase 7: Failure Intelligence**
  - Stack trace, console log, and screenshot analysis.
  - Culpability scoring (Test issue vs. Application bug vs. Environment failure).

- [ ] **Phase 8: Automation Maintenance**
  - Test rot and duplicate test detection.
  - Brittle locator and hard-wait audit.

- [ ] **Phase 9: Knowledge Layer & Prompt Library**
  - Reusable prompt catalog with categorization and search.
  - Personal QA Knowledge Base with contextual injection.
