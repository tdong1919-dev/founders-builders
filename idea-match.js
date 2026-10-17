/* Founders & Builders — idea-first, explainable community matching.
 * Uses existing read-only FBPlatform profile fetch. No third-party LLM, no fake people.
 * The intake is not stored or transmitted; matching happens in the browser.
 */
(function () {
  "use strict";
  var requestSequence = 0;
  var form = document.getElementById("ideaForm");
  if (!form || !window.FBPlatform) return;
  var TAXONOMY = [
    {id:"developer",label:"Technical builder",terms:["app","mobile","software","website","web","platform","mvp","saas","api","automation","code","developer","engineer","backend","frontend","tech","ai","machine learning"],aliases:["software","engineering","developer","development","javascript","react","python","full stack","web development","technical","automation","app development","machine learning"]},
    {id:"design",label:"Product & design",terms:["app","mobile","product","design","user","ux","ui","brand","prototype","experience","mvp"],aliases:["design","ux","ui","product","branding","figma","user experience","research","prototype"]},
    {id:"growth",label:"Growth & partnerships",terms:["customer","sales","sell","market","launch","restaurants","acquisition","community","marketing","growth","distribution","revenue","partners","users"],aliases:["marketing","sales","growth","business development","partnerships","community","seo","ads","acquisition","go to market"]},
    {id:"operations",label:"Business operations",terms:["business","operations","process","logistics","finance","legal","team","hire","supply","marketplace","fulfillment","execution"],aliases:["operations","finance","strategy","logistics","business","project management","operating","management","founder"]}
  ];
  function words(s){return String(s||"").toLowerCase().match(/[a-z0-9]+/g)||[];}
  function containsPhrase(text,phrase){var hay=" "+words(text).join(" ")+" ";var needle=" "+words(phrase).join(" ")+" ";return hay.indexOf(needle)!==-1;}
  function esc(s){return String(s||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
  function infer(text,selected) {
    var tokens = words(text), roles = TAXONOMY.map(function(r){
      var hits=r.terms.filter(function(t){return containsPhrase(text,t);});
      return {role:r,hits:hits,weight:hits.length+(selected===r.id?8:0)};
    }).sort(function(a,b){return b.weight-a.weight;});
    if(selected==="auto") return roles.filter(function(x){return x.weight>0;}).slice(0,3).length ? roles.filter(function(x){return x.weight>0;}).slice(0,3) : roles.slice(0,2);
    return roles.filter(function(x){return x.role.id===selected;}).concat(roles.filter(function(x){return x.role.id!==selected&&x.weight>1;}).slice(0,2));
  }
  function matchProfile(p,roles,location,arrangement){
    var status=String(p.moderationStatus||p.status||"").toLowerCase();
    if(status==="demo"||status==="hidden"||status==="rejected"||status==="spam"||status==="blocked"||status==="archived"||status==="deleted"||String(p._id||"").indexOf("demo")===0||!p.name) return null;
    var expertise=[p.skills,p.offers,p.canHelp,p.bio,p.building].join(" ").toLowerCase();
    var primary=[p.skills,p.offers,p.canHelp].join(" ").toLowerCase();
    var reasons=[], score=0;
    roles.forEach(function(item){
      var matches=item.role.aliases.filter(function(alias){return containsPhrase(primary,alias);});
      if(matches.length){score+=Math.min(28,matches.length*10)+(item.weight?5:0);reasons.push(item.role.label+": "+matches.slice(0,2).join(", "));}
      else if(item.role.aliases.some(function(alias){return containsPhrase(expertise,alias);})){score+=6;reasons.push("Mentions "+item.role.label.toLowerCase());}
    });
    var city=String(p.location||p.chapter||"").toLowerCase();
    var geo={dc:["washington","dc","maryland","virginia","dmv"],atlanta:["atlanta"],boise:["boise"],madison:["madison"]};
    if(location!=="any"){
      if((geo[location]||[]).some(function(term){return city.indexOf(term)!==-1;})){score+=10;reasons.push("Location preference");}
      else if(city&&city.indexOf("remote")===-1&&city.indexOf("virtual")===-1) score-=8;
    }
    var preferences=[p.lookingFor,p.needs,p.goals,p.bio].join(" ").toLowerCase();
    if(arrangement==="equity"&&/co-founder|cofounder|equity|partner/.test(preferences)){score+=8;reasons.push("Mentions co-founder/partner interest");}
    if(arrangement==="paid"&&/freelance|contract|consult|service/.test(preferences)){score+=5;reasons.push("Mentions paid services");}
    if(score<=0||!reasons.some(function(reason){return reason.indexOf("Location preference")===-1 && reason.indexOf("interest")===-1 && reason.indexOf("services")===-1;}))return null;
    return {p:p,score:score,reasons:reasons};
  }
  function buildMilestone(text,roles){
    var first=roles[0]&&roles[0].role.id;
    if(first==="developer")return "In the first 14 days, agree on the single most important user workflow, document acceptance criteria, and build a clickable or technical proof of concept.";
    if(first==="design")return "In the first 14 days, interview three potential users, outline the main user journey, and produce a testable prototype.";
    if(first==="growth")return "In the first 14 days, define an ideal customer profile, interview five prospects, and test one outreach channel with a measurable response goal.";
    return "In the first 14 days, define scope, owners and one measurable deliverable, then review what was completed together.";
  }
  form.addEventListener("submit",function(e){
    e.preventDefault();
    if(!form.reportValidity())return;
    var text=document.getElementById("idea").value, selected=document.getElementById("collaborator").value;
    var location=document.getElementById("location").value, arrangement=document.getElementById("arrangement").value;
    var roles=infer(text,selected), results=document.getElementById("results");
    var thisRequest = ++requestSequence;
    var milestone = buildMilestone(text,roles);
    document.getElementById("firstMilestone").textContent=milestone;
    document.getElementById("copyBrief").disabled=false;
    document.getElementById("copyBrief").onclick=function(){
      var brief="Founders & Builders — Private Project Brief\n\nProject: "+text+"\n\nSuggested roles: "+roles.map(function(x){return x.role.label;}).join(", ")+"\nPreferred arrangement: "+arrangement+"\nLocation: "+location+"\n\nFirst milestone: "+milestone+"\n\nShare only with people you trust. Confirm scope, ownership and compensation before work begins.";
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(brief).then(function(){document.getElementById("copyStatus").textContent="Copied to clipboard.";},function(){document.getElementById("copyStatus").textContent="Clipboard access unavailable. Select and copy your description manually.";});}
      else{document.getElementById("copyStatus").textContent="Clipboard unavailable in this browser.";}
    };
    results.hidden=false;document.getElementById("summary").textContent="Based on your description, these are potential capabilities to look for — not a validated staffing plan.";
    document.getElementById("roles").innerHTML=roles.map(function(x){return '<div class="match-role"><strong>'+esc(x.role.label)+'</strong><small>'+(x.hits.length?'Signals: '+esc(x.hits.slice(0,4).join(", ")):"Suggested based on your selected need")+'</small></div>';}).join("");
    document.getElementById("matchStatus").textContent="Searching current community profiles…";
    document.getElementById("matches").innerHTML="";
    results.scrollIntoView({behavior:"smooth",block:"start"});
    window.FBPlatform.fetchType("profile",function(err,list,isDemo){
      if(thisRequest!==requestSequence)return;
      var entries=(list||[]).map(function(p){return matchProfile(p,roles,location,arrangement);}).filter(Boolean).sort(function(a,b){return b.score-a.score;}).slice(0,12);
      if(isDemo||err){document.getElementById("matchStatus").textContent="Live member data is currently unavailable. We do not show sample profiles as real matches.";document.getElementById("matches").innerHTML='<div class="match-empty"><a class="match-link" href="profiles.html">Browse the member directory →</a></div>';return;}
      document.getElementById("matchStatus").textContent=entries.length+" relevant member profile"+(entries.length===1?"":"s")+" found. Ranking reflects profile keywords, not availability, commitment or verified compatibility.";
      if(!entries.length){document.getElementById("matches").innerHTML='<div class="match-empty"><strong>No strong matches yet.</strong><p>Try broader role or location preferences, explore the member directory, or invite a builder to join.</p><a class="match-link" href="profiles.html">Explore all members →</a></div>';return;}
      document.getElementById("matches").innerHTML=entries.map(function(m){
        var p=m.p, contact=String(p.email||"").trim(), mail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)?"mailto:"+encodeURIComponent(contact).replace("%40","@")+"?subject="+encodeURIComponent("Founders & Builders collaboration"):null;
        return '<article class="match-card"><h3>'+esc(p.name)+'</h3><p>'+esc([p.business,p.location].filter(Boolean).join(" · "))+'</p><p>'+esc(String(p.building||p.bio||"").slice(0,230))+'</p><div class="match-tags">'+m.reasons.slice(0,3).map(function(s){return "<span>"+esc(s)+"</span>";}).join("")+'</div>'+(mail?'<a class="match-action" href="'+esc(mail)+'">Contact member ↗</a>':'<a class="match-action" href="profiles.html">View member directory ↗</a>')+'<p class="match-note">Potential relevance only. Confirm mutual interest and working terms before collaborating.</p></article>';
      }).join("");
    });
  });
})();