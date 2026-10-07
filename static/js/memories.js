/* Adding, viewing and editing memories (photo + date) using Flask */

/* Memory dialog: opens read-only; Edit needs the password */

function setEdit(on){
  var m = mem[dlgId];

  $('dDate').disabled = !on;
  $('dName').disabled = !on;

  $('fFile').hidden = !on;
  $('dSave').hidden = !on;

  $('dRemove').hidden = !(on && m);
  $('dEdit').hidden = on;

  $('dSub').textContent =
    on
      ? (m
          ? 'Update the date or photo.'
          : 'We did this one! Add the date and a photo.')
      : (m
          ? 'A memory we made together.'
          : '');
}

function showMem(id, title, isExtra, edit){

  dlgId = id;
  dlgTitle = title;
  pending = '';

  var m = mem[id];

  $('dTitle').textContent =
    isExtra && !m
      ? 'Add a memory'
      : title;

  $('dName').hidden = !isExtra;
  $('dName').value = isExtra ? title : '';

  $('dDate').value =
    m && m.date
      ? m.date
      : today();

  $('dFile').value = '';
  $('dMsg').textContent = '';

  var im = $('dImg');

  if(m && m.photo){
    im.src = m.photo;
    im.hidden = false;
  } else {
    im.hidden = true;
    im.removeAttribute('src');
  }

  setEdit(edit);

  $('dlg').showModal();
}

function openMem(id, title, sub, isExtra){

  if(mem[id])
    return showMem(id, title, isExtra, false);

  requireUnlock().then(function(ok){
    if(ok)
      showMem(id, title, isExtra, true);
  });
}

$('addMem').onclick = function(){

  requireUnlock().then(function(ok){

    if(ok)
      showMem(
        'x'+Date.now(),
        '',
        true,
        true
      );

  });
};

$('dEdit').onclick = function(){

  requireUnlock().then(function(ok){

    if(ok)
      setEdit(true);

  });

};

$('dClose').onclick = function(){
  $('dlg').close();
};

$('dFile').onchange = function(){

  var f = this.files[0];

  if(!f)
    return;

  var rd = new FileReader();

  rd.onload = function(){

    var img = new Image();

    img.onload = function(){

      var dim = 800;
      var q = 0.72;
      var out = '';

      for(var t=0; t<8; t++){

        var sc =
          Math.min(
            1,
            dim / Math.max(
              img.width,
              img.height
            )
          );

        var cv =
          document.createElement('canvas');

        cv.width =
          Math.round(img.width * sc);

        cv.height =
          Math.round(img.height * sc);

        cv.getContext('2d')
          .drawImage(
            img,
            0,
            0,
            cv.width,
            cv.height
          );

        out =
          cv.toDataURL(
            'image/jpeg',
            q
          );

        if(out.length < 190000)
          break;

        q -= 0.07;

        if(q < 0.4){
          q = 0.6;
          dim = Math.round(dim * 0.8);
        }
      }

      pending = out;

      $('dImg').src = out;
      $('dImg').hidden = false;
    };

    img.onerror = function(){
      $('dMsg').textContent =
        'That file could not be read as a photo.';
    };

    img.src = rd.result;
  };

  rd.readAsDataURL(f);
};


/* SAVE MEMORY */

$('dSave').onclick = function(){

  var isExtra =
    !$('dName').hidden;

  var name =
    $('dName').value.trim();

  if(isExtra && !name){
    $('dMsg').textContent =
      'Give this memory a name first.';
    return;
  }

  var old = mem[dlgId];

  var body = {
    id:dlgId,
    title:isExtra ? name : dlgTitle,
    extra:isExtra,
    date:$('dDate').value || today(),
    photo:
      pending ||
      (old ? old.photo : '')
  };

  $('dSave').disabled = true;
  $('dMsg').textContent = 'Saving...';

  fetch('/api/memories', {
    method: mem[dlgId] ? 'PUT' : 'POST',
    credentials:'same-origin',
    headers:{
      'Content-Type':'application/json'
    },
    body:JSON.stringify(body)
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

    $('dSave').disabled = false;

    if(!result.ok){

      $('dMsg').textContent =
        result.data && result.data.error
          ? result.data.error
          : 'Could not save. Try again.';

      return;
    }

    mem[dlgId] = {
      date:body.date,
      photo:body.photo
    };

    if(body.extra){

      var found = extras.find(function(e){
        return e.id === dlgId;
      });

      if(!found){
        extras.push({
          id:dlgId,
          title:body.title
        });
      } else {
        found.title = body.title;
      }
    }

    $('dlg').close();

    refresh();

  })
  .catch(function(){

    $('dSave').disabled = false;

    $('dMsg').textContent =
      'Could not connect to the server. Try again.';
  });
};


/* REMOVE MEMORY */

$('dRemove').onclick = function(){

  ask(
    'Remove memory',
    'Remove this memory and its photo for everyone?',
    false,
    'Remove'
  )
  .then(function(ok){

    if(!ok)
      return;

    fetch(
      '/api/memories/' +
      encodeURIComponent(dlgId),
      {
        method:'DELETE',
        credentials:'same-origin'
      }
    )
    .then(function(r){
      return r.json().then(function(data){
        return {
          ok:r.ok,
          data:data
        };
      });
    })
    .then(function(result){

      if(!result.ok){
        $('dMsg').textContent =
          'Could not remove. Try again.';
        return;
      }

      delete mem[dlgId];

      extras =
        extras.filter(function(e){
          return e.id !== dlgId;
        });

      $('dlg').close();

      refresh();

    })
    .catch(function(){

      $('dMsg').textContent =
        'Could not remove. Try again.';
    });

  });
};


/*
  Load the memories from Flask.

  IMPORTANT:
  This replaces the old Claude connection.
*/

function loadMemories(){

  fetch('/api/memories', {
    method:'GET',
    credentials:'same-origin'
  })
  .then(function(r){

    if(!r.ok)
      throw new Error('Could not load memories');

    return r.json();

  })
  .then(function(list){

    mem = {};
    extras = [];

    if(!Array.isArray(list))
      list = [];

    list.forEach(function(v){

      var id = v.id;

      if(!id)
        return;

      mem[id] = {
        date:v.date || '',
        photo:v.photo || ''
      };

      if(v.extra){

        extras.push({
          id:id,
          title:v.title || 'Memory'
        });

      }

    });

    refresh();

  })
  .catch(function(){

    /*
      Even if the database is temporarily unavailable,
      the original page still renders its roadmap.
    */

    mem = {};
    extras = [];

    refresh();

  });
}

$('dlg').addEventListener(
  'close',
  refresh
);

loadMemories();
refresh();