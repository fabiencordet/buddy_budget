let _supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
let transactions = [];
let selectedCategory = null;
let selectedPoste = null;

const budgetStructure = {
    "ENTRÉES": {}, "PRÉLEVÈMENTS (FIXES)": {}, "ÉPARGNE": {}, "DÉPENSES QUOTIDIENNES": {}
};

// ... (Gardez ici vos fonctions d'initialisation, fetchTransactionsFromCloud, etc.)

function calculateDashboardMetrics() {
    const select = document.getElementById('dashboard-month-select');
    const activeMonth = select ? select.value : '';
    const catTotals = {}; const posteTotals = {};

    transactions.forEach(t => {
        const m = t.mois_affectation || getYearMonthString(t.date);
        if(m === activeMonth) {
            const c = (t.categorie || 'SANS').toUpperCase();
            catTotals[c] = (catTotals[c] || 0) + parseFloat(t.montant || 0);
            if (!selectedCategory || selectedCategory === c) {
                const p = (t.poste || 'AUTRE').toUpperCase();
                posteTotals[p] = (posteTotals[p] || 0) + parseFloat(t.montant || 0);
            }
        }
    });

    // Rendu Catégories
    const chartContainer = document.getElementById('categories-chart-container');
    chartContainer.innerHTML = '';
    Object.keys(budgetStructure).forEach(cat => {
        const item = document.createElement('div');
        item.className = `cursor-pointer p-2 rounded-lg border transition text-xs flex justify-between ${selectedCategory === cat ? 'bg-indigo-50 border-indigo-400' : 'bg-slate-50 border-slate-100'}`;
        item.onclick = () => { selectedCategory = (selectedCategory === cat) ? null : cat; selectedPoste = null; calculateDashboardMetrics(); };
        item.innerHTML = `<span>${cat}</span><b>${(catTotals[cat]||0).toFixed(2)} €</b>`;
        chartContainer.appendChild(item);
    });

    // Rendu Postes
    const postesContainer = document.getElementById('postes-chart-container');
    postesContainer.innerHTML = '';
    Object.keys(posteTotals).sort().forEach(p => {
        const item = document.createElement('div');
        item.className = "cursor-pointer hover:bg-slate-50 p-2 rounded border border-slate-100 text-xs flex justify-between";
        item.onclick = () => showPosteDetails(p, activeMonth);
        item.innerHTML = `<span>${p}</span><span class="font-mono">${(posteTotals[p]).toFixed(2)} €</span>`;
        postesContainer.appendChild(item);
    });
}

function showPosteDetails(poste, month) {
    const filtered = transactions.filter(t => t.poste === poste && (t.mois_affectation || getYearMonthString(t.date)) === month);
    const content = document.getElementById('drawer-content');
    content.innerHTML = filtered.map(t => `
        <div class="py-2 border-b text-xs flex justify-between">
            <span>${t.description}</span>
            <b class="${t.montant > 0 ? 'text-emerald-600' : 'text-slate-900'}">${t.montant} €</b>
        </div>
    `).join('');
    document.getElementById('details-drawer-modal').classList.remove('hidden');
}

function closeDetailsDrawer() { document.getElementById('details-drawer-modal').classList.add('hidden'); }

// ... (Gardez le reste de vos fonctions comme updateTrendChart, etc.)
