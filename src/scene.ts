import {person,world} from './pixels';
// Cenas desenhadas em canvas: ceu, Brasilia, personagens e obstaculos do jogo.
// Codigo original, sem ativos externos.

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

export function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#7ec8f2');
    grad.addColorStop(0.7, '#cfeafb');
    grad.addColorStop(1, '#f6e7c1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    // sol
    ctx.fillStyle = '#ffd94a';
    ctx.beginPath(); ctx.arc(w - 70, 62, 30, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,217,74,0.35)';
    ctx.beginPath(); ctx.arc(w - 70, 62, 42, 0, Math.PI * 2); ctx.fill();
    // nuvens
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 3; i++) {
        const cx = ((i * 260 + t * 12) % (w + 240)) - 120;
        const cy = 46 + i * 34;
        ctx.beginPath();
        ctx.arc(cx, cy, 16, 0, Math.PI * 2);
        ctx.arc(cx + 18, cy - 6, 13, 0, Math.PI * 2);
        ctx.arc(cx + 36, cy, 15, 0, Math.PI * 2);
        ctx.fill();
    }
}

export function drawSkyline(ctx: CanvasRenderingContext2D, w: number, groundY: number, scroll: number) {
    const base = groundY - 4;
    ctx.save();
    const off = -(scroll * 0.25) % 900;
    for (let k = -1; k < Math.ceil(w / 900) + 1; k++) {
        const ox = off + k * 900;
        // prédios genéricos da Esplanada
        ctx.fillStyle = 'rgba(150,170,190,0.55)';
        ctx.fillRect(ox + 40, base - 60, 60, 60);
        ctx.fillRect(ox + 130, base - 84, 46, 84);
        ctx.fillRect(ox + 220, base - 52, 70, 52);
        // Congresso: torres gêmeas
        ctx.fillStyle = 'rgba(120,145,170,0.65)';
        ctx.fillRect(ox + 380, base - 128, 22, 128);
        ctx.fillRect(ox + 412, base - 128, 22, 128);
        // cúpula e tigela
        ctx.fillStyle = 'rgba(120,145,170,0.6)';
        ctx.beginPath(); ctx.arc(ox + 356, base - 40, 26, Math.PI, 0); ctx.fill();
        ctx.fillRect(ox + 330, base - 40, 52, 40);
        ctx.beginPath(); ctx.ellipse(ox + 480, base - 58, 30, 14, 0, Math.PI, 0); ctx.fill();
        ctx.fillRect(ox + 450, base - 58, 60, 58);
        // catedral: cones
        ctx.fillStyle = 'rgba(140,160,180,0.55)';
        for (let i = 0; i < 6; i++) {
            const cx = ox + 640 + i * 16;
            ctx.beginPath();
            ctx.moveTo(cx, base);
            ctx.quadraticCurveTo(cx + 4, base - 86, cx + 8, base - 96);
            ctx.quadraticCurveTo(cx + 12, base - 86, cx + 16, base);
            ctx.closePath(); ctx.fill();
        }
        ctx.fillRect(ox + 780, base - 66, 50, 66);
    }
    ctx.restore();
}

export function drawGround(ctx: CanvasRenderingContext2D, w: number, h: number, groundY: number, scroll: number) {
    ctx.fillStyle = '#8fbf6f';
    ctx.fillRect(0, groundY, w, h - groundY);
    ctx.fillStyle = '#d9b06a';
    ctx.fillRect(0, groundY + 14, w, 34);
    ctx.fillStyle = '#c69a55';
    const off = -(scroll) % 48;
    for (let x = off; x < w; x += 48) ctx.fillRect(x, groundY + 28, 22, 5);
    // árvores do cerrado
    const toff = -(scroll * 0.6) % 300;
    for (let x = toff - 40; x < w + 40; x += 300) {
        ctx.fillStyle = '#7a5230';
        ctx.fillRect(x + 14, groundY - 26, 7, 26);
        ctx.fillStyle = '#5d9448';
        ctx.beginPath(); ctx.arc(x + 17, groundY - 36, 17, 0, Math.PI * 2); ctx.fill();
    }
}

function planeVector(ctx: CanvasRenderingContext2D, x: number, groundY: number) {
    // avião estilizado na pista
    ctx.fillStyle = '#f4f4f6';
    roundRect(ctx, x, groundY - 78, 210, 46, 20); ctx.fill();
    // nariz
    ctx.beginPath();
    ctx.moveTo(x + 210, groundY - 78);
    ctx.quadraticCurveTo(x + 252, groundY - 68, x + 252, groundY - 44);
    ctx.lineTo(x + 210, groundY - 32);
    ctx.closePath(); ctx.fill();
    // estabilizador e cauda azul
    ctx.fillStyle = '#2b6cb0';
    ctx.beginPath();
    ctx.moveTo(x + 10, groundY - 74);
    ctx.lineTo(x - 24, groundY - 122);
    ctx.lineTo(x + 4, groundY - 122);
    ctx.lineTo(x + 38, groundY - 74);
    ctx.closePath(); ctx.fill();
    // faixa azul
    ctx.fillRect(x + 12, groundY - 56, 232, 8);
    // janelinhas
    ctx.fillStyle = '#9fc4e8';
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(x + 46 + i * 26, groundY - 62, 5, 0, Math.PI * 2); ctx.fill(); }
    // cockpit
    ctx.beginPath(); ctx.arc(x + 216, groundY - 60, 6, 0, Math.PI * 2); ctx.fill();
    // asa
    ctx.fillStyle = '#d7d7dd';
    ctx.beginPath();
    ctx.moveTo(x + 92, groundY - 36);
    ctx.lineTo(x + 150, groundY + 14);
    ctx.lineTo(x + 178, groundY + 14);
    ctx.lineTo(x + 134, groundY - 36);
    ctx.closePath(); ctx.fill();
    // porta + escada de embarque
    ctx.fillStyle = '#8a939e';
    ctx.fillRect(x + 60, groundY - 74, 16, 30);
    ctx.strokeStyle = '#8a939e'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + 66, groundY - 44); ctx.lineTo(x + 42, groundY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 80, groundY - 44); ctx.lineTo(x + 56, groundY); ctx.stroke();
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
        const yy = groundY - 38 + i * 8;
        ctx.beginPath(); ctx.moveTo(x + 63 - i * 5, yy); ctx.lineTo(x + 77 - i * 5, yy); ctx.stroke();
    }
    // trenzinho de pouso
    ctx.fillStyle = '#3a3f4a';
    ctx.beginPath(); ctx.arc(x + 70, groundY - 4, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 190, groundY - 4, 7, 0, Math.PI * 2); ctx.fill();
}

export function drawLula(ctx:CanvasRenderingContext2D,x:number,y:number,h:number,t:number,duck:boolean,invuln:number){person(ctx,'lula',x,y,t,0,invuln);}
export function drawTrump(ctx:CanvasRenderingContext2D,x:number,y:number,t:number){person(ctx,'trump',x,y,t);}
export function drawCitizen(ctx:CanvasRenderingContext2D,x:number,y:number,t:number,phase:number){person(ctx,'citizen',x,y,t,phase);}
export function drawCop(ctx:CanvasRenderingContext2D,x:number,y:number,t:number,phase:number){person(ctx,'cop',x,y,t,phase);}
function carVector(ctx: CanvasRenderingContext2D, x: number, groundY: number, t: number) {
    ctx.save();
    ctx.translate(x, groundY);
    // corpo
    ctx.fillStyle = '#15181d';
    roundRect(ctx, 0, -46, 150, 30, 10); ctx.fill();
    // cabine
    roundRect(ctx, 30, -70, 86, 28, 8); ctx.fill();
    // faixa branca das portas
    ctx.fillStyle = '#f4f4f6';
    ctx.fillRect(40, -46, 70, 28);
    // vidros
    ctx.fillStyle = '#9fc4e8';
    ctx.fillRect(38, -66, 30, 18);
    ctx.fillRect(74, -66, 30, 18);
    // POLICE
    ctx.fillStyle = '#15181d';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('POLICE', 75, -27);
    // giroflex piscando
    const flash = Math.floor(t * 6) % 2 === 0;
    ctx.fillStyle = flash ? '#ed313e' : '#7a0d14';
    ctx.fillRect(58, -79, 16, 8);
    ctx.fillStyle = flash ? '#1a4fd6' : '#0d2a6e';
    ctx.fillRect(76, -79, 16, 8);
    // para-choque e farol
    ctx.fillStyle = '#f5e6a8';
    ctx.fillRect(146, -38, 5, 8);
    // rodas
    ctx.fillStyle = '#0b0d10';
    ctx.beginPath(); ctx.arc(35, -12, 12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(115, -12, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c9c4c0';
    ctx.beginPath(); ctx.arc(35, -12, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(115, -12, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

function ghostVector(ctx: CanvasRenderingContext2D, o: { x: number; y: number }, t: number) {
    const y = o.y;
    ctx.save();
    ctx.globalAlpha = 0.94;
    ctx.fillStyle = '#fdfdf6';
    ctx.beginPath();
    ctx.moveTo(o.x, y + 22);
    ctx.lineTo(o.x, y - 8);
    ctx.arc(o.x + 22, y - 8, 22, Math.PI, 0);
    ctx.lineTo(o.x + 44, y + 22);
    for (let i = 0; i < 4; i++) {
        ctx.quadraticCurveTo(o.x + 44 - i * 11 - 5.5, y + 13, o.x + 44 - (i + 1) * 11, y + 22);
    }
    ctx.closePath(); ctx.fill();
    // olhos e boca
    ctx.fillStyle = '#251f21';
    ctx.beginPath(); ctx.arc(o.x + 14, y - 12, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(o.x + 30, y - 12, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(o.x + 22, y + 1, 4.6, 0, Math.PI * 2); ctx.fill();
    // selo PL
    ctx.fillStyle = '#0b3d91';
    roundRect(ctx, o.x + 5, y + 7, 34, 17, 4); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PL', o.x + 22, y + 19.5);
    ctx.restore();
}

export interface Obstacle { kind: 'wall' | 'tariff' | 'tweet' | 'ghost'; x: number; w: number; h: number; y: number; passed: boolean; ph?: number; baseY?: number; }

export function drawObstacle(ctx: CanvasRenderingContext2D, o: Obstacle, groundY: number, t: number) {
    if (o.kind === 'wall') {
        // muro de tijolos
        ctx.fillStyle = '#a9573f';
        ctx.fillRect(o.x, groundY - o.h, o.w, o.h);
        ctx.strokeStyle = '#7d3a28'; ctx.lineWidth = 2;
        for (let yy = groundY - o.h + 10; yy < groundY; yy += 12) {
            ctx.beginPath(); ctx.moveTo(o.x, yy); ctx.lineTo(o.x + o.w, yy); ctx.stroke();
        }
        for (let yy = 0; yy < o.h; yy += 24) {
            const mid = o.x + o.w / 2 + (yy % 48 === 0 ? 0 : 0);
            ctx.beginPath(); ctx.moveTo(mid, groundY - o.h + yy); ctx.lineTo(mid, Math.min(groundY, groundY - o.h + yy + 12)); ctx.stroke();
        }
        // plaquinha
        ctx.fillStyle = '#fff';
        roundRect(ctx, o.x - 8, groundY - o.h - 24, o.w + 16, 18, 4); ctx.fill();
        ctx.fillStyle = '#7d3a28';
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MURO', o.x + o.w / 2, groundY - o.h - 11);
    } else if (o.kind === 'tariff') {
        // barreira de tarifa
        ctx.fillStyle = '#f5b301';
        ctx.fillRect(o.x, groundY - o.h, o.w, o.h);
        ctx.fillStyle = '#251f21';
        for (let yy = 0; yy < o.h; yy += 18) {
            ctx.save();
            ctx.beginPath(); ctx.rect(o.x, groundY - o.h, o.w, o.h); ctx.clip();
            ctx.translate(o.x + o.w / 2, groundY - o.h + yy + 6);
            ctx.rotate(-0.5);
            ctx.fillRect(-o.w, -5, o.w * 2, 9);
            ctx.restore();
        }
        ctx.fillStyle = '#fff';
        roundRect(ctx, o.x - 22, groundY - o.h - 24, o.w + 44, 18, 4); ctx.fill();
        ctx.fillStyle = '#b3261e';
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TARIFA 50%', o.x + o.w / 2, groundY - o.h - 11);
    } else if (o.kind === 'ghost') {
        drawGhost(ctx, o, t);
    } else {
        // tweet voador
        const fy = o.y + Math.sin(t * 6 + o.x * 0.02) * 4;
        ctx.fillStyle = '#1d9bf0';
        ctx.beginPath(); ctx.ellipse(o.x + 14, fy, 15, 11, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(o.x + 26, fy - 7, 7, 0, Math.PI * 2); ctx.fill();
        // bico
        ctx.fillStyle = '#f5b301';
        ctx.beginPath(); ctx.moveTo(o.x + 32, fy - 8); ctx.lineTo(o.x + 40, fy - 6); ctx.lineTo(o.x + 32, fy - 4); ctx.closePath(); ctx.fill();
        // asa
        ctx.fillStyle = '#0f6cb0';
        const flap = Math.sin(t * 20) * 5;
        ctx.beginPath(); ctx.ellipse(o.x + 10, fy - 6 - flap * 0.4, 9, 5, -0.5, 0, Math.PI * 2); ctx.fill();
        // olho bravo
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(o.x + 28, fy - 8, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#251f21';
        ctx.beginPath(); ctx.arc(o.x + 28.8, fy - 8, 1.3, 0, Math.PI * 2); ctx.fill();
    }
}

export function drawVote(ctx: CanvasRenderingContext2D, v: Vote, t: number) {
    const y = v.y + Math.sin(t * 4 + v.bob) * 4;
    ctx.save();
    ctx.translate(v.x, y);
    ctx.rotate(Math.sin(t * 3 + v.bob) * 0.15);
    // estrela
    ctx.fillStyle = '#ffd94a';
    ctx.strokeStyle = '#d9a400'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 13 : 6;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const px = Math.cos(a) * r, py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
}

export function drawBubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, flip: boolean) {
    ctx.font = 'bold 12px "Courier New", monospace';
    const w = ctx.measureText(text).width + 18;
    const bx = flip ? x - w - 8 : x + 8;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.strokeStyle = '#c9c4c0'; ctx.lineWidth = 1;
    roundRect(ctx, bx, y - 30, w, 24, 8); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    if (flip) { ctx.moveTo(bx + w, y - 12); ctx.lineTo(bx + w + 8, y - 6); ctx.lineTo(bx + w - 2, y - 6); }
    else { ctx.moveTo(bx, y - 12); ctx.lineTo(bx - 8, y - 6); ctx.lineTo(bx + 2, y - 6); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#251f21';
    ctx.textAlign = 'center';
    ctx.fillText(text, bx + w / 2, y - 14);
}

// ---------- capa (menu + imagem de preview) ----------

export function drawCoverScene(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, withTitle: boolean) {
    const groundY=withTitle?h*.76:h-50;
    world(ctx,w,h,h*.38,h-20,80,t);
    drawCop(ctx,w*.12,groundY-32,t,2.1);
    drawCitizen(ctx,w*.28,groundY-15,t,0);
    drawTrump(ctx,w*.47,groundY-55,t);
    drawLula(ctx,w*.7,groundY,74,t,false,0);
    drawGhost(ctx,{x:w*.85,y:groundY-100},t);
    if (withTitle) {
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.font = 'bold 44px "Courier New", monospace';
        ctx.fillText('CORRE, LULA!', w / 2 + 3, 123);
        ctx.fillStyle = '#ffd94a';
        ctx.fillText('CORRE, LULA!', w / 2, 120);
        ctx.fillStyle = '#fff2d6';
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.fillText('foge do Trump e dos seguidores dele', w / 2, 148);
    }
}


const pixCache=new Map<string,HTMLCanvasElement>();
function pixelDraw(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,fn:(c:CanvasRenderingContext2D)=>void){const key=w+'x'+h;let cv=pixCache.get(key);if(!cv){cv=document.createElement('canvas');cv.width=Math.ceil(w/3);cv.height=Math.ceil(h/3);pixCache.set(key,cv);}const p=cv.getContext('2d')!;p.setTransform(1,0,0,1,0,0);p.clearRect(0,0,cv.width,cv.height);p.scale(1/3,1/3);fn(p);ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(cv,Math.floor(x/2)*2,Math.floor(y/2)*2,w,h);ctx.restore();}
export function drawPoliceCar(c:CanvasRenderingContext2D,x:number,y:number,t:number){pixelDraw(c,x-6,y-84,168,90,p=>carVector(p,6,84,t));}
function drawGhost(c:CanvasRenderingContext2D,o:{x:number;y:number},t:number){pixelDraw(c,o.x-3,o.y-34,54,64,p=>ghostVector(p,{x:3,y:34},t));}
export function drawPlane(c:CanvasRenderingContext2D,x:number,y:number){pixelDraw(c,x-30,y-126,290,148,p=>planeVector(p,30,126));}
