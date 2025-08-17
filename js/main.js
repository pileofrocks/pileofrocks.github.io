document.addEventListener('DOMContentLoaded', async () => {
    const fileInput = document.getElementById('fileInput');
    const fileNameDisplay = document.getElementById('fileStats');
    const pokemonTableBody = document.querySelector('#pokemonTable tbody'); // Select the tbody
	let currentProcessedData = [];
    let currentHeader = [];
    const analysisCheckboxes = document.querySelectorAll('input[name="analysis-type"]');
	
	// Load static data from JSON files
	try {
		window.pokedex = await fetch('data/pokedex.json').then(response => response.json());
		window.fastMoves = await fetch('data/fast_moves.json').then(response => response.json());
        window.chargedMoves = await fetch('data/charged_moves.json').then(response => response.json());
        window.cpm = await fetch('data/cp_multiplier.json').then(response => response.json());
		
		console.log("Static data loaded:", { pokedex, fastMoves, chargedMoves, cpm });
        //console.log(pokedex['Zacian'])
	} catch (error) {
		console.error("Failed to load static data:", error);
	}

    // Add an event listener to each one
    analysisCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            // Collect all selected analysis types
            const selectedTypes = Array.from(analysisCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);

            console.log("Selected analysis types:", selectedTypes);

            // Now, run the analysis based on the collected types
            if (currentProcessedData && currentProcessedData.length > 0) {
                analyzeData(currentProcessedData, currentHeader, selectedTypes);
            } else {
                console.log("No data available to run analysis.");
            }
        });
    });

    // Define the event handler for the file input change
	function handleFile(event) {
		const file = event.target.files[0];
		if (!file) {
			fileNameDisplay.textContent = 'No file chosen';
			return;
		}
		
		const reader = new FileReader();
		reader.onload = (e) => {
			const csvText = e.target.result;
			//call csvProcessor.js
			const { data, header} = processCsvText(csvText);
			currentProcessedData = data;
			currentHeader = header;

            // Get selectedTypes at the moment the file is processed.
            const selectedTypes = Array.from(analysisCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);

			//pass data and header to analysis/redering functions
			analyzeData(currentProcessedData, currentHeader, selectedTypes);
		};
		reader.readAsText(file);
	}

	fileInput.addEventListener('change', handleFile);
	
	// initial state for file name display
	fileNameDisplay.textContent = 'No file chosen';
	
	//  Replace this with actual analysis and redering logic
    function analyzeData(data, header, selectedTypes) {
        console.log("data processed", data);
        console.log("header processed", header);
        console.log(`${data.length} Pokémon loaded.`);
        console.log("selected types", selectedTypes);
        document.getElementById('fileStats').textContent = `${data.length} Pokémon loaded.`;

        // Get the element and change its display style to make it visible
        document.getElementById('tableSection').style.display = 'block';

        const { enrichedData, errorLog } = pokeAnalysis(data, selectedTypes);

        drawCPChart(enrichedData);

        // Pass the enriched data to your existing table function
        generateTable(enrichedData, 'pokemonTable', 'tableSection');

        // Call the new function to handle the error log
        generateErrorTables(errorLog);

        // If there's an error log, make sure the error section is visible
        if (errorLog.length > 0) {
            document.getElementById('errorSection').style.display = 'block';
        }


    }
});