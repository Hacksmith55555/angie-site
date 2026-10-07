/* Adding, viewing and editing memories using the Flask backend */
function setEdit(on){
  var m = mem[dlgId];
  $('dDate').disabled = !on; $('dName').disabled = !on;
  $('fFile').hidden = !on; $('dSave').hidden = !on;
  $('dRemove').hidden = !(on && m); $('dEdit').hidden = on;
  $('dSub').textContent = on ? (m ? 'Update the date or photo.' : 'We did this one! Add the date and a photo.') : (m ? 'A memory we made together.' : '');
}
function showMem(id, title, isExtra, edit){
  dlgId = id; dlgTitle = title; pending = '';
  var m = mem[id];
  $('dTitle').textContent = isExtra && !m ? 'Add a memory' : title;
  $('dName').hidden = !isExtra; $('dName').value = isExtra ? (m && m.title ? m.title : title) : '';
  $('dDate').value = m && m.date ? m.date : today();
  $('dFile').value = ''; $('dMsg').textContent = '';
  var im = $('dImg');
  if(m && m.photo && isUnlocked()){ im.src = m.photo; im.hidden = false; } else { im.hidden = true; im.removeAttribute('src'); }
  setEdit(edit);
  $('dlg').showModal();
}
function loadMemories(){
  return fetch('/api/memories').then(function(r){ return r.json(); }).then(function(data){
    mem = {}; extras = [];
    Object.keys(data || {}).forEach(function(id){
      var v = data[id] || {};
      mem[id] = {date:v.date || '', photo:v.photo || '', title:v.title || ''};
      if(v.extra) extras.push({id:id, title:v.title || 'Memory'});
    });
    refresh();
  }).catch(function(){ refresh(); });
}
function saveMemory(){
  var isExtra = !$('dName').hidden, name = $('dName').value.trim();
  if(isExtra && !name){ $('dMsg').textContent = 'Give this memory a name first.'; return; }
  var old = mem[dlgId];
  var body = {title: isExtra ? name : dlgTitle, extra: isExtra, date: $('dDate').value || today(), photo: pending || (old ? old.photo : '')};
  $('dSave').disabled = true; $('dMsg').textContent = 'Saving...';
  var creating = !old;
  var url = creating ? '/api/memories' : '/api/memories/' + encodeURIComponent(dlgId);
  fetch(url, {method:creating?'POST':'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)})
    .then(function(r){ return r.json().then(function(x){ return {ok:r.ok, data:x}; }); })
    .then(function(result){
      if(!result.ok) throw new Error(result.data.error || 'save_failed');
      $('dSave').disabled = false; $('dlg').close(); return loadMemories();
    }).catch(function(e){
      $('dSave').disabled = false;
      $('dMsg').textContent = e.message === 'upload_too_large' ? 'That photo is too large.' : 'Could not save. Try again.';
    });
}
function openMem(id, title, sub, isExtra){
  if(mem[id]) return showMem(id, title, isExtra, false);
  requireUnlock().then(function(ok){ if(ok) showMem(id, title, isExtra, true); });
}
$('addMem').onclick = function(){
  requireUnlock().then(function(ok){ if(ok) showMem('x'+Date.now(), '', true, true); });
};
$('dEdit').onclick = function(){ requireUnlock().then(function(ok){ if(ok) setEdit(true); }); };
$('dClose').onclick = function(){ $('dlg').close(); };
$('dFile').onchange = function(){
  var f = this.files[0]; if(!f) return;
  var rd = new FileReader();
  rd.onload = function(){
    var img = new Image();
    img.onload = function(){
      var dim = 800, q = 0.72, out = '';
      for(var t=0; t<8; t++){
        var sc = Math.min(1, dim / Math.max(img.width, img.height));
        var cv = document.createElement('canvas'); cv.width = Math.round(img.width*sc); cv.height = Math.round(img.height*sc);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        out = cv.toDataURL('image/jpeg', q);
        if(out.length < 190000) break;
        q -= 0.07; if(q < 0.4){ q = 0.6; dim = Math.round(dim*0.8); }
      }
      pending = out; $('dImg').src = out; $('dImg').hidden = false;
    };
    img.onerror = function(){ $('dMsg').textContent = 'That file could not be read as a photo.'; };
    img.src = rd.result;
  };
  rd.readAsDataURL(f);
};
$('dSave').onclick = saveMemory;
$('dRemove').onclick = function(){
  ask('Remove memory','Remove this memory and its photo for everyone?',false,'Remove').then(function(ok){
    if(!ok) return;
    fetch('/api/memories/' + encodeURIComponent(dlgId), {method:'DELETE'})
      .then(function(r){ if(!r.ok) throw new Error(); return r.json(); })
      .then(function(){ $('dlg').close(); loadMemories(); })
      .catch(function(){ $('dMsg').textContent = 'Could not remove. Try again.'; });
  });
};
$('dlg').addEventListener('close', refresh);
loadMemories();
