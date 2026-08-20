import { setGlobalOptions } from "firebase-functions/options";

setGlobalOptions({ maxInstances: 10, minInstances: 0 });

export * from "./handlers/connectFacebookAds";
export * from "./handlers/disconnectFacebookAds";
export * from "./handlers/getFacebookAdsSettings";
export * from "./handlers/selectFacebookAdAccount";
export * from "./handlers/getMarketingDashboard";
export * from "./triggers/syncFacebookAdsInsights.scheduler";
