/**
 * MVU guard tests - verifies that MVU assets are not exported/validated
 * when the MVU system is disabled.
 */
import { describe, it, expect } from 'vitest';
import { validateCard } from './card-validator';
import { assembleCard, cardToDraft } from './card-exporter';
import { createEmptyDraft, createEmptyLorebookEntry, MVU_LOREBOOK_ENTRY_NAMES } from '../constants/defaults';

function makeMvuDisabledCard() {
  return {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: {
      name: '无 MVU 测试卡',
      first_mes: '你好。',
      extensions: {},
      character_book: {
        name: '测试世界书',
        entries: [
          {
            id: 1,
            name: '普通条目',
            content: '普通内容',
            keys: ['test'],
            constant: false,
            enabled: true,
          },
          {
            id: 2,
            name: '[InitVar]请勿打开',
            content: 'hp: 100',
            keys: [],
            constant: true,
            enabled: false,
          },
          {
            id: 3,
            name: '[mvu_update]变量更新规则',
            content: 'rules:\n- path: hp\n  op: add\n  value: 1',
            keys: [],
            constant: true,
            enabled: true,
          },
          {
            id: 4,
            name: 'MVU 变量列表',
            content: '- hp: 生命值',
            keys: [],
            constant: true,
            enabled: true,
          },
        ],
      },
    },
  } as Record<string, unknown>;
}

describe('MVU disabled guard', () => {
  it('validateCard: 未启用 MVU 的卡片即使包含 MVU 世界书条目也不报 MVU 警告', () => {
    const result = validateCard(makeMvuDisabledCard());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings.some((w) => w.includes('MVU'))).toBe(false);
  });

  it('assembleCard: 未启用 MVU 时过滤掉世界书中的 MVU 资产', () => {
    const draft = createEmptyDraft();
    draft.cardName = '无 MVU 测试卡';
    draft.firstMessage = '你好。';
    draft.lorebookEntries = [
      { ...createEmptyLorebookEntry(), name: '普通条目', content: '普通内容', keys: ['test'] },
      { ...createEmptyLorebookEntry(), name: '[InitVar]请勿打开', content: 'hp: 100', constant: true, enabled: false },
      { ...createEmptyLorebookEntry(), name: '[mvu_update]变量更新规则', content: 'rules:', constant: true, enabled: true },
      { ...createEmptyLorebookEntry(), name: 'MVU 变量输出格式', content: '<update>', constant: true, enabled: true },
    ];

    const card = assembleCard(draft);
    const entries = (card.data.character_book.entries || []) as Array<Record<string, unknown>>;

    // 普通条目保留
    expect(entries.some((e) => e.name === '普通条目')).toBe(true);
    // MVU 条目全部被过滤
    expect(entries.some((e) => MVU_LOREBOOK_ENTRY_NAMES.includes(e.name as string))).toBe(false);
    // 不写入 MVU 扩展
    expect((card.data.extensions as Record<string, unknown>).mvu_enabled).toBeUndefined();
    expect((card.data.extensions as Record<string, unknown>).tavern_helper).toBeUndefined();
    expect((card.data.extensions as Record<string, unknown>).regex_scripts).toBeUndefined();
    // first_mes 不包含状态栏占位符和 setvar
    expect(card.data.first_mes).toBe('你好。');
  });

  it('cardToDraft: 导入未启用 MVU 的卡片时丢弃 MVU 世界书条目', () => {
    const draft = cardToDraft(makeMvuDisabledCard());

    expect(draft.mvu?.enabled ?? false).toBe(false);
    expect(draft.lorebookEntries.some((e) => MVU_LOREBOOK_ENTRY_NAMES.includes(e.name))).toBe(false);
    // 普通条目保留
    expect(draft.lorebookEntries.some((e) => e.name === '普通条目')).toBe(true);
  });

  it('validateCard: 启用 MVU 的卡片仍按原有规则校验', () => {
    const card = makeMvuDisabledCard();
    (card.data as Record<string, unknown>).extensions = { mvu_enabled: true };

    const result = validateCard(card);
    // 此卡片启用了 MVU 但缺少 scripts/regex，应该产生 MVU 警告
    expect(result.warnings.some((w) => w.includes('MVU'))).toBe(true);
  });
});
