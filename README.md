# Mỏ Vàng Tri Thức

A local Vietnamese classroom quiz game built with React, TypeScript, and Vite. All artwork is inline SVG/CSS. There are no accounts, remote assets, API calls, or backend services.

## Run locally

Install Node.js 22.18+ (or Node.js 24 LTS), then run these commands in this folder:

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173 in your browser. Keep the terminal running while playing. Installation needs internet access; once dependencies are installed, the game runs locally without internet access.

```sh
npm run build     # TypeScript checks and production bundle
npm run preview   # Serve the production build at http://127.0.0.1:4173
npm test          # Data, persistence, assignment, and round-state tests
```

Use the localhost server rather than opening index.html directly. Keep the same browser profile and localhost address/port when reopening: browser storage is scoped to that origin.

## Classroom workflow

1. Open **Quản lý câu hỏi**. Twelve editable sample questions are available on first launch.
2. Add or select a question. Enter its text, all four answers, choose the correct answer using its radio button, and optionally add an explanation. Click **Lưu câu hỏi**. Incomplete questions cannot be saved.
3. Use the up/down controls to reorder questions. Reorders and confirmed deletions are saved immediately. **Xem trước** opens an interactive question preview.
4. Set **Số câu mỗi lượt**, choose random selection (default) or the first N questions, then click **Lưu thiết lập**. The round size cannot exceed the bank size.
5. Return to the game and click **Bắt đầu khám phá**. Click a numbered nugget (or focus it with Tab and press Enter/Space). The crane swings toward it, lowers its hook, and lifts the nugget.
6. Select an answer to reveal the result, or click **Hiện đáp án** without selecting. The correct answer and optional explanation remain visible until **Tiếp tục** is clicked.
7. The collected nugget disappears; the other nuggets keep their positions. After the final question, the completion screen offers a fresh round.

There is no score or timer. The teacher controls pacing. **Kết thúc lượt** ends a round early; leaving or restarting a live round requires confirmation. Browser refresh/close also requests confirmation during a live round or unsaved editing (subject to the browser's standard dialog behavior).

## Data and backup

Question banks and configuration are saved in `localStorage` under `mo-vang-tri-thuc.v1`. Each save reports failure if browser storage is blocked or full. Samples never replace existing saved data automatically. Corrupt data produces a recovery message and an empty bank; the old storage entry is preserved until the operator explicitly saves or imports replacement data.

Round progress is intentionally held in memory and is reset after a page reload. Bank edits and round progress are independent. A round has a snapshot of its questions, so its assignments cannot change midway through play.

Use **Xuất JSON** to download a portable backup of the saved bank and configuration. **Nhập JSON** validates the entire file before asking to replace the existing bank. Exports include saved edits only; save any current draft first. Files are limited to 5 MB. Empty banks are allowed. IDs must be nonempty and unique; answers must contain exactly four nonempty strings. The correct-answer index is zero-based (0–3). Text limits are 2,000 characters for a question, 500 per answer, and 3,000 for an explanation.

```json
{
  "version": 1,
  "questions": [
    {
      "id": "question-1",
      "text": "Một giờ có bao nhiêu phút?",
      "options": ["30", "45", "60", "100"],
      "correct": 2,
      "explanation": "Một giờ bằng 60 phút."
    }
  ],
  "config": { "count": 1, "selection": "random" }
}
```

Clearing browser site data removes saved questions. Keep JSON backups of important question sets. No data is sent anywhere.

## Presentation

Designed for desktop and classroom projectors, with responsive layouts, large answer controls, keyboard focus states, and a fullscreen button. Browser F11 also works. Long questions and large banks can require scrolling; concise questions and 5–20 nuggets offer the clearest projector experience. Animations use a browser-native SVG hook and `requestAnimationFrame`, with an interaction lock preventing duplicate selections. The retrieval lasts about 2.4 seconds. Decorative transitions respect reduced-motion settings; the essential crane motion remains visible.

## Source layout

- `src/model.ts`: types, sample data, strict import validation, storage loading, round creation and collection.
- `src/Manager.tsx`: question editing, validation, preview, ordering, configuration, JSON import/export.
- `src/MiningScene.tsx`: local SVG scenery, accessible nuggets, crane motion.
- `src/QuestionCard.tsx`: answer selection, reveal and explanation.
- `src/App.tsx`: game lifecycle, persistence writes, confirmation dialogs, fullscreen.
- `src/styles.css`: responsive arcade and editor design.
- `tests/model.test.ts`: invariant and persistence regression tests.

No public deployment is required. The development and preview servers bind only to `127.0.0.1`.

## Optional browser regression check

`tests/browser-smoke.cjs` drives an isolated headless Microsoft Edge session on Windows, with screenshots written to the ignored `test-results/` directory. Start `npm run dev` first. For this optional check, install the Playwright test utility without changing the app dependencies:

```sh
npm install --no-save --package-lock=false playwright
node tests/browser-smoke.cjs
```

The test expects Microsoft Edge to be installed. It checks the full game loop, duplicate clicks, editing, reordering, preview, persistence, import/export, confirmations, completion, 20-nugget projection layouts, and corrupt-data recovery. It also fails on browser runtime errors or external application requests. The pure model tests remain available through `npm test` without Playwright.
