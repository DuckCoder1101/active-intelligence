import { useState } from 'react';
import { MdAdd, MdClose, MdLink, MdOpenInNew } from 'react-icons/md';

interface ReferenceLinksProps {
  links: string[];
  onChange?: (links: string[]) => void;
  readonly?: boolean;
}

export function ReferenceLinks({ links, onChange, readonly = false }: ReferenceLinksProps) {
  const [input, setInput] = useState('');

  const add = () => {
    const v = input.trim();
    if (!v || !onChange) {return;}
    const url = v.startsWith('http') ? v : `https://${v}`;
    onChange([...links, url]);
    setInput('');
  };

  const remove = (i: number) => {
    onChange?.(links.filter((_, j) => j !== i));
  };

  if (readonly) {
    if (links.length === 0) {return null;}
    return (
      <div>
        <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-text-sub">
          <MdLink size={14} />
          Links de referência
        </p>
        <div className="space-y-1">
          {links.map((link, i) => (
            <a
              key={i}
              href={link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 truncate text-[12px] text-orange hover:underline"
            >
              <MdOpenInNew size={12} />
              {link}
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-text-sub">
        <MdLink size={14} />
        Links de referência
      </p>
      <div className="mb-2 flex gap-2">
        <input
          type="url"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="https://..."
          className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-[13px] text-text placeholder-text-muted outline-none focus:border-orange"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-lg border border-border px-3 py-2 text-[13px] text-text-sub transition-colors hover:bg-bg"
        >
          <MdAdd size={16} />
        </button>
      </div>
      <div className="space-y-1.5">
        {links.map((link, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2">
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="flex-1 truncate text-[12px] text-primary hover:underline"
            >
              {link}
            </a>
            <button
              type="button"
              onClick={() => remove(i)}
              className="shrink-0 text-text-muted hover:text-danger"
            >
              <MdClose size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
