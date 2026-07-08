import {setGlobalOptions} from "firebase-functions/options";

setGlobalOptions({maxInstances: 10, minInstances: 0});

export * from "./handlers/saveLead";
export * from "./handlers/listLeads";
export * from "./handlers/deleteLead";
export * from "./handlers/updateLeadStatus";

export * from "./handlers/listTags";
export * from "./handlers/saveTag";
export * from "./handlers/deleteTag";

export * from "./handlers/listOrigins";
export * from "./handlers/saveOrigin";
export * from "./handlers/deleteOrigin";

export * from "./handlers/listCrmColumns";
export * from "./handlers/saveCrmColumn";
export * from "./handlers/deleteCrmColumn";

export * from "./handlers/listMyCompanyUsers";
