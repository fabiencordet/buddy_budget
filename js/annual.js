/**
 * annual.js
 * Vue annuelle : tableau récapitulatif par catégorie, poste ou description,
 * avec totaux par mois et total annuel.
 */

function buildAnnualYearSelect() {
    const sel = document.getElementById('annual-year-select');
    if (!sel) return;
    const years = [...new Set(transactions.map(t => {
        const m = t.mois_affectation || getYearMonthString(t.date);
        return m ? m.substring(0,4) : null;
    }).filter(Boolean))].sort().reverse();
    const current = sel.value;
    sel.innerHTML = '';
    years.forEach(y => { const o = document.createElement('option'); o.value = y; o.textContent = y; sel.appendChild(o); });
    if (current && years.includes(current)) sel.value = current;
    else if (years.length) sel.value = years[0];
}

function renderAnnualView() {
    buildAnnualYearSelect();
    const year = document.getElementById('annual-year-select')?.value;
    const mode = document.getElementById('annual-mode-select')?.value || 'categorie';
    if (!year) return;

    const months = [];
    for (let m = 1; m <= 12; m++) months.push(`${year}-${String(m).padStart(2,'0')}`);
    const monthLabels = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

    // Agrégation
    const data = {};
    transactions.forEach(t => {
        const m = t.mois_affectation || getYearMonthString(t.date);
        if (!m || !m.startsWith(year)) return;
        let key;
        if      (mode === 'categorie')   key = (t.categorie    || 'NON CLASSÉ').toUpperCase().trim();
        else if (mode === 'poste')       key = (t.poste        || 'AUTRE').toUpperCase().trim();
        else                             key =  t.description  || '—';
        if (!data[key]) data[key] = {};
        data[key][m] = (data[key][m] || 0) + (parseFloat(t.montant) || 0);
    });

    const keys = Object.keys(data).sort();

    // Thead
    document.getElementById('annual-thead').innerHTML = `<tr>
        <th class="row-label" style="left:0;z-index:3;background:#fafbfc">${mode === 'categorie' ? 'Catégorie' : mode === 'poste' ? 'Poste' : 'Description'}</th>
        ${months.map((m,i) => `<th class="text-right">${monthLabels[i]}</th>`).join('')}
        <th class="text-right" style="background:#f0f9ff">Total</th>
    </tr>`;

    // Tbody
    const tbody = document.getElementById('annual-tbody');
    tbody.innerHTML = '';

    const colTotals = {};
    months.forEach(m => colTotals[m] = 0);
    let grandTotal = 0;

    keys.forEach(key => {
        const row = document.createElement('tr');
        let rowTotal = 0;
        const cells = months.map(m => {
            const v = data[key][m] || 0;
            rowTotal += v;
            colTotals[m] += v;
            if (v === 0) return `<td class="text-right annual-cell-zero">—</td>`;
            return `<td class="text-right ${v>0?'annual-cell-pos':'annual-cell-neg'}">${v>0?'+':''}${fmt(v)}</td>`;
        }).join('');
        grandTotal += rowTotal;
        const badgeCls = mode === 'categorie' ? (categoryBadgeClass[key] || 'badge badge-default') : '';
        const label = mode === 'categorie'
            ? `<span class="${badgeCls}">${key}</span>`
            : `<span class="text-[11px] font-semibold uppercase tracking-tight text-slate-600">${key}</span>`;
        row.innerHTML = `
            <td class="row-label ${mode==='categorie'?'cat-row':''}">${label}</td>
            ${cells}
            <td class="text-right font-bold mono text-[11px] ${rowTotal>0?'annual-cell-pos':rowTotal<0?'annual-cell-neg':'annual-cell-zero'}" style="background:#f0f9ff">${rowTotal!==0?(rowTotal>0?'+':'')+fmt(rowTotal):'—'}</td>`;
        tbody.appendChild(row);
    });

    // Ligne totaux
    const totalRow = document.createElement('tr');
    totalRow.className = 'row-total';
    const totalCells = months.map(m => {
        const v = colTotals[m];
        if (v === 0) return `<td class="text-right annual-cell-zero font-bold">—</td>`;
        return `<td class="text-right ${v>0?'annual-cell-pos':'annual-cell-neg'}">${v>0?'+':''}${fmt(v)}</td>`;
    }).join('');
    totalRow.innerHTML = `
        <td class="row-label" style="background:#f0f9ff;font-size:11px;color:#0f172a">TOTAL</td>
        ${totalCells}
        <td class="text-right font-bold mono text-[11px] ${grandTotal>0?'annual-cell-pos':grandTotal<0?'annual-cell-neg':'annual-cell-zero'}" style="background:#dbeafe">${grandTotal!==0?(grandTotal>0?'+':'')+fmt(grandTotal):'—'}</td>`;
    tbody.appendChild(totalRow);
}
