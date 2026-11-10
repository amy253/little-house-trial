/* 卟哩2048: independent implementation of the classic rules.
 * Rule references: Gabriele Cirulli's MIT 2048; see docs/buli-2048-sources.md.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Buli2048 = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SIZE = 4;
  const SAVE_KEY = 'little-house:buli-2048:v1';
  const DIRECTIONS = ['left', 'right', 'up', 'down'];
  const validCount = (value) => Number.isSafeInteger(value) && value >= 0;
  const validBoard = (board) => Array.isArray(board) && board.length === 16 &&
    board.every((value) => Number.isSafeInteger(value) && (value === 0 ||
      (value >= 2 && value <= 2 ** 40 && Number.isInteger(Math.log2(value))))) && board.some(Boolean);
  const hasWon = (board) => board.some((value) => value >= 2048);

  function snapshot(game) {
    return { board: game.board.slice(), score: game.score, moves: game.moves,
      won: game.won, continued: game.continued };
  }

  function validateSnapshot(value) {
    if (!value || !validBoard(value.board) || !validCount(value.score) || !validCount(value.moves) ||
        typeof value.won !== 'boolean' || typeof value.continued !== 'boolean' ||
        (value.continued && !hasWon(value.board)) || (value.won && !hasWon(value.board))) return null;
    return { board: value.board.slice(), score: value.score, moves: value.moves,
      won: hasWon(value.board), continued: value.continued };
  }

  function readSave(raw) {
    try {
      if (typeof raw !== 'string' || raw.length > 20000) return null;
      const data = JSON.parse(raw);
      if (!data || data.version !== 1 || !validCount(data.best)) return null;
      const state = validateSnapshot(data);
      if (!state) return null;
      const candidate = validateSnapshot(data.previous);
      const previous = candidate && candidate.moves === state.moves - 1 && candidate.score <= state.score ? candidate : null;
      return { version: 1, ...state, best: Math.max(data.best, state.score),
        previous };
    } catch (_) { return null; }
  }

  function sample(rng) {
    const value = rng();
    return Number.isFinite(value) ? Math.min(.999999999999, Math.max(0, value)) : 0;
  }

  function spawn(board, rng = Math.random) {
    const spaces = [];
    board.forEach((value, index) => { if (value === 0) spaces.push(index); });
    if (!spaces.length) return null;
    const index = spaces[Math.floor(sample(rng) * spaces.length)];
    const value = sample(rng) < .9 ? 2 : 4;
    board[index] = value;
    return { index, value };
  }

  function createGame(options = {}) {
    const rng = typeof options.rng === 'function' ? options.rng : Math.random;
    const saved = readSave(options.save);
    const best = validCount(options.best) ? options.best : 0;
    if (saved) return { ...saved, best: Math.max(saved.best, best), rng };
    const game = { board: Array(16).fill(0), score: 0, best, moves: 0,
      won: false, continued: false, previous: null, rng };
    spawn(game.board, rng);
    spawn(game.board, rng);
    return game;
  }

  function lineIndices(line, direction) {
    return Array.from({ length: SIZE }, (_, offset) => {
      if (direction === 'left') return line * SIZE + offset;
      if (direction === 'right') return line * SIZE + SIZE - 1 - offset;
      if (direction === 'up') return offset * SIZE + line;
      return (SIZE - 1 - offset) * SIZE + line;
    });
  }

  function moveBoard(board, direction) {
    const result = { board: board.slice(), changed: false, gained: 0, merged: [], transitions: [] };
    if (!DIRECTIONS.includes(direction)) return result;
    result.board.fill(0);
    for (let line = 0; line < SIZE; line++) {
      const indices = lineIndices(line, direction);
      const pieces = indices.filter((index) => board[index]).map((index) => ({ index, value: board[index] }));
      let target = 0;
      for (let i = 0; i < pieces.length; i++) {
        const current = pieces[i];
        const to = indices[target++];
        const pair = pieces[i + 1];
        const merged = !!pair && pair.value === current.value;
        result.board[to] = merged ? current.value * 2 : current.value;
        result.transitions.push({ from: current.index, to, value: current.value, merged });
        if (merged) {
          result.transitions.push({ from: pair.index, to, value: pair.value, merged: true });
          result.gained += current.value * 2;
          result.merged.push(to);
          i++;
        }
      }
    }
    result.changed = result.board.some((value, index) => value !== board[index]);
    return result;
  }

  function canMove(board) {
    if (board.some((value) => value === 0)) return true;
    return board.some((value, index) => (index % SIZE < SIZE - 1 && value === board[index + 1]) ||
      (index < SIZE * (SIZE - 1) && value === board[index + SIZE]));
  }

  function status(game) {
    if (game.won && !game.continued) return 'won';
    return canMove(game.board) ? 'playing' : 'lost';
  }

  function move(game, direction) {
    if (status(game) !== 'playing') return { changed: false, gained: 0, transitions: [], merged: [], spawned: null };
    const result = moveBoard(game.board, direction);
    if (!result.changed) return { ...result, spawned: null };
    game.previous = snapshot(game);
    game.board = result.board.slice();
    game.score += result.gained;
    game.best = Math.max(game.best, game.score);
    game.moves++;
    game.won = game.won || hasWon(game.board);
    result.spawned = spawn(game.board, game.rng);
    return result;
  }

  function undo(game) {
    if (!game.previous) return false;
    const previous = game.previous;
    game.board = previous.board.slice();
    game.score = previous.score;
    game.moves = previous.moves;
    game.won = previous.won;
    game.continued = previous.continued;
    game.previous = null;
    return true;
  }

  function keepPlaying(game) {
    if (!game.won || game.continued) return false;
    game.continued = true;
    return true;
  }

  function revive(game) {
    if(status(game)!=='lost')return false;
    const lowest=Math.min(...game.board.filter(Boolean));
    game.board[game.board.indexOf(lowest)]=0;game.previous=null;return true;
  }
  function serialize(game) {
    return JSON.stringify({ version: 1, ...snapshot(game), best: game.best, previous: game.previous });
  }

  return {revive, SIZE, SAVE_KEY, createGame, moveBoard, move, spawn, canMove, status, undo, keepPlaying, readSave, serialize };
});
