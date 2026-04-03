// ─── KONSTANTA & STATE ───────────────────────────────────────────────────────
const boardEl   = document.getElementById('game-board');
const scoreEl   = document.getElementById('score');
const overlay   = document.getElementById('overlay');
const statusEl  = document.getElementById('status-text');
const btnResume = document.getElementById('btn-resume');
const btnPause  = document.getElementById('btn-pause');

const BOARD_SIZE  = 8;
const LIFT_OFFSET = 180;

let board       = [];
let score       = 0;
let bestScore   = parseInt(localStorage.getItem('blockBest') || '0');
let isPaused    = false;
let gameOver    = false;
let activeSlots = [null, null, null];
let dragState   = null;
let cellCoords = []; // Untuk menyimpan posisi grid secara permanen saat drag dimulai

const SHAPES = [
  { name: 'dot',      color: '#f472b6', cells: [[0,0]] },
  { name: 'line-h2',  color: '#fb923c', cells: [[0,0],[0,1]] },
  { name: 'line-h3',  color: '#fb923c', cells: [[0,0],[0,1],[0,2]] },
  { name: 'line-h4',  color: '#facc15', cells: [[0,0],[0,1],[0,2],[0,3]] },
  { name: 'line-v2',  color: '#a78bfa', cells: [[0,0],[1,0]] },
  { name: 'line-v3',  color: '#a78bfa', cells: [[0,0],[1,0],[2,0]] },
  { name: 'line-v4',  color: '#60a5fa', cells: [[0,0],[1,0],[2,0],[3,0]] },
  { name: 'square-2', color: '#34d399', cells: [[0,0],[0,1],[1,0],[1,1]] },
  { name: 'square-3', color: '#2dd4bf', cells: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]] },
  { name: 'L-shape',  color: '#38bdf8', cells: [[0,0],[1,0],[2,0],[2,1]] },
  { name: 'J-shape',  color: '#f87171', cells: [[0,1],[1,1],[2,0],[2,1]] },
  { name: 'T-shape',  color: '#c084fc', cells: [[0,0],[0,1],[0,2],[1,1]] },
  { name: 'S-shape',  color: '#86efac', cells: [[0,1],[0,2],[1,0],[1,1]] },
  { name: 'Z-shape',  color: '#fca5a5', cells: [[0,0],[0,1],[1,1],[1,2]] },
];



// Di dalam game.js Block Blast
const CELL_SIZE = 50; // Ukuran satu kotak
const GRID_OFFSET_X = 50; // Jarak papan dari kiri layar
const GRID_OFFSET_Y = 100; // Jarak papan dari atas layar

function getGridCoords(mouseX, mouseY) {
    // Hitung posisi relatif terhadap pojok kiri atas papan
    const relativeX = mouseX - GRID_OFFSET_X;
    const relativeY = mouseY - GRID_OFFSET_Y;

    // Gunakan Math.floor untuk mendapatkan indeks array (0-7)
    const col = Math.floor(relativeX / CELL_SIZE);
    const row = Math.floor(relativeY / CELL_SIZE);

    // Validasi agar tidak keluar dari batas papan 8x8
    if (col >= 0 && col < 8 && row >= 0 && row < 8) {
        return { row, col };
    }
    return null; // Di luar papan
}


// ─── BOARD ───────────────────────────────────────────────────────────────────
function createBoard() {
  boardEl.innerHTML = '';
  board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.id = `cell-${r}-${c}`;
      cell.dataset.row = r;
      cell.dataset.col = c;
      boardEl.appendChild(cell);
    }
  }
}

// checking shape tidak mustahil
function canShapeFitAnywhere(shape) {
  // Loop setiap baris dan kolom di papan
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      // Cek apakah bentuk ini muat jika diletakkan di koordinat [r, c]
      if (canPlace(r, c, shape)) {
        return true; // Ketemu satu posisi! Berarti blok ini aman untuk di-spawn.
      }
    }
  }
  return false; // Tidak ada ruang sama sekali untuk blok ini.
}


function renderBlockInSlot(slotEl, shape, slotIndex) {
  const rows = Math.max(...shape.cells.map(c => c[0])) + 1;
  const cols = Math.max(...shape.cells.map(c => c[1])) + 1;
  const PART = 22; // Ukuran kotak kecil di spawner

  const blockEl = document.createElement('div');
  blockEl.className = 'draggable-block';
  blockEl.dataset.slotIndex = slotIndex;
  blockEl.style.cssText = `display:grid;grid-template-rows:repeat(${rows},${PART}px);grid-template-columns:repeat(${cols},${PART}px);gap:2px;`;

  shape.cells.forEach(([r, c]) => {
    const part = document.createElement('div');
    part.className = 'block-part';
    part.style.cssText = `grid-row:${r+1};grid-column:${c+1};background:${shape.color};width:${PART}px;height:${PART}px;border-radius:4px;box-shadow:inset 0 2px 0 rgba(255,255,255,0.25),inset 0 -2px 0 rgba(0,0,0,0.2);pointer-events:none;`;
    blockEl.appendChild(part);
  });

  slotEl.appendChild(blockEl);
  attachDrag(blockEl);
}

function showInvalidPreview(row, col, shape) {
  shape.cells.forEach(([dr, dc]) => {
    const r = row + dr, c = col + dc;
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
      const cellEl = document.getElementById(`cell-${r}-${c}`);
      if (cellEl && !cellEl.classList.contains('filled')) {
        cellEl.classList.add('preview-bad');
      }
    }
  });
}


// ─── SPAWNER ─────────────────────────────────────────────────────────────────
function spawnBlocks() {
  // Pastikan board tidak kosong saat pengecekan
  if (board.length === 0) board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));

  // Filter balok yang muat di sisa papan
  const validShapes = SHAPES.filter(shape => canShapeFitAnywhere(shape));
  const pool = validShapes.length > 0 ? validShapes : SHAPES;

  for (let i = 0; i < 3; i++) {
    const slotEl = document.getElementById(`slot-${i}`);
    if (!slotEl) continue;
    slotEl.innerHTML = '';
    
    const shape = pool[Math.floor(Math.random() * pool.length)];
    activeSlots[i] = shape;

    // Panggil fungsi render yang kita buat di atas
    renderBlockInSlot(slotEl, shape, i); 
  }
  
  setTimeout(checkGameOver, 50);
}

// ─── DRAG & DROP ─────────────────────────────────────────────────────────────
function attachDrag(el) {
const onStart = (e) => {
    if (dragState || isPaused || gameOver) return;
    
    const slotIndex = parseInt(el.dataset.slotIndex);
    const shape = activeSlots[slotIndex];
    if (!shape) return;

    // Ambil ukuran kotak grid papan untuk perbandingan scale
    const boardCell = document.querySelector('.cell').getBoundingClientRect();
    const spawnerPart = el.querySelector('.block-part').getBoundingClientRect();
    const scaleRatio = boardCell.width / spawnerPart.width;

    // Caching koordinat grid (tetap diperlukan untuk performa)
    cellCoords = Array.from(document.querySelectorAll('.cell')).map(cell => {
        const r = cell.getBoundingClientRect();
        return {
            row: parseInt(cell.dataset.row),
            col: parseInt(cell.dataset.col),
            centerX: r.left + r.width / 2,
            centerY: r.top + r.height / 2
        };
    });

    dragState = { el, slotIndex, shape, scaleRatio };
    
    // Langsung pindahkan ke fixed agar bisa melayang
    el.style.position = 'fixed';
    el.style.zIndex = '1000';
    el.style.pointerEvents = 'none';

    onMove(e);
};

const onMove = (e) => {
    if (!dragState) return;

    const touch = e.touches ? e.touches[0] : e;
    
    // Gunakan clientX dan clientY langsung
    const targetX = touch.clientX;
    // LIFT_OFFSET menentukan seberapa tinggi balok mengambang di atas jari
    const targetY = touch.clientY - LIFT_OFFSET; 

    // UPDATE VISUAL
    dragState.el.style.left = `${targetX}px`;
    dragState.el.style.top  = `${targetY}px`;
    
    // KUNCINYA: Paksa transform-origin ke tengah agar saat scale tidak bergeser ke bawah
    dragState.el.style.transformOrigin = 'center center';
    dragState.el.style.transform = `translate(-50%, -50%) scale(${dragState.scaleRatio})`;

    // Cari cell terdekat
    let closest = null;
    let minDist = 40; 

    for (let c of cellCoords) {
        const dist = Math.hypot(targetX - c.centerX, targetY - c.centerY);
        if (dist < minDist) {
            minDist = dist;
            closest = c;
        }
    }

    clearPreview();

    if (closest) {
        const { shape } = dragState;
        
        // Hitung dimensi bentuk balok
        const rows = shape.cells.map(cell => cell[0]);
        const cols = shape.cells.map(cell => cell[1]);
        const shapeH = Math.max(...rows) - Math.min(...rows) + 1;
        const shapeW = Math.max(...cols) - Math.min(...cols) + 1;

        // Offset agar preview tepat di tengah koordinat targetX/Y
        const rOff = Math.floor((shapeH - 1) / 2);
        const cOff = Math.floor((shapeW - 1) / 2);

        const targetR = closest.row - rOff;
        const targetC = closest.col - cOff;

        if (canPlace(targetR, targetC, shape)) {
            updatePreview(targetR, targetC, shape);
            dragState.targetR = targetR;
            dragState.targetC = targetC;
        } else {
            // Tampilkan preview merah jika tidak muat
            showInvalidPreview(targetR, targetC, shape); 
            dragState.targetR = null;
            dragState.targetC = null;
        }
    } else {
        dragState.targetR = null;
        dragState.targetC = null;
    }
};



  const onEnd = (e) => {
    if (!dragState || dragState.el !== el) return;
    clearPreview();

    let placed = false;
    // Gunakan targetR dan targetC yang sudah dihitung berdasarkan posisi floating
    if (dragState.targetR !== null && dragState.targetC !== null) {
      const r = dragState.targetR;
      const c = dragState.targetC;
      
      if (canPlace(r, c, dragState.shape)) {
        placeBlock(r, c, dragState.shape);
        el.remove();
        activeSlots[dragState.slotIndex] = null;
        placed = true;
        checkLineClears();
        if (activeSlots.every(s => s === null)) spawnBlocks();
        else checkGameOver();
      }
    }

    if (!placed) resetEl(el);
    dragState = null;
  };

  el.addEventListener('mousedown',  onStart);
  el.addEventListener('touchstart', onStart, { passive: false });
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup',   onEnd);
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('touchend',  onEnd);
}

function resetEl(el) {
    // Kembalikan semua ke setelan pabrik (sebelum ditarik)
    el.style.position = '';
    el.style.left = '';
    el.style.top = '';
    el.style.transform = 'scale(1)';
    el.style.pointerEvents = 'auto';
    el.style.zIndex = '';
}

// ─── PLACEMENT ───────────────────────────────────────────────────────────────
function canPlace(row, col, shape) {
  return shape.cells.every(([dr, dc]) => {
    const r = row + dr, c = col + dc;
    return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === 0;
  });
}

function placeBlock(row, col, shape) {
  shape.cells.forEach(([dr, dc]) => {
    const r = row + dr, c = col + dc;
    board[r][c] = 1;
    const cellEl = document.getElementById(`cell-${r}-${c}`);
    cellEl.classList.add('filled');
    cellEl.style.backgroundColor = shape.color;
  });
}

// ─── PREVIEW ─────────────────────────────────────────────────────────────────
function updatePreview(row, col, shape) {
  clearPreview();
  const valid = canPlace(row, col, shape);
  shape.cells.forEach(([dr, dc]) => {
    const r = row + dr, c = col + dc;
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return;
    const cellEl = document.getElementById(`cell-${r}-${c}`);
    if (cellEl) cellEl.classList.add(valid ? 'preview' : 'preview-bad');
  });
}

function clearPreview() {
  document.querySelectorAll('.preview,.preview-bad').forEach(el => {
    el.classList.remove('preview', 'preview-bad');
  });
}

// ─── LINE CLEAR ──────────────────────────────────────────────────────────────
function checkLineClears() {
  const rowsToClear = [], colsToClear = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (board[i].every(v => v === 1))     rowsToClear.push(i);
    if (board.every(row => row[i] === 1)) colsToClear.push(i);
  }

  const toClear = new Set();
  rowsToClear.forEach(r => { for (let c = 0; c < BOARD_SIZE; c++) toClear.add(`${r}-${c}`); });
  colsToClear.forEach(c => { for (let r = 0; r < BOARD_SIZE; r++) toClear.add(`${r}-${c}`); });
  if (!toClear.size) return;

  toClear.forEach(key => {
    const [r, c] = key.split('-').map(Number);
    document.getElementById(`cell-${r}-${c}`).classList.add('clearing');
  });

  setTimeout(() => {
    toClear.forEach(key => {
      const [r, c] = key.split('-').map(Number);
      board[r][c] = 0;
      const cellEl = document.getElementById(`cell-${r}-${c}`);
      cellEl.classList.remove('filled', 'clearing');
      cellEl.style.backgroundColor = '';
    });
  }, 350);

  const lines = rowsToClear.length + colsToClear.length;
  score += lines * 10 * (lines > 1 ? lines * lines : 1);
  updateScore();
}

function updateScore() {
  scoreEl.textContent = score;
  scoreEl.classList.add('pop');
  setTimeout(() => scoreEl.classList.remove('pop'), 200);
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('blockBest', bestScore);
    const bestEl = document.getElementById('best-score');
    if (bestEl) bestEl.textContent = bestScore;
  }
}

// ─── GAME OVER ───────────────────────────────────────────────────────────────
function checkGameOver() {
  const remaining = activeSlots.filter(s => s !== null);
  if (!remaining.length) return;
  const anyFits = remaining.some(shape => {
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++)
        if (canPlace(r, c, shape)) return true;
    return false;
  });
  if (!anyFits) {
    gameOver = true;
    if (statusEl) {
      statusEl.innerHTML = `GAME OVER<br><span style="font-size:1.2rem;color:#00ffcc">Skor: ${score}</span>`;
    }
    if (overlay) overlay.style.display = 'flex';
    if (btnResume) btnResume.textContent = 'MAIN LAGI';
  }
}

// ─── PAUSE ───────────────────────────────────────────────────────────────────
function togglePause() {
  if (gameOver) return;
  isPaused = !isPaused;
  if (statusEl) statusEl.innerHTML = 'PAUSED';
  if (btnResume) btnResume.textContent = 'LANJUT';
  if (overlay) overlay.style.display = isPaused ? 'flex' : 'none';
}

// ─── RESTART ─────────────────────────────────────────────────────────────────
function restartGame() {
  score = 0; gameOver = false; isPaused = false;
  activeSlots = [null, null, null];
  scoreEl.textContent = 0;
  if (overlay) overlay.style.display = 'none';
  if (btnResume) btnResume.textContent = 'LANJUT';
  const bestEl = document.getElementById('best-score');
  if (bestEl) bestEl.textContent = bestScore;
  createBoard();
  spawnBlocks();
}

// ─── EVENT LISTENERS ─────────────────────────────────────────────────────────
if (btnPause)  btnPause.addEventListener('click', togglePause);
if (btnResume) btnResume.addEventListener('click', () => {
  if (gameOver) restartGame();
  else togglePause();
});

// ─── INIT ────────────────────────────────────────────────────────────────────
createBoard();
spawnBlocks();
