// Adapted from aaronshaver/dig-deep-descent; MIT; Copyright (c) 2024 Aaron Shaver. See LICENSE.txt.
class ZLevelDistribution {
    distributions;

    constructor(rng = Math.random) {
        this.rng = rng;
        this.distributions = {
            0: { LooseRock: 0.93, RedMineral: 0.07 },
            5: { LooseRock: 0.83, NormalRock: 0.10, RedMineral: 0.06, WhiteMineral: 0.01 },
            10: { LooseRock: 0.73, NormalRock: 0.20, RedMineral: 0.05, WhiteMineral: 0.02 },
            15: { LooseRock: 0.63, NormalRock: 0.30, RedMineral: 0.04, WhiteMineral: 0.02, OrangeMineral: 0.01 },
            20: { LooseRock: 0.53, NormalRock: 0.40, RedMineral: 0.03, WhiteMineral: 0.02, OrangeMineral: 0.02 },
            25: { LooseRock: 0.43, NormalRock: 0.50, RedMineral: 0.02, WhiteMineral: 0.02, OrangeMineral: 0.02, PurpleMineral: 0.01 },
            30: { NormalRock: 0.83, DenseRock: 0.10, WhiteMineral: 0.02, OrangeMineral: 0.02, PurpleMineral: 0.02, YellowMineral: 0.01 },
            35: { NormalRock: 0.73, DenseRock: 0.20, OrangeMineral: 0.02, PurpleMineral: 0.02, YellowMineral: 0.02, BlueMineral: 0.01 },
            40: { NormalRock: 0.63, DenseRock: 0.30, PurpleMineral: 0.03, YellowMineral: 0.02, BlueMineral: 0.01, GreenMineral: 0.01 },
            45: { NormalRock: 0.53, DenseRock: 0.40, PurpleMineral: 0.03, YellowMineral: 0.02, BlueMineral: 0.01, GreenMineral: 0.01 },
            50: { NormalRock: 0.43, DenseRock: 0.50, PurpleMineral: 0.02, YellowMineral: 0.02, BlueMineral: 0.02, GreenMineral: 0.01 },
            55: { DenseRock: 0.73, VeryDenseRock: 0.20, PurpleMineral: 0.02, YellowMineral: 0.02, BlueMineral: 0.02, GreenMineral: 0.01 },
            60: { DenseRock: 0.63, VeryDenseRock: 0.30, PurpleMineral: 0.01, YellowMineral: 0.02, BlueMineral: 0.02, GreenMineral: 0.02 },
            65: { DenseRock: 0.53, VeryDenseRock: 0.40, YellowMineral: 0.02, BlueMineral: 0.02, GreenMineral: 0.03 },
            70: { DenseRock: 0.43, VeryDenseRock: 0.50, YellowMineral: 0.01, BlueMineral: 0.03, GreenMineral: 0.03 },
            75: { VeryDenseRock: 0.73, ExtremelyDenseRock: 0.20, YellowMineral: 0.01, BlueMineral: 0.03, GreenMineral: 0.03 },
            80: { VeryDenseRock: 0.63, ExtremelyDenseRock: 0.30, YellowMineral: 0.01, BlueMineral: 0.02, GreenMineral: 0.04 },
            85: { VeryDenseRock: 0.53, ExtremelyDenseRock: 0.40, PurpleMineral: 0.01, YellowMineral: 0.01, BlueMineral: 0.02, GreenMineral: 0.03 },
            90: { VeryDenseRock: 0.43, ExtremelyDenseRock: 0.50, PurpleMineral: 0.01, YellowMineral: 0.01, BlueMineral: 0.02, GreenMineral: 0.03 },
            95: { ExtremelyDenseRock: 0.93, PurpleMineral: 0.01, YellowMineral: 0.01, BlueMineral: 0.02, GreenMineral: 0.03 },
            199: { ExtremelyDenseRock: 0.93, BlueMineral: 0.01, YellowMineral: 0.01, PurpleMineral: 0.01, GreenMineral: 0.04 }
        };
    }

    getDistributions() {
        return this.distributions;
    }

    getObjectProbabilities(zLevel) {
        zLevel = Math.abs(zLevel);
        const levels = Object.keys(this.distributions).map(Number).sort((a, b) => a - b);
        const lowerLevel = levels.filter(level => level <= zLevel).pop();
        const upperLevel = levels.filter(level => level > zLevel).shift();

        if (upperLevel === undefined) return { ...this.distributions[lowerLevel] };

        const factor = (zLevel - lowerLevel) / (upperLevel - lowerLevel);
        const lowerDist = this.distributions[lowerLevel];
        const upperDist = this.distributions[upperLevel];

        // Combine all object types from both levels
        const allTypes = new Set([...Object.keys(lowerDist), ...Object.keys(upperDist)]);

        const interpolatedDist = {};
        for (const type of allTypes) {
            const lowerProb = lowerDist[type] || 0;
            const upperProb = upperDist[type] || 0;
            interpolatedDist[type] = lowerProb + factor * (upperProb - lowerProb);
        }

        // Normalize probabilities
        const total = Object.values(interpolatedDist).reduce((sum, prob) => sum + prob, 0);
        Object.keys(interpolatedDist).forEach(key => {
            interpolatedDist[key] /= total;
        });

        return interpolatedDist;
    }

    selectObjectType(zLevel) {
        const probabilities = this.getObjectProbabilities(zLevel);
        const rand = this.rng();
        let cumulative = 0;

        for (const [objType, prob] of Object.entries(probabilities)) {
            cumulative += prob;
            if (rand < cumulative) {
                return objType;
            }
        }
    }

    getDominantRockType(zLevel) {
        const probabilities = this.getObjectProbabilities(zLevel);
        const rockTypes = Object.keys(probabilities).filter(type => type.includes('Rock'));
        const rockProbabilities = rockTypes.reduce((acc, type) => {
            acc[type] = probabilities[type];
            return acc;
        }, {});

        const totalRockProbability = Object.values(rockProbabilities).reduce((sum, prob) => sum + prob, 0);
        const normalizedRockProbabilities = Object.entries(rockProbabilities).reduce((acc, [type, prob]) => {
            acc[type] = prob / totalRockProbability;
            return acc;
        }, {});

        return Object.entries(normalizedRockProbabilities).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    }
}

export { ZLevelDistribution }
