// Adapted from aaronshaver/dig-deep-descent; MIT; Copyright (c) 2024 Aaron Shaver. See LICENSE.txt.
import { Rock, Mineral, CompositeObject } from './solid-objects.mjs';
import Position from './position.mjs';

class TerrainGenerator {
    perlin;
    #zLevelDistribution;

    constructor(perlin, zLevelDistribution) {
        if (!perlin) throw new Error("No perlin passed in to TerrainGenerator constructor");
        if (!zLevelDistribution) throw new Error("No zLevelDistribution passed in to TerrainGenerator constructor");
        this.perlin = perlin;
        this.#zLevelDistribution = zLevelDistribution;
    }

    generate(z, grid) {
        const compositeObjects = [];
        compositeObjects.push(...this.generateTerrainAtScale(z, grid, 0.1));
        compositeObjects.push(...this.generateTerrainAtScale(z, grid, 0.3));
        compositeObjects.push(...this.generateTerrainAtScale(z, grid, 0.5));
        compositeObjects.push(...this.generateTerrainAtScale(z, grid, 0.7));
        compositeObjects.push(...this.generateTerrainAtScale(z, grid, 0.9));
        grid.setTerrainAsGeneratedForLevel(z);

        return compositeObjects;
    }

    generateTerrainAtScale(z, grid, scale) {
        const gridSize = grid.getGridSize();
        const compositeObjects = [];
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const noiseValue = this.perlin.getNoise(x * scale, y * scale, z * scale);
                if (noiseValue > 0.2) {
                    const position = new Position(x, y, z);
                    if (!grid.getObject(position)) {
                        const objectType = this.#zLevelDistribution.selectObjectType(z);
                        const compositeObject = this.createCompositeObject(objectType, position, z);
                        grid.setObject(position, compositeObject);
                        compositeObjects.push(compositeObject);
                    }
                }
            }
        }
        return compositeObjects;
    }

    createCompositeObject(objectType, position, zLevel) {
        let rock, mineral;

        if (objectType.includes('Rock')) {
            rock = this.createRock(objectType, position);
        } else if (objectType.includes('Mineral')) {
            const dominantRockType = this.#zLevelDistribution.getDominantRockType(zLevel);
            rock = this.createRock(dominantRockType, position);
            mineral = this.createMineral(objectType, position);
        } else {
            throw new Error(`Unknown object type: ${objectType}`);
        }

        return new CompositeObject(rock, mineral);
    }

    createRock(rockType, position) {
        switch (rockType) {
            case 'LooseRock':
                return new Rock("Loose Rock", position, 400, 0.38);
            case 'NormalRock':
                return new Rock("Normal Rock", position, 800, 0.41);
            case 'DenseRock':
                return new Rock("Dense Rock", position, 1600, 0.44);
            case 'VeryDenseRock':
                return new Rock("Very Dense Rock", position, 3200, 0.47);
            case 'ExtremelyDenseRock':
                return new Rock("Extremely Dense Rock", position, 6400, 0.50);
            default:
                throw new Error(`Unknown rock type: ${rockType}`);
        }
    }

    createMineral(mineralType, position) {
        switch (mineralType) {
            case 'RedMineral':
                return new Mineral("Red Mineral", position, 0.15, 100);
            case 'WhiteMineral':
                return new Mineral("White Mineral", position, 0.20, 200);
            case 'OrangeMineral':
                return new Mineral("Orange Mineral", position, 0.25, 400);
            case 'PurpleMineral':
                return new Mineral("Purple Mineral", position, 0.30, 800);
            case 'YellowMineral':
                return new Mineral("Yellow Mineral", position, 0.35, 1600);
            case 'BlueMineral':
                return new Mineral("Blue Mineral", position, 0.40, 3200);
            case 'GreenMineral':
                return new Mineral("Green Mineral", position, 0.45, 6400);
            default:
                throw new Error(`Unknown mineral type: ${mineralType}`);
        }
    }
}

export { TerrainGenerator };