# Security, Privacy & Secret Management

## 1. Principles
Corporate repositories and testing environments frequently encounter sensitive credentials, API keys, tokens, and proprietary application code. The **Personal QA AI Toolkit** operates under strict data-protection principles:

1. **Zero Secret Leakage to AI Models**:
   - Automated regex scrubbing for AWS keys, GitHub tokens, Bearer tokens, passwords, and private certificates before prompts are dispatched to LLM endpoints.
2. **Local-First Boundary**:
   - Codebase analysis happens locally in the Node.js backend. Only abstracted metadata, page object signatures, and sanitized snippets are transmitted when requesting assistance.
3. **Repository Exclusion Rules**:
   - Upload scanner systematically discards files matching `.env*`, `id_rsa`, `*.pem`, `*.key`, `*.pfx`, `node_modules`, `.git`, and build folders.
4. **Secure Credential Storage**:
   - Passwords hashed using `bcryptjs` with high salt rounds.
   - JWT tokens generated with cryptographically secure signatures.
   - AI API keys stored encrypted in backend environment configuration, never exposed in client bundles.
