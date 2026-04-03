const urlParams = new URLSearchParams(window.location.search);
const size = parseInt(urlParams.get('size')) || 4;
const container = document.getElementById('grid-container');
const scoreEl = document.getElementById('score');

let board = [];
let score = 0;
const PADDING = 10;
const CONTAINER_SIZE = 300 - (PADDING * 2);
const TILE_SIZE = CONTAINER_SIZE / size;

// Map untuk menyimpan referensi elemen DOM berdasarkan koordinat
let tileElements = {}; 

function init() {
    board = Array.from({ length: size }, () => Array(size).fill(0));
    
    // 1. Gambar latar belakang kotak kosong (statis)
    container.innerHTML = '';
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const bg = document.createElement('div');
            bg.className = 'grid-cell';
            bg.style.width = bg.style.height = `${TILE_SIZE - 8}px`;
            bg.style.left = `${c * TILE_SIZE + PADDING + 4}px`;
            bg.style.top = `${r * TILE_SIZE + PADDING + 4}px`;
            container.appendChild(bg);
        }
    }

    addRandomTile();
    addRandomTile();
    render();
}

function render() {
    // Hapus semua elemen tile lama yang nilainya sudah 0 (gabung/pindah)
    const currentTilesInDom = container.querySelectorAll('.tile');
    currentTilesInDom.forEach(tile => tile.remove());

    // Gambar ulang berdasarkan board saat ini
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] !== 0) {
                createTileElement(r, c, board[r][c]);
            }
        }
    }
    scoreEl.innerText = score;
}

function createTileElement(r, c, value) {
    const tile = document.createElement('div');
    tile.className = `tile tile-${value}`;
    tile.style.width = tile.style.height = `${TILE_SIZE - 8}px`;
    
    // Tentukan posisi awal (langsung di tempatnya)
    tile.style.left = `${c * TILE_SIZE + PADDING + 4}px`;
    tile.style.top = `${r * TILE_SIZE + PADDING + 4}px`;
    tile.innerText = value;
    
    // Atur font size dinamis
    if (size === 5) tile.style.fontSize = '1.2rem';
    
    container.appendChild(tile);
}

function addRandomTile() {
    let empty = [];
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] === 0) empty.push({r, c});
        }
    }
    if (empty.length > 0) {
        let spot = empty[Math.floor(Math.random() * empty.length)];
        board[spot.r][spot.c] = Math.random() < 0.9 ? 2 : 4;
    }
}

// --- LOGIKA GESER (SAMA) ---
function slide(row) {
    let arr = row.filter(val => val !== 0);
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) {
            arr[i] *= 2;
            score += arr[i];
            arr[i + 1] = 0;
        }
    }
    arr = arr.filter(val => val !== 0);
    while (arr.length < size) arr.push(0);
    return arr;
}

function rotateBoard() {
    let newBoard = Array.from({ length: size }, () => Array(size).fill(0));
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            newBoard[c][size - 1 - r] = board[r][c];
        }
    }
    board = newBoard;
}

function move(dir) {
    let prev = JSON.stringify(board);
    const rotations = [0, 3, 2, 1];
    const revRotations = [0, 1, 2, 3];

    for (let i = 0; i < rotations[dir]; i++) rotateBoard();
    for (let r = 0; r < size; r++) board[r] = slide(board[r]);
    for (let i = 0; i < revRotations[dir]; i++) rotateBoard();

    if (prev !== JSON.stringify(board)) {
        addRandomTile();
        render(); // Fungsi ini sekarang memicu transisi CSS
        checkGameOver();
    }
}

// --- KONTROL & TOUCH (SAMA) ---
function checkGameOver() {
    if (board.flat().includes(0)) return;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (c < size - 1 && board[r][c] === board[r][c+1]) return;
            if (r < size - 1 && board[r][c] === board[r+1][c]) return;
        }
    }
    alert("Game Over!");
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') move(0);
    if (e.key === 'ArrowUp') move(1);
    if (e.key === 'ArrowRight') move(2);
    if (e.key === 'ArrowDown') move(3);
});

let sX, sY;
container.addEventListener('touchstart', e => {
    sX = e.touches[0].clientX;
    sY = e.touches[0].clientY;
}, {passive: false});

container.addEventListener('touchmove', e => e.preventDefault(), {passive: false});

container.addEventListener('touchend', e => {
    let dX = e.changedTouches[0].clientX - sX;
    let dY = e.changedTouches[0].clientY - sY;
    if (Math.abs(dX) > Math.abs(dY)) {
        if (Math.abs(dX) > 30) dX > 0 ? move(2) : move(0);
    } else {
        if (Math.abs(dY) > 30) dY > 0 ? move(3) : move(1);
    }
}, {passive: false});

init();