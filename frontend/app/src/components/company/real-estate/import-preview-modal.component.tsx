import { useState } from 'react';
import { MdCheckCircle, MdErrorOutline } from 'react-icons/md';
import { toast } from 'react-toastify';

import { Modal } from '@/components/layout/modal.component';
import { Spinner } from '@/components/ui/spinner.component';
import { useImportRealEstateMutation } from '@/queries/real-estate.queries';
import type {
  ImportRealEstateResult,
  ImportRealEstateRow,
} from '@/utils/real-estate-spreadsheet';

export interface ImportPreviewRow {
  rowNumber: number;
  input?: ImportRealEstateRow;
  errors: string[];
}

interface ImportPreviewModalProps {
  companyId: string;
  rows: ImportPreviewRow[];
  onClose: () => void;
}

export function ImportPreviewModal({
  companyId,
  rows,
  onClose,
}: ImportPreviewModalProps) {
  const importMutation = useImportRealEstateMutation(companyId);
  const [result, setResult] = useState<ImportRealEstateResult | null>(null);

  const validRows = rows.filter(
    (r): r is ImportPreviewRow & { input: ImportRealEstateRow } => !!r.input,
  );
  const invalidRows = rows.filter((r) => !r.input);

  const handleConfirm = async () => {
    try {
      const res = await importMutation.mutateAsync(
        validRows.map((r) => r.input),
      );
      setResult(res);
    } catch {
      toast.error('Não foi possível importar a planilha.');
    }
  };

  if (result) {
    const errorResults = result.results.filter((r) => r.status === 'error');

    return (
      <Modal title="Resultado da importação" onClose={onClose} width="max-w-lg">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-bg p-3">
              <p className="text-lg font-black text-text">{result.created}</p>
              <p className="text-[11px] text-text-sub">Criados</p>
            </div>
            <div className="rounded-lg bg-bg p-3">
              <p className="text-lg font-black text-text">{result.updated}</p>
              <p className="text-[11px] text-text-sub">Atualizados</p>
            </div>
            <div className="rounded-lg bg-bg p-3">
              <p className="text-lg font-black text-danger">{result.failed}</p>
              <p className="text-[11px] text-text-sub">Falharam</p>
            </div>
          </div>

          {errorResults.length > 0 && (
            <div className="max-h-52 overflow-y-auto rounded-lg border border-border">
              {errorResults.map((r) => (
                <div
                  key={r.rowNumber}
                  className="flex items-start gap-2 border-b border-border px-3 py-2 text-[12px] last:border-b-0"
                >
                  <MdErrorOutline
                    size={14}
                    className="mt-0.5 shrink-0 text-danger"
                  />
                  <span className="text-text-sub">
                    Linha {r.rowNumber}: {r.message}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="btn-primary">
              Fechar
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Confirmar importação"
      onClose={onClose}
      width="max-w-lg"
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={validRows.length === 0 || importMutation.isPending}
            className="btn-primary"
          >
            {importMutation.isPending && <Spinner size={12} />}
            Confirmar importação ({validRows.length})
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4 text-[13px]">
          <span className="flex items-center gap-1.5 font-semibold text-text">
            <MdCheckCircle size={16} className="text-success" />
            {validRows.length} linha(s) válida(s)
          </span>
          {invalidRows.length > 0 && (
            <span className="flex items-center gap-1.5 font-semibold text-danger">
              <MdErrorOutline size={16} />
              {invalidRows.length} linha(s) com erro
            </span>
          )}
        </div>

        {invalidRows.length > 0 && (
          <div className="max-h-52 overflow-y-auto rounded-lg border border-border">
            {invalidRows.map((r) => (
              <div
                key={r.rowNumber}
                className="border-b border-border px-3 py-2 text-[12px] last:border-b-0"
              >
                <p className="font-semibold text-text">Linha {r.rowNumber}</p>
                <ul className="mt-0.5 list-disc pl-4 text-text-sub">
                  {r.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <p className="text-[12px] text-text-sub">
          Linhas com erro não serão importadas. Corrija-as na planilha e
          reimporte se necessário.
        </p>
      </div>
    </Modal>
  );
}
