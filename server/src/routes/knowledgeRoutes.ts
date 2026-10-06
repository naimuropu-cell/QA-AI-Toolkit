import { Router } from 'express';
import {
  getKnowledgeItems,
  getKnowledgeItemById,
  createKnowledgeItem,
  updateKnowledgeItem,
  deleteKnowledgeItem,
  getActiveRules,
  getPromptTemplates,
  getPromptTemplateById,
  createPromptTemplate,
  updatePromptTemplate,
  deletePromptTemplate,
  toggleFavorite,
} from '../controllers/knowledgeController';

const router = Router();

// Knowledge Items
router.get('/items', getKnowledgeItems);
router.get('/items/:id', getKnowledgeItemById);
router.post('/items', createKnowledgeItem);
router.put('/items/:id', updateKnowledgeItem);
router.delete('/items/:id', deleteKnowledgeItem);
router.get('/context-rules', getActiveRules);

// Prompt Templates
router.get('/prompts', getPromptTemplates);
router.get('/prompts/:id', getPromptTemplateById);
router.post('/prompts', createPromptTemplate);
router.put('/prompts/:id', updatePromptTemplate);
router.delete('/prompts/:id', deletePromptTemplate);
router.post('/prompts/:id/favorite', toggleFavorite);

export default router;
