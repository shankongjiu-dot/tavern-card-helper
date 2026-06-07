/**
 * useAIGenerate - hook for AI-powered content generation in the wizard.
 * Handles character, lorebook, first message, and example dialogue generation.
 * Supports both streaming and non-streaming modes.
 *
 * NOTE: Preset injection is handled globally in ai-service.ts (injectPreset).
 * All AI calls automatically include the active writing preset.
 */
import { useCallback } from 'react';
import { callAIWithPrompt, callAIWithPromptStreaming, type StreamCallback } from '../services/ai-service';
import {
  CHARACTER_GENERATE_PROMPT,
  LOREBOOK_GENERATE_PROMPT,
  LOREBOOK_SKELETON_PROMPT,
  EXPAND_ENTRY_PROMPT,
  FIRST_MESSAGE_PROMPT,
  EXAMPLE_DIALOGUES_PROMPT,
  ORGANIZE_ENTRIES_PROMPT,
  GENERATE_KEYS_PROMPT,
  MVU_VARIABLES_PROMPT,
  parseAIJson,
} from '../constants/prompts';
import type {
  AIGeneratedCharacter,
  AIGeneratedLorebookEntry,
  AIOrganizeSuggestion,
  AIGeneratedKeys,
  AIGeneratedMvuVariable,
} from '../constants/defaults';

export function useAIGenerate() {
  /**
   * Generate a character profile (non-streaming).
   * @returns Parsed character object or raw text if parse fails
   */
  const generateCharacter = useCallback(async (characterName: string, hint: string): Promise<string> => {
    const prompts = CHARACTER_GENERATE_PROMPT(characterName, hint);
    return callAIWithPrompt(prompts.system, prompts.user, { temperature: 0.85, max_tokens: 4000 });
  }, []);

  /**
   * Generate a character profile with streaming.
   * Calls onChunk for each token as it arrives.
   * @returns Full text when complete
   */
  const generateCharacterStreaming = useCallback(async (
    characterName: string,
    hint: string,
    onChunk: StreamCallback,
  ): Promise<string> => {
    const prompts = CHARACTER_GENERATE_PROMPT(characterName, hint);
    return callAIWithPromptStreaming(prompts.system, prompts.user, onChunk, { temperature: 0.85, max_tokens: 4000 });
  }, []);

  /**
   * Generate character and parse as JSON.
   * Returns parsed object with name and description.
   */
  const generateCharacterParsed = useCallback(async (characterName: string, hint: string) => {
    const text = await generateCharacter(characterName, hint);
    const parsed = parseAIJson(text) as AIGeneratedCharacter | null;

    if (!parsed) return { description: text };

    return {
      name: parsed.name,
      description: parsed.description,
    };
  }, [generateCharacter]);

  /**
   * Generate character with streaming and parse as JSON.
   * Returns parsed object with name, description, personality (string), appearance.
   */
  const generateCharacterParsedStreaming = useCallback(async (
    characterName: string,
    hint: string,
    onChunk: StreamCallback,
  ) => {
    const text = await generateCharacterStreaming(characterName, hint, onChunk);
    const parsed = parseAIJson(text) as AIGeneratedCharacter | null;

    if (!parsed) return { description: text };

    return {
      name: parsed.name,
      description: parsed.description,
    };
  }, [generateCharacterStreaming]);

  /**
   * Generate lorebook skeleton entries in batch.
   * Returns ultra-compressed entries for fast iteration.
   */
  const generateLorebookSkeleton = useCallback(async (
    cardName: string,
    characterSummaries: string,
    topic: string,
    batchSize: number,
    existingTitles: string,
    rules?: string,
  ): Promise<Array<{ comment: string; content: string; keys: string[]; strategy: string }>> => {
    const prompts = LOREBOOK_SKELETON_PROMPT(cardName, characterSummaries, topic, batchSize, existingTitles, rules);
    const text = await callAIWithPrompt(prompts.system, prompts.user, { temperature: 0.9, max_tokens: 6000 });
    const parsed = parseAIJson(text) as Array<{ comment?: string; content?: string; keys?: string[]; strategy?: string }> | null;
    return (parsed || []).map((sk) => ({
      comment: sk.comment || '未命名',
      content: sk.content || '(待展开)',
      keys: Array.isArray(sk.keys) ? sk.keys : [],
      strategy: sk.strategy || 'selective',
    }));
  }, []);

  /**
   * Generate lorebook entries in batch.
   * @returns Raw text response
   */
  const generateLorebook = useCallback(async (cardName: string, characterSummaries: string, topic: string, rules?: string): Promise<string> => {
    const prompts = LOREBOOK_GENERATE_PROMPT(cardName, characterSummaries, topic, rules);
    return callAIWithPrompt(prompts.system, prompts.user, { temperature: 0.8, max_tokens: 8000 });
  }, []);

  /**
   * Generate lorebook entries with streaming.
   */
  const generateLorebookStreaming = useCallback(async (
    cardName: string,
    characterSummaries: string,
    topic: string,
    onChunk: StreamCallback,
    rules?: string,
  ): Promise<string> => {
    const prompts = LOREBOOK_GENERATE_PROMPT(cardName, characterSummaries, topic, rules);
    return callAIWithPromptStreaming(prompts.system, prompts.user, onChunk, { temperature: 0.8, max_tokens: 8000 });
  }, []);

  /**
   * Generate lorebook entries and parse as JSON array.
   * Returns entries with all V2 spec + SillyTavern runtime fields.
   */
  const generateLorebookParsed = useCallback(async (cardName: string, characterSummaries: string, topic: string, rules?: string) => {
    const text = await generateLorebook(cardName, characterSummaries, topic, rules);
    const parsed = parseAIJson(text) as AIGeneratedLorebookEntry[] | null;
    return parsed || [];
  }, [generateLorebook]);

  /**
   * Generate lorebook entries with streaming and parse as JSON array.
   */
  const generateLorebookParsedStreaming = useCallback(async (
    cardName: string,
    characterSummaries: string,
    topic: string,
    onChunk: StreamCallback,
    rules?: string,
  ) => {
    const text = await generateLorebookStreaming(cardName, characterSummaries, topic, onChunk, rules);
    const parsed = parseAIJson(text) as AIGeneratedLorebookEntry[] | null;
    return parsed || [];
  }, [generateLorebookStreaming]);

  /** Generate first message */
  const generateFirstMessage = useCallback(async (
    cardName: string,
    characterDescriptions: string,
    sceneHint: string,
    targetWordCount?: number,
  ): Promise<string> => {
    const prompts = FIRST_MESSAGE_PROMPT(cardName, characterDescriptions, sceneHint, targetWordCount);
    const maxTokens = targetWordCount ? Math.max(4000, targetWordCount * 3) : 4000;
    return callAIWithPrompt(prompts.system, prompts.user, { temperature: 0.9, max_tokens: maxTokens });
  }, []);

  /** Generate first message with streaming */
  const generateFirstMessageStreaming = useCallback(async (
    cardName: string,
    characterDescriptions: string,
    sceneHint: string,
    onChunk: StreamCallback,
    targetWordCount?: number,
  ): Promise<string> => {
    const prompts = FIRST_MESSAGE_PROMPT(cardName, characterDescriptions, sceneHint, targetWordCount);
    const maxTokens = targetWordCount ? Math.max(4000, targetWordCount * 3) : 4000;
    return callAIWithPromptStreaming(prompts.system, prompts.user, onChunk, { temperature: 0.9, max_tokens: maxTokens });
  }, []);

  /** Generate example dialogues */
  const generateExampleDialogues = useCallback(async (cardName: string, characterDescriptions: string): Promise<string> => {
    const prompts = EXAMPLE_DIALOGUES_PROMPT(cardName, characterDescriptions);
    return callAIWithPrompt(prompts.system, prompts.user, { temperature: 0.85, max_tokens: 6000 });
  }, []);

  /** Generate example dialogues with streaming */
  const generateExampleDialoguesStreaming = useCallback(async (
    cardName: string,
    characterDescriptions: string,
    onChunk: StreamCallback,
  ): Promise<string> => {
    const prompts = EXAMPLE_DIALOGUES_PROMPT(cardName, characterDescriptions);
    return callAIWithPromptStreaming(prompts.system, prompts.user, onChunk, { temperature: 0.85, max_tokens: 6000 });
  }, []);

  /**
   * AI Smart Organize: Analyze entries and suggest optimized parameters.
   * Reference: st-card-builder AI 智能整理.
   */
  const organizeEntries = useCallback(async (entries: Array<{
    index: number;
    name: string;
    content: string;
    keys: string[];
    position: string;
    insertion_order: number;
    depth: number;
    probability: number;
    constant: boolean;
  }>) => {
    const prompts = ORGANIZE_ENTRIES_PROMPT(entries);
    const text = await callAIWithPrompt(prompts.system, prompts.user, { temperature: 0.3, max_tokens: 6000 });
    const parsed = parseAIJson(text) as AIOrganizeSuggestion[] | null;
    return parsed || [];
  }, []);

  /**
   * AI Key Generation: Generate trigger keywords for entries.
   * Reference: st-card-builder AI 触发词生成.
   */
  const generateEntryKeys = useCallback(async (entries: Array<{
    index: number;
    name: string;
    content: string;
    existingKeys: string[];
  }>) => {
    const prompts = GENERATE_KEYS_PROMPT(entries);
    const text = await callAIWithPrompt(prompts.system, prompts.user, { temperature: 0.5, max_tokens: 4000 });
    const parsed = parseAIJson(text) as AIGeneratedKeys[] | null;
    return parsed || [];
  }, []);

  /**
   * AI MVU Variable Suggestion: Analyze card content and suggest variables.
   * Based on world-book-mcp v5 MVU methodology.
   */
  const generateMvuVariables = useCallback(async (
    cardName: string,
    characterSummaries: string,
    worldbookSummary: string,
    firstMessageExcerpt: string,
  ) => {
    const prompts = MVU_VARIABLES_PROMPT(cardName, characterSummaries, worldbookSummary, firstMessageExcerpt);
    const text = await callAIWithPrompt(prompts.system, prompts.user, { temperature: 0.6, max_tokens: 5000 });
    const parsed = parseAIJson(text) as AIGeneratedMvuVariable[] | null;
    return parsed || [];
  }, []);

  /**
   * Expand a skeleton world book entry into a full detailed entry.
   * Detects skeleton (content < 60 chars) and automatically adds expansion hint.
   */
  const expandLorebookEntry = useCallback(async (
    entry: {
      comment: string;
      content: string;
      keys: string[];
      strategy: string;
      position: number;
    },
    characterContext: string,
    userRequirement?: string,
  ) => {
    const isSkeleton = (entry.content || '').length < 120;
    const prompts = EXPAND_ENTRY_PROMPT(entry, characterContext, isSkeleton, userRequirement);
    const text = await callAIWithPrompt(prompts.system, prompts.user, { temperature: 0.8, max_tokens: 6000 });
    const parsed = parseAIJson(text) as { comment?: string; content?: string; keys?: string[]; strategy?: string } | null;

    return {
      comment: parsed?.comment ?? entry.comment,
      content: parsed?.content ?? text,
      keys: parsed?.keys ?? entry.keys,
      strategy: parsed?.strategy ?? entry.strategy,
    };
  }, []);

  return {
    generateCharacter,
    generateCharacterStreaming,
    generateCharacterParsed,
    generateCharacterParsedStreaming,
    generateLorebook,
    generateLorebookStreaming,
    generateLorebookParsed,
    generateLorebookParsedStreaming,
    generateLorebookSkeleton,
    generateFirstMessage,
    generateFirstMessageStreaming,
    generateExampleDialogues,
    generateExampleDialoguesStreaming,
    organizeEntries,
    generateEntryKeys,
    generateMvuVariables,
    expandLorebookEntry,
  };
}
