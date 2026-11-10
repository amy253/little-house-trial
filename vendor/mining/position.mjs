// Adapted from aaronshaver/dig-deep-descent; MIT; Copyright (c) 2024 Aaron Shaver. See LICENSE.txt.
class Position {
  constructor(x, y, z) {
      Object.defineProperties(this, {
        x: { value: x, writable: false }, // immutable values
        y: { value: y, writable: false },
        z: { value: z, writable: false }
      });
  }
}

export default Position;