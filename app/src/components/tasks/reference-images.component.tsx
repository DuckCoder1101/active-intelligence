import { useRef, useState } from 'react';
import { MdAdd, MdClose, MdImage } from 'react-icons/md';

import { Spinner } from '@/components/ui/spinner.component';
import TaskService from '@/services/task.service';
import { useHandleError } from '@/hooks/useHandleError.util';

interface ReferenceImagesProps {
  images: string[];
  onChange?: (images: string[]) => void;
  /** Files staged locally before task is saved (create mode). */
  pendingFiles?: File[];
  onPendingFilesChange?: (files: File[]) => void;
  /** Required for immediate upload (edit mode). */
  companyId?: string;
  taskId?: string;
  readonly?: boolean;
}

export function ReferenceImages({
  images,
  onChange,
  pendingFiles,
  onPendingFilesChange,
  companyId,
  taskId,
  readonly = false,
}: ReferenceImagesProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const handleError = useHandleError();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Create mode — no taskId yet: stage files locally
    if (!taskId && onPendingFilesChange) {
      onPendingFilesChange([...(pendingFiles ?? []), ...Array.from(files)]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Edit mode — upload immediately
    if (!companyId || !taskId || !onChange) return;
    setUploading(true);
    try {
      const urls = await Promise.all(
        Array.from(files).map((f) => TaskService.uploadImage(companyId, taskId, f)),
      );
      onChange([...images, ...urls]);
    } catch (err) {
      handleError(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const remove = (i: number) => onChange?.(images.filter((_, j) => j !== i));
  const removePending = (i: number) =>
    onPendingFilesChange?.((pendingFiles ?? []).filter((_, j) => j !== i));

  const canUpload = !!taskId || !!onPendingFilesChange;

  if (readonly) {
    if (images.length === 0) return null;
    return (
      <div>
        <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-text-sub">
          <MdImage size={14} />
          Imagens de referência
        </p>
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noreferrer">
              <img
                src={url}
                alt={`ref-${i}`}
                className="aspect-square w-full rounded-lg border border-border object-cover"
              />
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-text-sub">
        <MdImage size={14} />
        Imagens de referência
      </p>
      <div className="grid grid-cols-3 gap-2">
        {/* Uploaded images */}
        {images.map((url, i) => (
          <div key={i} className="group relative aspect-square">
            <img
              src={url}
              alt={`ref-${i}`}
              className="h-full w-full rounded-lg border border-border object-cover"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-1 top-1 hidden rounded-full bg-black/60 p-0.5 text-white group-hover:flex"
            >
              <MdClose size={12} />
            </button>
          </div>
        ))}

        {/* Staged files (pending upload) */}
        {(pendingFiles ?? []).map((file, i) => (
          <div key={`p${i}`} className="group relative aspect-square">
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-orange/40 bg-orange/5">
              <MdImage size={18} className="text-orange/60" />
              <span className="line-clamp-2 px-1 text-center text-[9px] text-orange/70">
                {file.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => removePending(i)}
              className="absolute right-1 top-1 hidden rounded-full bg-black/60 p-0.5 text-white group-hover:flex"
            >
              <MdClose size={12} />
            </button>
          </div>
        ))}

        {/* Upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !canUpload}
          className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-border text-text-muted transition-colors hover:border-orange hover:text-orange disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? <Spinner size={16} /> : <MdAdd size={22} />}
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
