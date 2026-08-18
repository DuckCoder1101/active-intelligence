import { setGlobalOptions } from "firebase-functions/options";

setGlobalOptions({ maxInstances: 10, minInstances: 0 });

export * from "./handlers/listTransactions";
export * from "./handlers/saveTransaction";
export * from "./handlers/markTransactionPaid";
export * from "./handlers/unmarkTransactionPaid";
export * from "./handlers/deleteTransaction";
export * from "./handlers/listSubcategories";
export * from "./handlers/saveSubcategory";
export * from "./handlers/deleteSubcategory";
export * from "./handlers/listAccounts";
export * from "./handlers/saveAccount";
export * from "./handlers/deleteAccount";
export * from "./handlers/getAsaasSettings";
export * from "./handlers/saveAsaasSettings";
export * from "./handlers/getCompanyContractSummary";
