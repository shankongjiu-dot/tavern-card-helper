/**
 * CharacterEditor - Single character editor panel used in Step 2.
 * Simplified to: name + description only.
 * Uses local state for editing and syncs to parent on blur.
 */
import { useState, useEffect } from 'react';
import { TextInput } from '../shared/TextInput';
import { TextArea } from '../shared/TextArea';
import { Button } from '../shared/Button';
import type { WizardCharacter } from '../../constants/defaults';

interface CharacterEditorProps {
  character: WizardCharacter;
  index: number;
  onUpdate: (updates: Partial<WizardCharacter>) => void;
  onRemove: () => void;
  onGenerate: (index: number) => void;
  canRemove: boolean;
  isGenerating: boolean;
}

export function CharacterEditor({
  character,
  index,
  onUpdate,
  onRemove,
  onGenerate,
  canRemove,
  isGenerating,
}: CharacterEditorProps) {
  const [localName, setLocalName] = useState(character.name ?? '');
  const [localDesc, setLocalDesc] = useState(character.description ?? '');

  useEffect(() => { setLocalName(character.name ?? ''); }, [character.name]);
  useEffect(() => { setLocalDesc(character.description ?? ''); }, [character.description]);

  const hasName = (character.name ?? '').trim().length > 0;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">
          角色 {index + 1}{localName ? `: ${localName}` : ''}
        </h3>
        <div className="flex items-center gap-2">
          {hasName && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onGenerate(index)}
              disabled={isGenerating}
            >
              {isGenerating ? '生成中...' : 'AI 生成'}
            </Button>
          )}
          {canRemove && (
            <Button variant="danger" size="sm" onClick={onRemove} disabled={isGenerating}>
              移除
            </Button>
          )}
        </div>
      </div>

      {/* Fields */}
      <TextInput
        label="角色名称"
        value={localName}
        onChange={(e) => setLocalName(e.target.value)}
        onBlur={(e) => onUpdate({ name: e.target.value })}
        placeholder="输入角色名称"
      />

      <TextArea
        label="角色设定（AI 将基于此扩展生成）"
        value={localDesc}
        onChange={(e) => setLocalDesc(e.target.value)}
        onBlur={(e) => onUpdate({ description: e.target.value })}
        placeholder="写给 AI 的约束指令，如角色核心设定、行为准则、关系要求等。AI 会在此基础上扩展联想，生成完整的角色描述和世界书条目。"
        rows={4}
      />
    </div>
  );
}
