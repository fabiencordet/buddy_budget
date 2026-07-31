/**
 * dashboard.js
 * Dashboard principal : KPIs, graphique mensuel, filtres, panneaux
 * Catégories / Postes / Descriptions, navigation entre mois.
 */

let activeDashboardSubtab = 'suivi';
let statsChartInstance = null;
const DASHBOARD_SUBTABS = new Set(['suivi', 'previsionnel', 'statistiques']);
const dashboardSubtabHistory = [];
let dashboardSwipeGestureBound = false;
const statsDrillState = {
    level: 'categories',
    category: '',
    poste: '',
    description: '',
    month: '',
    metric: 'depenses',
    period: 'mensuel'
};
let statsDetailRows = [];
let statsCurrentSliceIndex = -1;
let statsLastSliceTap = { idx: -1, at: 0 };

function handleStatsDrilldownFromLabelIndex(idx, labels) {
    if (statsDrillState.level === 'timeline') return false;
    const label = labels[idx];
    if (!label) return false;

    if (statsDrillState.level === 'categories') {
        statsDrillState.level = 'postes';
        statsDrillState.category = label;
        statsDrillState.poste = '';
        statsDrillState.description = '';
    } else if (statsDrillState.level === 'postes') {
        statsDrillState.level = 'descriptions';
        statsDrillState.poste = label;
        statsDrillState.description = '';
    } else if (statsDrillState.level === 'descriptions') {
        statsDrillState.level = 'timeline';
        statsDrillState.description = label;
    } else {
        return false;
    }

    renderStatsView();
    return true;
}

function switchDashboardSubtab(subtabId, options = {}) {
    const tabDashboard = document.getElementById('tab-dashboard');
    if (!tabDashboard) return;

    const target = DASHBOARD_SUBTABS.has(subtabId) ? subtabId : 'suivi';
    const previous = activeDashboardSubtab;

    if (options.recordHistory !== false && previous !== target) {
        dashboardSubtabHistory.push(previous);
        if (dashboardSubtabHistory.length > 12) dashboardSubtabHistory.shift();
    }

    activeDashboardSubtab = target;

    tabDashboard.querySelectorAll('.dashboard-subtab-pane').forEach(pane => {
        pane.classList.toggle('active', pane.dataset.dashboardSubtab === target);
    });

    tabDashboard.querySelectorAll('[data-dashboard-subtab-btn]').forEach(btn => {
        const isActive = btn.dataset.dashboardSubtabBtn === target;
        btn.classList.toggle('active', isActive);
        if (isActive) btn.setAttribute('aria-current', 'page');
        else btn.removeAttribute('aria-current');
    });

    if (target === 'statistiques') renderStatsView();
}

function initDashboardSubtabs() {
    bindDashboardSwipeBackGesture();
    switchDashboardSubtab(activeDashboardSubtab);
}

function stepBackStatsDrilldown() {
    if (statsDrillState.level === 'timeline') {
        statsDrillState.level = 'descriptions';
        statsDrillState.description = '';
        return true;
    }
    if (statsDrillState.level === 'descriptions') {
        statsDrillState.level = 'postes';
        statsDrillState.poste = '';
        statsDrillState.description = '';
        return true;
    }
    if (statsDrillState.level === 'postes') {
        statsDrillState.level = 'categories';
        statsDrillState.category = '';
        statsDrillState.poste = '';
        statsDrillState.description = '';
        return true;
    }
    return false;
}

function goBackDashboardSubtab() {
    while (dashboardSubtabHistory.length) {
        const previous = dashboardSubtabHistory.pop();
        if (previous && previous !== activeDashboardSubtab && DASHBOARD_SUBTABS.has(previous)) {
            switchDashboardSubtab(previous, { recordHistory: false });
            return true;
        }
    }
    return false;
}

function handleDashboardSwipeBack() {
    const dashboardTab = document.getElementById('tab-dashboard');
    if (!dashboardTab || !dashboardTab.classList.contains('active')) return false;

    if (activeDashboardSubtab === 'statistiques' && stepBackStatsDrilldown()) {
        renderStatsView();
        return true;
    }
    return goBackDashboardSubtab();
}

function bindDashboardSwipeBackGesture() {
    if (dashboardSwipeGestureBound) return;
    dashboardSwipeGestureBound = true;

    let tracking = false;
    let startX = 0;
    let startY = 0;
    let startT = 0;

    document.addEventListener('touchstart', e => {
        if (!e.touches || e.touches.length !== 1) return;
        const t = e.touches[0];
        const dashboardTab = document.getElementById('tab-dashboard');
        if (!dashboardTab || !dashboardTab.classList.contains('active')) return;
        if (window.innerWidth > 900) return;
        if (t.clientX > 26) return;

        tracking = true;
        startX = t.clientX;
        startY = t.clientY;
        startT = Date.now();
    }, { passive: true });

    document.addEventListener('touchmove', e => {
        if (!tracking || !e.touches || e.touches.length !== 1) return;
        const t = e.touches[0];
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2 && dx > 0) {
            e.preventDefault();
        }
        if (Math.abs(dy) > 80) tracking = false;
    }, { passive: false });

    document.addEventListener('touchend', e => {
        if (!tracking) return;
        tracking = false;
        const t = e.changedTouches?.[0];
        if (!t) return;

        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        const dt = Date.now() - startT;

        if (dx >= 85 && Math.abs(dy) <= 70 && dt <= 700) {
            handleDashboardSwipeBack();
        }
    }, { passive: true });
}

function getDashboardAvailableMonths() {
    return [...new Set(
        transactions.map(t => t.mois_affectation || getYearMonthString(t.date)).filter(Boolean)
    )].sort().reverse();
}

function syncStatsMonthSelect(months = [], preferred = '') {
    const sel = document.getElementById('stats-month-select');
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '';
    months.forEach(m => {
        const o = document.createElement('option');
        o.value = m;
        o.textContent = m;
        sel.appendChild(o);
    });
    if (!months.length) {
        statsDrillState.month = '';
        return;
    }
    if (preferred && months.includes(preferred)) sel.value = preferred;
    else if (statsDrillState.month && months.includes(statsDrillState.month)) sel.value = statsDrillState.month;
    else if (current && months.includes(current)) sel.value = current;
    else sel.value = months[0];
    statsDrillState.month = sel.value;
}

function onStatsMonthChange() {
    const sel = document.getElementById('stats-month-select');
    if (!sel) return;
    statsDrillState.month = sel.value;
    renderStatsView();
}

function updateStatsControlButtons() {
    const metricBtns = {
        depenses: document.getElementById('stats-metric-depenses'),
        entrees: document.getElementById('stats-metric-entrees')
    };
    const periodBtns = {
        mensuel: document.getElementById('stats-period-mensuel'),
        annuel: document.getElementById('stats-period-annuel')
    };
    Object.entries(metricBtns).forEach(([key, btn]) => btn?.classList.toggle('active', statsDrillState.metric === key));
    Object.entries(periodBtns).forEach(([key, btn]) => btn?.classList.toggle('active', statsDrillState.period === key));
    const monthSel = document.getElementById('stats-month-select');
    if (monthSel) monthSel.classList.toggle('hidden', statsDrillState.period === 'annuel');
}

function setStatsMetric(metric) {
    if (!['depenses', 'entrees'].includes(metric)) return;
    statsDrillState.metric = metric;
    resetStatsDrilldown();
}

function setStatsPeriod(period) {
    if (!['mensuel', 'annuel'].includes(period)) return;
    statsDrillState.period = period;
    renderStatsView();
}

function updateStatsPeriodIndicator() {
    const el = document.getElementById('stats-period-indicator');
    if (!el) return;
    if (statsDrillState.period !== 'annuel') {
        el.classList.add('hidden');
        el.textContent = '';
        return;
    }
    const year = (statsDrillState.month || '').slice(0, 4);
    if (!year) {
        el.classList.add('hidden');
        el.textContent = '';
        return;
    }
    el.textContent = `Année active : ${year}`;
    el.classList.remove('hidden');
}

function resetStatsDrilldown() {
    statsDrillState.level = 'categories';
    statsDrillState.category = '';
    statsDrillState.poste = '';
    statsDrillState.description = '';
    renderStatsView();
}

function hexToRgb(hex) {
    const raw = (hex || '').replace('#', '');
    if (raw.length !== 6) return { r: 100, g: 116, b: 139 };
    return {
        r: parseInt(raw.slice(0, 2), 16),
        g: parseInt(raw.slice(2, 4), 16),
        b: parseInt(raw.slice(4, 6), 16)
    };
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

function shiftColor(hex, idx, total) {
    const { r, g, b } = hexToRgb(hex);
    const ratio = total > 1 ? (idx / (total - 1)) : 0;
    const mix = 0.2 + ratio * 0.42;
    return rgbToHex(r + (255 - r) * mix, g + (255 - g) * mix, b + (255 - b) * mix);
}

function getStringHash(str) {
    let h = 0;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
    return Math.abs(h);
}

function getVividPalette() {
    return [
        '#ef4444', '#f97316', '#f59e0b', '#eab308', '#22c55e',
        '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
        '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
    ];
}

function statsMoney(v) {
    return (Math.round(v * 100) / 100).toFixed(2).replace('.', ',') + ' €';
}

function getStatsAmountForMetric(t) {
    const amt = parseFloat(t.montant) || 0;
    if (statsDrillState.metric === 'depenses') return amt < 0 ? Math.abs(amt) : 0;
    return amt > 0 ? amt : 0;
}

function getStatsTransactionsForMonth(month) {
    const monthPrefix = month?.slice(0, 4) || '';
    return transactions.filter(t => {
        if (t.exclu_dashboard) return false;
        const m = t.mois_affectation || getYearMonthString(t.date);
        if (!m) return false;
        if (statsDrillState.period === 'mensuel' && m !== month) return false;
        if (statsDrillState.period === 'annuel' && (!monthPrefix || !m.startsWith(monthPrefix))) return false;
        return getStatsAmountForMetric(t) > 0;
    });
}

function aggregateTotalsBy(list, keyBuilder) {
    const totals = {};
    list.forEach(t => {
        const key = keyBuilder(t);
        if (!key) return;
        const amount = getStatsAmountForMetric(t);
        if (!amount) return;
        totals[key] = (totals[key] || 0) + amount;
    });
    return Object.entries(totals)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);
}

function renderStatsBreadcrumbs() {
    const wrap = document.getElementById('stats-breadcrumbs');
    if (!wrap) return;
    const crumbs = [{ label: 'Catégories', level: 'categories' }];
    if (statsDrillState.category) crumbs.push({ label: statsDrillState.category, level: 'postes' });
    if (statsDrillState.poste) crumbs.push({ label: statsDrillState.poste, level: 'descriptions' });
    if (statsDrillState.description) crumbs.push({ label: statsDrillState.description, level: 'timeline' });

    wrap.innerHTML = '';
    crumbs.forEach((c, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'crumb-btn';
        btn.textContent = c.label;
        btn.addEventListener('click', () => {
            if (c.level === 'categories') {
                statsDrillState.level = 'categories';
                statsDrillState.category = '';
                statsDrillState.poste = '';
                statsDrillState.description = '';
            }
            if (c.level === 'postes') {
                statsDrillState.level = 'postes';
                statsDrillState.poste = '';
                statsDrillState.description = '';
            }
            if (c.level === 'descriptions') {
                statsDrillState.level = 'descriptions';
                statsDrillState.description = '';
            }
            if (c.level === 'timeline') statsDrillState.level = 'timeline';
            renderStatsView();
        });
        wrap.appendChild(btn);
        if (idx < crumbs.length - 1) {
            const sep = document.createElement('span');
            sep.className = 'crumb-sep';
            sep.textContent = '›';
            wrap.appendChild(sep);
        }
    });
}

function buildStatsColors(items, level) {
    if (level === 'categories') return items.map(i => categoryBarColor[i.label] || '#94a3b8');
    const palette = getVividPalette();
    const offset = getStringHash(statsDrillState.category + '|' + statsDrillState.poste) % palette.length;
    return items.map((_, idx) => palette[(offset + idx) % palette.length]);
}

function updateStatsTotalBar(values) {
    const bar = document.getElementById('stats-total-bar');
    const label = document.getElementById('stats-total-label');
    const value = document.getElementById('stats-total-value');
    if (!bar || !label || !value) return;
    const total = values.reduce((sum, v) => sum + v, 0);
    const metricWord = statsDrillState.metric === 'depenses' ? 'dépenses' : 'entrées';
    const periodWord = statsDrillState.period === 'annuel' ? 'annuel' : 'mensuel';
    label.textContent = `Total ${metricWord} ${periodWord}`;
    value.textContent = statsMoney(total);
    bar.classList.remove('hidden');
}

function hideStatsTotalBar() {
    const bar = document.getElementById('stats-total-bar');
    if (bar) bar.classList.add('hidden');
}

function renderStatsNameList(labels, colors) {
    const wrap = document.getElementById('stats-name-list');
    if (!wrap) return;
    wrap.innerHTML = '';
    if (!labels.length) {
        wrap.classList.add('hidden');
        return;
    }
    labels.forEach((name, idx) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'stats-name-item' + (idx === statsCurrentSliceIndex ? ' active' : '');
        item.innerHTML = `<span class="stats-name-dot" style="background:${colors[idx] || '#94a3b8'}"></span><span>${name}</span>`;
        item.addEventListener('click', () => {
            statsCurrentSliceIndex = idx;
            renderStatsNameList(labels, colors);
            updateStatsSliceInfo(labels, [], idx, true);
        });
        wrap.appendChild(item);
    });
    wrap.classList.remove('hidden');
}

function updateStatsSliceInfo(labels, values, idx, keepValues = false) {
    const block = document.getElementById('stats-slice-info');
    const nameEl = document.getElementById('stats-slice-name');
    const amountEl = document.getElementById('stats-slice-amount');
    const pctEl = document.getElementById('stats-slice-percent');
    if (!block || !nameEl || !amountEl || !pctEl) return;
    if (idx < 0 || idx >= labels.length) {
        block.classList.add('hidden');
        return;
    }
    const vals = keepValues ? (statsChartInstance?.data?.datasets?.[0]?.data || []) : values;
    const amount = Number(vals[idx] || 0);
    const total = vals.reduce((sum, v) => sum + Number(v || 0), 0);
    const pct = total ? Math.round(amount / total * 100) : 0;
    nameEl.textContent = labels[idx];
    amountEl.textContent = statsMoney(amount);
    pctEl.textContent = `${pct}% du total`;
    block.classList.remove('hidden');
}

function clearStatsSliceInfo() {
    statsCurrentSliceIndex = -1;
    const block = document.getElementById('stats-slice-info');
    if (block) block.classList.add('hidden');
}

function renderStatsDetailsForDescription() {
    const detailsBlock = document.getElementById('stats-details-block');
    const list = document.getElementById('stats-details-list');
    const title = document.getElementById('stats-details-title');
    const exportBtn = document.getElementById('stats-export-btn');
    if (!detailsBlock || !list || !title || !exportBtn) return;
    const metricLabel = statsDrillState.metric === 'depenses' ? 'Dépenses' : 'Entrées';
    title.textContent = `🧾 ${metricLabel} de la description`;

    if (statsDrillState.level !== 'timeline') {
        detailsBlock.classList.add('hidden');
        exportBtn.classList.add('hidden');
        list.innerHTML = '';
        statsDetailRows = [];
        return;
    }

    const rows = transactions
        .filter(t => {
            if (t.exclu_dashboard) return false;
            const amount = getStatsAmountForMetric(t);
            if (amount <= 0) return false;
            if (statsDrillState.period === 'mensuel') {
                const month = t.mois_affectation || getYearMonthString(t.date);
                if (month !== statsDrillState.month) return false;
            }
            if (statsDrillState.period === 'annuel') {
                const month = t.mois_affectation || getYearMonthString(t.date);
                const year = statsDrillState.month?.slice(0, 4) || '';
                if (!year || !month.startsWith(year)) return false;
            }
            return (t.categorie || '').toUpperCase().trim() === statsDrillState.category
                && (t.poste || '').toUpperCase().trim() === statsDrillState.poste
                && (t.description || '').toUpperCase().trim() === statsDrillState.description;
        })
        .sort((a, b) => (a.date < b.date ? 1 : -1));

    detailsBlock.classList.remove('hidden');
    exportBtn.classList.toggle('hidden', !rows.length);
    statsDetailRows = rows.slice();
    list.innerHTML = '';
    if (!rows.length) {
        list.innerHTML = `<p class="text-xs text-slate-400 italic">Aucune ${statsDrillState.metric === 'depenses' ? 'dépense' : 'entrée'} pour cette description.</p>`;
        return;
    }

    rows.forEach(t => {
        const amount = getStatsAmountForMetric(t);
        const item = document.createElement('div');
        item.className = 'stats-detail-item';
        item.innerHTML = `
            <div class="flex items-center justify-between gap-2">
                <span class="text-[11px] font-semibold text-slate-700 mono">${t.date}</span>
                <span class="text-[11px] font-bold mono ${statsDrillState.metric === 'depenses' ? 'text-rose-600' : 'text-emerald-600'}">${statsMoney(amount)}</span>
            </div>
            <div class="text-[10px] text-slate-500 mt-0.5">${t.details || 'Sans détail bancaire'} · ${t.compte_bancaire || 'Compte non renseigné'}</div>`;
        list.appendChild(item);
    });
}

function exportStatsDetailsCSV() {
    if (!statsDetailRows.length) return;
    const escapeCsv = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [
        ['date', 'mois_affectation', 'categorie', 'poste', 'description', 'details', 'compte_bancaire', 'montant']
    ];
    statsDetailRows.forEach(t => {
        rows.push([
            t.date || '',
            t.mois_affectation || getYearMonthString(t.date) || '',
            t.categorie || '',
            t.poste || '',
            t.description || '',
            t.details || '',
            t.compte_bancaire || '',
            getStatsAmountForMetric(t).toFixed(2)
        ]);
    });
    const csv = rows.map(r => r.map(escapeCsv).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const metric = statsDrillState.metric === 'depenses' ? 'depenses' : 'entrees';
    const period = statsDrillState.period === 'annuel' ? 'annuel' : 'mensuel';
    const stamp = statsDrillState.period === 'annuel' ? (statsDrillState.month || 'all').slice(0, 4) : (statsDrillState.month || 'all');
    a.href = url;
    a.download = `stats_${metric}_${period}_${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function renderStatsView() {
    const canvas = document.getElementById('stats-main-chart');
    const empty = document.getElementById('stats-empty');
    const subtitle = document.getElementById('stats-level-subtitle');
    if (!canvas || !empty || !subtitle) return;

    const months = getDashboardAvailableMonths();
    const preferredMonth = document.getElementById('dashboard-month-select')?.value || statsDrillState.month;
    syncStatsMonthSelect(months, preferredMonth);
    updateStatsControlButtons();
    updateStatsPeriodIndicator();
    renderStatsBreadcrumbs();

    if (!statsDrillState.month) {
        if (statsChartInstance) { statsChartInstance.destroy(); statsChartInstance = null; }
        hideStatsTotalBar();
        renderStatsNameList([], []);
        clearStatsSliceInfo();
        empty.classList.remove('hidden');
        renderStatsDetailsForDescription();
        return;
    }

    const monthData = getStatsTransactionsForMonth(statsDrillState.month);
    let items = [];
    let chartType = 'pie';
    const isDepenses = statsDrillState.metric === 'depenses';
    const periodLabel = statsDrillState.period === 'annuel' ? 'annuelle' : 'mensuelle';

    if (statsDrillState.level === 'categories') {
        subtitle.textContent = isDepenses
            ? `Répartition ${periodLabel} des dépenses par catégorie (hors revenus)`
            : `Répartition ${periodLabel} des entrées par catégorie`;
        items = aggregateTotalsBy(
            monthData.filter(t => (isDepenses ? (t.categorie || '').toUpperCase().trim() !== 'REVENUS' : true)),
            t => (t.categorie || '').toUpperCase().trim()
        );
    }

    if (statsDrillState.level === 'postes') {
        subtitle.textContent = `Catégorie ${statsDrillState.category} — répartition ${periodLabel} par poste`;
        items = aggregateTotalsBy(
            monthData.filter(t => (t.categorie || '').toUpperCase().trim() === statsDrillState.category),
            t => (t.poste || '').toUpperCase().trim()
        );
    }

    if (statsDrillState.level === 'descriptions') {
        subtitle.textContent = `${statsDrillState.poste} — répartition ${periodLabel} par description`;
        items = aggregateTotalsBy(
            monthData.filter(t => (t.categorie || '').toUpperCase().trim() === statsDrillState.category && (t.poste || '').toUpperCase().trim() === statsDrillState.poste),
            t => (t.description || '').toUpperCase().trim()
        );
    }

    if (statsDrillState.level === 'timeline') {
        subtitle.textContent = `${statsDrillState.description} — évolution mensuelle (${isDepenses ? 'dépenses' : 'entrées'})`;
        chartType = 'line';
        const byMonth = {};
        transactions.forEach(t => {
            if (t.exclu_dashboard) return;
            const amount = getStatsAmountForMetric(t);
            if (!amount) return;
            if ((t.categorie || '').toUpperCase().trim() !== statsDrillState.category) return;
            if ((t.poste || '').toUpperCase().trim() !== statsDrillState.poste) return;
            if ((t.description || '').toUpperCase().trim() !== statsDrillState.description) return;
            const month = t.mois_affectation || getYearMonthString(t.date);
            if (!month) return;
            if (statsDrillState.period === 'annuel') {
                const year = statsDrillState.month?.slice(0, 4) || '';
                if (!year || !month.startsWith(year)) return;
            }
            byMonth[month] = (byMonth[month] || 0) + amount;
        });
        items = Object.keys(byMonth).sort().map(m => ({ label: m, value: byMonth[m] }));
    }

    if (!items.length) {
        if (statsChartInstance) { statsChartInstance.destroy(); statsChartInstance = null; }
        hideStatsTotalBar();
        renderStatsNameList([], []);
        clearStatsSliceInfo();
        empty.classList.remove('hidden');
        renderStatsDetailsForDescription();
        return;
    }

    empty.classList.add('hidden');

    const labels = items.map(i => i.label);
    const values = items.map(i => i.value);
    const colors = buildStatsColors(items, statsDrillState.level);
    if (chartType === 'line') {
        hideStatsTotalBar();
        renderStatsNameList([], []);
        clearStatsSliceInfo();
    } else {
        updateStatsTotalBar(values);
        if (statsCurrentSliceIndex >= labels.length) statsCurrentSliceIndex = -1;
        renderStatsNameList(labels, colors);
        if (statsCurrentSliceIndex >= 0) updateStatsSliceInfo(labels, values, statsCurrentSliceIndex);
        else clearStatsSliceInfo();
    }

    if (statsChartInstance) { statsChartInstance.destroy(); statsChartInstance = null; }
    statsChartInstance = new Chart(canvas, {
        type: chartType,
        data: chartType === 'line'
            ? {
                labels,
                datasets: [{
                    label: isDepenses ? 'Dépenses' : 'Entrées',
                    data: values,
                    borderColor: categoryBarColor[statsDrillState.category] || '#0f172a',
                    backgroundColor: 'rgba(15,23,42,.08)',
                    pointBackgroundColor: '#fff',
                    pointBorderColor: categoryBarColor[statsDrillState.category] || '#0f172a',
                    pointRadius: 4,
                    pointBorderWidth: 2,
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            }
            : {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: chartType === 'line' ? undefined : { padding: { top: 12, right: 16, bottom: 12, left: 16 } },
            plugins: {
                legend: {
                    display: chartType === 'line',
                    position: 'bottom',
                    labels: { boxWidth: 12, font: { size: 10, family: 'DM Sans' } }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const val = ctx.raw || 0;
                            if (chartType === 'line') return ` ${ctx.label} : ${statsMoney(val)}`;
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = total ? Math.round(val / total * 100) : 0;
                            return ` ${ctx.label} : ${statsMoney(val)} (${pct}%)`;
                        }
                    }
                }
            },
            scales: chartType === 'line'
                ? {
                    y: { beginAtZero: true, ticks: { font: { size: 9 }, callback: v => Number(v).toLocaleString('fr') + ' €' }, grid: { color: '#f1f5f9' } },
                    x: { ticks: { font: { size: 9 } }, grid: { display: false } }
                }
                : undefined,
            onClick: (evt, elements) => {
                if (chartType !== 'pie') return;
                if (!elements?.length) return;
                const idx = elements[0].index;
                const now = Date.now();
                if (statsLastSliceTap.idx === idx && (now - statsLastSliceTap.at) < 350) {
                    statsLastSliceTap = { idx: -1, at: 0 };
                    handleStatsDrilldownFromLabelIndex(idx, labels);
                    return;
                }
                statsLastSliceTap = { idx, at: now };
                statsCurrentSliceIndex = idx;
                renderStatsNameList(labels, colors);
                updateStatsSliceInfo(labels, values, idx);
            }
        }
    });

    renderStatsDetailsForDescription();
}

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
    const catSel = document.getElementById('dash-filter-categorie');
    const catVal = catSel?.value || '';
    const ps = document.getElementById('dash-filter-poste');
    const ds = document.getElementById('dash-filter-description');
    if (!ps || !ds) return;
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
    const catVal   = document.getElementById('dash-filter-categorie')?.value || '';
    const posteVal = document.getElementById('dash-filter-poste')?.value || '';
    const ds = document.getElementById('dash-filter-description');
    if (!ds) return;
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
    const catSel = document.getElementById('dash-filter-categorie');
    if (catSel) catSel.value = '';
    const posteSel = document.getElementById('dash-filter-poste');
    if (posteSel) posteSel.value = '';
    const descSel = document.getElementById('dash-filter-description');
    if (descSel) descSel.value = '';
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
    const indicator = document.getElementById('dash-active-filter-indicator');
    if (indicator) indicator.classList.toggle('hidden', !active);
    ['cat','poste','desc'].forEach(k => {
        const el = document.getElementById(`dash-filter-pill-${k}`);
        const icons = { cat:'📁 ', poste:'🏷️ ', desc:'📝 ' };
        if (!el) return;
        el.classList.toggle('hidden', !f[k]);
        if (f[k]) el.textContent = icons[k] + f[k];
    });
    const badge = document.getElementById('chart-filter-badge');
    if (!badge) return;
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
    renderStatsView();
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
    const months = getDashboardAvailableMonths();
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
    syncStatsMonthSelect(months, sel.value);
    updateKpiSoldeVisibility();
    calculateDashboardMetrics();
}
