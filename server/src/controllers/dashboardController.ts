import { Request, Response } from 'express';
import prisma from '../config/db';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalProjects,
      requirementsAnalyzed,
      scenariosGenerated,
      testCasesGenerated,
      bugsAnalyzed,
      knowledgeBaseItems,
      recentProjects,
      recentActivities
    ] = await Promise.all([
      prisma.project.count(),
      prisma.requirementAnalysis.count(),
      prisma.testScenario.count(),
      prisma.testCase.count(),
      prisma.bugReport.count(),
      prisma.knowledgeItem.count(),
      prisma.project.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: {
              requirements: true,
              scenarios: true,
              testCases: true,
              bugs: true
            }
          }
        }
      }),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          project: {
            select: { id: true, name: true }
          }
        }
      })
    ]);

    // Derived or specific counts
    const automationGeneratedCount = await prisma.automationSuite.count();

    const apiTestsGeneratedCount = await prisma.activityLog.count({
      where: { action: { contains: 'API_TEST' } }
    });

    const failedTestsDiagnosedCount = await prisma.testFailureDiagnosis.count();

    res.json({
      metrics: {
        totalProjects,
        requirementsAnalyzed,
        scenariosGenerated,
        testCasesGenerated,
        automationGenerated: automationGeneratedCount,
        apiTestsGenerated: apiTestsGeneratedCount,
        bugsAnalyzed,
        failedTestsDiagnosed: failedTestsDiagnosedCount,
        knowledgeBaseItems
      },
      recentProjects,
      recentActivities
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch dashboard statistics' });
  }
};

export const getRecentActivities = async (req: Request, res: Response): Promise<void> => {
  try {
    const activities = await prisma.activityLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { id: true, name: true } }
      }
    });

    res.json({ activities });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch activities' });
  }
};
