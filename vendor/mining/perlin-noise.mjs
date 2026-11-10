// Adapted from aaronshaver/dig-deep-descent; MIT; Copyright (c) 2024 Aaron Shaver. See LICENSE.txt.
export class PerlinNoise {
  constructor(rng = Math.random) {
    this.rng = rng;
    this.p = this.#generatePermutationTable();
    this.permutation = this.p.concat(this.p);
  }

  #generatePermutationTable() {
    const p = Array.from({length: 256}, (_, i) => i);
    for (let i = p.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    return p;
  }

  #fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  #lerp(a, b, t) {
    return a + t * (b - a);
  }

  #grad(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  getNoise(x, y, z) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this.#fade(x);
    const v = this.#fade(y);
    const w = this.#fade(z);

    const A = this.permutation[X] + Y;
    const AA = this.permutation[A] + Z;
    const AB = this.permutation[A + 1] + Z;
    const B = this.permutation[X + 1] + Y;
    const BA = this.permutation[B] + Z;
    const BB = this.permutation[B + 1] + Z;

    return this.#lerp(
      this.#lerp(
        this.#lerp(this.#grad(this.permutation[AA], x, y, z),
                  this.#grad(this.permutation[BA], x - 1, y, z),
                  u),
        this.#lerp(this.#grad(this.permutation[AB], x, y - 1, z),
                  this.#grad(this.permutation[BB], x - 1, y - 1, z),
                  u),
        v),
      this.#lerp(
        this.#lerp(this.#grad(this.permutation[AA + 1], x, y, z - 1),
                  this.#grad(this.permutation[BA + 1], x - 1, y, z - 1),
                  u),
        this.#lerp(this.#grad(this.permutation[AB + 1], x, y - 1, z - 1),
                  this.#grad(this.permutation[BB + 1], x - 1, y - 1, z - 1),
                  u),
        v),
      w
    );
  }
}
