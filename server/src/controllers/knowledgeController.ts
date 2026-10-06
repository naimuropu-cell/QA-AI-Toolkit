import { Request, Response } from 'express';
import { knowledgeService } from '../services/knowledgeService';

// Knowledge Items
export const getKnowledgeItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = (req.query.projectId as string) || undefined;
    const category = (req.query.category as string) || undefined;
    const search = (req.query.search as string) || undefined;

    const items = await knowledgeService.getKnowledgeItems(projectId, category, search);
    res.json({ items });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch knowledge items' });
  }
};

export const getKnowledgeItemById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const item = await knowledgeService.getKnowledgeItemById(id);
    res.json({ item });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch knowledge item' });
  }
};

export const createKnowledgeItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, category, content, tags, isActive, projectId } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: 'title and content are required.' });
      return;
    }

    const item = await knowledgeService.createKnowledgeItem({
      title,
      category,
      content,
      tags,
      isActive,
      projectId,
    });
    res.status(201).json({ item });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create knowledge item' });
  }
};

export const updateKnowledgeItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const item = await knowledgeService.updateKnowledgeItem(id, req.body);
    res.json({ item });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update knowledge item' });
  }
};

export const deleteKnowledgeItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await knowledgeService.deleteKnowledgeItem(id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete knowledge item' });
  }
};

export const getActiveRules = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = (req.query.projectId as string) || undefined;
    const rules = await knowledgeService.getActiveContextRules(projectId);
    res.json({ rules });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch active context rules' });
  }
};

// Prompt Templates
export const getPromptTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = (req.query.projectId as string) || undefined;
    const category = (req.query.category as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const favoritesOnly = req.query.favoritesOnly === 'true';

    const templates = await knowledgeService.getPromptTemplates(
      projectId,
      category,
      search,
      favoritesOnly
    );
    res.json({ templates });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch prompt templates' });
  }
};

export const getPromptTemplateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const template = await knowledgeService.getPromptTemplateById(id);
    res.json({ template });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch prompt template' });
  }
};

export const createPromptTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      category,
      systemRole,
      promptText,
      variables,
      isCustom,
      isFavorite,
      tags,
      targetModule,
      projectId,
    } = req.body;

    if (!title || !promptText) {
      res.status(400).json({ error: 'title and promptText are required.' });
      return;
    }

    const template = await knowledgeService.createPromptTemplate({
      title,
      description,
      category,
      systemRole,
      promptText,
      variables,
      isCustom,
      isFavorite,
      tags,
      targetModule,
      projectId,
    });
    res.status(201).json({ template });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create prompt template' });
  }
};

export const updatePromptTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const template = await knowledgeService.updatePromptTemplate(id, req.body);
    res.json({ template });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update prompt template' });
  }
};

export const deletePromptTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await knowledgeService.deletePromptTemplate(id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete prompt template' });
  }
};

export const toggleFavorite = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const template = await knowledgeService.toggleFavorite(id);
    res.json({ template });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to toggle prompt favorite status' });
  }
};
