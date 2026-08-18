import { setGlobalOptions } from "firebase-functions/options";

setGlobalOptions({ maxInstances: 10, minInstances: 0 });

export * from "./handlers/submitReview";
export * from "./handlers/listReviews";
export * from "./handlers/deleteReview";
