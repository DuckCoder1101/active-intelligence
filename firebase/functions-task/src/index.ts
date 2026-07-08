import {setGlobalOptions} from "firebase-functions/options";

setGlobalOptions({maxInstances: 10, minInstances: 0});

export * from "./handlers/saveTask";
export * from "./handlers/updateTaskStatus";
export * from "./handlers/listTasks";
export * from "./handlers/getTask";
export * from "./handlers/deleteTask";
export * from "./handlers/createClientTask";
export * from "./handlers/listClientTasks";
export * from "./handlers/listCalendarTasks";
export * from "./handlers/updateClientTaskImages";
export * from "./handlers/approveClientTask";
export * from "./triggers/deleteOldTaskMedia";
