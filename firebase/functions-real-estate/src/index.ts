import { setGlobalOptions } from "firebase-functions/options";

setGlobalOptions({ maxInstances: 10, minInstances: 0 });

export * from "./handlers/saveRealEstate";
export * from "./handlers/listRealEstate";
export * from "./handlers/updateRealEstateStatus";
export * from "./handlers/deleteRealEstate";
