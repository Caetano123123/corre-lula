import aberturaAudio from './audio/abertura';
import maoAudio from './audio/mao';
import pobreAudio from './audio/pobre';
const VOICES = {abertura:aberturaAudio,mao:maoAudio,pobre:pobreAudio};
type VoiceKey = keyof typeof VOICES;
import {world,person} from './pixels';
import React, { useEffect, useRef, useState } from 'react';
import { roundRect, drawSky, drawSkyline, drawGround, drawPlane, drawLula, drawTrump, drawCitizen, drawCop, drawPoliceCar, drawObstacle, drawVote, drawBubble, drawCoverScene } from './scene';

type Screen = 'menu' | 'playing' | 'pilot' | 'over';
type DiffKey = 'facil' | 'normal' | 'dificil';
type CtlMode = 'stick' | 'auto';

const DIFFS: Record<DiffKey, { label: string; enemySpeed: number; chaseRange: number; chaseBonus: number }> = {
    facil:   { label: 'Fácil',   enemySpeed: 0.65, chaseRange: 120, chaseBonus: 20 },
    normal:  { label: 'Normal',  enemySpeed: 0.75, chaseRange: 145, chaseBonus: 30 },
    dificil: { label: 'Difícil', enemySpeed: 0.9, chaseRange: 175, chaseBonus: 40 },
};

const LIVES = 5;
const PLAYER_SPEED = 290;
const START_X = 140;
const PLANE_X = 5900;                 // escada do avião
const WORLD_W = PLANE_X + 420;
const PX_PER_M = 5;                   // ~1.150 m de percurso

const HIT_PHRASES = ['Eita!', 'Opa!', 'Ix!', 'Caramba!'];
const TAUNTS = ['PEGA ELE!', 'TARIFA!', 'MAKE... O QUÊ?', 'AGORA VAI!'];

interface Walker {
    type: 'trump' | 'citizen' | 'cop';
    x: number; y: number; minX: number; maxX: number; dir: number;
    speed: number; chaseRange: number; chasing: boolean; phase: number; wait: number;
    bubble: { text: string; life: number } | null;
}
interface Car { x: number; y: number; minX: number; maxX: number; dir: number; speed: number; }
interface Ghost { x: number; y: number; life: number; ph: number; }
interface Prop { kind: 'wall' | 'tariff'; x: number; y: number; w: number; h: number; }
interface VoteItem { x: number; y: number; r: number; taken: boolean; bob: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number; }
interface Floater { x: number; y: number; text: string; life: number; color: string; }

interface G {
    screen: Screen;
    t: number;
    lives: number; votes: number; score: number;
    px: number; py: number; invuln: number;
    camX: number;
    walkers: Walker[]; cars: Car[]; ghosts: Ghost[]; props: Prop[]; voteItems: VoteItem[];
    particles: Particle[]; floaters: Floater[];
    ghostMarks: { x: number; from: 'ahead' | 'behind' }[];
    keys: { up: boolean; down: boolean; left: boolean; right: boolean };
    joy: { active: boolean; id: number; ox: number; oy: number; dx: number; dy: number };
    ctl: CtlMode;
    w: number; h: number; roadTop: number; roadBot: number;
    muted: boolean;
    audio: any;
    onScreen: (s: Screen, score: number, votes: number, dist: number, title?: string, sub?: string) => void;
}

function makeAudio() {
    try {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) return null;
        const ctx = new Ctx();
        const beep = (f0: number, f1: number, dur: number, type: string, vol: number) => {
            try {
                const o = ctx.createOscillator(); const g = ctx.createGain();
                o.type = type as OscillatorType; o.frequency.setValueAtTime(f0, ctx.currentTime);
                o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), ctx.currentTime + dur);
                g.gain.setValueAtTime(vol, ctx.currentTime);
                g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
                o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + dur + 0.02);
            } catch (e) { /* ignore */ }
        };
        return { ctx, beep };
    } catch (e) { return null; }
}

function sfx(g: G, name: string) {
    if (g.muted || !g.audio) return;
    const b = g.audio.beep;
    if (name === 'vote') b(760, 1180, 0.12, 'sine', 0.06);
    else if (name === 'hit') { b(220, 60, 0.3, 'sawtooth', 0.09); }
    else if (name === 'ghost') { b(520, 180, 0.4, 'triangle', 0.05); }
    else if (name === 'win') { b(520, 520, 0.14, 'square', 0.06); setTimeout(() => b(660, 660, 0.14, 'square', 0.06), 150); setTimeout(() => b(880, 1320, 0.3, 'square', 0.07), 300); }
    else if (name === 'over') { b(330, 90, 0.7, 'triangle', 0.09); }
}

// ---------- elenco solto pelo mapa ----------
// [tipo, x, faixa y (0 topo .. 1 base da pista), alcance da patrulha, velocidade base]
const WALKER_TABLE: Array<['trump' | 'citizen' | 'cop', number, number, number, number]> = [
    ['citizen', 620, 0.5, 150, 120],
    ['cop', 760, 0.8, 160, 110],
    ['trump', 950, 0.3, 170, 140],
    ['citizen', 1250, 0.2, 140, 122],
    ['cop', 1520, 0.6, 150, 112],
    ['citizen', 1830, 0.75, 150, 124],
    ['trump', 2120, 0.55, 180, 142],
    ['citizen', 2450, 0.35, 140, 126],
    ['cop', 2650, 0.15, 130, 114],
    ['citizen', 3050, 0.6, 150, 128],
    ['cop', 3150, 0.85, 140, 116],
    ['trump', 3350, 0.4, 180, 144],
    ['citizen', 3650, 0.2, 140, 130],
    ['cop', 3950, 0.5, 150, 118],
    ['citizen', 4250, 0.8, 150, 132],
    ['trump', 4550, 0.25, 180, 146],
    ['cop', 4650, 0.65, 140, 120],
    ['citizen', 4850, 0.45, 140, 134],
    ['cop', 5150, 0.1, 130, 122],
    ['trump', 5350, 0.7, 180, 148],
    ['citizen', 5450, 0.3, 130, 136],
];
// [x, faixa y, alcance, velocidade]
const CAR_TABLE: Array<[number, number, number, number]> = [
    [1050, 0.9, 380, 240],
    [2050, 0.5, 420, 255],
    [3250, 0.1, 360, 265],
    [4350, 0.5, 400, 272],
    [5250, 0.12, 260, 280],
];
const PROP_TABLE: Array<['wall' | 'tariff', number, number]> = [
    ['wall', 840, 0.5], ['tariff', 1450, 0.25], ['wall', 2350, 0.75], ['tariff', 2950, 0.55],
    ['wall', 3550, 0.2], ['tariff', 4150, 0.8], ['wall', 4750, 0.45], ['tariff', 5550, 0.6],
];
const GHOST_MARKS = [
    { x: 1900, from: 'behind' as const },
    { x: 4000, from: 'ahead' as const },
];

// ---------- componente de capa para a imagem do card ----------

export function CoverArt() {
    const ref = useRef<HTMLCanvasElement | null>(null);
    useEffect(() => {
        const cv = ref.current; if (!cv) return;
        const w = 452, h = 574;
        const dpr = 2;
        cv.width = w * dpr; cv.height = h * dpr;
        const ctx = cv.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);
        let raf = 0;
        const loop = (now: number) => {
            drawCoverScene(ctx, w, h, now / 1000, true);
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, []);
    return <canvas ref={ref} style={{ width: '100%', maxWidth: 452, height: 'auto', display: 'block' }} />;
}

function PilotScene(){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const c=ref.current?.getContext('2d');if(!c)return;c.imageSmoothingEnabled=false;
 world(c,480,220,135,220,0,0);c.fillStyle='#30323f';c.fillRect(0,0,480,20);c.fillRect(0,210,480,10);
 c.fillStyle='#cfd7d8';c.fillRect(265,55,215,65);c.fillRect(280,45,200,12);c.fillRect(250,70,25,40);
 c.fillStyle='#8c9da6';c.fillRect(270,111,210,12);c.fillStyle='#233d55';for(let x=285;x<470;x+=27)c.fillRect(x,65,16,20);
 c.fillStyle='#3e5364';c.fillRect(365,85,34,44);c.fillStyle='#bbc1bd';for(let i=0;i<6;i++)c.fillRect(336-i*9,127+i*10,70,8);
 c.save();c.translate(90,192);c.scale(1.45,1.45);person(c,'lula',0,0,0);c.restore();
 // Pilot, original pixel figure in white shirt, dark trousers and peaked cap.
 const r=(x:number,y:number,w:number,h:number,col:string)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
 r(210,105,31,34,'#e5b88b');r(207,102,36,9,'#26364b');r(212,96,28,8,'#e2e3d5');r(237,109,11,5,'#26364b');r(234,119,4,4,'#292a2d');r(238,127,8,7,'#d09c76');
 r(212,138,29,40,'#e7e8db');r(205,143,9,32,'#c9cece');r(236,144,10,29,'#b8c2c5');r(246,168,12,8,'#e5b88b');r(216,143,5,30,'#273c50');r(207,144,9,4,'#d9ba51');r(232,144,9,4,'#d9ba51');
 r(211,176,31,7,'#182b40');r(211,181,12,22,'#26394b');r(231,181,11,22,'#26394b');r(207,200,17,7,'#182634');r(230,200,18,7,'#182634');
 c.font='bold 12px monospace';c.fillStyle='#fff0bc';c.fillText('LULA',72,211);c.fillText('PILOTO',204,91);
 },[]);
 return <canvas ref={ref} width={480} height={220} className="pilot-scene" aria-label="Cutscene em pixel art: Lula ao lado do piloto, diante da escada do avião" role="img"/>;
}

// ---------- o jogo ----------

export function Game() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const [screen, setScreen] = useState<Screen>('menu');
    const [diff, setDiff] = useState<DiffKey>('normal');
    const [ctl, setCtl] = useState<CtlMode>('stick');
    const [stats, setStats] = useState({ score: 0, votes: 0, dist: 0, title: '', sub: '' });
    const [best, setBest] = useState(0);
    const [muted, setMuted] = useState(false);
    const gRef = useRef<G | null>(null);
    const openingRef = useRef<{ctx:AudioContext;buffers:Partial<Record<VoiceKey,AudioBuffer>>;source:AudioBufferSourceNode|null;playing:boolean;plays:number;last:VoiceKey|null;duration:number;error:string}|null>(null);
    const [voiceError, setVoiceError] = useState(false);
    const playVoice = async (key:VoiceKey) => {
        if (gRef.current?.muted) return;
        try {
            if(!openingRef.current) openingRef.current={ctx:new AudioContext(),buffers:{},source:null,playing:false,plays:0,last:null,duration:0,error:''};
            const a=openingRef.current;
            
            await a.ctx.resume();
            if(!a.buffers[key]){const bytes=Uint8Array.from(atob(VOICES[key]),c=>c.charCodeAt(0));a.buffers[key]=await a.ctx.decodeAudioData(bytes.buffer);}
            if(gRef.current?.muted)return;
            try{a.source?.stop();}catch{}
            const source=a.ctx.createBufferSource(),gain=a.ctx.createGain();
            gain.gain.value=.85;source.buffer=a.buffers[key]!;source.connect(gain);gain.connect(a.ctx.destination);
            a.source=source;a.playing=true;a.plays++;a.last=key;a.duration=source.buffer.duration;source.onended=()=>{if(a.source===source)a.playing=false;};source.start();
            setVoiceError(false);
        } catch(e){if(openingRef.current)openingRef.current.error=String(e);setVoiceError(true);}
    };
    const playOpening=()=>playVoice('abertura');
    useEffect(()=>{if(muted){try{openingRef.current?.source?.stop();}catch{}}},[muted]);
    useEffect(()=>()=>{openingRef.current?.ctx.close();},[]);
    const hitIndex=useRef(0);
    useEffect(()=>{
        const onHit=()=>{
            if(!gRef.current || gRef.current.muted || (gRef.current.screen!=='playing' && gRef.current.screen!=='over'))return;
            const order:VoiceKey[]=['mao','pobre'];
            playVoice(order[hitIndex.current%order.length]);hitIndex.current++;
        };
        window.addEventListener('lula-hit',onHit);
        return ()=>window.removeEventListener('lula-hit',onHit);
    },[]);
    useEffect(()=>{if(screen!=='playing' && !(screen==='over' && openingRef.current?.last && openingRef.current.last!=='abertura')){try{openingRef.current?.source?.stop();}catch{}}},[screen]);

    useEffect(() => {
        try { setBest(Number(localStorage.getItem('corre-lula-best') || '0') || 0); } catch (e) { /* ignore */ }
    }, []);

    useEffect(() => { if (gRef.current) gRef.current.muted = muted; }, [muted]);

    useEffect(() => {
        const cv = canvasRef.current; const wrap = wrapRef.current;
        if (!cv || !wrap) return;
        const ctx = cv.getContext('2d');
        if (!ctx) return;

        const g: G = {
            screen: 'menu', t: 0, lives: LIVES, votes: 0, score: 0,
            px: START_X, py: 0, invuln: 0, camX: 0,
            walkers: [], cars: [], ghosts: [], props: [], voteItems: [],
            particles: [], floaters: [], ghostMarks: [],
            keys: { up: false, down: false, left: false, right: false },
            joy: { active: false, id: -1, ox: 0, oy: 0, dx: 0, dy: 0 },
            ctl: 'stick',
            w: 300, h: 300, roadTop: 160, roadBot: 280,
            muted: false, audio: null,
            onScreen: () => undefined,
        };
        gRef.current = g;
        g.onScreen = (s, score, votes, dist, title, sub) => {
            setScreen(s);
            setStats({ score, votes, dist: Math.round(dist), title: title || '', sub: sub || '' });
            if (s === 'over') {
                setBest(prev => {
                    const nb = Math.max(prev, score);
                    try { localStorage.setItem('corre-lula-best', String(nb)); } catch (e) { /* ignore */ }
                    return nb;
                });
            }
        };

        const laneY = (k: number) => g.roadTop + 26 + k * (g.roadBot - g.roadTop - 30);

        const buildWorld = () => {
            g.walkers = WALKER_TABLE.map(([type, x, lane, range, speed], i) => ({
                type, x, y: laneY(lane), minX: x - range, maxX: x + range,
                dir: Math.random() < 0.5 ? -1 : 1, speed,
                chaseRange: 200, chasing: false, phase: i * 1.7, wait: 0, bubble: null,
            }));
            g.cars = CAR_TABLE.map(([x, lane, range, speed], i) => ({
                x, y: laneY(lane), minX: x - range, maxX: x + range,
                dir: i % 2 === 0 ? 1 : -1, speed,
            }));
            g.props = PROP_TABLE.map(([kind, x, lane]) => ({
                kind, x, y: laneY(lane), w: kind === 'wall' ? 34 : 26, h: kind === 'wall' ? 62 : 96,
            }));
            g.voteItems = [];
            for (let x = 520; x < PLANE_X - 300; x += 380 + Math.random() * 160) {
                const base = laneY(0.15 + Math.random() * 0.7) - 40;
                const n = 2 + Math.floor(Math.random() * 3);
                for (let i = 0; i < n; i++) {
                    g.voteItems.push({ x: x + i * 40, y: base, r: 13, taken: false, bob: Math.random() * 6 });
                }
            }
            g.ghosts = [];
            g.ghostMarks = GHOST_MARKS.map(m => ({ ...m }));
        };

        const resize = () => {
            const cw = Math.max(280, wrap.clientWidth);
            const ch = Math.max(380, Math.min(460, Math.round(cw * 0.9)));
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            cv.width = cw * dpr; cv.height = ch * dpr;
            cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const oldTop=g.roadTop, oldBot=g.roadBot;
            g.w = cw; g.h = ch;
            g.roadTop = Math.round(ch * 0.40);
            g.roadBot = ch - 22;
            const remap=(y:number)=>g.roadTop+(y-oldTop)/(oldBot-oldTop)*(g.roadBot-g.roadTop);
            g.py=remap(g.py);
            for(const a of [...g.walkers,...g.cars,...g.props,...g.voteItems,...g.ghosts]) a.y=remap(a.y);
            g.camX=Math.max(0,Math.min(WORLD_W-g.w,g.px-g.w*0.35));
        };
        resize();
        window.addEventListener('resize', resize);
        (window as any).__cl = {
            input: (x:number,y:number) => {g.keys.right=x>0;g.keys.left=x<0;g.keys.up=y<0;g.keys.down=y>0;},
            get: () => ({ x: g.px, y: g.py, lives: g.lives, screen: g.screen, camX: g.camX, ctl:g.ctl, voice:openingRef.current?{playing:openingRef.current.playing,plays:openingRef.current.plays,state:openingRef.current.ctx.state,last:openingRef.current.last,duration:openingRef.current.duration,error:openingRef.current.error}:null }),
        };

        const onKey = (e: KeyboardEvent) => {
            const k = e.code;
            if (k === 'ArrowUp' || k === 'KeyW') { g.keys.up = true; e.preventDefault(); }
            else if (k === 'ArrowDown' || k === 'KeyS') { g.keys.down = true; e.preventDefault(); }
            else if (k === 'ArrowLeft' || k === 'KeyA') { g.keys.left = true; e.preventDefault(); }
            else if (k === 'ArrowRight' || k === 'KeyD') { g.keys.right = true; e.preventDefault(); }
        };
        const resetInput = () => { g.keys = {up:false,down:false,left:false,right:false}; g.joy.active=false; g.joy.dx=0; g.joy.dy=0; };
        window.addEventListener('blur', resetInput);
        const onKeyUp = (e: KeyboardEvent) => {
            const k = e.code;
            if (k === 'ArrowUp' || k === 'KeyW') g.keys.up = false;
            else if (k === 'ArrowDown' || k === 'KeyS') g.keys.down = false;
            else if (k === 'ArrowLeft' || k === 'KeyA') g.keys.left = false;
            else if (k === 'ArrowRight' || k === 'KeyD') g.keys.right = false;
        };
        window.addEventListener('keydown', onKey);
        window.addEventListener('keyup', onKeyUp);

        // analógico virtual flutuante no canvas
        const joyPos = (e: PointerEvent) => {
            const r = cv.getBoundingClientRect();
            return { x: e.clientX - r.left, y: e.clientY - r.top };
        };
        const onPointerDown = (e: PointerEvent) => {
            if (g.screen !== 'playing') return;
            e.preventDefault();
            if (!g.audio) g.audio = makeAudio();
            if (g.joy.active) return;
            const p = joyPos(e);
            g.joy = { active: true, id: e.pointerId, ox: p.x, oy: p.y, dx: 0, dy: 0 };
            try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        };
        const onPointerMove = (e: PointerEvent) => {
            if (!g.joy.active || e.pointerId !== g.joy.id) return;
            const p = joyPos(e);
            const R = 46;
            let dx = (p.x - g.joy.ox) / R, dy = (p.y - g.joy.oy) / R;
            const len = Math.hypot(dx, dy);
            if (len > 1) { dx /= len; dy /= len; }
            g.joy.dx = dx; g.joy.dy = dy;
        };
        const onPointerUp = (e: PointerEvent) => {
            if (e.pointerId !== g.joy.id) return;
            g.joy.active = false; g.joy.dx = 0; g.joy.dy = 0;
        };
        cv.addEventListener('pointerdown', onPointerDown);
        cv.addEventListener('pointermove', onPointerMove);
        cv.addEventListener('pointerup', onPointerUp);
        cv.addEventListener('pointercancel', onPointerUp);

        const burst = (x: number, y: number, color: string, n: number) => {
            for (let i = 0; i < n; i++) {
                const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 180;
                g.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: 0.6, max: 0.6, color, size: 3 + Math.random() * 3 });
            }
        };

        const damage = (srcX: number, srcY: number, phrase: string) => {
            if (g.invuln > 0 || g.screen !== 'playing') return;
            g.lives -= 1;
            g.invuln = 4.0;
            sfx(g, 'hit');
            for(const w of g.walkers){const dx=w.x-g.px,dy=w.y-g.py,d=Math.hypot(dx,dy)||1;if(d<85){w.x+=dx/d*65;w.y+=dy/d*45;}}
            burst(g.px, g.py - 30, '#d23b32', 14);
            g.floaters.push({ x: g.px, y: g.py - 84, text: phrase, life: 1, color: '#ffe4b9' });
            window.dispatchEvent(new Event('lula-hit'));
            if (g.lives <= 0) {
                g.screen = 'over';
                sfx(g, 'over');
                const left = Math.max(0, Math.round((PLANE_X - g.px) / PX_PER_M));
                g.onScreen('over', g.score, g.votes, (g.px - START_X) / PX_PER_M, 'PEGO!', 'A turma do Trump agarrou o Lula faltando ' + left + ' m pro avião.');
            }
        };

        const step = (dt: number) => {
            g.t += dt;
            if (g.screen === 'playing') {
                const d = DIFFS[(g as any).diffKey as DiffKey] || DIFFS.normal;

                // --- movimento livre do jogador ---
                let vx = 0, vy = 0;
                if (g.keys.left) vx -= 1;
                if (g.keys.right) vx += 1;
                if (g.keys.up) vy -= 1;
                if (g.keys.down) vy += 1;
                if (g.joy.active && (g.joy.dx !== 0 || g.joy.dy !== 0)) { vx += g.joy.dx; vy += g.joy.dy; }
                if (g.ctl === 'auto') vx += 1; // corre sozinho em direção ao avião
                const vlen = Math.hypot(vx, vy);
                if (vlen > 1) { vx /= vlen; vy /= vlen; }
                g.px += vx * PLAYER_SPEED * dt;
                g.py += vy * PLAYER_SPEED * 0.9 * dt;
                g.px = Math.max(60, Math.min(WORLD_W - 40, g.px));
                g.py = Math.max(g.roadTop + 26, Math.min(g.roadBot - 4, g.py));

                // câmera segue o Lula
                const target = g.px - g.w * 0.35;
                g.camX = Math.max(0, Math.min(WORLD_W - g.w, target));

                // marcos do fantasma do PL
                for (let i = g.ghostMarks.length - 1; i >= 0; i--) {
                    const m = g.ghostMarks[i];
                    if (g.px >= m.x) {
                        g.ghosts.push({
                            x: g.px + (m.from === 'behind' ? -520 : 560),
                            y: Math.max(g.roadTop + 30, Math.min(g.roadBot - 10, g.py)),
                            life: 16, ph: Math.random() * 6,
                        });
                        g.ghostMarks.splice(i, 1);
                        sfx(g, 'ghost');
                        g.floaters.push({ x: g.px, y: g.py - 100, text: '⚠ o fantasma do PL ' + (m.from === 'behind' ? 'vem atrás!' : 'vem de frente!'), life: 1.6, color: '#0b3d91' });
                    }
                }

                // --- perseguidores soltos pelo mapa ---
                for (const w of g.walkers) {
                    const dx = g.px - w.x, dy = g.py - w.y;
                    const dist = Math.hypot(dx, dy);
                    const range = w.type === 'trump' ? d.chaseRange + 40 : w.type === 'cop' ? d.chaseRange - 20 : d.chaseRange;
                    const wasChasing = w.chasing;
                    w.chasing = w.chasing || dist < range;
                    if (w.chasing && !wasChasing) {
                        w.bubble = { text: TAUNTS[Math.floor(Math.random() * TAUNTS.length)], life: 1.4 };
                    }
                    if (w.chasing && dist > 1) {
                        const sp = Math.min((w.speed + d.chaseBonus) * d.enemySpeed * 1.14, PLAYER_SPEED * 0.54);
                        w.x += (dx / dist) * sp * dt;
                        w.y += (dy / dist) * sp * dt;
                    } else {
                        // patrulha por conta própria
                        if (w.wait > 0) { w.wait -= dt; }
                        else {
                            w.x += w.dir * w.speed * d.enemySpeed * 0.55 * dt;
                            if (w.x > w.maxX) { w.dir = -1; w.wait = 0.4 + Math.random() * 1.2; }
                            else if (w.x < w.minX) { w.dir = 1; w.wait = 0.4 + Math.random() * 1.2; }
                        }
                    }
                    w.y = Math.max(g.roadTop + 26, Math.min(g.roadBot - 4, w.y));
                    if (w.bubble) { w.bubble.life -= dt; if (w.bubble.life <= 0) w.bubble = null; }
                    // encostou: perde vida
                    if (dist < 21) damage(w.x, w.y, 'Encostou!');
                }

                // carros de polícia patrulhando as faixas
                for (const c of g.cars) {
                    c.x += c.dir * Math.min(c.speed * d.enemySpeed * 0.72, PLAYER_SPEED * 0.7) * dt;
                    if (c.x > c.maxX) { c.x = c.maxX; c.dir = -1; }
                    else if (c.x < c.minX) { c.x = c.minX; c.dir = 1; }
                    if (Math.abs(g.px - (c.x + 75)) < 82 && Math.abs(g.py - c.y) < 22) damage(c.x, c.y, HIT_PHRASES[Math.floor(Math.random() * HIT_PHRASES.length)]);
                }

                // fantasmas perseguem direto
                for (const gh of g.ghosts) {
                    const dx = g.px - gh.x, dy = (g.py - 30) - gh.y;
                    const dist = Math.hypot(dx, dy) || 1;
                    const sp = Math.min(170 * d.enemySpeed, PLAYER_SPEED * 0.65);
                    gh.x += (dx / dist) * sp * dt;
                    gh.y += (dy / dist) * sp * dt;
                    gh.life -= dt;
                    if (Math.hypot(g.px - gh.x, (g.py - 30) - gh.y) < 30) {
                        damage(gh.x, gh.y, 'Assombrou!');
                        gh.life = 0;
                    }
                }
                g.ghosts = g.ghosts.filter(gh => gh.life > 0);

                // barreiras fixas no mapa
                for (const p of g.props) {
                    const inX = g.px > p.x - 16 && g.px < p.x + p.w + 16;
                    const inY = Math.abs(g.py - p.y) < 16;
                    if (inX && inY) damage(p.x, p.y, HIT_PHRASES[Math.floor(Math.random() * HIT_PHRASES.length)]);
                }

                // votos
                for (const v of g.voteItems) {
                    if (!v.taken) {
                        const dx = v.x - g.px, dy = v.y - (g.py - 40);
                        if (dx * dx + dy * dy < (v.r + 24) * (v.r + 24)) {
                            v.taken = true; g.votes += 1; g.score += 25;
                            sfx(g, 'vote');
                            burst(v.x, v.y, '#ffd94a', 10);
                            g.floaters.push({ x: v.x, y: v.y - 16, text: '+1 voto', life: 0.9, color: '#1e7a3c' });
                        }
                    }
                }

                if (g.invuln > 0) g.invuln -= dt;
                g.score = Math.max(g.score, Math.floor((g.px - START_X) / 10) + g.votes * 25);

                // chegada ao avião
                if (g.screen === 'playing' && g.px >= PLANE_X) {
                    g.screen = 'pilot';
                    g.floaters=[]; g.particles=[];
                    g.score += g.lives * 50;
                    sfx(g, 'vote');
                    g.onScreen('pilot', g.score, g.votes, (g.px - START_X) / PX_PER_M);
                }
            }

            // partículas e textos
            for (const p of g.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.life -= dt; }
            g.particles = g.particles.filter(p => p.life > 0);
            for (const f of g.floaters) { f.y -= 30 * dt; f.life -= dt; }
            g.floaters = g.floaters.filter(f => f.life > 0);
        };

        const draw = () => {
            const w = g.w, h = g.h;
            ctx.clearRect(0, 0, w, h);

            if (g.screen === 'menu') {
                drawCoverScene(ctx, w, h, g.t, false);
                return;
            }

            const cam = g.camX;
            const gy = g.roadBot;

            world(ctx,w,h,g.roadTop,g.roadBot,cam,g.t);

            // avião no fim do mapa
            const planeSx = PLANE_X - 70 - cam;
            if (planeSx < w + 60 && planeSx > -520) drawPlane(ctx, planeSx, gy - 6);

            // votos
            for (const v of g.voteItems) {
                const sx = v.x - cam;
                if (!v.taken && sx > -30 && sx < w + 30) drawVote(ctx, { ...v, x: sx }, g.t);
            }

            // atores ordenados pela posição dos pés (profundidade 2D)
            type Actor = { y: number; draw: () => void };
            const actors: Actor[] = [];
            for (const p of g.props) {
                const sx = p.x - cam;
                if (sx > -80 && sx < w + 80) {
                    actors.push({ y: p.y, draw: () => drawObstacle(ctx, { kind: p.kind, x: sx, w: p.w, h: p.h, y: p.y, passed: false }, p.y, g.t) });
                }
            }
            for (const c of g.cars) {
                const sx = c.x - cam;
                if (sx > -220 && sx < w + 220) {
                    actors.push({ y: c.y, draw: () => {
                        ctx.save();
                        if (c.dir < 0) { ctx.translate(sx * 2 + 150, 0); ctx.scale(-1, 1); }
                        drawPoliceCar(ctx, sx, c.y, g.t);
                        ctx.restore();
                    } });
                }
            }
            for (const wk of g.walkers) {
                const sx = wk.x - cam;
                if (sx < -60 || sx > w + 60) continue;
                actors.push({ y: wk.y, draw: () => {
                    if (wk.type === 'trump') drawTrump(ctx, sx, wk.y, g.t);
                    else if (wk.type === 'cop') drawCop(ctx, sx, wk.y, g.t, wk.phase);
                    else drawCitizen(ctx, sx, wk.y, g.t, wk.phase);
                    if (wk.bubble) drawBubble(ctx, sx + 8, wk.y - 92, wk.bubble.text, false);
                } });
            }
            // o Lula
            actors.push({ y: g.py, draw: () => drawLula(ctx, g.px - cam, g.py, 74, g.t, false, g.invuln) });

            actors.sort((a, b) => a.y - b.y);
            for (const a of actors) a.draw();

            // fantasmas por cima de tudo (flutuam)
            for (const gh of g.ghosts) {
                const sx = gh.x - cam;
                if (sx > -60 && sx < w + 60) {
                    const bobY = gh.y + Math.sin(g.t * 3 + gh.ph) * 8;
                    drawObstacle(ctx, { kind: 'ghost', x: sx - 22, w: 44, h: 54, y: bobY - 22, passed: false }, gy, g.t);
                }
            }

            // partículas e textos flutuantes
            for (const p of g.particles) {
                ctx.globalAlpha = Math.max(0, p.life / p.max);
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x - cam - p.size / 2, p.y - p.size / 2, p.size, p.size);
            }
            ctx.globalAlpha = 1;
            ctx.textAlign = 'center';
            ctx.font = 'bold 14px "Courier New", monospace';
            for (const f of g.floaters) {
                ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 1.5));
                ctx.fillStyle = f.color;
                ctx.fillText(f.text, f.x - cam, f.y);
            }
            ctx.globalAlpha = 1;

            // analógico virtual
            if (g.joy.active) {
                ctx.globalAlpha = 0.35;
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(g.joy.ox, g.joy.oy, 46, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 0.6;
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(g.joy.ox + g.joy.dx * 34, g.joy.oy + g.joy.dy * 34, 18, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
            }

            // HUD
            const dist = Math.max(0, Math.round((g.px - START_X) / PX_PER_M));
            ctx.textAlign = 'left';
            ctx.font = 'bold ' + (w < 340 ? 11 : 13) + 'px "Courier New", monospace';
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            roundRect(ctx, 8, 8, w < 340 ? 138 : 178, 26, 6); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillText('❤'.repeat(Math.max(0, g.lives)) + '  ⭐ ' + g.votes, 16, 26);

            ctx.textAlign = 'right';
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            roundRect(ctx, w < 340 ? w - 128 : w - 158, 8, w < 340 ? 120 : 150, 26, 6); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillText(dist + ' m · ' + g.score + ' pts', w - 16, 26);

            // barra de progresso até o avião
            const bw = w - 24;
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            roundRect(ctx, 12, 42, bw, 10, 5); ctx.fill();
            ctx.fillStyle = '#25914b';
            roundRect(ctx, 12, 42, Math.max(8, bw * Math.min(1, (g.px - START_X) / (PLANE_X - START_X))), 10, 5); ctx.fill();
            ctx.fillStyle = '#251f21';
            ctx.font = 'bold 10px "Courier New", monospace';
            ctx.textAlign = 'right';
            ctx.fillText('AVIÃO', w - 14, 51);

            if (g.screen === 'playing' && g.px - START_X < 300 && g.t % 4 < 2) {
                ctx.textAlign = 'center';
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.font = 'bold 13px "Courier New", monospace';
                ctx.fillText(g.ctl === 'auto' ? 'ele corre sozinho - você desvia!' : 'companheiros... corre!', w / 2, h - 16);
            }
        };

        let last = performance.now();
        let raf = 0;
        const loop = (now: number) => {
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            step(dt);
            draw();
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);

        (g as any).buildWorld = buildWorld;

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', resize);
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('blur', resetInput);
            cv.removeEventListener('pointerdown', onPointerDown);
            cv.removeEventListener('pointermove', onPointerMove);
            cv.removeEventListener('pointerup', onPointerUp);
            cv.removeEventListener('pointercancel', onPointerUp);
            gRef.current = null;
        };
    }, []);

    const startGame = (d: DiffKey) => {
        const g = gRef.current; if (!g) return;
        (g as any).diffKey = d;
        g.ctl = ctl;
        g.screen = 'playing';
        g.lives = LIVES; g.score = 0; g.votes = 0;
        g.px = START_X; g.py = (g.roadTop + g.roadBot) / 2;
        g.invuln = 0; g.camX = 0;
        g.particles = []; g.floaters = [];
        g.joy = { active: false, id: -1, ox: 0, oy: 0, dx: 0, dy: 0 };
        if ((g as any).buildWorld) (g as any).buildWorld();
        if (!g.audio) g.audio = makeAudio();
        if (g.audio && g.audio.ctx && g.audio.ctx.state === 'suspended') { try { g.audio.ctx.resume(); } catch (e) { /* ignore */ } }
        playOpening();
        setDiff(d);
        setScreen('playing');
    };

    const finishPilot = (choice: 'paguei' | 'que') => {
        const g = gRef.current; if (!g) return;
        const sub = choice === 'paguei'
            ? '"Pagou? Esqueceu a taxa de fugir do roteiro!" O piloto cruza os braços. O avião não decola e o Trump chega. Correu 1 km pra perder no guichê.'
            : '"A memória falhou, mas o boleto não." O piloto fecha a porta. O avião não decola e o Trump chega. Fuga cancelada por excesso de amnésia.';
        g.screen = 'over';
        sfx(g, 'over');
        g.onScreen('over', g.score, g.votes, (g.px - START_X) / PX_PER_M, 'NÃO DECOLOU!', sub);
    };

    const toMenu = () => {
        const g = gRef.current; if (!g) return;
        g.screen = 'menu';
        setScreen('menu');
    };

    return (
        <div className="game-root">
            <div ref={wrapRef} className="game-canvas-wrap">
                <canvas
                    ref={canvasRef}
                    className="game-canvas"
                    onContextMenu={(e) => e.preventDefault()}
                />
                {screen === 'menu' && (
                    <div className="game-overlay">
                        <p className="game-title">CORRE, LULA!</p>
                        <p className="game-sub">O Trump e os seguidores dele estão soltos pelo mapa. Foge deles até o avião.</p>
                        <div className="game-diff-row">
                            {(Object.keys(DIFFS) as DiffKey[]).map(k => (
                                <button key={k} className="game-btn" data-active={diff === k} onClick={() => startGame(k)}>
                                    {DIFFS[k].label}
                                </button>
                            ))}
                        </div>
                        <div className="game-diff-row">
                            <button className="game-btn" data-variant="secondary" data-active={ctl === 'stick'} onClick={() => setCtl('stick')}>Analógico</button>
                            <button className="game-btn" data-variant="secondary" data-active={ctl === 'auto'} onClick={() => setCtl('auto')}>Corre sozinho</button>
                        </div>
                        <p className="game-hint">Arraste na tela ou use as setas/WASD pra correr em qualquer direção</p>
                        {best > 0 && <p className="game-best">Recorde: {best} pts</p>}
                    </div>
                )}
                {screen === 'over' && (
                    <div className="game-overlay">
                        <p className="game-title">{stats.title || 'PEGO!'}</p>
                        <p className="game-sub">{stats.sub}</p>
                        <p className="game-score">{stats.score} pts · {stats.votes} votos</p>
                        {best > 0 && <p className="game-best">Recorde: {best} pts</p>}
                        <div className="game-diff-row">
                            <button className="game-btn" onClick={() => startGame(diff)}>De novo</button>
                            <button className="game-btn" data-variant="secondary" onClick={toMenu}>Menu</button>
                        </div>
                    </div>
                )}
                {screen === 'pilot' && (
                    <div className="game-overlay pilot-overlay">
                        <p className="game-title">NA PISTA!</p>
                        <PilotScene/>
                        <p className="game-sub">PILOTO: "E as dívidas, já pagou?"</p>
                        <div className="game-diff-row">
                            <button className="game-btn" onClick={() => finishPilot('paguei')}>Ja paguei</button>
                            <button className="game-btn" data-variant="secondary" onClick={() => finishPilot('que')}>que dividas?</button>
                        </div>
                    </div>
                )}
            </div>
            {screen === 'playing' && <div className="game-dpad" aria-label="Direção">
                {(['up','left','down','right'] as const).map((dir,i) => <button key={dir} aria-label={['Cima','Esquerda','Baixo','Direita'][i]} className="game-ctl" onPointerDown={e=>{e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); if(gRef.current) gRef.current.keys[dir]=true;}} onPointerUp={()=>{if(gRef.current) gRef.current.keys[dir]=false;}} onPointerCancel={()=>{if(gRef.current) gRef.current.keys[dir]=false;}}>{['↑','←','↓','→'][i]}</button>)}
            </div>}
            <p className="audio-context">Áudios reais recortados para paródia, fora do contexto original. Não são endosso nem defesa de violência. A abertura vem da entrevista ao El País de 7/10/2020, sobre alianças políticas; não é uma confissão.</p>
            {voiceError && <p role="status" className="audio-context">O navegador bloqueou a fala. Toque em "Ouvir abertura" para tentar de novo.</p>}
            <div className="game-controls">
                <button className="game-ctl" disabled={muted} onClick={playOpening}>Ouvir abertura</button>
                <button className="game-ctl" onClick={() => setMuted(m => !m)}>{muted ? '🔇 Sem som' : '🔊 Com som'}</button>
            </div>
        </div>
    );
}
