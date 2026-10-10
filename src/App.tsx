import { useCallback, useEffect, useRef, useState } from 'react';
import type { Nugget, Round, SavedData } from './model';
import { buildRound, finishNugget, loadData, STORAGE_KEY } from './model';
import { Manager } from './Manager';
import type { Confirm } from './Manager';
import { MiningScene } from './MiningScene';
import { QuestionCard } from './QuestionCard';
type Dialog = { title: string; message: string; action: string; resolve: (answer: boolean) => void };
function Confirmation({ dialog, close }: { dialog: Dialog; close: (answer: boolean) => void }) {
  const cancel = useRef<HTMLButtonElement>(null);
  const accept = useRef<HTMLButtonElement>(null);
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; cancel.current?.focus(); return () => previous?.focus(); }, []);
  return <div className="modal-backdrop" onKeyDown={e => { if (e.key === 'Escape') close(false); if (e.key === 'Tab') { e.preventDefault(); (document.activeElement === cancel.current ? accept : cancel).current?.focus(); } }}><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message"><span className="dialog-icon">◇</span><h2 id="confirm-title">{dialog.title}</h2><p id="confirm-message">{dialog.message}</p><div className="button-row"><button ref={cancel} className="button" onClick={() => close(false)}>Hủy</button><button ref={accept} className="button gold" onClick={() => close(true)}>{dialog.action}</button></div></section></div>;
}
export default function App() {
  const [loaded] = useState(() => { try { return loadData(window.localStorage); } catch { return { data: { version: 1, questions: [], config: { count: 0, selection: 'random' } } as SavedData, warning: 'Trình duyệt không cho phép truy cập bộ nhớ. Hãy cho phép lưu dữ liệu để sử dụng trò chơi.' }; } });
  const [data, setData] = useState(loaded.data);
  const [warning, setWarning] = useState(loaded.warning);
  const [page, setPage] = useState<'game' | 'manager'>('game');
  const [round, setRound] = useState<Round>(() => buildRound(data.questions, data.config));
  const [phase, setPhase] = useState<'ready' | 'mining' | 'retrieving' | 'question' | 'complete'>('ready');
  const [selected, setSelected] = useState<Nugget | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const selectionLock = useRef(false);
  const confirm: Confirm = (title, message, action = 'Đồng ý') => new Promise(resolve => setDialog({ title, message, action, resolve }));
  useEffect(() => {
    if (loaded.warning) return;
    try { if (localStorage.getItem(STORAGE_KEY) === null) localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded.data)); }
    catch { setWarning('Không thể lưu bộ câu hỏi mẫu. Hãy cho phép bộ nhớ trình duyệt hoặc xuất JSON để sao lưu.'); }
  }, [loaded]);
  const active = phase === 'mining' || phase === 'retrieving' || phase === 'question';
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (active) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [active]);
  useEffect(() => { const handler = () => setFullscreen(!!document.fullscreenElement); document.addEventListener('fullscreenchange', handler); return () => document.removeEventListener('fullscreenchange', handler); }, []);
  function save(next: SavedData) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setData(next); setWarning(''); return true; }
    catch { setWarning('Không thể lưu dữ liệu. Bộ nhớ có thể đã đầy hoặc bị chặn. Hãy cho phép bộ nhớ trình duyệt và thử lại; dùng Xuất JSON để sao lưu bộ đã lưu.'); return false; }
  }
  async function start() {
    if (!data.questions.length) { setPage('manager'); return; }
    if (active && !(await confirm('Bắt đầu lượt chơi mới?', 'Tiến độ lượt hiện tại sẽ bị bỏ. Bộ câu hỏi đã lưu vẫn được giữ nguyên.', 'Chơi lại'))) return;
    setRound(buildRound(data.questions, data.config)); setSelected(null); selectionLock.current = false; setPhase('mining');
  }
  async function manage() {
    if (active && !(await confirm('Rời lượt chơi hiện tại?', 'Lượt chơi sẽ kết thúc để bạn chỉnh sửa câu hỏi và thiết lập.', 'Mở quản lý'))) return;
    setSelected(null); selectionLock.current = false; setPhase('ready'); setPage('manager');
  }
  async function endRound() {
    if (await confirm('Kết thúc lượt chơi?', 'Các thỏi vàng còn lại sẽ không được mở trong lượt này.', 'Kết thúc lượt')) { setSelected(null); selectionLock.current = false; setPhase('complete'); }
  }
  const retrieved = useCallback(() => setPhase('question'), []);
  function select(n: Nugget) {
    if (selectionLock.current || phase !== 'mining' || round.collected.includes(n.number)) return;
    selectionLock.current = true; setSelected(n); setPhase('retrieving');
  }
  function finish() {
    if (!selected) return;
    const next = finishNugget(round, selected.number);
    setRound(next); setSelected(null); selectionLock.current = false; setPhase(next.collected.length === next.nuggets.length ? 'complete' : 'mining');
  }
  async function toggleFullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { setWarning('Không mở được toàn màn hình. Bạn có thể dùng phím F11 của trình duyệt.'); }
  }
  const remaining = round.nuggets.length - round.collected.length;
  return <div className="app-shell"><header className="app-header"><a className="brand" href="#" onClick={e => { e.preventDefault(); }} aria-label="Mỏ Vàng Tri Thức"><span className="brand-icon">◆</span><span>MỎ VÀNG<span className="brand-sub">TRI THỨC</span></span></a><div className="header-center"><span className="live-dot"/> LỚP HỌC LÀ MỘT CUỘC PHIÊU LƯU</div><div className="button-row"><button className="button quiet" onClick={toggleFullscreen} aria-label={fullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}>⛶ <span>{fullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span></button>{page === 'game' && <button className="button" onClick={() => void manage()}>⚙ <span>Quản lý câu hỏi</span></button>}</div></header>
    {warning && <div className="notice warning" role="alert">{warning}<button className="text-button" onClick={() => setWarning('')}>Đóng</button></div>}
    {page === 'manager' ? <Manager data={data} save={save} confirm={confirm} leave={() => { setRound(buildRound(data.questions, data.config)); setPage('game'); setPhase('ready'); }}/> : <main className="game-main">
      {phase === 'question' && selected ? <QuestionCard key={selected.number} question={selected.question} number={selected.number} onContinue={finish}/> : phase === 'complete' ? <section className="completion"><div className="completion-rays"/><span className="eyebrow">MỖI CÂU HỎI, MỘT KHO BÁU</span><div className="trophy">✦<span>◆</span>✦</div><h1>{remaining === 0 ? 'Một chuyến khai phá tuyệt vời!' : 'Hẹn gặp ở chuyến khai phá tiếp theo!'}</h1><p>Cả lớp đã khám phá <strong>{round.collected.length} / {round.nuggets.length}</strong> kho báu kiến thức.</p><div className="button-row"><button className="button" onClick={() => void manage()}>Quản lý câu hỏi</button><button className="button gold" onClick={() => void start()}>↻ Bắt đầu lượt mới</button></div><span className="completion-note">Kiến thức là kho báu luôn ở lại cùng bạn.</span></section> : <><div className="game-heading"><div><span className="eyebrow">CHUYẾN PHIÊU LƯU KIẾN THỨC</span><h1>Đào vàng, mở tri thức<span>.</span></h1><p>{phase === 'ready' ? 'Một mỏ vàng đang chờ. Cả lớp đã sẵn sàng khám phá?' : 'Chọn một thỏi vàng. Khám phá một câu hỏi. Cùng nhau tỏa sáng.'}</p></div><div className="round-stats"><span className="stat-gem">◆</span><div><strong>{remaining.toString().padStart(2, '0')}<small> / {round.nuggets.length.toString().padStart(2, '0')}</small></strong><span>THỎI VÀNG CÒN LẠI</span></div></div></div>
      <div className="scene-frame"><div className="scene-topline"><span><span className="live-dot"/>{phase === 'ready' ? 'CHỜ KHỞI HÀNH' : 'ĐANG KHÁM PHÁ'}</span><span>{data.config.selection === 'random' ? 'Câu hỏi ngẫu nhiên' : 'Câu hỏi theo thứ tự'} <span className="separator">/</span> {round.nuggets.length} kho báu</span></div><MiningScene round={round} selected={phase === 'retrieving' ? selected : null} onSelect={select} onRetrieved={retrieved} ready={phase === 'mining'}/>{phase === 'ready' && <div className="start-overlay"><section className="start-card"><span className="start-gem">◆</span><h2>{data.questions.length ? 'Kho báu đang chờ bạn!' : 'Mỏ vàng cần những câu hỏi'}</h2><p>{data.questions.length ? `${data.config.count} thỏi vàng, ${data.config.count} điều thú vị. Hãy cùng bắt đầu!` : 'Thêm câu hỏi để tạo những thỏi vàng đầu tiên cho lớp học.'}</p><button className="button gold large" onClick={() => void start()}>{data.questions.length ? 'Bắt đầu khám phá →' : '＋ Thêm câu hỏi'}</button></section></div>}</div>
      <div className="game-toolbar"><div className="instruction"><span className="instruction-icon">↖</span><span>{phase === 'retrieving' ? 'Cần cẩu đang thu thập kho báu…' : phase === 'ready' ? 'Nhấn bắt đầu để mở mỏ vàng của lớp học.' : 'Nhấp vào một thỏi vàng để mở câu hỏi.'}</span></div><div className="button-row">{active && <button className="text-button" onClick={() => void endRound()}>Kết thúc lượt</button>}<button className="button" onClick={() => void start()}>↻ {phase === 'ready' ? 'Bắt đầu lượt chơi' : 'Chơi lại'}</button></div></div></>}
    </main>}
    <footer className="app-footer"><span>MỎ VÀNG TRI THỨC</span><span>Học cùng nhau, tỏa sáng cùng nhau <span className="footer-star">✦</span></span><span><span className="local-dot"/> Lưu trên thiết bị</span></footer>
    {dialog && <Confirmation dialog={dialog} close={answer => { dialog.resolve(answer); setDialog(null); }}/>}</div>;
}
