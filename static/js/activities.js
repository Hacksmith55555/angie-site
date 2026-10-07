/* The list of October activities, plus the Pick our next adventure button */

/* Things to do */
var things = [
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
];

$('pickBtn').onclick = function(){
  var t = things[Math.floor(Math.random()*things.length)];
  $('pick').textContent = t[0] + ". " + t[1] + ".";
};