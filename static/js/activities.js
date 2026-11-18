/* The Pick our next adventure button (uses the newest unlocked season) */

$('pickBtn').onclick = function(){
  var s = latestSeason();
  if(!s) return;

  var all = seasonStops(s);
  var open = all.filter(function(st){ return !mem[st.id]; });
  var pool = open.length ? open : all;

  var t = pool[Math.floor(Math.random()*pool.length)];
  $('pick').textContent = t.title + ". " + t.sub + ".";
};
