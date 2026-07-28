/**
 * comptes.js
 * Gestion des comptes bancaires, stockés dans les métadonnées
 * Supabase Auth (user_metadata) — pas de table supplémentaire requise.
 */

async function loadComptesBancaires() {
    try {
        const { data: { user } } = await _supabase.auth.getUser();
        comptesBancaires = user?.user_metadata?.comptes_bancaires || [];
    } catch {
        comptesBancaires = [];
    }
    populateCompteDropdown();
    populateCompteFilter();
}

async function saveComptesBancaires() {
    try {
        await _supabase.auth.updateUser({ data: { comptes_bancaires: comptesBancaires } });
    } catch(err) {
        alert('Erreur de sauvegarde : ' + err.message);
    }
}

function populateCompteDropdown() {
    const sel = document.getElementById('form-compte');
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '<option value="">— Non renseigné —</option>';
    comptesBancaires.forEach(c => {
        const o = document.createElement('option');
        o.value = c.nom; o.textContent = c.nom;
        sel.appendChild(o);
    });
    if (current) sel.value = current;
}

function populateCompteFilter() {
    const sel = document.getElementById('filter-compte');
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '<option value="">🏦 Tous les comptes</option>';
    comptesBancaires.forEach(c => {
        const o = document.createElement('option');
        o.value = c.nom; o.textContent = '🏦 ' + c.nom;
        sel.appendChild(o);
    });
    if (current) sel.value = current;
}

function openComptesBancairesModal() {
    renderComptesBancairesList();
    document.getElementById('comptes-modal').classList.remove('hidden');
}

function closeComptesBancairesModal() {
    document.getElementById('comptes-modal').classList.add('hidden');
    document.getElementById('new-compte-input').value = '';
}

function renderComptesBancairesList() {
    const list  = document.getElementById('comptes-list');
    const empty = document.getElementById('comptes-empty');
    list.innerHTML = '';
    if (!comptesBancaires.length) { empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden');
    comptesBancaires.forEach((c, i) => {
        const item = document.createElement('div');
        item.className = 'flex items-center gap-2 p-3 rounded-xl border border-slate-100 bg-slate-50 group';
        item.innerHTML = `
            <span class="text-base">🏦</span>
            <input type="text" value="${c.nom}"
                class="flex-grow text-xs font-semibold text-slate-700 bg-transparent outline-none border-b border-transparent focus:border-slate-300 transition"
                onchange="renameCompte(${i}, this.value)"
                onblur="renameCompte(${i}, this.value)">
            <button onclick="deleteCompte(${i})"
                class="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 text-lg font-light leading-none transition"
                title="Supprimer">×</button>`;
        list.appendChild(item);
    });
}

async function addCompteBancaire() {
    const input = document.getElementById('new-compte-input');
    const nom   = input.value.trim();
    if (!nom) return;
    if (comptesBancaires.find(c => c.nom.toLowerCase() === nom.toLowerCase())) { input.value = ''; return; }
    comptesBancaires.push({ id: Date.now(), nom });
    input.value = '';
    await saveComptesBancaires();
    renderComptesBancairesList();
    populateCompteDropdown();
    populateCompteFilter();
}

async function renameCompte(index, newName) {
    const nom = newName.trim();
    if (!nom || comptesBancaires[index]?.nom === nom) return;
    comptesBancaires[index].nom = nom;
    await saveComptesBancaires();
    populateCompteDropdown();
    populateCompteFilter();
}

async function deleteCompte(index) {
    if (!confirm(`Supprimer le compte "${comptesBancaires[index].nom}" ?`)) return;
    comptesBancaires.splice(index, 1);
    await saveComptesBancaires();
    renderComptesBancairesList();
    populateCompteDropdown();
    populateCompteFilter();
}
