import { AIProvider, AIContextPayload } from './AIProvider';

export class AnthropicProvider implements AIProvider {
  name = 'Anthropic';
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async generateCompletion(prompt: string, context?: AIContextPayload): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('Anthropic API key is not configured.');
    }

    const systemPrompt = `You are a Principal QA Automation Engineer.
Target Stack: ${context?.techStack || 'Web'}
Testing Framework: ${context?.testFramework || 'Playwright'}`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error: ${err}`);
    }

    const data = await res.json();
    return data.content[0]?.text || '';
  }
}
