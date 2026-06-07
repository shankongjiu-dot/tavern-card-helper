/**
 * Card Validator - validates a card against SillyTavern Character Card V2 spec.
 *
 * V2 Spec: https://github.com/malfoyslastname/character-card-spec-v2
 *
 * Returns errors (blocking) and warnings (non-blocking).
 */

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateCard(card: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ── V2 envelope validation ──────────────────────────────────────────────
  if (!card.spec || card.spec !== 'chara_card_v2') {
    errors.push('缺少 spec: "chara_card_v2"');
  }

  if (!card.spec_version || card.spec_version !== '2.0') {
    errors.push('缺少 spec_version: "2.0"');
  }

  const data = card.data as Record<string, unknown> | undefined;

  if (!data) {
    errors.push('缺少 data 对象');
    return { valid: false, errors, warnings };
  }

  // ── Required V1 fields (nested in data) ────────────────────────────────
  if (!data.name || typeof data.name !== 'string') {
    errors.push('卡片名称 (name) 是必填项');
  }

  if (!data.description || typeof data.description !== 'string') {
    warnings.push('描述 (description) 为空 — 角色可能无法正确显示');
  }

  if (!data.first_mes || typeof data.first_mes !== 'string') {
    warnings.push('开场白 (first_mes) 为空 — 对话将没有开场');
  }

  // personality, scenario, mes_example can be empty strings per spec
  if (data.personality !== undefined && typeof data.personality !== 'string') {
    warnings.push('personality 应为字符串类型');
  }

  if (data.scenario !== undefined && typeof data.scenario !== 'string') {
    warnings.push('scenario 应为字符串类型');
  }

  // ── V2 specific fields ─────────────────────────────────────────────────
  // extensions must exist and default to {}
  if (data.extensions !== undefined && typeof data.extensions !== 'object') {
    errors.push('extensions 必须是对象类型');
  }

  // alternate_greetings should be an array
  if (data.alternate_greetings !== undefined && !Array.isArray(data.alternate_greetings)) {
    warnings.push('alternate_greetings 应为数组');
  }

  // tags should be an array of strings
  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      warnings.push('tags 应为字符串数组');
    }
  }

  // ── character_book validation ──────────────────────────────────────────
  const charBook = data.character_book as Record<string, unknown> | undefined;
  if (charBook) {
    // character_book.extensions must exist
    if (charBook.extensions !== undefined && typeof charBook.extensions !== 'object') {
      warnings.push('character_book.extensions 应为对象');
    }

    if (charBook.entries && Array.isArray(charBook.entries)) {
      charBook.entries.forEach((entry: Record<string, unknown>, i: number) => {
        const entryName = (entry.name as string) || `条目 ${i + 1}`;

        // keys: required for non-constant entries
        if (!entry.keys || !Array.isArray(entry.keys)) {
          warnings.push(`世界书条目 "${entryName}" 缺少 keys 数组`);
        } else if ((entry.keys as string[]).length === 0 && !entry.constant) {
          warnings.push(`世界书条目 "${entryName}" 没有触发关键词（非常量条目将无法被激活）`);
        }

        // content: should not be empty
        if (!entry.content || typeof entry.content !== 'string' || !(entry.content as string).trim()) {
          warnings.push(`世界书条目 "${entryName}" 内容为空`);
        }

        // insertion_order: should be a number
        if (entry.insertion_order !== undefined && typeof entry.insertion_order !== 'number') {
          warnings.push(`世界书条目 "${entryName}" 的 insertion_order 应为数字`);
        }

        // position validation
        if (entry.position && !['before_char', 'after_char'].includes(entry.position as string)) {
          warnings.push(`世界书条目 "${entryName}" 的 position 应为 'before_char' 或 'after_char'`);
        }

        // entry.extensions must exist
        if (entry.extensions !== undefined && typeof entry.extensions !== 'object') {
          warnings.push(`世界书条目 "${entryName}" 的 extensions 应为对象`);
        }
      });
    }
  }

  // Token count estimation warning
  if (typeof data.description === 'string' && data.description.length > 5000) {
    warnings.push('描述过长（>5000 字符）— 建议将详细内容移至世界书条目中以节省 Token');
  }

  return { valid: errors.length === 0, errors, warnings };
}
