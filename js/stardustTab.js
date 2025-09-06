// This function renders the Stardust Report
function createStardustReport(pokemonData) {
    const container = document.getElementById('stardust-results');
    container.innerHTML = ''; // Clear previous results


    // Filter for good PvE candidates (High Attack and overall IV)
    const pveCandidates = []
    pokemonData.forEach(p => {
        if (p.scores.stardustScore) {
            // console.log(p)
            if (p.scores.stardustScore > 0.0) {
                pveCandidates.push(p);
            }
        }
    });

    // Sort by level in descending order to show the most cost-effective first
    pveCandidates.sort((a, b) => parseFloat(b.scores.stardustScore) - parseFloat(a.scores.stardustScore));

    if (pveCandidates.length > 0) {
        pveCandidates.forEach(p => {

            const card = document.createElement('div');
            card.className = 'stardust-card';
            card.innerHTML = `
                        <p><h4>${p.actual.CP} ${p.actual.displayName} - ${(p.scores.stardustScore).toFixed(0)}</h4> 
                        <p><stron>DPS:</stron> ${p.actual.dps.toFixed(2)}/${p.finalEvolve.dps.toFixed(2)} <strong>TDO:</strong> ${p.actual.tdo.toFixed(2)}/${p.finalEvolve.tdo.toFixed(2)}</p>
                        <p><strong>IV:</strong> ${p.actual.IVAvg}% (${p.actual.atkIV}/${p.actual.defIV}/${p.actual.staIV})</p>
                        
                        <table>
                            <tr>
                                <th colspan="2"><strong>Current Stats</strong></th>
                                <th colspan="2"><strong>Ideal Stats</strong></th>
                            </tr>
                            <tr>
                                <td><strong>Name:</strong></td>
                                <td>${p.actual.name}</td>
                                <td><strong>Name:</strong></td>
                                <td>${p.finalEvolve.name}</td>                  
                            <tr>
                                <td><strong>Level:</strong></td>
                                <td>${p.actual.level}</td>
                                <td><strong>Level:</strong></td>
                                <td>40</td>
                            </tr>
                            <tr>
                                <td><strong>Moveset:</strong></td>
                                <td>${p.actual.fastMove.Name}/${p.actual.chargeMove.Name}</td>
                                <td><strong>Moveset:</strong></td>
                                <td>${p.finalEvolve.fastMove.Name}/${p.finalEvolve.chargeMove.Name}</td>
                            </tr>
                            <tr>
                                <td><strong>DPS/TDO:</strong></td>
                                <td>${p.actual.dps.toFixed(2)}/${p.actual.tdo.toFixed(2)}</td>
                                <td><strong>DPS/TDO::</strong></td>
                                <td>${p.actual.idealFMDPS.toFixed(2)}/${p.actual.idealFMTDO.toFixed(2)}</td>
                            </tr>
                        </table>
           
                        
                    `;
            container.appendChild(card);
        });
    } else {
        container.innerHTML = '<p>No ideal candidates for PvE stardust investment found in your file. Try to get more Pokémon with high IVs!</p>';
    }
}
