import { AdminAccessLevel } from "../../types/accessLevel.type";

export const AdminAccessLevels = [
  "owner",
  "admin",
] as const satisfies AdminAccessLevel[];
