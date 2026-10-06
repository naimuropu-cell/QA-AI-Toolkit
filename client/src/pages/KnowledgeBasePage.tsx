import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Sparkles,
  Tag,
  CheckCircle2,
  Trash2,
  Edit3,
  RefreshCw,
  FolderKanban,
  FileText,
  Sliders,
  ShieldCheck,
  Zap,
  Globe,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { Project, KnowledgeItemRecord, NavigationTab } from '../types';

interface KnowledgeBasePageProps {
  onNavigate?: (tab: NavigationTab) => void;
}

const CATEGORIES = [
  'ALL',
  'Standards',
  'Defect Triage',
  'API Standards',
  'Reliability',
  'Automation Rules',
  'Security',
];

export const KnowledgeBasePage: React.FC<KnowledgeBasePageProps> = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loadingProjects, setLoadingProjects] = useState(false);

  const [items, setItems] = useState<KnowledgeItemRecord[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItemRecord | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalCategory, setModalCategory] = useState('Standards');
  const [modalContent, setModalContent] = useState('');
  const [modalTags, setModalTags] = useState('');
  const [modalIsActive, setModalIsActive] = useState(true);
  const [modalIsGlobal, setModalIsGlobal] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadItems();
  }, [selectedProjectId, selectedCategory, searchQuery]);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const res = await api.getProjects();
      setProjects(res.projects || []);
      if (res.projects && res.projects.length > 0) {
        setSelectedProjectId(res.projects[0].id);
      }
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadItems = async () => {
    try {
      setLoadingItems(true);
      const res = await api.getKnowledgeItems({
        projectId: selectedProjectId || undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        search: searchQuery.trim() || undefined,
      });
      setItems(res.items || []);
    } catch (err) {
      console.error('Failed to load knowledge items', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setModalTitle('');
    setModalCategory('Standards');
    setModalContent('');
    setModalTags('');
    setModalIsActive(true);
    setModalIsGlobal(false);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: KnowledgeItemRecord) => {
    setEditingItem(item);
    setModalTitle(item.title);
    setModalCategory(item.category);
    setModalContent(item.content);
    setModalTags(item.tags || '');
    setModalIsActive(item.isActive);
    setModalIsGlobal(!item.projectId);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim() || !modalContent.trim()) {
      setModalError('Title and Content are required.');
      return;
    }

    try {
      setSavingItem(true);
      setModalError(null);

      const targetProjectId = modalIsGlobal ? undefined : selectedProjectId;

      if (editingItem) {
        await api.updateKnowledgeItem(editingItem.id, {
          title: modalTitle.trim(),
          category: modalCategory,
          content: modalContent.trim(),
          tags: modalTags.trim(),
          isActive: modalIsActive,
        });
      } else {
        await api.createKnowledgeItem({
          title: modalTitle.trim(),
          category: modalCategory,
          content: modalContent.trim(),
          tags: modalTags.trim(),
          isActive: modalIsActive,
          projectId: targetProjectId,
        });
      }

      setIsModalOpen(false);
      loadItems();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save knowledge item');
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this knowledge item?')) return;
    try {
      await api.deleteKnowledgeItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error('Failed to delete item', err);
    }
  };

  const handleToggleActive = async (item: KnowledgeItemRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.updateKnowledgeItem(item.id, { isActive: !item.isActive });
      setItems((prev) => prev.map((i) => (i.id === item.id ? res.item : i)));
    } catch (err) {
      console.error('Failed to toggle active state', err);
    }
  };

  const activeRulesCount = items.filter((i) => i.isActive).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/30 text-sky-400 shadow-lg shadow-sky-500/10">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                QA Knowledge Base &amp; Rules Engine
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 font-medium">
                  Phase 9
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Curate team standards, Definition of Done, and locator conventions with automatic injection into all AI generation prompts.
              </p>
            </div>
          </div>
        </div>

        {/* Project Selector & Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
            <span className="text-xs font-medium text-slate-400 pl-2">Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={loadingProjects}
              className="bg-slate-800 text-white text-xs font-medium rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-sky-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white transition shadow-lg shadow-sky-500/20"
          >
            <Plus className="w-4 h-4" />
            New Knowledge Rule
          </button>
        </div>
      </div>

      {/* Live AI Context Status Banner */}
      <div className="bg-gradient-to-r from-sky-950/40 via-slate-900/80 to-blue-950/40 border border-sky-500/20 rounded-2xl p-4 shadow-xl backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white flex items-center gap-2">
              Contextual AI Rule Injection Active
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Active rules below are dynamically prepended to AI prompts in Requirement Analyzer, Test Design, Bug Reporter, and Automation Generator.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400">Active Rules: </span>
            <strong className="text-emerald-400 font-bold">{activeRulesCount}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400">Total Items: </span>
            <strong className="text-white font-bold">{items.length}</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        {/* Categories Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-sky-500 text-white font-semibold shadow-sm shadow-sky-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rules, tags..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 placeholder-slate-500"
          />
        </div>
      </div>

      {/* Knowledge Items Grid */}
      {loadingItems ? (
        <div className="text-center py-16 text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
          Loading knowledge base items...
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`bg-slate-900/70 border rounded-2xl p-5 shadow-xl transition space-y-3 relative group backdrop-blur-sm ${
                item.isActive
                  ? 'border-slate-800 hover:border-sky-500/40'
                  : 'border-slate-800/50 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                      {item.category}
                    </span>
                    {item.projectId ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 flex items-center gap-1 border border-slate-700">
                        <FolderKanban className="w-2.5 h-2.5" />
                        Project Scope
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-950/40 text-blue-300 flex items-center gap-1 border border-blue-500/20">
                        <Globe className="w-2.5 h-2.5" />
                        Global Scope
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-sky-300 transition">
                    {item.title}
                  </h3>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Active Toggle */}
                  <button
                    onClick={(e) => handleToggleActive(item, e)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition ${
                      item.isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                    title={item.isActive ? 'Active in AI Context' : 'Inactive in AI Context'}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {item.isActive ? 'Active' : 'Muted'}
                  </button>

                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Edit Rule"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteItem(item.id, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                    title="Delete Rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Content Box */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto font-mono text-[11px]">
                {item.content}
              </div>

              {/* Tags & Timestamp Footer */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
                <div className="flex items-center gap-1 truncate max-w-[70%]">
                  {item.tags ? (
                    item.tags.split(',').map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400 text-[10px]"
                      >
                        #{tag.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-600">No tags</span>
                  )}
                </div>
                <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-white">No Knowledge Items Found</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Add team Definition of Done, bug severity matrices, or locator naming conventions to enrich AI context prompts.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-sky-500 text-white hover:bg-sky-400 transition"
          >
            Create First Knowledge Rule
          </button>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-400" />
                {editingItem ? 'Edit Knowledge Rule' : 'New Knowledge Rule'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              {/* Title & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
                  <input
                    type="text"
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    placeholder="e.g. Definition of Done (DoD)"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                  <select
                    value={modalCategory}
                    onChange={(e) => setModalCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'ALL').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags & Scope */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={modalTags}
                    onChange={(e) => setModalTags(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    placeholder="e.g. standards, pom, locators"
                  />
                </div>
                <div className="flex items-center gap-4 pt-5">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modalIsGlobal}
                      onChange={(e) => setModalIsGlobal(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-0"
                    />
                    Global (All Projects)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modalIsActive}
                      onChange={(e) => setModalIsActive(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-0"
                    />
                    Active in AI
                  </label>
                </div>
              </div>

              {/* Content Textarea */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Rule &amp; Standard Content (Markdown supported)
                </label>
                <textarea
                  value={modalContent}
                  onChange={(e) => setModalContent(e.target.value)}
                  rows={8}
                  className="w-full font-mono text-xs bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500 leading-relaxed resize-y"
                  placeholder="Enter specific QA standards, locator preferences, or verification criteria..."
                  required
                />
              </div>

              {modalError && (
                <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs">
                  {modalError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 transition"
                >
                  {savingItem ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBasePage;
