import { useState, useRef, useEffect } from 'react';
import type { Question, SavedData } from './model';
import { parseData, questionError, initialData } from './model';
import { QuestionCard } from './QuestionCard';
export type Confirm = (title: string, message: string, action?: string) => Promise<boolean>;
const blank = (): Question => ({ id: crypto.randomUUID(), text: '', options: ['', '', '', ''], correct: -1, explanation: '' });
export function Manager({ data, save, leave, confirm }: { data: SavedData; save: (data: SavedData) => boolean; leave: () => void; confirm: Confirm }) {
  const [draft, setDraft] = useState<Question>(blank);
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [preview, setPreview] = useState(false);
  const [count, setCount] = useState(String(data.config.count));
  const [selection, setSelection] = useState(data.config.selection);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!preview) return;
    const previous = document.activeElement as HTMLElement | null;
    previewRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => previous?.focus();
  }, [preview]);
  const configDirty = count !== String(data.config.count) || selection !== data.config.selection;
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (dirty || configDirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty, configDirty]);
  async function canDiscard() { return !dirty || await confirm('Bỏ thay đổi chưa lưu?', 'Nội dung đang soạn chưa được lưu vào bộ câu hỏi.', 'Bỏ thay đổi'); }
  function update(part: Partial<Question>) { setDraft({ ...draft, ...part }); setDirty(true); setError(''); setNotice(''); }
  async function choose(q?: Question) { if (!(await canDiscard())) return; setDraft(q ? structuredClone(q) : blank()); setEditing(!!q); setDirty(false); setError(''); setNotice(''); }
  function saveQuestion() {
    const problem = questionError(draft);
    if (problem) { setError(problem); return; }
    const q = { ...draft, text: draft.text.trim(), options: draft.options.map(o => o.trim()) as Question['options'], explanation: draft.explanation.trim() };
    const questions = editing ? data.questions.map(old => old.id === q.id ? q : old) : [...data.questions, q];
    const config = { ...data.config, count: data.config.count || 1 };
    if (save({ ...data, questions, config })) { setDraft(q); setEditing(true); setDirty(false); setNotice('Đã lưu câu hỏi trên thiết bị này.'); if (!data.config.count) setCount('1'); }
  }
  async function remove(q: Question) {
    if (!(await confirm('Xóa câu hỏi này?', q.text, 'Xóa câu hỏi'))) return;
    const questions = data.questions.filter(item => item.id !== q.id);
    const config = { ...data.config, count: Math.min(data.config.count, questions.length) };
    if (save({ ...data, questions, config })) { setCount(String(config.count)); if (draft.id === q.id) { setDraft(blank()); setEditing(false); setDirty(false); } }
  }
  function reorder(index: number, delta: number) {
    const questions = [...data.questions];
    [questions[index], questions[index + delta]] = [questions[index + delta], questions[index]];
    save({ ...data, questions });
  }
  function saveConfig() {
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1 || n > data.questions.length) { setError(`Số câu mỗi lượt phải từ 1 đến ${data.questions.length || 0}. Hãy thêm câu hỏi nếu bộ câu hỏi đang trống.`); return; }
    if (save({ ...data, config: { count: n, selection } })) { setNotice('Đã lưu thiết lập lượt chơi.'); setError(''); }
  }
  function exportJSON() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'mo-vang-cau-hoi.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importJSON(file?: File) {
    if (!file) return;
    try {
      if (file.size > 5_000_000) throw new Error('Tệp quá lớn. Vui lòng chọn tệp nhỏ hơn 5 MB.');
      const imported = parseData(JSON.parse(await file.text()));
      if (!(await confirm('Nhập bộ câu hỏi?', `Thay thế bộ hiện tại bằng ${imported.questions.length} câu hỏi từ tệp. Nội dung chưa lưu sẽ bị bỏ. Bạn nên xuất bản sao trước khi thay thế.`, 'Nhập và thay thế'))) return;
      if (save(imported)) { setDraft(blank()); setEditing(false); setDirty(false); setCount(String(imported.config.count)); setSelection(imported.config.selection); setNotice('Đã nhập và lưu bộ câu hỏi.'); setError(''); }
    } catch (e) { setError(e instanceof SyntaxError ? 'Tệp JSON không hợp lệ. Hãy kiểm tra định dạng hoặc chọn một bản sao đã xuất từ trò chơi.' : e instanceof Error ? e.message : 'Không đọc được tệp JSON.'); }
    finally { if (fileRef.current) fileRef.current.value = ''; }
  }
  async function reset() {
    if (!(await confirm('Khôi phục câu hỏi mẫu?', 'Bộ câu hỏi hiện tại và nội dung chưa lưu sẽ được thay thế bằng 12 câu mẫu. Hãy xuất JSON trước nếu bạn muốn giữ bản sao.', 'Khôi phục'))) return;
    const sample = initialData();
    if (save(sample)) { setDraft(blank()); setEditing(false); setDirty(false); setCount('12'); setSelection('random'); setNotice('Đã khôi phục bộ câu hỏi mẫu.'); setError(''); }
  }
  return <main className="management">
    <div className="page-heading"><div><span className="eyebrow">GÓC CHUẨN BỊ CỦA GIÁO VIÊN</span><h1>Bộ câu hỏi</h1><p>Chuẩn bị kiến thức cho chuyến khai phá tiếp theo.</p></div><button className="button gold" onClick={async () => { if ((dirty || configDirty) && !(await confirm('Bỏ thay đổi chưa lưu?', 'Bạn còn nội dung hoặc thiết lập chưa lưu.', 'Về trò chơi'))) return; leave(); }}>← Về trò chơi</button></div>
    <section className="config-panel"><div><h2>Thiết lập lượt chơi</h2><p>Mỗi câu hỏi tương ứng với một thỏi vàng.</p></div><label>Số câu mỗi lượt<input aria-label="Số câu mỗi lượt" type="number" min="1" max={data.questions.length} value={count} onChange={e => setCount(e.target.value)} /></label><label>Cách chọn câu hỏi<select value={selection} onChange={e => setSelection(e.target.value as 'random' | 'first')}><option value="random">Chọn ngẫu nhiên</option><option value="first">Theo thứ tự từ đầu</option></select></label><button className="button" onClick={saveConfig}>Lưu thiết lập</button></section>
    <div className="manager-toolbar"><span><strong>{data.questions.length}</strong> câu hỏi đã lưu</span><div className="button-row"><input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={e => void importJSON(e.target.files?.[0])} /><button className="button small" onClick={() => fileRef.current?.click()}>↑ Nhập JSON</button><button className="button small" onClick={exportJSON}>↓ Xuất JSON</button><button className="text-button" onClick={reset}>Khôi phục bộ mẫu</button></div></div>
    {error && <div className="notice error" role="alert">{error}</div>}{notice && <div className="notice success" role="status">{notice}</div>}
    <div className="editor-grid"><section className="question-list"><button className="button gold add" onClick={() => void choose()}>＋ Thêm câu hỏi</button>{data.questions.length === 0 && <p className="empty">Chưa có câu hỏi. Hãy tạo câu đầu tiên bằng biểu mẫu bên cạnh.</p>}{data.questions.map((q, i) => <article key={q.id} className={`list-item ${editing && draft.id === q.id ? 'active' : ''}`}><button className="list-select" onClick={() => void choose(q)}><span className="index">{String(i + 1).padStart(2, '0')}</span><span>{q.text}</span></button><div className="list-actions"><button aria-label={`Di chuyển câu ${i + 1} lên`} disabled={i === 0} onClick={() => reorder(i, -1)}>↑</button><button aria-label={`Di chuyển câu ${i + 1} xuống`} disabled={i === data.questions.length - 1} onClick={() => reorder(i, 1)}>↓</button><button aria-label={`Xóa câu ${i + 1}`} onClick={() => void remove(q)}>×</button></div></article>)}</section>
    <section className="question-editor"><div className="editor-title"><h2>{editing ? 'Chỉnh sửa câu hỏi' : 'Câu hỏi mới'}</h2><span className="muted">{dirty ? 'Chưa lưu' : '4 đáp án · 1 đáp án đúng'}</span></div><form onSubmit={e => { e.preventDefault(); saveQuestion(); }}><label>Nội dung câu hỏi<textarea rows={3} maxLength={2000} value={draft.text} onChange={e => update({ text: e.target.value })} placeholder="Ví dụ: Hành tinh nào được gọi là Hành tinh đỏ?" /></label><p className="field-hint">Nhập đủ bốn đáp án và chọn nút tròn cạnh đáp án đúng.</p><div className="option-fields">{draft.options.map((option, i) => <div className={`option-field ${draft.correct === i ? 'correct-field' : ''}`} key={i}><input type="radio" name="correct" aria-label={`Chọn ${'ABCD'[i]} là đáp án đúng`} checked={draft.correct === i} onChange={() => update({ correct: i })} /><span>{'ABCD'[i]}</span><input aria-label={`Đáp án ${'ABCD'[i]}`} maxLength={500} value={option} placeholder={`Đáp án ${'ABCD'[i]}`} onChange={e => { const options = [...draft.options] as Question['options']; options[i] = e.target.value; update({ options }); }} /></div>)}</div><label>Giải thích <span className="muted">(không bắt buộc)</span><textarea rows={3} maxLength={3000} value={draft.explanation} onChange={e => update({ explanation: e.target.value })} placeholder="Hiển thị sau khi công bố đáp án…" /></label><div className="editor-footer"><button type="button" className="button" onClick={() => { const problem = questionError(draft); if (problem) setError(problem); else setPreview(true); }}>◉ Xem trước</button><button type="submit" className="button gold">Lưu câu hỏi</button></div></form></section></div>
    {preview && <div ref={previewRef} className="preview-overlay" onKeyDown={e => { if (e.key === 'Escape') setPreview(false); if (e.key === 'Tab') { const controls = Array.from(previewRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []); const first = controls[0], last = controls.at(-1); if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); } } }} role="dialog" aria-modal="true" aria-label="Xem trước câu hỏi"><QuestionCard question={draft} number={0} preview onContinue={() => setPreview(false)} /></div>}
  </main>;
}
