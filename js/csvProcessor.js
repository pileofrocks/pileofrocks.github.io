// This function parses a CSV string into an array of objects
function parseCSV(csv) {
    const lines = csv.split(/\r?\n/);
    const headers = lines[0].split(',');
    const pokeGeneImport = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // Skip empty lines at the end of the file
        if (line.trim() === '') continue;

        const values = line.split(',');
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
            // Trim whitespace and handle potential missing values
            obj[headers[j].trim()] = values[j] ? values[j].trim() : '';
        }
        pokeGeneImport.push(obj);
    }
    return parsePokemon(pokeGeneImport);
}

function parsePokemon(pokeGeneImport) {
    const results = [];
    const errorLog = [];

    // Use a for...of loop instead of forEach
    for (const p of pokeGeneImport) {

        // Helper function to log an error and skip the rest of the loop for this pokemon
        const logError = (errorType, message) => {
            errorLog.push({ p, errorType, message });
        };

        const pokemon = {};

        // actual pokemon
        ({actual: pokemon.actual, e} = createActualPokemon(p));
        if (e) {
            errorLog.push(e);
            continue;
        }

        // final evolution
        try {
            feName = getFinalEvolution(pokemon.actual.nameForm, window.pokedex);
        } catch (error) {
            errorLog.push({p, error, message: "Error finding final evolution"});
            continue;
        }

        ({finalEvolve: pokemon.finalEvolve, e} = createFEPokemon(feName, pokemon.actual));
        if (e) {
            errorLog.push(e);
            continue;
        }

        // Scores
        pokemon.scores = createScores(pokemon);
        if (!pokemon.scores) {
            errorLog.push({p, error:"", message: "Error calculating scores"});
            continue;
        }
        results.push(pokemon);
    }
    return {results,errorLog};
}

function createActualPokemon(p) {
    const actual = {};
    const nameForm = p.Form ? `${p.Name} ${p.Form}` : p.Name;
    const pokedexEntry = getPokedex(nameForm);
    if (!pokedexEntry) {
        return {actual: null, e: {p, error: "", message: "Unknown Pokemon"}};
    }

    // Header
    try {
        actual.name = p.Name;
        actual.form = p.Form;
        actual.nameForm = nameForm;
        actual.type = pokedexEntry.types;
        actual.lucky = (p.Lucky == 1);
        actual.shadow = (p['Shadow/Purified'] == 1);
        actual.purified = (p['Shadow/Purified'] == 2);
        actual.displayName = ((actual.shadow) ? 'Shadow ' + actual.name : actual.name);
    } catch (error) {
        return {actual: null, e: {p, error, message: "Missing Header Info"}};
    }

    // Stats
    try {
        actual.CP = p.CP;
        actual.HP = p.HP;
        actual.atkIV = parseInt(p['Atk IV']) || 0;
        actual.defIV = parseInt(p['Def IV']) || 0;
        actual.staIV = parseInt(p['Sta IV']) || 0;
        actual.IVAvg = parseInt(p['IV Avg']) || 0;
        actual.level = parseFloat(p['Level Max']) || 1;
        actual.CPM = getCPMValue(actual.level);
        actual.baseAtk = pokedexEntry.base_atk;
        actual.baseDef = pokedexEntry.base_def;
        actual.baseSta = pokedexEntry.base_sta;
    } catch (error) {
        return {actual: null, e: {p, error, message: "Missing Stats Info"}};
    }

    // Moves
    try {
        actual.fastMove = window.fastMoves[p['Quick Move']];
        actual.fastMove.Name = p['Quick Move'];
        if (actual.type.includes(actual.fastMove.Type)) {
            actual.fastMove.STAB = 1.2;
        } else {
            actual.fastMove.STAB = 1.0;
        }
    } catch (error) {
        return {actual: null, e: {p, error, message: "Missing Fast Move Info"}};
    }

    try {
        actual.chargeMove = window.chargedMoves[p['Charge Move']];
        actual.chargeMove.Name = p['Charge Move'];
        if (actual.type.includes(actual.chargeMove.Type)) {
            actual.chargeMove.STAB = 1.2;
        } else {
            actual.chargeMove.STAB = 1.0;
        }
    } catch (error) {
        return {actual: null, e: {p, error, message: "Missing Charge Move Info"}};
    }

    try {
        const idealMoveset = getIdealMoveset(nameForm, window.pokedex);
        actual.idealFastMove = window.fastMoves[idealMoveset.fastMove];
        actual.idealFastMove.Name = idealMoveset.fastMove;
        actual.idealChargeMove = window.chargedMoves[idealMoveset.chargeMove];
        actual.idealChargeMove.Name = idealMoveset.chargeMove;
    } catch (error) {
        return {actual: null, e: {p, error, message: "Missing Ideal Move Info"}};
    }

    try {
        // DPS and TDO
        ({dps: actual.dps, tdo: actual.tdo, fdps: actual.fastMove.dps, cdps: actual.chargeMove.dps} = pokeCalc(
            actual.atkIV, actual.defIV, actual.staIV,
            actual.baseAtk, actual.baseDef, actual.baseSta,
            actual.CPM, actual.fastMove, actual.chargeMove));
        ({dpsNorm: actual.dpsNorm, tdoNorm: actual.tdoNorm} = normalizeDPSTDO(actual.dps, actual.tdo));
        // ideal fast move DPS
        ({dps: actual.idealFMDPS, tdo: actual.idealFMTDO, fdps: actual.idealFastMove.dps} =
            pokeCalc(actual.atkIV, actual.defIV, actual.staIV,
                actual.baseAtk, actual.baseDef, actual.baseSta,
                actual.CPM, actual.idealFastMove, actual.chargeMove));
        // ideal charge move DPS
        ({dps: actual.idealCMDPS, tdo: actual.idealCMTDO, cdps: actual.idealChargeMove.dps} =
            pokeCalc(actual.atkIV, actual.defIV, actual.staIV,
                actual.baseAtk, actual.baseDef, actual.baseSta,
                actual.CPM, actual.fastMove, actual.idealChargeMove));
    } catch (error) {
        return {actual: null, e: {p, error, message: "Error calculating DPS/TDO"}};
    }

    return {actual, e: null};
}

function getPokedex(nameForm) {

    return window.pokedex[nameForm];
}

function pokeCalc(attackIv, defenseIv, staminaIv,
                  attackS, defenseS, staminaS,
                  cpmValue, fastMove, chargedMove) {

    const fmPWR = fastMove.PWR;
    const fmENG = fastMove.ENG;
    const fmDUR = fastMove.Duration;
    const fmSTAB = fastMove.STAB;
    const cmPWR = chargedMove.PWR;
    const cmENG = chargedMove.ENG;
    const cmDUR = chargedMove.Duration;
    const cmSTAB = chargedMove.STAB;


    const atk = (parseInt(attackS) + attackIv) * cpmValue;
    const def = (parseInt(defenseS) + defenseIv) * cpmValue;
    const hp = (parseInt(staminaS) + staminaIv) * cpmValue;

    const ex = 0.5 * cmENG + 0.5 * fmENG;
    const ey = 900 / def;
    const fdps = (0.5 * fmSTAB * fmPWR * atk / 320 + 0.5) / fmDUR;
    const feps = fmENG / fmDUR;
    const ceps = cmENG / cmDUR;
    const cdps = (0.5 * cmSTAB * cmPWR * atk / 320 + 0.5) / cmDUR;

    const dps0 = (fdps * ceps + cdps * feps) / (ceps + feps);
    const dps = dps0 + (cdps - fdps) / (ceps + feps) * (0.5 - ex / hp) * ey;
    const tdo = (dps * hp / ey);

    return {dps: dps, tdo: tdo, fdps: fdps, cdps: cdps};
}

function normalizeDPSTDO(dps, tdo) {
    const minDPS = 0.616; // Shadow Magikarp
    const maxDPS = 27.548; // Shadow Regigigas
    const minTDO = 3.6; // Shadow Magikarp
    const maxTDO = 1092.5; // Zamazenta - Crowned Shield
    let dpsNorm = (dps - minDPS) / (maxDPS - minDPS);
    // dpsNorm = Math.max(0, Math.min(1, dpsNorm)); // Clamp between 0 and 1
    let tdoNorm = (tdo - minTDO) / (maxTDO - minTDO);
    // tdoNorm = Math.max(0, Math.min(1, tdoNorm)); // Clamp between 0 and 1

    return { dpsNorm, tdoNorm };
}

// returns the final evolution of a pokemon from the pokedex
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
                return currentPokemonName;
            }

            // Move to the next evolution in the chain
            currentPokemonName = nextEvolutionName;
        } else {
            // No more evolutions found, so we're at the end of the chain.
            return currentPokemonName;
        }
    }
}

// returns a pokemon's ideal moveset from the pokedex
function getIdealMoveset(pokemonName, pokedex) {

    let pokedexEntry;


    // pokedex information
    try {
        pokedexEntry = pokedex[pokemonName];
        const fastMove = pokedexEntry.movesets[1][1].trim();
        const chargeMove = pokedexEntry.movesets[1][2].trim();
        return {fastMove, chargeMove};
    } catch (error) {
        console.error(`This Pokemon has unknown ideal movesets! ${pokemonName}`, error);
    }
}

// returns the CPM value for a given level
function getCPMValue(level) {
    let cpmValue;
    const cpmObject = window.cpm.find(c => c.level === level);
    cpmValue = cpmObject ? cpmObject.multiplier : undefined;

    return cpmValue;
}

function createFEPokemon(feName, actual) {
    const finalEvolve = {};
    const pokedexEntry = getPokedex(feName);
    if (!pokedexEntry) {
        return {finalEvolve: null, e: {actual, error: "", message: "Unknown Final Evolution"}};
    }

    // Header
    try {
        finalEvolve.name = feName;
        finalEvolve.form = null;
        finalEvolve.nameForm = feName;
        finalEvolve.type = pokedexEntry.types;
        finalEvolve.lucky = actual.lucky;
        finalEvolve.shadow = actual.shadow;
        finalEvolve.purified = actual.purified;
    } catch (error) {
        return {finalEvolve: null, e: {actual, error, message: "Missing Final Evolution Header Info"}};
    }

    // Stats
    try {
        finalEvolve.CP = null;
        finalEvolve.HP = null;
        finalEvolve.atkIV = actual.atkIV;
        finalEvolve.defIV = actual.defIV;
        finalEvolve.staIV = actual.staIV;
        finalEvolve.level = 40.0;
        finalEvolve.CPM = getCPMValue(finalEvolve.level);
        finalEvolve.baseAtk = pokedexEntry.base_atk;
        finalEvolve.baseDef = pokedexEntry.base_def;
        finalEvolve.baseSta = pokedexEntry.base_sta;
    } catch (error) {
        return {finalEvolve: null, e: {actual, error, message: "Missing Final Evolution Stats Info"}};
    }

    // Moves - assume best possible moveset
    try {
        ({fastMove: fastMoveName, chargeMove: chargeMoveName} = getIdealMoveset(feName, window.pokedex));
    } catch (error) {
        return {finalEvolve: null, e: {actual, error, message: "Missing Final Evolution Ideal Move Info"}};
    }

    try {
        finalEvolve.fastMove = window.fastMoves[fastMoveName];

        if (finalEvolve.type.includes(finalEvolve.fastMove.Type)) {
            finalEvolve.fastMove.STAB = 1.2;
        } else {
            finalEvolve.fastMove.STAB = 1.0;
        }
    } catch (error) {
        return {finalEvolve: null, e: {actual, error, message: "Missing Final Evolution Fast Move Info"}};
    }

    try {
        finalEvolve.chargeMove = window.chargedMoves[chargeMoveName];
        if (finalEvolve.type.includes(finalEvolve.chargeMove.Type)) {
            finalEvolve.chargeMove.STAB = 1.2;
        } else {
            finalEvolve.chargeMove.STAB = 1.0;
        }
    } catch (error) {
        return {finalEvolve: null, e: {actual, error, message: "Missing Final Evolution Charge Move Info"}};
    }

    try {
        // DPS and TDO
        ({
            dps: finalEvolve.dps,
            tdo: finalEvolve.tdo
        } = pokeCalc(finalEvolve.atkIV, finalEvolve.defIV, finalEvolve.staIV,
            finalEvolve.baseAtk, finalEvolve.baseDef, finalEvolve.baseSta,
            finalEvolve.CPM, finalEvolve.fastMove, finalEvolve.chargeMove));

        ({
            dpsNorm: finalEvolve.dpsNorm,
            tdoNorm: finalEvolve.tdoNorm
        } = normalizeDPSTDO(finalEvolve.dps, finalEvolve.tdo));
    } catch (error) {
        return {finalEvolve: null, e: {actual, error, message: "Error calculating Final Evolution DPS/TDO"}};
    }

    return {finalEvolve, e: null};
}

function createScores(pokemon) {

    const minDeltaDPS = 0.0;
    const maxDeltaDPS = 21.0;

    // Stardust Score (weighted score of delta DPS, DPS, and TDO)
    let deltaDPS = pokemon.finalEvolve.dps/pokemon.actual.dps;
    deltaDPS = (deltaDPS - minDeltaDPS) / (maxDeltaDPS - minDeltaDPS);
    // deltaDPS = Math.max(0, Math.min(1, deltaDPS)); // Clamp between 0 and 1

    // variable weights
    // w1 = deltaDPS weight
    // w2 = WiDPS weight
    // w3 = WiTDO weight
    // Starting values, { w1: 1.5, w2: 1.0, w3: 1.0 }
    // Meta-focused, { w1: 1.2, w2: 1.5, w3: 0.8 }
    // Hidden gems, { w1: 2, w2: 1.5, w3: 0.8 }
    // Favorite, { w1: 1.2, w2: 3.0, w3: 1.2 }
    const weights = { w1: 1.2, w2: 1.5, w3: 0.8 };
    const stardustScore = 100 * (deltaDPS**weights.w1) * (pokemon.finalEvolve.dpsNorm**weights.w2) * (pokemon.finalEvolve.tdoNorm**weights.w3) * 100;
    // Fast TM Score (potential DPS increase from fast TMs)

    const fmTMScore = 100 * (pokemon.actual.idealFMDPS - pokemon.actual.dps) / pokemon.actual.dps;

    // Charged TM Score (potential DPS increase from charged TMs)
    const cmTMScore = 100 * (pokemon.actual.idealCMDPS - pokemon.actual.dps) / pokemon.actual.dps;

    return { stardustScore, fmTMScore, cmTMScore };

}