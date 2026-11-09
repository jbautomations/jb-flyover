import * as THREE from 'three';
import {PX} from './timeline';
import {INPUTS, Bubble, Chip, RowCard, scheduler} from './content';

const DEFAULT_SS = 3; // texture supersampling
export const COLORS = {
  bg: '#0A0A0A',
  surface: '#131313',
  surface2: '#1C1C1C',
  border: '#2A2A2A',
  accent: '#1AE87A',
  muted: '#8A8A8A',
  soft: '#BDBDBD',
  white: '#FFFFFF',
};
export const FONT = {head: 'Syne', body: 'Inter'};

export type Surface = {c: HTMLCanvasElement; ctx: CanvasRenderingContext2D; w: number; h: number; tex: THREE.CanvasTexture};

export function makeSurface(wUnits: number, hUnits: number, SS = DEFAULT_SS): Surface {
  const c = document.createElement('canvas');
  c.width = Math.round(wUnits * PX * SS);
  c.height = Math.round(hUnits * PX * SS);
  const ctx = c.getContext('2d')!;
  ctx.scale(SS, SS);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  return {c, ctx, w: wUnits * PX, h: hUnits * PX, tex};
}

// ── small drawing helpers ────────────────────────────────────
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
function panel(ctx: CanvasRenderingContext2D, w: number, h: number, r = 28, fill: string = COLORS.surface, stroke: string = COLORS.border) {
  rr(ctx, 1, 1, w - 2, h - 2, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}
function txt(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = 'left', spacing = '0px') {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  (ctx as unknown as {letterSpacing: string}).letterSpacing = spacing;
  ctx.fillText(s, x, y);
  (ctx as unknown as {letterSpacing: string}).letterSpacing = '0px';
}
function wrap(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, maxW: number, lh: number, font: string, color: string): number {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  const words = s.split(' ');
  let line = '';
  let yy = y;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = w;
      yy += lh;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, yy);
  return yy;
}
function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = ((-90 + i * 36) * Math.PI) / 180;
    const rad = i % 2 === 0 ? r : r * 0.42;
    const px = cx + rad * Math.cos(a);
    const py = cy + rad * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

// ── static cards ─────────────────────────────────────────────
export function drawHero(s: Surface) {
  const {ctx, w, h} = s;
  panel(ctx, w, h, 40, '#0F0F0F');
  txt(ctx, 'JB', 64, 84, `800 34px ${FONT.head}`, COLORS.white);
  txt(ctx, '.', 64 + 38, 84, `800 34px ${FONT.head}`, COLORS.accent);
  txt(ctx, 'Automations', 64 + 52, 84, `800 34px ${FONT.head}`, COLORS.white);
  // tag
  rr(ctx, 64, 128, 330, 40, 20);
  ctx.fillStyle = 'rgba(26,232,122,0.10)';
  ctx.fill();
  txt(ctx, 'Appointment reminders for Adelaide', 84, 154, `500 18px ${FONT.body}`, COLORS.accent);
  txt(ctx, 'Your customers', 64, 262, `800 84px ${FONT.head}`, COLORS.white, 'left', '-2px');
  txt(ctx, 'forget.', 64, 350, `800 84px ${FONT.head}`, COLORS.white, 'left', '-2px');
  txt(ctx, "Ours don't.", 64, 438, `800 84px ${FONT.head}`, COLORS.accent, 'left', '-2px');
  wrap(ctx, 'Automatic reminders, follow-ups and review requests for local businesses.', 760, 214, 400, 34, `400 24px ${FONT.body}`, COLORS.soft);
  rr(ctx, 760, 350, 300, 64, 14);
  ctx.fillStyle = COLORS.accent;
  ctx.fill();
  txt(ctx, 'Book a free consultation', 910, 391, `600 21px ${FONT.body}`, '#0A0A0A', 'center');
}

export function drawChip(s: Surface, chip: Chip) {
  const {ctx, w, h} = s;
  panel(ctx, w, h, 30);
  txt(ctx, chip.value, 36, 96, `800 70px ${FONT.head}`, COLORS.white, 'left', '-2px');
  ctx.fillStyle = COLORS.accent;
  ctx.fillRect(36, 116, 64, 5);
  wrap(ctx, chip.label, 36, 152, w - 72, 28, `500 21px ${FONT.body}`, COLORS.muted);
}

export function drawStep(s: Surface, step: {n: string; title: string; body: string}) {
  const {ctx, w, h} = s;
  panel(ctx, w, h, 26);
  txt(ctx, step.n, 28, 78, `800 56px ${FONT.head}`, COLORS.border);
  txt(ctx, step.title, 28, 126, `600 21px ${FONT.body}`, COLORS.white);
  wrap(ctx, step.body, 28, 162, w - 56, 25, `400 16px ${FONT.body}`, COLORS.muted);
}

export function drawScheduler(s: Surface) {
  const {ctx, w, h} = s;
  panel(ctx, w, h, 32);
  txt(ctx, scheduler.title, 36, 64, `800 34px ${FONT.head}`, COLORS.white);
  const bw = 230;
  rr(ctx, w - bw - 32, 30, bw, 44, 22);
  ctx.fillStyle = 'rgba(26,232,122,0.12)';
  ctx.fill();
  txt(ctx, scheduler.badge, w - bw / 2 - 32, 59, `600 18px ${FONT.body}`, COLORS.accent, 'center');
  let y = 104;
  for (const r of scheduler.rows) {
    rr(ctx, 28, y, w - 56, 62, 16);
    ctx.fillStyle = COLORS.surface2;
    ctx.fill();
    txt(ctx, r.time, 52, y + 40, `500 22px ${FONT.body}`, COLORS.muted);
    txt(ctx, r.name, 150, y + 40, `600 24px ${FONT.body}`, COLORS.white);
    const label = r.status;
    ctx.font = `600 17px ${FONT.body}`;
    const tw = ctx.measureText(label).width + 36;
    rr(ctx, w - 52 - tw, y + 14, tw, 34, 17);
    ctx.fillStyle = r.done ? 'rgba(26,232,122,0.14)' : 'rgba(255,255,255,0.08)';
    ctx.fill();
    txt(ctx, label, w - 52 - tw / 2, y + 37, `600 17px ${FONT.body}`, r.done ? COLORS.accent : COLORS.soft, 'center');
    y += 76;
  }
}

export function drawBubble(s: Surface, b: Bubble) {
  const {ctx, w, h} = s;
  const biz = b.from === 'biz';
  rr(ctx, 2, 2, w - 4, h - 4, 30);
  ctx.fillStyle = biz ? '#F3F0FA' : COLORS.accent;
  ctx.fill();
  if (biz) wrap(ctx, b.text, 28, 46, w - 56, 32, `500 24px ${FONT.body}`, '#1B1626');
  else txt(ctx, b.text, w / 2, h / 2 + 11, `700 30px ${FONT.body}`, '#0A0A0A', 'center');
}

export function drawService(s: Surface, svc: {title: string; body: string}) {
  const {ctx, w, h} = s;
  panel(ctx, w, h, 26);
  ctx.fillStyle = COLORS.accent;
  ctx.fillRect(28, 34, 40, 5);
  txt(ctx, svc.title, 28, 86, `700 26px ${FONT.head}`, COLORS.white, 'left', '-0.5px');
  wrap(ctx, svc.body, 28, 126, w - 56, 26, `400 17px ${FONT.body}`, COLORS.muted);
}

export function drawHeading(s: Surface, heading: string, sub: string) {
  const {ctx, w} = s;
  txt(ctx, heading, w / 2, 62, `800 56px ${FONT.head}`, COLORS.white, 'center', '-1.5px');
  txt(ctx, sub, w / 2, 106, `400 24px ${FONT.body}`, COLORS.muted, 'center');
}

export function drawRowCard(s: Surface, card: RowCard) {
  const {ctx, w, h} = s;
  panel(ctx, w, h, 30, card.kind === 'sms' ? '#141414' : COLORS.surface, card.kind === 'sms' ? COLORS.accent : COLORS.border);
  if (card.kind === 'sms') {
    txt(ctx, 'Messages', 28, 48, `700 22px ${FONT.body}`, COLORS.white);
    txt(ctx, INPUTS.brand, 28, 76, `400 16px ${FONT.body}`, COLORS.muted);
    rr(ctx, 24, 96, w - 48, 92, 22);
    ctx.fillStyle = '#F3F0FA';
    ctx.fill();
    wrap(ctx, card.body, 42, 128, w - 84, 26, `500 18px ${FONT.body}`, '#1B1626');
    for (let i = 0; i < 5; i++) star(ctx, 42 + i * 30, 214, 11, '#FFC21A');
    txt(ctx, 'Google review link sent', w - 28, 220, `600 15px ${FONT.body}`, COLORS.accent, 'right');
  } else if (card.kind === 'quote') {
    for (let i = 0; i < 5; i++) star(ctx, 36 + i * 30, 52, 11, COLORS.accent);
    wrap(ctx, `“${card.body}”`, 30, 98, w - 60, 28, `italic 400 20px ${FONT.body}`, COLORS.soft);
    txt(ctx, card.title, 30, h - 54, `600 19px ${FONT.body}`, COLORS.white);
    if (card.subtitle) txt(ctx, card.subtitle, 30, h - 28, `400 15px ${FONT.body}`, COLORS.muted);
  } else {
    ctx.fillStyle = COLORS.accent;
    ctx.fillRect(30, 42, 40, 5);
    txt(ctx, card.title, 30, 96, `700 26px ${FONT.head}`, COLORS.white, 'left', '-0.5px');
    wrap(ctx, card.body, 30, 138, w - 60, 28, `400 18px ${FONT.body}`, COLORS.muted);
  }
}

export function drawCta(s: Surface) {
  const {ctx, w, h} = s;
  txt(ctx, INPUTS.tail.replace(/\.$/, ''), w / 2, 84, `800 54px ${FONT.head}`, COLORS.white, 'center', '-1.5px');
  rr(ctx, w / 2 - 170, 118, 340, 64, 32);
  ctx.fillStyle = COLORS.accent;
  ctx.fill();
  txt(ctx, 'Book a free consultation', w / 2, 159, `600 21px ${FONT.body}`, '#0A0A0A', 'center');
  void h;
}

// ── dynamic end card (redrawn every frame) ───────────────────
export function drawEndCard(s: Surface, st: {badge: number; closing: string; tail: string; cursorOn: boolean; typingTarget: 'closing' | 'tail'}) {
  const {ctx, w, h} = s;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);
  const g = ctx.createRadialGradient(w * 0.82, h * 0.1, 0, w * 0.82, h * 0.1, w * 0.7);
  g.addColorStop(0, 'rgba(26,232,122,0.13)');
  g.addColorStop(1, 'rgba(26,232,122,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // white pill badge
  if (st.badge > 0.001) {
    ctx.save();
    ctx.globalAlpha = st.badge;
    ctx.font = `700 30px ${FONT.head}`;
    const tw = ctx.measureText(INPUTS.brand).width + 76;
    const py = 150 - (1 - st.badge) * 14;
    rr(ctx, w / 2 - tw / 2, py, tw, 70, 35);
    ctx.fillStyle = COLORS.white;
    ctx.fill();
    txt(ctx, INPUTS.brand, w / 2, py + 47, `700 30px ${FONT.head}`, '#0A0A0A', 'center', '-0.5px');
    ctx.restore();
  }

  // closing line (typewriter, split after the first sentence)
  const full = INPUTS.closing;
  const cut = full.indexOf('. ') + 1 || full.length;
  const l1 = st.closing.slice(0, cut);
  const l2 = st.closing.slice(cut).trim();
  const size = 112;
  const font = `800 ${size}px ${FONT.head}`;
  txt(ctx, l1, w / 2, 560, font, COLORS.white, 'center', '-3px');
  txt(ctx, l2, w / 2, 560 + size * 1.08, font, COLORS.accent, 'center', '-3px');

  // italic tail (typewriter)
  txt(ctx, st.tail, w / 2, 560 + size * 1.08 + 110, `italic 400 46px ${FONT.body}`, COLORS.soft, 'center');

  // blinking caret on the active line
  if (st.cursorOn) {
    ctx.fillStyle = COLORS.accent;
    if (st.typingTarget === 'closing' && st.closing.length > 0) {
      const onSecond = st.closing.length > cut;
      ctx.font = font;
      (ctx as unknown as {letterSpacing: string}).letterSpacing = '-3px';
      const line = onSecond ? l2 : l1;
      const lw = ctx.measureText(line).width;
      (ctx as unknown as {letterSpacing: string}).letterSpacing = '0px';
      const y = onSecond ? 560 + size * 1.08 : 560;
      ctx.fillRect(w / 2 + lw / 2 + 8, y - size * 0.82, 8, size * 0.9);
    } else if (st.tail.length > 0) {
      ctx.font = `italic 400 46px ${FONT.body}`;
      const lw = ctx.measureText(st.tail).width;
      ctx.fillRect(w / 2 + lw / 2 + 6, 560 + size * 1.08 + 110 - 38, 4, 46);
    }
  }
}
