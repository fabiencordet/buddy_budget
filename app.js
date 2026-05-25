// Initialisation globale
let _supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
let transactions = [];
let selectedCategory = null; 

// Initialisation des données
async function initDashboard() {
    const { data } = await _supabase.from('transactions').select('*');
    transactions = data || [];
    buildMonthDropdown();
}

function calculateDashboardMetrics() {
    const activeMonth = document.getElementById('dashboard-month-select').value;
    const catTotals = {}; 
    const posteTotals = {};

    // Calcul des totaux par mois
    transactions.forEach(t => {
        const m = t.mois_affectation || (t.date ? t.date.substring(0, 7) : '');
        if(m === activeMonth) {
            const cat = (t.categorie || 'SANS').toUpperCase();
            const poste = (t.poste || 'AUTRE').toUpperCase();
            const amt = parseFloat(t.montant || 0);

            catTotals[cat] = (catTotals[cat] || 0) + amt;
            
            // On n'ajoute au poste que si la catégorie est sélectionnée ou aucune catégorie n'est sélectionnée
            if (!selectedCategory || selectedCategory === cat) {
                posteTotals[poste] = (posteTotals[poste] || 0) + amt;
            }
        }
    });

    // Rendu UI Catégories (Interactif)
    const catContainer = document.getElementById('categories-chart-container');
    catContainer.innerHTML = '';
    Object.keys(budgetStructure).forEach(cat => {
        const btn = document.createElement('div');
        btn.className = `p-3 rounded-lg border cursor-pointer transition ${selectedCategory === cat ? 'bg-indigo-600 text-white' : 'bg-white border-slate-200 hover:border-indigo-300'}`;
        btn.onclick = () => { 
            selectedCategory = (selectedCategory === cat) ? null : cat; 
            calculateDashboardMetrics(); 
        };
        btn.innerHTML = `<div class="text-[10px] uppercase font-bold">${cat}</div><div class="font-mono text-sm">${(catTotals[cat]||0).toFixed(2)} €</div>`;
        catContainer.appendChild(btn);
    });

    // Rendu UI Postes (Interactif)
    const posteContainer = document.getElementById('postes-chart-container');
    posteContainer.innerHTML = '';
    Object.keys(posteTotals).sort().forEach(p => {
        const row = document.createElement('div');
        row.className = "flex justify-between items-center p-2 bg-white border border-slate-100 rounded text-xs cursor-pointer hover:bg-slate-50";
        row.onclick = () => showPosteDetails(p, activeMonth);
        row.innerHTML = `<span class="uppercase">${p}</span><span class="font-mono font-bold">${posteTotals[p].toFixed(2)} €</span>`;
        posteContainer.appendChild(row);
    });
}

function showPosteDetails(poste, month) {
    const details = transactions.filter(t => t.poste.toUpperCase() === poste && (t.mois_affectation || t.date.substring(0,7)) === month);
    const content = document.getElementById('drawer-content');
    content.innerHTML = details.map(t => `
        <div class="flex justify-between py-2 border-b text-xs">
            <span>${t.description}</span>
            <span class="font-bold">${t.montant} €</span>
        </div>
    `).join('');
    document.getElementById('details-drawer-modal').classList.remove('hidden');
}

function closeDetailsDrawer() { document.getElementById('details-drawer-modal').classList.add('hidden'); }

// Lancement
initDashboard();
