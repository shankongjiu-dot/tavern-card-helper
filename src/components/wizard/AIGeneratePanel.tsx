/**
 * AIGeneratePanel - Collapsible panel for AI batch world book generation.
 * Extracted from StepWorldBook for better component granularity.
 */
import { TextInput } from '../shared/TextInput';
import { TextArea } from '../shared/TextArea';
import { Button } from '../shared/Button';

interface AIGeneratePanelProps {
  topic: string;
  worldRules: string;
  generating: boolean;
  skeletonMode: boolean;
  skeletonCount: number;
  onTopicChange: (topic: string) => void;
  onWorldRulesChange: (rules: string) => void;
  onSkeletonModeChange: (skeleton: boolean) => void;
  onSkeletonCountChange: (count: number) => void;
  onGenerate: () => void;
  onCancel: () => void;
}

export function AIGeneratePanel({
  topic,
  worldRules,
  generating,
  skeletonMode,
  skeletonCount,
  onTopicChange,
  onWorldRulesChange,
  onSkeletonModeChange,
  onSkeletonCountChange,
  onGenerate,
  onCancel,
}: AIGeneratePanelProps) {
  return (
    <div className="mb-6 rounded-xl border border-indigo-700/40 bg-indigo-950/30 p-4 space-y-3">
      <div>
        <label className="text-sm font-medium text-indigo-300">主题 / Theme</label>
        <TextInput
          value={topic}
          onChange={(e) => onTopicChange(e.target.value)}
          placeholder="例如：修仙界、魔法学院、末日废土、赛博朋克..."
        />
      </div>

      {/* ── Skeleton mode ──────────────────────────── */}
      <div className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-700/30 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-emerald-300 flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={skeletonMode}
                onChange={(e) => onSkeletonModeChange(e.target.checked)}
                className="rounded border-emerald-600 bg-slate-800 text-emerald-500"
              />
              🦴 骨架模式
            </label>
            <p className="text-[10px] text-emerald-400/60 mt-0.5 ml-6">
              快速生成简短骨架，之后用「✨ AI 展开」逐条扩展为完整设定
            </p>
          </div>
          {skeletonMode && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-emerald-400/70">条数</span>
              <input
                type="number"
                value={skeletonCount}
                min={3}
                max={30}
                onChange={(e) => onSkeletonCountChange(Math.max(3, parseInt(e.target.value) || 6))}
                className="w-14 text-center rounded border border-emerald-600/40 bg-slate-800 px-2 py-1 text-sm font-semibold text-emerald-300"
              />
            </div>
          )}
        </div>
        {skeletonMode && (
          <div className="flex gap-1.5 ml-6">
            {[6, 10, 15, 20].map((n) => (
              <button
                key={n}
                onClick={() => onSkeletonCountChange(n)}
                className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                  skeletonCount === n
                    ? 'border-emerald-500 bg-emerald-900/40 text-emerald-300'
                    : 'border-slate-600 bg-slate-700/50 text-slate-400 hover:border-emerald-600 hover:text-emerald-400'
                }`}
              >
                {n}条
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        <label className="text-sm font-medium text-indigo-300">
          世界观约束与运行规则
          <span className="text-xs text-slate-500 font-normal ml-2">（可选，定义世界法则、扮演规则等）</span>
        </label>
        <TextArea
          value={worldRules}
          onChange={(e) => onWorldRulesChange(e.target.value)}
          placeholder={`例如：\n- 修仙体系：炼气→筑基→金丹→元婴→化神→渡劫\n- 灵气复苏设定：现代都市+灵气渐浓\n- 势力格局：三大仙门+散修联盟+魔道\n- 战力规则：每个大境界分三层，突破需天材地宝\n- 扮演规则：角色严格按设定性格行事，不可崩人设`}
          rows={6}
        />
        <p className="text-[10px] text-slate-500 mt-1">
          填写世界观设定、力量体系、势力关系、运行规则等，AI 将据此生成符合约束的世界书条目
        </p>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onGenerate}
          disabled={generating}
          className="inline-flex items-center justify-center gap-2 rounded-lg font-medium px-5 py-2 text-sm
            bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500
            text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40
            transition-all duration-200 hover:scale-105 active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
        >
          {generating ? '⏳ 生成中...' : '🚀 生成世界书'}
        </button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          取消
        </Button>
        {(topic || worldRules) && (
          <span className="text-[10px] text-slate-500 ml-auto">
            {topic && '主题: ' + topic.slice(0, 30) + (topic.length > 30 ? '...' : '')}
            {topic && worldRules && ' · '}
            {worldRules && worldRules.length + ' 字规则'}
          </span>
        )}
      </div>
    </div>
  );
}