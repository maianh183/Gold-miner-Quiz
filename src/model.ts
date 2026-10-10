export type Question = { id: string; text: string; options: [string, string, string, string]; correct: number; explanation: string };
export type Config = { count: number; selection: 'random' | 'first' };
export type SavedData = { version: 1; questions: Question[]; config: Config };
export type Nugget = { number: number; question: Question; x: number; y: number };
export type Round = { nuggets: Nugget[]; collected: number[] };
export const STORAGE_KEY = 'mo-vang-tri-thuc.v1';
export const SAMPLE: Question[] = [
  { id: 'sample-1', text: 'Hành tinh nào được gọi là “Hành tinh đỏ”?', options: ['Sao Kim', 'Sao Hỏa', 'Sao Mộc', 'Sao Thổ'], correct: 1, explanation: 'Bề mặt Sao Hỏa chứa nhiều oxit sắt, tạo nên màu đỏ đặc trưng.' },
  { id: 'sample-2', text: 'Một tam giác có tổng ba góc bằng bao nhiêu độ?', options: ['90°', '180°', '270°', '360°'], correct: 1, explanation: 'Trong hình học phẳng, tổng ba góc trong của một tam giác luôn bằng 180°.' },
  { id: 'sample-3', text: 'Thủ đô của Việt Nam là thành phố nào?', options: ['Huế', 'Đà Nẵng', 'Hà Nội', 'TP. Hồ Chí Minh'], correct: 2, explanation: 'Hà Nội là thủ đô của nước Cộng hòa xã hội chủ nghĩa Việt Nam.' },
  { id: 'sample-4', text: 'Cây xanh hấp thụ khí nào trong quá trình quang hợp?', options: ['Oxi', 'Nitơ', 'Hiđrô', 'Cacbon đioxit'], correct: 3, explanation: 'Cây sử dụng nước, khí CO₂ và năng lượng ánh sáng để tạo chất hữu cơ, đồng thời giải phóng oxi.' },
  { id: 'sample-5', text: 'Đại dương nào lớn nhất trên Trái Đất?', options: ['Đại Tây Dương', 'Ấn Độ Dương', 'Thái Bình Dương', 'Bắc Băng Dương'], correct: 2, explanation: 'Thái Bình Dương là đại dương có diện tích lớn nhất.' },
  { id: 'sample-6', text: 'Từ nào sau đây là từ chỉ hoạt động?', options: ['Xinh đẹp', 'Chạy', 'Xanh', 'Cao'], correct: 1, explanation: '“Chạy” là động từ, dùng để chỉ một hoạt động.' },
  { id: 'sample-7', text: 'Một giờ có bao nhiêu phút?', options: ['30 phút', '45 phút', '60 phút', '100 phút'], correct: 2, explanation: '' },
  { id: 'sample-8', text: 'Loài vật nào sau đây thuộc lớp thú?', options: ['Cá heo', 'Cá mập', 'Cá chép', 'Cá ngựa'], correct: 0, explanation: 'Cá heo thở bằng phổi và nuôi con bằng sữa mẹ.' },
  { id: 'sample-9', text: 'Số nào sau đây chia hết cho 3?', options: ['14', '22', '27', '31'], correct: 2, explanation: '27 = 3 × 9, nên 27 chia hết cho 3.' },
  { id: 'sample-10', text: 'Mặt Trời mọc ở hướng nào?', options: ['Hướng Tây', 'Hướng Bắc', 'Hướng Nam', 'Hướng Đông'], correct: 3, explanation: '' },
  { id: 'sample-11', text: 'Chất nào có công thức hóa học là H₂O?', options: ['Muối ăn', 'Nước', 'Oxi', 'Đường'], correct: 1, explanation: 'Một phân tử nước gồm hai nguyên tử hiđrô và một nguyên tử oxi.' },
  { id: 'sample-12', text: 'Trong truyện cổ tích, ai đã giúp Tấm khi cô gặp khó khăn?', options: ['Ông Bụt', 'Thạch Sanh', 'Sơn Tinh', 'Thánh Gióng'], correct: 0, explanation: '' },
];
export function questionError(q: Question): string {
  if (!q.text.trim()) return 'Vui lòng nhập nội dung câu hỏi.';
  if (q.text.length > 2000) return 'Câu hỏi không được dài quá 2.000 ký tự.';
  if (q.options.length !== 4 || q.options.some(o => !o.trim())) return 'Vui lòng nhập đủ bốn đáp án.';
  if (q.options.some(o => o.length > 500)) return 'Mỗi đáp án không được dài quá 500 ký tự.';
  if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3) return 'Vui lòng chọn một đáp án đúng.';
  if (q.explanation.length > 3000) return 'Giải thích không được dài quá 3.000 ký tự.';
  return '';
}
export function parseData(value: unknown): SavedData {
  if (!value || typeof value !== 'object') throw new Error('Tệp phải chứa một bộ câu hỏi JSON.');
  const d = value as Record<string, unknown>;
  if (d.version !== 1 || !Array.isArray(d.questions)) throw new Error('Định dạng không hợp lệ. Hãy sử dụng tệp JSON được xuất từ trò chơi.');
  const ids = new Set<string>();
  const questions = d.questions.map((item: unknown, i: number) => {
    if (!item || typeof item !== 'object') throw new Error(`Câu ${i + 1} không hợp lệ.`);
    const q = item as Question;
    if (typeof q.id !== 'string' || !q.id || ids.has(q.id) || typeof q.text !== 'string' || !Array.isArray(q.options) || q.options.length !== 4 || q.options.some(o => typeof o !== 'string') || typeof q.correct !== 'number' || (q.explanation !== undefined && typeof q.explanation !== 'string')) throw new Error(`Dữ liệu câu ${i + 1} không hợp lệ hoặc trùng mã.`);
    const cleaned: Question = { id: q.id, text: q.text.trim(), options: q.options.map(o => o.trim()) as Question['options'], correct: q.correct, explanation: q.explanation?.trim() ?? '' };
    const error = questionError(cleaned);
    if (error) throw new Error(`Câu ${i + 1}: ${error}`);
    ids.add(q.id);
    return cleaned;
  });
  const c = d.config as Config | undefined;
  return { version: 1, questions, config: { count: Math.min(questions.length, Math.max(questions.length ? 1 : 0, Number.isInteger(c?.count) ? c!.count : questions.length)), selection: c?.selection === 'first' ? 'first' : 'random' } };
}
export function initialData(): SavedData { return { version: 1, questions: structuredClone(SAMPLE), config: { count: 12, selection: 'random' } }; }
export function loadData(storage: Pick<Storage, 'getItem'>): { data: SavedData; warning: string } {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return { data: initialData(), warning: '' };
    return { data: parseData(JSON.parse(raw)), warning: '' };
  } catch {
    return { data: { version: 1, questions: [], config: { count: 0, selection: 'random' } }, warning: 'Không đọc được dữ liệu đã lưu. Dữ liệu cũ chưa bị ghi đè. Bạn có thể nhập một bản sao JSON hoặc khôi phục bộ mẫu trong phần quản lý.' };
  }
}
export function buildRound(questions: Question[], config: Config, random = Math.random): Round {
  const pool = structuredClone(questions);
  if (config.selection === 'random') for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const selected = pool.slice(0, Math.max(0, Math.min(config.count, pool.length)));
  const columns = Math.max(1, Math.ceil(Math.sqrt(selected.length * 2)));
  const rows = Math.ceil(selected.length / columns);
  return { nuggets: selected.map((question, i) => {
    const row = Math.floor(i / columns), col = i % columns;
    const rowCount = Math.min(columns, selected.length - row * columns);
    return { question, number: i + 1, x: 100 + (col + (columns - rowCount) / 2 + 0.5) * 1000 / columns + (row % 2 ? 12 : -12), y: 292 + (row + 0.5) * Math.max(320, rows * 95) / Math.max(1, rows) + Math.sin(i * 2.4) * Math.min(18, 55 / rows) };
  }), collected: [] };
}
export function finishNugget(round: Round, number: number): Round {
  if (!round.nuggets.some(n => n.number === number) || round.collected.includes(number)) return round;
  return { ...round, collected: [...round.collected, number] };
}
