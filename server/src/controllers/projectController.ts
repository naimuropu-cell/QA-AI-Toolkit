import { Request, Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth';

export const getProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: {
            requirements: true,
            scenarios: true,
            testCases: true,
            bugs: true,
            knowledgeItems: true
          }
        }
      }
    });

    res.json({ projects });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch projects' });
  }
};

export const getProjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            requirements: true,
            scenarios: true,
            testCases: true,
            bugs: true,
            knowledgeItems: true
          }
        },
        requirements: { take: 5, orderBy: { createdAt: 'desc' } },
        scenarios: { take: 10, orderBy: { createdAt: 'desc' } },
        testCases: { take: 10, orderBy: { createdAt: 'desc' } },
        bugs: { take: 5, orderBy: { createdAt: 'desc' } },
        activities: { take: 10, orderBy: { createdAt: 'desc' } }
      }
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json({ project });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch project' });
  }
};

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, techStack, testFramework, qaStandards, targetUrl } = req.body;
    if (!name || name.trim() === '') {
      res.status(400).json({ error: 'Project name is required' });
      return;
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || '',
        techStack: techStack || 'TypeScript / React',
        testFramework: testFramework || 'Playwright',
        qaStandards: qaStandards || 'Page Object Model, getByRole locator strategy, no arbitrary sleeps.',
        targetUrl: targetUrl || '',
        userId: req.user?.id || null
      }
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        action: 'PROJECT_CREATED',
        target: project.name,
        details: `Created project with ${project.testFramework} framework and ${project.techStack} stack.`,
        projectId: project.id,
        userId: req.user?.id || null
      }
    });

    res.status(201).json({ message: 'Project created successfully', project });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create project' });
  }
};

export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, description, techStack, testFramework, qaStandards, targetUrl } = req.body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(techStack && { techStack }),
        ...(testFramework && { testFramework }),
        ...(qaStandards !== undefined && { qaStandards }),
        ...(targetUrl !== undefined && { targetUrl })
      }
    });

    await prisma.activityLog.create({
      data: {
        action: 'PROJECT_UPDATED',
        target: project.name,
        details: 'Updated project configuration and standards.',
        projectId: project.id,
        userId: req.user?.id || null
      }
    });

    res.json({ message: 'Project updated successfully', project });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update project' });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const project = await prisma.project.delete({ where: { id } });

    res.json({ message: 'Project deleted successfully', deletedId: id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete project' });
  }
};
