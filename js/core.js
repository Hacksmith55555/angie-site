/* Core: her name, saved settings, tabs, bats on the moon */

// Change this to her name or a pet name:
var HER = "my love";
document.getElementById('title').textContent = "Happy October, " + HER;

var store = {
  get: function(k, d){ try{ var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); }catch(e){ return d; } },
  set: function(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } }
};
var $ = function(id){ return document.getElementById(id); };

/* Pages */
document.querySelectorAll('nav button').forEach(function(b){
  b.onclick = function(){
    document.querySelectorAll('nav button').forEach(function(x){ x.removeAttribute('aria-current'); });
    b.setAttribute('aria-current','page');
    document.querySelectorAll('section').forEach(function(s){ s.classList.toggle('on', s.id === b.dataset.p); });
    window.scrollTo(0,0);
    if(b.dataset.p === 'journey') renderPath();
    syncTheme();
  };
});

/* Bats */
$('moon').onclick = function(){
  for(var i=0;i<6;i++){
    var b = document.createElement('div');
    b.className = 'bat'; b.textContent = '🦇';
    b.style.top = (10 + Math.random()*60) + 'vh';
    b.style.animationDelay = (i*0.25) + 's';
    document.body.appendChild(b);
    setTimeout(function(el){ el.remove(); }.bind(null,b), 6500);
  }
};
