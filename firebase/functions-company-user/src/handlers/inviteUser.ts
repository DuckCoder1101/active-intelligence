import {z} from "zod";
import {FirebaseAuthError} from "firebase-admin/auth";
import {HttpsError} from "firebase-functions/https";
import {logger} from "firebase-functions";

import {onCallHandler, requireAccess, auth} from "functions-shared";
import {CompanyUserSchema} from "../data/company-user.schema";

const ACCESS = {
  minAccessLevel: "admin" as const,
};

export const inviteCompanyUserHandler = onCallHandler(async (req) => {
  requireAccess(req, ACCESS);

  const {success, data, error} = CompanyUserSchema.inviteUserSchema.safeParse(
    req.data,
  );

  if (!success) {
    throw new HttpsError(
      "invalid-argument",
      "Dados inválidos!",
      z.treeifyError(error),
    );
  }

  logger.info("inviteUser", {email: data.email, companyId: data.companyId});

  try {
    const userRecord = await auth.createUser({
      email: data.email,
      emailVerified: false,
    });

    await auth.setCustomUserClaims(userRecord.uid, {
      accessLevel: "user",
      companyId: data.companyId,
      complete: false,
    });
  } catch (err) {
    if (
      err instanceof FirebaseAuthError &&
      err.code === "auth/email-already-exists"
    ) {
      throw new HttpsError("already-exists", "Este e-mail já está cadastrado.");
    }
    throw err;
  }

  return true;
});
