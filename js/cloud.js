/**
 * cloud.js
 * Initialisation de l'app et synchronisation avec Supabase.
 */

function initApp() {
    loadComptesBancaires();
    fetchTransactionsFromCloud();
    fetchBudgetLinesFromCloud();
    populateCategorieDropdown();
    populateFilterCategorieDropdown();
    populateFilterPostes();
    populateDashFilterCategories();
    document.getElementById('api-key-input').value = localStorage.getItem('gemini_api_key') || '';
}

function saveApiKey() {
    localStorage.setItem('gemini_api_key', document.getElementById('api-key-input').value.trim());
    alert('Clé mémorisée.');
}

function toggleImportZone() {
    document.getElementById('integrated-import-zone').classList.toggle('hidden');
}

function switchTab(tabId) {
    document.querySelectorAll('.tabs-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active-tab'));
    document.getElementById(tabId).classList.add('active');
    document.getElementById('btn-' + tabId).classList.add('active-tab');
    if (tabId === 'tab-dashboard') { buildMonthDropdown(); renderMainBudgetChart(); }
    if (tabId === 'tab-annual')    { buildAnnualYearSelect(); renderAnnualView(); }
}

async function fetchBudgetLinesFromCloud() {
    if (!_supabase || !currentUser) return;
    try {
        const { data, error } = await _supabase.from('budget_lines').select('*').order('id', { ascending: true });
        if (error) throw error;
        budgetLines = (data || []).map(r => ({
            key:         r.poste.toUpperCase().trim() + '||' + (r.description || '').toUpperCase().trim(),
            poste:       r.poste.toUpperCase().trim(),
            description: (r.description || '').toUpperCase().trim(),
            amount:      r.amount
        }));
        calculateDashboardMetrics();
        renderMainBudgetChart();
    } catch(err) { console.error('Erreur fetch budget_lines:', err.message); }
}

async function fetchTransactionsFromCloud() {
    if (!_supabase || !currentUser) return;
    try {
        const { data, error } = await _supabase.from('transactions').select('*').order('date', { ascending: false });
        if (error) throw error;
        transactions = data || [];
        populateFilterMois();
        renderResponsiveTransactions();
        buildMonthDropdown();
        renderMainBudgetChart();
    } catch(err) { console.error('fetchTransactions:', err); }
}
