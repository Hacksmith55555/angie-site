/* Games: Ghost Catch and Midnight Match */

/* Ghost Catch */
var gScore=0, gTime=30, gTimer=null, gSpawn=null, gOn=false;
var holes = [];
for(var i=0;i<9;i++){
  (function(){
    var h = document.createElement('button');
    h.className = 'hole'; h.setAttribute('aria-label','hole');
    h.onclick = function(){
      if(!gOn || !h.textContent) return;
      var e = h.textContent;
      gScore += e === '👻' ? 1 : e === '🎃' ? 3 : -2;
      if(gScore < 0) gScore = 0;
      h.textContent = ''; $('gs').textContent = gScore;
    };
    $('holes').appendChild(h); holes.push(h);
  })();
}
$('gb').textContent = store.get('gbest', 0);
function popOne(){
  var h = holes[Math.floor(Math.random()*9)];
  var r = Math.random();
  h.textContent = r < .12 ? '🎃' : r < .38 ? '🕷️' : '👻';
  setTimeout(function(){ if(h) h.textContent = ''; }, 800);
}
function endGhost(){
  gOn = false; clearInterval(gTimer); clearInterval(gSpawn);
  holes.forEach(function(h){ h.textContent = ''; });
  var best = store.get('gbest', 0);
  if(gScore > best){ store.set('gbest', gScore); $('gb').textContent = gScore; $('gmsg').textContent = 'New high score: ' + gScore + '! The ghosts are impressed.'; }
  else $('gmsg').textContent = 'Final score: ' + gScore + '. The ghosts survive another night.';
  $('gstart').textContent = 'Play again';
}
$('gstart').onclick = function(){
  if(gOn) return;
  gScore = 0; gTime = 30; gOn = true;
  $('gs').textContent = 0; $('gt').textContent = 30; $('gmsg').textContent = '';
  gSpawn = setInterval(popOne, 550);
  gTimer = setInterval(function(){
    gTime--; $('gt').textContent = gTime;
    if(gTime <= 0) endGhost();
  }, 1000);
};

/* Midnight Match */
var faces = ['👻','🎃','🦇','🕷️','💀','🕯️','🧙‍♀️','🍎'];
var first=null, lock=false, moves=0, found=0;
$('mb').textContent = store.get('mbest', '-');
function newMatch(){
  var deck = faces.concat(faces).sort(function(){ return Math.random() - .5; });
  var box = $('cards'); box.innerHTML = '';
  first = null; lock = false; moves = 0; found = 0;
  $('mm').textContent = 0; $('mmsg').textContent = '';
  deck.forEach(function(f){
    var c = document.createElement('button');
    c.className = 'card'; c.dataset.f = f; c.setAttribute('aria-label','card');
    c.onclick = function(){
      if(lock || c.classList.contains('up') || c.classList.contains('done')) return;
      c.classList.add('up'); c.textContent = f;
      if(!first){ first = c; return; }
      moves++; $('mm').textContent = moves;
      var a = first; first = null;
      if(a.dataset.f === f){
        a.classList.replace('up','done'); c.classList.replace('up','done'); found++;
        if(found === 8) win();
      } else {
        lock = true;
        setTimeout(function(){
          a.classList.remove('up'); c.classList.remove('up');
          a.textContent = ''; c.textContent = ''; lock = false;
        }, 750);
      }
    };
    box.appendChild(c);
  });
}
function win(){
  var best = store.get('mbest', null);
  if(best === null || moves < best){ store.set('mbest', moves); $('mb').textContent = moves; $('mmsg').textContent = 'All pairs found in ' + moves + ' moves. New best!'; }
  else $('mmsg').textContent = 'All pairs found in ' + moves + ' moves. Can you beat ' + best + '?';
}
$('mstart').onclick = newMatch;
newMatch();
