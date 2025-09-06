// This function renders the Error Report
function createErrorReport(errorLog) {
    const container = document.getElementById('error-results');
    container.innerHTML = ''; // Clear previous results

    errorLog.sort((a, b) => parseInt(b.p.CP) - parseInt(a.p.CP));

    if (errorLog.length > 0) {
        errorLog.forEach(error => {
            console.log(error);
            const card = document.createElement('div');
            card.className = 'error-card';
            card.innerHTML = `
                        <p><h4>${error.p.Name} (${error.p.CP}):</h4></p> 
                        <p><strong>Message:</strong> ${error.message}</p>
            `;
            container.appendChild(card);
        });
    } else {
        container.innerHTML = '<p>No errors found in the uploaded CSV file.</p>';
    }
}