/* Flask-backed story state and password lock */
var db = true, canWrite = true, isAdmin = true, lock = null, mem = {}, extras = [];
var dlgId = null, dlgTitle = '', pending = '', unl = false;

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
    $('aOk').textContent = okLabel || 'OK';
    $('aOk').onclick = function(){ d.close(); res(withInput ? inp.value : true); };
    $('aNo').onclick = function(){ d.close(); res(null); };
    d.oncancel = function(){ res(null); };
    d.showModal(); if(withInput) inp.focus();
  });
}
function isUnlocked(){ return unl === true; }
function requireUnlock(){
  if(isUnlocked()) return Promise.resolve(true);
  return ask('Password','Enter the password to add to our story.',true,'Unlock').then(function(pw){
    if(pw === null) return false;
    return fetch('/api/login', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({password:pw})
    }).then(function(r){
      if(r.ok){ unl = true; refresh(); return true; }
      return ask('Wrong password','That password did not match.',false,'OK').then(function(){ return false; });
    }).catch(function(){
      return ask('Connection error','The server could not be reached.',false,'OK').then(function(){ return false; });
    });
  });
}

fetch('/api/status').then(function(r){ return r.json(); }).then(function(s){ unl = !!s.unlocked; refresh(); }).catch(function(){});
