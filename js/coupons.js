/* Coupons: redeem and undo */

/* Coupons. Add "img" with a picture of your coupon to show it instead of the text ticket. */
var coupons = [
 {t:"One cozy movie night",d:"You pick the movie, I make the snacks.",img:""},
 {t:"One back massage",d:"As long as you want. Timer is on your side.",img:""},
 {t:"Breakfast in bed",d:"Pumpkin pancakes included.",img:""},
 {t:"One free pick",d:"You choose the date night, no vetoes.",img:""}
];
var used = store.get('coupons', {});
function paintCoupons(){
  var box = $('coupons'); box.innerHTML = '';
  coupons.forEach(function(c,i){
    var el = document.createElement('div');
    el.className = 'coupon' + (used[i] ? ' used' : '');
    if(c.img){
      var im = document.createElement('img'); im.src = c.img; im.alt = c.t; el.appendChild(im);
    } else {
      var h = document.createElement('h3'); h.textContent = c.t;
      var p = document.createElement('p'); p.textContent = c.d;
      el.appendChild(h); el.appendChild(p);
    }
    var b = document.createElement('button');
    b.className = 'btn'; b.textContent = used[i] ? 'Redeemed' : 'Redeem'; b.disabled = !!used[i];
    b.onclick = function(){
      ask('Redeem coupon','Redeem "' + c.t + '"? You can only use it once.',false,'Redeem').then(function(ok){
        if(!ok) return;
        used[i] = true; store.set('coupons', used); paintCoupons();
      });
    };
    el.appendChild(b);
    if(used[i]){
      var u = document.createElement('button');
      u.className = 'btn alt'; u.textContent = 'Undo'; u.style.marginLeft = '8px';
      u.onclick = function(){
        requireUnlock().then(function(ok){
          if(!ok) return;
          delete used[i]; store.set('coupons', used); paintCoupons();
        });
      };
      el.appendChild(u);
    }
    box.appendChild(el);
  });
}
paintCoupons();
