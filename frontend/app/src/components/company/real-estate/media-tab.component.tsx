import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { MdAdd, MdDelete, MdStar, MdStarBorder } from 'react-icons/md';
import { toast } from 'react-toastify';

import type { FormValues } from './form.component';

import { FormInput } from '@/components/ui/form-input.component';
import { Spinner } from '@/components/ui/spinner.component';
import RealEstateService from '@/services/real-estate.service';

interface Props {
  companyId: string;
  realEstateId?: string;
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  pendingFiles: File[];
  onPendingFilesChange: (files: File[]) => void;
}

function PendingThumb({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div className="group relative aspect-square overflow-hidden rounded-md border border-dashed border-border">
      {url && (
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover opacity-70"
        />
      )}
      <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-semibold text-white">
        Pendente
      </span>
      <button
        type="button"
        onClick={onRemove}
        title="Remover"
        className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white"
      >
        <MdDelete size={14} />
      </button>
    </div>
  );
}

export function RealEstateMediaTab({
  companyId,
  realEstateId,
  photos,
  onPhotosChange,
  pendingFiles,
  onPendingFilesChange,
}: Props) {
  const { register, watch, setValue } = useFormContext<FormValues>();
  const [uploading, setUploading] = useState(false);
  const coverPhotoUrl = watch('coverPhotoUrl');

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }

    if (!realEstateId) {
      // Imóvel ainda não foi salvo — guarda os arquivos localmente e só
      // envia ao Storage quando o save retornar o id do documento.
      onPendingFilesChange([...pendingFiles, ...Array.from(files)]);
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const url = await RealEstateService.uploadImage(
          companyId,
          realEstateId,
          file,
        );
        uploaded.push(url);
      }
      const next = [...photos, ...uploaded];
      onPhotosChange(next);
      if (!coverPhotoUrl && next.length > 0) {
        setValue('coverPhotoUrl', next[0]);
      }
    } catch {
      toast.error('Falha ao enviar imagem.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (url: string) => {
    const next = photos.filter((p) => p !== url);
    onPhotosChange(next);
    if (coverPhotoUrl === url) {
      setValue('coverPhotoUrl', next[0] ?? '');
    }
  };

  const handleRemovePending = (file: File) => {
    onPendingFilesChange(pendingFiles.filter((f) => f !== file));
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.5px] text-text-sub">
          Fotos
        </p>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((url) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-md border border-border"
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setValue('coverPhotoUrl', url)}
                title="Definir como capa"
                className="absolute left-1 top-1 rounded-full bg-black/50 p-1 text-white"
              >
                {coverPhotoUrl === url ? (
                  <MdStar size={14} />
                ) : (
                  <MdStarBorder size={14} />
                )}
              </button>
              <button
                type="button"
                onClick={() => handleRemovePhoto(url)}
                title="Remover"
                className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white"
              >
                <MdDelete size={14} />
              </button>
            </div>
          ))}
          {pendingFiles.map((file, i) => (
            <PendingThumb
              key={`${file.name}-${i}`}
              file={file}
              onRemove={() => handleRemovePending(file)}
            />
          ))}
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-text-muted transition-colors hover:border-orange hover:text-orange">
            {uploading ? <Spinner size={16} /> : <MdAdd size={20} />}
            <span className="text-[11px]">Adicionar</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleSelect}
              disabled={uploading}
            />
          </label>
        </div>
        {pendingFiles.length > 0 && (
          <p className="mt-2 text-[11px] text-text-muted">
            As fotos pendentes serão enviadas ao salvar o imóvel.
          </p>
        )}
      </div>

      <FormInput label="Vídeo (URL)" {...register('videoUrl')} />
      <FormInput label="Tour virtual 360° (URL)" {...register('tourUrl')} />
    </div>
  );
}
