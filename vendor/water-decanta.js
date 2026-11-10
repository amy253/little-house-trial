/* Decanta: Water Sort, copyright (c) 2026 Álli Terhorst. MIT.
Source commit 4130d868bc5eeba65f5de8cf9aec3669c18c78cf. See water-decanta-LICENSE.txt.
Type annotations/imports removed; original algorithms unchanged. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.WaterDecanta=api;})(typeof window==='object'?window:globalThis,function(){
const WILD=-1;

// Upstream: src/core/engine.ts
/**
 * Pure water-sort engine. No Phaser dependency — testable with Vitest.
 *
 * Rules:
 * - Only the TOP color moves.
 * - A pour is valid if the destination is EMPTY or has the SAME color on top, and has room.
 * - The whole top "run" (equal colors stacked) moves, up to whatever fits.
 * - Win: every tube is empty OR full with a single color.
 */

/** Deep copy of the state (for undo history and search). */
function cloneState(s           )            {
  const next            = { capacity: s.capacity, tubes: s.tubes.map((t) => t.slice()) };
  if (s.locks) next.locks = s.locks.slice();
  if (s.filters) next.filters = s.filters.slice();
  if (s.hidden) next.hidden = s.hidden.map((h) => h.slice());
  if (s.alchemy) next.alchemy = true; // global rule must survive clones (undo, solver)
  return next;
}

/** Are two colors compatible to stack? The wildcard (WILD) matches any color. */
function colorMatches(a        , b        )          {
  return a === b || a === WILD || b === WILD;
}

/**
 * Alchemy recipes — SUBTRACTIVE pigment mixing (indices = LIQUID_COLORS).
 * red+yellow=orange · blue+yellow=green · red+blue=purple. Symmetric.
 * Only apply when the state has `alchemy` enabled. The wildcard never mixes.
 */
const MIX_RECIPES                                                   = [
  [0, 3, 4], // red + yellow = orange
  [1, 3, 2], // blue + yellow = green
  [0, 1, 5], // red + blue = purple
];

/** Resulting color of mixing a+b, or null if there is no recipe (or a wildcard/equal color). */
function mixResult(a        , b        )                {
  if (a === WILD || b === WILD || a === b) return null;
  for (const [x, y, c] of MIX_RECIPES) {
    if ((a === x && b === y) || (a === y && b === x)) return c;
  }
  return null;
}

/** Would pouring `from` onto `to` result in a mix (alchemy)? If so, the color. */
function mixOf(s           , from        , to        )                {
  if (!s.alchemy) return null;
  const src = s.tubes[from];
  const dst = s.tubes[to];
  if (src.length === 0 || dst.length === 0) return null;
  if (s.filters?.[to] != null) return null; // a filtered tube does not mix
  return mixResult(src[src.length - 1], dst[dst.length - 1]);
}

/** Is the tube monochrome IGNORING wildcards (which take on the other units' color)? */
function isMono(tube      )          {
  let c                = null;
  for (const u of tube) {
    if (u === WILD) continue;
    if (c === null) c = u;
    else if (u !== c) return false;
  }
  return true;
}

/** Is tube `i` capped (cork not yet dissolved)? */
function isLocked(s           , i        )          {
  return (s.locks?.[i] ?? 0) > 0;
}

/** Top color, or null if empty. */
function topColor(tube      )                {
  return tube.length === 0 ? null : tube[tube.length - 1];
}

/** How many equal units are on top (size of the "run"). */
function topRun(tube      )         {
  if (tube.length === 0) return 0;
  const c = tube[tube.length - 1];
  let n = 0;
  for (let i = tube.length - 1; i >= 0 && tube[i] === c; i--) n++;
  return n;
}

/** Tube of a single color (empty counts). */
function isSingleColor(tube      )          {
  return tube.every((c) => c === tube[0]);
}

/** "Solved" tube: empty, or full with a single color (wildcards count as that color). */
function isTubeDone(tube      , capacity        )          {
  if (tube.length === 0) return true;
  return tube.length === capacity && isMono(tube);
}

/** Is the from→to pour legal? */
function canPour(s           , from        , to        )          {
  if (from === to) return false;
  if (isLocked(s, from) || isLocked(s, to)) return false; // cork blocks both in and out
  const src = s.tubes[from];
  const dst = s.tubes[to];
  if (src.length === 0) return false;
  if (dst.length >= s.capacity) return false;
  const moving = src[src.length - 1];
  // filter: the destination tube only accepts its color (the wildcard passes, taking that color).
  const f = s.filters?.[to];
  if (f != null && moving !== f && moving !== WILD) return false;
  if (dst.length === 0) return true;
  if (colorMatches(moving, dst[dst.length - 1])) return true;
  // alchemy: different colors may combine if a recipe exists (in a free tube, no filter).
  if (s.alchemy && f == null && mixResult(moving, dst[dst.length - 1]) !== null) return true;
  return false;
}

/** How many units would actually move in from→to (0 if illegal). */
function pourAmount(s           , from        , to        )         {
  if (!canPour(s, from, to)) return 0;
  return Math.min(topRun(s.tubes[from]), s.capacity - s.tubes[to].length);
}

/** Applies the pour and returns a NEW state (does not mutate the original). */
function applyMove(s           , from        , to        )            {
  const k = pourAmount(s, from, to);
  if (k <= 0) return s;
  const next = cloneState(s);
  const src = next.tubes[from];
  const dst = next.tubes[to];
  const c = src[src.length - 1];
  // alchemy: detect the mix BEFORE moving (needs the destination top and B's run).
  const dstTop = dst.length > 0 ? dst[dst.length - 1] : null;
  const mix = s.alchemy && dstTop !== null && !colorMatches(c, dstTop) ? mixResult(c, dstTop) : null;
  const lb = mix !== null ? topRun(dst) : 0;
  for (let i = 0; i < k; i++) {
    src.pop();
    dst.push(c);
  }
  if (mix !== null) {
    // transmute the k poured units + the min(k, B's run) right below (the "contact").
    const relabel = k + Math.min(k, lb);
    for (let p = dst.length - 1, n = 0; p >= 0 && n < relabel; p--, n++) dst[p] = mix;
  }
  // each successful move dissolves a bit of ALL corks (countdown).
  if (next.locks) next.locks = next.locks.map((v) => (v > 0 ? v - 1 : 0));
  // hidden bottom: keep the parallel array in sync with the pops/pushes and reveal the
  // source's new top (just exposed). Units landing in the destination arrive visible.
  if (next.hidden) {
    const sh = next.hidden[from];
    if (sh) {
      sh.length = src.length; // dropped k units from the top
      if (src.length > 0) sh[src.length - 1] = false;
    }
    const dh = next.hidden[to];
    if (dh) for (let i = 0; i < k; i++) dh.push(false);
  }
  return next;
}

/** All legal moves from the state (no pruning — used in the game). */
function legalMoves(s           )         {
  const moves         = [];
  for (let from = 0; from < s.tubes.length; from++) {
    if (s.tubes[from].length === 0) continue;
    for (let to = 0; to < s.tubes.length; to++) {
      const k = pourAmount(s, from, to);
      if (k > 0) moves.push({ from, to, count: k });
    }
  }
  return moves;
}

/**
 * Moves with PRUNING for the solver (discards useless plays that only create cycles):
 * - an already-solved tube does not move;
 * - moving a single-color tube into an empty one is a pointless swap.
 */
function solverMoves(s           )         {
  const moves         = [];
  for (let from = 0; from < s.tubes.length; from++) {
    const src = s.tubes[from];
    if (src.length === 0) continue;
    if (isTubeDone(src, s.capacity)) continue;
    const srcUniform = isSingleColor(src);
    for (let to = 0; to < s.tubes.length; to++) {
      if (to === from) continue;
      const dst = s.tubes[to];
      if (dst.length === 0 && srcUniform) continue; // useless
      const k = pourAmount(s, from, to);
      if (k > 0) moves.push({ from, to, count: k });
    }
  }
  return moves;
}

/** Won? Every tube empty or full with a single color. */
function isWin(s           )          {
  return s.tubes.every((t) => isTubeDone(t, s.capacity));
}

/** No legal move at all (hard deadlock). */
function hasNoMoves(s           )          {
  return legalMoves(s).length === 0;
}

/**
 * Canonical key: sorts the tubes (symmetric states collapse) — for the visited set.
 * With corks, the tube's identity includes the cork (tubes cannot be freely reordered):
 * each tube becomes "content#cork" and the sort considers the pair, preserving symmetry.
 */
function canonicalKey(s           )         {
  // No position-bound constraints → free to reorder (full symmetry).
  if (!s.locks && !s.filters) {
    return s.tubes
      .map((t) => t.join(','))
      .sort()
      .join('|');
  }
  // With cork/filter, the tube's identity includes those marks (no free reordering).
  // (The hidden bottom does NOT enter: it does not change reachability and would only bloat visited.)
  return s.tubes
    .map((t, i) => t.join(',') + '#' + (s.locks?.[i] ?? 0) + '@' + (s.filters?.[i] ?? ''))
    .sort()
    .join('|');
}

// Upstream: src/core/solver.ts
/**
 * A* solver — path with the MINIMUM number of moves, more efficient than BFS.
 *
 * Heuristic (per color c, over unsolved tubes):
 *   h(s) = Σ_c [ segs(c) − home(c) ]
 * where segs(c) is the number of contiguous "segments" of c and home(c) is 1 when some
 * tube's LOWEST real unit is c (that bottom segment can stay put and become c's final
 * tube — every other segment must be poured at least once). This dominates the older
 * Σ max(0, segs−1) form (it only credits a "free" segment when a real home exists),
 * so A* explores significantly fewer states for the same result.
 *
 * Memory: the search frontier is the real cost driver on big boards (8 colors ×
 * capacity 6 explode past 10⁵ states). Two independent levers keep it in check:
 *  - `solveLength()` — validation-only variant used by the level generator. It tracks
 *    visited/g-cost by a 53-bit NUMERIC hash of the canonical state (no string keys,
 *    no parent map — we only need "solvable?" + the solution length). A hash collision
 *    is astronomically rare and, when it happens, can only make a level be judged
 *    unsolvable (→ regenerated) — never ships a broken level.
 *  - both paths prune symmetric branches: with N identical empty tubes, pouring into
 *    each of them yields the same canonical state, so only the first is expanded.
 */

                              
                  
                                                                                 
                       
                                                    
                     
 

                                    
                  
                                                                                    
                 
                                                    
                     
 

// ── Heuristic ──────────────────────────────────────────────────────────────────

/**
 * h(s) = Σ_c [ segs(c) − home(c) ] — see the header comment.
 * WILD is transparent: it neither starts nor ends a segment, and a wild-only bottom
 * grants no home (a pure-wild tube could serve any color, so crediting it to every
 * color would undercount).
 * With alchemy the "pours partition by color" argument breaks (a pour can transmute
 * two colors at once), so we fall back to the weaker segs−1 form there.
 */
function heuristic(s           )         {
  const segs = new Map                ();
  const home = new Set        ();
  for (const tube of s.tubes) {
    if (isTubeDone(tube, s.capacity)) continue;
    let prev = WILD;
    for (const c of tube) {
      if (c === WILD) continue; // wildcard neither interrupts nor starts a segment
      if (c !== prev) {
        segs.set(c, (segs.get(c) ?? 0) + 1);
        prev = c;
      }
    }
    // lowest REAL unit of the tube → potential home for that color
    for (const c of tube) {
      if (c === WILD) continue;
      home.add(c);
      break;
    }
  }
  let h = 0;
  if (s.alchemy) {
    for (const n of segs.values()) if (n > 1) h += n - 1;
  } else {
    for (const [c, n] of segs) h += n - (home.has(c) ? 1 : 0);
  }
  return h;
}

// ── Symmetry pruning ────────────────────────────────────────────────────────────

/**
 * solverMoves() + empty-destination symmetry: pouring into any of N plain empty tubes
 * (no filter, no cork) produces the same canonical state — keep only the first one.
 * Empty FILTERED tubes stay (each filter color is a distinct destination).
 */
function prunedMoves(s           )         {
  const all = solverMoves(s);
  let firstPlainEmpty = -1;
  for (let i = 0; i < s.tubes.length; i++) {
    if (s.tubes[i].length === 0 && s.filters?.[i] == null && !((s.locks?.[i] ?? 0) > 0)) {
      firstPlainEmpty = i;
      break;
    }
  }
  if (firstPlainEmpty === -1) return all;
  return all.filter((m) => {
    if (s.tubes[m.to].length !== 0) return true;
    if (s.filters?.[m.to] != null) return true;
    return m.to === firstPlainEmpty;
  });
}

// ── Min-heap (f = g + h) ────────────────────────────────────────────────────────

class MinHeap {
          d                             = [];

  push(f        , s           )       {
    this.d.push([f, s]);
    let i = this.d.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.d[p][0] <= this.d[i][0]) break;
      [this.d[p], this.d[i]] = [this.d[i], this.d[p]];
      i = p;
    }
  }

  pop()                                  {
    if (!this.d.length) return undefined;
    const top = this.d[0];
    const last = this.d.pop() ;
    if (this.d.length) {
      this.d[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1, n = this.d.length;
        let m = i;
        if (l < n && this.d[l][0] < this.d[m][0]) m = l;
        if (r < n && this.d[r][0] < this.d[m][0]) m = r;
        if (m === i) break;
        [this.d[m], this.d[i]] = [this.d[i], this.d[m]];
        i = m;
      }
    }
    return top;
  }

  get size()         { return this.d.length; }
}

// ── 53-bit canonical hash (light validator) ─────────────────────────────────────

function tubeHash(t          , mark        )         {
  let h = 0x811c9dc5;
  h = Math.imul(h ^ (t.length + 1), 0x01000193);
  for (const u of t) h = Math.imul(h ^ (u + 3), 0x01000193);
  h = Math.imul(h ^ mark, 0x01000193);
  return h >>> 0;
}

/** Order-independent (sorted) numeric hash of the canonical state: 32+21 = 53 bits. */
function canonicalHash(s           )         {
  const hs           = new Array(s.tubes.length);
  for (let i = 0; i < s.tubes.length; i++) {
    const mark = (((s.locks?.[i] ?? 0) & 0xff) << 8) ^ (((s.filters?.[i] ?? -2) + 2) & 0xff);
    hs[i] = tubeHash(s.tubes[i], mark);
  }
  hs.sort((a, b) => a - b);
  let h1 = 0x811c9dc5;
  let h2 = 0x9747b28c;
  for (const v of hs) {
    h1 = Math.imul(h1 ^ v, 0x01000193) >>> 0;
    h2 = (Math.imul(h2 ^ (v >>> 16), 0x85ebca6b) + (v & 0xffff)) >>> 0;
  }
  return h1 * 2097152 + (h2 >>> 11);
}

// ── Path reconstruction ────────────────────────────────────────────────────────

function reconstruct(
  parent                                                 ,
  endKey        ,
)         {
  const path         = [];
  let cur                     = endKey;
  while (cur) {
    const p = parent.get(cur);
    if (!p) break;
    path.push(p.move);
    cur = p.key;
  }
  return path.reverse();
}

// ── Main solver (A*) ───────────────────────────────────────────────────────────

/**
 * Solves via A* returning the full move path (hints, tests).
 * `maxNodes` avoids hanging/exploding on pathological instances — default 300,000
 * (with the stronger heuristic + symmetry pruning this is plenty for real boards,
 * and it caps the worst-case memory the search can pin at once).
 */
function solve(start           , maxNodes = 300_000)              {
  if (isWin(start)) return { solved: true, moves: [], exhausted: false };

  const startKey = canonicalKey(start);
  const gCost = new Map                ([[startKey, 0]]);
  const parent = new Map                                            ([[startKey, null]]);
  const closed = new Set        ();
  const open = new MinHeap();
  open.push(heuristic(start), start);

  let nodes = 0;

  while (open.size > 0) {
    const entry = open.pop() ;
    const cur = entry[1];
    const curKey = canonicalKey(cur);

    if (closed.has(curKey)) continue; // stale entry in the heap
    closed.add(curKey);

    const g = gCost.get(curKey) ;

    for (const mv of prunedMoves(cur)) {
      const nxt = applyMove(cur, mv.from, mv.to);
      const key = canonicalKey(nxt);
      if (closed.has(key)) continue;

      const newG = g + 1;
      if ((gCost.get(key) ?? Infinity) <= newG) continue; // already has a better or equal path

      gCost.set(key, newG);
      parent.set(key, { key: curKey, move: mv });

      if (isWin(nxt)) {
        return { solved: true, moves: reconstruct(parent, key), exhausted: false };
      }

      open.push(newG + heuristic(nxt), nxt);

      if (++nodes > maxNodes) {
        return { solved: false, moves: null, exhausted: true };
      }
    }
  }

  return { solved: false, moves: null, exhausted: false };
}

/**
 * Validation-only A*: same search, but tracks NOTHING it doesn't need — visited/g-cost
 * keyed by the 53-bit numeric hash and no parent map. This is what the level generator
 * calls dozens/hundreds of times per level: peak retained memory drops from hundreds of
 * MB (string keys + parent chains) to a few MB, which is what killed the worker on
 * phones (OOM → dead worker → permanent black screen on phase transitions).
 */
function solveLength(start           , maxNodes = 150_000)                    {
  if (isWin(start)) return { solved: true, length: 0, exhausted: false };

  const startKey = canonicalHash(start);
  const gCost = new Map                ([[startKey, 0]]);
  const closed = new Set        ();
  const open = new MinHeap();
  open.push(heuristic(start), start);

  let nodes = 0;

  while (open.size > 0) {
    const entry = open.pop() ;
    const cur = entry[1];
    const curKey = canonicalHash(cur);

    if (closed.has(curKey)) continue;
    closed.add(curKey);

    const g = gCost.get(curKey) ;

    for (const mv of prunedMoves(cur)) {
      const nxt = applyMove(cur, mv.from, mv.to);
      const key = canonicalHash(nxt);
      if (closed.has(key)) continue;

      const newG = g + 1;
      if ((gCost.get(key) ?? Infinity) <= newG) continue;

      gCost.set(key, newG);

      if (isWin(nxt)) return { solved: true, length: newG, exhausted: false };

      open.push(newG + heuristic(nxt), nxt);

      if (++nodes > maxNodes) return { solved: false, length: -1, exhausted: true };
    }
  }

  return { solved: false, length: -1, exhausted: false };
}

// ── Utilities (public interface unchanged) ─────────────────────────────────────

/** Is the level solvable from this state? */
function isSolvable(s           )          {
  return solve(s).solved;
}

/** Next best move (the "hint"), or null if there is no solution. */
function nextHint(s           )              {
  const r = solve(cloneState(s));
  return r.solved && r.moves && r.moves.length > 0 ? r.moves[0] : null;
}

// Upstream: src/render/geometry.ts
/**
 * Pure liquid geometry — NO Pixi dependency (testable, portable).
 *
 * The core idea that fixes the classic bug ("liquid turns into a rigid block when tilted"):
 * the liquid SURFACE is always HORIZONTAL in WORLD space (gravity). The glass rotates; the
 * liquid flows. To achieve this, we compute the "waterlines" (world-Y) by VOLUME over the
 * tube's inner polygon ALREADY transformed into world space. Since rotation preserves area,
 * the per-unit volume is invariant — colors can never get "shuffled".
 */

                     
            
            
 

                       
             
             
                                                                           
 

                            
                                                                       
             
                                     
                                 
                                                   
                                                   
                                     
                                                   
 

/**
 * Polygon for a "tube" (semicircular rounded bottom, straight/open top), centered at
 * (0,0), y down. Width `w`, height `h`. The bottom radius is w/2. Used both for the outer
 * glass and for the interior (liquid clip).
 */
/** @deprecated Kept for reference — use bottlePoly for the bottle visual. */
const TOP_CORNER = 0.13;

/** @deprecated Use bottlePoly. */
function roundedTubePoly(w        , h        , segs = 28)       {
  const rb = w / 2;
  const rt = w * TOP_CORNER;
  const top = -h / 2;
  const yBot = h / 2 - rb;
  const poly       = [];
  const arc = (cx        , cy        , r        , a0        , a1        , n        ) => {
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      poly.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
  };
  arc(-w / 2 + rt, top + rt, rt, Math.PI, Math.PI * 1.5, 8);
  arc(w / 2 - rt, top + rt, rt, Math.PI * 1.5, Math.PI * 2, 8);
  arc(0, yBot, rb, 0, Math.PI, segs);
  return poly;
}

// ---- Configurable tube shapes (neck + shoulder + body + bottom) ----

/**
 * Parameters that define a tube SILHOUETTE. The liquid levels by AREA over the interior
 * polygon (rotation preserves area), so EVERY shape works with the exact same mechanic —
 * only the outline changes. The shop sells these as "tube shapes" (see economy.ts).
 */
                                
                                                     
                    
                                                                                           
                      
                                                                                           
                      
                                                                                             
                                                                                   
                       
                                                                                  
                      
 

/** Classic-bottle constants (kept as the free default shape). */
const NECK_RATIO = 0.46;
const SHOULDER_TOP = 0.26;
const SHOULDER_BOT = 0.40;

/** The default free shape — the classic bottle the game shipped with. */
const CLASSIC_SHAPE                = {
  neckRatio: NECK_RATIO, shoulderTop: SHOULDER_TOP, shoulderBot: SHOULDER_BOT,
  bodyTopRatio: 1, bottomRound: 1,
};

/** Catalog of tube silhouettes (id → spec). The shop sells these by id (economy.ts TUBE_SHAPES). */
const TUBE_SHAPE_SPECS                                = {
  classica:   CLASSIC_SHAPE,
  // straight cylinder, wide mouth, deep U bottom — a lab test tube
  proveta:    { neckRatio: 0.82, shoulderTop: 0.05, shoulderBot: 0.12, bodyTopRatio: 1.0,  bottomRound: 1.0 },
  // conical Erlenmeyer: narrow top, widens to the base, flatter bottom
  erlenmeyer: { neckRatio: 0.40, shoulderTop: 0.12, shoulderBot: 0.23, bodyTopRatio: 0.42, bottomRound: 0.5 },
  // long slim neck + bulbous body — a distillation flask
  balao:      { neckRatio: 0.28, shoulderTop: 0.40, shoulderBot: 0.56, bodyTopRatio: 0.80, bottomRound: 1.0 },
  // apothecary jar: short shoulder, near-straight body, flat base
  farmacia:   { neckRatio: 0.58, shoulderTop: 0.10, shoulderBot: 0.20, bodyTopRatio: 0.96, bottomRound: 0.34 },
};

/** Elliptic arc into `poly` (rx = ry gives a circular arc; rx ≠ ry the flatter bottom). */
function ellArc(poly      , cx        , cy        , rx        , ry        , a0        , a1        , n        )       {
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    poly.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) });
  }
}

/**
 * Silhouette polygon for a tube, centered at (0,0), y down, width `w`, height `h`:
 * neck → S-curve shoulder → (optionally tapered) body → rounded/flat bottom.
 */
function bottlePoly(w        , h        , spec                = CLASSIC_SHAPE, segs = 28)       {
  const nw = w * spec.neckRatio;         // neck width
  const nt = nw * 0.11;                   // mouth corner radius
  const rb = (w / 2) * spec.bottomRound;  // bottom vertical radius (semi-ellipse height)
  const top = -h / 2;
  const shoulderTopY = top + h * spec.shoulderTop;
  const shoulderBotY = top + h * spec.shoulderBot;
  const bodyHalf = (w / 2) * spec.bodyTopRatio; // half-width just below the shoulder
  const bodyBotY = h / 2 - rb;            // where the body meets the bottom arc
  const SHOULDER_SEGS = 10;
  const smooth = (t        ) => (1 - Math.cos(t * Math.PI)) / 2; // S-curve 0→1

  const poly       = [];
  // Clockwise in y-down:
  ellArc(poly, -nw / 2 + nt, top + nt, nt, nt, Math.PI, Math.PI * 1.5, 5);   // top-left neck corner
  ellArc(poly, nw / 2 - nt, top + nt, nt, nt, Math.PI * 1.5, Math.PI * 2, 5); // top-right neck corner
  poly.push({ x: nw / 2, y: shoulderTopY });                                  // right neck side down
  for (let i = 1; i <= SHOULDER_SEGS; i++) {                                   // right shoulder S-curve
    const t = i / SHOULDER_SEGS;
    poly.push({ x: nw / 2 + (bodyHalf - nw / 2) * smooth(t), y: shoulderTopY + (shoulderBotY - shoulderTopY) * t });
  }
  poly.push({ x: w / 2, y: bodyBotY });                                        // right body → base (linear taper)
  ellArc(poly, 0, bodyBotY, w / 2, rb, 0, Math.PI, segs);                      // bottom (right → left)
  poly.push({ x: -bodyHalf, y: shoulderBotY });                               // left body base → top
  for (let i = 1; i <= SHOULDER_SEGS; i++) {                                   // left shoulder S-curve (mirrored)
    const t = i / SHOULDER_SEGS;
    poly.push({ x: -(nw / 2 + (bodyHalf - nw / 2) * smooth(1 - t)), y: shoulderBotY - (shoulderBotY - shoulderTopY) * t });
  }
  return poly;
}

/**
 * Left inner profile (top→bottom), inset by `ins` — used for the glass rim-light highlight so
 * it hugs ANY shape, not just the classic bottle.
 */
function bottleProfileLeft(w        , h        , spec               , ins        , segs = 10)       {
  const nw = w * spec.neckRatio;
  const nt = nw * 0.11;
  const rb = (w / 2) * spec.bottomRound;
  const top = -h / 2;
  const shoulderTopY = top + h * spec.shoulderTop;
  const shoulderBotY = top + h * spec.shoulderBot;
  const bodyHalf = (w / 2) * spec.bodyTopRatio;
  const bodyBotY = h / 2 - rb;
  const smooth = (t        ) => (1 - Math.cos(t * Math.PI)) / 2;
  const pts       = [];
  pts.push({ x: -nw / 2 + ins, y: top + nt });          // top of the left neck
  pts.push({ x: -nw / 2 + ins, y: shoulderTopY });       // base of the left neck
  for (let i = 1; i <= segs; i++) {                       // left shoulder S-curve
    const t = i / segs;
    pts.push({ x: -(nw / 2 + (bodyHalf - nw / 2) * smooth(t)) + ins, y: shoulderTopY + (shoulderBotY - shoulderTopY) * t });
  }
  pts.push({ x: -w / 2 + ins, y: bodyBotY });            // base of the left body
  for (let i = 1; i <= 10; i++) {                          // left quarter of the bottom ellipse (180°→90°)
    const a = Math.PI - (Math.PI / 2) * (i / 10);
    pts.push({ x: (w / 2 - ins) * Math.cos(a), y: bodyBotY + (rb - ins) * Math.sin(a) });
  }
  return pts;
}

/**
 * INNER tube polygon (where the liquid lives), centered at (0,0).
 * OUTER dimensions → subtracts wall thickness from each side.
 */
function buildTubeShape(tubeW        , tubeH        , spec                = CLASSIC_SHAPE, segs = 28)            {
  const t = tubeW * 0.02; // reduced inset: liquid reaches close to the visual edge
  const wi = tubeW - 2 * t;
  const hInt = tubeH - t;
  const nwOuter = tubeW * spec.neckRatio;
  const neckWi = nwOuter - 2 * t;
  const neckRatioInner = neckWi / wi;
  const neckRt = neckWi * 0.11;
  return {
    poly: bottlePoly(wi, hInt, { ...spec, neckRatio: neckRatioInner }, segs),
    wi,
    hInt,
    rb: wi / 2,
    rt: wi * TOP_CORNER, // legacy
    neckWi,
    neckRt,
  };
}

/** SVG path string of a silhouette, normalized into a [0..vw]×[0..vh] viewBox (for shop swatches). */
function tubeSvgPath(spec               , vw        , vh        , pad = 2)         {
  const w = vw - 2 * pad;
  const h = vh - 2 * pad;
  const pts = bottlePoly(w, h, spec, 22);
  return pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${(p.x + vw / 2).toFixed(2)},${(p.y + vh / 2).toFixed(2)}`)
    .join(' ') + ' Z';
}

/** Transforms a local point into world space by applying the pose (rotation around the center). */
function toWorld(p    , pose      )     {
  const c = Math.cos(pose.angle);
  const s = Math.sin(pose.angle);
  return { x: pose.cx + p.x * c - p.y * s, y: pose.cy + p.x * s + p.y * c };
}

/** Whole polygon transformed into world space. */
function polyToWorld(poly      , pose      )       {
  return poly.map((p) => toWorld(p, pose));
}

/** Area (shoelace formula), always positive. Invariant to rotation/translation. */
function shoelace(poly      )         {
  let a = 0;
  for (let i = 0, n = poly.length; i < n; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % n];
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a) / 2;
}

/**
 * Clips the polygon against a horizontal line y = yLine (Sutherland–Hodgman).
 * keepBelow = true keeps the part BELOW (y >= yLine, in the y-down convention).
 */
function clipH(poly      , yLine        , keepBelow         )       {
  const out       = [];
  const n = poly.length;
  if (n === 0) return out;
  const inside = (p    ) => (keepBelow ? p.y >= yLine : p.y <= yLine);
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    const ain = inside(a);
    const bin = inside(b);
    if (ain) out.push(a);
    if (ain !== bin) {
      const tt = (yLine - a.y) / (b.y - a.y);
      out.push({ x: a.x + (b.x - a.x) * tt, y: yLine });
    }
  }
  return out;
}

/** Area of the polygon BELOW the line y = yLine (the "submerged" part). */
function submergedArea(poly      , yLine        )         {
  const c = clipH(poly, yLine, true);
  return c.length < 3 ? 0 : shoelace(c);
}

/** Smallest and largest y of the polygon. */
function yBounds(poly      )                               {
  let min = Infinity;
  let max = -Infinity;
  for (const p of poly) {
    if (p.y < min) min = p.y;
    if (p.y > max) max = p.y;
  }
  return { min, max };
}

/**
 * Waterline (world-Y) such that the area below it ≈ `targetArea`.
 * Binary search: area-below is monotonically decreasing in yLine.
 */
function waterline(poly      , targetArea        , iters = 40)         {
  const { min, max } = yBounds(poly);
  if (targetArea <= 0) return max; // no volume → surface at the bottom
  const total = shoelace(poly);
  if (targetArea >= total) return min; // full → surface at the top
  let lo = min;
  let hi = max;
  for (let i = 0; i < iters; i++) {
    const mid = (lo + hi) / 2;
    if (submergedArea(poly, mid) > targetArea) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

                       
                                                          
                                            
 

                             
                                                                                              
                     
                                                             
                                                                      
                                                           
 

/**
 * Groups a tube (list of colors bottom→top) into contiguous bands and computes each one's
 * waterline, in WORLD space. `worldPoly` is the interior already transformed by the pose.
 *
 * `capVolume` = MAXIMUM retainable volume (area below the overflow lip). Anything beyond it
 * "spills": each band's accumulated volume is clamped to that ceiling, so the top color
 * (the last one poured) disappears first as the tube tilts — exactly like in real life.
 */
function computeBandLevels(
  worldPoly      ,
  capacity        ,
  tube          ,
  capVolume = Infinity,
)             {
  const total = shoelace(worldPoly);
  const unitVol = total / capacity;
  const { max } = yBounds(worldPoly);
  const runs         = [];
  for (const c of tube) {
    const last = runs[runs.length - 1];
    if (last && last.color === c) last.len++;
    else runs.push({ color: c, len: 1 });
  }
  const surfaceY           = [];
  const colors           = [];
  let cum = 0;
  for (const r of runs) {
    cum += r.len;
    surfaceY.push(waterline(worldPoly, Math.min(cum * unitVol, capVolume)));
    colors.push(r.color);
  }
  return { surfaceY, colors, bottomY: max, unitVol };
}

return {cloneState,colorMatches,mixResult,mixOf,isMono,isLocked,topColor,topRun,isSingleColor,isTubeDone,canPour,pourAmount,applyMove,legalMoves,solverMoves,isWin,hasNoMoves,canonicalKey,solve,solveLength,isSolvable,nextHint,TOP_CORNER,roundedTubePoly,NECK_RATIO,SHOULDER_TOP,SHOULDER_BOT,CLASSIC_SHAPE,TUBE_SHAPE_SPECS,bottlePoly,bottleProfileLeft,buildTubeShape,tubeSvgPath,toWorld,polyToWorld,shoelace,clipH,submergedArea,yBounds,waterline,computeBandLevels};
});
