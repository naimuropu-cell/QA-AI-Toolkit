import { AIProvider, AIContextPayload } from './AIProvider';

export class OpenAIProvider implements AIProvider {
  name = 'OpenAI';
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async generateCompletion(prompt: string, context?: AIContextPayload): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API key is not configured.');
    }

    const systemPrompt = `You are an expert Principal QA Automation Engineer.
Project Stack: ${context?.techStack || 'Standard'}
Test Framework: ${context?.testFramework || 'Playwright'}
QA Standards: ${context?.qaStandards || 'Page Object Model, stable locators'}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error: ${err}`);
    }

    const data = await res.json();
    return data.choices[0]?.message?.content || '';
  }
}
