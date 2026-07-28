/**
 * budget.js
 * Gestion du budget prévisionnel : modal de configuration,
 * sauvegarde Supabase, rendu accordéon catégorie > poste > description.
 */

async function saveBudgetLines() {
    if (!_supabase || !currentUser) return;
    await _supabase.from('budget_lines').delete().neq('id', 0);
    if (budgetLines.length) {
        const rows = budgetLines.map(b => ({ poste: b.poste, description: b.description || '', amount: b.amount }));
        const { error } = await _supabase.from('budget_lines').insert(rows);
        if (error) console.error('Erreur save budget_lines:', error.message);
    }
}

function openBudgetModal() {
    const sel = document.getElementById('budget-poste-select');
    sel.innerHTML = '';
    const allPostes = [...new Set(Object.values(budgetStructure).flatMap(c => Object.keys(c)))].sort();
    allPostes.forEach(p => {
        const o = document.createElement('option');
        o.value = p; o.textContent = p;
        sel.appendChild(o);
    });
    renderBudgetLinesList();
    document.getElementById('budget-modal').classList.remove('hidden');
}

function closeBudgetModal() {
    document.getElementById('budget-modal').classList.add('hidden');
    refreshDashboard();
}

function addBudgetLine() {
    const poste  = document.getElementById('budget-poste-select').value;
    const amount = parseFloat(document.getElementById('budget-amount-input').value);
    if (!poste || isNaN(amount) || amount <= 0) { alert('Sélectionnez un poste et un montant valide.'); return; }
    const existing = budgetLines.findIndex(b => b.poste === poste);
    if (existing >= 0) budgetLines[existing].amount = amount;
    else budgetLines.push({ poste, amount });
    document.getElementById('budget-amount-input').value = '';
    saveBudgetLines();
    renderBudgetLinesList();
}

function deleteBudgetLine(index) {
    budgetLines.splice(index, 1);
    saveBudgetLines();
    renderBudgetLinesList();
}

function renderBudgetLinesList() {
    const list  = document.getElementById('budget-lines-list');
    const empty = document.getElementById('budget-lines-empty');
    list.innerHTML = '';
    if (!budgetLines.length) { empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden');
    budgetLines.forEach((b, i) => {
        const item = document.createElement('div');
        item.className = 'flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50';
        item.innerHTML = `
            <div class="flex-1"><p class="text-xs font-semibold text-slate-700">${b.poste}</p></div>
            <input type="number" min="0" step="10" value="${b.amount}"
                class="field mono text-right w-24 text-xs"
                onchange="budgetLines[${i}].amount=parseFloat(this.value)||0;saveBudgetLines();renderBudgetLinesList()">
            <span class="text-[11px] text-slate-400">€/mois</span>
            <button onclick="deleteBudgetLine(${i})" class="text-rose-400 hover:text-rose-600 text-lg font-light leading-none transition">×</button>`;
        list.appendChild(item);
    });
}

function setBudgetAmount(poste, description, amount) {
    const key = poste.toUpperCase().trim() + '||' + (description || '').toUpperCase().trim();
    const idx = budgetLines.findIndex(b => b.key === key);
    if (amount <= 0) {
        if (idx >= 0) budgetLines.splice(idx, 1);
    } else {
        if (idx >= 0) budgetLines[idx].amount = amount;
        else budgetLines.push({ key, poste: poste.toUpperCase().trim(), description: (description || '').toUpperCase().trim(), amount });
    }
    saveBudgetLines();
}

// ── Rendu accordéon prévisionnel ────────────────────────
function renderBudgetPrevisionnel(activeMonth) {
    const container = document.getElementById('budget-previsionnel-container');
    if (!container) return;

    const spentByDesc = {}, spentByPoste = {};
    transactions.forEach(t => {
        if (t.exclu_dashboard) return;
        const m = t.mois_affectation || getYearMonthString(t.date);
        if (m !== activeMonth) return;
        const amt = parseFloat(t.montant) || 0;
        if (amt >= 0) return;
        const p = (t.poste || '').toUpperCase().trim();
        const d = (t.description || '').toUpperCase().trim();
        const k = p + '||' + d;
        spentByDesc[k]  = (spentByDesc[k]  || 0) + Math.abs(amt);
        spentByPoste[p] = (spentByPoste[p] || 0) + Math.abs(amt);
    });

    let totalBudget = 0, totalActual = 0;
    budgetLines.forEach(b => {
        totalBudget += b.amount;
        const spent = b.description
            ? (spentByDesc[b.poste + '||' + b.description] || 0)
            : (spentByPoste[b.poste] || 0);
        totalActual += Math.min(spent, b.amount);
    });

    container.innerHTML = '';

    // Ligne total
    const totalOver = totalActual > totalBudget;
    const totalPct  = totalBudget > 0 ? Math.min(Math.round(totalActual / totalBudget * 100), 100) : 0;
    const totalColor = totalOver ? '#e11d48' : '#0f172a';
    const totalRow = document.createElement('div');
    totalRow.className = 'flex items-center justify-between gap-2 px-1 pb-3 mb-2 border-b border-slate-200';
    totalRow.innerHTML = `
        <span class="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Total prévu</span>
        <div class="flex items-center gap-2 shrink-0">
            <span class="mono text-sm font-bold" style="color:${totalColor}">${fmt(totalActual)}</span>
            <span class="text-[10px] text-slate-400">/ ${fmt(totalBudget)}</span>
            <span class="text-[10px] font-bold mono" style="color:${totalColor}">${totalPct}%</span>
        </div>`;
    container.appendChild(totalRow);

    Object.entries(budgetStructure).forEach(([cat, postes]) => {
        let catBudget = 0, catActual = 0;
        Object.entries(postes).forEach(([poste, descs]) => {
            const pk = poste.toUpperCase().trim();
            descs.forEach(desc => {
                const dk = pk + '||' + desc.toUpperCase().trim();
                const b = budgetLines.find(x => x.key === dk);
                if (b) { catBudget += b.amount; catActual += Math.min(spentByDesc[dk] || 0, b.amount); }
            });
        });
        const catOver  = catActual > catBudget && catBudget > 0;
        const catWarn  = catBudget > 0 && Math.round(catActual / catBudget * 100) >= 80 && !catOver;
        const catColor = catOver ? '#e11d48' : (catWarn ? '#d97706' : '#059669');
        const catIcon  = catOver ? '🔴' : (catWarn ? '🟡' : '🟢');

        const catWrap   = document.createElement('div');
        catWrap.className = 'border border-slate-100 rounded-xl mb-2 overflow-hidden';

        const catHeader = document.createElement('div');
        catHeader.className = 'flex items-center justify-between gap-2 px-3 py-2.5 cursor-pointer bg-slate-50 hover:bg-slate-100 transition select-none';
        catHeader.innerHTML = `
            <div class="flex items-center gap-2 min-w-0">
                <span class="text-base transition-transform duration-200 accordion-arrow">▶</span>
                <span class="text-[11px] font-bold text-slate-700 uppercase tracking-tight truncate">${cat}</span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
                ${catBudget > 0
                    ? `<span>${catIcon}</span><span class="mono text-[11px] font-bold" style="color:${catColor}">${fmt(catActual)}</span><span class="text-[10px] text-slate-400">/ ${fmt(catBudget)}</span>`
                    : '<span class="text-[10px] text-slate-400 italic">non budgété</span>'}
            </div>`;

        const catBody = document.createElement('div');
        catBody.className = 'hidden px-2 pb-2 pt-1 space-y-1';

        Object.entries(postes).forEach(([poste, descs]) => {
            const pk = poste.toUpperCase().trim();
            let posteBudget = 0, posteActual = 0;
            descs.forEach(desc => {
                const dk = pk + '||' + desc.toUpperCase().trim();
                const b = budgetLines.find(x => x.key === dk);
                if (b) { posteBudget += b.amount; posteActual += Math.min(spentByDesc[dk] || 0, b.amount); }
            });
            const posteOver  = posteActual > posteBudget && posteBudget > 0;
            const posteWarn  = posteBudget > 0 && Math.round(posteActual / posteBudget * 100) >= 80 && !posteOver;
            const posteColor = posteOver ? '#e11d48' : (posteWarn ? '#d97706' : '#059669');
            const posteIcon  = posteOver ? '🔴' : (posteWarn ? '🟡' : '🟢');

            const posteWrap   = document.createElement('div');
            posteWrap.className = 'border border-slate-100 rounded-lg overflow-hidden';

            const posteHeader = document.createElement('div');
            posteHeader.className = 'flex items-center justify-between gap-2 px-3 py-2 cursor-pointer bg-white hover:bg-slate-50 transition select-none';
            posteHeader.innerHTML = `
                <div class="flex items-center gap-2 min-w-0">
                    <span class="text-xs transition-transform duration-200 accordion-arrow">▶</span>
                    <span class="text-[11px] font-semibold text-slate-600 uppercase tracking-tight truncate">${poste}</span>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    ${posteBudget > 0
                        ? `<span>${posteIcon}</span><span class="mono text-[11px] font-bold" style="color:${posteColor}">${fmt(posteActual)}</span><span class="text-[10px] text-slate-400">/ ${fmt(posteBudget)}</span>`
                        : '<span class="text-[10px] text-slate-400 italic">—</span>'}
                </div>`;

            const posteBody = document.createElement('div');
            posteBody.className = 'hidden px-2 pb-2 pt-1 space-y-1';

            descs.forEach(desc => {
                const dk     = pk + '||' + desc.toUpperCase().trim();
                const b      = budgetLines.find(x => x.key === dk);
                const budget = b ? b.amount : 0;
                const actual = Math.min(spentByDesc[dk] || 0, budget);
                const pct    = budget > 0 ? Math.min(Math.round(actual / budget * 100), 100) : 0;
                const over   = (spentByDesc[dk] || 0) > budget && budget > 0;
                const warn   = pct >= 80 && !over;
                const dColor = over ? '#e11d48' : (warn ? '#d97706' : '#059669');
                const dIcon  = over ? '🔴' : (warn ? '🟡' : '🟢');
                const barClass = over ? 'budget-over' : (warn ? 'budget-warn' : 'budget-ok');

                const descWrap = document.createElement('div');
                descWrap.className = 'rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 space-y-1.5';

                const descTop = document.createElement('div');
                descTop.className = 'flex items-center justify-between gap-2';
                descTop.innerHTML = `
                    <div class="flex items-center gap-1.5 min-w-0">
                        ${budget > 0 ? `<span class="text-xs">${dIcon}</span>` : ''}
                        <span class="text-[11px] text-slate-600 truncate">${desc}</span>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                        ${budget > 0 ? `<span class="mono text-[11px] font-bold" style="color:${dColor}">${fmt(actual)}</span><span class="text-[10px] text-slate-400">/ </span>` : ''}
                        <input type="number" min="0" step="10" value="${budget || ''}" placeholder="0"
                            class="field mono text-right w-20 text-[11px] py-0.5 px-1.5"
                            title="Budget mensuel pour ${desc}"
                            onchange="setBudgetAmount('${poste.replace(/'/g,"\\'")}','${desc.replace(/'/g,"\\'")}',parseFloat(this.value)||0);renderBudgetPrevisionnel(document.getElementById('dashboard-month-select')?.value||'');renderMainBudgetChart();">
                        <span class="text-[10px] text-slate-400">€</span>
                    </div>`;
                descWrap.appendChild(descTop);
                if (budget > 0) {
                    const barRow = document.createElement('div');
                    barRow.innerHTML = `<div class="budget-prog-track"><div class="budget-prog-fill ${barClass}" style="width:${pct}%"></div></div>`;
                    descWrap.appendChild(barRow);
                }
                posteBody.appendChild(descWrap);
            });

            posteHeader.addEventListener('click', () => {
                const open = !posteBody.classList.contains('hidden');
                posteBody.classList.toggle('hidden', open);
                posteHeader.querySelector('.accordion-arrow').style.transform = open ? '' : 'rotate(90deg)';
            });
            posteWrap.appendChild(posteHeader);
            posteWrap.appendChild(posteBody);
            catBody.appendChild(posteWrap);
        });

        catHeader.addEventListener('click', () => {
            const open = !catBody.classList.contains('hidden');
            catBody.classList.toggle('hidden', open);
            catHeader.querySelector('.accordion-arrow').style.transform = open ? '' : 'rotate(90deg)';
        });
        catWrap.appendChild(catHeader);
        catWrap.appendChild(catBody);
        container.appendChild(catWrap);
    });
}
