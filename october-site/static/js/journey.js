/* Our Journey: seasons (newest on top), the winding roads, and the checklists */

/* Build one chapter per season, newest first, so older ones sit further down */
function buildChapters(){
  var box = $('chapters'); box.innerHTML = '';

  seasons.slice().reverse().forEach(function(s){
    var open = !!s.stops;
    var ch = document.createElement('div');
    ch.className = 'chap';
    ch.dataset.season = s.id;

    var flag = document.createElement('div');
    flag.className = 'flag' + (open ? '' : ' locked');
    flag.textContent = s.flag;
    ch.appendChild(flag);

    if(!open){
      var p = document.createElement('p');
      p.className = 'sub tc';
      p.textContent = s.blurb || 'The road keeps going. We will find out together.';
      ch.appendChild(p);
    }

    var path = document.createElement('div');
    path.className = 'path';
    path.id = 'path-' + s.id;
    ch.appendChild(path);

    if(open){
      var wrap = document.createElement('p');
      wrap.className = 'tc';
      var b = document.createElement('button');
      b.className = 'btn';
      b.textContent = 'Add a memory';
      b.onclick = function(){
        requireUnlock().then(function(ok){
          if(ok) showMem('x'+Date.now(), '', true, true, s.id);
        });
      };
      wrap.appendChild(b);
      ch.appendChild(wrap);
    }

    box.appendChild(ch);
  });
}

/* Things to Do page: one checklist per unlocked season, newest first */
function paintList(){
  var box = $('todoLists'); box.innerHTML = '';

  seasons.slice().reverse().forEach(function(s){
    if(!s.stops) return;

    var h = document.createElement('h3');
    h.className = 'sub2';
    h.textContent = s.name;

    var prog = document.createElement('div');
    prog.className = 'prog';
    var bar = document.createElement('i');
    prog.appendChild(bar);

    var ul = document.createElement('ul');
    ul.className = 'list';

    var n = 0;

    s.stops.forEach(function(t,i){
      var id = stopId(s,i);
      if(mem[id]) n++;

      var li = document.createElement('li');
      var lab = document.createElement('label');
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !!mem[id];
      cb.onchange = function(){
        cb.checked = !!mem[id];
        openMem(id, t[0], t[1], false, s.id);
      };
      var sp = document.createElement('span');
      sp.innerHTML = '<b></b><small></small>';
      sp.querySelector('b').textContent = t[0];
      sp.querySelector('small').textContent =
        mem[id] && mem[id].date ? 'Done ' + fmt(mem[id].date) : t[1];
      lab.appendChild(cb); lab.appendChild(sp);
      li.appendChild(lab); ul.appendChild(li);
    });

    bar.style.width = (n / s.stops.length * 100) + '%';

    box.appendChild(h);
    box.appendChild(prog);
    box.appendChild(ul);
  });
}

function refresh(){
  $('jnote').textContent = '';
  paintList();
  renderPath();
}

var earlier = []; // add {name:'Summer 2026', url:'https://...'} for older versions of the site

function mystery(clues, chapter){
  return clues.map(function(c,i){
    return {
      id:'m'+i,
      title:'???',
      sub:'Clue: ' + c,
      mystery:true,
      chapter:chapter
    };
  });
}

function renderPath(){
  var el = $('earlier'); el.innerHTML = '';

  earlier.forEach(function(e){
    var a = document.createElement('a');
    a.href = e.url;
    a.textContent = 'Earlier: ' + e.name;
    el.appendChild(a);
  });

  seasons.forEach(function(s){
    var box = $('path-' + s.id);
    if(!box) return;
    drawRoad(box, s.stops ? allStops(s) : mystery(s.clues || [], s.name));
  });

  syncTheme();
}

function drawRoad(box, stops){
  box.innerHTML = '';

  var w = box.parentNode.clientWidth;
  if(!w) return;

  var n = stops.length, gap = 128;
  var H = n*gap + 40;

  box.style.height = H + 'px';
  box.style.width = w + 'px';

  var amp = Math.min(w*0.26, 100), pts = [];

  stops.forEach(function(st,i){
    pts.push({
      x: w/2 + Math.sin(i*1.15)*amp,
      y: 60 + i*gap
    });
  });

  var NS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(NS,'svg');

  svg.setAttribute('width', w);
  svg.setAttribute('height', H);

  for(var i=1;i<n;i++){
    var p0 = pts[i-1], p1 = pts[i];

    var lit = !stops[i].mystery &&
      mem[stops[i-1].id] &&
      mem[stops[i].id];

    var d =
      'M'+p0.x+' '+p0.y+
      ' C'+p0.x+' '+(p0.y+gap/2)+
      ' '+p1.x+' '+(p1.y-gap/2)+
      ' '+p1.x+' '+p1.y;

    var road = document.createElementNS(NS,'path');
    road.setAttribute('d', d);
    road.setAttribute('fill','none');
    road.style.stroke = 'var(--road)';
    road.setAttribute('stroke-width','24');
    road.setAttribute('stroke-linecap','round');

    var dash = document.createElementNS(NS,'path');
    dash.setAttribute('d', d);
    dash.setAttribute('fill','none');
    dash.style.stroke = lit ? 'var(--candle)' : 'var(--fog)';
    dash.setAttribute('stroke-width','3');
    dash.setAttribute('stroke-dasharray','2 9');
    dash.setAttribute('stroke-linecap','round');

    svg.appendChild(road);
    svg.appendChild(dash);
  }

  box.appendChild(svg);

  stops.forEach(function(st,i){
    var m = st.mystery ? null : mem[st.id];
    var pt = pts[i];

    var b = document.createElement('button');

    b.className =
      'stop' +
      (m ? ' done' : '') +
      (m && !m.photo ? ' nophoto' : '') +
      (st.mystery ? ' mys' : '');

    b.style.left = (pt.x-32)+'px';
    b.style.top = (pt.y-32)+'px';

    b.setAttribute(
      'aria-label',
      st.mystery
        ? 'Mystery stop'
        : st.title + (m ? ', done' : ', not done yet')
    );

    if(m && m.photo){
      b.style.backgroundImage = 'url("' + m.photo + '")';
    } else {
      b.textContent =
        st.mystery
          ? '?'
          : (m ? '\u2713' : (i+1));
    }

    b.onclick = function(){
      if(st.mystery){
        ask(
          'Mystery stop',
          st.sub + ' This one stays hidden until ' + st.chapter + '.',
          false,
          'OK'
        );
      } else {
        openMem(
          st.id,
          st.title,
          st.sub,
          !!st.extra,
          st.season
        );
      }
    };

    var lab = document.createElement('div');

    lab.className = 'slab' + (m ? '' : ' dim');
    lab.innerHTML = '<b></b><small></small>';

    lab.querySelector('b').textContent = st.title;

    lab.querySelector('small').textContent =
      st.mystery
        ? 'Unlocks in ' + st.chapter
        : (m ? fmt(m.date) : '');

    lab.style.top = (pt.y-20)+'px';

    if(pt.x < w/2){
      lab.style.left = (pt.x+42)+'px';
      lab.style.width = (w-pt.x-50)+'px';
    } else {
      lab.style.left = '8px';
      lab.style.width = (pt.x-50)+'px';
      lab.style.textAlign = 'right';
    }

    box.appendChild(lab);
    box.appendChild(b);
  });
}

/* Page colors follow whichever season is on screen */
var chapTick = false;
var themeKeys = ['ink','ink2','moon','candle','fog','glow','road','navbg'];

function applyTheme(colors){
  var root = document.documentElement;
  themeKeys.forEach(function(k){
    if(colors && colors[k]) root.style.setProperty('--'+k, colors[k]);
    else root.style.removeProperty('--'+k);
  });
}

function syncTheme(){
  chapTick = false;

  if(!$('journey').classList.contains('on')){
    var latest = latestSeason();
    applyTheme(latest ? latest.colors : null);
    return;
  }

  var chaps = document.querySelectorAll('.chap');
  var cur = chaps.length ? chaps[0].dataset.season : '';
  var line = window.innerHeight * 0.45;

  chaps.forEach(function(c){
    if(c.getBoundingClientRect().top <= line)
      cur = c.dataset.season;
  });

  var s = seasons.filter(function(x){ return x.id === cur; })[0];
  applyTheme(s ? s.colors : null);
}

window.addEventListener('scroll', function(){
  if(!chapTick){
    chapTick = true;
    requestAnimationFrame(syncTheme);
  }
}, {passive:true});

window.addEventListener('resize', function(){
  if($('journey').classList.contains('on'))
    renderPath();
});

buildChapters();
