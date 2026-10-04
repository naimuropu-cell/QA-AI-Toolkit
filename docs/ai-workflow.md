# AI Workflow & Context Architecture

## 1. Context-Aware AI Design Principle
Generic AI test generation frequently fails because it lacks project context:
- It invents non-existent utility functions.
- It chooses brittle locators (e.g. XPath or raw CSS) instead of preferred conventions (e.g. `getByRole`).
- It duplicates existing Page Objects instead of reusing them.
- It ignores team test data formats and assertion patterns.

The **Personal QA AI Toolkit** enforces **Selective Context Retrieval**:

```text
User Request (e.g. "Generate Login Test")
        │
        ▼
┌──────────────────────────────────────────────┐
│          Context Retrieval Engine            │
│  - Active Project Profile (Framework, Lang)  │
│  - Existing Page Objects & Locator Patterns  │
│  - Knowledge Base Rules (Locator hierarchy)  │
│  - Test Suite Conventions (POM, fixtures)    │
│  - Sanitized Input Specs & Target ACs        │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│           AI Provider Abstraction            │
│       (OpenAI / Anthropic / Gemini / Mock)   │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│              Structured Response             │
│  - Rationale & Thought Summary               │
│  - Code / Test Cases / Bug Analysis          │
│  - References to existing reusable files     │
│  - Confidence Score                          │
└──────────────────────────────────────────────┘
```

## 2. Multi-Provider Gateway
The system decouples the application logic from any single AI vendor using a standardized provider interface:

```typescript
export interface AIProvider {
  name: string;
  generateCompletion(prompt: string, context: AIContextPayload): Promise<AICompletionResult>;
  streamCompletion?(prompt: string, context: AIContextPayload, onChunk: (text: string) => void): Promise<void>;
}
```

Supported Providers:
1. **OpenAI** (`gpt-4o`, `gpt-4o-mini`, etc.)
2. **Anthropic** (`claude-3-5-sonnet`, etc.)
3. **Google Gemini** (`gemini-1.5-pro`, `gemini-1.5-flash`, etc.)
4. **Local / Mock Provider** (Allows full offline development, regression testing, and verification without requiring active API keys)
