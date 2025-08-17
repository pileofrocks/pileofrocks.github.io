function drawCPChart(data) {
    const cpValues = data.map(p => parseInt(p['CP'] || 0)).filter(cp => !isNaN(cp));
    const bins = new Array(10).fill(0);
    cpValues.forEach(cp => {
    const bin = Math.min(Math.floor(cp / 500), 9);
    bins[bin]++;
    });

    try {
        var existing_chart = Chart.getChart('cpChart')
        existing_chart.destroy();
        console.log('trying to destory then redraw chart');
    } catch(e) {
        console.log('chart does not exist yet to destroy');
    }


    const ctx = document.getElementById('cpChart');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['0–499', '500–999', '1000–1499', '1500–1999', '2000–2499', '2500–2999', '3000–3499', '3500–3999', '4000–4499', '4500+'],
            datasets: [{
            label: 'CP Distribution',
            data: bins,
            backgroundColor: 'rgb(78,191,224)',
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

  document.getElementById('chartSection').style.display = 'block';
}