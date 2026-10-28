type Kind='lula'|'trump'|'citizen'|'cop';
const cache=new Map<string,HTMLCanvasElement>();
// Original 32 x 48 pixel sprites. Each joint and shade is drawn on the pixel grid.
export function person(c:CanvasRenderingContext2D,kind:Kind,x:number,y:number,t:number,phase=0,inv=0,flip=false){
 const frame=Math.floor(t*9+phase)%4; const key=kind+frame;
 let cv=cache.get(key);
 if(!cv){cv=document.createElement('canvas');cv.width=32;cv.height=48;const p=cv.getContext('2d')!;
 const r=(x:number,y:number,w:number,h:number,col:string)=>{p.fillStyle=col;p.fillRect(x,y,w,h)};
 const line=(x:number,y:number,xx:number,yy:number,w:number,col:string)=>{const n=Math.max(Math.abs(xx-x),Math.abs(yy-y));for(let i=0;i<=n;i++)r(Math.round(x+(xx-x)*i/n)-w/2,Math.round(y+(yy-y)*i/n)-w/2,w,w,col)};
 const skin=kind==='trump'?'#e9a16c':kind==='citizen'?'#b97b51':'#dfac82';const light=kind==='trump'?'#ffd09a':kind==='citizen'?'#d99a6c':'#f7cda4';
 const shirt=kind==='lula'?'#ba3038':kind==='citizen'?'#ebc934':kind==='cop'?'#263e59':'#263d69';const sh=kind==='lula'?'#762c3a':kind==='citizen'?'#a48722':'#17283f';const hi=kind==='lula'?'#e35449':kind==='citizen'?'#ffe75b':'#496080';const pants=kind==='citizen'?'#2a693e':'#23364f';
 const poses=[[-6,5,5,-1],[-2,0,3,3],[6,-5,-5,1],[2,0,-3,-3]][frame];const a=poses[0],b=poses[1];
 // far arm and leg, with stepped edges
 line(13,24,10-a,29,4,sh);line(10-a,29,12-a,33,3,skin);
 line(14,33,13+a,39,5,'#17273d');line(13+a,39,11+a,44,4,'#17273d');r(8+a,43,7,3,'#10202b');r(8+a,43,3,1,'#adb8c1');
 // hips and near leg
 r(12,31,10,6,pants);line(19,35,19+b,39,5,pants);line(19+b,39,22+b,44,4,pants);r(21+b,43,7,3,'#12212c');r(24+b,43,4,1,'#bcc7c9');
 // torso shaded left and right
 r(11,20,11,14,shirt);r(9,22,4,9,sh);r(13,20,7,3,hi);r(20,23,3,10,sh);r(12,32,10,2,sh);
 if(kind==='citizen'){r(13,20,6,2,'#2d8240');r(18,23,2,3,'#1a693c');}
 if(kind==='trump'){r(15,20,4,8,'#e5e6d8');r(16,21,2,10,'#c8373c');r(17,31,2,2,'#971e37');}
 if(kind==='cop'){r(12,24,2,3,'#e6bb4a');r(11,31,12,2,'#111d30');r(20,30,3,4,'#17222c');}
 // neck and head, facing right with protruding nose
 r(15,17,5,5,skin);r(12,5,10,13,skin);r(11,8,2,7,'#b27c5a');r(15,6,7,9,light);r(21,10,3,3,skin);r(19,15,3,2,'#986043');r(20,9,2,2,'#25232c');r(18,8,4,1,'#71513c');r(13,12,2,3,skin);
 if(kind==='lula'){r(12,4,9,3,'#dedcd0');r(11,6,3,5,'#afb5b0');r(13,14,2,3,'#e9e5d9');r(15,16,7,3,'#e9e5d9');r(18,14,4,3,'#fff0d8');r(16,18,5,2,'#b7bab3');}
 if(kind==='trump'){r(11,3,10,3,'#e2b74b');r(13,2,8,2,'#ffe078');r(10,5,4,5,'#c78a35');r(17,4,7,2,'#f4ce61');}
 if(kind==='citizen'){r(12,3,9,3,'#302725');r(10,6,5,5,'#302725');r(12,4,3,2,'#544137');}
 if(kind==='cop'){r(10,3,12,4,'#263e59');r(12,2,8,2,'#42617b');r(18,6,7,2,'#17283f');r(16,4,2,2,'#e6c752');r(18,9,5,2,'#152334');}
 // near arm with exposed hand
 line(21,24,23+a,29,4,shirt);line(23+a,29,25+a,26,3,skin);r(24+a,24,3,3,light);
 cache.set(key,cv);}
 c.save();c.translate(Math.round(x),Math.round(y));
 // stepped shadow anchored at feet
 c.fillStyle='rgba(20,37,35,.26)';c.fillRect(-19,-1,37,4);c.fillRect(-13,-3,29,2);c.fillRect(-10,3,21,2);
 if(inv>0&&Math.floor(t*10)%2===0)c.globalAlpha=.38;
 if(flip)c.scale(-1,1);c.imageSmoothingEnabled=false;c.drawImage(cv,-32,-94,64,96);c.restore();
}
export function world(c:CanvasRenderingContext2D,w:number,h:number,top:number,bot:number,cam:number,t:number){
 const r=(x:number,y:number,ww:number,hh:number,col:string)=>{c.fillStyle=col;c.fillRect(Math.floor(x/2)*2,Math.floor(y/2)*2,ww,hh)};
 const bands=['#343448','#514152','#754b54','#a2665b','#bc8263'];
 for(let i=0;i<5;i++)r(0,i*top/5,w,Math.ceil(top/5)+2,bands[i]);
 r(w-92,30,34,26,'#e2a26d');r(w-88,26,26,34,'#e2a26d');
 for(let i=-1;i<w/160+2;i++){let x=i*160-(cam*.25)%160;let bh=60+((i+30)%3)*22;
 r(x,top-bh,62,bh,'#343e4b');r(x+62,top-bh+12,20,bh-12,'#282f3d');r(x+6,top-bh-6,50,6,'#444853');
 for(let yy=top-bh+12;yy<top-10;yy+=18)for(let xx=x+8;xx<x+60;xx+=16)r(xx,yy,6,9,Math.floor(xx+yy)%3===0?'#c89d70':'#535d68');
 if((i+30)%3===0){for(let j=0;j<4;j++){let fy=top-bh+26+((j+Math.floor(t*5))%3)*4;r(x+9+j*10,fy,6,16,'#c7623f');r(x+11+j*10,fy+6,3,10,'#edb66a');}for(let j=0;j<4;j++)r(x+14+j*8,top-bh-10-j*9,20+j*4,14,'rgba(43,40,51,.42)');}}
 r(0,top-6,w,10,'#626467');r(0,top,w,bot-top,'#575b63');r(0,top+8,w,2,'#93918a');r(0,bot-9,w,2,'#93918a');
 for(let x=-(cam%72);x<w;x+=72)r(x,(top+bot)/2,30,3,'#b9aa81');
 for(let x=-(cam%230);x<w;x+=230){r(x+19,top+20,8,3,'#b9b8ac');r(x+23,top+18,4,2,'#d9d4b7');r(x+105,bot-28,11,6,'#292f36');r(x+108,bot-31,5,3,'#38433c');r(x+160,bot-16,5,3,'#ae8e72');}
 r(0,bot,w,h-bot,'#434950');r(0,bot,w,5,'#74767a');
}
