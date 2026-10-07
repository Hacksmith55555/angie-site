/* Our Journey: checklist, the winding road, mystery chapters, and chapter colors */

function paintList(){
  var ul = $('list'); ul.innerHTML = '';
  things.forEach(function(t,i){
    var id = 'a'+i;
    var li = document.createElement('li');
    var lab = document.createElement('label');
    var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!mem[id];
    cb.onchange = function(){ cb.checked = !!mem[id]; openMem(id, t[0], t[1], false); };
    var sp = document.createElement('span');
    sp.innerHTML = '<b></b><small></small>';
    sp.querySelector('b').textContent = t[0];
    sp.querySelector('small').textContent = mem[id] && mem[id].date ? 'Done ' + fmt(mem[id].date) : t[1];
    lab.appendChild(cb); lab.appendChild(sp); li.appendChild(lab); ul.appendChild(li);
  });
  var n = 0; things.forEach(function(t,i){ if(mem['a'+i]) n++; });
  $('bar').style.width = (n / things.length * 100) + '%';
}
function refresh(){
  $('jnote').textContent = isUnlocked() ? '' : 'Unlock the story to view photos and add or edit memories.';
  paintList(); renderPath();
}

/* Journey road */
var earlier = []; // add {name:'Summer 2026', url:'https://...'} for older versions of the site
var novStops = ["It smells amazing.","Bring a blanket.","We will be thankful.","A surprise."];
var winStops = ["It is cold outside.","Lights and sparkle.","Warm drinks required.","A new year begins."];
function mystery(clues, chapter){
  return clues.map(function(c,i){ return {id:'m'+i, title:'???', sub:'Clue: ' + c, mystery:true, chapter:chapter}; });
}
function renderPath(){
  var el = $('earlier'); el.innerHTML = '';
  earlier.forEach(function(e){
    var a = document.createElement('a'); a.href = e.url; a.textContent = 'Earlier: ' + e.name; el.appendChild(a);
  });
  drawRoad($('path'), allStops());
  drawRoad($('path-nov'), mystery(novStops, 'November'));
  drawRoad($('path-win'), mystery(winStops, 'winter'));
  syncTheme();
}
function drawRoad(box, stops){
  box.innerHTML = '';
  var w = box.parentNode.clientWidth; if(!w) return;
  var n = stops.length, gap = 128;
  var H = n*gap + 40; box.style.height = H + 'px'; box.style.width = w + 'px';
  var amp = Math.min(w*0.26, 100), pts = [];
  stops.forEach(function(st,i){ pts.push({x: w/2 + Math.sin(i*1.15)*amp, y: 60 + i*gap}); });
  var NS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(NS,'svg'); svg.setAttribute('width', w); svg.setAttribute('height', H);
  for(var i=1;i<n;i++){
    var p0 = pts[i-1], p1 = pts[i];
    var lit = !stops[i].mystery && mem[stops[i-1].id] && mem[stops[i].id];
    var d = 'M'+p0.x+' '+p0.y+' C'+p0.x+' '+(p0.y+gap/2)+' '+p1.x+' '+(p1.y-gap/2)+' '+p1.x+' '+p1.y;
    var road = document.createElementNS(NS,'path'); road.setAttribute('d', d); road.setAttribute('fill','none');
    road.style.stroke = 'var(--road)'; road.setAttribute('stroke-width','24'); road.setAttribute('stroke-linecap','round');
    var dash = document.createElementNS(NS,'path'); dash.setAttribute('d', d); dash.setAttribute('fill','none');
    dash.style.stroke = lit ? 'var(--candle)' : 'var(--fog)'; dash.setAttribute('stroke-width','3'); dash.setAttribute('stroke-dasharray','2 9'); dash.setAttribute('stroke-linecap','round');
    svg.appendChild(road); svg.appendChild(dash);
  }
  box.appendChild(svg);
  stops.forEach(function(st,i){
    var m = st.mystery ? null : mem[st.id], pt = pts[i];
    var b = document.createElement('button');
    b.className = 'stop' + (m ? ' done' : '') + (m && !m.photo ? ' nophoto' : '') + (st.mystery ? ' mys' : '');
    b.style.left = (pt.x-32)+'px'; b.style.top = (pt.y-32)+'px';
    b.setAttribute('aria-label', st.mystery ? 'Mystery stop' : st.title + (m ? ', done' : ', not done yet'));
    if(m && m.photo && isUnlocked()) b.style.backgroundImage = 'url("' + m.photo + '")'; else b.textContent = st.mystery ? '?' : (m ? '\u2713' : (i+1));
    b.onclick = function(){
      if(st.mystery) ask('Mystery stop', st.sub + ' This one stays hidden until ' + st.chapter + '.', false, 'OK');
      else openMem(st.id, st.title, st.sub, !!st.extra);
    };
    var lab = document.createElement('div');
    lab.className = 'slab' + (m ? '' : ' dim');
    lab.innerHTML = '<b></b><small></small>';
    lab.querySelector('b').textContent = st.title;
    lab.querySelector('small').textContent = st.mystery ? 'Unlocks in ' + st.chapter : (m ? fmt(m.date) : '');
    lab.style.top = (pt.y-20)+'px';
    if(pt.x < w/2){ lab.style.left = (pt.x+42)+'px'; lab.style.width = (w-pt.x-50)+'px'; }
    else { lab.style.left = '8px'; lab.style.width = (pt.x-50)+'px'; lab.style.textAlign = 'right'; }
    box.appendChild(lab); box.appendChild(b);
  });
}
/* Page colors follow whichever chapter is on screen */
var chapTick = false;
function syncTheme(){
  chapTick = false;
  var root = document.documentElement;
  if(!$('journey').classList.contains('on')){ root.removeAttribute('data-theme'); return; }
  var cur = 'oct', line = window.innerHeight * 0.45;
  document.querySelectorAll('.chap').forEach(function(c){ if(c.getBoundingClientRect().top <= line) cur = c.dataset.theme; });
  if(cur === 'oct') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', cur);
}
window.addEventListener('scroll', function(){ if(!chapTick){ chapTick = true; requestAnimationFrame(syncTheme); } }, {passive:true});
window.addEventListener('resize', function(){ if($('journey').classList.contains('on')) renderPath(); });
