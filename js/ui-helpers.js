/**
 * ui-helpers.js
 * Composants UI transversaux : menu paramètres, modal doublon,
 * peuplement des dropdowns de formulaire, toggle "exclu dashboard".
 */

// ── Settings panel ──────────────────────────────────────
function toggleSettings() {
    document.getElementById('settings-dropdown').classList.toggle('open');
}
function closeSettings() {
    document.getElementById('settings-dropdown').classList.remove('open');
}
document.addEventListener('click', e => {
    if (!document.getElementById('settings-container')?.contains(e.target)) closeSettings();
});

// ── Modal doublon ────────────────────────────────────────
function showDuplicateModal(msg) {
    return new Promise(resolve => {
        duplicateModalResolve = resolve;
        document.getElementById('duplicate-modal-msg').textContent = msg;
        document.getElementById('duplicate-modal').classList.remove('hidden');
    });
}
function closeDuplicateModal(confirmed) {
    document.getElementById('duplicate-modal').classList.add('hidden');
    if (duplicateModalResolve) duplicateModalResolve(confirmed);
    duplicateModalResolve = null;
}

// ── Dropdowns formulaire transaction ────────────────────
function populateCategorieDropdown() {
    const el = document.getElementById('form-categorie');
    if (!el) return;
    el.innerHTML = '';
    Object.keys(budgetStructure).forEach(cat => {
        const o = document.createElement('option');
        o.value = cat; o.textContent = cat;
        el.appendChild(o);
    });
    updatePosteDropdown();
}

function populateFilterCategorieDropdown() {
    const el = document.getElementById('filter-categorie');
    if (!el) return;
    el.innerHTML = '<option value="">📁 Toutes les catégories</option>';
    Object.keys(budgetStructure).forEach(cat => {
        const o = document.createElement('option');
        o.value = cat; o.textContent = cat;
        el.appendChild(o);
    });
}

function populateFilterPostes() {
    const catVal = document.getElementById('filter-categorie')?.value || '';
    const el = document.getElementById('filter-poste');
    if (!el) return;
    el.innerHTML = '<option value="">🏷️ Tous les postes</option>';
    const postes = catVal && budgetStructure[catVal]
        ? Object.keys(budgetStructure[catVal])
        : [...new Set(Object.values(budgetStructure).flatMap(c => Object.keys(c)))].sort();
    postes.forEach(p => {
        const o = document.createElement('option');
        o.value = p; o.textContent = p;
        el.appendChild(o);
    });
}

function populateFilterMois() {
    const el = document.getElementById('filter-mois');
    if (!el) return;
    const current = el.value;
    const months = [...new Set(
        transactions.map(t => t.mois_affectation || getYearMonthString(t.date)).filter(Boolean)
    )].sort().reverse();
    el.innerHTML = '<option value="">📅 Tous les mois</option>';
    months.forEach(m => {
        const o = document.createElement('option');
        o.value = m; o.textContent = m;
        el.appendChild(o);
    });
    if (current && months.includes(current)) el.value = current;
}

function updatePosteDropdown() {
    const cat = document.getElementById('form-categorie').value;
    const el  = document.getElementById('form-poste');
    if (!el || !cat || !budgetStructure[cat]) return;
    el.innerHTML = '';
    Object.keys(budgetStructure[cat]).forEach(p => {
        const o = document.createElement('option');
        o.value = p; o.textContent = p;
        el.appendChild(o);
    });
    updateDescriptionDropdown();
}

function updateDescriptionDropdown() {
    const cat = document.getElementById('form-categorie').value;
    const p   = document.getElementById('form-poste').value;
    const el  = document.getElementById('form-description');
    if (!el || !cat || !p || !budgetStructure[cat]?.[p]) return;
    el.innerHTML = '';
    budgetStructure[cat][p].forEach(d => {
        const o = document.createElement('option');
        o.value = d; o.textContent = d;
        el.appendChild(o);
    });
}

// ── Toggle Exclu Dashboard ───────────────────────────────
function setExcluDashboardToggle(active) {
    document.getElementById('form-exclu-dashboard').value = active ? 'true' : 'false';
    document.getElementById('toggle-exclu-dashboard').className = `toggle-track ${active ? 'exclu-on' : 'off'} ml-4`;
}
function toggleExcluDashboard() {
    setExcluDashboardToggle(document.getElementById('form-exclu-dashboard').value !== 'true');
}
