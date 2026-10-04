# Personal QA AI Toolkit

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)](https://nodejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)

A production-ready **AI-powered QA Engineering Assistant** designed to empower software quality engineers across the complete software testing lifecycle:

> **Requirement Analysis → Test Design → Test Case Generation → API Testing → Automation → Codebase Analysis → Failure Diagnosis → Maintenance → QA Knowledge Management**

---

## 1. Problem Statement
Traditional AI testing tools act merely as "prompt-to-generic-code" generators:
- They lack deep contextual awareness of existing project architectures and Page Object models.
- They generate brittle locators (e.g. raw XPath or auto-generated classes) instead of respecting project conventions (such as `getByRole` or `data-testid`).
- They duplicate existing utilities instead of integrating natively.
- They do not assist with the upstream phases of testing (analyzing ambiguities in user stories, detecting missing acceptance criteria, or synthesizing root causes from execution logs).

**Personal QA AI Toolkit** bridges this gap by acting as a true **personal QA assistant** that understands your project's technology stack, enforces your team's QA guidelines, and outputs repository-native automation.

---

## 2. Key Features

- **QA Engineering Dashboard**: Unified hub displaying real-time metrics across requirements, test cases, automated tests, bugs, and knowledge base assets, complete with a live audit trail.
- **Requirement Analyzer**: Dissects user stories into functional, non-functional, edge-case, and boundary requirements while flagging missing acceptance criteria and ambiguous statements.
- **Test Design & Test Case Generator**: Generates comprehensive test scenarios and detailed test cases with steps, data, expected results, priority, and risk ratings with instant export to CSV, JSON, and Markdown.
- **Bug Analysis & Report Generator**: Converts defect symptoms, logs, and screenshots into structured bug reports with root-cause hypotheses, and enables one-click conversion into regression test cases.
- **API Testing Assistant**: Analyzes REST contracts across GET, POST, PUT, PATCH, and DELETE endpoints; generates status validations, boundary checks, and executable Postman/Newman test scripts with automatic secret masking.
- **Automation Generator**: Synthesizes clean, strongly-typed Playwright (TypeScript/JavaScript) and Selenium (Python/Java) tests adhering strictly to the Page Object Model (POM).
- **Codebase-Aware Intelligence**: Ingests project archives or local folders to discover language, framework, existing page objects, and locator conventions for repository-native test authoring.
- **Failure Intelligence**: Performs triage on stack traces, execution logs, and screenshots to pinpoint root causes and calculate culpability (Test issue vs. Application bug vs. Environment failure).
- **Automation Maintenance**: Identifies obsolete tests, broken locators, hard-coded sleeps, and duplicate page objects with refactoring recipes.
- **QA Knowledge Base & Prompt Library**: Personal repository for team automation guidelines, locator hierarchies, and reusable prompt templates.

---

## 3. Architecture & Tech Stack

```text
QA-AI-Toolkit/
├── client/          # React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
├── server/          # Node.js, Express, TypeScript, Prisma ORM, JWT, bcryptjs
├── docs/            # Deep-dive architecture and workflow specifications
├── package.json     # Root orchestrator scripts
└── README.md
```

### Technology Matrix
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React
- **Backend**: Node.js, Express, TypeScript
- **Database**: SQLite (via Prisma ORM) for self-contained, zero-configuration local use; switchable to PostgreSQL via `DATABASE_URL`
- **Security**: JWT tokens, bcryptjs password hashing, client-side secret masking, and `.env` ignore rules

---

## 4. Getting Started & Installation

### Prerequisites
- Node.js `v20.0.0` or higher
- npm `v10.0.0` or higher
- Git

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/naimuropu-cell/QA-AI-Toolkit.git
   cd QA-AI-Toolkit
   ```

2. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

3. **Configure Environment Variables:**
   - Server: copy `server/.env.example` to `server/.env`
   ```bash
   cp server/.env.example server/.env
   ```

4. **Initialize Database (Prisma):**
   ```bash
   npm --prefix server run prisma:migrate
   ```

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   - Client will be available at: `http://localhost:5173`
   - Server API will be available at: `http://localhost:5000`

---

## 5. Environment Variables

Create `server/.env` with the following configuration:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=super_secret_qa_toolkit_jwt_key_change_in_production
DATABASE_URL="file:./dev.db"

# Optional AI Provider API Keys
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
GEMINI_API_KEY=""
```

> **Security Note**: Never commit `.env` files or API credentials to version control. The repository `.gitignore` is configured to exclude all `.env*` variants.

---

## 6. Codebase Analysis & Automation Workflow

```text
1. Select Project ➔ 2. Upload / Connect Repo ➔ 3. Automated Scan
                              │
                              ▼
4. Generate Repo-Native Automation ➔ 5. Side-by-Side Review ➔ 6. Apply / Download
```

For comprehensive documentation, see:
- [System Architecture](docs/architecture.md)
- [AI Workflow & Context Engine](docs/ai-workflow.md)
- [Codebase Analysis Workflow](docs/codebase-analysis.md)
- [Automation Generation Workflow](docs/automation-generation.md)
- [Security Guidelines](docs/security.md)
- [Development Roadmap](docs/development-roadmap.md)

---

## 7. Git & Development Workflow

This project adheres to an incremental, phase-based Git strategy:
- Every phase undergoes local build, lint, and test validation before committing.
- Conventional commits are strictly enforced (`feat:`, `fix:`, `refactor:`, `docs:`).
- Secrets and temporary files are systematically scrubbed prior to each push.

---

## 8. License
Distributed under the MIT License. See `LICENSE` for more information.
