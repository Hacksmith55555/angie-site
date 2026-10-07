/* Couch Time: movie and video game lists */

/* Couch Time lists */
var movies = [
 ["Hocus Pocus","Cozy and silly, the October classic"],
 ["Practical Magic","Witches, sisters, and a midnight margarita"],
 ["Coraline","Creepy and beautiful"],
 ["Beetlejuice","Say it three times"],
 ["Corpse Bride","Gothic and sweet"],
 ["The Nightmare Before Christmas","Counts as both holidays"],
 ["Halloweentown","Pure nostalgia"],
 ["Halloween (1978)","The original, lights off"],
 ["Scream","Scary and funny at once"],
 ["Ghostbusters","Comfort-food ghosts"]
];
var vgames = [
 ["Luigi's Mansion 3","Spooky but never too scary"],
 ["It Takes Two","Co-op, made for couples"],
 ["Phasmophobia","Hunt ghosts together, scream together"],
 ["Little Nightmares","Creepy puzzle-platformer"],
 ["Cult of the Lamb","Cute cult, dark humor"],
 ["Don't Starve Together","Spooky survival, best with two"],
 ["Stardew Valley","Fall season, with the Spirit's Eve festival"],
 ["Overcooked 2","Chaotic co-op cooking, test your relationship"]
];
function mkList(ulId, barId, arr, key){
  var st = store.get(key, {});
  var ul = $(ulId); ul.innerHTML = '';
  function bar(){
    var n = 0; for(var k in st){ if(st[k]) n++; }
    $(barId).style.width = (n / arr.length * 100) + '%';
  }
  arr.forEach(function(t,i){
    var li = document.createElement('li');
    var lab = document.createElement('label');
    var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!st[i];
    cb.onchange = function(){ st[i] = cb.checked; store.set(key, st); bar(); };
    var sp = document.createElement('span');
    sp.innerHTML = '<b></b><small></small>';
    sp.querySelector('b').textContent = t[0];
    sp.querySelector('small').textContent = t[1];
    lab.appendChild(cb); lab.appendChild(sp); li.appendChild(lab); ul.appendChild(li);
  });
  bar();
}
mkList('list-m','bar-m',movies,'movies');
mkList('list-g','bar-g',vgames,'vgames');
$('pickM').onclick = function(){ $('pm').textContent = movies[Math.floor(Math.random()*movies.length)][0]; };
$('pickG').onclick = function(){ $('pg').textContent = vgames[Math.floor(Math.random()*vgames.length)][0]; };
