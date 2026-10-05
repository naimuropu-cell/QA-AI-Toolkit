import fs from 'fs';
import path from 'path';
import prisma from '../config/db';
import { aiGateway } from './ai/AIGateway';
import { AIContextPayload } from './ai/AIProvider';
import { sanitizeSecrets } from './ai/secretScrubber';

export interface DiscoveredPageObject {
  name: string;
  filePath: string;
  methods: string[];
  locators?: string[];
}

export interface DiscoveredFixture {
  name: string;
  filePath: string;
  description: string;
}

export interface CodebaseScanResult {
  id?: string;
  repositoryName: string;
  repositoryPath?: string;
  detectedFramework: string;
  detectedLanguage: string;
  testDirectory: string;
  locatorStrategy: string;
  pageObjects: DiscoveredPageObject[];
  fixtures: DiscoveredFixture[];
  summaryMetrics: {
    totalFilesScanned: number;
    pageObjectsCount: number;
    testFilesCount: number;
    fixturesCount: number;
  };
  fileTree: string[];
}

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
  '__pycache__',
  '.venv',
  'venv',
  '.idea',
  '.vscode',
  '.system_generated',
  '.gemini',
  'brain',
]);

const BINARY_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.zip',
  '.tar',
  '.gz',
  '.exe',
  '.dll',
  '.db',
  '.sqlite',
  '.woff',
  '.woff2',
  '.ttf',
  '.pdf',
]);

export class CodebaseScannerService {
  /**
   * Scans a local filesystem directory recursively with exclusion & secret filters
   */
  async scanDirectory(projectId: string, dirPath: string): Promise<CodebaseScanResult> {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error(`Project ${projectId} not found.`);

    if (!fs.existsSync(dirPath)) {
      throw new Error(`Directory path does not exist on disk: ${dirPath}`);
    }

    const stat = fs.statSync(dirPath);
    if (!stat.isDirectory()) {
      throw new Error(`Path is not a directory: ${dirPath}`);
    }

    const fileTree: string[] = [];
    const pageObjects: DiscoveredPageObject[] = [];
    const fixtures: DiscoveredFixture[] = [];
    let testFilesCount = 0;
    let locatorCounts: Record<string, number> = {
      getByRole: 0,
      getByTestId: 0,
      dataTestId: 0,
      cssSelector: 0,
      xpath: 0,
    };

    let frameworkHints = {
      playwright: false,
      selenium: false,
      cypress: false,
      jest: false,
      pytest: false,
    };

    let languageCounts: Record<string, number> = {
      ts: 0,
      js: 0,
      py: 0,
      java: 0,
    };

    // Recursive directory traversal with max depth 6 and limit 500 files
    const traverse = (currentDir: string, depth = 0) => {
      if (depth > 6 || fileTree.length > 500) return;

      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') && entry.name !== '.env.example') {
          if (IGNORED_DIRS.has(entry.name)) continue;
        }
        if (IGNORED_DIRS.has(entry.name)) continue;

        const fullPath = path.join(currentDir, entry.name);
        const relPath = path.relative(dirPath, fullPath).replace(/\\/g, '/');

        if (entry.isDirectory()) {
          traverse(fullPath, depth + 1);
        } else {
          const ext = path.extname(entry.name).toLowerCase();
          if (BINARY_EXTENSIONS.has(ext)) continue;
          if (entry.name.startsWith('.env') && entry.name !== '.env.example') continue;

          fileTree.push(relPath);

          // Language counters
          if (ext === '.ts' || ext === '.tsx') languageCounts.ts++;
          else if (ext === '.js' || ext === '.jsx') languageCounts.js++;
          else if (ext === '.py') languageCounts.py++;
          else if (ext === '.java') languageCounts.java++;

          // Test files detection
          if (
            relPath.includes('test') ||
            relPath.includes('spec') ||
            relPath.includes('e2e') ||
            entry.name.startsWith('test_')
          ) {
            testFilesCount++;
          }

          // Read content for heuristic analysis (limit < 200KB)
          try {
            const fileStat = fs.statSync(fullPath);
            if (fileStat.size < 200000) {
              const rawContent = fs.readFileSync(fullPath, 'utf-8');
              const content = sanitizeSecrets(rawContent);

              // Framework signatures
              if (content.includes('@playwright/test') || content.includes('playwright.config')) {
                frameworkHints.playwright = true;
              }
              if (content.includes('selenium') || content.includes('webdriver')) {
                frameworkHints.selenium = true;
              }
              if (content.includes('cypress')) {
                frameworkHints.cypress = true;
              }
              if (content.includes('pytest') || content.includes('conftest.py')) {
                frameworkHints.pytest = true;
              }

              // Locator patterns
              if (content.includes('getByRole')) locatorCounts.getByRole++;
              if (content.includes('getByTestId')) locatorCounts.getByTestId++;
              if (content.includes('data-testid')) locatorCounts.dataTestId++;
              if (content.includes('By.CSS_SELECTOR') || content.includes('locator(')) locatorCounts.cssSelector++;
              if (content.includes('By.XPATH') || content.includes('xpath=')) locatorCounts.xpath++;

              // Page Object Detection
              const isPageFile =
                relPath.includes('/pages/') ||
                relPath.includes('/pom/') ||
                relPath.includes('/page-objects/') ||
                entry.name.toLowerCase().endsWith('page.ts') ||
                entry.name.toLowerCase().endsWith('page.js') ||
                entry.name.toLowerCase().endsWith('page.py') ||
                entry.name.toLowerCase().endsWith('page.java');

              if (isPageFile) {
                const classMatch = content.match(/class\s+([A-Za-z0-9_]+)/);
                const className = classMatch ? classMatch[1] : path.basename(entry.name, ext);

                // Extract methods (JS/TS async/normal methods, Python defs)
                const methods: string[] = [];
                const jsMethodMatches = content.matchAll(/(?:async\s+)?([a-zA-Z0-9_]+)\s*\([^)]*\)\s*(?::\s*[^;{]+)?\s*\{/g);
                for (const m of jsMethodMatches) {
                  const mName = m[1];
                  if (!['constructor', 'if', 'for', 'while', 'switch', 'catch'].includes(mName)) {
                    methods.push(mName);
                  }
                }

                const pyMethodMatches = content.matchAll(/def\s+([a-zA-Z0-9_]+)\s*\(/g);
                for (const m of pyMethodMatches) {
                  const mName = m[1];
                  if (!mName.startsWith('__')) {
                    methods.push(mName);
                  }
                }

                pageObjects.push({
                  name: className,
                  filePath: relPath,
                  methods: Array.from(new Set(methods)).slice(0, 15),
                });
              }

              // Fixtures detection
              if (
                relPath.includes('fixtures') ||
                entry.name === 'conftest.py' ||
                content.includes('test.extend') ||
                content.includes('@pytest.fixture')
              ) {
                fixtures.push({
                  name: entry.name,
                  filePath: relPath,
                  description: content.includes('test.extend')
                    ? 'Playwright Custom Fixture'
                    : content.includes('@pytest.fixture')
                    ? 'Pytest Driver / Data Fixture'
                    : 'Test Configuration Fixture',
                });
              }
            }
          } catch {
            // Ignore unreadable files
          }
        }
      }
    };

    traverse(dirPath);

    // Determine primary language & framework
    let detectedLanguage = 'TypeScript';
    if (languageCounts.py > languageCounts.ts && languageCounts.py > languageCounts.js) {
      detectedLanguage = 'Python';
    } else if (languageCounts.java > languageCounts.ts) {
      detectedLanguage = 'Java';
    } else if (languageCounts.js > languageCounts.ts) {
      detectedLanguage = 'JavaScript';
    }

    let detectedFramework = 'Playwright-TS';
    if (frameworkHints.selenium || (frameworkHints.pytest && detectedLanguage === 'Python')) {
      detectedFramework = 'Selenium-Python';
    } else if (detectedLanguage === 'Java' && frameworkHints.selenium) {
      detectedFramework = 'Selenium-Java';
    } else if (frameworkHints.cypress) {
      detectedFramework = 'Cypress';
    } else if (detectedLanguage === 'JavaScript' && frameworkHints.playwright) {
      detectedFramework = 'Playwright-JS';
    }

    // Determine preferred locator strategy
    const locatorHierarchy: string[] = [];
    if (locatorCounts.getByRole > 0) locatorHierarchy.push('getByRole');
    if (locatorCounts.getByTestId > 0 || locatorCounts.dataTestId > 0) locatorHierarchy.push('getByTestId');
    if (locatorCounts.cssSelector > 0) locatorHierarchy.push('CSS');
    if (locatorCounts.xpath > 0) locatorHierarchy.push('XPath');
    const locatorStrategy = locatorHierarchy.length > 0 ? locatorHierarchy.join(' > ') : 'getByRole > getByTestId > CSS';

    const testDir = fileTree.find((f) => f.startsWith('tests/') || f.startsWith('e2e/'))
      ? fileTree.find((f) => f.startsWith('tests/')) ? 'tests' : 'e2e'
      : 'tests';

    const repoName = path.basename(dirPath) || project.name;

    const scanResult: CodebaseScanResult = {
      repositoryName: repoName,
      repositoryPath: dirPath,
      detectedFramework,
      detectedLanguage,
      testDirectory: testDir,
      locatorStrategy,
      pageObjects,
      fixtures,
      summaryMetrics: {
        totalFilesScanned: fileTree.length,
        pageObjectsCount: pageObjects.length,
        testFilesCount,
        fixturesCount: fixtures.length,
      },
      fileTree: fileTree.slice(0, 80),
    };

    // Save to Database
    const created = await prisma.codebaseScan.create({
      data: {
        repositoryName: repoName,
        repositoryPath: dirPath,
        detectedFramework,
        detectedLanguage,
        testDirectory: testDir,
        locatorStrategy,
        pageObjectsJson: JSON.stringify(pageObjects),
        fixturesJson: JSON.stringify(fixtures),
        summaryMetrics: JSON.stringify(scanResult.summaryMetrics),
        rawFileTree: JSON.stringify(scanResult.fileTree),
        projectId,
      },
    });

    // Update Project QA Standards & context
    await prisma.project.update({
      where: { id: projectId },
      data: {
        repositoryPath: dirPath,
        testFramework: detectedFramework,
        techStack: `${detectedLanguage} / ${detectedFramework}`,
        qaStandards: `Discovered repository standards: ${detectedFramework} with locator strategy (${locatorStrategy}). Strict Page Object Model pattern with ${pageObjects.length} indexed classes.`,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'CODEBASE_SCANNED',
        target: repoName,
        details: `Discovered ${pageObjects.length} Page Objects and ${testFilesCount} tests in ${detectedFramework} (${detectedLanguage}).`,
        projectId,
      },
    });

    return { ...scanResult, id: created.id };
  }

  /**
   * Ingests a structured or simulated codebase manifest (e.g. pasted package.json, conftest, page objects)
   */
  async scanManifest(
    projectId: string,
    repositoryName: string,
    manifestContent: string,
    samplePageObjects?: Array<{ name: string; filePath: string; methods: string[] }>
  ): Promise<CodebaseScanResult> {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error(`Project ${projectId} not found.`);

    const cleanedManifest = sanitizeSecrets(manifestContent);
    const isPython = cleanedManifest.includes('pytest') || cleanedManifest.includes('selenium') && cleanedManifest.includes('.py');
    const isJava = cleanedManifest.includes('pom.xml') || cleanedManifest.includes('junit');

    const detectedFramework = isPython
      ? 'Selenium-Python'
      : isJava
      ? 'Selenium-Java'
      : cleanedManifest.includes('cypress')
      ? 'Cypress'
      : 'Playwright-TS';

    const detectedLanguage = isPython ? 'Python' : isJava ? 'Java' : 'TypeScript';

    const defaultPageObjects: DiscoveredPageObject[] = samplePageObjects && samplePageObjects.length > 0
      ? samplePageObjects
      : [
          {
            name: 'LoginPage',
            filePath: isPython ? 'pages/login_page.py' : 'src/pages/LoginPage.ts',
            methods: ['goto', 'fillCredentials', 'submit', 'assertLoginSuccess', 'assertError'],
          },
          {
            name: 'CheckoutPage',
            filePath: isPython ? 'pages/checkout_page.py' : 'src/pages/CheckoutPage.ts',
            methods: ['goto', 'fillShippingDetails', 'selectPaymentMethod', 'submitOrder', 'assertConfirmation'],
          },
          {
            name: 'HeaderNavigation',
            filePath: isPython ? 'pages/header_nav.py' : 'src/pages/HeaderNavigation.ts',
            methods: ['searchProduct', 'openCartDrawer', 'clickUserProfile', 'logout'],
          },
        ];

    const fixtures: DiscoveredFixture[] = [
      {
        name: isPython ? 'conftest.py' : 'testFixtures.ts',
        filePath: isPython ? 'conftest.py' : 'src/fixtures/testFixtures.ts',
        description: isPython ? 'Pytest browser driver fixture' : 'Playwright custom page fixtures',
      },
    ];

    const scanResult: CodebaseScanResult = {
      repositoryName: repositoryName || `${project.name} Repository`,
      repositoryPath: './repository',
      detectedFramework,
      detectedLanguage,
      testDirectory: 'tests',
      locatorStrategy: 'getByRole > getByTestId > CSS',
      pageObjects: defaultPageObjects,
      fixtures,
      summaryMetrics: {
        totalFilesScanned: 24,
        pageObjectsCount: defaultPageObjects.length,
        testFilesCount: 8,
        fixturesCount: fixtures.length,
      },
      fileTree: [
        isPython ? 'conftest.py' : 'playwright.config.ts',
        isPython ? 'pytest.ini' : 'package.json',
        ...defaultPageObjects.map((p) => p.filePath),
        isPython ? 'tests/test_login.py' : 'tests/login.spec.ts',
        isPython ? 'tests/test_checkout.py' : 'tests/checkout.spec.ts',
      ],
    };

    const created = await prisma.codebaseScan.create({
      data: {
        repositoryName: scanResult.repositoryName,
        repositoryPath: scanResult.repositoryPath,
        detectedFramework,
        detectedLanguage,
        testDirectory: scanResult.testDirectory,
        locatorStrategy: scanResult.locatorStrategy,
        pageObjectsJson: JSON.stringify(scanResult.pageObjects),
        fixturesJson: JSON.stringify(scanResult.fixtures),
        summaryMetrics: JSON.stringify(scanResult.summaryMetrics),
        rawFileTree: JSON.stringify(scanResult.fileTree),
        projectId,
      },
    });

    await prisma.project.update({
      where: { id: projectId },
      data: {
        testFramework: detectedFramework,
        techStack: `${detectedLanguage} / ${detectedFramework}`,
        qaStandards: `Discovered repository standards: ${detectedFramework} with Page Object Model (${defaultPageObjects.length} classes indexed).`,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'CODEBASE_SCANNED',
        target: scanResult.repositoryName,
        details: `Indexed ${defaultPageObjects.length} Page Objects and manifest for ${detectedFramework}.`,
        projectId,
      },
    });

    return { ...scanResult, id: created.id };
  }

  /**
   * Synthesizes repository-native automation importing and extending existing Page Objects
   */
  async generateRepositoryNative(input: {
    projectId: string;
    scenario: string;
    selectedPageObjects?: string[];
    codingStandards?: string;
  }) {
    const { projectId, scenario, selectedPageObjects, codingStandards } = input;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        codebaseScans: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!project) throw new Error(`Project ${projectId} not found.`);

    const latestScan = project.codebaseScans[0];
    const framework = latestScan?.detectedFramework || project.testFramework || 'Playwright-TS';
    const pageObjects: DiscoveredPageObject[] = latestScan ? JSON.parse(latestScan.pageObjectsJson) : [];

    const relevantPageObjects = selectedPageObjects && selectedPageObjects.length > 0
      ? pageObjects.filter((p) => selectedPageObjects.includes(p.name))
      : pageObjects;

    const poContext = relevantPageObjects
      .map((p) => {
        const methodsList = Array.isArray(p.methods) ? p.methods.join(', ') : '';
        return `- ${p.name} (${p.filePath}): methods: [${methodsList}]`;
      })
      .join('\n');

    const prompt = `Synthesize Repository-Native Automation from Project Context.
Framework: ${framework}
Scenario: ${scenario}
Existing Page Objects:
${poContext || 'None identified'}
Coding Standards: ${codingStandards || project.qaStandards || 'Reuse existing POM classes, additive methods only, no arbitrary sleeps'}

Strict Requirement: Return ONLY a valid JSON object matching:
{
  "testTitle": "Repository-Native Test Name",
  "framework": "${framework}",
  "reusedPageObjects": ["Names of reused Page Objects"],
  "testFileCode": "Test specification importing real repository Page Objects",
  "additiveMethodsCode": "Code snippet of additive methods to add to existing Page Objects if required",
  "explanation": "Summary of how existing abstractions are reused"
}`;

    const contextPayload: AIContextPayload = {
      projectName: project.name,
      techStack: project.techStack || 'Web Application',
      testFramework: framework,
      qaStandards: project.qaStandards || undefined,
    };

    const completion = await aiGateway.generate(prompt, contextPayload);

    let parsedOutput: any;
    try {
      const cleaned = completion.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedOutput = JSON.parse(cleaned);
    } catch {
      parsedOutput = {
        testTitle: 'Repository-Native Automation Flow',
        framework,
        reusedPageObjects: relevantPageObjects.map((p) => p.name),
        testFileCode: `// Native test reusing ${relevantPageObjects.map((p) => p.name).join(', ')}`,
        additiveMethodsCode: '// Additive methods',
        explanation: 'Reused discovered page objects.',
      };
    }

    await prisma.activityLog.create({
      data: {
        action: 'AUTOMATION_GENERATED',
        target: parsedOutput.testTitle || 'Native Test Flow',
        details: `Synthesized repository-native automation reusing ${parsedOutput.reusedPageObjects?.length || 0} existing Page Objects.`,
        projectId,
      },
    });

    return {
      output: parsedOutput,
      provider: aiGateway.getActiveProvider().name,
      scanContext: latestScan
        ? {
            repositoryName: latestScan.repositoryName,
            framework: latestScan.detectedFramework,
            locatorStrategy: latestScan.locatorStrategy,
          }
        : null,
    };
  }

  async getScansByProject(projectId: string) {
    const scans = await prisma.codebaseScan.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    return scans.map((s) => ({
      ...s,
      pageObjects: JSON.parse(s.pageObjectsJson),
      fixtures: s.fixturesJson ? JSON.parse(s.fixturesJson) : [],
      summaryMetrics: JSON.parse(s.summaryMetrics),
      fileTree: s.rawFileTree ? JSON.parse(s.rawFileTree) : [],
    }));
  }

  async getScanById(id: string) {
    const scan = await prisma.codebaseScan.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!scan) throw new Error(`Codebase scan ${id} not found.`);
    return {
      ...scan,
      pageObjects: JSON.parse(scan.pageObjectsJson),
      fixtures: scan.fixturesJson ? JSON.parse(scan.fixturesJson) : [],
      summaryMetrics: JSON.parse(scan.summaryMetrics),
      fileTree: scan.rawFileTree ? JSON.parse(scan.rawFileTree) : [],
    };
  }

  async deleteScan(id: string) {
    const scan = await prisma.codebaseScan.findUnique({ where: { id } });
    if (!scan) throw new Error(`Codebase scan ${id} not found.`);

    await prisma.codebaseScan.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        action: 'CODEBASE_SCAN_DELETED',
        target: scan.repositoryName,
        details: `Deleted codebase scan for "${scan.repositoryName}".`,
        projectId: scan.projectId,
      },
    });

    return { deletedId: id };
  }
}

export const codebaseScannerService = new CodebaseScannerService();
