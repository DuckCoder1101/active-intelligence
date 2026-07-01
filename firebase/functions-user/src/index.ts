import { setGlobalOptions } from 'firebase-functions/options';

setGlobalOptions({ maxInstances: 10, minInstances: 0 });

export * from './handlers/getMe';
export * from './handlers/completeProfile';
export * from './handlers/updateProfile';
export * from './handlers/deleteAccount';
// export * from './triggers/deleteInactiveUsers.scheduler';
