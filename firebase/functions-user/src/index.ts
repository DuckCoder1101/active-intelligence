import {setGlobalOptions} from "firebase-functions/options";

setGlobalOptions({maxInstances: 10, minInstances: 0});

export * from "./handlers/getMe";
export * from "./handlers/completeProfile";
export * from "./handlers/updateProfile";
export * from "./handlers/deleteAccount";
export * from "./handlers/registerFcmToken";
export * from "./handlers/unregisterFcmToken";
export * from "./handlers/listNotifications";
export * from "./handlers/markNotificationRead";
export * from "./handlers/getUnreadNotificationCount";
// export * from './triggers/deleteInactiveUsers.scheduler';
