/* Adding, viewing and editing memories stored in the GitHub repository. */

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
  $('dName').hidden = !isExtra; $('dName').value = isExtra ? (m ? m.title : title) : '';
  $('dDate').value = m && m.date ? m.date : today();
  $('dFile').value = ''; $('dMsg').textContent = '';
  var im = $('dImg');
  if(m && m.photo){ im.src = m.photo; im.hidden = false; } else { im.hidden = true; im.removeAttribute('src'); }
  setEdit(edit);
  $('dlg').showModal();
}
function openMem(id, title, sub, isExtra){
  if(mem[id]) return showMem(id, title || mem[id].title, isExtra, false);
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

$('dSave').onclick = function(){
  var isExtra = !$('dName').hidden, name = $('dName').value.trim();
  if(isExtra && !name){ $('dMsg').textContent = 'Give this memory a name first.'; return; }
  var old = mem[dlgId];
  var body = {
    title: isExtra ? name : dlgTitle,
    extra: isExtra,
    date: $('dDate').value || today(),
    photo: old ? (old.photo || '') : ''
  };
  $('dSave').disabled = true; $('dMsg').textContent = 'Saving to GitHub...';

  var newImage = pending ? imagePath(dlgId) : null;
  var oldImage = old && old.imagePath;
  if(newImage){
    body.imagePath = newImage;
    body.photo = 'https://raw.githubusercontent.com/' + repoParts().owner + '/' + repoParts().repo + '/' + GH.branch + '/' + newImage;
  } else if(old){
    body.imagePath = old.imagePath || '';
  }

  var imagePromise = pending ? githubPut(newImage, dataUrlToB64(pending), 'Update memory photo: ' + body.title) : Promise.resolve();
  imagePromise.then(function(){
    mem[dlgId] = body;
    extras = Object.keys(mem).filter(function(id){ return mem[id].extra; }).map(function(id){ return {id:id,title:mem[id].title || 'Memory'}; });
    return saveMemoriesFile('Update memory: ' + body.title);
  }).then(function(){
    $('dSave').disabled = false; $('dlg').close(); refresh();
  }).catch(function(e){
    $('dSave').disabled = false;
    $('dMsg').textContent = 'Could not save to GitHub. ' + (e.message || 'Check your token and try again.');
  });
};

$('dRemove').onclick = function(){
  ask('Remove memory','Remove this memory and its photo from the website?',false,'Remove').then(function(ok){
    if(!ok) return;
    var old = mem[dlgId];
    $('dRemove').disabled = true; $('dMsg').textContent = 'Removing from GitHub...';
    delete mem[dlgId];
    var imagePromise = old && old.imagePath ? githubDelete(old.imagePath, 'Remove memory photo: ' + (old.title || 'Memory')) : Promise.resolve();
    imagePromise.then(function(){ return saveMemoriesFile('Remove memory: ' + (old && old.title || 'Memory')); })
      .then(function(){ $('dRemove').disabled = false; $('dlg').close(); refresh(); })
      .catch(function(e){
        if(old) mem[dlgId] = old;
        $('dRemove').disabled = false;
        $('dMsg').textContent = 'Could not remove. ' + (e.message || 'Try again.');
      });
  });
};

$('dlg').addEventListener('close', refresh);
refresh();
