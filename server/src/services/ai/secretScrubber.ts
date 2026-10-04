/**
 * Sanitizes input text to prevent accidental secret and credential leakage to external AI endpoints or logs.
 */
export const sanitizeSecrets = (text: string): string => {
  if (!text) return '';

  let sanitized = text;

  // Mask AWS / API Keys patterns
  sanitized = sanitized.replace(/(?:akias|aws_access_key_id|aws_secret_access_key)\s*[:=]\s*['"]?[A-Za-z0-9/+=]{16,}['"]?/gi, '[REDACTED_API_KEY]');
  
  // Mask Bearer tokens
  sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, 'Bearer [REDACTED_TOKEN]');

  // Mask generic secret / password key-value assignments
  sanitized = sanitized.replace(/(password|passwd|secret|api_key|apiKey|token|jwt)\s*[:=]\s*['"]?[^'"\s,;]{6,}['"]?/gi, '$1: "[REDACTED]"');

  // Mask private keys
  sanitized = sanitized.replace(/-----BEGIN [A-Z ]+PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+PRIVATE KEY-----/g, '[REDACTED_PRIVATE_KEY]');

  return sanitized;
};
