import {setGlobalOptions} from "firebase-functions/options";

setGlobalOptions({maxInstances: 10, minInstances: 0});

export * from "./handlers/listTransactions";
export * from "./handlers/saveTransaction";
export * from "./handlers/markTransactionPaid";
export * from "./handlers/deleteTransaction";
export * from "./handlers/listCategories";
export * from "./handlers/saveCategory";
export * from "./handlers/listAccounts";
export * from "./handlers/saveAccount";
