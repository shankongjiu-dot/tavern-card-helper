/**
 * AIProgressPanel - Real-time AI generation progress viewer.
 * Shows streaming tokens as they arrive, with status and controls.
 */
import { useState, useEffect, useRef } from 'react';

export type AIProgressStatus = 'idle' | 'generating' | 'done' | 'error';

interface AIProgressPanelProps {
  status: AIProgressStatus;
  text: string;
  error?: string | null;
  title?: string;
  onClear?: () => void;
}

export function AIProgressPanel({
  status,
  text,
  error,
  title = 'AI 实时输出',
  onClear,
}: AIProgressPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new text arrives
  useEffect(() => {
    if (textRef.current && !collapsed) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [text, collapsed]);

  // Auto-expand when generation starts
  useEffect(() => {
    if (status === 'generating') {
      setCollapsed(false);
    }
  }, [status]);

  const statusConfig = {
    idle: { label: '等待中', color: 'text-slate-400', dot: 'bg-slate-400' },
    generating: { label: '生成中', color: 'text-amber-400', dot: 'bg-amber-400 animate-pulse' },
    done: { label: '完成', color: 'text-emerald-400', dot: 'bg-emerald-400' },
    error: { label: '错误', color: 'text-red-400', dot: 'bg-red-400' },
  };

  const { label, color, dot } = statusConfig[status];

  // Count characters and estimate tokens
  const charCount = text.length;
  const estimatedTokens = Math.ceil(charCount / 2); // rough estimate for Chinese

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/80 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700 cursor-pointer select-none hover:bg-slate-800/50 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dot}`} />
          <span className="text-sm font-medium text-white">{title}</span>
          <span className={`text-xs ${color}`}>{label}</span>
        </div>
        <div className="flex items-center gap-3">
          {text && (
            <span className="text-[10px] text-slate-500">
              {charCount} 字符 / ~{estimatedTokens} tokens
            </span>
          )}
          {status === 'done' && onClear && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              清空
            </button>
          )}
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${collapsed ? '' : 'rotate-180'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Content */}
      {!collapsed && (
        <div
          ref={textRef}
          className="p-4 max-h-[300px] overflow-y-auto font-mono text-sm text-slate-300 whitespace-pre-wrap leading-relaxed"
        >
          {text ? (
            <span>{text}</span>
          ) : status === 'generating' ? (
            <span className="text-slate-500 italic">等待 AI 响应...</span>
          ) : status === 'error' ? (
            <span className="text-red-400">{error || '未知错误'}</span>
          ) : (
            <span className="text-slate-500 italic">点击上方按钮开始生成</span>
          )}
          {status === 'generating' && text && (
            <span className="inline-block w-2 h-4 bg-amber-400 animate-pulse ml-0.5 align-middle" />
          )}
        </div>
      )}
    </div>
  );
}
