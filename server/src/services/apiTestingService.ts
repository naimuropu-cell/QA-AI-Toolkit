import prisma from '../config/db';
import { aiGateway } from './ai/AIGateway';
import { sanitizeSecrets } from './ai/secretScrubber';
import { AIContextPayload } from './ai/AIProvider';

export interface GenerateApiTestsInput {
  projectId: string;
  name?: string;
  endpoint: string;
  method: string;
  headers?: string;
  requestBody?: string;
  authType?: string;
  authToken?: string;
  exampleResponse?: string;
  save?: boolean;
}

export class ApiTestingService {
  async generateApiTests(input: GenerateApiTestsInput) {
    const {
      projectId,
      name,
      endpoint,
      method = 'GET',
      headers,
      requestBody,
      authType,
      authToken,
      exampleResponse,
      save = true,
    } = input;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new Error(`Project ${projectId} not found.`);

    // Sanitization: Ensure no real bearer tokens or secret keys are sent
    const sanitizedHeaders = sanitizeSecrets(headers || '');
    const sanitizedBody = sanitizeSecrets(requestBody || '');
    const sanitizedToken = authToken ? '[MASKED_CREDENTIAL]' : undefined;

    const contextPayload: AIContextPayload = {
      projectName: project.name,
      techStack: project.techStack || 'REST API',
    };

    const prompt = `Generate API Test Suite & Postman Scripts.
Endpoint: ${endpoint}
Method: ${method}
Headers: ${sanitizedHeaders || 'None'}
Auth Type: ${authType || 'None'}
Request Body: ${sanitizedBody || 'None'}
Example Response: ${exampleResponse || 'None'}

Return ONLY a valid JSON object matching:
{
  "name": "${name || `${method} ${endpoint}`}",
  "endpoint": "${endpoint}",
  "method": "${method}",
  "scenarios": [
    {
      "id": "API_POS_200",
      "name": "Scenario Title",
      "type": "Positive" | "Negative" | "Validation" | "Boundary" | "Security",
      "expectedStatus": 200,
      "description": "Validation details"
    }
  ],
  "postmanScript": "pm.test(...) scripts",
  "newmanCommand": "newman run ... command"
}`;

    const completion = await aiGateway.generate(prompt, contextPayload);

    let suiteData: any;
    try {
      const cleaned = completion.replace(/```json/g, '').replace(/```/g, '').trim();
      suiteData = JSON.parse(cleaned);
    } catch {
      suiteData = {
        name: name || `${method} ${endpoint}`,
        endpoint,
        method,
        scenarios: [
          {
            id: 'API_POS_200',
            name: `Positive Verification - ${method} ${endpoint}`,
            type: 'Positive',
            expectedStatus: method === 'POST' ? 201 : 200,
            description: 'Verify 200/201 response and valid body format on authorized request.',
          },
          {
            id: 'API_NEG_400',
            name: 'Negative Parameter Validation',
            type: 'Validation',
            expectedStatus: 400,
            description: 'Verify rejection when missing required parameters.',
          },
          {
            id: 'API_NEG_401',
            name: 'Authentication Guard',
            type: 'Security',
            expectedStatus: 401,
            description: 'Verify request rejected when authentication header is missing or expired.',
          },
        ],
        postmanScript: `pm.test("Status code is 200/201", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201]);
});
pm.test("Response time is under 1200ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(1200);
});
pm.test("Content-Type is JSON", function () {
    pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
});`,
        newmanCommand: `newman run postman_collection.json --reporters cli`,
      };
    }

    // Build Postman Collection v2.1 Object for instant download
    const postmanCollection = {
      info: {
        name: suiteData.name || `${method} ${endpoint}`,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: suiteData.name || `${method} ${endpoint}`,
          event: [
            {
              listen: 'test',
              script: {
                type: 'text/javascript',
                exec: (suiteData.postmanScript || '').split('\n'),
              },
            },
          ],
          request: {
            method: method.toUpperCase(),
            header: [
              { key: 'Content-Type', value: 'application/json' },
              ...(authType === 'Bearer' ? [{ key: 'Authorization', value: 'Bearer {{authToken}}' }] : []),
            ],
            url: {
              raw: `{{baseUrl}}${endpoint}`,
              host: ['{{baseUrl}}'],
              path: endpoint.split('/').filter(Boolean),
            },
            ...(requestBody && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())
              ? { body: { mode: 'raw', raw: requestBody } }
              : {}),
          },
        },
      ],
    };

    let savedSuite = null;
    if (save) {
      savedSuite = await prisma.apiTestSuite.create({
        data: {
          name: suiteData.name || `${method} ${endpoint}`,
          endpoint,
          method: method.toUpperCase(),
          headers: sanitizedHeaders,
          requestBody: sanitizedBody,
          testScenarios: JSON.stringify(suiteData.scenarios || []),
          postmanScript: suiteData.postmanScript || '',
          newmanCommand: suiteData.newmanCommand || '',
          projectId,
        },
      });

      await prisma.activityLog.create({
        data: {
          action: 'API_TEST_GENERATED',
          target: `${method} ${endpoint}`,
          details: `Generated API test suite with ${suiteData.scenarios?.length || 0} scenarios and Postman scripts.`,
          projectId,
        },
      });
    }

    return {
      suite: savedSuite || suiteData,
      analysis: suiteData,
      postmanCollection,
      provider: aiGateway.getActiveProvider().name,
    };
  }

  async getSuitesByProject(projectId: string) {
    return prisma.apiTestSuite.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteSuite(id: string) {
    return prisma.apiTestSuite.delete({ where: { id } });
  }
}

export const apiTestingService = new ApiTestingService();
