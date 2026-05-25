// Variable d'état globale
let selectedCategory = null;

// Fonction de calcul et rendu du Dashboard (à mettre à jour dans app.js)
function calculateDashboardMetrics() {
    const select = document.getElementById('dashboard-month-select');
    const activeMonth = select ? select.value : '';
    const catTotals = {}; 
    const posteTotals = {};

    transactions.forEach(t => {
        const m = t.mois_affectation || getYearMonthString(t.date);
        if(m === activeMonth) {
            const amt = parseFloat(t.montant) || 0;
            const c = (t.categorie || 'NON CLASSÉ').toUpperCase();
            catTotals[c] = (catTotals[c] || 0) + amt;

            // Filtrage : si une catégorie est sélectionnée, on ne prend que ses postes
            if (!selectedCategory || selectedCategory === c) {
                const p = (t.poste || 'AUTRE').toUpperCase();
                posteTotals[p] = (posteTotals[p] || 0) + amt;
            }
        }
    });

    // 1. Rendu interactif des Catégories
    const chartContainer = document.getElementById('categories-chart-container');
    if(chartContainer) {
        chartContainer.innerHTML = '';
        Object.keys(budgetStructure).forEach(cat => {
            const totalVal = catTotals[cat] || 0;
            const item = document.createElement('div');
            item.className = `cursor-pointer p-2 rounded-lg border transition text-xs ${selectedCategory === cat ? 'bg-indigo-50 border-indigo-400' : 'bg-slate-50 border-slate-100'}`;
            item.onclick = () => { 
                selectedCategory = (selectedCategory === cat) ? null : cat; 
                calculateDashboardMetrics(); 
            };
            item.innerHTML = `<div class="flex justify-between font-bold uppercase"><span>${cat}</span><span>${totalVal.toFixed(2)} €</span></div>`;
            chartContainer.appendChild(item);
        });
    }

    // 2. Rendu interactif des Postes (Détail)
    const postesContainer = document.getElementById('postes-chart-container');
    if(postesContainer) {
        postesContainer.innerHTML = '';
        Object.keys(posteTotals).sort().forEach(p => {
            const totalVal = posteTotals[p] || 0;
            const item = document.createElement('div');
            item.className = "flex justify-between items-center p-2 bg-white border border-slate-100 rounded text-xs cursor-pointer hover:border-slate-300";
            item.onclick = () => showPosteDetails(p, activeMonth);
            item.innerHTML = `<span class="uppercase font-semibold">${p}</span><span class="font-mono">${totalVal.toFixed(2)} €</span>`;
            postesContainer.appendChild(item);
        });
    }
}

// Nouvelle fonction pour afficher le détail dans une modale
function showPosteDetails(poste, month) {
    const details = transactions.filter(t => t.poste.toUpperCase() === poste && (t.mois_affectation || getYearMonthString(t.date)) === month);
    
    // Assurez-vous d'avoir un élément "drawer-content" dans votre index.html
    const drawer = document.getElementById('drawer-content');
    if(drawer) {
        drawer.innerHTML = details.map(t => `
            <div class="flex justify-between py-2 border-b text-xs">
                <span>${t.description}</span>
                <b class="${t.montant > 0 ? 'text-emerald-600' : 'text-slate-900'}">${t.montant} €</b>
            </div>
        `).join('');
        document.getElementById('details-drawer-modal').classList.remove('hidden');
    }
}

function closeDetailsDrawer() {
    document.getElementById('details-drawer-modal').classList.add('hidden');
}
