import { setGlobalOptions } from 'firebase-functions/options';

setGlobalOptions({ maxInstances: 10, minInstances: 0 });

export * from './handlers/listColumns';
export * from './handlers/saveColumn';
export * from './handlers/deleteColumn';
