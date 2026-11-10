// Adapted from aaronshaver/dig-deep-descent; MIT; Copyright (c) 2024 Aaron Shaver. See LICENSE.txt.
class SolidObject {
    #position;
    #radius;

    constructor(position, radius) {
        if (!position) throw new Error("No position passed in to SolidObject constructor");
        if (!radius) throw new Error("No radius passed in to SolidObject constructor");
        this.#position = position;
        this.#radius = radius;
    }

    getPosition() {
        return this.#position;
    }

    getRadius() {
        return this.#radius;
    }
}

class Rock extends SolidObject {
    #name;
    #randomFlatSide;
    #hitPoints;

    constructor(name, position, hitPoints, radius) {
        if (!name) throw new Error("No name passed in to Rock constructor");
        if (!position) throw new Error("No position passed in to Rock constructor");
        if (!hitPoints) throw new Error("No hitPoints passed in to Rock constructor");
        if (!radius) throw new Error("No radius passed in to Rock constructor");
        super(position, radius);
        this.#name = name;
        this.#hitPoints = hitPoints;
        this.#randomFlatSide = Math.floor(Math.random() * 6);
    }

    getName() {
        return this.#name;
    }

    getHitPoints() {
        return this.#hitPoints;
    }

    setHitPoints(value) {
        this.#hitPoints = value;
    }

    getFlatSide() {
        return this.#randomFlatSide;
    }
}

class Mineral extends SolidObject {
    #name;
    #sellValue;

    constructor(name, position, radius, sellValue) {
        if (!name) throw new Error("No name passed in to Mineral constructor");
        if (!position) throw new Error("No position passed in to Mineral constructor");
        if (!radius) throw new Error("No radius passed in to Mineral constructor");
        if (!sellValue) throw new Error("No sellValue passed in to Mineral constructor");
        super(position, radius);
        this.#name = name;
        this.#sellValue = sellValue;
    }

    getName() {
        return this.#name;
    }

    getSellValue() {
        return this.#sellValue;
    }
}

class CompositeObject {
    #rock;
    #mineral;
    #isScanned;

    constructor(rock, mineral = null) {
        if (!rock) throw new Error("No rock passed in to CompositeObject constructor");
        this.#rock = rock;
        this.#mineral = mineral;
        this.#isScanned = false;
    }

    getRock() {
        return this.#rock;
    }

    getMineral() {
        return this.#mineral;
    }

    isScanned() {
        return this.#isScanned;
    }

    setScanned() {
        this.#isScanned = true;
    }
}

export { SolidObject, Rock, Mineral, CompositeObject };