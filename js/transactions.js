/**
 * transactions.js
 * Rendu du tableau des transactions (desktop + mobile), CRUD,
 * édition inline, détection de doublons, drawer de détails.
 */

// ── Filtre "masquer pointées" ────────────────────────────
function toggleHidePointedFilter() {
    isHidePointedActive = !isHidePointedActive;
    document.getElementById('toggle-filter-pointed').className = `toggle-track ${isHidePointedActive ? 'on' : 'off'}`;
    renderResponsiveTransactions();
}

// ── Pointage ─────────────────────────────────────────────
async function togglePointage(index, event) {
    if (event) event.stopPropagation();
    const t = transactions[index];
    const newVal = !t.pointe;
    try {
        const { error } = await _supabase.from('transactions').update({ pointe: newVal }).eq('id', t.id);
        if (error) throw error;
        t.pointe = newVal;
        renderResponsiveTransactions();
        renderMainBudgetChart();
    } catch { alert('Erreur lors de la mise à jour du pointage.'); }
}

// ── Rendu principal ──────────────────────────────────────
function renderResponsiveTransactions() {
    const pcTbody         = document.getElementById('pc-table-body');
    const mobileContainer = document.getElementById('mobile-cards-container');
    const emptyState      = document.getElementById('empty-state');
    pcTbody.innerHTML = ''; mobileContainer.innerHTML = '';

    const q       = (document.getElementById('search-input')?.value    || '').toLowerCase().trim();
    const catF    = (document.getElementById('filter-categorie')?.value || '').toUpperCase().trim();
    const posteF  = (document.getElementById('filter-poste')?.value     || '').toUpperCase().trim();
    const moisF   = (document.getElementById('filter-mois')?.value      || '');
    const compteF = (document.getElementById('filter-compte')?.value    || '');

    const filtered = transactions.filter(t => {
        if (isHidePointedActive && t.pointe) return false;
        const cC  = (t.categorie      ||'').toUpperCase().trim();
        const cP  = (t.poste          ||'').toUpperCase().trim();
        const cD  = (t.description    ||'').toLowerCase();
        const cN  = (t.details        ||'').toLowerCase();
        const cCp = (t.compte_bancaire||'');
        const cM  = t.mois_affectation || getYearMonthString(t.date);
        return (!q      || cP.toLowerCase().includes(q) || cD.includes(q) || cN.includes(q))
            && (!catF   || cC  === catF)
            && (!posteF || cP  === posteF)
            && (!moisF  || cM  === moisF)
            && (!compteF|| cCp === compteF);
    });

    if (!filtered.length) { emptyState.classList.remove('hidden'); renderTableFooter([]); return; }
    emptyState.classList.add('hidden');

    const dupSet = buildDuplicateSet(filtered);

    filtered.forEach(t => {
        const idx        = transactions.indexOf(t);
        const cCat       = (t.categorie||'').toUpperCase().trim();
        const badgeClass = categoryBadgeClass[cCat] || 'badge badge-default';
        const amt        = parseFloat(t.montant) || 0;
        const mColor     = amt > 0 ? '#059669' : '#e11d48';
        const mText      = (amt > 0 ? '+' : '') + fmt(amt);
        const affect     = t.mois_affectation || getYearMonthString(t.date);
        const excluBadge = t.exclu_dashboard ? `<span class="badge badge-exclu ml-1.5">⊘</span>` : '';
        const dupKey     = `${t.date}|${parseFloat(t.montant).toFixed(2)}`;
        const dupBadge   = dupSet.has(dupKey) ? `<span title="Doublon probable" style="font-size:11px;cursor:default">⚠️</span>` : '';

        const pointBtn = `
            <button onclick="togglePointage(${idx},event)" title="${t.pointe?'Dé-pointer':'Pointer'}"
                class="w-7 h-7 flex items-center justify-center rounded-lg border-2 transition-all ${t.pointe?'bg-emerald-500 border-emerald-500 text-white':'border-slate-200 hover:border-emerald-400 text-transparent hover:text-slate-200'}">
                <svg class="w-3.5 h-3.5 stroke-current" fill="none" stroke-width="3.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            </button>`;

        // ── Desktop row ──
        const tr = document.createElement('tr');
        tr.className = `tr-row cursor-pointer ${t.pointe?'is-pointed':''}`;
        tr.onclick = () => openDetailsDrawer(idx);

        const catLabel   = (t.categorie||'—').length > 18 ? (t.categorie||'—').substring(0,17)+'…' : (t.categorie||'—');
        const posteLabel = (t.poste||'').length > 14 ? (t.poste||'').substring(0,13)+'…' : (t.poste||'');
        const descLabel  = (t.description||'').length > 14 ? (t.description||'').substring(0,13)+'…' : (t.description||'');
        const noteLabel  = (t.details||'').length > 13 ? (t.details||'').substring(0,12)+'…' : (t.details||'');
        const compteLabel= (t.compte_bancaire||'').length > 7 ? (t.compte_bancaire||'').substring(0,6)+'…' : (t.compte_bancaire||'');

        tr.innerHTML = `
            <td class="p-2 text-center"><div class="flex justify-center">${pointBtn}</div></td>
            <td class="p-2 mono text-[11px] text-slate-400 whitespace-nowrap">${t.date}</td>
            <td class="p-2 mono text-[10px] text-slate-400 whitespace-nowrap">${affect}</td>
            <td class="p-2" title="${t.categorie||''}"><span class="${badgeClass}" style="max-width:105px;overflow:hidden;text-overflow:ellipsis;display:inline-block">${catLabel}</span>${dupBadge}</td>
            <td class="p-2 text-[11px] font-semibold uppercase tracking-tight text-slate-600 inline-edit-cell"
                ondblclick="event.stopPropagation();startInlineEdit(this,${idx},'poste','${(t.poste||'').replace(/'/g,"\\'")}',true,${JSON.stringify(t.categorie&&budgetStructure[t.categorie]?Object.keys(budgetStructure[t.categorie]):[t.poste||''])})"
                title="${t.poste||''} — Double-clic pour éditer">${posteLabel}</td>
            <td class="p-2 text-[11px] ${t.pointe?'line-through text-slate-400':'text-slate-700'} inline-edit-cell"
                ondblclick="event.stopPropagation();startInlineEdit(this,${idx},'description','${(t.description||'').replace(/'/g,"\\'")}',false,null)"
                title="${t.description||''} — Double-clic pour éditer">${descLabel}${excluBadge}</td>
            <td class="p-2 text-[10px] text-slate-400 italic inline-edit-cell"
                ondblclick="event.stopPropagation();startInlineEdit(this,${idx},'details','${(t.details||'').replace(/'/g,"\\'")}',false,null)"
                title="${t.details||''} — Double-clic pour éditer">${noteLabel}</td>
            <td class="p-2 text-[10px] text-slate-500" title="${t.compte_bancaire||''}">${compteLabel||'—'}</td>
            <td class="p-2 text-right text-[11px] font-bold mono whitespace-nowrap inline-edit-cell"
                ondblclick="event.stopPropagation();startInlineEdit(this,${idx},'montant',${t.montant||0},false,null)"
                style="color:${mColor}" title="Double-clic pour éditer">${mText}</td>
            <td class="p-2 text-center whitespace-nowrap" style="position:sticky;right:0;background:${t.pointe?'#f8fafc':'#fff'};box-shadow:-2px 0 6px rgba(15,23,42,.06)">
                <button onclick="event.stopPropagation();openTransactionModal(${idx})" title="Éditer"
                    class="w-7 h-7 inline-flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 transition">✏️</button>
                <button onclick="event.stopPropagation();deleteTransaction(${idx})" title="Supprimer"
                    class="w-7 h-7 inline-flex items-center justify-center rounded-lg bg-rose-50 text-rose-400 hover:bg-rose-100 transition">🗑</button>
            </td>`;
        pcTbody.appendChild(tr);

        // ── Mobile card ──
        const card = document.createElement('div');
        card.className = `px-3 py-3 flex items-center gap-2.5 ${t.pointe?'bg-slate-50/60':'bg-white'} hover:bg-slate-50 transition-colors cursor-pointer`;
        card.onclick = () => openDetailsDrawer(idx);

        const mCatLabel   = (t.categorie||'—').length > 13 ? (t.categorie||'—').substring(0,12)+'…' : (t.categorie||'—');
        const mPosteLabel = (t.poste||'').length > 13 ? (t.poste||'').substring(0,12)+'…' : (t.poste||'');
        const mCompte     = t.compte_bancaire
            ? `<span class="inline-flex items-center shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-semibold" style="background:#f0f9ff;color:#0369a1;max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">🏦 ${t.compte_bancaire}</span>`
            : '';

        card.innerHTML = `
            <div class="shrink-0">${pointBtn}</div>
            <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1 overflow-hidden" style="flex-wrap:nowrap">
                    ${mCompte}
                    <span class="${badgeClass} shrink-0" style="max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${mCatLabel}</span>
                    ${t.exclu_dashboard?'<span class="badge badge-exclu shrink-0">⊘</span>':''}
                    ${dupBadge ? `<span title="Doublon probable" style="font-size:10px;flex-shrink:0">⚠️</span>` : ''}
                    <span class="text-[10px] font-semibold text-slate-600 uppercase tracking-tight truncate shrink-1 min-w-0">${mPosteLabel}</span>
                </div>
                <div class="flex items-center gap-1 mt-0.5 overflow-hidden" style="flex-wrap:nowrap">
                    <span class="text-[11px] ${t.pointe?'line-through text-slate-400':'text-slate-700'} truncate">${t.description||''}</span>
                    ${t.details ? `<span class="text-[10px] text-slate-400 italic truncate shrink-1">· ${t.details}</span>` : ''}
                </div>
            </div>
            <div class="text-right shrink-0 ml-1">
                <p class="text-[12px] font-bold mono whitespace-nowrap" style="color:${mColor}">${mText}</p>
                <p class="text-[9px] text-slate-400 mono">${affect}</p>
            </div>`;
        mobileContainer.appendChild(card);
    });

    renderTableFooter(filtered);
}

// ── Pied de tableau ──────────────────────────────────────
function renderTableFooter(filtered) {
    const tfoot = document.getElementById('pc-table-foot');
    if (!tfoot) return;
    let totalIn = 0, totalOut = 0;
    filtered.forEach(t => {
        const amt = parseFloat(t.montant) || 0;
        if (amt > 0) totalIn += amt;
        else totalOut += Math.abs(amt);
    });
    const solde = totalIn - totalOut;
    const soldeColor = solde >= 0 ? '#059669' : '#e11d48';
    tfoot.innerHTML = `
        <tr class="tfoot-row">
            <td colspan="7" class="p-3 text-right text-[11px] text-slate-400 font-semibold">${filtered.length} transaction${filtered.length>1?'s':''}</td>
            <td class="p-3 text-[11px] text-slate-500 whitespace-nowrap"></td>
            <td class="p-3 text-right whitespace-nowrap">
                <div class="flex flex-col items-end gap-0.5">
                    <span class="text-[10px] text-emerald-600 mono font-semibold">↑ +${fmt(totalIn)}</span>
                    <span class="text-[10px] text-rose-500 mono font-semibold">↓ -${fmt(totalOut)}</span>
                    <span class="text-xs mono font-bold border-t border-slate-200 pt-0.5" style="color:${soldeColor}">${solde>=0?'+':''}${fmt(solde)}</span>
                </div>
            </td>
            <td style="position:sticky;right:0;background:#f8fafc;box-shadow:-2px 0 6px rgba(15,23,42,.06)"></td>
        </tr>`;
}

// ── Détection doublons ───────────────────────────────────
function buildDuplicateSet(list) {
    const seen = new Set(), dups = new Set();
    list.forEach(t => {
        const key = `${t.date}|${parseFloat(t.montant).toFixed(2)}`;
        if (seen.has(key)) dups.add(key);
        else seen.add(key);
    });
    return dups;
}

// ── CRUD ─────────────────────────────────────────────────
function openTransactionModal(index = null) {
    populateCategorieDropdown();
    populateCompteDropdown();
    document.getElementById('transaction-form').reset();
    setExcluDashboardToggle(false);
    if (index !== null) {
        const t = transactions[index];
        document.getElementById('modal-title').textContent = "Éditer l'écriture";
        document.getElementById('edit-index').value        = index;
        document.getElementById('edit-db-id').value        = t.id || '';
        document.getElementById('form-date').value         = t.date || '';
        document.getElementById('form-affectation').value  = t.mois_affectation || getYearMonthString(t.date);
        document.getElementById('form-categorie').value    = t.categorie || '';
        updatePosteDropdown();
        document.getElementById('form-poste').value        = t.poste || '';
        updateDescriptionDropdown();
        document.getElementById('form-description').value  = t.description || '';
        document.getElementById('form-details').value      = t.details || '';
        document.getElementById('form-montant').value      = t.montant || '';
        document.getElementById('form-compte').value       = t.compte_bancaire || '';
        setExcluDashboardToggle(t.exclu_dashboard || false);
    } else {
        document.getElementById('modal-title').textContent = "Nouvelle écriture";
        document.getElementById('edit-index').value = '';
        document.getElementById('edit-db-id').value = '';
        document.getElementById('form-date').value  = new Date().toISOString().split('T')[0];
        syncDefaultAffectationMonth();
    }
    document.getElementById('transaction-modal').classList.remove('hidden');
}

function closeTransactionModal() {
    document.getElementById('transaction-modal').classList.add('hidden');
}

async function saveTransaction(e) {
    e.preventDefault();
    const idx    = document.getElementById('edit-index').value;
    const dbId   = document.getElementById('edit-db-id').value;
    const date   = document.getElementById('form-date').value;
    const montant = parseFloat(document.getElementById('form-montant').value) || 0;

    if (!dbId) {
        const dup = transactions.find(t => t.date === date && parseFloat(t.montant) === montant);
        if (dup) {
            const dupDesc = dup.description || dup.poste || 'sans description';
            const msg = `Une transaction de ${montant < 0 ? '' : '+'}${fmt(montant)} existe déjà le ${date} (${dupDesc}).\n\nIl peut s'agir d'un doublon. Souhaitez-vous vraiment créer cette nouvelle écriture ?`;
            const confirmed = await showDuplicateModal(msg);
            if (!confirmed) return;
        }
    }

    const payload = {
        date,
        mois_affectation: document.getElementById('form-affectation').value,
        categorie:        document.getElementById('form-categorie').value,
        poste:            document.getElementById('form-poste').value,
        description:      document.getElementById('form-description').value,
        details:          document.getElementById('form-details').value.trim(),
        montant,
        pointe:           idx !== '' ? transactions[idx].pointe : false,
        exclu_dashboard:  document.getElementById('form-exclu-dashboard').value === 'true',
        compte_bancaire:  document.getElementById('form-compte').value || null
    };

    try {
        if (dbId) {
            const { error } = await _supabase.from('transactions').update(payload).eq('id', dbId);
            if (error) throw error;
        } else {
            const { error } = await _supabase.from('transactions').insert([payload]);
            if (error) throw error;
        }
        closeTransactionModal();
        fetchTransactionsFromCloud();
    } catch(err) { alert('Erreur de synchronisation : ' + err.message); }
}

async function deleteTransaction(index) {
    if (!confirm('Supprimer définitivement cette transaction ?')) return;
    try {
        const { error } = await _supabase.from('transactions').delete().eq('id', transactions[index].id);
        if (error) throw error;
        fetchTransactionsFromCloud();
    } catch { alert('Erreur lors de la suppression.'); }
}

// ── Édition inline ───────────────────────────────────────
function startInlineEdit(td, index, field, currentValue, isSelect, options) {
    if (td.querySelector('input,select')) return;
    td.dataset.orig = td.innerHTML;
    let input;
    if (isSelect) {
        input = document.createElement('select');
        input.className = 'inline-edit-input';
        options.forEach(o => {
            const opt = document.createElement('option');
            opt.value = o; opt.textContent = o;
            if (o === currentValue) opt.selected = true;
            input.appendChild(opt);
        });
    } else {
        input = document.createElement('input');
        input.type = field === 'montant' ? 'number' : 'text';
        if (field === 'montant') input.step = '0.01';
        input.value = currentValue;
        input.className = 'inline-edit-input';
    }
    td.innerHTML = '';
    td.appendChild(input);
    input.focus();
    if (!isSelect) input.select();

    const save = async () => {
        const val = isSelect ? input.value : (field === 'montant' ? parseFloat(input.value) : input.value.trim());
        if (val === currentValue || (field === 'montant' && val === parseFloat(currentValue))) {
            renderResponsiveTransactions(); return;
        }
        try {
            const payload = {};
            payload[field] = val;
            const { error } = await _supabase.from('transactions').update(payload).eq('id', transactions[index].id);
            if (error) throw error;
            transactions[index][field] = val;
            renderResponsiveTransactions();
            renderMainBudgetChart();
            refreshDashboard();
        } catch(err) { alert('Erreur inline : ' + err.message); renderResponsiveTransactions(); }
    };
    input.addEventListener('blur', save);
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
        if (e.key === 'Escape') { td.innerHTML = td.dataset.orig; }
    });
}

// ── Drawer détails ───────────────────────────────────────
function openDetailsDrawer(index) {
    const t = transactions[index];
    const set = (id, text, color) => { const el = document.getElementById(id); el.textContent = text; if (color) el.style.color = color; };
    set('drawer-pointage-status', t.pointe ? '🟢 Vérifiée et pointée' : '⚪ En attente', t.pointe ? '#059669' : '#d97706');
    set('drawer-exclu-dashboard',  t.exclu_dashboard ? '⊘ Exclue du dashboard' : '✓ Incluse', t.exclu_dashboard ? '#f43f5e' : '#059669');
    set('drawer-date',        t.date);
    set('drawer-affectation', t.mois_affectation || getYearMonthString(t.date));
    set('drawer-categorie',   t.categorie || '—');
    set('drawer-poste',       t.poste || '—');
    set('drawer-description', t.description || '—');
    set('drawer-compte',      t.compte_bancaire || '—');
    document.getElementById('drawer-details').textContent = t.details || 'Aucune note bancaire rattachée.';
    const amt = parseFloat(t.montant) || 0;
    set('drawer-montant', (amt > 0 ? '+' : '') + fmt(amt), amt > 0 ? '#059669' : '#0f172a');
    document.getElementById('drawer-actions-container').innerHTML = `
        <button onclick="closeDetailsDrawer();openTransactionModal(${index})" class="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition">Modifier</button>
        <button onclick="closeDetailsDrawer();deleteTransaction(${index})" class="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-xl text-xs transition">Supprimer</button>`;
    document.getElementById('details-drawer-modal').classList.remove('hidden');
}

function closeDetailsDrawer() {
    document.getElementById('details-drawer-modal').classList.add('hidden');
}
