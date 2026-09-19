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

function receiveShare(){
  const p=new URLSearchParams(location.search);
  const url=p.get('url')||'';
  const title=p.get('title')||'';
  const text=p.get('text')||'';
  if(!url && !title && !text)return;
  let sharedUrl=url;
  if(!sharedUrl){
    const m=text.match(/https?:\/\/[^\s]+/);
    if(m)sharedUrl=m[0];
  }
  if(sharedUrl){
    try{sharedUrl=new URL(sharedUrl).href.replace(/\/$/,'')}catch{return}
    editSite('',sharedUrl,title||sharedUrl);
    history.replaceState({},'',location.pathname);
  }
}
function openSite(id){let s=sites.find(x=>x.id===id);if(s){s.lastUsedAt=now();put(s);window.open(s.url,'_blank','noopener')}}
$('addTop').onclick=()=>editSite();$('close').onclick=$('cancel').onclick=()=>{$('modal').classList.add('hidden')};$('search').oninput=render;$('categoryFilter').onchange=render;
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button').forEach(x=>x.classList.remove('active'));b.classList.add('active');filter=b.dataset.filter;render()});
$('delete').onclick=async()=>{let id=$('id').value;if(id&&confirm('このサイトを削除しますか？')){await remove(id);$('modal').classList.add('hidden');await refresh()}};
$('form').onsubmit=async e=>{e.preventDefault();let id=$('id').value||uid(),old=sites.find(s=>s.id===id),url=$('url').value.trim();try{url=new URL(url).href.replace(/\/$/,'')}catch{}if(sites.some(s=>s.id!==id&&s.url===url)){alert('同じURLのサイトがすでに登録されています。');return}await put({id,url,name:$('name').value.trim(),description:$('desc').value.trim(),category:$('cat').value,tags:parseTags($('tags').value),memo:$('memo').value.trim(),favorite:$('fav').checked,later:$('later').checked,icon:fav(url),createdAt:old?.createdAt||now(),updatedAt:now(),lastUsedAt:old?.lastUsedAt||null});$('modal').classList.add('hidden');await refresh()};
async function syncExport(){
  const payload={schemaVersion:1,exportedAt:now(),source:'My Sites v1.5',mode:'sync',sites};
  const text=JSON.stringify(payload,null,2);
  try{
    await navigator.clipboard.writeText(text);
    alert(`${sites.length}件の同期データをコピーしました。\n\nもう一方のMy Sitesを開き、「別のMy Sitesから同期」へ貼り付けてください。`);
  }catch(e){
    const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy');alert(`${sites.length}件の同期データをコピーしました。\n\nもう一方のMy Sitesへ貼り付けてください。`)}catch{alert('コピーできませんでした。Safariのコピー許可を確認してください。')}
    ta.remove();
  }
}
function syncMergeData(raw){
  raw=String(raw||'').trim();
  if(!raw)throw new Error('空です');
  const d=JSON.parse(raw);
  if(!Array.isArray(d?.sites))throw new Error('同期データではありません');
  return d.sites.filter(s=>s&&s.url&&s.name);
}
async function syncImport(){
  const raw=$('syncInput').value.trim();
  try{
    const incoming=syncMergeData(raw);
    let added=0,updated=0;
    for(const x of incoming){
      let url=new URL(String(x.url).trim()).href.replace(/\/$/,'');
      const old=sites.find(s=>s.url===url);
      const merged={
        id:old?.id||x.id||uid(),url,name:String(x.name).trim(),description:String(x.description||''),
        category:x.category||'その他',tags:Array.isArray(x.tags)?x.tags.map(String):[],memo:String(x.memo||''),
        favorite:!!x.favorite,later:!!x.later,icon:x.icon||fav(url),
        createdAt:old?.createdAt||x.createdAt||now(),updatedAt:x.updatedAt||now(),lastUsedAt:old?.lastUsedAt||x.lastUsedAt||null
      };
      await put(merged); old?updated++:added++;
    }
    $('syncModal').classList.add('hidden');$('syncInput').value='';await refresh();
    alert(`同期しました。\n\n新規追加: ${added}件\n更新: ${updated}件`);
  }catch(e){alert('同期データを読み込めませんでした。\n\n「別のMy Sitesへ同期データをコピー」で作成したJSONをそのまま貼り付けてください。')}
}
$('syncExport').onclick=syncExport;
$('syncImport').onclick=()=>{$('syncModal').classList.remove('hidden');$('syncInput').value='';$('syncInput').focus()};
$('syncClose').onclick=$('syncCancel').onclick=()=>{$('syncModal').classList.add('hidden')};
$('syncSave').onclick=syncImport;

async function share(mode){let last=mode==='changed'?await getMeta('lastSyncedAt'):null,l=mode==='changed'&&last?sites.filter(s=>s.updatedAt>last):sites,p={schemaVersion:1,exportedAt:now(),mode,sites:l},b=new Blob([JSON.stringify(p,null,2)],{type:'application/json'}),name=`my-sites-${mode}-${new Date().toISOString().slice(0,10)}.json`,shared=false;try{let f=new File([b],name,{type:'application/json'});if(navigator.share&&navigator.canShare?.({files:[f]})){await navigator.share({title:'My Sites',text:'My Sitesのサイトデータ',files:[f]});shared=true}}catch{}if(!shared){let a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);alert('JSONを保存しました。ChatGPTのチャットにこのファイルを添付してください。')}await setMeta('lastSyncedAt',now())}
$('shareChanged').onclick=()=>share('changed');$('shareAll').onclick=()=>share('all');
async function copyForChatGPT(mode='all'){
  const last=mode==='changed'?await getMeta('lastSyncedAt'):null;
  const l=mode==='changed'&&last?sites.filter(s=>s.updatedAt>last):sites;
  const payload={schemaVersion:1,exportedAt:now(),mode,sites:l};
  const text='My Sitesの登録データです。以下のデータだけを使って質問に答えてください。\n\n'+JSON.stringify(payload,null,2);
  try{
    await navigator.clipboard.writeText(text);
    await setMeta('lastSyncedAt',now());
    alert(`${l.length}件のデータをコピーしました。ChatGPTのチャットに貼り付けてください。`);
  }catch(e){
    const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy');await setMeta('lastSyncedAt',now());alert(`${l.length}件のデータをコピーしました。ChatGPTのチャットに貼り付けてください。`)}catch{alert('コピーできませんでした。Safariのコピー許可を確認してください。')}
    ta.remove();
  }
}
$('copyAll').onclick=()=>copyForChatGPT('all');
async function copySearchPrompt(){
  const payload={schemaVersion:1,exportedAt:now(),mode:'all',sites};
  const text='My Sitesに登録されているサイトだけを使って、以下の質問に答えてください。\n\n【質問】\nここに質問を書いてください。\n\n【登録データ】\n'+JSON.stringify(payload,null,2);
  try{
    await navigator.clipboard.writeText(text);
    alert('ChatGPT検索用のテンプレートをコピーしました。ChatGPTに貼り付けて、質問部分を書き換えてください。');
  }catch(e){
    const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy');alert('ChatGPT検索用のテンプレートをコピーしました。ChatGPTに貼り付けてください。')}
    catch{alert('コピーできませんでした。Safariのコピー許可を確認してください。')}
    ta.remove();
  }
}
$('copyPrompt').onclick=copySearchPrompt;


/* v1.5: robust PWA-side ChatGPT registration import.
   Accepts plain JSON (recommended), MYSITES1: + plain JSON,
   and the legacy base64url formats. Plain JSON avoids UTF-8/base64
   copy/paste problems on iOS. The installed PWA itself performs the
   IndexedDB write, so Safari and Home Screen storage do not need to match. */
function decodeRegistrationCode(raw){
  raw=String(raw||'').trim();
  if(!raw)throw new Error('コードが空です');

  // Accept a full URL containing ?add= / ?pwaAdd=.
  if(/^https?:\/\//i.test(raw)){
    try{
      const u=new URL(raw);
      raw=u.searchParams.get('pwaAdd')||u.searchParams.get('add')||raw;
    }catch{}
  }

  if(raw.startsWith('MYSITES1:')) raw=raw.slice('MYSITES1:'.length).trim();

  // v1.4 recommended format: plain JSON.
  try{
    const data=JSON.parse(raw);
    if(data?.url && data?.name)return data;
  }catch{}

  // Legacy format: URL-safe base64 encoded UTF-8 JSON.
  try{
    let s=raw.replace(/-/g,'+').replace(/_/g,'/').replace(/\s+/g,'');
    while(s.length%4)s+='=';
    const bin=atob(s);
    const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));
    const data=JSON.parse(new TextDecoder().decode(bytes));
    if(data?.url && data?.name)return data;
  }catch{}

  throw new Error('登録コードの形式が正しくありません');
}
async function importChatGPTCode(){
  const raw=$('chatgptPasteInput').value.trim();
  try{
    const incoming=decodeRegistrationCode(raw);
    const url=new URL(String(incoming.url).trim()).href.replace(/\/$/,'');
    const duplicate=sites.find(s=>s.url===url);
    const msg=(duplicate?'このサイトはすでに登録されています。情報を更新しますか？':'このサイトをMy Sitesに登録しますか？')+
      `\n\nサイト名: ${String(incoming.name).trim()}\nURL: ${url}\nカテゴリ: ${incoming.category||'その他'}`;
    if(!confirm(msg))return;
    const old=duplicate,stamp=now();
    await put({
      id:old?.id||uid(),url,name:String(incoming.name).trim(),description:String(incoming.description||''),
      category:incoming.category||'その他',tags:Array.isArray(incoming.tags)?incoming.tags.map(String):[],memo:String(incoming.memo||''),
      favorite:!!incoming.favorite,later:!!incoming.later,icon:incoming.icon||fav(url),
      createdAt:old?.createdAt||stamp,updatedAt:stamp,lastUsedAt:old?.lastUsedAt||null
    });
    $('chatgptPasteModal').classList.add('hidden');
    $('chatgptPasteInput').value='';
    await refresh();
    alert(old?'サイト情報を更新しました。':'サイトを登録しました。');
  }catch(e){
    console.error(e);
    alert('登録コードを読み込めませんでした。\n\nv1.4ではJSON形式のコードにも対応しています。ChatGPTから受け取ったコードをそのまま貼り付けてください。');
  }
}
$('chatgptPasteBtn').onclick=()=>{$('chatgptPasteModal').classList.remove('hidden');$('chatgptPasteInput').focus()};
$('chatgptPasteClose').onclick=$('chatgptPasteCancel').onclick=()=>{$('chatgptPasteModal').classList.add('hidden')};
$('chatgptPasteSave').onclick=importChatGPTCode;

$('importFile').onchange=async e=>{try{let d=JSON.parse(await e.target.files[0].text());for(let s of d.sites||[])if(s.id&&s.url&&s.name)await put(s);await refresh()}catch{alert('JSONの読み込みに失敗しました。')}};

// v1.4: ChatGPT登録コードは平文JSONを推奨。
// v0.8: ChatGPT検索用プロンプトを追加。
// v0.7: ChatGPT連携を強化。共有ファイルに加えて、ChatGPTへ貼り付けるデータをクリップボードへコピー可能。
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

// Dark mode
const THEME_KEY = 'my-sites-theme';
function applyTheme(theme){
  document.body.classList.toggle('dark', theme === 'dark');
  const btn = $('themeToggle');
  if(btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  const meta = document.querySelector('meta[name="theme-color"]');
  if(meta) meta.setAttribute('content', theme === 'dark' ? '#080a0e' : '#111318');
}
const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
applyTheme(savedTheme);
$('themeToggle').onclick = () => {
  const next = document.body.classList.contains('dark') ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
};

openDB().then(async()=>{await refresh();receiveShare();await receiveChatGPTAdd()})
.catch(e=>{console.error(e);alert('このブラウザではデータ保存機能を利用できません。Safariの通常モードで開いているか確認してください。');});







