/**
 * HomePage - Landing page with quick-action cards.
 */
import { useNavigate } from 'react-router-dom';
import { Wand2, BookOpen, MessageCircle, PenTool } from 'lucide-react';

export function HomePage() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Wand2,
      title: '创建新卡片',
      description: '通过分步向导创建新的 AI 角色卡',
      action: () => navigate('/wizard'),
      gradient: 'from-indigo-500 to-purple-500',
      glow: 'group-hover:shadow-indigo-500/20',
    },
    {
      icon: BookOpen,
      title: '卡片库',
      description: '浏览、编辑和管理你的角色卡收藏',
      action: () => navigate('/library'),
      gradient: 'from-emerald-500 to-teal-500',
      glow: 'group-hover:shadow-emerald-500/20',
    },
    {
      icon: MessageCircle,
      title: '测试对话',
      description: '用 AI 对话测试你的角色卡',
      action: () => navigate('/chat'),
      gradient: 'from-amber-500 to-orange-500',
      glow: 'group-hover:shadow-amber-500/20',
    },
    {
      icon: PenTool,
      title: 'AI 对话创作',
      description: '和 AI 助手聊天，收集灵感、打磨设定',
      action: () => navigate('/dialogue'),
      gradient: 'from-rose-500 to-pink-500',
      glow: 'group-hover:shadow-rose-500/20',
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white">吟游手册</h1>
        <p className="mt-2 text-slate-400">
          创建、管理和测试 Tavern AI 角色卡。使用向导分步构建卡片，并用 AI 辅助生成内容。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {actions.map((item) => (
          <button
            key={item.title}
            onClick={item.action}
            className={`group text-left rounded-2xl border border-white/5 bg-slate-800/40 p-6
              hover:border-white/10 hover:bg-slate-800/60 hover:-translate-y-0.5
              transition-all duration-300 ease-out cursor-pointer
              shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20 ${item.glow}`}
          >
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl
              bg-gradient-to-br ${item.gradient} text-white mb-5
              shadow-lg shadow-black/20 group-hover:scale-105 transition-transform duration-300`}>
              <item.icon size={22} strokeWidth={1.8} />
            </div>
            <h3 className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors duration-200">
              {item.title}
            </h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">{item.description}</p>
          </button>
        ))}
      </div>

      {/* Quick info section */}
      <div className="mt-10 rounded-2xl border border-white/5 bg-slate-800/20 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">快速上手</h2>
        <ol className="space-y-3 text-sm text-slate-400">
          {[
            '点击"创建新卡片"开始向导',
            '命名卡片并添加角色（AI 可以生成角色大纲！）',
            '添加世界书条目丰富世界观',
            '编写或生成开场白',
            '保存并在对话中测试卡片！',
          ].map((text, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/15 text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span className="leading-relaxed">{text}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
