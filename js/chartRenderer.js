// This function renders a pie chart on a given canvas
function renderPieChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const total = Object.values(data).reduce((sum, count) => sum + count, 0);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.7;
    let currentAngle = 0;

    const colors = {
            normal: '#a8a78a',
            fire: '#EE8130',
            water: '#6390F0',
            electric: '#F7D02C',
            grass: '#7AC74C',
            ice: '#96D9D6',
            fighting: '#C22E28',
            poison: '#A33EA1',
            ground: '#E2BF65',
            flying: '#A98FF3',
            psychic: '#F95587',
            bug: '#A6B91A',
            rock: '#B6A136',
            ghost: '#735797',
            dragon: '#6F35FC',
            dark: '#705746',
            steel: '#B7B7CE',
            fairy: '#D685AD',
    };


    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each slice of the pie chart
    for (const [type, count] of Object.entries(data)) {
        const sliceAngle = (count / total) * 2 * Math.PI;
        const sliceColor = colors[type];

        ctx.beginPath();
        ctx.fillStyle = sliceColor;
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();

        // Calculate the position for the label text
        const textAngle = currentAngle + sliceAngle / 2;
        const textX = centerX + Math.cos(textAngle) * (radius / 1.5);
        const textY = centerY + Math.sin(textAngle) * (radius / 1.5);

        // Draw the label
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '10px "Press Start 2P"';
        ctx.fillText(type, textX, textY);

        currentAngle += sliceAngle;
    }
}

// This function renders a histogram on a given canvas
function renderHistogram(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const margin = 50;
    const chartWidth = canvas.width - margin * 2;
    const chartHeight = canvas.height - margin * 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Find max value for scaling
    const maxCount = Math.max(...Object.values(data));
    const levels = Object.keys(data).sort((a, b) => parseFloat(a) - parseFloat(b));

    const barWidth = chartWidth / levels.length;

    // Draw bars
    ctx.fillStyle = '#4a90e2'; // Bar color
    levels.forEach((level, index) => {
        const count = data[level];
        const barHeight = (count / maxCount) * chartHeight;
        const x = margin + index * barWidth;
        const y = canvas.height - margin - barHeight;
        ctx.fillRect(x, y, barWidth - 2, barHeight);
    });

    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, canvas.height - margin);
    ctx.lineTo(canvas.width - margin, canvas.height - margin);
    ctx.stroke();

    // Draw x-axis labels (Levels)
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.font = '12px "Courier New"';
    levels.forEach((level, index) => {
        const x = margin + index * barWidth + barWidth / 2;
        const y = canvas.height - margin + 15;
        ctx.fillText(level, x, y);
    });

    // Draw y-axis labels (Counts)
    ctx.textAlign = 'right';
    const numLabels = 5;
    for (let i = 0; i <= numLabels; i++) {
        const labelValue = Math.round((maxCount / numLabels) * i);
        const y = canvas.height - margin - (labelValue / maxCount) * chartHeight;
        ctx.fillText(labelValue, margin - 10, y);
    }
}