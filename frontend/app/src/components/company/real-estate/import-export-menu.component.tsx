import { useRef, useState } from 'react';
import {
  MdFileDownload,
  MdFileUpload,
  MdOutlineDescription,
} from 'react-icons/md';
import { toast } from 'react-toastify';

import { ImportPreviewModal, type ImportPreviewRow } from './import-preview-modal.component';

import { DropdownMenu } from '@/components/ui/dropdown-menu.component';
import { useExportRealEstateMutation } from '@/queries/real-estate.queries';
import {
  downloadRealEstateExport,
  downloadRealEstateTemplate,
  mapRowToImportInput,
  parseSpreadsheetFile,
} from '@/utils/real-estate-spreadsheet';

interface ImportExportMenuProps {
  companyId: string;
}

export function ImportExportMenu({ companyId }: ImportExportMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[] | null>(
    null,
  );
  const exportMutation = useExportRealEstateMutation(companyId);

  const handleDownloadTemplate = () => {
    void downloadRealEstateTemplate('xlsx');
  };

  const handleExport = async (format: 'xlsx' | 'csv') => {
    try {
      const items = await exportMutation.mutateAsync();
      if (items.length === 0) {
        toast.error('Não há imóveis para exportar.');
        return;
      }
      await downloadRealEstateExport(items, format);
    } catch {
      toast.error('Não foi possível exportar os imóveis.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) {
      return;
    }

    try {
      const rawRows = await parseSpreadsheetFile(file);
      if (rawRows.length === 0) {
        toast.error('A planilha não tem nenhuma linha de dados.');
        return;
      }
      // Linha 1 da planilha é o cabeçalho, então a primeira linha de dados é a 2.
      const parsed = rawRows.map((row, i) => {
        const { input, errors } = mapRowToImportInput(row, i + 2);
        return { rowNumber: i + 2, input, errors };
      });
      setPreviewRows(parsed);
    } catch {
      toast.error(
        'Não foi possível ler o arquivo. Confira se é um .xlsx, .xls ou .csv válido.',
      );
    }
  };

  return (
    <>
      <DropdownMenu
        label="Planilha"
        icon={MdOutlineDescription}
        items={[
          {
            label: 'Baixar modelo',
            icon: MdOutlineDescription,
            onClick: handleDownloadTemplate,
          },
          {
            label: 'Importar (.xlsx ou .csv)',
            icon: MdFileUpload,
            onClick: () => fileInputRef.current?.click(),
          },
          {
            label: 'Exportar (.xlsx)',
            icon: MdFileDownload,
            disabled: exportMutation.isPending,
            onClick: () => void handleExport('xlsx'),
          },
          {
            label: 'Exportar (.csv)',
            icon: MdFileDownload,
            disabled: exportMutation.isPending,
            onClick: () => void handleExport('csv'),
          },
        ]}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {previewRows && (
        <ImportPreviewModal
          companyId={companyId}
          rows={previewRows}
          onClose={() => setPreviewRows(null)}
        />
      )}
    </>
  );
}
