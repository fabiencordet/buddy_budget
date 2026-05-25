let _supabase;
try {
    if (typeof CONFIG !== 'undefined') {
        _supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    } else {
        console.error("⚠️ Alerte : Le fichier 'config.js' est introuvable ou illisible.");
    }
} catch (err) {
    console.error("⚠️ Échec d'initialisation Supabase :", err);
}

// RESTRICTION STRICTE AUX 4 CATÉGORIES
const budgetStructure = {
    "ENTRÉES": {
        "REVENUS FABIEN": ["Revenu principal", "chômage", "frais km", "Remboursement"],
        "REVENUS MARINA": ["Revenu secondaire", "Remboursement"],
        "CAF": ["Prestations familiales", "Remboursement"]
    },
    "PRÉLEVÈMENTS (FIXES)": {
        "BANQUE": ["SG", "Fortuneo", "Boursobank", "Remboursement"],
        "MÉNAGE ET URSSAF": ["Lina", "Remboursement"],
        "INVESTISSEMENT IMMO": ["SCI Lille", "Remboursement"],
        "ÉNERGIE": ["EAU", "GAZ", "ELECTRICITE", "Remboursement"],
        "TÉLÉCOM": ["SFR, Emile", "Free, Internet", "TV, Disney Plus", "TV, Netflix", "TV, Deezer", "SFR, Fabien perso", "SFR, Fabien pro", "Free, Mobile Marina", "Remboursement"],
        "ASSURANCES": ["Juridique", "Maison / Auto", "Prévoyance", "Mutuelle", "Remboursement"],
        "IMPÔTS": ["Fonciers", "Revenus", "Remboursement"],
        "MAISON": ["Emprunt principal", "Remboursement"],
        "CRÉDIT AUTO": ["5008", "Remboursement"],
        "LOA": ["EC3", "Remboursement"]
    },
    "ÉPARGNE": {
        "ÉPARGNE": ["Épargne, Ménage", "Épargne, Leonie", "Épargne, Emile", "Remboursement"]
    },
    "DÉPENSES QUOTIDIENNES": {
        "ALIMENTATION": ["Courses alimentaires", "Remboursement"],
        "ANIMAUX": ["Nourriture", "Vétérinaire", "Remboursement"],
        "VOITURE": ["FRAIS", "Carburant et parking", "Remboursement"],
        "SANTÉ": ["Spécialistes", "Médecin", "Pharmacie", "Labo", "Remboursement"],
        "CADEAUX": ["Événements / Fêtes", "Remboursement"],
        "SHOPPING": ["Amazon divers", "Vêtements", "MAISON et AUTRE", "Fournitures, Boulot", "Remboursement"],
        "LOISIRS": ["SORTIES", "Remboursement"],
        "CHÈQUES": ["Suivi chèques émis", "Remboursement"]
    }
};

let transactions = [];
let tempImportedTransactions = [];
let csvHeaders = [];
let csvRows = [];
let isHidePointedActive = false;

// Instance Chart.js globale
let trendChartInstance = null;

// Couleurs (Badges et Barres)
const categoryColorMap = {
    "ENTRÉES": "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    "PRÉLEVÈMENTS (FIXES)": "bg-rose-50 text-rose-700 border-rose-200/80",
    "ÉPARGNE": "bg-amber-50 text-amber-700 border-amber-200/80",
    "DÉPENSES QUOTIDIENNES": "bg-sky-50 text-sky-700 border-sky-200/80"
};
const barColorMap = {
    "ENTRÉES": "bg-emerald-500",
    "PRÉLEVÈMENTS (FIXES)": "bg-rose-500",
    "ÉPARGNE": "bg-amber-500",
    "DÉPENSES QUOTIDIENNES": "bg-sky-500"
};

function checkPassword() {
    if (typeof CONFIG !== 'undefined') { alert("❌ Fichier config manquant."); return; }
    if (document.getElementById('password-input').value === CONFIG.SECRET_PASSWORD) {
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('app-content').classList.remove('hidden');
        initApp();
    } else {
        document.getElementById('login-error').classList.remove('hidden');
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tabs-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => {
        el.classList.remove('bg-white', 'text-slate-900', 'shadow-xs');
        el.classList.add('text-slate-500', 'hover:text-slate-900');
    });
    document.getElementById(tabId).classList.add('active');
    document.getElementById('btn-' + tabId).classList.add('bg-white', 'text-slate-900', 'shadow-xs');
    if(tabId === 'tab-dashboard') buildMonthDropdown();
}

function initApp() {
    fetchTransactionsFromCloud();
    populateCategorieDropdown();
    populateFilterCategorieDropdown();
    document.getElementById('api-key-input').value = localStorage.getItem('gemini_api_key') || '';
}

function saveApiKey() {
    localStorage.setItem('gemini_api_key', document.getElementById('api-key-input').value.trim());
    alert("Clé mémorisée.");
}

function toggleImportZone() { document.getElementById('integrated-import-zone').classList.toggle('hidden'); }

async function fetchTransactionsFromCloud() {
    if (!_supabase) return;
    try {
        const { data, error } = await _supabase.from('transactions').select('*').order('date', { ascending: false });
        if (error) throw error;
        transactions = data || [];
        renderResponsiveTransactions();
        buildMonthDropdown();
        updateTrendChart(); // INITIALISE LE GRAPHIQUE
    } catch (err) { console.error(err); }
}

function getYearMonthString(dateStr) { 
    if(!dateStr || !dateStr.includes('-')) return ''; 
    const p = dateStr.split('-'); 
    return `${p[0]}-${p[1].padStart(2, '0')}`; 
}

function syncDefaultAffectationMonth() {
    const dateVal = document.getElementById('form-date').value;
    if(dateVal) document.getElementById('form-affectation').value = getYearMonthString(dateVal);
}

function toggleHidePointedFilter() {
    isHidePointedActive = !isHidePointedActive;
    const btn = document.getElementById('toggle-filter-pointed');
    const circle = document.getElementById('toggle-filter-circle');
    
    if (isHidePointedActive) {
        btn.classList.replace('bg-slate-200', 'bg-indigo-600');
        circle.classList.replace('translate-x-1', 'translate-x-6');
    } else {
        btn.classList.replace('bg-indigo-600', 'bg-slate-200');
        circle.classList.replace('translate-x-6', 'translate-x-1');
    }
    renderResponsiveTransactions();
}

async function togglePointage(index, event) {
    if(event) event.stopPropagation(); 
    const t = transactions[index];
    const nouveauStatut = !t.pointe;
    try {
        const { error } = await _supabase.from('transactions').update({ pointe: nouveauStatut }).eq('id', t.id);
        if(error) throw error;
        t.pointe = nouveauStatut;
        renderResponsiveTransactions();
        updateTrendChart();
    } catch(err) { alert("Erreur de mise à jour."); }
}

function renderResponsiveTransactions() {
    const pcTbody = document.getElementById('pc-table-body');
    const mobileContainer = document.getElementById('mobile-cards-container');
    const emptyState = document.getElementById('empty-state');

    pcTbody.innerHTML = ''; mobileContainer.innerHTML = '';

    const searchQuery = document.getElementById('search-input') ? document.getElementById('search-input').value.toLowerCase().trim() : '';
    const catFilter = document.getElementById('filter-categorie') ? document.getElementById('filter-categorie').value : '';
    // RÉCUPÉRATION DU NOUVEAU FILTRE POSTE AU LIEU DU POINTAGE
    const posteFilter = document.getElementById('filter-poste') ? document.getElementById('filter-poste').value : '';

    const filteredTransactions = transactions.filter(t => {
        if (isHidePointedActive && t.pointe) return false;
        const cleanCat = (t.categorie || '').toUpperCase().trim();
        const cleanPoste = (t.poste || '').toUpperCase().trim();
        const cleanDesc = (t.description || '').toLowerCase();
        
        const matchesSearch = !searchQuery || cleanPoste.toLowerCase().includes(searchQuery) || cleanDesc.includes(searchQuery);
        const matchesCat = !catFilter || cleanCat === catFilter.toUpperCase().trim();
        
        // CORRECTION DE LA LOGIQUE DE FILTRAGE SUR LES POSTES
        const matchesPoste = !posteFilter || cleanPoste === posteFilter.toUpperCase().trim();

        return matchesSearch && matchesCat && matchesPoste;
    });

    if (filteredTransactions.length === 0) { emptyState.classList.remove('hidden'); return; }
    emptyState.classList.add('hidden');

    filteredTransactions.forEach((t) => {
        const index = transactions.indexOf(t); 
        const cleanCat = (t.categorie || '').toUpperCase().trim();
        const currentBadgeStyle = categoryColorMap[cleanCat] || "bg-slate-100 text-slate-700";
        
        const rawMontant = parseFloat(t.montant) || 0;
        const mColor = rawMontant > 0 ? "text-emerald-600 font-semibold" : "text-slate-800 font-medium";
        const mText = (rawMontant > 0 ? "+" : "") + rawMontant.toFixed(2) + " €";
        const finalAffectation = t.mois_affectation || getYearMonthString(t.date);
        const rowBgClass = t.pointe ? "bg-white text-slate-500 opacity-85 hover:opacity-100" : "bg-white text-slate-900 font-medium";

        const pointageButtonHTML = `<button onclick="togglePointage(${index}, event)" class="group inline-flex items-center justify-center p-1.5 rounded-full transition focus:outline-none" title="${t.pointe ? 'En attente' : 'Valider'}">${t.pointe ? `<svg class="w-5 h-5 text-emerald-500 scale-110 transition-transform group-hover:scale-125" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l5-5z" clip-rule="evenodd"></path></svg>` : `<svg class="w-5 h-5 text-slate-300 transition-colors group-hover:text-slate-400 group-hover:scale-105" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle></svg>`}</button>`;

        // Desktop
        const tr = document.createElement('tr');
        tr.className = `${rowBgClass} transition-colors border-b border-slate-100 hover:bg-slate-50/60 cursor-pointer`;
        tr.onclick = () => openDetailsDrawer(index);
        tr.innerHTML = `
            <td class="p-3 text-center">${pointageButtonHTML}</td>
            <td class="p-3 font-mono text-[11px] text-slate-400">${t.date}</td>
            <td class="p-3 font-medium text-slate-400">${finalAffectation}</td>
            <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${currentBadgeStyle}">${t.categorie || 'SANS'}</span></td>
            <td class="p-3 font-semibold uppercase text-[11px]">${t.poste || ''}</td>
            <td class="p-3 truncate max-w-[140px] ${t.pointe ? 'line-through' : ''}">${t.description || ''}</td>
            <td class="p-3 truncate max-w-[120px] text-slate-400 italic text-[11px]">${t.details || ''}</td>
            <td class="p-3 text-right ${mColor}">${mText}</td>
            <td class="p-3 text-center"><button onclick="event.stopPropagation(); openTransactionModal(${index})" class="text-indigo-600 font-medium text-[11px] mr-2">Éditer</button><button onclick="event.stopPropagation(); deleteTransaction(${index})" class="text-rose-600 font-medium text-[11px]">Suppr.</button></td>
        `;
        pcTbody.appendChild(tr);

        // Mobile
        const card = document.createElement('div');
        card.className = `p-4 flex items-center justify-between gap-3 ${t.pointe ? 'bg-slate-50/50' : 'bg-white'} hover:bg-slate-50 cursor-pointer`;
        card.onclick = () => openDetailsDrawer(index);
        card.innerHTML = `
            <div class="flex items-center gap-3 min-w-0">
                <div class="shrink-0">${pointageButtonHTML}</div>
                <div class="min-w-0 space-y-1">
                    <div class="flex items-center gap-2 flex-wrap"><span class="text-[10px] font-mono text-slate-400">${t.date}</span><span class="px-1.5 py-0.5 rounded text-[9px] uppercase border ${currentBadgeStyle}">${t.categorie || 'SANS'}</span></div>
                    <h4 class="text-xs font-bold uppercase truncate">${t.poste || ''} : <span class="font-normal normal-case text-slate-600 ${t.pointe ? 'line-through' : ''}">${t.description || ''}</span></h4>
                </div>
            </div>
            <div class="text-right shrink-0"><div class="text-xs font-bold ${mColor}">${mText}</div><span class="text-[9px] font-medium text-slate-400">${finalAffectation}</span></div>
        `;
        mobileContainer.appendChild(card);
    });
}

function populateCategorieDropdown() {
    const formCat = document.getElementById('form-categorie');
    if(!formCat) return; formCat.innerHTML = '';
    Object.keys(budgetStructure).forEach(cat => { formCat.appendChild(new Option(cat, cat)); });
    updatePosteDropdown();
}

function populateFilterCategorieDropdown() {
    const filterCat = document.getElementById('filter-categorie');
    if(!filterCat) return; filterCat.innerHTML = '<option value="">📁 Toutes catégories</option>';
    Object.keys(budgetStructure).forEach(cat => { filterCat.appendChild(new Option(cat, cat)); });
    // DÉCLENCHE ÉGALEMENT LA MISE À JOUR DE LA LISTE DES POSTES FILTRÉS
    updateFilterPosteDropdown();
}

// NOUVELLE FONCTION POUR REMPLIR LE DROPDOWN DES POSTES DANS LE FILTRE DE RECHERCHE
function updateFilterPosteDropdown() {
    const filterCatVal = document.getElementById('filter-categorie').value;
    const filterPoste = document.getElementById('filter-poste');
    if(!filterPoste) return;
    
    filterPoste.innerHTML = '<option value="">📋 Tout les postes</option>';
    
    if(filterCatVal && budgetStructure[filterCatVal]) {
        // Si une catégorie est choisie, on affiche ses postes
        Object.keys(budgetStructure[filterCatVal]).forEach(poste => {
            filterPoste.appendChild(new Option(poste, poste));
        });
    } else {
        // Si aucune catégorie n'est choisie, on liste la totalité des postes disponibles globalement
        const tousLesPostes = new Set();
        Object.values(budgetStructure).forEach(postesObj => {
            Object.keys(postesObj).forEach(poste => tousLesPostes.add(poste));
        });
        tousLesPostes.forEach(poste => {
            filterPoste.appendChild(new Option(poste, ...[poste]));
        });
    }
    // Relance le filtrage après changement
    renderResponsiveTransactions();
}

function updatePosteDropdown() {
    const cat = document.getElementById('form-categorie').value;
    const formPoste = document.getElementById('form-poste');
    if(!formPoste || !cat || !budgetStructure[cat]) return; formPoste.innerHTML = '';
    Object.keys(budgetStructure[cat]).forEach(poste => { formPoste.appendChild(new Option(poste, poste)); });
    updateDescriptionDropdown();
}

function updateDescriptionDropdown() {
    const cat = document.getElementById('form-categorie').value;
    const poste = document.getElementById('form-poste').value;
    const formDesc = document.getElementById('form-description');
    if(!formDesc || !cat || !poste || !budgetStructure[cat][poste]) return; formDesc.innerHTML = '';
    budgetStructure[cat][poste].forEach(desc => { formDesc.appendChild(new Option(desc, desc)); });
}

function openTransactionModal(index = null) {
    populateCategorieDropdown();
    const modal = document.getElementById('transaction-modal');
    document.getElementById('transaction-form').reset();
    
    if(index !== null) {
        const t = transactions[index];
        document.getElementById('modal-title').textContent = "Éditer l'écriture";
        document.getElementById('edit-index').value = index;
        document.getElementById('edit-db-id').value = t.id || '';
        document.getElementById('form-date').value = t.date || '';
        document.getElementById('form-affectation').value = t.mois_affectation || getYearMonthString(t.date);
        document.getElementById('form-categorie').value = t.categorie || '';
        updatePosteDropdown();
        document.getElementById('form-poste').value = t.poste || '';
        updateDescriptionDropdown();
        document.getElementById('form-description').value = t.description || '';
        document.getElementById('form-details').value = t.details || '';
        document.getElementById('form-montant').value = t.montant || '';
    } else {
        document.getElementById('modal-title').textContent = "Nouvelle écriture";
        document.getElementById('edit-index').value = '';
        document.getElementById('edit-db-id').value = '';
        document.getElementById('form-date').value = new Date().toISOString().split('T')[0];
        syncDefaultAffectationMonth();
    }
    modal.classList.remove('hidden');
}

function closeTransactionModal() { document.getElementById('transaction-modal').classList.add('hidden'); }

async function saveTransaction(e) {
    e.preventDefault();
    const idx = document.getElementById('edit-index').value;
    const dbId = document.getElementById('edit-db-id').value;
    const payload = {
        date: document.getElementById('form-date').value,
        mois_affectation: document.getElementById('form-affectation').value,
        categorie: document.getElementById('form-categorie').value,
        poste: document.getElementById('form-poste').value,
        description: document.getElementById('form-description').value,
        details: document.getElementById('form-details').value.trim(),
        montant: parseFloat(document.getElementById('form-montant').value) || 0,
        pointe: idx !== '' ? transactions[idx].pointe : false
    };

    try {
        if(dbId) await _supabase.from('transactions').update(payload).eq('id', dbId);
        else await _supabase.from('transactions').insert([payload]);
        closeTransactionModal();
        fetchTransactionsFromCloud();
    } catch(err) { alert("Erreur BDD."); }
}

async function deleteTransaction(index) {
    if(!confirm("Supprimer définitivement ?")) return;
    try {
        await _supabase.from('transactions').delete().eq('id', transactions[index].id);
        fetchTransactionsFromCloud();
    } catch(err) { alert("Erreur."); }
}

function openDetailsDrawer(index) {
    const t = transactions[index];
    document.getElementById('drawer-pointage-status').className = t.pointe ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold";
    document.getElementById('drawer-pointage-status').textContent = t.pointe ? "🟢 Vérifiée" : "⚪ En attente";
    document.getElementById('drawer-date').textContent = t.date;
    document.getElementById('drawer-affectation').textContent = t.mois_affectation || getYearMonthString(t.date);
    document.getElementById('drawer-categorie').textContent = t.categorie || '-';
    document.getElementById('drawer-poste').textContent = t.poste || '-';
    document.getElementById('drawer-description').textContent = t.description || '-';
    document.getElementById('drawer-montant').textContent = t.montant + " €";
    document.getElementById('drawer-actions-container').innerHTML = `<button onclick="closeDetailsDrawer(); openTransactionModal(${index})" class="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition">Modifier</button><button onclick="closeDetailsDrawer(); deleteTransaction(${index})" class="py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium rounded-lg transition">Supprimer</button>`;
    document.getElementById('details-drawer-modal').classList.remove('hidden');
}

function closeDetailsDrawer() { document.getElementById('details-drawer-modal').classList.add('hidden'); }

function buildMonthDropdown() {
    const select = document.getElementById('dashboard-month-select');
    if(!select) return;
    const months = [...new Set(transactions.map(t => t.mois_affectation || getYearMonthString(t.date)))].sort().reverse();
    select.innerHTML = '';
    months.forEach(m => { select.appendChild(new Option("PÉRIODE : " + m, m)); });
    calculateDashboardMetrics();
}

function navigateMonth(direction) {
    const select = document.getElementById('dashboard-month-select');
    if(!select || select.options.length <= 1) return;
    let newIdx = select.selectedIndex - direction;
    if(newIdx >= 0 && newIdx < select.options.length) { select.selectedIndex = newIdx; calculateDashboardMetrics(); }
}

// ----------------------------------------------------------------------
// LE GRAPHIQUE PRINCIPAL DES TENDANCES (CHART.JS)
// ----------------------------------------------------------------------
function formatMonthFrShort(periodStr) {
    if(!periodStr || !periodStr.includes('-')) return periodStr;
    const [year, month] = periodStr.split('-');
    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    return `${monthNames[parseInt(month) - 1]} ${year.substring(2)}`;
}

function updateTrendChart() {
    const canvas = document.getElementById('dashboard-trend-chart');
    if (!canvas) return;

    const monthlyData = {};

    transactions.forEach(t => {
        const m = t.mois_affectation || getYearMonthString(t.date);
        if (!m) return;
        if (!monthlyData[m]) monthlyData[m] = { entrees: 0, depenses: 0 };

        const amt = parseFloat(t.montant) || 0;
        if (amt > 0) {
            monthlyData[m].entrees += amt;
        } else {
            monthlyData[m].depenses += Math.abs(amt);
        }
    });

    const sortedMonths = Object.keys(monthlyData).sort(); 
    const labels = sortedMonths.map(m => formatMonthFrShort(m));
    const dataEntrees = sortedMonths.map(m => monthlyData[m].entrees);
    const dataDepenses = sortedMonths.map(m => monthlyData[m].depenses);
    const dataSoldes = sortedMonths.map(m => monthlyData[m].entrees - monthlyData[m].depenses);

    if (trendChartInstance) { trendChartInstance.destroy(); }

    const ctx = canvas.getContext('2d');
    trendChartInstance = new Chart(ctx, {
        data: {
            labels: labels,
            datasets: [
                {
                    type: 'line',
                    label: 'Solde',
                    data: dataSoldes,
                    borderColor: '#3b82f6',
                    backgroundColor: '#3b82f6',
                    borderWidth: 3,
                    tension: 0.3,
                    pointRadius: 4,
                    order: 1
                },
                {
                    type: 'bar',
                    label: 'Entrées',
                    data: dataEntrees,
                    backgroundColor: '#10b981',
                    borderRadius: 4,
                    maxBarThickness: 40,
                    order: 2
                },
                {
                    type: 'bar',
                    label: 'Dépenses',
                    data: dataDepenses,
                    backgroundColor: '#f43f5e',
                    borderRadius: 4,
                    maxBarThickness: 40,
                    order: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11, family: 'sans-serif' } } },
                tooltip: { callbacks: { label: function(ctx) { return ` ${ctx.dataset.label}: ${ctx.raw.toFixed(2)} €`; } } }
            },
            scales: {
                x: { grid: { display: false } },
                y: { grid: { color: '#f1f5f9' }, ticks: { callback: function(val) { return val + ' €'; } } }
            }
        }
    });
}

// ----------------------------------------------------------------------
// LES JAUGES (BARRES DE PROGRESSION)
// ----------------------------------------------------------------------
function calculateDashboardMetrics() {
    const select = document.getElementById('dashboard-month-select');
    const activeMonth = select ? select.value : '';
    const catTotals = {}; const posteTotals = {};

    transactions.forEach(t => {
        const m = t.mois_affectation || getYearMonthString(t.date);
        if(m === activeMonth) {
            const amt = parseFloat(t.montant) || 0;
            const c = (t.categorie || 'NON CLASSÉ').toUpperCase();
            catTotals[c] = (catTotals[c] || 0) + amt;
            const p = (t.poste || 'AUTRE').toUpperCase();
            posteTotals[p] = (posteTotals[p] || 0) + amt;
        }
    });

    const chartContainer = document.getElementById('categories-chart-container');
    if(chartContainer) {
        chartContainer.innerHTML = '';
        const maxCatVal = Math.max(...Object.values(catTotals).map(v => Math.abs(v)), 1);
        Object.keys(budgetStructure).forEach(cat => {
            const totalVal = catTotals[cat] || 0;
            const percentage = (Math.abs(totalVal) / maxCatVal) * 100;
            const colorClasses = categoryColorMap[cat] || "bg-slate-100 text-slate-700";
            const barColor = barColorMap[cat] || "bg-slate-400";
            
            const item = document.createElement('div');
            item.className = "space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs";
            item.innerHTML = `
                <div class="flex items-center justify-between mb-1"><span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${colorClasses}">${cat}</span><b class="font-mono text-slate-700">${totalVal.toFixed(2)} €</b></div>
                <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden"><div class="${barColor} h-full rounded-full transition-all duration-500" style="width: ${percentage}%"></div></div>
            `;
            chartContainer.appendChild(item);
        });
    }

    const postesContainer = document.getElementById('postes-chart-container');
    if(postesContainer) {
        postesContainer.innerHTML = '';
        const sortedPostes = Object.keys(posteTotals).sort((a,b) => Math.abs(posteTotals[b]) - Math.abs(posteTotals[a]));
        const maxPosteVal = Math.max(...Object.values(posteTotals).map(v => Math.abs(v)), 1);

        if (sortedPostes.length === 0) { postesContainer.innerHTML = '<div class="text-xs text-slate-400 italic text-center py-4">Aucune opération détectée.</div>'; } 
        else {
            sortedPostes.forEach(p => {
                const totalVal = posteTotals[p] || 0;
                const percentage = (Math.abs(totalVal) / maxPosteVal) * 100;
                
                let parentCat = "DÉPENSES QUOTIDIENNES";
                for (const [catName, postesObj] of Object.entries(budgetStructure)) {
                    if (postesObj[p]) { parentCat = catName; break; }
                }
                const barColor = barColorMap[parentCat] || "bg-slate-400";

                const item = document.createElement('div');
                item.className = "space-y-1 py-1.5";
                item.innerHTML = `
                    <div class="flex items-center justify-between text-[11px]"><span class="font-semibold text-slate-600 uppercase truncate max-w-[70%]">${p}</span><span class="font-mono text-slate-500">${totalVal.toFixed(2)} €</span></div>
                    <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div class="${barColor} h-full rounded-full transition-all duration-500" style="width: ${percentage}%"></div></div>
                `;
                postesContainer.appendChild(item);
            });
        }
    }
}

// Stubs CSV/IA
function parseCSV() { console.log("Analyse CSV..."); }
function processCSVLines() { console.log("Traitement IA..."); }
function saveImportedTransactions() { console.log("Sauvegarde..."); }
