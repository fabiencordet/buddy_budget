/**
 * state.js
 * Variables d'état globales partagées entre tous les modules.
 * Initialisation de Supabase.
 */

let _supabase;
try {
    if (typeof CONFIG !== 'undefined')
        _supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
} catch(e) { console.error('Supabase init:', e); }

let currentUser         = null;
let transactions        = [];
let comptesBancaires    = [];
let budgetLines         = [];
let isHidePointedActive = false;
let budgetChartInstance = null;
let duplicateModalResolve = null;

// ── Helpers partagés ─────────────────────────────────────
function getYearMonthString(d) {
    if (!d || !d.includes('-')) return '';
    const p = d.split('-');
    return `${p[0]}-${p[1].padStart(2,'0')}`;
}

function syncDefaultAffectationMonth() {
    const v = document.getElementById('form-date').value;
    if (v) document.getElementById('form-affectation').value = getYearMonthString(v);
}

function fmt(n) {
    return n.toFixed(2).replace('.', ',') + ' €';
}
