// This function is responsible only for processing the raw text
// It will take the raw CSV text as input and return the processed data array
function processCsvText(csvText) {
    const lines = csvText.split(/\r?\n/);
    const header = lines[0].split(','); // Assuming comma-separated header

    const data = lines.slice(1).filter(Boolean).map(line => {
        const values = line.split(','); // Assuming comma-separated values
        return Object.fromEntries(header.map((key, i) => [key.trim(), values[i]?.trim()]));
    });

	console.log(header)

    // Also return the header separately, as it's useful for table rendering etc.
    return { data: data, header: header.map(h => h.trim()) };
}