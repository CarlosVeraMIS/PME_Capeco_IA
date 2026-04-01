document.addEventListener('DOMContentLoaded', async () => {
    let data = [];
    try {
        const response = await fetch('data.json');
        data = await response.json();
    } catch (error) {
        console.error('Error cargando datos:', error);
        return;
    }

    // Initialize stats
    const totalProjects = data.reduce((acc, curr) => acc + curr.projects, 0);
    const totalUnits = data.reduce((acc, curr) => acc + curr.units, 0);
    const avgPrice = data.reduce((acc, curr) => acc + (curr.avg_price * curr.projects), 0) / totalProjects;

    document.getElementById('total-projects').textContent = totalProjects.toLocaleString();
    document.getElementById('total-units').textContent = totalUnits.toLocaleString();
    document.getElementById('avg-price').textContent = `S/ ${Math.round(avgPrice).toLocaleString()}`;

    // Initialize Map
    const map = L.map('map', {
        zoomControl: false,
        scrollWheelZoom: false,
        attributionControl: false
    }).setView([-12.06, -77.03], 11);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Markers and Heat Points
    const markers = [];
    data.forEach(d => {
        if (d.lat && d.lng) {
            const radius = Math.sqrt(d.units) * 2;
            const circle = L.circleMarker([d.lat, d.lng], {
                radius: Math.max(5, Math.min(30, radius)),
                fillColor: '#38bdf8',
                color: '#fff',
                weight: 1,
                opacity: 0.8,
                fillOpacity: 0.6
            }).addTo(map);

            const popupContent = `
                <div class="popup-info">
                    <h4>${d.district}</h4>
                    <p>Proyectos: <span>${d.projects}</span></p>
                    <p>Unidades: <span>${d.units.toLocaleString()}</span></p>
                    <p>Precio m²: <span>S/ ${Math.round(d.price_per_m2).toLocaleString()}</span></p>
                    <p>Prom. Área: <span>${d.avg_area.toFixed(1)} m²</span></p>
                </div>
            `;
            circle.bindPopup(popupContent);
            markers.push({ district: d.district, marker: circle });
        }
    });

    // Populate Table
    const tableBody = document.querySelector('#districts-table tbody');
    const renderTable = (filter = '') => {
        tableBody.innerHTML = '';
        data
            .filter(d => d.district.toLowerCase().includes(filter.toLowerCase()))
            .forEach(d => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${d.district}</strong></td>
                    <td>${d.projects}</td>
                    <td>${d.units.toLocaleString()}</td>
                    <td>S/ ${Math.round(d.avg_price).toLocaleString()}</td>
                    <td>${d.avg_area.toFixed(1)}</td>
                    <td>S/ ${Math.round(d.price_per_m2).toLocaleString()}</td>
                `;
                tr.addEventListener('click', () => {
                    const m = markers.find(item => item.district === d.district);
                    if (m) {
                        map.setView(m.marker.getLatLng(), 13);
                        m.marker.openPopup();
                    }
                });
                tableBody.appendChild(tr);
            });
    };
    renderTable();

    // Search Interaction
    document.getElementById('search-input').addEventListener('input', (e) => {
        renderTable(e.target.value);
    });

    // Initialize Charts
    const ctxUnits = document.getElementById('unitsChart').getContext('2d');
    const sortedUnits = [...data].sort((a, b) => b.units - a.units).slice(0, 10);
    
    new Chart(ctxUnits, {
        type: 'bar',
        data: {
            labels: sortedUnits.map(d => d.district),
            datasets: [{
                label: 'Unidades Disponibles',
                data: sortedUnits.map(d => d.units),
                backgroundColor: 'rgba(56, 189, 248, 0.5)',
                borderColor: '#38bdf8',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            },
            plugins: { legend: { display: false } }
        }
    });

    const ctxPrice = document.getElementById('priceChart').getContext('2d');
    const sortedPrice = [...data].sort((a, b) => b.price_per_m2 - a.price_per_m2).slice(0, 12);

    new Chart(ctxPrice, {
        type: 'line',
        data: {
            labels: sortedPrice.map(d => d.district),
            datasets: [{
                label: 'Precio por m²',
                data: sortedPrice.map(d => d.price_per_m2),
                borderColor: '#f472b6',
                backgroundColor: 'rgba(244, 114, 182, 0.2)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#f472b6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            },
            plugins: { legend: { display: false } }
        }
    });
});
