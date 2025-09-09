const tileButtons = Array.from(document.querySelectorAll('.tile'));
const rollBtn = document.getElementById('rollBtn');
const submitMoveBtn = document.getElementById('submitMoveBtn');
const resetSelectionBtn = document.getElementById('resetSelectionBtn');
const newGameBtn = document.getElementById('newGameBtn');
const die1El = document.getElementById('die1');
const die2El = document.getElementById('die2');
const sumEl = document.getElementById('sum');
const messageEl = document.getElementById('message');
const scoreEl = document.getElementById('score');
const singleTileOnlyCheckbox = document.getElementById('singleTileOnly');

let openTiles = new Set([1,2,3,4,5,6,7,8,9]);
let selectedTiles = new Set();
let currentRoll = null; // {d1, d2, sum, diceCount}
let gameOver = false;

function updateScore() {
  const score = Array.from(openTiles).reduce((a,b)=>a+b,0);
  scoreEl.textContent = `Score: ${score}`;
}

function setMessage(text) {
  messageEl.textContent = text;
}

function isSevenEightNineClosed() {
  return !openTiles.has(7) && !openTiles.has(8) && !openTiles.has(9);
}

function rollDice() {
  const oneDieAllowed = isSevenEightNineClosed();
  const diceCount = oneDieAllowed ? 1 : 2;
  const d1 = Math.floor(Math.random()*6)+1;
  const d2 = diceCount === 2 ? Math.floor(Math.random()*6)+1 : 0;
  const sum = d1 + d2;
  currentRoll = { d1, d2, sum, diceCount };
  die1El.textContent = d1;
  die2El.textContent = diceCount === 2 ? String(d2) : '-';
  sumEl.textContent = `Sum: ${sum}`;
  setMessage(diceCount === 2 ? `Rolled ${d1} and ${d2} (total ${sum}). Select tiles that sum to ${sum}.` : `Rolled ${d1} (one die). Select tiles that sum to ${sum}.`);
}

function canMakeAnyMoveFor(sum) {
  // simple subset sum over openTiles up to small N (1..9)
  const nums = Array.from(openTiles).sort((a,b)=>a-b);
  const target = sum;
  const n = nums.length;
  // backtracking
  function dfs(i, t) {
    if (t === 0) return true;
    if (t < 0 || i === n) return false;
    // choose
    if (dfs(i+1, t - nums[i])) return true;
    // skip
    return dfs(i+1, t);
  }
  return dfs(0, target);
}

function refreshButtonsState() {
  // disable closed tiles, toggle selected class
  tileButtons.forEach(btn => {
    const val = Number(btn.dataset.value);
    const isOpen = openTiles.has(val);
    btn.disabled = !isOpen;
    btn.classList.toggle('closed', !isOpen);
    btn.classList.toggle('selected', selectedTiles.has(val));
  });

  // selection-based controls
  const sumSelected = Array.from(selectedTiles).reduce((a,b)=>a+b,0);
  const canSubmit = currentRoll && sumSelected === currentRoll.sum && selectedTiles.size > 0;
  submitMoveBtn.disabled = !canSubmit;
  resetSelectionBtn.disabled = selectedTiles.size === 0;
}

function onTileClick(val) {
  if (gameOver) return;
  if (!currentRoll) { setMessage('Roll first.'); return; }
  if (!openTiles.has(val)) return;
  if (singleTileOnlyCheckbox.checked && selectedTiles.size === 1 && !selectedTiles.has(val)) {
    // variant: allow only a single tile selected
    return;
  }
  if (selectedTiles.has(val)) selectedTiles.delete(val); else selectedTiles.add(val);
  refreshButtonsState();
}

function submitMove() {
  const sumSelected = Array.from(selectedTiles).reduce((a,b)=>a+b,0);
  if (!currentRoll || sumSelected !== currentRoll.sum || selectedTiles.size === 0) return;
  // flip selected (close them)
  selectedTiles.forEach(v => openTiles.delete(v));
  selectedTiles.clear();
  updateScore();
  refreshButtonsState();

  // check win
  if (openTiles.size === 0) {
    gameOver = true;
    setMessage('Perfect! You shut the box with a score of 0.');
    rollBtn.disabled = true;
    submitMoveBtn.disabled = true;
    resetSelectionBtn.disabled = true;
    return;
  }

  // prepare for next roll
  currentRoll = null;
  die1El.textContent = '-';
  die2El.textContent = '-';
  sumEl.textContent = 'Sum: 0';
  setMessage('Move accepted. Roll again.');
}

function resetSelection() {
  selectedTiles.clear();
  refreshButtonsState();
}

function endIfNoMoves() {
  if (!currentRoll) return;
  if (!canMakeAnyMoveFor(currentRoll.sum)) {
    gameOver = true;
    const finalScore = Array.from(openTiles).reduce((a,b)=>a+b,0);
    setMessage(`No moves available. Final score: ${finalScore}.`);
    rollBtn.disabled = true;
    submitMoveBtn.disabled = true;
    resetSelectionBtn.disabled = true;
  }
}

function handleRoll() {
  if (gameOver) return;
  selectedTiles.clear();
  rollDice();
  refreshButtonsState();
  // if immediately no moves, end
  endIfNoMoves();
}

function newGame() {
  openTiles = new Set([1,2,3,4,5,6,7,8,9]);
  selectedTiles.clear();
  currentRoll = null;
  gameOver = false;
  die1El.textContent = '-';
  die2El.textContent = '-';
  sumEl.textContent = 'Sum: 0';
  rollBtn.disabled = false;
  submitMoveBtn.disabled = true;
  resetSelectionBtn.disabled = true;
  updateScore();
  refreshButtonsState();
  setMessage('New game started. Click Roll to begin.');
}

// wire up
tileButtons.forEach(btn => btn.addEventListener('click', () => onTileClick(Number(btn.dataset.value))));
rollBtn.addEventListener('click', handleRoll);
submitMoveBtn.addEventListener('click', submitMove);
resetSelectionBtn.addEventListener('click', resetSelection);
newGameBtn.addEventListener('click', newGame);

// init
newGame();


