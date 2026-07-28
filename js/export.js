/**
 * export.js
 * Export des transactions au format CSV (toutes données ou mois affiché).
 */

function buildCSV(rows) {
    const headers = ['id','date','mois_affectation','categorie','poste','description','details','montant','pointe','exclu_dashboard'];
    const escape  = v => { const s = String(v ?? ''); return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g,'""')}"` : s; };
    const lines   = [headers.join(','), ...rows.map(t => headers.map(h => escape(t[h])).join(','))];
    return '\ufeff' + lines.join('\n'); // BOM pour Excel
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

function exportToCSV() {
    if (!transactions.length) { alert('Aucune donnée à exporter.'); return; }
    downloadCSV(buildCSV(transactions), `mybudget_complet_${new Date().toISOString().split('T')[0]}.csv`);
}

function exportMonthToCSV() {
    const month = document.getElementById('dashboard-month-select')?.value;
    if (!month) { alert('Aucun mois sélectionné.'); return; }
    const rows = transactions.filter(t => (t.mois_affectation || getYearMonthString(t.date)) === month);
    if (!rows.length) { alert('Aucune transaction pour ce mois.'); return; }
    downloadCSV(buildCSV(rows), `mybudget_${month}.csv`);
}
