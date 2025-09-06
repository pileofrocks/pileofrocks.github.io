document.addEventListener('DOMContentLoaded', async () => {

    // Load static data from JSON files
    try {
        window.pokedex = await fetch('data/pokedex.json').then(response => response.json());
        window.fastMoves = await fetch('data/fast_moves.json').then(response => response.json());
        window.chargedMoves = await fetch('data/charged_moves.json').then(response => response.json());
        window.cpm = await fetch('data/cp_multiplier.json').then(response => response.json());

        console.log("Static data loaded:", { pokedex, fastMoves, chargedMoves, cpm });
    } catch (error) {
        console.error("Failed to load static data:", error);
    }


    // Main event listener for file upload
    document.getElementById('file-input').addEventListener('change', function(event) {
        const file = event.target.files[0];
        const messageBox = document.getElementById('message-box');
        const appContent = document.getElementById('app-content');

        if (file && file.name.endsWith('.csv')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const csvText = e.target.result;
                let pokemonData = parseCSV(csvText);

                if (pokemonData.length > 0) {
                    messageBox.textContent = `File "${file.name}" uploaded successfully! Parsed ${pokemonData.length} Pokémon.`;
                    messageBox.className = 'message-success';
                    messageBox.style.display = 'block';
                    document.getElementById('upload-section').style.display = 'none';
                    appContent.style.display = 'block';

                    console.log(pokemonData);
                    // Render the Summary Tab
                    createSummary(pokemonData);

                    //render stardust investment report
                    createStardustReport(pokemonData);

                    // Render the Fast Move TM Tab
                    createFMTMReport(pokemonData);

                    // Render the Charge Move TM Tab
                    createCMTMReport(pokemonData);

                } else {
                    messageBox.textContent = 'CSV file is empty or formatted incorrectly.';
                    messageBox.className = 'message-error';
                    messageBox.style.display = 'block';
                    appContent.style.display = 'none';
                }
            };
            reader.readAsText(file);
        } else {
            messageBox.textContent = 'Please select a valid CSV file.';
            messageBox.className = 'message-error';
            messageBox.style.display = 'block';
            appContent.style.display = 'none';
        }
    });

})