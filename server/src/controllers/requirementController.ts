import { Request, Response } from 'express';
import { requirementService } from '../services/requirementService';
import prisma from '../config/db';

export const analyzeRequirement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, title, userStory, acceptanceCriteria, additionalContext, save } = req.body;

    if (!projectId || !title || !userStory) {
      res.status(400).json({ error: 'projectId, title, and userStory are required fields.' });
      return;
    }

    const result = await requirementService.analyzeRequirement({
      projectId,
      title,
      userStory,
      acceptanceCriteria,
      additionalContext,
      save: save !== undefined ? save : true,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Requirement analysis failed.' });
  }
};

export const getRequirementsByProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.projectId as string;
    const requirements = await prisma.requirementAnalysis.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ requirements });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch requirements.' });
  }
};

export const getRequirementById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const requirement = await prisma.requirementAnalysis.findUnique({
      where: { id },
    });

    if (!requirement) {
      res.status(404).json({ error: 'Requirement analysis not found.' });
      return;
    }

    res.json({
      requirement,
      analysis: JSON.parse(requirement.analysisJson),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch requirement.' });
  }
};

export const convertRequirementToScenarios = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await requirementService.convertToScenarios(id);
    res.json({ message: 'Scenarios converted and saved successfully.', ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to convert scenarios.' });
  }
};

export const deleteRequirement = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await prisma.requirementAnalysis.delete({ where: { id } });
    res.json({ message: 'Requirement deleted successfully.', deletedId: id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete requirement.' });
  }
};
