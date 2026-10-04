import { AIProvider, AIContextPayload } from './AIProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { GeminiProvider } from './GeminiProvider';
import { LocalQAProvider } from './LocalQAProvider';
import { sanitizeSecrets } from './secretScrubber';

export class AIGateway {
  private providers: AIProvider[];

  constructor() {
    this.providers = [
      new OpenAIProvider(),
      new AnthropicProvider(),
      new GeminiProvider(),
      new LocalQAProvider(),
    ];
  }

  getActiveProvider(): AIProvider {
    for (const provider of this.providers) {
      if (provider.isAvailable()) {
        return provider;
      }
    }
    return new LocalQAProvider();
  }

  async generate(prompt: string, context?: AIContextPayload): Promise<string> {
    const sanitizedPrompt = sanitizeSecrets(prompt);
    const provider = this.getActiveProvider();
    return provider.generateCompletion(sanitizedPrompt, context);
  }
}

export const aiGateway = new AIGateway();
