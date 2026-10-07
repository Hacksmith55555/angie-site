/* Shared story state, pop-up questions, and the Flask password lock */

/*
  Keep these global variables because journey.js, memories.js,
  and the other original files use them.
*/

var db = {};
var canWrite = true;
var isAdmin = true;
var lock = null;
var mem = {};
var extras = [];

var dlgId = null;
var dlgTitle = '';
var pending = '';
var unl = '';

function fmt(d){
  if(!d) return '';

  return new Date(d + 'T12:00:00').toLocaleDateString(
    undefined,
    {
      month:'short',
      day:'numeric',
      year:'numeric'
    }
  );
}

function today(){
  var d = new Date();
  var m = d.getMonth()+1;
  var day = d.getDate();

  return d.getFullYear() +
    '-' + (m<10?'0':'') + m +
    '-' + (day<10?'0':'') + day;
}

function allStops(){
  var arr = things.map(function(t,i){
    return {
      id:'a'+i,
      title:t[0],
      sub:t[1]
    };
  });

  extras
    .slice()
    .sort(function(x,y){
      return (mem[x.id].date||'')
        .localeCompare(mem[y.id].date||'');
    })
    .forEach(function(e){
      arr.push({
        id:e.id,
        title:e.title,
        sub:'Bonus memory',
        extra:true
      });
    });

  return arr;
}

/* Small dialogs */
function ask(title, text, withInput, okLabel){
  return new Promise(function(res){
    var d = $('askDlg');
    var inp = $('aIn');

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

    if(withInput)
      inp.focus();
  });
}

/*
  Flask handles the actual password check.
  This function keeps the same interface that the original
  journey/memories code expects.
*/

function isUnlocked(){
  return unl === 'flask-session';
}

function requireUnlock(){

  if(isUnlocked())
    return Promise.resolve(true);

  return fetch('/api/status', {
    method:'GET',
    credentials:'same-origin'
  })
  .then(function(r){
    return r.json();
  })
  .then(function(status){

    if(status && status.authenticated){
      unl = 'flask-session';
      return true;
    }

    return ask(
      'Password',
      'Enter the password to add to our story.',
      true,
      'Unlock'
    ).then(function(pw){

      if(pw === null)
        return false;

      return fetch('/api/login', {
        method:'POST',
        credentials:'same-origin',
        headers:{
          'Content-Type':'application/json'
        },
        body:JSON.stringify({
          password:pw
        })
      })
      .then(function(r){
        return r.json().then(function(data){
          return {
            ok:r.ok,
            data:data
          };
        });
      })
      .then(function(result){

        if(result.ok && result.data && result.data.ok){
          unl = 'flask-session';
          canWrite = true;
          isAdmin = true;
          return true;
        }

        return ask(
          'Wrong password',
          'That password did not match.',
          false,
          'OK'
        ).then(function(){
          return false;
        });
      });
    });
  })
  .catch(function(){
    return ask(
      'Connection problem',
      'The site could not reach the server. Try again.',
      false,
      'OK'
    ).then(function(){
      return false;
    });
  });
}