const DB='MySitesV03',S='sites',M='meta';let db,sites=[],filter='all';
const $=x=>document.getElementById(x),now=()=>new Date().toISOString(),uid=()=>crypto.randomUUID?.()||Date.now()+Math.random();
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
function fav(u){try{return'https://www.google.com/s2/favicons?domain='+encodeURIComponent(new URL(u).hostname)+'&sz=64'}catch{return''}}
function openDB(){return new Promise((ok,no)=>{let r=indexedDB.open(DB,1);r.onupgradeneeded=e=>{let d=e.target.result;if(!d.objectStoreNames.contains(S))d.createObjectStore(S,{keyPath:'id'});if(!d.objectStoreNames.contains(M))d.createObjectStore(M,{keyPath:'key'})};r.onsuccess=e=>{db=e.target.result;ok()};r.onerror=()=>no(r.error)})}
function st(s=S,m='readonly'){return db.transaction(s,m).objectStore(s)}
function all(){return new Promise(ok=>{let r=st().getAll();r.onsuccess=()=>ok(r.result||[])})}
function put(x){return new Promise(ok=>{let r=st(S,'readwrite').put(x);r.onsuccess=ok})}
function remove(x){return new Promise(ok=>{let r=st(S,'readwrite').delete(x);r.onsuccess=ok})}
function getMeta(k){return new Promise(ok=>{let r=st(M).get(k);r.onsuccess=()=>ok(r.result?.value)})}
function setMeta(k,v){return new Promise(ok=>{let r=st(M,'readwrite').put({key:k,value:v});r.onsuccess=ok})}
function parseTags(v){return v.split(',').map(x=>x.trim()).filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i)}
async function refresh(){sites=await all();render()}
function render(){let q=$('search').value.trim().toLowerCase(),c=$('categoryFilter').value,l=sites.filter(s=>!c||s.category===c);if(filter==='favorite')l=l.filter(s=>s.favorite);if(filter==='later')l=l.filter(s=>s.later);if(filter==='recent')l.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));if(q)l=l.filter(s=>[s.name,s.url,s.description,s.category,...(s.tags||[]),s.memo].join(' ').toLowerCase().includes(q));$('stats').textContent=`${l.length}件表示 / 登録 ${sites.length}件`;$('list').innerHTML=l.length?l.map(s=>`<article class="card"><div class="top"><img class="icon" src="${esc(s.icon||fav(s.url))}"><div style="min-width:0;flex:1"><h3>${esc(s.name)}</h3><div class="url">${esc(s.url)}</div></div><b>${s.favorite?'★':'☆'}</b></div>${s.description?`<div class="desc">${esc(s.description)}</div>`:''}<div class="badges"><span class="badge">${esc(s.category)}</span>${s.later?'<span class="badge">あとで試す</span>':''}${(s.tags||[]).map(t=>`<span class="badge">#${esc(t)}</span>`).join('')}</div><div class="actions"><button onclick="editSite('${esc(s.id)}')">編集</button><button class="open" onclick="openSite('${esc(s.id)}')">開く</button></div></article>`).join(''):'<div class="empty">まだサイトがありません。<br>「＋ 登録」またはSafariの共有から追加できます。</div>'}
function editSite(id,sharedUrl='',sharedName=''){ $('modal').classList.remove('hidden');$('form').reset();$('id').value=id||'';$('delete').classList.toggle('hidden',!id);$('modalTitle').textContent=id?'サイトを編集':'サイトを登録';if(id){let s=sites.find(x=>x.id===id);$('url').value=s.url;$('name').value=s.name;$('desc').value=s.description||'';$('cat').value=s.category||'その他';$('tags').value=(s.tags||[]).join(', ');$('memo').value=s.memo||'';$('fav').checked=!!s.favorite;$('later').checked=!!s.later}else if(sharedUrl){$('url').value=sharedUrl;$('name').value=sharedName}}
function openSite(id){let s=sites.find(x=>x.id===id);if(s){s.lastUsedAt=now();put(s);window.open(s.url,'_blank','noopener')}}
$('addTop').onclick=()=>editSite();$('close').onclick=$('cancel').onclick=()=>{$('modal').classList.add('hidden')};$('search').oninput=render;$('categoryFilter').onchange=render;
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button').forEach(x=>x.classList.remove('active'));b.classList.add('active');filter=b.dataset.filter;render()});
$('delete').onclick=async()=>{let id=$('id').value;if(id&&confirm('このサイトを削除しますか？')){await remove(id);$('modal').classList.add('hidden');await refresh()}};
$('form').onsubmit=async e=>{e.preventDefault();let id=$('id').value||uid(),old=sites.find(s=>s.id===id),url=$('url').value.trim();try{url=new URL(url).href.replace(/\/$/,'')}catch{}if(sites.some(s=>s.id!==id&&s.url===url)){alert('同じURLのサイトがすでに登録されています。');return}await put({id,url,name:$('name').value.trim(),description:$('desc').value.trim(),category:$('cat').value,tags:parseTags($('tags').value),memo:$('memo').value.trim(),favorite:$('fav').checked,later:$('later').checked,icon:fav(url),createdAt:old?.createdAt||now(),updatedAt:now(),lastUsedAt:old?.lastUsedAt||null});$('modal').classList.add('hidden');await refresh()};
async function share(mode){let last=mode==='changed'?await getMeta('lastSyncedAt'):null,l=mode==='changed'&&last?sites.filter(s=>s.updatedAt>last):sites,p={schemaVersion:1,exportedAt:now(),mode,sites:l},b=new Blob([JSON.stringify(p,null,2)],{type:'application/json'}),name=`my-sites-${mode}-${new Date().toISOString().slice(0,10)}.json`,shared=false;try{let f=new File([b],name,{type:'application/json'});if(navigator.share&&navigator.canShare?.({files:[f]})){await navigator.share({title:'My Sites',text:'My Sitesのサイトデータ',files:[f]});shared=true}}catch{}if(!shared){let a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);alert('JSONを保存しました。ChatGPTのチャットにこのファイルを添付してください。')}await setMeta('lastSyncedAt',now())}
$('shareChanged').onclick=()=>share('changed');$('shareAll').onclick=()=>share('all');
$('importFile').onchange=async e=>{try{let d=JSON.parse(await e.target.files[0].text());for(let s of d.sites||[])if(s.id&&s.url&&s.name)await put(s);await refresh()}catch{alert('JSONの読み込みに失敗しました。')}};

// v0.5: ChatGPT → My Sites registration link.
// Payload is URL-safe base64 of a JSON site record. The app always asks for confirmation.
function decodeAddPayload(raw){
  const bin=atob(raw.replace(/-/g,'+').replace(/_/g,'/'));
  const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
async function receiveChatGPTAdd(){
  const p=new URLSearchParams(location.search),raw=p.get('add');
  if(!raw)return;
  try{
    const incoming=decodeAddPayload(raw);
    if(!incoming?.url||!incoming?.name)throw new Error('invalid payload');
    let url=new URL(incoming.url).href.replace(/\/$/,'');
    const duplicate=sites.find(s=>s.url===url);
    const msg=(duplicate?'このサイトはすでに登録されています。情報を更新しますか？':'このサイトをMy Sitesに登録しますか？')+
      `\n\nサイト名: ${incoming.name}\nURL: ${url}\nカテゴリ: ${incoming.category||'その他'}`;
    if(!confirm(msg))return;
    const old=duplicate,stamp=now();
    await put({
      id:old?.id||uid(),url,name:incoming.name.trim(),description:incoming.description||'',
      category:incoming.category||'その他',tags:Array.isArray(incoming.tags)?incoming.tags:[],memo:incoming.memo||'',
      favorite:!!incoming.favorite,later:!!incoming.later,icon:incoming.icon||fav(url),
      createdAt:old?.createdAt||stamp,updatedAt:stamp,lastUsedAt:old?.lastUsedAt||null
    });
    history.replaceState({},'',location.pathname);
    await refresh();
    alert(old?'サイト情報を更新しました。':'サイトを登録しました。');
  }catch(e){console.error(e);alert('ChatGPTから受け取った登録データを読み込めませんでした。');}
}
async function receiveShare(){
  const p=new URLSearchParams(location.search);
  const url=p.get('url'), title=p.get('title')||'', text=p.get('text')||'';
  if(!url)return;
  const name=title.trim()||text.split('\n')[0].trim()||'';
  editSite('',url,name);
  history.replaceState({},'',location.pathname);
}
openDB().then(async()=>{await refresh();await receiveShare();await receiveChatGPTAdd()})
.catch((err)=>{console.error('IndexedDB initialization failed:',err);alert('このブラウザではIndexedDBを利用できません。');});
