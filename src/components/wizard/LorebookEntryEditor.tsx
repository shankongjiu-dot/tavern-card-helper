/**
 * LorebookEntryEditor - Single lorebook entry editor panel.
 * Extracted from StepWorldBook for better component granularity.
 *
 * Entry layout (3 sections):
 *   1. Core: name, keys, content, enabled, strategy
 *   2. Trigger & Insertion: position, order, priority, probability, depth
 *   3. Advanced: selective+logic, group+weight, recursion, timed effects, options
 */
import { TextInput } from '../shared/TextInput';
import { TextArea } from '../shared/TextArea';
import { TagInput } from '../shared/TagInput';
import { Button } from '../shared/Button';
import {
  LOREBOOK_POSITION_OPTIONS,
  SELECTIVE_LOGIC_OPTIONS,
  LOREBOOK_ROLE_OPTIONS,
} from '../../constants/defaults';
import type { LorebookEntry, LorebookPosition } from '../../constants/defaults';

/** Determine trigger strategy badge */
function getStrategyBadge(entry: LorebookEntry) {
  if (entry.constant) return { icon: '🔵', label: '常驻' };
  if (entry.keys.length === 0) return { icon: '🔗', label: '嵌入' };
  return { icon: '🟢', label: '触发' };
}

/** Rough token estimate (~1.3 tokens per char for CJK) */
function estimateTokens(text: string): number {
  return Math.round((text || '').length * 1.3);
}

interface LorebookEntryEditorProps {
  entry: LorebookEntry;
  index: number;
  onUpdate: (index: number, updates: Partial<LorebookEntry>) => void;
  onRemove: (index: number) => void;
}

export function LorebookEntryEditor({ entry, index, onUpdate, onRemove }: LorebookEntryEditorProps) {
  const badge = getStrategyBadge(entry);
  const fieldCls = 'w-full rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-slate-200';
  const labelCls = 'text-xs text-slate-400';
  const hintCls = 'text-[10px] text-slate-500 mt-0.5';

  return (
    <div className={`rounded-xl border bg-slate-800/50 p-4 space-y-3 ${
      !entry.enabled ? 'border-slate-700/50 opacity-50' :
      entry.constant ? 'border-amber-700/60' : 'border-slate-700'
    }`}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">{badge.icon}</span>
          <h3 className="text-sm font-semibold text-white truncate">
            {entry.name || `条目 ${index + 1}`}
          </h3>
          <span className="text-[10px] text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded shrink-0">
            {badge.label}
          </span>
          <span className="text-[10px] text-slate-600 font-mono shrink-0">
            {entry.position}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-1 text-xs text-slate-400">
            <input type="checkbox" checked={entry.enabled}
              onChange={(e) => onUpdate(index, { enabled: e.target.checked })}
              className="rounded border-slate-600 bg-slate-800 text-indigo-600" />
            启用
          </label>
          <Button variant="danger" size="sm" onClick={() => onRemove(index)}>×</Button>
        </div>
      </div>

      {/* ── Section 1: 标题 + 触发策略 + 关键词 + 内容 ─────── */}
      <div className="grid grid-cols-[1fr,auto] gap-3">
        <TextInput
          label="标题（备忘）"
          value={entry.name}
          onChange={(e) => onUpdate(index, { name: e.target.value })}
          placeholder="条目标题，仅自己可见"
        />
        <div className="flex flex-col gap-1 pt-5">
          <label className="flex items-center gap-1 text-xs text-slate-300">
            <input type="checkbox" checked={entry.constant}
              onChange={(e) => onUpdate(index, { constant: e.target.checked })}
              className="rounded border-slate-600 bg-slate-800 text-indigo-600" />
            🔵 常驻
          </label>
        </div>
      </div>

      {!entry.constant && (
        <div className="grid grid-cols-[1fr,auto] gap-3">
          <TagInput
            label="触发关键词 (keys)"
            tags={entry.keys}
            onChange={(keys) => onUpdate(index, { keys })}
            placeholder="触发此条目的关键词（3-6个）..."
          />
          <div className="flex flex-col gap-1 pt-5 text-[10px] text-slate-500">
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={entry.use_regex}
                onChange={(e) => onUpdate(index, { use_regex: e.target.checked })}
                className="rounded border-slate-600 bg-slate-800 text-indigo-600" />
              正则
            </label>
          </div>
        </div>
      )}

      <TextArea
        label="内容 (content)"
        value={entry.content}
        onChange={(e) => onUpdate(index, { content: e.target.value })}
        placeholder="注入 AI 的文本。第三人称、现在时、3-5句。关键词和标题不会发送给 AI。"
        rows={3}
      />
      <p className="text-[10px] text-slate-500 -mt-2">
        {(entry.content || '').length} 字符 · ~{estimateTokens(entry.content)} Token
      </p>

      {/* ── Section 2: 触发与插入参数 ─────────────────────── */}
      <div className="border-t border-slate-700/50 pt-3">
        <p className="text-[11px] font-medium text-slate-400 mb-2">触发与插入参数</p>
        <div className="grid grid-cols-4 gap-3">

          {/* Position */}
          <div>
            <label className={labelCls}>插入位置 (position)</label>
            <select value={entry.position}
              onChange={(e) => onUpdate(index, { position: e.target.value as LorebookPosition })}
              className={fieldCls}>
              {LOREBOOK_POSITION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Insertion order */}
          <div>
            <label className={labelCls}>顺序 (insertion_order)</label>
            <input type="number" value={entry.insertion_order}
              onChange={(e) => onUpdate(index, { insertion_order: parseInt(e.target.value) || 0 })}
              className={fieldCls} />
            <p className={hintCls}>越大越靠近末尾</p>
          </div>

          {/* Priority */}
          <div>
            <label className={labelCls}>优先级 (priority)</label>
            <input type="number" value={entry.priority}
              onChange={(e) => onUpdate(index, { priority: parseInt(e.target.value) || 0 })}
              className={fieldCls} />
            <p className={hintCls}>Token 不足时低优先级先丢弃</p>
          </div>

          {/* Probability */}
          <div>
            <label className={labelCls}>触发概率 (probability)</label>
            <div className="flex items-center gap-1.5">
              <input type="range" min={0} max={100} step={5} value={entry.probability}
                onChange={(e) => onUpdate(index, { probability: parseInt(e.target.value) })}
                className="flex-1 accent-indigo-600" />
              <span className="text-xs text-indigo-400 w-8 text-right">{entry.probability}%</span>
            </div>
          </div>

          {/* Depth */}
          <div>
            <label className={labelCls}>扫描深度 (depth)</label>
            <input type="number" min={0} value={entry.depth}
              onChange={(e) => onUpdate(index, { depth: parseInt(e.target.value) || 0 })}
              className={fieldCls} />
            <p className={hintCls}>扫描最近N条消息匹配关键词</p>
          </div>

          {/* Role */}
          <div>
            <label className={labelCls}>消息角色 (role)</label>
            <select value={entry.role}
              onChange={(e) => onUpdate(index, { role: parseInt(e.target.value) || 0 })}
              className={fieldCls}>
              {LOREBOOK_ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Section 3: 高级选项 ─────────────────────────────── */}
      <details className="text-sm">
        <summary className="text-slate-500 cursor-pointer hover:text-slate-300">
          高级选项（选择模式、分组、定时效果、递归、预算）
        </summary>
        <div className="mt-2 space-y-3">

          {/* Selective + secondary keys */}
          <div className="grid grid-cols-[auto,1fr] gap-3 items-start">
            <label className="flex items-center gap-1.5 text-xs text-slate-400 pt-2">
              <input type="checkbox" checked={entry.selective}
                onChange={(e) => onUpdate(index, { selective: e.target.checked })}
                className="rounded border-slate-600 bg-slate-800 text-indigo-600" />
              启用过滤词
            </label>
            {entry.selective && (
              <div className="space-y-2">
                <select value={entry.selectiveLogic}
                  onChange={(e) => onUpdate(index, { selectiveLogic: parseInt(e.target.value) || 0 })}
                  className={fieldCls}>
                  {SELECTIVE_LOGIC_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label} — {opt.desc}</option>
                  ))}
                </select>
                <TagInput
                  label="过滤关键词 (secondary_keys)"
                  tags={entry.secondary_keys}
                  onChange={(secondary_keys) => onUpdate(index, { secondary_keys })}
                  placeholder="需配合匹配的过滤词..."
                />
              </div>
            )}
          </div>

          {/* Group + weight */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>包含组 (group)</label>
              <input type="text" value={entry.group || ''}
                onChange={(e) => onUpdate(index, { group: e.target.value })}
                className={fieldCls}
                placeholder="互斥条目共用组名..." />
              <p className={hintCls}>同组仅一个条目触发</p>
            </div>
            <div>
              <label className={labelCls}>组权重 (group_weight)</label>
              <input type="number" value={entry.group_weight}
                onChange={(e) => onUpdate(index, { group_weight: parseInt(e.target.value) || 100 })}
                className={fieldCls} />
              <p className={hintCls}>越高越可能被选中</p>
            </div>
          </div>

          {/* Timed effects: sticky, cooldown, delay */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>粘性 (sticky)</label>
              <input type="number" min={0} value={entry.sticky}
                onChange={(e) => onUpdate(index, { sticky: parseInt(e.target.value) || 0 })}
                className={fieldCls} />
              <p className={hintCls}>触发后持续N条消息</p>
            </div>
            <div>
              <label className={labelCls}>冷却 (cooldown)</label>
              <input type="number" min={0} value={entry.cooldown}
                onChange={(e) => onUpdate(index, { cooldown: parseInt(e.target.value) || 0 })}
                className={fieldCls} />
              <p className={hintCls}>失效后冷却N条消息</p>
            </div>
            <div>
              <label className={labelCls}>延迟 (delay)</label>
              <input type="number" min={0} value={entry.delay}
                onChange={(e) => onUpdate(index, { delay: parseInt(e.target.value) || 0 })}
                className={fieldCls} />
              <p className={hintCls}>至少N条消息后才可触发</p>
            </div>
          </div>

          {/* Recursion + options toggles */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={entry.exclude_recursion}
                onChange={(e) => onUpdate(index, { exclude_recursion: e.target.checked })}
                className="rounded border-slate-600 bg-slate-800 text-indigo-600" />
              排除递归
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={entry.prevent_recursion}
                onChange={(e) => onUpdate(index, { prevent_recursion: e.target.checked })}
                className="rounded border-slate-600 bg-slate-800 text-indigo-600" />
              阻止递归
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={entry.match_whole_words}
                onChange={(e) => onUpdate(index, { match_whole_words: e.target.checked })}
                className="rounded border-slate-600 bg-slate-800 text-indigo-600" />
              整词匹配
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={entry.case_sensitive}
                onChange={(e) => onUpdate(index, { case_sensitive: e.target.checked })}
                className="rounded border-slate-600 bg-slate-800 text-indigo-600" />
              大小写敏感
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={entry.ignore_budget}
                onChange={(e) => onUpdate(index, { ignore_budget: e.target.checked })}
                className="rounded border-slate-600 bg-slate-800 text-indigo-600" />
              忽略预算
            </label>
          </div>

          {/* Comment */}
          <div>
            <label className={labelCls}>备注 (comment)</label>
            <input type="text" value={entry.comment || ''}
              onChange={(e) => onUpdate(index, { comment: e.target.value })}
              className={fieldCls}
              placeholder="仅自己可见的备注..." />
          </div>
        </div>
      </details>
    </div>
  );
}