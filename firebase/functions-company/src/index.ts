import {setGlobalOptions} from "firebase-functions/options";

setGlobalOptions({maxInstances: 10, minInstances: 0});

export * from "./handlers/listCompanies";
export * from "./handlers/getCompany";
export * from "./handlers/saveCompany";
export * from "./handlers/deleteCompany";
export * from "./handlers/listAuditLogs";
