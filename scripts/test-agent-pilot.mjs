/* Run with a credential injected by your own secret manager, never as a command argument. Prints status/ID only. */
import {createPilotClient} from '../agent-pilot-client.mjs';
const [operation,id]=process.argv.slice(2),credential=process.env.FB_AGENT_CREDENTIAL||'';delete process.env.FB_AGENT_CREDENTIAL;
const client=createPilotClient({credential});
try{
 if(operation==='discover'){await client.discover();console.log('Verified Founders & Builders A2A 1.0 owner-handoff interface.');}
 else if(operation==='send'){if(!id)throw Error('Supply a unique message UUID. Reuse it for the same send retry.');const task=await client.send({messageId:id,text:'Connection check: which small outcome should I prioritize?'});console.log(JSON.stringify({taskId:task.id,state:task.status.state,next:'Respond in your signed-in workspace, then run get with this task ID.'}));}
 else if(operation==='get'||operation==='cancel'){const task=await client[operation](id);console.log(JSON.stringify({taskId:task.id,state:task.status.state,hasOwnerResponse:Boolean(task.artifacts?.length)}));}
 else throw Error('Usage: node scripts/test-agent-pilot.mjs discover | send <message-UUID> | get <task-ID> | cancel <task-ID>. Inject FB_AGENT_CREDENTIAL through secret settings.');
}catch(error){console.error(error.message);process.exitCode=1;}finally{client.close();}
