"""Generate consistent metadata for the current hosted origin; rerun for a final domain."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import argparse,re,json,html
root=Path(__file__).resolve().parent.parent
args=argparse.ArgumentParser();args.add_argument('--site-url',default='https://founders-builders-ux-review.hello978822.chatgpt.site');opts=args.parse_args();u=urlsplit(opts.site_url)
if u.scheme!='https' or not u.netloc or u.path not in ('','/') or u.query or u.fragment:raise SystemExit('Use an HTTPS origin without path, query or fragment.')
origin=opts.site_url.rstrip('/')
public={'index.html','about.html','for-founders.html','for-builders.html','questions.html','beta-access.html','community.html','projects.html','profiles.html','learn-by-building.html','connect-agent.html','quick-tour.html','resources.html','mentors.html','business.html','calendar.html','chapters.html','jobs.html','marketplace.html','podcasts.html','funding.html','help.html','collaborate.html','privacy.html','terms.html','guidelines.html'}
# No private content, form submissions, personal dashboards, experiments or internal search in sitemap.
class Text(HTMLParser):
 def __init__(self):super().__init__();self.h1=False;self.title=False;self.h=[];self.t=[]
 def handle_starttag(self,t,a):
  if t=='h1':self.h1=True
  if t=='title':self.title=True
 def handle_endtag(self,t):
  if t=='h1':self.h1=False
  if t=='title':self.title=False
 def handle_data(self,s):
  if self.h1:self.h.append(s.strip())
  if self.title:self.t.append(s.strip())
for p in root.glob('*.html'):
 s=p.read_text();t=Text();t.feed(s);title=' '.join(t.t);m=re.search(r'<meta\s+name="description"\s+content="([^"]*)"[^>]*>',s,re.I);description=html.unescape(m[1]) if m else (' '.join(t.h)+'. Founders & Builders private beta.')
 if not title:raise SystemExit('Missing title: '+p.name)
 path='/' if p.name in ('index.html','journey-concept.html') else '/'+p.name
 canonical=origin+path
 s=re.sub(r'<meta\b[^>]*(?:name="robots"|property="og:[^"]*"|name="twitter:[^"]*")[^>]*>','',s,flags=re.I)
 s=re.sub(r'<link\b[^>]*rel="canonical"[^>]*>','',s,flags=re.I)
 if not m:s=s.replace('</title>','</title><meta name="description" content="'+html.escape(description,quote=True)+'">',1)
 tags={'og:type':'website','og:site_name':'Founders & Builders','og:title':title,'og:description':description,'og:url':canonical,'og:image':origin+'/social-card.png','og:image:width':'1200','og:image:height':'630','og:image:alt':'Nothing great is ever built overnight. Or alone. Founders & Builders.'}
 meta='<link rel="canonical" href="'+html.escape(canonical,quote=True)+'"><meta name="robots" content="'+('index,follow' if p.name in public or p.name=='journey-concept.html' else 'noindex,follow')+'">'
 meta+=''.join('<meta property="'+k+'" content="'+html.escape(v,quote=True)+'">' for k,v in tags.items())+'<meta name="twitter:card" content="summary">'
 # Accurate entity data only; never mark up fictional people, ratings, jobs or events as real.
 if p.name in ('index.html','about.html'):
  s=re.sub(r'<script\b[^>]*type="application/ld\+json"[^>]*>[\s\S]*?</script>','',s)
  data={'@context':'https://schema.org','@graph':[{'@type':'Organization','@id':origin+'/#organization','name':'Founders & Builders','url':origin+'/'},{'@type':'WebSite','@id':origin+'/#website','name':'Founders & Builders','url':origin+'/','publisher':{'@id':origin+'/#organization'}}]}
  meta+='<script type="application/ld+json">'+json.dumps(data,separators=(',',':')).replace('<','\\u003c')+'</script>'
 elif p.name in public:
  s=re.sub(r'<script\b[^>]*type="application/ld\+json"[^>]*>[\s\S]*?</script>','',s)
  data={'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Founders & Builders','item':origin+'/'},{'@type':'ListItem','position':2,'name':title.split(' · ')[0],'item':canonical}]}
  meta+='<script type="application/ld+json">'+json.dumps(data,separators=(',',':')).replace('<','\\u003c')+'</script>'
 elif p.name not in public:s=re.sub(r'<script\b[^>]*type="application/ld\+json"[^>]*>[\s\S]*?</script>','',s)
 s=s.replace('</head>',meta+'</head>',1);p.write_text(s)
# This legacy route redirects on the hosted Worker and retains a working static fallback.
(root/'journey-concept.html').write_text((root/'index.html').read_text())
urls=[origin+('/' if n=='index.html' else '/'+n) for n in sorted(public)]+[origin+'/opportunities/',origin+'/builders/']
(root/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join('<url><loc>'+html.escape(url)+'</loc></url>\n' for url in urls)+'</urlset>\n')
(root/'robots.txt').write_text('User-agent: *\nAllow: /\n\n# Indexing is controlled per page; private access is enforced by authentication.\nSitemap: '+origin+'/sitemap.xml\n')
print(f'{len(list(root.glob("*.html")))} pages: canonical, robots, descriptions and sharing metadata generated; {len(urls)} public sitemap URLs.')
