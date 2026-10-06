import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Star,
  Copy,
  Check,
  Plus,
  Play,
  ArrowRight,
  Trash2,
  Edit3,
  RefreshCw,
  FolderKanban,
  Sliders,
  Send,
  Code2,
  Tag,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';
import { PromptTemplateRecord, PromptVariable, NavigationTab, Project } from '../types';

interface PromptLibraryPageProps {
  onNavigate?: (tab: NavigationTab) => void;
}

const CATEGORIES = [
  'ALL',
  'Requirement Analysis',
  'Test Design',
  'API Testing',
  'Security & Compliance',
  'Automation',
];

export const PromptLibraryPage: React.FC<PromptLibraryPageProps> = ({ onNavigate }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [templates, setTemplates] = useState<PromptTemplateRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Interpolator / Runner Modal
  const [activeTemplate, setActiveTemplate] = useState<PromptTemplateRecord | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  // Create / Edit Modal
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplateRecord | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('Test Design');
  const [formRole, setFormRole] = useState('Senior QA Engineer');
  const [formPrompt, setFormPrompt] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formTargetModule, setFormTargetModule] = useState('test-cases');
  const [editorError, setEditorError] = useState<string | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [selectedProjectId, selectedCategory, favoritesOnly, searchQuery]);

  const loadProjects = async () => {
    try {
      const res = await api.getProjects();
      setProjects(res.projects || []);
      if (res.projects && res.projects.length > 0) {
        setSelectedProjectId(res.projects[0].id);
      }
    } catch (err) {
      console.error('Failed to load projects', err);
    }
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.getPromptTemplates({
        projectId: selectedProjectId || undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        search: searchQuery.trim() || undefined,
        favoritesOnly,
      });
      setTemplates(res.templates || []);
    } catch (err) {
      console.error('Failed to load prompt templates', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (t: PromptTemplateRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.togglePromptFavorite(t.id);
      setTemplates((prev) => prev.map((item) => (item.id === t.id ? res.template : item)));
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  const handleOpenRunner = (template: PromptTemplateRecord) => {
    setActiveTemplate(template);
    // Initialize default values for variables
    const defaults: Record<string, string> = {};
    if (template.variables) {
      template.variables.forEach((v) => {
        defaults[v.name] = v.defaultValue || '';
      });
    }
    setVariableValues(defaults);
  };

  const getResolvedPrompt = (template: PromptTemplateRecord): string => {
    let resolved = template.promptText;
    Object.entries(variableValues).forEach(([k, v]) => {
      const regex = new RegExp(`{{${k}}}`, 'g');
      resolved = resolved.replace(regex, v || `[${k}]`);
    });
    return resolved;
  };

  const handleCopyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  const handleLaunchModule = (template: PromptTemplateRecord) => {
    if (onNavigate && template.targetModule) {
      onNavigate(template.targetModule as NavigationTab);
    }
  };

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormTitle('');
    setFormDesc('');
    setFormCategory('Test Design');
    setFormRole('Senior QA Engineer');
    setFormPrompt('Act as a Senior QA Engineer. Perform the following testing:\n\nTarget: {{targetName}}');
    setFormTags('custom,test-design');
    setFormTargetModule('test-cases');
    setEditorError(null);
    setIsEditorOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formPrompt.trim()) {
      setEditorError('Title and Prompt Text are required.');
      return;
    }

    try {
      setSavingTemplate(true);
      setEditorError(null);

      // Auto-extract {{variables}}
      const varMatches = formPrompt.match(/{{([a-zA-Z0-9_]+)}}/g) || [];
      const extractedVars: PromptVariable[] = Array.from(new Set(varMatches)).map((match) => {
        const name = match.replace(/{{|}}/g, '');
        return {
          name,
          label: name.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
          defaultValue: '',
        };
      });

      if (editingTemplate) {
        await api.updatePromptTemplate(editingTemplate.id, {
          title: formTitle.trim(),
          description: formDesc.trim(),
          category: formCategory,
          systemRole: formRole.trim(),
          promptText: formPrompt.trim(),
          variables: extractedVars,
          tags: formTags.trim(),
          targetModule: formTargetModule,
        });
      } else {
        await api.createPromptTemplate({
          title: formTitle.trim(),
          description: formDesc.trim(),
          category: formCategory,
          systemRole: formRole.trim(),
          promptText: formPrompt.trim(),
          variables: extractedVars,
          tags: formTags.trim(),
          targetModule: formTargetModule,
          isCustom: true,
          projectId: selectedProjectId || undefined,
        });
      }

      setIsEditorOpen(false);
      loadTemplates();
    } catch (err: any) {
      setEditorError(err.message || 'Failed to save prompt template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this prompt template?')) return;
    try {
      await api.deletePromptTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      if (activeTemplate?.id === id) setActiveTemplate(null);
    } catch (err) {
      console.error('Failed to delete template', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-400 shadow-lg shadow-purple-500/10">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Curated QA Prompt Library
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 font-medium">
                  Phase 9
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Reusable, battle-tested QA prompts with dynamic variable interpolation and direct module execution.
              </p>
            </div>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white transition shadow-lg shadow-purple-500/20"
          >
            <Plus className="w-4 h-4" />
            New Prompt Template
          </button>
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
                  ? 'bg-purple-500 text-white font-semibold shadow-sm shadow-purple-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Favorites Filter */}
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition shrink-0 ${
              favoritesOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
            Favorites
          </button>

          {/* Search */}
          <div className="relative w-full md:w-60 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompt catalog..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 placeholder-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Prompts Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
          Loading curated QA prompts...
        </div>
      ) : templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => handleOpenRunner(tpl)}
              className="bg-slate-900/70 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-5 shadow-xl transition space-y-3 cursor-pointer group flex flex-col justify-between backdrop-blur-sm"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    {tpl.category}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleToggleFavorite(tpl, e)}
                      className="p-1 rounded-lg text-slate-500 hover:text-amber-400 transition"
                      title={tpl.isFavorite ? 'Unfavorite' : 'Add to Favorites'}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          tpl.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                        }`}
                      />
                    </button>

                    {tpl.isCustom && (
                      <button
                        onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition"
                        title="Delete custom template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition">
                  {tpl.title}
                </h3>

                {tpl.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>
                )}

                {tpl.systemRole && (
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <span className="text-purple-400">Role:</span> {tpl.systemRole}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                {tpl.targetModule ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 flex items-center gap-1">
                    <ArrowRight className="w-2.5 h-2.5 text-purple-400" />
                    Target: {tpl.targetModule}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">Universal Prompt</span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyPrompt(tpl.promptText, tpl.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Copy Raw Prompt"
                  >
                    {copiedPromptId === tpl.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenRunner(tpl)}
                    className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Play className="w-3 h-3 fill-purple-300" />
                    Test
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-white">No Prompt Templates Found</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Create custom prompt templates or adjust your search filters to explore the prompt library.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-purple-500 text-white hover:bg-purple-400 transition"
          >
            Create Custom Prompt
          </button>
        </div>
      )}

      {/* Runner / Variable Interpolator Modal */}
      {activeTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400">
                  {activeTemplate.category}
                </span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {activeTemplate.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveTemplate(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Variable Inputs */}
            {activeTemplate.variables && activeTemplate.variables.length > 0 && (
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  Dynamic Prompt Variables
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeTemplate.variables.map((v) => (
                    <div key={v.name}>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        {v.label || v.name}
                      </label>
                      <input
                        type="text"
                        value={variableValues[v.name] || ''}
                        onChange={(e) =>
                          setVariableValues({ ...variableValues, [v.name]: e.target.value })
                        }
                        placeholder={v.description || v.defaultValue}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolved Prompt Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Resolved Prompt Preview</span>
                <span className="text-[11px] text-slate-500">Live Interpolation</span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                <code>{getResolvedPrompt(activeTemplate)}</code>
              </pre>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyPrompt(getResolvedPrompt(activeTemplate), 'modal')}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition font-semibold"
                >
                  {copiedPromptId === 'modal' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Resolved Prompt
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                {activeTemplate.targetModule && (
                  <button
                    onClick={() => {
                      handleLaunchModule(activeTemplate);
                      setActiveTemplate(null);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-purple-500/20"
                  >
                    Open in {activeTemplate.targetModule}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setActiveTemplate(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Custom Prompt Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                {editingTemplate ? 'Edit Prompt Template' : 'New Custom Prompt Template'}
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    placeholder="e.g. GraphQL Query Mutation Validator"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'ALL').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    System Role / Persona
                  </label>
                  <input
                    type="text"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    placeholder="e.g. Senior Security QA Lead"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Target Module Shortcut
                  </label>
                  <select
                    value={formTargetModule}
                    onChange={(e) => setFormTargetModule(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="requirement-analyzer">Requirement Analyzer</option>
                    <option value="test-design">Test Design</option>
                    <option value="test-cases">Test Cases</option>
                    <option value="bug-analyzer">Bug Analyzer</option>
                    <option value="api-testing">API Testing</option>
                    <option value="automation">Automation Generator</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  placeholder="What does this prompt achieve?"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Prompt Text (Use {'{{varName}}'} for dynamic variables)
                </label>
                <textarea
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  rows={6}
                  className="w-full font-mono text-xs bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-purple-500 leading-relaxed resize-y"
                  placeholder="Act as a QA engineer. Validate {{featureName}}..."
                  required
                />
              </div>

              {editorError && (
                <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs">
                  {editorError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTemplate}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-purple-500 text-white hover:bg-purple-400 transition"
                >
                  {savingTemplate ? 'Saving...' : editingTemplate ? 'Save Changes' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptLibraryPage;
