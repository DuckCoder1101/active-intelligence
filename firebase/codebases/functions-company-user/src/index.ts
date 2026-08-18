import { setGlobalOptions } from "firebase-functions/options";

setGlobalOptions({ maxInstances: 10, minInstances: 0 });

export { listCompanyUsersHandler } from "./handlers/listUsers";
export { inviteCompanyUserHandler } from "./handlers/inviteUser";
