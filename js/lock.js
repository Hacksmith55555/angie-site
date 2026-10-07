/* GitHub-backed story access, dialogs, and write authentication. */

/*
  GitHub Pages is static, so the site cannot run its own database.
  Memories are stored in data/memories.json and photos in data/images/ in
  the GitHub repository. The site reads them publicly and uses a GitHub
  fine-grained token only when somebody wants to edit the story.
*/
var mem = {}, extras = [], dlgId = null, dlgTitle = '', pending = '';
var GH = {
  branch: 'main',
  dataPath: 'data/memories.json',
  imageDir: 'data/images',
  repo: ''
};
var ghToken = sessionStorage.getItem('october_gh_token') || '';

function fmt(d){
  if(!d) return '';
  return new Date(d + 'T12:00:00').toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'});
}
function today(){
  var d = new Date(), m = d.getMonth()+1, day = d.getDate();
  return d.getFullYear() + '-' + (m<10?'0':'') + m + '-' + (day<10?'0':'') + day;
}
function allStops(){
  var arr = things.map(function(t,i){ return {id:'a'+i, title:t[0], sub:t[1]}; });
  extras.slice().sort(function(x,y){ return (mem[x.id].date||'').localeCompare(mem[y.id].date||''); })
    .forEach(function(e){ arr.push({id:e.id, title:e.title, sub:'Bonus memory', extra:true}); });
  return arr;
}

function ask(title, text, withInput, okLabel){
  return new Promise(function(res){
    var d = $('askDlg'), inp = $('aIn');
    $('aT').textContent = title; $('aP').textContent = text;
    inp.hidden = !withInput; inp.value = '';
    inp.type = withInput ? 'password' : 'text';
    $('aOk').textContent = okLabel || 'OK';
    $('aOk').onclick = function(){ d.close(); res(withInput ? inp.value : true); };
    $('aNo').onclick = function(){ d.close(); res(null); };
    d.oncancel = function(){ res(null); };
    d.showModal(); if(withInput) inp.focus();
  });
}

function getRepo(){
  if(GH.repo) return GH.repo;
  var host = location.hostname;
  if(host.endsWith('.github.io')){
    var owner = host.split('.')[0];
    var parts = location.pathname.split('/').filter(Boolean);
    GH.repo = owner + '/' + (parts[0] || (owner + '.github.io'));
    return GH.repo;
  }
  return '';
}
function repoParts(){
  var r = getRepo().split('/');
  return r.length === 2 ? {owner:r[0], repo:r[1]} : null;
}
function apiHeaders(){
  var h = {'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10'};
  if(ghToken) h.Authorization = 'Bearer ' + ghToken;
  return h;
}
function apiUrl(path){
  var p = repoParts();
  return p ? 'https://api.github.com/repos/' + encodeURIComponent(p.owner) + '/' + encodeURIComponent(p.repo) + '/contents/' + path.split('/').map(encodeURIComponent).join('/') : '';
}
function b64ToText(s){
  return decodeURIComponent(escape(atob(s.replace(/\s/g,''))));
}
function textToB64(s){
  return btoa(unescape(encodeURIComponent(s)));
}
function dataUrlToB64(s){ return s ? s.split(',')[1] : ''; }

function readMemories(){
  var p = repoParts();
  if(!p){ mem={}; extras=[]; refresh(); return Promise.resolve(); }
  var url = 'https://raw.githubusercontent.com/' + encodeURIComponent(p.owner) + '/' + encodeURIComponent(p.repo) + '/' + encodeURIComponent(GH.branch) + '/' + GH.dataPath.split('/').map(encodeURIComponent).join('/');
  return fetch(url + '?v=' + Date.now()).then(function(r){
    if(r.status === 404) return {};
    if(!r.ok) throw new Error('Could not load memories');
    return r.json();
  }).then(function(data){
    mem = data.memories || {};
    extras = [];
    Object.keys(mem).forEach(function(id){ if(mem[id].extra) extras.push({id:id,title:mem[id].title || 'Memory'}); });
    refresh();
  }).catch(function(){
    mem={}; extras=[]; refresh();
  });
}

function githubFile(path){
  return fetch(apiUrl(path), {headers:apiHeaders()}).then(function(r){
    if(r.status === 404) return null;
    if(!r.ok) return r.json().catch(function(){return {};}).then(function(e){ throw new Error(e.message || 'GitHub request failed ('+r.status+')'); });
    return r.json();
  });
}
function githubPut(path, contentB64, message){
  return githubFile(path).then(function(existing){
    var body = {message:message, content:contentB64, branch:GH.branch};
    if(existing && existing.sha) body.sha = existing.sha;
    return fetch(apiUrl(path), {method:'PUT', headers:Object.assign({'Content-Type':'application/json'},apiHeaders()), body:JSON.stringify(body)})
      .then(function(r){ return r.json().then(function(x){ if(!r.ok) throw new Error(x.message || 'GitHub could not save the file.'); return x; }); });
  });
}
function githubDelete(path, message){
  return githubFile(path).then(function(existing){
    if(!existing) return;
    return fetch(apiUrl(path), {method:'DELETE', headers:Object.assign({'Content-Type':'application/json'},apiHeaders()), body:JSON.stringify({message:message,sha:existing.sha,branch:GH.branch})})
      .then(function(r){ return r.json().then(function(x){ if(!r.ok) throw new Error(x.message || 'GitHub could not delete the file.'); return x; }); });
  });
}

function saveMemoriesFile(message){
  return githubPut(GH.dataPath, textToB64(JSON.stringify({memories:mem}, null, 2) + '\n'), message);
}
function imagePath(id){ return GH.imageDir + '/' + id.replace(/[^a-zA-Z0-9_-]/g,'_') + '.jpg'; }

function signInGithub(){
  if(!getRepo()){
    return ask('GitHub repository','Enter your repository as owner/repository.',true,'Continue').then(function(repo){
      if(!repo) return false;
      GH.repo = repo.trim().replace(/^https?:\/\/github\.com\//,'').replace(/\.git$/,'').replace(/\/$/,'');
      return signInGithub();
    });
  }
  return ask('GitHub sign in','Paste a fine-grained GitHub token with Contents: Read and write access to this repository. It is kept only for this browser session.',true,'Sign in').then(function(token){
    if(!token) return false;
    ghToken = token.trim();
    var p = repoParts();
    return fetch('https://api.github.com/repos/' + encodeURIComponent(p.owner) + '/' + encodeURIComponent(p.repo), {headers:apiHeaders()}).then(function(r){
      if(!r.ok) throw new Error('GitHub authentication failed');
      sessionStorage.setItem('october_gh_token', ghToken);
      return true;
    }).catch(function(){
      ghToken = '';
      return ask('GitHub sign in failed','The token could not access this repository. Check the repository and token permissions.',false,'OK').then(function(){return false;});
    });
  });
}
function requireUnlock(){
  if(ghToken) return Promise.resolve(true);
  return signInGithub();
}
function signOutGithub(){
  ghToken = '';
  sessionStorage.removeItem('october_gh_token');
}

/* Load the public story as soon as the page opens. */
readMemories();
