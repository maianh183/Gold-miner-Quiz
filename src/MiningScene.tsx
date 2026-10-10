import { useEffect, useRef, useState } from 'react';
import type { Nugget, Round } from './model';
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (v: number) => { const t = Math.min(1, Math.max(0, v)); return t * t * (3 - 2 * t); };
function Gold({ x, y, number, scale = 1, stretch = 1 }: { x: number; y: number; number: number; scale?: number; stretch?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale} ${scale * stretch})`}><ellipse cy="36" rx="44" ry="8" fill="#100e0b" opacity=".35"/><path d="M-43 7 -33-23 -9-35 24-28 43-7 37 24 11 36 -22 30Z" fill="url(#gold)" stroke="#ffd770" strokeWidth="2"/><path d="m-33-23 24-12 33 7-9 13-29 5Z" fill="#ffed9b"/><path d="M-43 7-14-10-22 30M37 24 12 14 11 36M24-28 12-8 43-7" fill="none" stroke="#c88121" strokeWidth="2"/><path d="m-33-23 19 13 26 2 12-20" fill="none" stroke="#fff4b2" strokeWidth="2" opacity=".8"/><text textAnchor="middle" y="11" fill="#573411" fontSize="32" fontWeight="900" stroke="#ffe28a" strokeWidth=".7" paintOrder="stroke">{number}</text></g>;
}
export function MiningScene({ round, selected, onSelect, onRetrieved, ready }: { round: Round; selected: Nugget | null; onSelect: (n: Nugget) => void; onRetrieved: () => void; ready: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const [stretch, setStretch] = useState(1);
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const observer = new ResizeObserver(() => { const box = svg.getBoundingClientRect(); if (box.height) setStretch((box.width / 1200) / (box.height / svg.viewBox.baseVal.height)); });
    observer.observe(svg); return () => observer.disconnect();
  }, [round.nuggets.length]);
  useEffect(() => {
    if (!selected) { setElapsed(0); return; }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => { const t = now - start; setElapsed(t); if (t < 2400) frame = requestAnimationFrame(tick); else onRetrieved(); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [selected, onRetrieved]);
  const columns = Math.max(1, Math.ceil(Math.sqrt(round.nuggets.length * 2)));
  const rows = Math.ceil(round.nuggets.length / columns);
  const height = Math.max(680, 360 + rows * 95);
  const goldScale = Math.min(1, 9 / columns, 1 / Math.sqrt(stretch));
  const grabOffset = 25 * stretch * goldScale;
  const targetAngle = selected ? Math.atan2(selected.x - 600, selected.y - grabOffset - 151) : 0;
  const distance = selected ? Math.hypot(selected.x - 600, selected.y - grabOffset - 151) : 67;
  const angle = elapsed < 550 ? lerp(0, targetAngle, ease(elapsed / 550)) : elapsed > 1550 ? lerp(targetAngle, 0, ease((elapsed - 1550) / 800)) : targetAngle;
  const length = elapsed < 550 ? 67 : elapsed < 1350 ? lerp(67, distance, ease((elapsed - 550) / 800)) : elapsed < 1550 ? distance : lerp(distance, 67, ease((elapsed - 1550) / 800));
  const hookX = 600 + Math.sin(angle) * length, hookY = 151 + Math.cos(angle) * length;
  const attached = !!selected && elapsed >= 1350;
  return <div className={`mining-stage ${selected ? 'retrieving' : ''}`}><svg ref={svgRef} preserveAspectRatio="none" className={`mine-svg ${round.nuggets.length > 30 ? 'dense-mine' : ''}`} viewBox={`0 0 1200 ${height}`} aria-label="Mỏ vàng với cần cẩu và các thỏi vàng được đánh số" role="group">
    <defs><linearGradient id="sky" x2="0" y2="1"><stop stopColor="#243a32"/><stop offset="1" stopColor="#52604a"/></linearGradient><linearGradient id="earth" x2="0" y2="1"><stop stopColor="#49362a"/><stop offset=".5" stopColor="#2e2520"/><stop offset="1" stopColor="#211e1b"/></linearGradient><linearGradient id="gold" x1="0" y1="0" x2=".5" y2="1"><stop stopColor="#ffe588"/><stop offset=".55" stopColor="#f5ba38"/><stop offset="1" stopColor="#db8d20"/></linearGradient><pattern id="grain" width="74" height="67" patternUnits="userSpaceOnUse"><circle cx="12" cy="20" r="1.5" fill="#ac7c4e" opacity=".17"/><path d="m43 43 8-2m-39 15 3 2" stroke="#bd905f" opacity=".12" strokeWidth="2"/></pattern><radialGradient id="lampGlow"><stop stopColor="#ffe6a0" stopOpacity=".3"/><stop offset="1" stopColor="#ffe6a0" stopOpacity="0"/></radialGradient></defs>
    <path fill="url(#sky)" d="M0 0H1200V250H0Z"/>
    <circle cx="1000" cy="68" r="38" fill="#e2dca7" opacity=".12"/><path d="M0 178 110 69 235 176 356 88 492 200 670 110 833 200 964 109 1100 189 1200 131V250H0Z" fill="#2d4237"/><path d="m0 208 134-71 114 70 142-58 147 65 184-54 113 43 179-71 187 73v70H0Z" fill="#24382d"/>
    {[85,135,1010,1060,1130].map((x, i) => <g key={x} transform={`translate(${x} ${135 + i % 2 * 16})`} fill="#1c3028"><path d="m0-53-18 32h9l-22 33h20l-19 23h60L12 12h19L9-21h9Z"/><path d="M-3 25h6v31h-6Z"/></g>)}
    <path d={`M0 244 150 251 263 239 410 249 591 241 735 252 917 240 1090 252 1200 245V${height}H0Z`} fill="url(#earth)"/><path d="M0 243 150 250 263 238 410 248 591 240 735 251 917 239 1090 251 1200 244" fill="none" stroke="#9d7950" strokeWidth="8"/><path d="M0 235 150 242 263 231 410 240 591 233 735 243 917 232 1090 244 1200 236" fill="none" stroke="#626945" strokeWidth="9"/>
    <path d={`M0 300H1200V${height}H0Z`} fill="url(#grain)"/><path d="m0 375 135-18 112 22 166-9M845 402l150-13 120 25 85-9M0 570l91 9 101-21M737 625l170-13 124 17 169-20" fill="none" stroke="#74523a" strokeWidth="2" opacity=".23"/>
    <g transform="translate(53 245)"><path d="M0 0V-109H85V0M-12-101H97M-5-61H91M3-109 78-6M82-109 5-6" stroke="#7d5e3f" strokeWidth="9" fill="none"/><path d="M-7-112h103" stroke="#ad8856" strokeWidth="6"/></g>
    <g transform="translate(1110 260)"><path d="M-7 0v145M53 0v145M-18 12h82M-18 142h82" stroke="#755038" strokeWidth="12"/><path d="M8 67h31l-4 30H12Z" fill="#e8b54e"/><path d="M23 67V47" stroke="#b8925e" strokeWidth="3"/><circle cx="23" cy="83" r="85" fill="url(#lampGlow)"/></g>
    <g transform="translate(233 210)"><path d="m-43-29 7 37h68l9-37Z" fill="#657364" stroke="#28392f" strokeWidth="4"/><path d="m-39-32 15-13 11 5 11-18 19 7 13 18Z" fill="#9f895c"/><circle cx="-23" cy="17" r="11" fill="#202d27" stroke="#879079" strokeWidth="4"/><circle cx="23" cy="17" r="11" fill="#202d27" stroke="#879079" strokeWidth="4"/><path d="M-57 31H58" stroke="#8d805c" strokeWidth="5"/></g>
    <g transform="translate(900 209) rotate(4)"><path d="M-3 0v40" stroke="#8e6b42" strokeWidth="8"/><rect x="-63" y="-35" width="126" height="48" rx="4" fill="#977244" stroke="#be9356" strokeWidth="3"/><text x="0" y="-5" textAnchor="middle" fontSize="15" fontWeight="800" fill="#2d2b20" letterSpacing="2">MỎ TRI THỨC</text><circle cx="-52" cy="-23" r="2" fill="#4b3926"/><circle cx="51" cy="1" r="2" fill="#4b3926"/></g>
    <g className="crane"><path d="M529 228 550 89H575L565 228M655 228 629 90H608L619 228" fill="#b77d30" stroke="#f3ba55" strokeWidth="3"/><path d="m545 173 77-54m-70-4 75 61m-87 8 90 36" stroke="#96612d" strokeWidth="8"/><path d="M525 229H657" stroke="#ecc477" strokeWidth="14"/><path d="M553 79h75l22 26v43H539v-43Z" fill="#efb947" stroke="#f9d57f" strokeWidth="3"/><path d="M555 109h75v18h-75Z" fill="#a7752d"/><circle cx="600" cy="151" r="23" fill="#343b30" stroke="#e0a641" strokeWidth="9"/><circle cx="600" cy="151" r="8" fill="#94927a"/><path d="M567 80 577 53h33l14 27" fill="#f4cb67" stroke="#ffdf8b" strokeWidth="3"/><path d="M578 52c0-19 32-19 32 0" fill="#f5c276"/><path d="M574 43h41l-5-12h-30Z" fill="#edae37"/><circle cx="595" cy="36" r="6" fill="#fff0b0"/><path d="M583 57h23" stroke="#5d4e32" strokeWidth="4"/></g>
    {[{x:63,y:461},{x:1010,y:554},{x:707,y:622},{x:303,y:638}].map((r,i) => <g key={i} transform={`translate(${r.x} ${r.y})`}><path d="m-24 7 9-23 28 3 17 21-17 13-28-2Z" fill="#5d5143"/><path d="m-15-16 10 21 18-18M-5 5l-10 14" fill="none" stroke="#796550" strokeWidth="2"/></g>)}
    {round.nuggets.filter(n => !round.collected.includes(n.number) && !(attached && n.number === selected?.number)).map(n => <g key={n.number} className={`nugget ${selected?.number === n.number ? 'target' : ''}`} role="button" aria-label={`Chọn thỏi vàng ${n.number}`} aria-disabled={!ready || !!selected} tabIndex={ready && !selected ? 0 : -1} onClick={() => ready && !selected && onSelect(n)} onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && ready && !selected) { e.preventDefault(); onSelect(n); } }}><circle cx={n.x} cy={n.y} r="52" fill="transparent"/><Gold x={n.x} y={n.y} number={n.number} scale={goldScale} stretch={stretch}/></g>)}
    <line x1="600" y1="151" x2={hookX} y2={hookY} stroke="#201d18" strokeWidth="7"/><line x1="600" y1="151" x2={hookX} y2={hookY} stroke="#c1b396" strokeWidth="3"/>
    <g transform={`translate(${hookX} ${hookY})`}><path d="M0-5v13m0-5-15 12 7 15M0 3l15 12-7 15" fill="none" stroke="#252b27" strokeWidth="9" strokeLinecap="round"/><path d="M0-5v13m0-5-15 12 7 15M0 3l15 12-7 15" fill="none" stroke="#c3c6af" strokeWidth="5" strokeLinecap="round"/></g>
    {attached && selected && <Gold x={hookX} y={hookY + grabOffset} number={selected.number} scale={goldScale} stretch={stretch}/>}
    <text x="37" y={height - 24} fill="#a39070" fontSize="11" letterSpacing="3">KHÁM PHÁ · SUY NGHĨ · HỌC HỎI</text><g transform={`translate(1114 ${height - 37})`} fill="#a39070" opacity=".65"><path d="m0-8 2 6 6 2-6 2-2 6-2-6-6-2 6-2Zm31-7 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"/></g>
  </svg>{selected && <div className="retrieval-status" role="status">Đang kéo thỏi vàng {selected.number}…</div>}</div>;
}
