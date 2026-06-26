import { setGlobalOptions } from 'firebase-functions/options';

setGlobalOptions({ maxInstances: 10 });

export * from './admin';
export * from './user';
export * from './company';
export * from './company-user';
export * from './task';
export * from './kanban';
