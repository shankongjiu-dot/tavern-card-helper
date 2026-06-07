/**
 * ThemeSettings - UI customization panel for theme options.
 * Allows adjusting opacity, colors, blur, text color, shadows, etc.
 */
import { useState } from 'react';
import {
  getThemeSettings,
  saveThemeSettings,
  resetTheme,
  COLOR_PRESETS,
  TEXT_COLOR_PRESETS,
  TEXT_SHADOW_COLOR_PRESETS,
  INPUT_BG_PRESETS,
  INPUT_BORDER_PRESETS,
  type ThemeSettings as ThemeSettingsType,
} from '../../services/theme-service';
import { getStoredBackground, applyBackground } from '../../services/background-service';

export function ThemeSettings() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [settings, setSettings] = useState<ThemeSettingsType>(() => getThemeSettings());

  const handleUpdate = (patch: Partial<ThemeSettingsType>) => {
    const updated = saveThemeSettings(patch);
    setSettings(updated);
    if ('bgOverlayOpacity' in patch) {
      applyBackground(getStoredBackground());
    }
  };

  const handleReset = () => {
    const reset = resetTheme();
    setSettings(reset);
    applyBackground(getStoredBackground());
  };

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        title="UI 设置"
      >
        <span className="flex items-center gap-1.5">
          ⚙️ 外观
        </span>
        <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {/* Expanded settings panel */}
      {isExpanded && (
        <div className="absolute bottom-full left-0 right-0 mb-1 p-3 bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-lg w-64 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            {/* Primary Color */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">主题颜色</label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleUpdate({ primaryColor: preset.value })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                      settings.primaryColor === preset.value
                        ? 'border-white scale-110'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>

            {/* Text Color */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">文字颜色</label>
              <div className="flex flex-wrap gap-1.5">
                {TEXT_COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleUpdate({ textColor: preset.value })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                      settings.textColor === preset.value
                        ? 'border-indigo-400 scale-110'
                        : 'border-slate-600'
                    }`}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>

            {/* Background Overlay Opacity */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                背景遮罩: {settings.bgOverlayOpacity}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.bgOverlayOpacity}
                onChange={(e) => handleUpdate({ bgOverlayOpacity: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Surface Opacity */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                卡片透明度: {settings.surfaceOpacity}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.surfaceOpacity}
                onChange={(e) => handleUpdate({ surfaceOpacity: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Blur Intensity */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                模糊强度: {settings.blurIntensity}px
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={settings.blurIntensity}
                onChange={(e) => handleUpdate({ blurIntensity: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Text Shadow */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                文字阴影: {settings.textShadow}
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={settings.textShadow}
                onChange={(e) => handleUpdate({ textShadow: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Text Shadow Color */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">阴影颜色</label>
              <div className="flex flex-wrap gap-1.5">
                {TEXT_SHADOW_COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleUpdate({ textShadowColor: preset.value })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                      settings.textShadowColor === preset.value
                        ? 'border-white scale-110'
                        : 'border-slate-600'
                    }`}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>

            {/* Card Shadow */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                卡片阴影: {settings.cardShadow}
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={settings.cardShadow}
                onChange={(e) => handleUpdate({ cardShadow: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Divider */}
            <div className="border-t border-slate-700 pt-3">
              <p className="text-[10px] text-slate-500 mb-2">输入框样式</p>
            </div>

            {/* Input Background Color */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">输入框背景</label>
              <div className="flex flex-wrap gap-1.5">
                {INPUT_BG_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleUpdate({ inputBgColor: preset.value })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                      settings.inputBgColor === preset.value
                        ? 'border-indigo-400 scale-110'
                        : 'border-slate-600'
                    }`}
                    style={{ 
                      backgroundColor: preset.value === 'transparent' ? undefined : preset.value,
                      backgroundImage: preset.value === 'transparent' 
                        ? 'linear-gradient(45deg, #666 25%, transparent 25%), linear-gradient(-45deg, #666 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #666 75%), linear-gradient(-45deg, transparent 75%, #666 75%)'
                        : undefined,
                      backgroundSize: preset.value === 'transparent' ? '4px 4px' : undefined,
                      backgroundPosition: preset.value === 'transparent' ? '0 0, 0 2px, 2px -2px, -2px 0px' : undefined,
                    }}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>

            {/* Input Border Color */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">输入框边框</label>
              <div className="flex flex-wrap gap-1.5">
                {INPUT_BORDER_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleUpdate({ inputBorderColor: preset.value })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                      settings.inputBorderColor === preset.value
                        ? 'border-white scale-110'
                        : 'border-slate-600'
                    }`}
                    style={{ backgroundColor: preset.value === 'auto' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : preset.value }}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>

            {/* Reset button */}
            <button
              onClick={handleReset}
              className="w-full px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-700/50 hover:bg-slate-700 rounded transition-colors"
            >
              🔄 恢复默认
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
