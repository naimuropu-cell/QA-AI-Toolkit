# System Architecture

## 1. Overview
The **Personal QA AI Toolkit** is built on a modular client-server architecture designed for reliability, strict data privacy, and extensibility across different testing frameworks and AI models.

```text
┌────────────────────────────────────────────────────────┐
│                   Frontend (React + Vite)              │
│  - Tailwind CSS / Clean QA Dark & Light Theme          │
│  - Modular Workspace (Dashboard, Projects, Generators) │
│  - State Management & Project Context Store            │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON (JWT Auth)
┌───────────────────────────▼────────────────────────────┐
│                   Backend (Express + TypeScript)       │
│  - Auth Middleware & Session Security                  │
│  - Project & Context Service                           │
│  - Codebase Scanner & AST Parser Service               │
│  - Rule & Knowledge Base Retrieval Engine              │
│  - Audit Logger & Activity Stream                      │
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
┌─────────────▼──────────────┐   ┌─────────▼─────────────┐
│    Prisma ORM (SQLite/PG)  │   │   AI Provider Gateway │
│  - Users & Projects        │   │  - OpenAI Provider    │
│  - Test Suites & Scenarios │   │  - Anthropic Provider │
│  - Knowledge Items         │   │  - Gemini Provider    │
│  - Audit & Activity Logs   │   │  - Local / Mock Engine│
└────────────────────────────┘   └───────────────────────┘
```

## 2. Component Breakdown

### Frontend (`/client`)
- **Framework**: React 18 with TypeScript and Vite for near-instant HMR and fast compilation.
- **Styling**: Tailwind CSS configured with a sleek, high-density, professional QA engineering theme (slate/neutral palettes, crisp borders, semantic badges, and clear typography).
- **Icons**: Lucide React.
- **Routing & State**: Active Project context provider, Auth state provider, and modular page views for each QA lifecycle stage.

### Backend (`/server`)
- **Framework**: Express.js with TypeScript and strict schema validation.
- **Database Layer**: Prisma ORM with SQLite for zero-setup local deployment, fully portable to PostgreSQL via simple environment configuration.
- **Security Layer**: bcryptjs password hashing, JWT token authentication, and secret sanitization on all inbound and outbound payloads.
- **Services**:
  - `ProjectService`: Manages multi-project configurations, tech stack definitions, and QA conventions.
  - `ContextService`: Prepares focused, token-efficient context packets for AI modules.
  - `AuditService`: Records auditable history of all QA activities.

### Data Storage Strategy
- Zero-config local persistence using SQLite (`prisma/dev.db`) ensures immediate portability for personal developers without requiring Docker or a running PostgreSQL daemon.
- When deploying to production or team servers, switching to PostgreSQL only requires updating the `DATABASE_URL` and Prisma provider.
