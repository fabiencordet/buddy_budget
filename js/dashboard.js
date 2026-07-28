/**
 * dashboard.js
 * Dashboard principal : KPIs, graphique mensuel, filtres, panneaux
 * Catégories / Postes / Descriptions, navigation entre mois.
 */

// ── Filtres dashboard ────────────────────────────────────
function getDashFiltersRaw() {
    return {
        cat:   document.getElementById('dash-filter-categorie')?.value  || '',
        poste: document.getElementById('dash-filter-poste')?.value      || '',
        desc:  document.getElementById('dash-filter-description')?.value || ''
    };
}
function dashFiltersActive() {
    const f = getDashFiltersRaw();
    return f.cat !== '' || f.poste !== '' || f.desc !== '';
}
function transactionPassesDashFilters(t) {
    if (t.exclu_dashboard) return false;
    const f = getDashFiltersRaw();
    if (f.cat   && (t.categorie  ||'').toUpperCase().trim() !== f.cat.toUpperCase().trim())  return false;
    if (f.poste && (t.poste      ||'').toUpperCase().trim() !== f.poste.toUpperCase().trim()) return false;
    if (f.desc  && (t.description||'') !== f.desc) return false;
    return true;
}

function populateDashFilterCategories() {
    const sel = document.getElementById('dash-filter-categorie');
    if (!sel) return;
    sel.innerHTML = '<option value="">📁 Toutes catégories</option>';
    Object.keys(budgetStructure).forEach(cat => {
        const o = document.createElement('option');
        o.value = cat; o.textContent = cat;
        sel.appendChild(o);
    });
}
function populateDashFilterPostes() {
    const catVal = document.getElementById('dash-filter-categorie').value;
    const ps = document.getElementById('dash-filter-poste');
    const ds = document.getElementById('dash-filter-description');
    ps.innerHTML = '<option value="">🏷️ Tous postes</option>';
    ds.innerHTML = '<option value="">📝 Toutes descriptions</option>';
    const postes = catVal && budgetStructure[catVal]
        ? Object.keys(budgetStructure[catVal])
        : [...new Set(Object.values(budgetStructure).flatMap(c => Object.keys(c)))].sort();
    postes.forEach(p => {
        const o = document.createElement('option');
        o.value = p; o.textContent = p;
        ps.appendChild(o);
    });
}
function populateDashFilterDescriptions() {
    const catVal   = document.getElementById('dash-filter-categorie').value;
    const posteVal = document.getElementById('dash-filter-poste').value;
    const ds = document.getElementById('dash-filter-description');
    ds.innerHTML = '<option value="">📝 Toutes descriptions</option>';
    if (catVal && posteVal && budgetStructure[catVal]?.[posteVal]) {
        budgetStructure[catVal][posteVal].forEach(d => {
            const o = document.createElement('option');
            o.value = d; o.textContent = d;
            ds.appendChild(o);
        });
    }
}

function applyDashboardFilters() {
    updateDashPills();
    updateKpiSoldeVisibility();
    calculateDashboardMetrics();
    renderMainBudgetChart();
}
function resetDashboardFilters() {
    document.getElementById('dash-filter-categorie').value = '';
    populateDashFilterPostes();
    applyDashboardFilters();
}
function updateKpiSoldeVisibility() {
    const card = document.getElementById('kpi-solde-card');
    if (card) card.style.display = dashFiltersActive() ? 'none' : '';
}
function updateDashPills() {
    const f = getDashFiltersRaw();
    const active = !!(f.cat || f.poste || f.desc);
    document.getElementById('dash-active-filter-indicator').classList.toggle('hidden', !active);
    ['cat','poste','desc'].forEach(k => {
        const el = document.getElementById(`dash-filter-pill-${k}`);
        const icons = { cat:'📁 ', poste:'🏷️ ', desc:'📝 ' };
        el.classList.toggle('hidden', !f[k]);
        if (f[k]) el.textContent = icons[k] + f[k];
    });
    const badge = document.getElementById('chart-filter-badge');
    if (active) {
        badge.textContent = '⚡ ' + [f.cat,f.poste,f.desc].filter(Boolean).join(' › ');
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

// ── Graphique mensuel ────────────────────────────────────
function renderMainBudgetChart() {
    const ctx = document.getElementById('mainBudgetChart');
    if (!ctx) return;

    const catVal   = document.getElementById('dash-filter-categorie')?.value  || '';
    const posteVal = document.getElementById('dash-filter-poste')?.value      || '';
    const descVal  = document.getElementById('dash-filter-description')?.value || '';
    const showSolde = (catVal === '' && posteVal === '' && descVal === '');

    const now = new Date();
    const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

    const monthlyData = {};
    transactions.forEach(t => {
        if (!transactionPassesDashFilters(t)) return;
        const m = t.mois_affectation || getYearMonthString(t.date);
        if (!m) return;
        if (!monthlyData[m]) monthlyData[m] = { entrees: 0, depenses: 0 };
        const amt = parseFloat(t.montant) || 0;
        if (amt > 0) monthlyData[m].entrees  += amt;
        else         monthlyData[m].depenses += Math.abs(amt);
    });

    const months = Object.keys(monthlyData).sort();

    // Budget restant pour le mois en cours
    let budgetRestant = 0;
    if (budgetLines.length && months.includes(currentMonth)) {
        const spentByDesc = {};
        transactions.forEach(t => {
            if (t.exclu_dashboard) return;
            const m = t.mois_affectation || getYearMonthString(t.date);
            if (m !== currentMonth) return;
            const amt = parseFloat(t.montant) || 0;
            if (amt >= 0) return;
            const k = (t.poste||'').toUpperCase().trim() + '||' + (t.description||'').toUpperCase().trim();
            spentByDesc[k] = (spentByDesc[k] || 0) + Math.abs(amt);
        });
        budgetLines.forEach(b => {
            const spent = spentByDesc[b.key] || 0;
            const reste = b.amount - spent;
            if (reste > 0) budgetRestant += reste;
        });
    }

    const datasets = [
        { label:'Entrées',  data:months.map(m => monthlyData[m].entrees),  backgroundColor:'rgba(16,185,129,.85)', borderRadius:6, order:2 },
        { label:'Dépenses', data:months.map(m => monthlyData[m].depenses), backgroundColor:'rgba(244,63,94,.80)',  borderRadius:6, order:2 }
    ];

    if (budgetRestant > 0 && months.includes(currentMonth)) {
        datasets.push({
            label: 'Budget restant prévu',
            data: months.map(m => m === currentMonth ? budgetRestant : 0),
            backgroundColor: 'rgba(251,146,60,.75)',
            borderRadius: 6, order: 2, stack: 'depenses'
        });
        datasets[1].stack = 'depenses';
    }

    if (showSolde) {
        datasets.unshift({
            label:'Solde', type:'line',
            data:months.map(m => monthlyData[m].entrees - monthlyData[m].depenses),
            borderColor:'#0f172a', backgroundColor:'#0f172a',
            borderWidth:2, tension:0.4, fill:false,
            pointRadius:4, pointBackgroundColor:'#fff', pointBorderWidth:2, order:1
        });
    }

    if (budgetChartInstance) { budgetChartInstance.destroy(); budgetChartInstance = null; }
    budgetChartInstance = new Chart(ctx, {
        type:'bar', data:{ labels:months, datasets },
        options:{
            responsive:true, maintainAspectRatio:false,
            plugins:{
                legend:{ labels:{ font:{ size:10,family:'DM Sans' }, padding:14, usePointStyle:true } },
                tooltip:{
                    bodyFont:{ size:11,family:'DM Mono' }, titleFont:{ size:10 }, padding:10, cornerRadius:10,
                    callbacks:{ label: ctx => { const v = ctx.raw; if (!v) return null; return ' ' + ctx.dataset.label + ' : ' + v.toFixed(2).replace('.', ',') + ' €'; } }
                }
            },
            scales:{
                y:{ beginAtZero:true, ticks:{ font:{size:9}, callback:v=>v.toLocaleString('fr')+' €' }, grid:{ color:'#f1f5f9' }, border:{ dash:[3,3] } },
                x:{ ticks:{ font:{size:9} }, grid:{ display:false } }
            }
        }
    });
}

// ── KPIs et panneaux ─────────────────────────────────────
function refreshDashboard() { calculateDashboardMetrics(); }

function renderPanel(container, totals, colorFn, filterSelId, onClickFn) {
    if (!container) return;
    container.innerHTML = '';
    const sorted = Object.keys(totals).sort((a,b) => Math.abs(totals[b]) - Math.abs(totals[a]));
    if (!sorted.length) {
        container.innerHTML = '<p class="text-xs text-slate-400 italic text-center py-4">Aucune donnée.</p>';
        return;
    }
    const maxAbs = Math.max(...sorted.map(k => Math.abs(totals[k])), 1);
    const activeVal = filterSelId ? (document.getElementById(filterSelId)?.value || '') : '';
    sorted.forEach(key => {
        const v    = totals[key];
        const pct  = Math.round(Math.abs(v) / maxAbs * 100);
        const col  = v < 0 ? '#f43f5e' : (v > 0 ? '#10b981' : '#94a3b8');
        const barC = colorFn ? colorFn(key, v) : (v < 0 ? '#fecdd3' : '#a7f3d0');
        const sign = v > 0 ? '+' : '';
        const isSelected = filterSelId && activeVal === key;
        const item = document.createElement('div');
        item.className = 'space-y-1 rounded-xl px-2 py-1.5 transition ' + (filterSelId ? 'cursor-pointer ' : '') + (isSelected ? 'ring-2 ring-indigo-300 bg-indigo-50/60' : (filterSelId ? 'hover:bg-slate-50' : ''));
        if (filterSelId) item.title = isSelected ? 'Cliquer pour retirer le filtre' : ('Filtrer sur ' + key);
        item.innerHTML = `
            <div class="flex items-center justify-between gap-2">
                <span class="text-[11px] font-semibold text-slate-600 uppercase tracking-tight truncate">${key}</span>
                <span class="text-[11px] font-bold mono shrink-0" style="color:${col}">${v !== 0 ? sign + fmt(v) : '—'}</span>
            </div>
            <div class="prog-track"><div class="prog-fill" style="width:${pct}%;background:${barC}"></div></div>`;
        if (filterSelId && onClickFn) item.addEventListener('click', () => onClickFn(key, isSelected));
        container.appendChild(item);
    });
}

function calculateDashboardMetrics() {
    const activeMonth = document.getElementById('dashboard-month-select')?.value || '';
    const catTotals = {}, posteTotals = {}, descTotals = {};
    let totalIn = 0, totalOut = 0;

    transactions.forEach(t => {
        if (!transactionPassesDashFilters(t)) return;
        const m = t.mois_affectation || getYearMonthString(t.date);
        if (m !== activeMonth) return;
        const amt = parseFloat(t.montant) || 0;
        const cat = (t.categorie || 'NON CLASSÉ').toUpperCase().trim();
        if (amt > 0) totalIn  += amt;
        else         totalOut += Math.abs(amt);
        catTotals[cat] = (catTotals[cat] || 0) + amt;
        const poste = (t.poste || 'AUTRE').toUpperCase().trim();
        posteTotals[poste] = (posteTotals[poste] || 0) + amt;
        const desc = t.description || '—';
        descTotals[desc] = (descTotals[desc] || 0) + amt;
    });

    document.getElementById('kpi-entrees').textContent  = fmt(totalIn);
    document.getElementById('kpi-depenses').textContent = fmt(totalOut);
    const solde = totalIn - totalOut;
    document.getElementById('kpi-solde').textContent = (solde >= 0 ? '+' : '') + fmt(solde);
    const sc = document.getElementById('kpi-solde-card');
    if (sc) sc.className = `kpi ${solde >= 0 ? 'kpi-bal-pos' : 'kpi-bal-neg'}`;
    document.getElementById('kpi-solde').style.color = solde >= 0 ? '#1d4ed8' : '#b45309';

    const monthLabel = document.getElementById('cat-month-label');
    if (monthLabel) monthLabel.textContent = activeMonth;

    // Panel Catégories
    const catContainer = document.getElementById('categories-chart-container');
    if (catContainer) {
        catContainer.innerHTML = '';
        const fCat = getDashFiltersRaw().cat.toUpperCase().trim();
        const catsToShow = fCat && budgetStructure[fCat] ? [fCat] : Object.keys(budgetStructure);
        const maxAbs = Math.max(...catsToShow.map(c => Math.abs(catTotals[c] || 0)), 1);
        catsToShow.forEach(cat => {
            const v         = catTotals[cat] || 0;
            const pct       = Math.round(Math.abs(v) / maxAbs * 100);
            const badgeClass = categoryBadgeClass[cat] || 'badge badge-default';
            const barColor  = categoryBarColor[cat] || '#94a3b8';
            const valColor  = v < 0 ? '#f43f5e' : (v > 0 ? '#10b981' : '#94a3b8');
            const sign      = v > 0 ? '+' : '';
            const isSelected = fCat === cat.toUpperCase().trim();
            const item = document.createElement('div');
            item.className = 'space-y-1.5 rounded-xl px-2 py-1.5 transition cursor-pointer ' + (isSelected ? 'ring-2 ring-indigo-300 bg-indigo-50/60' : 'hover:bg-slate-50');
            item.title = isSelected ? 'Cliquer pour retirer le filtre' : `Filtrer sur ${cat}`;
            item.innerHTML = `
                <div class="flex items-center justify-between gap-2">
                    <span class="${badgeClass}">${cat}</span>
                    <span class="text-xs font-bold mono" style="color:${valColor}">${v !== 0 ? sign+fmt(v) : '—'}</span>
                </div>
                <div class="prog-track"><div class="prog-fill" style="width:${pct}%;background:${barColor}"></div></div>`;
            item.addEventListener('click', () => {
                const sel = document.getElementById('dash-filter-categorie');
                if (!sel) return;
                sel.value = isSelected ? '' : cat;
                populateDashFilterPostes();
                applyDashboardFilters();
            });
            catContainer.appendChild(item);
        });
    }

    // Panel Postes
    renderPanel(
        document.getElementById('postes-chart-container'),
        posteTotals,
        (key, v) => v < 0 ? '#fecdd3' : '#a7f3d0',
        'dash-filter-poste',
        (key, isSelected) => {
            const sel = document.getElementById('dash-filter-poste');
            if (!sel) return;
            sel.value = isSelected ? '' : key;
            populateDashFilterDescriptions();
            applyDashboardFilters();
        }
    );

    // Panel Descriptions
    renderPanel(
        document.getElementById('descriptions-chart-container'),
        descTotals,
        (key, v) => v < 0 ? '#fce7f3' : '#d1fae5',
        'dash-filter-description',
        (key, isSelected) => {
            const sel = document.getElementById('dash-filter-description');
            if (!sel) return;
            sel.value = isSelected ? '' : key;
            applyDashboardFilters();
        }
    );

    renderBudgetPrevisionnel(activeMonth);
}

// ── Navigation mois ──────────────────────────────────────
function navigateMonth(direction) {
    const sel = document.getElementById('dashboard-month-select');
    if (!sel || sel.options.length <= 1) return;
    const newIdx = sel.selectedIndex + (direction === 'prev' ? 1 : -1);
    if (newIdx >= 0 && newIdx < sel.options.length) {
        sel.selectedIndex = newIdx;
        calculateDashboardMetrics();
    }
}

function buildMonthDropdown() {
    const sel = document.getElementById('dashboard-month-select');
    if (!sel) return;
    const months = [...new Set(
        transactions.map(t => t.mois_affectation || getYearMonthString(t.date)).filter(Boolean)
    )].sort().reverse();
    const previousValue = sel.value;
    sel.innerHTML = '';
    months.forEach(m => {
        const o = document.createElement('option');
        o.value = m; o.textContent = m;
        sel.appendChild(o);
    });
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (months.includes(currentMonth)) sel.value = currentMonth;
    else if (previousValue && months.includes(previousValue)) sel.value = previousValue;
    updateKpiSoldeVisibility();
    calculateDashboardMetrics();
}
