/* Adding, viewing and editing memories using the Flask API */

function setEdit(on){
  var m = mem[dlgId];

  $('dDate').disabled = !on;
  $('dName').disabled = !on;
  $('fFile').hidden = !on;
  $('dSave').hidden = !on;
  $('dRemove').hidden = !(on && m);
  $('dEdit').hidden = on;

  $('dSub').textContent = on
    ? (m ? 'Update the date or photo.' : 'We did this one! Add the date and a photo.')
    : (m ? 'A memory we made together.' : '');
}

function showMem(id, title, isExtra, edit){
  dlgId = id;
  dlgTitle = title;
  pending = '';

  var m = mem[id];

  $('dTitle').textContent = isExtra && !m ? 'Add a memory' : title;
  $('dName').hidden = !isExtra;
  $('dName').value = isExtra ? title : '';

  $('dDate').value = m && m.date ? m.date : today();

  $('dFile').value = '';
  $('dMsg').textContent = '';

  var im = $('dImg');

  if(m && m.photo){
    im.src = m.photo;
    im.hidden = false;
  }else{
    im.hidden = true;
    im.removeAttribute('src');
  }

  setEdit(edit);
  $('dlg').showModal();
}

function openMem(id, title, sub, isExtra){
  if(mem[id]){
    showMem(id, title, isExtra, false);
    return;
  }

  requireUnlock().then(function(ok){
    if(ok) showMem(id, title, isExtra, true);
  });
}

$('addMem').onclick = function(){
  requireUnlock().then(function(ok){
    if(ok) showMem('x' + Date.now(), '', true, true);
  });
};

$('dEdit').onclick = function(){
  requireUnlock().then(function(ok){
    if(ok) setEdit(true);
  });
};

$('dClose').onclick = function(){
  $('dlg').close();
};

$('dFile').onchange = function(){
  var f = this.files[0];

  if(!f) return;

  if(!f.type || !f.type.startsWith('image/')){
    $('dMsg').textContent = 'Please choose an image file.';
    this.value = '';
    return;
  }

  var rd = new FileReader();

  rd.onload = function(){
    var img = new Image();

    img.onload = function(){
      var dim = 1200;
      var q = 0.82;
      var out = '';

      for(var t=0; t<8; t++){
        var sc = Math.min(1, dim / Math.max(img.width, img.height));

        var cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round(img.width * sc));
        cv.height = Math.max(1, Math.round(img.height * sc));

        var ctx = cv.getContext('2d');
        ctx.drawImage(img, 0, 0, cv.width, cv.height);

        out = cv.toDataURL('image/jpeg', q);

        /*
         * The Flask backend allows 2 MB of decoded image data.
         * Keeping the data URL below ~1.5 MB gives it plenty of room.
         */
        if(out.length < 1500000) break;

        q -= 0.07;

        if(q < 0.45){
          q = 0.6;
          dim = Math.round(dim * 0.8);
        }
      }

      pending = out;
      $('dImg').src = out;
      $('dImg').hidden = false;
      $('dMsg').textContent = 'Photo ready.';
    };

    img.onerror = function(){
      $('dMsg').textContent = 'That file could not be read as a photo.';
    };

    img.src = rd.result;
  };

  rd.onerror = function(){
    $('dMsg').textContent = 'Could not read that file.';
  };

  rd.readAsDataURL(f);
};

$('dSave').onclick = async function(){
  var isExtra = !$('dName').hidden;
  var name = $('dName').value.trim();

  if(isExtra && !name){
    $('dMsg').textContent = 'Give this memory a name first.';
    return;
  }

  var old = mem[dlgId];

  var body = {
    id: dlgId,
    title: isExtra ? name : dlgTitle,
    extra: isExtra,
    date: $('dDate').value || today(),
    photo: pending || (old ? old.photo : '')
  };

  $('dSave').disabled = true;
  $('dMsg').textContent = 'Saving...';

  try{
    var url;
    var method;

    if(old){
      url = '/api/memories/' + encodeURIComponent(dlgId);
      method = 'PUT';
    }else{
      /*
       * POST preserves dlgId so fixed journey stops like a0, a1, etc.
       * remain tied to their checkboxes.
       */
      url = '/api/memories';
      method = 'POST';
    }

    var r = await fetch(url, {
      method:method,
      credentials:'same-origin',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body)
    });

    var data = await r.json().catch(function(){
      return {};
    });

    if(!r.ok || !data.ok){
      throw new Error(data.error || 'save_failed');
    }

    if(data.memory){
      var saved = data.memory;

      mem[saved.id] = {
        date:saved.date || '',
        photo:saved.photo || ''
      };

      if(saved.extra && !extras.some(function(e){
        return e.id === saved.id;
      })){
        extras.push({
          id:saved.id,
          title:saved.title || 'Memory'
        });
      }

      dlgId = saved.id;
    }

    $('dSave').disabled = false;
    $('dlg').close();
    refresh();

  }catch(e){
    $('dSave').disabled = false;

    var msg = 'Could not save. Try again.';

    if(e.message === 'unauthorized'){
      msg = 'Your login expired. Enter the password again.';
    }else if(e.message === 'image too large'){
      msg = 'That photo is still too large. Try a smaller image.';
    }else if(e.message === 'title_required'){
      msg = 'Give this memory a name first.';
    }

    $('dMsg').textContent = msg;
  }
};

$('dRemove').onclick = function(){
  ask(
    'Remove memory',
    'Remove this memory and its photo for everyone?',
    false,
    'Remove'
  ).then(async function(ok){
    if(!ok) return;

    try{
      var r = await fetch(
        '/api/memories/' + encodeURIComponent(dlgId),
        {
          method:'DELETE',
          credentials:'same-origin'
        }
      );

      var data = await r.json().catch(function(){
        return {};
      });

      if(!r.ok || !data.ok){
        throw new Error(data.error || 'remove_failed');
      }

      delete mem[dlgId];

      extras = extras.filter(function(e){
        return e.id !== dlgId;
      });

      $('dlg').close();
      refresh();

    }catch(e){
      $('dMsg').textContent = 'Could not remove. Try again.';
    }
  });
};

/* Load memories from Flask when the page starts. */
(async function loadMemories(){
  try{
    var r = await fetch('/api/memories', {
      credentials:'same-origin'
    });

    if(!r.ok){
      throw new Error('load_failed');
    }

    var data = await r.json();

    mem = {};
    extras = [];

    Object.keys(data || {}).forEach(function(id){
      var v = data[id] || {};

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

  }catch(e){
    refresh();

    var note = $('jnote');
    if(note){
      note.textContent = 'Could not load our saved memories. Refresh the page and try again.';
    }
  }
})();

$('dlg').addEventListener('close', refresh);
