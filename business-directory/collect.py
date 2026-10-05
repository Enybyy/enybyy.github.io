from pathlib import Path
import urllib.request, urllib.parse, re, html, json, csv, base64, io
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from PIL import Image

ROOT=Path(__file__).parent
ROOT.mkdir(parents=True,exist_ok=True)
(ROOT/'images').mkdir(exist_ok=True)
SOURCE='https://www.djangoproject.com/foundation/corporate-members/'
STAMP=datetime.now(timezone.utc).isoformat(timespec='seconds')
def get(url):
    req=urllib.request.Request(url,headers={'User-Agent':'BusinessDirectoryResearch/1.0 (public company information)'})
    with urllib.request.urlopen(req,timeout=12) as r:
        return r.read(3000000),r.geturl(),r.status
def plain(s):
    return ' '.join(html.unescape(re.sub('<[^>]+>',' ',s)).split())
def attr(tag,key):
    m=re.search(r'\b'+key+r'\s*=\s*(["\x27])(.*?)\1',tag,re.I|re.S)
    return html.unescape(m.group(2)) if m else ''
raw,_,_=get(SOURCE)
(ROOT/'source_snapshot.html').write_bytes(raw)
text=raw.decode('utf-8','replace')
records=[]
for group in re.finditer(r'<h3>([^<]*Corporate Members[^<]*)</h3>\s*<ul class="corporate-members">(.*?)</ul>',text,re.S):
    tier=plain(group.group(1)).split()[0]
    for li in re.findall(r'<li>(.*?)</li>',group.group(2),re.S):
        a=re.search(r'<h3>\s*(<a\b[^>]*>)(.*?)</a>',li,re.S)
        if not a: continue
        im=re.search(r'<img\b[^>]*>',li,re.S)
        records.append({'name':plain(a.group(2)),'tier':tier,'listed_website':attr(a.group(1),'href'),'logo_url':attr(im.group(0),'src') if im else '', 'directory_source':SOURCE,'captured_utc':STAMP})
seen=set(); cleaned=[]; duplicates=[]
for r in records:
    key=(r['name'].casefold(),urllib.parse.urlparse(r['listed_website']).netloc.lower().removeprefix('www.'))
    if key in seen: duplicates.append(r); continue
    seen.add(key); cleaned.append(r)
cleaned.sort(key=lambda r:r['name'].casefold())
def enrich(pair):
    idx,r=pair; r['id']=f'ORG-{idx:03d}'
    r.update({'page_title':'','site_description':'','public_email':'','linkedin_company':'','contact_page':'','research_source':'','http_status':'','research_status':'Not checked','logo_file':'','logo_data':''})
    try:
        data,final,status=get(r['listed_website']); s=data.decode('utf-8','replace')
        r['research_source']=final; r['http_status']=status
        title=re.search(r'<title[^>]*>(.*?)</title>',s,re.I|re.S)
        r['page_title']=plain(title.group(1))[:180] if title else ''
        for m in re.findall(r'<meta\b[^>]*>',s,re.I|re.S):
            if attr(m,'name').lower()=='description': r['site_description']=plain(attr(m,'content'))[:350]; break
        links=re.findall(r'<a\b[^>]*>',s,re.I|re.S)
        for tag in links:
            href=attr(tag,'href')
            if 'linkedin.com/company/' in href: r['linkedin_company']=urllib.parse.urljoin(final,href).split('?')[0]
            if href.startswith('mailto:'):
                email=href[7:].split('?')[0]
                if re.match(r'^(info|contact|hello|sales|support|office|enquiries|inquiries|team)@[^\s]+$',email,re.I): r['public_email']=email
            if not r['contact_page'] and re.search(r'(^|/)contact([/-]|$)',href,re.I):
                u=urllib.parse.urljoin(final,href)
                if urllib.parse.urlparse(u).netloc==urllib.parse.urlparse(final).netloc: r['contact_page']=u
        r['research_status']='Page retrieved' if r['page_title'] else 'Review required: no title'
        if re.search(r'captcha|just a moment|access denied',r['page_title'],re.I): r['research_status']='Review required: access restriction'; r['site_description']=''
    except Exception as e: r['research_status']='Review required: '+type(e).__name__
    if r['logo_url']:
        try:
            data,_,_=get(r['logo_url']); im=Image.open(io.BytesIO(data)).convert('RGBA'); im.thumbnail((180,70))
            bg=Image.new('RGBA',(190,80),'white'); bg.alpha_composite(im,((190-im.width)//2,(80-im.height)//2))
            path=ROOT/'images'/f"{r['id']}.png"; bg.convert('RGB').save(path)
            r['logo_file']=str(path.resolve()); r['logo_data']='data:image/png;base64,'+base64.b64encode(path.read_bytes()).decode()
        except Exception: pass
    return r
with ThreadPoolExecutor(max_workers=5) as pool: enriched=list(pool.map(enrich,enumerate(cleaned,1)))
summary={'source':SOURCE,'captured_utc':STAMP,'source_records':len(records),'unique_records':len(enriched),'duplicate_records':len(duplicates),'logos_downloaded':sum(bool(r['logo_file']) for r in enriched),'pages_retrieved':sum(r['research_status']=='Page retrieved' for r in enriched),'public_emails':sum(bool(r['public_email']) for r in enriched),'needs_review':sum(r['research_status']!='Page retrieved' for r in enriched)}
(ROOT/'records.json').write_text(json.dumps({'summary':summary,'records':enriched,'duplicates':duplicates},ensure_ascii=False,indent=2),encoding='utf8')
cols=['id','name','tier','listed_website','page_title','site_description','public_email','contact_page','linkedin_company','research_status','http_status','research_source','logo_url','directory_source','captured_utc']
with (ROOT/'Business_Directory.csv').open('w',newline='',encoding='utf-8-sig') as f:
    w=csv.DictWriter(f,fieldnames=cols,extrasaction='ignore'); w.writeheader(); w.writerows(enriched)
print(json.dumps(summary))
