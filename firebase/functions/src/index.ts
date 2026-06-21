import { setGlobalOptions } from 'firebase-functions/options';

setGlobalOptions({ maxInstances: 10 });

export * from './user';
export * from './company';
export * from './membership';
