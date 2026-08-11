import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions";
import { z } from "zod";

import { onCallHandler, requireCompanyAccess } from "functions-shared";
import RealEstateSchema from "../data/real-estate.schema";
import { RealEstateRepository } from "../repositories/real-estate.repository";

const bodySchema = z.object({
  companyId: z.string().min(1, "companyId obrigatório"),
  rows: z
    .array(RealEstateSchema.importRowSchema)
    .min(1, "Envie ao menos uma linha")
    .max(200, "Máximo de 200 linhas por importação"),
});

type ImportRowResult = {
  rowNumber: number;
  code?: string;
  status: "created" | "updated" | "error";
  message?: string;
};

const CONCURRENCY = 20;

async function processRow(
  companyId: string,
  uid: string,
  row: z.infer<typeof RealEstateSchema.importRowSchema>,
): Promise<ImportRowResult> {
  const { rowNumber, code, ...data } = row;

  try {
    if (code) {
      const existing = await RealEstateRepository.findByCode(companyId, code);
      if (!existing) {
        return {
          rowNumber,
          code,
          status: "error",
          message: `Código "${code}" não encontrado — linha não foi importada.`,
        };
      }
      const saved = await RealEstateRepository.save(companyId, uid, {
        ...data,
        companyId,
        realEstateId: existing.realEstateId,
      });
      return { rowNumber, code: saved.code, status: "updated" };
    }

    const saved = await RealEstateRepository.save(companyId, uid, {
      ...data,
      companyId,
    });
    return { rowNumber, code: saved.code, status: "created" };
  } catch (err) {
    logger.error("importRealEstate row failed", { rowNumber, err });
    return {
      rowNumber,
      code,
      status: "error",
      message:
        err instanceof HttpsError
          ? err.message
          : "Erro inesperado ao salvar esta linha.",
    };
  }
}

/**
 * Bulk create/update de imóveis a partir de uma planilha já parseada no
 * cliente. Auth: `requireCompanyAccess(req, companyId, "aos imóveis")`.
 */
export const importRealEstateHandler = onCallHandler(
  async (req) => {
    const { success, data, error } = bodySchema.safeParse(req.data);
    if (!success) {
      throw new HttpsError(
        "invalid-argument",
        error.issues.map((i) => i.message).join(", "),
      );
    }

    const { uid, companyId } = requireCompanyAccess(
      req,
      data.companyId,
      "aos imóveis",
    );

    logger.info("importRealEstate", { companyId, rows: data.rows.length });

    const results: ImportRowResult[] = [];
    for (let i = 0; i < data.rows.length; i += CONCURRENCY) {
      const batch = data.rows.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map((row) => processRow(companyId, uid, row)),
      );
      results.push(...batchResults);
    }

    return {
      created: results.filter((r) => r.status === "created").length,
      updated: results.filter((r) => r.status === "updated").length,
      failed: results.filter((r) => r.status === "error").length,
      results,
    };
  },
  { timeoutSeconds: 120 },
);
