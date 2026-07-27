import {
  MdAdd,
  MdDelete,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
} from 'react-icons/md';

import type { ScriptGuideBlock } from '@/models/guide.model';

interface ScriptGuideBlocksFieldProps {
  blocks: ScriptGuideBlock[];
  onChange: (blocks: ScriptGuideBlock[]) => void;
}

function newBlockId(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `block-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ScriptGuideBlocksField({
  blocks,
  onChange,
}: ScriptGuideBlocksFieldProps) {
  const updateBlock = (index: number, patch: Partial<ScriptGuideBlock>) => {
    onChange(blocks.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  };

  const removeBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= blocks.length) {return;}

    const reordered = [...blocks];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    onChange(reordered);
  };

  const addBlock = () => {
    onChange([...blocks, { id: newBlockId(), title: '', content: '' }]);
  };

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => (
        <div
          key={block.id}
          className="rounded-lg border border-border bg-bg/40 p-3"
        >
          <div className="mb-2 flex items-center gap-2">
            <input
              value={block.title}
              onChange={(e) => updateBlock(index, { title: e.target.value })}
              placeholder="Título do bloco"
              className="flex-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-[13px] font-semibold text-text outline-none focus:border-primary"
            />
            <button
              type="button"
              title="Mover para cima"
              disabled={index === 0}
              onClick={() => moveBlock(index, -1)}
              className="shrink-0 rounded-md p-1.5 text-text-muted transition-colors hover:bg-card hover:text-text disabled:cursor-not-allowed disabled:opacity-30"
            >
              <MdKeyboardArrowUp size={16} />
            </button>
            <button
              type="button"
              title="Mover para baixo"
              disabled={index === blocks.length - 1}
              onClick={() => moveBlock(index, 1)}
              className="shrink-0 rounded-md p-1.5 text-text-muted transition-colors hover:bg-card hover:text-text disabled:cursor-not-allowed disabled:opacity-30"
            >
              <MdKeyboardArrowDown size={16} />
            </button>
            <button
              type="button"
              title="Remover bloco"
              onClick={() => removeBlock(index)}
              className="shrink-0 rounded-md p-1.5 text-text-muted transition-colors hover:bg-card hover:text-danger"
            >
              <MdDelete size={16} />
            </button>
          </div>
          <textarea
            value={block.content}
            onChange={(e) => updateBlock(index, { content: e.target.value })}
            placeholder="Conteúdo do bloco..."
            className="min-h-20 w-full resize-none rounded-md border border-border bg-card px-2.5 py-1.5 text-[13px] text-text outline-none focus:border-primary"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addBlock}
        className="flex w-fit items-center gap-1 rounded-md border border-dashed border-border px-2.5 py-1.5 text-[12px] font-semibold text-text-sub transition-colors hover:border-orange hover:text-orange"
      >
        <MdAdd size={14} />
        Adicionar bloco
      </button>
    </div>
  );
}
