import {setGlobalOptions} from "firebase-functions/options";

setGlobalOptions({maxInstances: 10, minInstances: 0});

export * from "./handlers/listOperationalKanbanColumns";
export * from "./handlers/saveOperationalKanbanColumn";
export * from "./handlers/deleteOperationalKanbanColumn";
