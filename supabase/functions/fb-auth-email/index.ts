import {Webhook} from 'npm:standardwebhooks@1.0.0';
import {createAuthEmail} from './handler.mjs';
Deno.serve(createAuthEmail({Webhook,secret:Deno.env.get('FB_AUTH_HOOK_SECRET'),apiKey:Deno.env.get('FB_AUTH_RESEND_API_KEY'),projectUrl:Deno.env.get('SUPABASE_URL')}));
