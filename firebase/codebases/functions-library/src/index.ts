import { setGlobalOptions } from "firebase-functions/options";

setGlobalOptions({ maxInstances: 10, minInstances: 0 });

export * from "./handlers/listGuides";
export * from "./handlers/getGuide";
export * from "./handlers/saveGuide";
export * from "./handlers/deleteGuide";
export * from "./handlers/getNextGuideSequence";

export * from "./handlers/listAssignedGuides";
export * from "./handlers/getAssignedGuide";

export * from "./handlers/getPublicGuide";
