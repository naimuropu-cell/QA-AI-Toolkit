export interface AIContextPayload {
  projectName?: string;
  techStack?: string;
  testFramework?: string;
  qaStandards?: string;
  targetUrl?: string;
  knowledgeRules?: string[];
  systemRole?: string;
}

export interface AIProvider {
  name: string;
  isAvailable(): boolean;
  generateCompletion(prompt: string, context?: AIContextPayload): Promise<string>;
}
