/* Flask login/password lock */

var db = {};  // Truthy marker used by journey.js; Flask is the real backend.
var canWrite = true;
var isAdmin = true;
var lock = null;
var mem = {};
var extras = [];

var dlgId = null, dlgTitle = '', pending = '', unl = false;

function fmt(d){
  if(!d) return '';
  return new Date(d + 'T12:00:00').toLocaleDateString(undefined, {
    month:'short',
    day:'numeric',
    year:'numeric'
  });
}

function today(){
  var d = new Date(), m = d.getMonth()+1, day = d.getDate();
  return d.getFullYear() + '-' + (m<10?'0':'') + m + '-' + (day<10?'0':'') + day;
}

function allStops(){
  var arr = things.map(function(t,i){
    return {id:'a'+i, title:t[0], sub:t[1]};
  });

  extras.slice().sort(function(x,y){
    return (mem[x.id].date||'').localeCompare(mem[y.id].date||'');
  }).forEach(function(e){
    arr.push({
      id:e.id,
      title:e.title,
      sub:'Bonus memory',
      extra:true
    });
  });

  return arr;
}

function ask(title, text, withInput, okLabel){
  return new Promise(function(res){
    var d = $('askDlg'), inp = $('aIn');

    $('aT').textContent = title;
    $('aP').textContent = text;
    inp.hidden = !withInput;
    inp.value = '';
    $('aOk').textContent = okLabel || 'OK';

    $('aOk').onclick = function(){
      d.close();
      res(withInput ? inp.value : true);
    };

    $('aNo').onclick = function(){
      d.close();
      res(null);
    };

    d.oncancel = function(){
      res(null);
    };

    d.showModal();

    if(withInput) inp.focus();
  });
}

async function getLoginStatus(){
  try{
    var r = await fetch('/api/status', {
      credentials: 'same-origin'
    });

    if(!r.ok) return false;

    var data = await r.json();
    unl = !!data.unlocked;
    return unl;
  }catch(e){
    unl = false;
    return false;
  }
}

async function requireUnlock(){
  if(await getLoginStatus()) return true;

  var pw = await ask(
    'Password',
    'Enter the password to add to our story.',
    true,
    'Unlock'
  );

  if(pw === null) return false;

  try{
    var r = await fetch('/api/login', {
      method:'POST',
      credentials:'same-origin',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({password:pw})
    });

    var data = await r.json().catch(function(){
      return {};
    });

    if(r.ok && data.ok){
      unl = true;
      return true;
    }

    await ask(
      'Wrong password',
      'That password did not match.',
      false,
      'OK'
    );

    return false;
  }catch(e){
    await ask(
      'Connection error',
      'The site could not reach the server. Try again.',
      false,
      'OK'
    );

    return false;
  }
}
