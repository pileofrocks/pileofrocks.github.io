function createSummary(pokemonData){

    // Counts for charts
    const typeCounts = {};
    const levelCounts = {};

    for (const pokemon of pokemonData){

        typeCounts[pokemon.actual.type[0]] = (typeCounts[pokemon.actual.type[0]] || 0) + 1;
        if (pokemon.actual.type[1]) {
            typeCounts[pokemon.actual.type[1]] = (typeCounts[pokemon.actual.type[1]] || 0) + 1;
        }

        // Count levels for histogram
        const level = parseFloat(pokemon.actual.level);
        if (!isNaN(level)) {
            levelCounts[level] = (levelCounts[level] || 0) + 1;
        }
    }

    // Update the metric display
    const pokedexStats = calculatePDXStats(pokemonData);
    document.getElementById('total-pokemon').textContent = pokedexStats.totalPokemon;
    document.getElementById('lucky-count').textContent = pokedexStats.totalLucky;
    document.getElementById('hundo-count').textContent = pokedexStats.totalHundo;
    document.getElementById('nundo-count').textContent = pokedexStats.totalNundo;
    document.getElementById('shadow-count').textContent = pokedexStats.totalShadow;
    document.getElementById('purified-count').textContent = pokedexStats.totalPurified;
    //document.getElementById('legendary-count').textContent = pokedexStats.totalLegendary;
    //document.getElementById('mythical-count').textContent = pokedexStats.totalMythical;
    //document.getElementById('ultrabeast-count').textContent = pokedexStats.totalUltraBeast;
    document.getElementById('stardust-cost').textContent = pokedexStats.totalCostToMaxAll.stardust.toLocaleString();
    document.getElementById('candy-cost').textContent = pokedexStats.totalCostToMaxAll.candy.toLocaleString();
    document.getElementById('candy-xl-cost').textContent = pokedexStats.totalCostToMaxAll.candyXL.toLocaleString();

    // render charts
    renderPieChart('type-pie-chart', typeCounts);
    renderHistogram('level-histogram', levelCounts);
}

// calculate various pokedex stats from the pokemon data
function calculatePDXStats(pokemonData) {
    const pdxStats = {
        totalPokemon: 0,
        totalShadow: 0,
        totalPurified: 0,
        totalLegendary: 0,
        totalMythical: 0,
        totalUltraBeast: 0,
        totalLucky: 0,
        totalHundo: 0,
        totalNundo: 0,
        totalCostToMaxAll: { stardust: 0, candy: 0, candyXL: 0 },
    };

    for (const pokemon of pokemonData) {
        pdxStats.totalPokemon++;

        let isLucky = false;
        let isShadow = false;
        let isPurified = false;
        let isHundo = false;
        let isNundo = false;
        let isLegendary = false;
        let isMythical = false;
        let isUltraBeast = false;

        if (pokemon.actual.lucky) isLucky = true;
        if (pokemon.actual.shadow) isShadow = true;
        if (pokemon.actual.purified) isPurified = true;
        if (pokemon.actual.IVAvg == 100) isHundo = true;
        if (pokemon.actual.IVAvg == 0) isNundo = true;

        if (isLucky) pdxStats.totalLucky++;
        if (isShadow) pdxStats.totalShadow++;
        if (isPurified) pdxStats.totalPurified++;
        if (isHundo) pdxStats.totalHundo++;
        if (isNundo) pdxStats.totalNundo++;
        if (isLegendary) pdxStats.totalLegendary++;
        if (isMythical) pdxStats.totalMythical++;
        if (isUltraBeast) pdxStats.totalUltraBeast++;

        // Assume all Pokémon start at level 1 for this calculation
        const costToMax = calculateCostToMax(1, isShadow, isLegendary, isPurified);
        pdxStats.totalCostToMaxAll.stardust += costToMax.stardust;
        pdxStats.totalCostToMaxAll.candy += costToMax.candy;
        pdxStats.totalCostToMaxAll.candyXL += costToMax.candyXL;
    }

    return pdxStats;
}

// This function calculates the total cost to max out a single Pokémon
function calculateCostToMax(currentLevel, isShadow, isLegendary, isPurified) {
    let totalStardust = 0;
    let totalCandy = 0;
    let totalCandyXL = 0;

    const costMultiplier = isShadow ? 1.2 : (isPurified ? 0.9 : 1);
    const levelKeys = Object.keys(MAX_LEVEL_50_COSTS).map(Number).sort((a,b) => a - b);
    const startIndex = levelKeys.indexOf(currentLevel);

    if (startIndex !== -1 && currentLevel < 50) {
        // Sum costs for each half-level from the current level to 50
        for (let i = startIndex; i < levelKeys.length; i++) {
            const level = levelKeys[i];
            if (level === currentLevel) {
                const nextLevel = levelKeys[i+1];
                if (nextLevel) {
                    totalStardust += (MAX_LEVEL_50_COSTS[nextLevel].stardust - MAX_LEVEL_50_COSTS[level].stardust);
                    totalCandy += (MAX_LEVEL_50_COSTS[nextLevel].candy - MAX_LEVEL_50_COSTS[level].candy);
                    totalCandyXL += (MAX_LEVEL_50_COSTS[nextLevel].candyXL - MAX_LEVEL_50_COSTS[level].candyXL);
                }
            } else if (level > currentLevel) {
                const prevLevel = levelKeys[i-1];
                totalStardust += (MAX_LEVEL_50_COSTS[level].stardust - MAX_LEVEL_50_COSTS[prevLevel].stardust);
                totalCandy += (MAX_LEVEL_50_COSTS[level].candy - MAX_LEVEL_50_COSTS[prevLevel].candy);
                totalCandyXL += (MAX_LEVEL_50_COSTS[level].candyXL - MAX_LEVEL_50_COSTS[prevLevel].candyXL);
            }
        }
    }

    // Apply multipliers for Stardust and Candy based on form
    totalStardust = Math.ceil(totalStardust * costMultiplier);
    totalCandy = Math.ceil(totalCandy * costMultiplier);

    // Legendary multiplier applies only to Stardust for leveling
    if (isLegendary) {
        totalStardust = Math.ceil(totalStardust * 1.5);
    }

    return { stardust: totalStardust, candy: totalCandy, candyXL: totalCandyXL };
}

// Data table for power-up costs from level 1 to max level (50)
const MAX_LEVEL_50_COSTS = {
    "1": { "stardust": 200, "candy": 1, "candyXL": 0 }, "1.5": { "stardust": 400, "candy": 2, "candyXL": 0 }, "2": { "stardust": 600, "candy": 3, "candyXL": 0 }, "2.5": { "stardust": 800, "candy": 4, "candyXL": 0 }, "3": { "stardust": 1000, "candy": 5, "candyXL": 0 }, "3.5": { "stardust": 1200, "candy": 6, "candyXL": 0 }, "4": { "stardust": 1400, "candy": 7, "candyXL": 0 }, "4.5": { "stardust": 1600, "candy": 8, "candyXL": 0 }, "5": { "stardust": 1800, "candy": 9, "candyXL": 0 }, "5.5": { "stardust": 2000, "candy": 10, "candyXL": 0 }, "6": { "stardust": 2200, "candy": 11, "candyXL": 0 }, "6.5": { "stardust": 2400, "candy": 12, "candyXL": 0 }, "7": { "stardust": 2600, "candy": 13, "candyXL": 0 }, "7.5": { "stardust": 2800, "candy": 14, "candyXL": 0 }, "8": { "stardust": 3000, "candy": 15, "candyXL": 0 }, "8.5": { "stardust": 3200, "candy": 16, "candyXL": 0 }, "9": { "stardust": 3400, "candy": 17, "candyXL": 0 }, "9.5": { "stardust": 3600, "candy": 18, "candyXL": 0 }, "10": { "stardust": 3800, "candy": 19, "candyXL": 0 }, "10.5": { "stardust": 4000, "candy": 20, "candyXL": 0 }, "11": { "stardust": 4500, "candy": 21, "candyXL": 0 }, "11.5": { "stardust": 5000, "candy": 22, "candyXL": 0 }, "12": { "stardust": 5500, "candy": 23, "candyXL": 0 }, "12.5": { "stardust": 6000, "candy": 24, "candyXL": 0 }, "13": { "stardust": 6500, "candy": 25, "candyXL": 0 }, "13.5": { "stardust": 7000, "candy": 26, "candyXL": 0 }, "14": { "stardust": 7500, "candy": 27, "candyXL": 0 }, "14.5": { "stardust": 8000, "candy": 28, "candyXL": 0 }, "15": { "stardust": 8500, "candy": 29, "candyXL": 0 }, "15.5": { "stardust": 9000, "candy": 30, "candyXL": 0 }, "16": { "stardust": 9500, "candy": 31, "candyXL": 0 }, "16.5": { "stardust": 10000, "candy": 32, "candyXL": 0 }, "17": { "stardust": 10500, "candy": 33, "candyXL": 0 }, "17.5": { "stardust": 11000, "candy": 34, "candyXL": 0 }, "18": { "stardust": 11500, "candy": 35, "candyXL": 0 }, "18.5": { "stardust": 12000, "candy": 36, "candyXL": 0 }, "19": { "stardust": 12500, "candy": 37, "candyXL": 0 }, "19.5": { "stardust": 13000, "candy": 38, "candyXL": 0 }, "20": { "stardust": 13500, "candy": 39, "candyXL": 0 }, "20.5": { "stardust": 14500, "candy": 40, "candyXL": 0 }, "21": { "stardust": 15500, "candy": 41, "candyXL": 0 }, "21.5": { "stardust": 16500, "candy": 42, "candyXL": 0 }, "22": { "stardust": 17500, "candy": 43, "candyXL": 0 }, "22.5": { "stardust": 18500, "candy": 44, "candyXL": 0 }, "23": { "stardust": 19500, "candy": 45, "candyXL": 0 }, "23.5": { "stardust": 20500, "candy": 46, "candyXL": 0 }, "24": { "stardust": 21500, "candy": 47, "candyXL": 0 }, "24.5": { "stardust": 22500, "candy": 48, "candyXL": 0 }, "25": { "stardust": 23500, "candy": 49, "candyXL": 0 }, "25.5": { "stardust": 25000, "candy": 50, "candyXL": 0 }, "26": { "stardust": 27000, "candy": 51, "candyXL": 0 }, "26.5": { "stardust": 29000, "candy": 52, "candyXL": 0 }, "27": { "stardust": 31000, "candy": 53, "candyXL": 0 }, "27.5": { "stardust": 33000, "candy": 54, "candyXL": 0 }, "28": { "stardust": 35000, "candy": 55, "candyXL": 0 }, "28.5": { "stardust": 37000, "candy": 56, "candyXL": 0 }, "29": { "stardust": 39000, "candy": 57, "candyXL": 0 }, "29.5": { "stardust": 41000, "candy": 58, "candyXL": 0 }, "30": { "stardust": 43000, "candy": 59, "candyXL": 0 }, "30.5": { "stardust": 45000, "candy": 60, "candyXL": 0 }, "31": { "stardust": 48000, "candy": 63, "candyXL": 0 }, "31.5": { "stardust": 51000, "candy": 66, "candyXL": 0 }, "32": { "stardust": 54000, "candy": 69, "candyXL": 0 }, "32.5": { "stardust": 57000, "candy": 72, "candyXL": 0 }, "33": { "stardust": 60000, "candy": 75, "candyXL": 0 }, "33.5": { "stardust": 63000, "candy": 78, "candyXL": 0 }, "34": { "stardust": 66000, "candy": 81, "candyXL": 0 }, "34.5": { "stardust": 69000, "candy": 84, "candyXL": 0 }, "35": { "stardust": 72000, "candy": 87, "candyXL": 0 }, "35.5": { "stardust": 75000, "candy": 90, "candyXL": 0 }, "36": { "stardust": 78000, "candy": 93, "candyXL": 0 }, "36.5": { "stardust": 81000, "candy": 96, "candyXL": 0 }, "37": { "stardust": 84000, "candy": 99, "candyXL": 0 }, "37.5": { "stardust": 87000, "candy": 102, "candyXL": 0 }, "38": { "stardust": 90000, "candy": 105, "candyXL": 0 }, "38.5": { "stardust": 93000, "candy": 108, "candyXL": 0 }, "39": { "stardust": 96000, "candy": 111, "candyXL": 0 }, "39.5": { "stardust": 99000, "candy": 114, "candyXL": 0 }, "40": { "stardust": 102000, "candy": 117, "candyXL": 0 },
    "40.5": { "stardust": 104500, "candy": 120, "candyXL": 10 }, "41": { "stardust": 107000, "candy": 123, "candyXL": 20 }, "41.5": { "stardust": 109500, "candy": 126, "candyXL": 30 }, "42": { "stardust": 112000, "candy": 129, "candyXL": 40 }, "42.5": { "stardust": 114500, "candy": 132, "candyXL": 50 }, "43": { "stardust": 117000, "candy": 135, "candyXL": 60 }, "43.5": { "stardust": 119500, "candy": 138, "candyXL": 70 }, "44": { "stardust": 122000, "candy": 141, "candyXL": 80 }, "44.5": { "stardust": 124500, "candy": 144, "candyXL": 90 }, "45": { "stardust": 127000, "candy": 147, "candyXL": 100 }, "45.5": { "stardust": 129500, "candy": 150, "candyXL": 110 }, "46": { "stardust": 132000, "candy": 153, "candyXL": 120 }, "46.5": { "stardust": 134500, "candy": 156, "candyXL": 130 }, "47": { "stardust": 137000, "candy": 159, "candyXL": 140 }, "47.5": { "stardust": 139500, "candy": 162, "candyXL": 150 }, "48": { "stardust": 142000, "candy": 165, "candyXL": 160 }, "48.5": { "stardust": 144500, "candy": 168, "candyXL": 170 }, "49": { "stardust": 147000, "candy": 171, "candyXL": 180 }, "49.5": { "stardust": 149500, "candy": 174, "candyXL": 190 }, "50": { "stardust": 152000, "candy": 177, "candyXL": 200 },
};

