import { setGlobalOptions } from "firebase-functions/options";

setGlobalOptions({ maxInstances: 10, minInstances: 0 });

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

export * from "./handlers/savePersonalTask";
export * from "./handlers/deletePersonalTask";
export * from "./handlers/listPersonalTasks";

export * from "./handlers/listTaskCategories";
export * from "./handlers/saveTaskCategory";
export * from "./handlers/deleteTaskCategory";
export * from "./handlers/saveTaskSubcategory";
export * from "./handlers/deleteTaskSubcategory";

export * from "./handlers/listTaskTags";
export * from "./handlers/saveTaskTag";
export * from "./handlers/deleteTaskTag";
