/**
 * CONFIGURATION:
 * Define each sheet's URL and the columns to hide for that specific sheet.
 * A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9, K=10, L=11
 */
const SHEET_CONFIG = {
    overall: {
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSiRDUoBgqI4pe3cg287kDM9hUax3HxUE3FMTyzb_Rh1kx3GYD7L0YyztSdEvyONSnWJtz2fH-EWZp1/pub?gid=862922248&single=true&output=csv',
        hidden: [] // Keep empty for the graph
    },
    crashes: {
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSiRDUoBgqI4pe3cg287kDM9hUax3HxUE3FMTyzb_Rh1kx3GYD7L0YyztSdEvyONSnWJtz2fH-EWZp1/pub?gid=878123868&single=true&output=csv',
        hidden: [3, 4, 6, 7, 8, 9, 10, 11] // Hides D:E and G:L
    },
    ui: {
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSiRDUoBgqI4pe3cg287kDM9hUax3HxUE3FMTyzb_Rh1kx3GYD7L0YyztSdEvyONSnWJtz2fH-EWZp1/pub?gid=4470925&single=true&output=csv',
        hidden: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    },
    vehicles: {
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSiRDUoBgqI4pe3cg287kDM9hUax3HxUE3FMTyzb_Rh1kx3GYD7L0YyztSdEvyONSnWJtz2fH-EWZp1/pub?gid=1918390003&single=true&output=csv',
        hidden: [3, 4, 5, 8, 9, 10, 11, 12, 13, 14, 15]
    },
    performance: {
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSiRDUoBgqI4pe3cg287kDM9hUax3HxUE3FMTyzb_Rh1kx3GYD7L0YyztSdEvyONSnWJtz2fH-EWZp1/pub?gid=986906111&single=true&output=csv',
        hidden: [3, 5, 6, 7, 8 ,9, 10, 11, 12, 13, 14, 15]
    }
};

let currentChart = null;

async function switchSheet(category) {
    // 1. Update Tab UI
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${category}`).classList.add('active');

    // 2. Fetch Data
    try {
        const config = SHEET_CONFIG[category];
        const response = await fetch(config.url);
        const csvText = await response.text();
        const rows = csvText.split('\n').filter(row => row.trim() !== "");

        if (category === 'overall') {
            displayGraph(rows);
        } else {
            // Pass the hidden columns specific to this category
            displayDynamicTable(rows, config.hidden);
        }
    } catch (err) {
        console.error("Data Load Error:", err);
    }
}

function displayDynamicTable(rows, hiddenCols) {
    document.getElementById('graph-wrapper').classList.add('hidden');
    document.getElementById('table-wrapper').classList.remove('hidden');

    const tableHeadRow = document.getElementById('table-header-row');
    const tableBody = document.getElementById('table-body');

    tableHeadRow.innerHTML = '';
    tableBody.innerHTML = '';

    // 1. PROCESS HEADERS
    const headers = rows[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    headers.forEach((header, index) => {
        if (hiddenCols.includes(index)) return; // Skip if in hidden list for THIS sheet

        const th = document.createElement('th');
        th.className = "p-4 border-b border-gray-800 whitespace-nowrap text-blue-500 font-bold text-[10px] uppercase";
        th.innerText = header.replace(/"/g, "").trim();
        tableHeadRow.appendChild(th);
    });

    // 2. PROCESS DATA ROWS
    rows.slice(1).forEach(row => {
        const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const tr = document.createElement('tr');
        tr.className = "bg-[#232830] hover:bg-[#2a313a] transition-all border-b border-gray-800/30";

        cols.forEach((cell, index) => {
            if (hiddenCols.includes(index)) return; // Skip if in hidden list for THIS sheet

            const td = document.createElement('td');
            td.className = "p-4 text-gray-300 text-sm min-w-[200px]";
            td.innerText = cell.replace(/"/g, "").trim() || "—";
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });
}

function displayGraph(rows) {
    document.getElementById('graph-wrapper').classList.remove('hidden');
    document.getElementById('table-wrapper').classList.add('hidden');
    const labels = [];
    const values = [];
    for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(',');
        const label = cols[0]?.trim().replace(/"/g, "");
        const val = parseInt(cols[1]);
        if (label && !isNaN(val)) { labels.push(label); values.push(val); }
    }
    renderChart(labels, values);
}

function renderChart(labels, data) {
    const ctx = document.getElementById('statsChart').getContext('2d');
    if (currentChart) currentChart.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, '#3b82f6');
    gradient.addColorStop(1, 'rgba(30, 58, 138, 0.1)');

    currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ data: data, backgroundColor: gradient, borderRadius: 5, barThickness: 45 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#252a31' }, ticks: { color: '#64748b' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

// Initial Load
switchSheet('overall');