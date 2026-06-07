/**
 * Sidebar navigation component with SVG icons and polished interactions.
 */
import { NavLink } from 'react-router-dom';
import { Home, Settings, Wand2, BookOpen, MessageCircle, PenTool } from 'lucide-react';
import { BackgroundChanger } from '../shared/BackgroundChanger';
import { ThemeSettings } from '../shared/ThemeSettings';

const navItems = [
  { to: '/', label: '首页', icon: Home, end: true },
  { to: '/settings', label: 'API 设置', icon: Settings },
  { to: '/wizard', label: '创建卡片', icon: Wand2 },
  { to: '/library', label: '卡片库', icon: BookOpen },
  { to: '/chat', label: '测试对话', icon: MessageCircle },
  { to: '/dialogue', label: 'AI 创作助手', icon: PenTool },
];

export function Sidebar() {
  return (
    <aside className="w-60 h-screen sticky top-0 glass-sidebar flex flex-col shrink-0">
      {/* App title */}
      <div className="px-5 py-6 border-b border-white/5">
        <h1 className="text-lg font-bold text-themed tracking-wide" style={{ color: 'var(--color-primary)' }}>
          吟游手册
        </h1>
        <p className="text-xs text-slate-500 mt-1">AI 角色卡辅助工具</p>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200
              ${isActive
                ? 'text-themed'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`
            }
            style={({ isActive }) => isActive ? { 
              backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
              color: 'var(--color-primary)',
              textShadow: 'var(--text-shadow)'
            } : undefined}
          >
            <item.icon size={18} strokeWidth={1.8} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer - Settings */}
      <div className="px-3 py-2 border-t border-white/5 space-y-1">
        <BackgroundChanger />
        <ThemeSettings />
        <p className="text-[10px] text-slate-600 px-2 pt-2 pb-1">吟游手册 v1.0</p>
      </div>
    </aside>
  );
}
