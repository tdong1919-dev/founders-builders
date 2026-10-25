/* Deployment composition only: never starts a server or connects to an account on import. */
import {openStore,createSharedService,supabaseSessionVerifier} from './shared-service.mjs';
export function configuredService({databasePath,origin,supabaseUrl,publishableKey,fetcher}){
 const base=new URL(origin);if(base.protocol!=='https:'||base.origin!==origin)throw Error('A same-origin HTTPS API deployment is required.');
 if(!databasePath||databasePath===':memory:')throw Error('A private persistent database path is required.');
 const verifySession=supabaseSessionVerifier({url:supabaseUrl,publishableKey,fetcher});const store=openStore(databasePath);
 return {service:createSharedService({store,origin,verifySession}),close:()=>store.close()};
}
