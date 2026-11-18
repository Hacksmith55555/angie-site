/*
  SEASONS: this is the only file you edit to add or unlock a season.
  Keep them in order, oldest first. The site shows the newest on top.

  TO ADD A NEW COMING-SOON SEASON:
    Copy the "winter" block at the bottom, paste it after it, give it a new
    id (letters only, never reused), a flag, a name and some clues.

  TO UNLOCK A SEASON WHEN IT ARRIVES:
    In its block, change  clues:[ ... ]  to  stops:[ ... ]  and add
    a greeting. Each stop is ["Title", "Small description"].
    Optional: pageTitle (browser tab name) and colors (page theme).

  Do NOT change the id of a season that already has photos saved.
*/

var seasons = [

  {
    id:'oct',
    prefix:'a',            // October's old ids (a0, a1...). Leave this alone.
    name:'October',
    flag:'October 2026 \u00b7 Spooky',
    greeting:'Happy October',
    pageTitle:'October, After Dark',
    stops:[
      ["Visit a pumpkin patch","Pick the lumpiest, weirdest one"],
      ["Carve pumpkins","Bonus points for a couples design"],
      ["Get lost in a corn maze","Loser buys the cider"],
      ["Go through a haunted house","Holding hands is mandatory"],
      ["Spooky movie night","Hocus Pocus, Practical Magic, Coraline, Beetlejuice"],
      ["Bake pumpkin bread","Eat it warm, no sharing"],
      ["Tell ghost stories by flashlight","One true one, one made up, guess which"],
      ["Thrift store costume hunt","Matching costumes optional but encouraged"],
      ["Bonfire with s'mores","Blankets and hot chocolate"],
      ["Drive to see the fall leaves","Pick a road and just go"],
      ["Candlelit dinner at home","Lights off, candles on"],
      ["Decorate the place for Halloween","Fake cobwebs everywhere"],
      ["Visit a cemetery at golden hour","Quietly, and with respect"],
      ["Make a spooky playlist","Each of us adds ten songs"],
      ["Trick-or-treat or hand out candy","Taste test the good stuff first"]
    ]
    // No colors here: October uses the default purple from styles.css
  },

  {
    id:'nov',
    name:'November',
    flag:'November 2026 \u00b7 Cozy',
    greeting:'Happy November',
    pageTitle:'November, Cooling Away',
    colors:{
      ink:'#2b1812', ink2:'#41261c', moon:'#f3e6d6', candle:'#e8963c',
      fog:'#b6917c', glow:'#7a4224', road:'#5a3626', navbg:'rgba(43,24,18,.92)'
    },
    // These are starter ideas. Change, delete or add lines any time.
    stops:[
      ["Cook a big dinner together","It smells amazing, and we both help"],
      ["Build a blanket fort","Bring every blanket we own"],
      ["Write what we're thankful for","Read them out loud to each other"],
      ["Hot chocolate bar","Marshmallows, whipped cream, the works"],
      ["Bake a pie from scratch","Pumpkin, apple, or both"],
      ["Walk through the leaves","Golden hour, slow pace"],
      ["Start the Christmas playlist","Is it too early? Never"],
      ["Game night with snacks","Loser does the dishes"],
      ["Look at Christmas lights","Drive around with hot drinks"],
      ["A surprise date","I planned it, you just show up"]
    ]
  },

  {
    id:'winter',
    name:'Winter',
    flag:'Winter 2026 \u00b7 coming soon',
    blurb:'Something is waiting past the first snow.',
    colors:{
      ink:'#0e1d33', ink2:'#1a3150', moon:'#e8f3ff', candle:'#8fd3ff',
      fog:'#7fa3c9', glow:'#2a5584', road:'#2c4d77', navbg:'rgba(14,29,51,.92)'
    },
    clues:["It is cold outside.","Lights and sparkle.","Warm drinks required.","A new year begins."]
  }

];

/* ---- helpers (no need to edit below this line) ---- */

function stopId(s, i){
  return (s.prefix !== undefined ? s.prefix : s.id + '_') + i;
}

function seasonStops(s){
  return (s.stops || []).map(function(t,i){
    return { id:stopId(s,i), title:t[0], sub:t[1], season:s.id };
  });
}

/* The newest season that has been unlocked */
function latestSeason(){
  for(var i = seasons.length - 1; i >= 0; i--){
    if(seasons[i].stops) return seasons[i];
  }
  return null;
}

(function(){
  var s = latestSeason();
  if(!s) return;
  $('title').textContent = (s.greeting || 'Happy ' + s.name) + ', ' + HER;
  if(s.pageTitle) document.title = s.pageTitle;
})();
