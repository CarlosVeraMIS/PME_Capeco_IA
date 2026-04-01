document.addEventListener('DOMContentLoaded', () => {
    if (typeof DASHBOARD_DATA !== 'undefined') {
        renderRiskDashboard(DASHBOARD_DATA);
    } else {
        console.error("DASHBOARD_DATA not found.");
    }
});

function renderRiskDashboard(data) {
    // 1. KPIs
    const formatSols = (val) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(val);
    const formatPct = (val) => val.toFixed(1) + '%';
    const formatNum = (val) => new Intl.NumberFormat('es-PE').format(val);

    const summary = data.summary;
    document.getElementById('total_exposure').innerText = formatSols(summary.total_market_value);
    document.getElementById('avg_absorption').innerText = formatPct(summary.avg_absorption);
    document.getElementById('active_projects').innerText = formatNum(summary.total_active_projects);

    const riskPalette = ['#C62828', '#FF8F00', '#2E7D32', '#616161'];

    // 2. Risk Phase Chart (Donut)
    new Chart(document.getElementById('riskPhaseChart'), {
        type: 'doughnut',
        data: {
            labels: data.risk_by_phase.map(r => r.risk_level),
            datasets: [{
                data: data.risk_by_phase.map(r => r.value),
                backgroundColor: riskPalette,
                borderWidth: 0,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10, weight: '600' } } } }
        }
    });

    // 3. Top Developer Table
    const devBody = document.querySelector('#developerTable tbody');
    data.top_developers.forEach(d => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${d.developer || '---'}</strong></td>
            <td>${d.projects}</td>
            <td>${formatSols(d.total_exposure_value)}</td>
        `;
        devBody.appendChild(row);
    });

    // 4. LTV Risk Buckets Chart (Polar Area for Pricing Tiers)
    new Chart(document.getElementById('ltvRiskChart'), {
        type: 'polarArea',
        data: {
            labels: data.ltv_risk.map(l => l.market_tier),
            datasets: [{
                data: data.ltv_risk.map(l => l.stock_risk),
                backgroundColor: ['rgba(198, 40, 40, 0.7)', 'rgba(2, 136, 209, 0.7)', 'rgba(46, 125, 50, 0.7)', 'rgba(117, 117, 117, 0.7)']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } },
                tooltip: { callbacks: { label: (ctx) => `Stock sin vender: ${ctx.raw.toFixed(1)}%` } }
            }
        }
    });

    // 5. Liquidity Trend (Trend Line)
    const trendLabels = data.liquidity_trend.map(l => `${l.ANIO}-Q${l.TRIM}`);
    const trendValues = data.liquidity_trend.map(l => l.absorption);

    new Chart(document.getElementById('liquidityTrendChart'), {
        type: 'line',
        data: {
            labels: trendLabels,
            datasets: [{
                label: 'Tasa de Absorción Trimestral (%)',
                data: trendValues,
                borderColor: '#1A1A1A',
                backgroundColor: '#1A1A1A',
                borderWidth: 4,
                pointRadius: 6,
                fill: false,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { min: 0, title: { display: true, text: 'Absorción (%)' } }
            }
        }
    });
}
