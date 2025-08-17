/**
 * Analyzes an array of Pokémon data, calculating 'actual' and 'what-if' DPS/TDO.
 * The 'what-if' calculation is based on the selected analysis modes.
 *
 * @param {Array<Object>} pokemonData - The array of Pokémon objects from the CSV.
 * @param {Array<string>} mode - An array of strings with selected analysis modes (e.g., ['level_forty']).
 * @returns {{enrichedData: Array, errorLog: Array}} An object containing the processed data and a log of errors.
 */
function pokeAnalysis(pokemonData, mode) {
    const enrichedData = [];
    const errorLog = [];

    // Use a for...of loop to process each pokemon
    for (const pokemon of pokemonData) {
        // --- Error Logging & Early Return Logic ---

        // Helper function to log an error and skip the rest of the loop for this pokemon
        const logError = (errorType, message) => {
            errorLog.push({ pokemon, errorType, message });
            return;
        };

        // Check for Unknown Pokémon
        const pokedexInfo = getBaseStats(pokemon, window.pokedex);
        if (!pokedexInfo.attackS || !pokedexInfo.defenseS || !pokedexInfo.staminaS) {
            logError('Unknown Pokémon', `Pokedex entry not found for ${pokemon.Name}, ${pokemon.Form}`);
            continue; // Skip to the next pokemon in the loop
        }

        // Get IVs and check for errors
        const { attackIv, defenseIv, staminaIv } = getIVs(pokemon);
        if (isNaN(attackIv) || isNaN(defenseIv) || isNaN(staminaIv)) {
            logError('Missing IVs', `IV data is missing or invalid for ${pokemon.Name}`);
            continue;
        }

        // Get Moveset and check for errors
        const actualMoveInfo = getMoveInfo(pokemon, window.fastMoves, window.chargedMoves);
        if (!actualMoveInfo.fastMoveStats || !actualMoveInfo.chargedMoveStats) {
            logError('Unknown Moves', `Moveset data is missing for ${pokemon.Name}`);
            continue;
        }

        // Get CPM and check for errors
        const level = parseFloat(pokemon['Level Max']);
        let cpmValue = getCPMValue(level, window.cpm);
        if (!cpmValue) {
            logError('Invalid Level', `CPM data not found for level ${level} of ${pokemon.Name}`);
            continue;
        }

        // check what if data
        let idealMoveInfo = actualMoveInfo;
        if (mode.includes('ideal_moveset')) {
            idealMoveInfo = getIdealMoveInfo(pokemon, pokedex, window.fastMoves, window.chargedMoves);
            if (!idealMoveInfo.fastMoveStats || !idealMoveInfo.chargedMoveStats) {
                logError('Unknown Ideal Moves', `Ideal moveset data is missing for ${pokemon.Name}`);
                continue;
            }
        }

        let finalEvolution;
        let finalEPokedexInfo;
        let finalEIdealMoveInfo;

        if (mode.includes('fully_evolved')) {
            // find full evolved version
            finalEvolution = getFinalEvolution(pokemon.Name, window.pokedex);
            if (!finalEvolution || !finalEvolution) {
                logError('Missing Evolved Pokémon', `The fully evolved version of ${pokemon.Name} is missing.`);
                continue;
            }

            finalEPokedexInfo = getBaseStats(finalEvolution, window.pokedex);
            if (!finalEPokedexInfo.attackS || !finalEPokedexInfo.defenseS || !finalEPokedexInfo.staminaS) {
                logError('Unknown FE Pokémon', `Pokedex entry not found for ${finalEPokedexInfo.Name}, ${finalEPokedexInfo.Form}`);
                continue; // Skip to the next pokemon in the loop
            }

            finalEIdealMoveInfo = getIdealMoveInfo(finalEvolution, pokedex, window.fastMoves, window.chargedMoves);
            if (!finalEIdealMoveInfo.fastMoveStats || !finalEIdealMoveInfo.chargedMoveStats) {
                logError('Unknown FE Ideal Moves', `Ideal moveset data is missing for FE of ${pokemon.Name}`);
                continue;
            }

        }


        // --- All checks passed, perform calculations and push to enrichedData ---
        // Calculate actual DPS/TDO

        let attackS, defenseS, staminaS;
        let fastMoveStats, chargedMoveStats;
        let dps, tdo;
        let wi_dps = 0, wi_tdo = 0;
        let idealMoveset = "-";

        console.log(pokemon['Shadow/Purified']);

        try {
            ({ attackS, defenseS, staminaS } = pokedexInfo);
            ({ fastMoveStats, chargedMoveStats } = actualMoveInfo);

            if (pokemon['Shadow/Purified'] === 1) {
                attackS = attackS*1.2;
                defenseS = defenseS*0.8;
            }

            // Perform calculation for actual dps/tdo
            ({ dps, tdo } = pokeCalc(
                attackIv, defenseIv, staminaIv, attackS, defenseS, staminaS, cpmValue,
                chargedMoveStats.PWR, chargedMoveStats.ENG, chargedMoveStats.Duration,
                fastMoveStats.PWR, fastMoveStats.ENG, fastMoveStats.Duration
            ));
            // console.log({dps, tdo})

            // Calculate what-if DPS/TDO
            if (mode.includes('fully_evolved')) {
                ({attackS, defenseS, staminaS} = finalEPokedexInfo);
                ({ idealMoveset, fastMoveStats, chargedMoveStats } = finalEIdealMoveInfo);
            }
            if (mode.includes('ideal_moveset')) {
                ({ idealMoveset, fastMoveStats, chargedMoveStats } =  idealMoveInfo);
            }
            if (mode.includes('level_forty')) {
                cpmValue = getCPMValue(40.0, window.cpm);
            }

            // Perform calculation for what-if dps/tdo
            ({ dps: wi_dps, tdo: wi_tdo } = pokeCalc(
                attackIv, defenseIv, staminaIv, attackS, defenseS, staminaS, cpmValue,
                chargedMoveStats.PWR, chargedMoveStats.ENG, chargedMoveStats.Duration,
                fastMoveStats.PWR, fastMoveStats.ENG, fastMoveStats.Duration
            ));

            // Push the successfully enriched data
            enrichedData.push({
                ...pokemon,
                'Actual Moveset': pokemon['Quick Move'] + "/" + pokemon['Charge Move'],
                'Actual DPS': dps.toFixed(2),
                'Actual TDO': tdo.toFixed(2),
                'What-if Moveset': idealMoveset,
                'What-if DPS': wi_dps.toFixed(2),
                'What-if TDO': wi_tdo.toFixed(2),
                'Difference DPS': (wi_dps - dps).toFixed(2), // Example placeholder
                'Difference TDO': (wi_tdo - tdo).toFixed(2)
            });
            //console.log(enrichedData);

        } catch (error) {
            logError('Calculation Error', `An error occurred during calculation for ${pokemon.Name}: ${error.message}`);
        }
    }
    //console.log(enrichedData);
    return { enrichedData, errorLog };
}

function pokeCalc(attackIv, defenseIv, staminaIv,
                  attackS, defenseS, staminaS,
                  cpmValue, cmPWR, cmENG, cmDUR,
                  fmPWR, fmENG, fmDUR) {

    //console.log({attackIv, defenseIv, staminaIv,
    //    attackS, defenseS, staminaS,
    //    cpmValue, cmPWR, cmENG, cmDUR, fmPWR, fmENG, fmDUR,});

    const atk = (attackS + attackIv) * cpmValue;
    const def = (defenseS + defenseIv) * cpmValue;
    const hp = (staminaS + staminaIv) * cpmValue;

    const ex = 0.5 * cmENG + 0.5 * fmENG;
    const ey = 900 / def;
    const fdps = (fmPWR * atk / 320 + 0.5) / fmDUR;
    const feps = fmENG / fmDUR;
    const ceps = cmENG / cmDUR;
    const cdps = (cmPWR * atk / 320 + 0.5) / cmDUR;

    const dps0 = (fdps * ceps + cdps * feps) / (ceps + feps);
    const dps = dps0 + (cdps - fdps) / (ceps + feps) * (0.5 - ex / hp) * ey;
    const tdo = (dps * hp / ey);

    return {dps: dps, tdo: tdo};
}

//const finalEvolution = getFinalEvolution(pokemon, window.pokedex);
function getFinalEvolution(pokemonName, pokedex) {
    // If the starting Pokémon doesn't exist in the pokedex, return the name as-is.
    if (!pokedex[pokemonName]) {
        return pokemonName;
    }

    let currentPokemonName = pokemonName;

    // Loop to follow the evolution chain
    while (true) {
        const currentPokedexEntry = pokedex[currentPokemonName];

        // Check for the evolutions key and if the current pokemon has an evolution
        if (currentPokedexEntry && currentPokedexEntry.evolutions && currentPokedexEntry.evolutions[currentPokemonName]) {
            const nextEvolutionName = currentPokedexEntry.evolutions[currentPokemonName][0];

            // Exclude mega evolutions
            if (nextEvolutionName.includes("Mega")) {
                return {Name: currentPokemonName};
            }

            // Move to the next evolution in the chain
            currentPokemonName = nextEvolutionName;
        } else {
            // No more evolutions found, so we're at the end of the chain.
            return {Name: currentPokemonName};
        }
    }
}

function getCPMValue(level, cpm) {
    let cpmValue;
    const cpmObject = window.cpm.find(c => c.level === level);
    cpmValue = cpmObject ? cpmObject.multiplier : undefined;

    return cpmValue;
}

function getIVs(pokemon) {
    const attackIv = parseFloat(pokemon['Atk IV']);
    const defenseIv = parseFloat(pokemon['Def IV']);
    const staminaIv = parseFloat(pokemon['Sta IV']);

    return {attackIv, defenseIv, staminaIv}
}

function getBaseStats(pokemon, pokedex) {
    let name;
    let pokedexEntry;
    let attackS, defenseS, staminaS;
    // pokedex information
    try {
        //console.log(pokemon)
        if (pokemon.Form) {
            name = pokemon.Name + " " + pokemon.Form;
        } else {
            name = pokemon.Name;
        }

        pokedexEntry = pokedex[name];
        // Get Base Stats
        attackS = parseFloat(pokedexEntry['base_atk']);
        defenseS = parseFloat(pokedexEntry['base_def']);
        staminaS = parseFloat(pokedexEntry['base_sta']);
    } catch (error) {
        console.error(`This is an unknown Pokemon! ${pokemon.Name}`, error);
        return {attackS: 0, defenseS: 0, staminaS: 0};
    }
    return {attackS: attackS, defenseS: defenseS, staminaS: staminaS};
}

function getIdealMoveset(pokemon, pokedex) {
    let name;
    let pokedexEntry;

    // pokedex information
    try {
        //console.log(pokemon)
        if (pokemon.Form) {
            name = pokemon.Name + " " + pokemon.Form;
        } else {
            name = pokemon.Name;
        }

        pokedexEntry = pokedex[name];
        const idealFastMove = pokedexEntry.movesets[1][1].trim();
        const idealChargedMove = pokedexEntry.movesets[1][2].trim();
        return {idealFastMove, idealChargedMove};
    } catch (error) {
        console.error(`This Pokemon has unknown ideal movesets! ${name}`, error);
    }

}

function getMoveInfo(pokemon, fastMoves, chargedMoves) {
    let fastMoveStats;
    let chargedMoveStats;

    // Get move information
    const fastMoveName = pokemon['Quick Move'];
    const chargeMoveName = pokemon['Charge Move'];

    if (fastMoveName && fastMoves[fastMoveName]) {
        fastMoveStats = fastMoves[fastMoveName];
    } else {
        //console.error(`Unknown fast move: ${fastMoveName} for Pokemon ${pokemon.Name}`);
    }

    if (chargeMoveName && chargedMoves[chargeMoveName]) {
        chargedMoveStats = chargedMoves[chargeMoveName];
    } else {
        //console.error(`Unknown charged move: ${chargeMoveName} for Pokemon ${pokemon.Name}`);
    }

    // Return the results as a single object
    return { fastMoveStats, chargedMoveStats };
}

function getIdealMoveInfo(pokemon, pokedex, fastMoves, chargedMoves) {
    let fastMoveStats;
    let chargedMoveStats;

    const {idealFastMove, idealChargedMove} = getIdealMoveset(pokemon, pokedex);

    if (idealFastMove && fastMoves[idealFastMove]) {
        fastMoveStats = fastMoves[idealFastMove];
    } else {
        console.error(`Unknown fast move: ${idealFastMove} for Pokemon ${pokemon.Name}`);
    }

    if (idealChargedMove && chargedMoves[idealChargedMove]) {
        chargedMoveStats = chargedMoves[idealChargedMove];
    } else {
        console.error(`Unknown charged move: ${idealChargedMove} for Pokemon ${pokemon.Name}`);
    }

    const idealMoveset = idealFastMove + "/" + idealChargedMove;

    // Return the results as a single object
    return { idealMoveset, fastMoveStats, chargedMoveStats };
}
