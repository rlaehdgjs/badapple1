// 게임 상태
const gameState = {
  board: Array(100).fill(null),
  score: 0,
  bestScore: localStorage.getItem('bestScore') ? parseInt(localStorage.getItem('bestScore')) : 0,
  combo: 0,
  queue: [],
  isGameOver: false,
};

// 블록 모양 정의 (테트리스 모양)
const BLOCK_SHAPES = [
  // I 모양 (4칸 일직선)
  {
    name: 'I',
    color: '#4c6ef5',
    shape: [[1, 1, 1, 1]],
  },
  // O 모양 (2x2 정사각형)
  {
    name: 'O',
    color: '#ffd43b',
    shape: [[1, 1], [1, 1]],
  },
  // T 모양
  {
    name: 'T',
    color: '#da77f2',
    shape: [[0, 1, 0], [1, 1, 1]],
  },
  // L 모양
  {
    name: 'L',
    color: '#51cf66',
    shape: [[1, 0], [1, 0], [1, 1]],
  },
  // J 모양
  {
    name: 'J',
    color: '#ff922b',
    shape: [[0, 1], [0, 1], [1, 1]],
  },
  // S 모양
  {
    name: 'S',
    color: '#ff6b6b',
    shape: [[0, 1, 1], [1, 1, 0]],
  },
  // Z 모양
  {
    name: 'Z',
    color: '#ff8787',
    shape: [[1, 1, 0], [0, 1, 1]],
  },
];

// DOM 요소
const gameBoard = document.getElementById('gameBoard');
const queueContainer = document.getElementById('queueContainer');
const currentScoreEl = document.getElementById('currentScore');
const bestScoreEl = document.getElementById('bestScore');
const multiplierEl = document.getElementById('multiplier');
const gameOverModal = document.getElementById('gameOverModal');
const finalScoreEl = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');

let currentPreviewCells = [];

function clearPreview() {
  currentPreviewCells.forEach((cell) => {
    cell.classList.remove('preview-valid', 'preview-invalid');
    cell.style.background = cell.dataset.originalBackground || '';
  });
  currentPreviewCells = [];
}

function showPreview(block, row, col) {
  clearPreview();

  const previewCells = [];
  let isValid = true;

  block.shape.forEach((rowShape, r) => {
    rowShape.forEach((cellValue, c) => {
      if (cellValue !== 1) return;
      const boardRow = row + r;
      const boardCol = col + c;

      if (boardRow < 0 || boardRow >= 10 || boardCol < 0 || boardCol >= 10) {
        isValid = false;
        return;
      }

      const index = boardRow * 10 + boardCol;
      const cell = document.querySelector(`.cell[data-index="${index}"]`);
      if (!cell || cell.classList.contains('filled')) {
        isValid = false;
      }
      if (cell) previewCells.push(cell);
    });
  });

  previewCells.forEach((cell) => {
    cell.dataset.originalBackground = cell.style.background;
    cell.classList.add(isValid ? 'preview-valid' : 'preview-invalid');
  });
  currentPreviewCells = previewCells;
}

// 게임 초기화
function initGame() {
  // 격자 셀 생성
  gameBoard.innerHTML = '';
  for (let i = 0; i < 100; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = i;
    gameBoard.appendChild(cell);
  }

  // 게임 상태 초기화
  gameState.board = Array(100).fill(null);
  gameState.score = 0;
  gameState.combo = 0;
  gameState.isGameOver = false;
  gameState.queue = [];

  // 초기 블록 3개 생성
  generateBlocks(3);

  // UI 업데이트
  updateScoreBoard();
  renderQueue();
  gameOverModal.style.display = 'none';
}

// 랜덤 블록 생성
function generateBlocks(count) {
  for (let i = 0; i < count; i++) {
    const randomBlock = BLOCK_SHAPES[Math.floor(Math.random() * BLOCK_SHAPES.length)];
    gameState.queue.push({
      ...randomBlock,
      id: Date.now() + Math.random(),
    });
  }
}

// 도구 모음 렌더링
function renderQueue() {
  queueContainer.innerHTML = '';

  gameState.queue.forEach((block, index) => {
    const slot = document.createElement('div');
    slot.className = 'queue-slot';
    slot.draggable = true;
    slot.dataset.blockIndex = index;

    // 블록의 모양을 미니 격자에 표시
    // 격자 생성
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const miniCell = document.createElement('div');
        miniCell.className = 'queue-mini-cell';

        // 블록이 이 위치에 있는지 확인
        let isFilled = false;
        if (i < block.shape.length) {
          if (j < block.shape[i].length) {
            isFilled = block.shape[i][j] === 1;
          }
        }

        if (isFilled) {
          miniCell.classList.add('filled');
          miniCell.style.background = block.color;
        }

        slot.appendChild(miniCell);
      }
    }

    // 드래그 이벤트
    slot.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('blockIndex', index);
      slot.classList.add('dragging');
    });

    slot.addEventListener('dragend', () => {
      slot.classList.remove('dragging');
      clearPreview();
    });

    queueContainer.appendChild(slot);
  });
}

// 점수판 업데이트
function updateScoreBoard() {
  currentScoreEl.textContent = gameState.score;
  bestScoreEl.textContent = gameState.bestScore;

  const multiplier = Math.pow(1.5, gameState.combo).toFixed(2);
  multiplierEl.textContent = `x${multiplier}`;
}

// 보드 드롭 이벤트 설정
gameBoard.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  const target = e.target;
  if (!target.classList.contains('cell')) return;

  const blockIndex = parseInt(e.dataTransfer.getData('blockIndex'));
  const block = gameState.queue[blockIndex];
  if (!block) return;

  const startIndex = parseInt(target.dataset.index);
  const col = startIndex % 10;
  const row = Math.floor(startIndex / 10);

  showPreview(block, row, col);
});

gameBoard.addEventListener('drop', (e) => {
  e.preventDefault();
  clearPreview();

  if (gameState.isGameOver) return;

  const target = e.target;
  if (!target.classList.contains('cell')) return;

  const blockIndex = parseInt(e.dataTransfer.getData('blockIndex'));
  const block = gameState.queue[blockIndex];
  if (!block) return;

  const startIndex = parseInt(target.dataset.index);
  const col = startIndex % 10;
  const row = Math.floor(startIndex / 10);

  placeBlock(block, row, col, blockIndex);
});

gameBoard.addEventListener('dragleave', (e) => {
  if (e.target === gameBoard) {
    clearPreview();
  }
});

window.addEventListener('dragend', clearPreview);

// 블록 배치
function placeBlock(block, row, col, blockIndex) {
  // 배치 가능 여부 확인
  if (!canPlaceBlock(block, row, col)) {
    return;
  }

  // 블록 고정
  let blocksPlaced = false;
  block.shape.forEach((rowShape, r) => {
    rowShape.forEach((cellValue, c) => {
      if (cellValue === 1) {
        const boardRow = row + r;
        const boardCol = col + c;

        if (boardRow >= 0 && boardRow < 10 && boardCol >= 0 && boardCol < 10) {
          const index = boardRow * 10 + boardCol;
          gameState.board[index] = block.color;
          blocksPlaced = true;
        }
      }
    });
  });

  if (!blocksPlaced) return;

  // 블록을 대기열에서 제거
  gameState.queue.splice(blockIndex, 1);

  // 새 블록 생성
  if (gameState.queue.length < 3) {
    generateBlocks(1);
  }

  // 줄 지우기 및 콤보 처리
  const clearedLines = checkAndClearLines();

  if (clearedLines > 0) {
    gameState.combo++;
  } else {
    gameState.combo = 0;
  }

  // 점수 계산 (기초 점수)
  const baseScore = clearedLines * 10;
  const multiplier = Math.pow(1.5, gameState.combo);
  gameState.score += Math.floor(baseScore * multiplier);

  // UI 업데이트
  renderBoard();
  renderQueue();
  updateScoreBoard();

  // 게임 오버 체크
  if (!hasValidMoves()) {
    gameOver();
  }
}

// 배치 가능 여부 확인
function canPlaceBlock(block, row, col) {
  return block.shape.every((rowShape, r) => {
    return rowShape.every((cellValue, c) => {
      if (cellValue === 0) {
        return true;
      }

      const boardRow = row + r;
      const boardCol = col + c;

      if (boardRow < 0 || boardRow >= 10 || boardCol < 0 || boardCol >= 10) {
        return false;
      }

      const index = boardRow * 10 + boardCol;
      return gameState.board[index] === null;
    });
  });
}

// 줄 확인 및 제거
function checkAndClearLines() {
  const linesToClear = [];

  // 가로줄 확인
  for (let row = 0; row < 10; row++) {
    let isFull = true;
    for (let col = 0; col < 10; col++) {
      if (gameState.board[row * 10 + col] === null) {
        isFull = false;
        break;
      }
    }
    if (isFull) {
      linesToClear.push({ type: 'row', index: row });
    }
  }

  // 세로줄 확인
  for (let col = 0; col < 10; col++) {
    let isFull = true;
    for (let row = 0; row < 10; row++) {
      if (gameState.board[row * 10 + col] === null) {
        isFull = false;
        break;
      }
    }
    if (isFull) {
      linesToClear.push({ type: 'col', index: col });
    }
  }

  // 줄 제거
  linesToClear.forEach((line) => {
    if (line.type === 'row') {
      for (let col = 0; col < 10; col++) {
        gameState.board[line.index * 10 + col] = null;
      }
    } else {
      for (let row = 0; row < 10; row++) {
        gameState.board[row * 10 + line.index] = null;
      }
    }
  });

  return linesToClear.length;
}

// 유효한 배치가 있는지 확인
function hasValidMoves() {
  return gameState.queue.some((block) => {
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        if (canPlaceBlock(block, row, col)) {
          return true;
        }
      }
    }
    return false;
  });
}

// 보드 렌더링
function renderBoard() {
  const cells = document.querySelectorAll('.cell');
  cells.forEach((cell, index) => {
    const color = gameState.board[index];
    if (color) {
      cell.style.background = color;
      cell.classList.add('filled');
    } else {
      cell.style.background = 'white';
      cell.classList.remove('filled');
    }
  });
}

// 게임 오버
function gameOver() {
  gameState.isGameOver = true;

  // 최고 점수 업데이트
  if (gameState.score > gameState.bestScore) {
    gameState.bestScore = gameState.score;
    localStorage.setItem('bestScore', gameState.bestScore);
  }

  // 게임 오버 모달 표시
  finalScoreEl.textContent = gameState.score;
  gameOverModal.style.display = 'flex';
}

// 다시 시작 버튼
restartBtn.addEventListener('click', initGame);

// 게임 시작
initGame();
