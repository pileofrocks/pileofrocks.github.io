// This function renders the TM Report
function createFMTMReport(pokemonData) {
    const container = document.getElementById('fm-tm-results');
    container.innerHTML = ''; // Clear previous results

    // Filter for good TMs candidates (Increase in DPS)
    const fastTMCandidates = []
    pokemonData.forEach(p => {
        if (p.scores.fmTMScore > 0.0 && p.actual.nameForm === p.finalEvolve.nameForm) {
            fastTMCandidates.push(p);
        }
    });
    console.log(fastTMCandidates);

    // Sort by fm tm score in descending order to show the most cost-effective first
    fastTMCandidates.sort((a, b) => parseFloat(b.scores.fmTMScore) - parseFloat(a.scores.fmTMScore));

    if (fastTMCandidates.length > 0) {
        fastTMCandidates.forEach(p => {

            const card = document.createElement('div');
            card.className = 'fmtm-card';
            card.innerHTML = `
                        <p><h4>${p.actual.CP} ${p.actual.displayName} - ${(p.scores.fmTMScore).toFixed(0)}</h4> 
                        <p><strong>IV:</strong> ${p.actual.IVAvg}% (${p.actual.atkIV}/${p.actual.defIV}/${p.actual.staIV})</p>
                        
                        <table>
                            <tr>
                                <th colspan="2"><strong>Current Move</strong></th>
                                <th colspan="2"><strong>Ideal Move</strong></th>
                            </tr>
                            <tr>
                                <td><strong>Name:</strong></td>
                                <td>${p.actual.fastMove.Name}</td>
                                <td><strong>Name:</strong></td>
                                <td>${p.actual.idealFastMove.Name}</td>                  
                            <tr>
                                <td><strong>Type:</strong></td>
                                <td>${capitalizeFirstLetter(p.actual.fastMove.Type)}</td>
                                <td><strong>Type:</strong></td>
                                <td>${capitalizeFirstLetter(p.actual.idealFastMove.Type)}</td>
                            </tr>
                            <tr>
                                <td><strong>Power/Energy/Duration:</strong></td>
                                <td>${p.actual.fastMove.PWR}/${p.actual.fastMove.ENG}/${p.actual.fastMove.Duration}</td>
                                <td><strong>Power/Energy/Duration:</strong></td>
                                <td>${p.actual.idealFastMove.PWR}/${p.actual.idealFastMove.ENG}/${p.actual.idealFastMove.Duration}</td>
                            </tr>
                            <tr>
                                <td><strong>Move DPS:</strong></td>
                                <td>${p.actual.fastMove.DPS}</td>
                                <td><strong>Move DPS:</strong></td>
                                <td>${p.actual.idealFastMove.DPS}</td>
                            </tr>
                        </table>
           
                        
                    `;
            container.appendChild(card);
        });
    } else {
        container.innerHTML = '<p>No ideal candidates for PvE stardust investment found in your file. Try to get more Pokémon with high IVs!</p>';
    }
}