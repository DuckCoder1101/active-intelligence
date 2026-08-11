import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

import { buildExportSheetData } from './export.util';
import {
  LEGEND_SHEET_NAME,
  SHEET_NAME,
  type RealEstateSheetData,
} from './headers.util';
import { buildTemplateSheetData } from './template.util';

import type { RealEstate } from '@/models/real-estate.model';

const HEADER_FILL = 'FFFF6A00'; // marca: --orange (#ff6a00)
const INSTRUCTION_COLOR = 'FF6B7280';

async function writeXlsx(data: RealEstateSheetData): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(SHEET_NAME);

  const instructionRow = sheet.addRow([data.instructionText]);
  sheet.mergeCells(1, 1, 1, data.headers.length);
  instructionRow.height = 26;
  instructionRow.getCell(1).font = {
    italic: true,
    size: 10,
    color: { argb: INSTRUCTION_COLOR },
  };
  instructionRow.getCell(1).alignment = { vertical: 'middle', wrapText: true };

  const headerRow = sheet.addRow(data.headers);
  headerRow.height = 20;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: HEADER_FILL },
    };
    cell.alignment = { vertical: 'middle' };
  });

  data.dataRows.forEach((row) => sheet.addRow(row));

  data.headers.forEach((header, i) => {
    sheet.getColumn(i + 1).width = Math.min(Math.max(header.length + 2, 12), 32);
  });

  sheet.views = [{ state: 'frozen', ySplit: 2 }];

  if (data.referenceRows.length > 0) {
    const legendSheet = workbook.addWorksheet(LEGEND_SHEET_NAME);
    const legendHeader = legendSheet.addRow(['Coluna', 'Valores aceitos']);
    legendHeader.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: HEADER_FILL },
      };
    });
    data.referenceRows.forEach((row) => legendSheet.addRow(row));
    legendSheet.getColumn(1).width = 28;
    legendSheet.getColumn(2).width = 90;
    legendSheet.getColumn(2).alignment = { wrapText: true };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

function writeCsv(data: RealEstateSheetData): Blob {
  const instructionRowCells = [
    data.instructionText,
    ...Array(Math.max(data.headers.length - 1, 0)).fill(''),
  ];
  const sheet = XLSX.utils.aoa_to_sheet([
    instructionRowCells,
    data.headers,
    ...data.dataRows,
  ]);
  const csv = XLSX.utils.sheet_to_csv(sheet);
  // BOM garante que o Excel reconheça acentuação (UTF-8) ao reabrir o CSV.
  return new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
}

async function downloadSheetData(
  data: RealEstateSheetData,
  filename: string,
  format: 'xlsx' | 'csv',
): Promise<void> {
  const blob = format === 'csv' ? writeCsv(data) : await writeXlsx(data);
  saveAs(blob, `${filename}.${format}`);
}

export async function downloadRealEstateTemplate(
  format: 'xlsx' | 'csv' = 'xlsx',
): Promise<void> {
  await downloadSheetData(
    buildTemplateSheetData(),
    'modelo-importação-de-imóveis-guará',
    format,
  );
}

export async function downloadRealEstateExport(
  items: RealEstate[],
  format: 'xlsx' | 'csv',
): Promise<void> {
  await downloadSheetData(buildExportSheetData(items), 'imoveis', format);
}
