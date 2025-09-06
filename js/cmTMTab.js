// This function renders the TM Report
function createCMTMReport(pokemonData) {
    const container = document.getElementById('cm-tm-results');
    container.innerHTML = ''; // Clear previous results

    // Filter for good TMs candidates (Increase in DPS)
    const chargeTMCandidates = []
    pokemonData.forEach(p => {
        if (p.scores.cmTMScore > 0.0 && p.actual.nameForm === p.finalEvolve.nameForm) {
            chargeTMCandidates.push(p);
        }
    });

    // Sort by fm tm score in descending order to show the most cost-effective first
    chargeTMCandidates.sort((a, b) => parseFloat(b.scores.cmTMScore) - parseFloat(a.scores.cmTMScore));

    if (chargeTMCandidates.length > 0) {
        chargeTMCandidates.forEach(p => {

            const card = document.createElement('div');
            card.className = 'cmtm-card';
            card.innerHTML = `
                        <p><h4>${p.actual.CP} ${p.actual.displayName} - ${(p.scores.cmTMScore).toFixed(0)}</h4> 
                        <p><strong>IV:</strong> ${p.actual.IVAvg}% (${p.actual.atkIV}/${p.actual.defIV}/${p.actual.staIV})</p>
                        
                        <table>
                            <tr>
                                <th colspan="2"><strong>Current Move</strong></th>
                                <th colspan="2"><strong>Ideal Move</strong></th>
                            </tr>
                            <tr>
                                <td><strong>Name:</strong></td>
                                <td>${p.actual.chargeMove.Name}</td>
                                <td><strong>Name:</strong></td>
                                <td>${p.actual.idealChargeMove.Name}</td>                  
                            <tr>
                                <td><strong>Type:</strong></td>
                                <td>${capitalizeFirstLetter(p.actual.chargeMove.Type)}</td>
                                <td><strong>Type:</strong></td>
                                <td>${capitalizeFirstLetter(p.actual.idealChargeMove.Type)}</td>
                            </tr>
                            <tr>
                                <td><strong>Power/Energy/Duration:</strong></td>
                                <td>${p.actual.chargeMove.PWR}/${p.actual.chargeMove.ENG}/${p.actual.chargeMove.Duration}</td>
                                <td><strong>Power/Energy/Duration:</strong></td>
                                <td>${p.actual.idealChargeMove.PWR}/${p.actual.idealChargeMove.ENG}/${p.actual.idealChargeMove.Duration}</td>
                            </tr>
                            <tr>
                                <td><strong>Move DPS:</strong></td>
                                <td>${p.actual.chargeMove.DPS}</td>
                                <td><strong>Move DPS:</strong></td>
                                <td>${p.actual.idealChargeMove.DPS}</td>
                            </tr>
                        </table>
           
                        
                    `;
            container.appendChild(card);
        });
    } else {
        container.innerHTML = '<p>No ideal candidates for PvE stardust investment found in your file. Try to get more Pokémon with high IVs!</p>';
    }
}