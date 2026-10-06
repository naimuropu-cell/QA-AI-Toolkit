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

- [x] **Phase 3: Test Design & Test Cases**
  - Scenario Generator supporting Positive, Negative, Boundary, Equivalence, Security, and Regression tests.
  - Scenario-to-TestCase automatic expansion engine.
  - Full test case specification manager (preconditions, test data, step-by-step actions, expected results, priority, severity).
  - Multi-format test export engine (CSV, Excel HTML table, JSON, Markdown specification).


- [x] **Phase 4: Bug & API Testing Assistant**
  - Defect report builder with environment, steps, actual/expected, root-cause hypotheses, and suggested fixes.
  - Bug-to-Regression Test Case automatic conversion engine.
  - API Testing Assistant supporting GET, POST, PUT, PATCH, DELETE endpoints.
  - Postman Collection JSON (v2.1) export & Newman CLI command generator with automated secret masking.


- [x] **Phase 5: Automation Generator**
  - Playwright (TypeScript & JavaScript) Page Object Model and test generator.
  - Selenium (Python & Java) Page Object Model and test generator.
  - Test fixtures, test data synthesis, and multi-file project ZIP export.

- [x] **Phase 6: Codebase Intelligence & Native Automation**
  - Local repository folder scanner & ZIP archive analyzer with secret exclusion.
  - Project structure scanner detecting framework, page objects, and locator conventions.
  - Repository-native automation synthesis adhering strictly to existing codebase conventions.

- [x] **Phase 7: Failure Intelligence & Root Cause Engine**
  - Stack trace, console log, and error message triage.
  - Tri-factor culpability calculation (Application Defect vs. Test Automation Flaw vs. Environment Issue).
  - 1-Click conversion to Bug Report and Regression Test Case with resilient test stubs.

- [x] **Phase 8: Automation Maintenance & Self-Healing Engine**
  - Test suite code smell auditor (hardcoded sleeps, brittle locators, async race conditions).
  - Maintainability health score (0-100) and automated script refactoring.
  - Self-healing locator studio with accessibility role, testId, and resilience percentage scoring.

- [x] **Phase 9: Knowledge Layer & Curated Prompt Library**
  - Curated QA prompt catalog across requirements, test design, API testing, security, and accessibility.
  - Dynamic prompt variable interpolator with 1-click test execution and target module launching.
  - Personal QA Knowledge Base with active contextual rule injection into all AI generation prompts.
