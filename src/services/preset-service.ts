/**
 * Preset Service - Import and manage SillyTavern prompt presets.
 *
 * SillyTavern presets are JSON files containing system prompts, generation
 * parameters, and instruct mode settings. We extract the prompt content
 * and use it as style/writing guidelines for AI generation.
 *
 * Preset JSON format (from SillyTavern):
 * {
 *   "prompts": [{ identifier, name, content, role, marker, ... }],
 *   "prompt_order": [{ character_id, order: [{ identifier, enabled }] }]
 * }
 *
 * Reference: st-card-builder preset system implementation.
 */

const PRESET_STORAGE_KEY = 'tavern-helper-presets';

/** A single extracted prompt from a preset */
export interface PresetPrompt {
  id: string;
  name: string;
  content: string;
  role: string;
  enabled: boolean;
  /** Auto-detected type based on name */
  type: 'system' | 'example' | 'jailbreak';
}

/** A loaded preset file */
export interface LoadedPreset {
  /** File name (for display) */
  fileName: string;
  /** When the preset was imported */
  importedAt: string;
  /** Extracted prompts */
  prompts: PresetPrompt[];
}

/** Detect prompt type from name */
function detectPromptType(name: string): PresetPrompt['type'] {
  const lower = name.toLowerCase();
  if (
    lower.includes('example') || lower.includes('dialogue') ||
    lower.includes('示例') || lower.includes('对话') ||
    lower.includes('few-shot') || lower.includes('fewshot')
  ) {
    return 'example';
  }
  if (
    lower.includes('jailbreak') || lower.includes('越狱') ||
    lower.includes('nsfw') || lower.includes('r18') || lower.includes('r-18')
  ) {
    return 'jailbreak';
  }
  return 'system';
}

/**
 * Parse a SillyTavern preset JSON and extract prompts.
 * Supports both ST prompt preset format and simple system prompt format.
 */
export function parsePresetJson(json: unknown): PresetPrompt[] {
  const data = json as Record<string, unknown>;

  // Format 1: SillyTavern prompt preset (has prompts array)
  if (Array.isArray(data.prompts)) {
    // Get enabled identifiers from prompt_order
    const promptOrder = data.prompt_order as Array<{ order?: Array<{ identifier: string; enabled: boolean }> }> | undefined;
    const lastOrder = promptOrder && promptOrder.length > 0
      ? promptOrder[promptOrder.length - 1]?.order || []
      : [];
    const enabledIds = new Set(lastOrder.filter(o => o.enabled).map(o => o.identifier));
    const hasOrder = lastOrder.length > 0;

    return (data.prompts as Array<Record<string, unknown>>)
      .filter(p => p.content && !p.marker)
      .map((p): PresetPrompt => ({
        id: (p.identifier as string) || `prompt_${Math.random().toString(36).slice(2)}`,
        name: (p.name as string) || '规则',
        content: (p.content as string) || '',
        role: (p.role as string) || 'system',
        enabled: hasOrder ? enabledIds.has(p.identifier as string) : true,
        type: detectPromptType((p.name as string) || ''),
      }));
  }

  // Format 2: Simple object with system_prompt / main_prompt fields
  const systemContent = (data.system_prompt as string)
    || (data.main_prompt as string)
    || (data.system as string)
    || (data.instruction as string)
    || '';

  if (systemContent) {
    return [{
      id: 'main',
      name: '系统提示',
      content: systemContent,
      role: 'system',
      enabled: true,
      type: 'system',
    }];
  }

  // Format 3: Array of prompt strings
  if (Array.isArray(data) && data.every(item => typeof item === 'string' || typeof item.content === 'string')) {
    return (data as Array<string | Record<string, unknown>>).map((item, i): PresetPrompt => {
      const content = typeof item === 'string' ? item : (item.content as string) || '';
      const name = typeof item === 'object' ? ((item.name as string) || `规则 ${i + 1}`) : `规则 ${i + 1}`;
      return {
        id: `prompt_${i}`,
        name,
        content,
        role: 'system',
        enabled: true,
        type: detectPromptType(name),
      };
    });
  }

  return [];
}

/**
 * Import a preset from a File object.
 * Parses the JSON and stores in localStorage.
 */
export async function importPresetFile(file: File): Promise<LoadedPreset> {
  const text = await file.text();
  const json = JSON.parse(text);
  const prompts = parsePresetJson(json);

  if (prompts.length === 0) {
    throw new Error('未找到可用的预设规则。请确认文件是 SillyTavern 预设格式。');
  }

  const preset: LoadedPreset = {
    fileName: file.name,
    importedAt: new Date().toISOString(),
    prompts,
  };

  // Save to localStorage
  savePresets(preset);

  return preset;
}

/** Save preset to localStorage */
function savePresets(preset: LoadedPreset) {
  localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(preset));
}

/** Load saved preset from localStorage */
export function loadSavedPreset(): LoadedPreset | null {
  try {
    const raw = localStorage.getItem(PRESET_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LoadedPreset;
  } catch {
    return null;
  }
}

/** Clear saved preset */
export function clearSavedPreset() {
  localStorage.removeItem(PRESET_STORAGE_KEY);
}

/** Toggle a prompt's enabled state */
export function togglePresetPrompt(index: number): LoadedPreset | null {
  const preset = loadSavedPreset();
  if (!preset) return null;
  if (index >= 0 && index < preset.prompts.length) {
    preset.prompts[index].enabled = !preset.prompts[index].enabled;
    savePresets(preset);
  }
  return preset;
}

/**
 * Get the concatenated text of all enabled preset prompts.
 * Used to inject style guidelines into AI generation.
 */
export function getActivePresetsText(): string {
  const preset = loadSavedPreset();
  if (!preset) return '';

  const enabled = preset.prompts.filter(p => p.enabled);
  if (enabled.length === 0) return '';

  return enabled
    .map(p => `[规则: ${p.name}]\n${p.content}`)
    .join('\n\n');
}
