const SHEET_CONFIG = {
    overall: { url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSiRDUoBgqI4pe3cg287kDM9hUax3HxUE3FMTyzb_Rh1kx3GYD7L0YyztSdEvyONSnWJtz2fH-EWZp1/pub?gid=862922248&single=true&output=csv', hidden: [] },
    crashes: { url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSiRDUoBgqI4pe3cg287kDM9hUax3HxUE3FMTyzb_Rh1kx3GYD7L0YyztSdEvyONSnWJtz2fH-EWZp1/pub?gid=878123868&single=true&output=csv', hidden: [3, 4, 6, 7, 8, 9, 10, 11] },
    ui: { url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSiRDUoBgqI4pe3cg287kDM9hUax3HxUE3FMTyzb_Rh1kx3GYD7L0YyztSdEvyONSnWJtz2fH-EWZp1/pub?gid=4470925&single=true&output=csv', hidden: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
    vehicles: { url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSiRDUoBgqI4pe3cg287kDM9hUax3HxUE3FMTyzb_Rh1kx3GYD7L0YyztSdEvyONSnWJtz2fH-EWZp1/pub?gid=1918390003&single=true&output=csv', hidden: [3, 4, 5, 8, 9, 10, 11, 12, 13, 14, 15] },
    performance: { url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSiRDUoBgqI4pe3cg287kDM9hUax3HxUE3FMTyzb_Rh1kx3GYD7L0YyztSdEvyONSnWJtz2fH-EWZp1/pub?gid=986906111&single=true&output=csv', hidden: [3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] }
};

let currentChart = null;
let stats = { wip: 0, fixed: 0, globalTotal: 0 };

// Restore the "Support Team" brand and Global Count
async function updateGlobalStats() {
    let total = 0;
    const categories = ['crashes', 'ui', 'vehicles', 'performance'];

    for (const cat of categories) {
        try {
            const res = await fetch(SHEET_CONFIG[cat].url);
            const text = await res.text(); // Fixed the .res.text() typo here
            const rowCount = text.split('\n').filter(row => row.trim() !== "").length - 1;
            total += Math.max(0, rowCount);
        } catch (e) {
            console.error("Error counting category: " + cat, e);
        }
    }
    stats.globalTotal = total;
    const totalEl = document.getElementById('stat-total');
    if (totalEl) totalEl.innerText = stats.globalTotal;
}

async function switchSheet(category) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const btn = document.getElementById(`btn-${category}`);
    if(btn) btn.classList.add('active');

    try {
        const config = SHEET_CONFIG[category];
        const response = await fetch(config.url);
        const csvText = await response.text();
        const rows = csvText.split('\n').filter(row => row.trim() !== "");

        if (category === 'overall') {
            displayGraph(rows);
        } else {
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
    tableHeadRow.innerHTML = ''; tableBody.innerHTML = '';

    const headers = rows[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    headers.forEach((header, index) => {
        if (hiddenCols.includes(index)) return;
        const th = document.createElement('th');
        th.className = "p-4 border-b border-gray-800 text-blue-500 font-bold text-[10px] uppercase tracking-widest";
        th.innerText = header.replace(/"/g, "").trim();
        tableHeadRow.appendChild(th);
    });

    const actionTh = document.createElement('th');
    actionTh.className = "p-4 border-b border-gray-800 text-blue-500 font-bold text-[10px] text-center uppercase tracking-widest";
    actionTh.innerText = "Operation Panel";
    tableHeadRow.appendChild(actionTh);

    rows.slice(1).forEach((row, rowIndex) => {
        const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const tr = document.createElement('tr');
        tr.id = `row-${rowIndex}`;
        tr.className = "bg-[#232830] hover:bg-[#2a313a] transition-all border-b border-gray-800/30";

        cols.forEach((cell, index) => {
            if (hiddenCols.includes(index)) return;
            const td = document.createElement('td');
            let content = cell.replace(/"/g, "").trim() || "—";
            const low = content.toLowerCase();

            // Priority Logic (Heatmap)
            if (low.includes('crash') || low.includes('fatal') || low.includes('exploit')) {
                td.innerHTML = `<span class="bg-red-500/20 text-red-500 px-2 py-0.5 rounded text-[8px] font-black border border-red-500/50 mr-2">CRITICAL</span> ${content}`;
            } else if (low.includes('ui') || low.includes('typo') || low.includes('visual')) {
                td.innerHTML = `<span class="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-[8px] font-black border border-blue-500/50 mr-2">MINOR</span> ${content}`;
            } else {
                td.innerText = content;
            }

            td.className = "p-4 text-gray-400 text-sm min-w-[200px]";
            tr.appendChild(td);
        });

        const actionTd = document.createElement('td');
        actionTd.className = "p-4 text-center min-w-[200px]";
        actionTd.innerHTML = `
            <div class="flex flex-col gap-2 items-center">
                <div id="status-badge-${rowIndex}" class="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">Awaiting Action</div>
                <div class="flex gap-1 bg-black/20 p-1 rounded-lg border border-white/5">
                    <button onclick="updateStatus(${rowIndex}, 'wip')" class="px-3 py-1.5 rounded-md text-[9px] font-black uppercase text-gray-500 hover:text-orange-400">WIP</button>
                    <button onclick="updateStatus(${rowIndex}, 'fixed')" class="px-3 py-1.5 rounded-md text-[9px] font-black uppercase text-gray-500 hover:text-green-400">Fix</button>
                </div>
            </div>
        `;
        tr.appendChild(actionTd);
        tableBody.appendChild(tr);
    });
}

function filterTable() {
    const input = document.getElementById("searchInput").value.toLowerCase().trim();
    const rows = document.querySelectorAll("#table-body tr");
    rows.forEach(r => { r.style.backgroundColor = ""; r.classList.remove('animate-pulse'); });
    if (input === "") return;
    for (let row of rows) {
        if (row.textContent.toLowerCase().includes(input)) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            row.style.backgroundColor = "rgba(59, 130, 246, 0.3)";
            row.classList.add('animate-pulse');
            break;
        }
    }
}

function updateStatus(index, status) {
    const row = document.getElementById(`row-${index}`);
    const badge = document.getElementById(`status-badge-${index}`);
    const issueName = row.cells[0].innerText.replace('CRITICAL', '').replace('MINOR', '').trim();

    if (status === 'fixed') {
        row.style.backgroundColor = "rgba(34, 197, 94, 0.08)";
        row.style.borderLeft = "4px solid #22c55e";
        badge.innerHTML = `<span class="text-green-500">● Resolved</span>`;
        logActivity(`Closed Issue: ${issueName}`);
        stats.fixed++;
    } else {
        row.style.backgroundColor = "rgba(249, 115, 22, 0.08)";
        row.style.borderLeft = "4px solid #f97316";
        badge.innerHTML = `<span class="text-orange-500 animate-pulse">⚙ In Progress</span>`;
        logActivity(`In Progress: ${issueName}`);
        stats.wip++;
    }
    document.getElementById('stat-wip').innerText = stats.wip;
    document.getElementById('stat-fixed').innerText = stats.fixed;
}

function logActivity(text) {
    const feed = document.getElementById('activity-feed');
    const item = document.createElement('span');
    item.className = "feed-item whitespace-nowrap";
    item.innerText = `[${new Date().toLocaleTimeString()}] ${text}`;
    feed.prepend(item);
    if (feed.children.length > 3) feed.removeChild(feed.lastChild);
}

function displayGraph(rows) {
    document.getElementById('graph-wrapper').classList.remove('hidden');
    document.getElementById('table-wrapper').classList.add('hidden');
    const labels = []; const data = [];
    for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(',');
        if (cols[0] && !isNaN(cols[1])) { labels.push(cols[0].replace(/"/g, "")); data.push(parseInt(cols[1])); }
    }
    renderChart(labels, data);
}

function renderChart(labels, data) {
    const ctx = document.getElementById('statsChart').getContext('2d');
    if (currentChart) currentChart.destroy();
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, '#3b82f6'); gradient.addColorStop(1, 'rgba(30, 58, 138, 0.1)');
    currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ data: data, backgroundColor: gradient, borderRadius: 5, barThickness: 45 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: '#252a31' }, ticks: { color: '#64748b' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

// Init
updateGlobalStats();
switchSheet('overall');
