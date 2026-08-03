import { setGlobalOptions } from "firebase-functions/options";

setGlobalOptions({ maxInstances: 10, minInstances: 0 });

export * from "./handlers/listPlans";
export * from "./handlers/savePlan";
export * from "./handlers/deletePlan";
