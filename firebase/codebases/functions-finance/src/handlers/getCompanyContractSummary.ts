import { HttpsError } from "firebase-functions/https";
import { z } from "zod";

import { CompanyRepository, onCallHandler, requireAccess } from "functions-shared";
import { SubcategoryRepository } from "../repositories/subcategory.repository";

const ACCESS = {
  minAccessLevel: "admin" as const,
  permissions: ["manage-finance" as const],
};

const schema = z.object({
  companyId: z.string().min(1, "companyId obrigatório"),
});

/** Nome/categoria da subcategoria que representa cada tipo de contrato — criada sob demanda. */
const CONTRACT_SUBCATEGORY = {
  mrr: { category: "receitaRecorrente" as const, name: "MRR" },
  tcv: { category: "receitaPontual" as const, name: "TCV" },
};

/**
 * Resume o contrato (financial) de uma empresa pra prefill do modal de Contas a Receber —
 * cria a subcategoria "MRR"/"TCV" sob demanda se ainda não existir.
 * Auth: requireAccess(req, {minAccessLevel:"admin", permissions:["manage-finance"]}).
 * Schema: inline z.object({companyId}).
 */
export const getCompanyContractSummaryHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const { success, data, error } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      error.issues.map((i) => i.message).join(", "),
    );
  }

  const company = await CompanyRepository.getCompanyById(data.companyId);
  const contractType = company.financial?.contractType;
  if (!contractType) {
    throw new HttpsError(
      "failed-precondition",
      "Empresa não tem contrato cadastrado.",
    );
  }

  const target = CONTRACT_SUBCATEGORY[contractType];
  const subcategory = await SubcategoryRepository.findOrCreate(
    target.category,
    target.name,
  );

  return {
    companyId: data.companyId,
    displayName: company.displayName,
    contractType,
    category: target.category,
    subcategoryId: subcategory.subcategoryId,
    subcategoryName: subcategory.name,
    mrr: company.financial?.mrr,
    tcv: company.financial?.tcv,
  };
});
