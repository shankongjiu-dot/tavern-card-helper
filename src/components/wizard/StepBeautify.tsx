/**
 * Step 6: Beautification / MVU - optional step for adding MVU state tracking
 * and frontend beautification to the character card.
 *
 * Features:
 *   - AI-powered MVU variable suggestion based on card content
 *   - Manual variable editor
 *   - Live preview of generated MVU five-piece set
 *   - Status bar configuration (safe_macro / dynamic_js)
 *   - Story view beautification
 *   - Asset download for use with SillyTavern
 *
 * Based on world-book-mcp v5 MVU methodology:
 *   schema.js → initvar.yaml → update-rules.yaml → variable-list.md → output-format.md
 */
import { useState, useCallback, useMemo } from 'react';
import { generateId } from '../../constants/defaults';
import type { MvuConfig, MvuVariable, MvuVariableKind } from '../../constants/defaults';
import { useAIGenerate } from '../../hooks/useAIGenerate';
import { Button } from '../shared/Button';
import {
  generateAllMvuAssets,
  downloadMvuAssets,
  packageMvuAssets,
} from '../../services/mvu-generator';

interface StepBeautifyProps {
  mvu: MvuConfig;
  cardName: string;
  characterSummaries: string;
  worldbookSummary: string;
  firstMessageExcerpt: string;
  onChange: (mvu: MvuConfig) => void;
}

type PreviewTab = 'schema' | 'initvar' | 'update-rules' | 'variable-list' | 'output-format' | 'statusbar' | 'story';

const KIND_OPTIONS: { value: MvuVariableKind; label: string }[] = [
  { value: 'number', label: '数字' },
  { value: 'string', label: '文本' },
  { value: 'boolean', label: '布尔' },
  { value: 'enum', label: '枚举' },
  { value: 'record', label: '记录' },
  { value: 'object', label: '对象' },
];

export function StepBeautify({
  mvu,
  cardName,
  characterSummaries,
  worldbookSummary,
  firstMessageExcerpt,
  onChange,
}: StepBeautifyProps) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<PreviewTab>('schema');
  const [showPreview, setShowPreview] = useState(false);
  const [editingVarId, setEditingVarId] = useState<string | null>(null);
  const { generateMvuVariables } = useAIGenerate();

  // ── Toggle MVU on/off ───────────────────────────────────────────────────

  const toggleMvu = useCallback(() => {
    onChange({ ...mvu, enabled: !mvu.enabled });
  }, [mvu, onChange]);

  // ── AI variable suggestion ──────────────────────────────────────────────

  const handleAiSuggest = useCallback(async () => {
    if (!cardName?.trim()) {
      setAiError('请先填写卡片名称');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const suggestions = await generateMvuVariables(
        cardName,
        characterSummaries,
        worldbookSummary,
        firstMessageExcerpt,
      );

      if (suggestions.length === 0) {
        setAiError('AI 未能生成变量建议，请手动添加');
        return;
      }

      // Merge with existing variables (avoid duplicates by path)
      const existingPaths = new Set(mvu.variables.map(v => v.path.join('.')));
      const newVars: MvuVariable[] = suggestions
        .filter(s => {
          const p = Array.isArray(s.path) ? s.path.join('.') : '';
          return p && !existingPaths.has(p);
        })
        .map(s => ({
          id: generateId(),
          path: Array.isArray(s.path) ? s.path : [],
          kind: s.kind || 'string',
          defaultValue: s.defaultValue ?? (s.kind === 'number' ? 0 : s.kind === 'boolean' ? false : ''),
          description: s.description || '',
          enumValues: s.enumValues,
          min: s.min,
          max: s.max,
          hidden: s.hidden || false,
          readonly: s.readonly || false,
        }));

      if (newVars.length > 0) {
        onChange({
          ...mvu,
          enabled: true,
          variables: [...mvu.variables, ...newVars],
        });
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI 生成失败');
    } finally {
      setAiLoading(false);
    }
  }, [cardName, characterSummaries, worldbookSummary, firstMessageExcerpt, mvu, onChange, generateMvuVariables]);

  // ── Variable CRUD ──────────────────────────────────────────────────────

  const addVariable = useCallback(() => {
    const newVar: MvuVariable = {
      id: generateId(),
      path: ['新变量'],
      kind: 'number',
      defaultValue: 0,
      description: '',
    };
    onChange({ ...mvu, variables: [...mvu.variables, newVar] });
    setEditingVarId(newVar.id);
  }, [mvu, onChange]);

  const removeVariable = useCallback((id: string) => {
    onChange({ ...mvu, variables: mvu.variables.filter(v => v.id !== id) });
    if (editingVarId === id) setEditingVarId(null);
  }, [mvu, onChange, editingVarId]);

  const updateVariable = useCallback((id: string, updates: Partial<MvuVariable>) => {
    onChange({
      ...mvu,
      variables: mvu.variables.map(v => v.id === id ? { ...v, ...updates } : v),
    });
  }, [mvu, onChange]);

  // ── Generate preview ───────────────────────────────────────────────────

  const generatedConfig = useMemo(() => {
    if (!mvu.enabled || mvu.variables.length === 0) return null;
    return generateAllMvuAssets(mvu);
  }, [mvu]);

  const handleGeneratePreview = useCallback(() => {
    setShowPreview(true);
  }, []);

  const handleDownload = useCallback(() => {
    if (generatedConfig) {
      downloadMvuAssets(generatedConfig);
    }
  }, [generatedConfig]);

  // ── Status bar toggle ──────────────────────────────────────────────────

  const toggleStatusBar = useCallback(() => {
    onChange({ ...mvu, statusBarEnabled: !mvu.statusBarEnabled });
  }, [mvu, onChange]);

  const toggleStoryBeautify = useCallback(() => {
    onChange({ ...mvu, storyBeautifyEnabled: !mvu.storyBeautifyEnabled });
  }, [mvu, onChange]);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">美化 / MVU 状态追踪</h2>
      <p className="text-sm text-slate-400 mb-6">
        可选步骤。启用 MVU 可以为角色卡添加状态追踪系统（好感度、地点、时间等），并生成前端美化资产。
        基于 <a href="https://github.com/QiHuang02/world-book-mcp" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">world-book-mcp v5</a> 方法论。
      </p>

      {/* MVU Toggle */}
      <div className="flex items-center gap-3 mb-6">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={mvu.enabled}
            onChange={toggleMvu}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
        </label>
        <span className="text-sm text-white">启用 MVU 状态追踪</span>
      </div>

      {mvu.enabled && (
        <div className="space-y-6">
          {/* AI Suggest button */}
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={handleAiSuggest}
              disabled={aiLoading}
              size="sm"
            >
              {aiLoading ? 'AI 分析中...' : 'AI 建议变量'}
            </Button>
            <span className="text-xs text-slate-500">
              根据卡片内容自动建议状态追踪变量
            </span>
          </div>
          {aiError && (
            <p className="text-xs text-red-400">{aiError}</p>
          )}

          {/* Variable list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-indigo-300">
                变量列表 ({mvu.variables.length})
              </h3>
              <Button variant="ghost" size="sm" onClick={addVariable}>
                + 添加变量
              </Button>
            </div>

            {mvu.variables.length === 0 ? (
              <p className="text-sm text-slate-500 italic py-4 text-center border border-dashed border-slate-700 rounded-lg">
                暂无变量。点击上方按钮手动添加，或使用 AI 建议。
              </p>
            ) : (
              <div className="space-y-2">
                {mvu.variables.map(v => (
                  <VariableRow
                    key={v.id}
                    variable={v}
                    editing={editingVarId === v.id}
                    onEdit={() => setEditingVarId(editingVarId === v.id ? null : v.id)}
                    onUpdate={(updates) => updateVariable(v.id, updates)}
                    onRemove={() => removeVariable(v.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Frontend beautification options */}
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-indigo-300">前端美化选项</h3>

            {/* Status bar */}
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={mvu.statusBarEnabled}
                  onChange={toggleStatusBar}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
              </label>
              <span className="text-sm text-white">HTML 状态栏</span>
              {mvu.statusBarEnabled && (
                <select
                  value={mvu.statusBarMode}
                  onChange={(e) => onChange({ ...mvu, statusBarMode: e.target.value as 'safe_macro' | 'dynamic_js' })}
                  className="ml-2 text-xs bg-slate-700 text-slate-300 border border-slate-600 rounded px-2 py-1"
                >
                  <option value="safe_macro">safe_macro (推荐)</option>
                  <option value="dynamic_js">dynamic_js (高级)</option>
                </select>
              )}
            </div>

            {/* Story beautification */}
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={mvu.storyBeautifyEnabled}
                  onChange={toggleStoryBeautify}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
              </label>
              <span className="text-sm text-white">正文美化标签</span>
              {mvu.storyBeautifyEnabled && (
                <input
                  type="text"
                  value={mvu.storyBeautifyTag}
                  onChange={(e) => onChange({ ...mvu, storyBeautifyTag: e.target.value })}
                  placeholder="story_view"
                  className="ml-2 text-xs bg-slate-700 text-slate-300 border border-slate-600 rounded px-2 py-1 w-32"
                />
              )}
            </div>
          </div>

          {/* Generate & Download */}
          {mvu.variables.length > 0 && (
            <div className="flex items-center gap-3">
              <Button onClick={handleGeneratePreview} size="sm">
                生成预览
              </Button>
              <Button variant="secondary" onClick={handleDownload} size="sm">
                下载 MVU 资产文件
              </Button>
              <span className="text-xs text-slate-500">
                {packageMvuAssets(generatedConfig || mvu).length} 个文件
              </span>
            </div>
          )}

          {/* Asset preview */}
          {showPreview && generatedConfig && (
            <div className="rounded-xl border border-slate-700 bg-slate-900/80 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-slate-700 overflow-x-auto">
                {([
                  ['schema', 'schema.js'],
                  ['initvar', 'initvar.yaml'],
                  ['update-rules', 'update-rules.yaml'],
                  ['variable-list', 'variable-list.md'],
                  ['output-format', 'output-format.md'],
                  ...(mvu.statusBarEnabled ? [['statusbar', '状态栏']] as const : []),
                  ...(mvu.storyBeautifyEnabled ? [['story', '正文美化']] as const : []),
                ] as Array<[PreviewTab, string]>).map(([tab, label]) => (
                  <button
                    key={tab}
                    onClick={() => setPreviewTab(tab)}
                    className={`px-3 py-2 text-xs whitespace-nowrap transition-colors ${
                      previewTab === tab
                        ? 'text-indigo-300 border-b-2 border-indigo-500 bg-slate-800/50'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Preview content */}
              <div className="p-4 max-h-[400px] overflow-y-auto">
                <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
                  {getPreviewContent(generatedConfig, previewTab)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Variable row component ────────────────────────────────────────────────

function VariableRow({
  variable,
  editing,
  onEdit,
  onUpdate,
  onRemove,
}: {
  variable: MvuVariable;
  editing: boolean;
  onEdit: () => void;
  onUpdate: (updates: Partial<MvuVariable>) => void;
  onRemove: () => void;
}) {
  const dotPath = variable.path.join('.');
  const kindLabel = KIND_OPTIONS.find(k => k.value === variable.kind)?.label ?? variable.kind;

  if (!editing) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/50 cursor-pointer hover:bg-slate-800 transition-colors"
        onClick={onEdit}
      >
        <div className="flex-1 min-w-0">
          <span className="text-sm text-white font-mono">{dotPath}</span>
          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
            {kindLabel}
          </span>
          {variable.hidden && (
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-500">$ 隐藏</span>
          )}
          {variable.readonly && (
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-500">_ 只读</span>
          )}
        </div>
        <span className="text-xs text-slate-500 truncate max-w-[150px]">
          {variable.description || String(variable.defaultValue)}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="text-xs text-red-400 hover:text-red-300 ml-2"
        >
          x
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-indigo-600/50 bg-slate-800/80 p-4 space-y-3">
      {/* Path */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-400 w-16 shrink-0">路径</label>
        <input
          type="text"
          value={variable.path.join('.')}
          onChange={(e) => {
            const newPath = e.target.value.split('.').map(s => s.trim()).filter(Boolean);
            if (newPath.length > 0) onUpdate({ path: newPath });
          }}
          className="flex-1 text-sm bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 font-mono"
          placeholder="主体.变量名"
        />
      </div>

      {/* Kind & default value */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-400 w-16 shrink-0">类型</label>
        <select
          value={variable.kind}
          onChange={(e) => {
            const kind = e.target.value as MvuVariableKind;
            const defaultValue = kind === 'number' ? 0 : kind === 'boolean' ? false : kind === 'enum' ? '' : '';
            onUpdate({ kind, defaultValue });
          }}
          className="text-sm bg-slate-700 text-white border border-slate-600 rounded px-2 py-1"
        >
          {KIND_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <label className="text-xs text-slate-400 ml-2">默认值</label>
        {variable.kind === 'boolean' ? (
          <select
            value={String(variable.defaultValue)}
            onChange={(e) => onUpdate({ defaultValue: e.target.value === 'true' })}
            className="text-sm bg-slate-700 text-white border border-slate-600 rounded px-2 py-1"
          >
            <option value="false">false</option>
            <option value="true">true</option>
          </select>
        ) : variable.kind === 'enum' ? (
          <input
            type="text"
            value={String(variable.defaultValue ?? '')}
            onChange={(e) => onUpdate({ defaultValue: e.target.value })}
            className="flex-1 text-sm bg-slate-700 text-white border border-slate-600 rounded px-2 py-1"
            placeholder="默认枚举值"
          />
        ) : (
          <input
            type={variable.kind === 'number' ? 'number' : 'text'}
            value={String(variable.defaultValue ?? '')}
            onChange={(e) => {
              const val = variable.kind === 'number' ? Number(e.target.value) : e.target.value;
              onUpdate({ defaultValue: val });
            }}
            className="flex-1 text-sm bg-slate-700 text-white border border-slate-600 rounded px-2 py-1"
          />
        )}
      </div>

      {/* Enum values (only for enum type) */}
      {variable.kind === 'enum' && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 w-16 shrink-0">枚举值</label>
          <input
            type="text"
            value={(variable.enumValues ?? []).join(', ')}
            onChange={(e) => {
              onUpdate({ enumValues: e.target.value.split(',').map(s => s.trim()).filter(Boolean) });
            }}
            className="flex-1 text-sm bg-slate-700 text-white border border-slate-600 rounded px-2 py-1"
            placeholder="值1, 值2, 值3"
          />
        </div>
      )}

      {/* Number range */}
      {variable.kind === 'number' && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 w-16 shrink-0">范围</label>
          <input
            type="number"
            value={variable.min ?? ''}
            onChange={(e) => onUpdate({ min: e.target.value ? Number(e.target.value) : undefined })}
            className="w-20 text-sm bg-slate-700 text-white border border-slate-600 rounded px-2 py-1"
            placeholder="最小"
          />
          <span className="text-slate-500">~</span>
          <input
            type="number"
            value={variable.max ?? ''}
            onChange={(e) => onUpdate({ max: e.target.value ? Number(e.target.value) : undefined })}
            className="w-20 text-sm bg-slate-700 text-white border border-slate-600 rounded px-2 py-1"
            placeholder="最大"
          />
        </div>
      )}

      {/* Description */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-400 w-16 shrink-0">说明</label>
        <input
          type="text"
          value={variable.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="flex-1 text-sm bg-slate-700 text-white border border-slate-600 rounded px-2 py-1"
          placeholder="变量用途说明"
        />
      </div>

      {/* Flags */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={variable.hidden ?? false}
            onChange={(e) => onUpdate({ hidden: e.target.checked })}
            className="rounded border-slate-600 bg-slate-700 text-indigo-600"
          />
          <span className="text-xs text-slate-400">$ 隐藏 (AI 不可见)</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={variable.readonly ?? false}
            onChange={(e) => onUpdate({ readonly: e.target.checked })}
            className="rounded border-slate-600 bg-slate-700 text-indigo-600"
          />
          <span className="text-xs text-slate-400">_ 只读 (AI 不更新)</span>
        </label>
        <button
          onClick={onEdit}
          className="text-xs text-indigo-400 hover:text-indigo-300 ml-auto"
        >
          完成编辑
        </button>
      </div>
    </div>
  );
}

// ── Preview content helper ────────────────────────────────────────────────

function getPreviewContent(config: MvuConfig, tab: PreviewTab): string {
  switch (tab) {
    case 'schema': return config.schemaJs || '(空)';
    case 'initvar': return config.initvarYaml || '(空)';
    case 'update-rules': return config.updateRulesYaml || '(空)';
    case 'variable-list': return config.variableListMd || '(空)';
    case 'output-format': return config.outputFormatMd || '(空)';
    case 'statusbar': return config.statusBarHtml || '(未启用)';
    case 'story': return config.storyBeautifyHtml || '(未启用)';
    default: return '';
  }
}
