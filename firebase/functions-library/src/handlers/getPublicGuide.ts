import { HttpsError } from "firebase-functions/https";
import { z } from "zod";

import { onCallHandler } from "functions-shared";
import { GuideRepository } from "../repositories/guide.repository";

const schema = z.object({ guideId: z.string().min(1) });

// Handler público: sem requireAccess/requireCompanyAccess de propósito — o
// link do guia é permanente e não exige login. A rota é segura porque
// GuideRepository.getPublic() só devolve o subconjunto de campos de leitura
// (GuideContentDTO), nunca assignedCompanyIds ou scriptPrompt.
export const getPublicGuideHandler = onCallHandler(async (req) => {
  const { success, data } = schema.safeParse(req.data);
  if (!success) {
    throw new HttpsError("invalid-argument", "guideId obrigatório");
  }

  return GuideRepository.getPublic(data.guideId);
});
