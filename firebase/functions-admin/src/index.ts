import {setGlobalOptions} from "firebase-functions/options";

setGlobalOptions({maxInstances: 10, minInstances: 0});

export * from "./handlers/listAdmins";
export * from "./handlers/updateAdminPermissions";
export * from "./handlers/updateAdminAccessLevel";
export * from "./handlers/inviteAdmin";
