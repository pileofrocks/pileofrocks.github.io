function generateTable(data, tableId, containerId) {
    //console.log(data)
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // Clear the container

    const table = document.createElement('table');
    table.id = tableId;

    const headers = [
        'Name',
        'CP',
        'Level Max',
        'Actual Moveset',
        'Actual DPS',
        'Actual TDO',
        'What-if Moveset',
        'What-if DPS',
        'What-if TDO',
        'Difference DPS',
        'Difference TDO']

    // Create the table header (thead)
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.classList.add('sortable');
    headerRow.innerHTML = headers.map(col => `<th data-sort-by="${col}">${col}</th>`).join('');
    thead.appendChild(headerRow);
    table.appendChild(thead);

    data.sort((a, b) => b['Difference DPS'] - a['Difference DPS']);

    // Create the table body (tbody)
    const tbody = document.createElement('tbody');
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = headers.map(col => `<td>${item[col]}</td>`).join('');
        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    container.appendChild(table);

    // Now, attach the sorting logic
    attachSortingLogic(table);
}

/**
 * Attaches sorting functionality to a given table.
 * @param {HTMLElement} table - The table element to make sortable.
 */
function attachSortingLogic(table) {
    const headers = table.querySelectorAll('th');
    const tbody = table.querySelector('tbody');
    let isAscending = true; // State variable to track sort direction



    headers.forEach(header => {
        header.addEventListener('click', () => {
            const sortBy = header.dataset.sortBy;

            // Get all rows from the table body
            const rows = Array.from(tbody.querySelectorAll('tr'));

            // Sort the rows based on the 'sortBy' attribute
            const sortedRows = rows.sort((a, b) => {
                const aValue = a.querySelector(`td:nth-child(${getColumnIndex(header)})`).textContent;
                const bValue = b.querySelector(`td:nth-child(${getColumnIndex(header)})`).textContent;

                // Compare values as numbers if possible, otherwise as strings
                if (!isNaN(aValue) && !isNaN(bValue)) {
                    return isAscending ? parseFloat(aValue) - parseFloat(bValue) : parseFloat(bValue) - parseFloat(aValue);
                } else {
                    return isAscending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                }
            });

            // Toggle the sort direction for the next click
            isAscending = !isAscending;

            // Clear the current table body
            while (tbody.firstChild) {
                tbody.removeChild(tbody.firstChild);
            }

            // Append the sorted rows
            sortedRows.forEach(row => tbody.appendChild(row));
        });
    });

    // Helper function to get the index of the clicked header
    function getColumnIndex(header) {
        const headerSiblings = Array.from(header.parentNode.children);
        return headerSiblings.indexOf(header) + 1;
    }
}

/**
 * Generates and displays separate tables for each type of data error.
 * @param {Array<Object>} errorLog - The array of error objects from pokeAnalysis.
 */
function generateErrorTables(errorLog) {
    const container = document.getElementById('errorTablesContainer');
    container.innerHTML = ''; // Clear previous errors

    // Get unique error types
    const errorTypes = [...new Set(errorLog.map(err => err.errorType))];

    if (errorTypes.length === 0) {
        document.getElementById('errorSection').style.display = 'none';
        return;
    }

    errorTypes.forEach(type => {
        const errors = errorLog.filter(err => err.errorType === type);

        errors.sort((a, b) => a.pokemon.Name.localeCompare(b.pokemon.Name));

        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th colspan="3">${type} (${errors.length})</th>
                </tr>
                <tr>
                    <th>Pokémon Name</th>
                    <th>CP</th>
                    <th>Error Message</th>
                </tr>
            </thead>
            <tbody>
                ${errors.map(err => `
                    <tr>
                        <td>${err.pokemon.Name}</td>
                        <td>${err.pokemon.CP}</td>
                        <td>${err.message}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        container.appendChild(table);
    });
}