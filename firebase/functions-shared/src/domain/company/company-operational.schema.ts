import { z } from "zod";

export default class CompanyOperationalSchema {
  static saveSchema = z.object({
    companyId: z.string().min(1),

    driveUrl: z
      .string()
      .trim()
      .nullish()
      .transform((v) => v || undefined)
      .pipe(z.string().url("Link do Drive inválido!").optional()),

    metaAdsAccountId: z
      .string()
      .trim()
      .nullish()
      .transform((v) => v || undefined),

    metaApiKey: z
      .string()
      .trim()
      .nullish()
      .transform((v) => v || undefined),

    responsibleUids: z
      .object({
        cronograma: z
          .string()
          .nullish()
          .transform((v) => v || undefined),
        campanhas: z
          .string()
          .nullish()
          .transform((v) => v || undefined),
        cs: z
          .string()
          .nullish()
          .transform((v) => v || undefined),
      })
      .nullish()
      .transform((v) => v ?? undefined),
  });
}
