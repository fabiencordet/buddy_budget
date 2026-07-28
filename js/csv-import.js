/**
 * csv-import.js
 * Pipeline d'import CSV en 3 étapes :
 *   1. Parsing du fichier et détection des colonnes
 *   2. Catégorisation via l'API Gemini (avec fallback multi-modèles)
 *   3. Prévisualisation et sauvegarde en base Supabase
 */

let csvHeaders = [];
let csvRows    = [];
let tempImportedTransactions = [];

const GEMINI_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
];

// ── Étape 1 : parsing ────────────────────────────────────
function detectSeparator(text) {
    const line = text.split('\n')[0];
    const counts = {
        ';': (line.match(/;/g)  || []).length,
        ',': (line.match(/,/g)  || []).length,
        '\t':(line.match(/\t/g) || []).length,
    };
    return Object.keys(counts).reduce((a, b) => counts[a] >= counts[b] ? a : b);
}

function parseCSVLine(line, sep) {
    const result = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') { inQ = !inQ; }
        else if (line[i] === sep && !inQ) { result.push(cur.trim()); cur = ''; }
        else { cur += line[i]; }
    }
    result.push(cur.trim());
    return result.map(v => v.replace(/^"|"$/g, '').trim());
}

function parseDate(str) {
    if (!str) return null;
    str = str.replace(/['"]/g, '').trim();
    if (/^\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}$/.test(str)) {
        const p = str.split(/[\/\-\.]/);
        return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
    }
    if (/^\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2}/.test(str)) return str.substring(0,10).replace(/\//g,'-');
    return null;
}

function parseMontant(str) {
    if (!str) return null;
    let s = str.replace(/[€$£\u00a0\s]/g, '');
    if (/^\-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g,'').replace(',','.');
    else s = s.replace(',','.');
    const v = parseFloat(s);
    return isNaN(v) ? null : v;
}

function autoDetectCol(headers, type) {
    const lc = headers.map(h => h.toLowerCase());
    const matchers = {
        date:    ['date','jour','valeur','opération'],
        details: ['libellé','libelle','label','description','opération','operation','motif'],
        montant: ['montant','amount','débit','credit','solde','valeur'],
    };
    const idx = lc.findIndex(h => (matchers[type] || []).some(k => h.includes(k)));
    return idx >= 0 ? idx : -1;
}

function parseCSV() {
    const file = document.getElementById('csv-file-input').files[0];
    if (!file) { alert('Sélectionnez un fichier CSV.'); return; }
    const reader = new FileReader();
    reader.onload = e => {
        const text = e.target.result;
        const sep  = detectSeparator(text);
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        csvHeaders = parseCSVLine(lines[0], sep);
        csvRows    = lines.slice(1).map(l => parseCSVLine(l, sep)).filter(r => r.length >= csvHeaders.length && r.some(c => c));

        const populateSelect = (id, type) => {
            const sel = document.getElementById(id);
            sel.innerHTML = '<option value="">— choisir —</option>';
            csvHeaders.forEach((h, i) => {
                const o = document.createElement('option');
                o.value = i; o.textContent = h || `Colonne ${i+1}`;
                sel.appendChild(o);
            });
            const auto = autoDetectCol(csvHeaders, type);
            if (auto >= 0) sel.value = auto;
        };
        populateSelect('map-date',    'date');
        populateSelect('map-details', 'details');
        populateSelect('map-montant', 'montant');

        const sample = csvRows.slice(0,3).map(r => r.join(' | ')).join(' → ');
        document.getElementById('csv-sample').textContent = `Aperçu : ${sample}`;
        document.getElementById('csv-mapping-container').classList.remove('hidden');
        document.getElementById('csv-preview-container').classList.add('hidden');
    };
    reader.onerror = () => alert('Impossible de lire le fichier.');
    reader.readAsText(file, 'UTF-8');
}

// ── Étape 2 : catégorisation Gemini ─────────────────────
async function processCSVLines() {
    const dateIdx    = parseInt(document.getElementById('map-date').value);
    const detailIdx  = parseInt(document.getElementById('map-details').value);
    const montantIdx = parseInt(document.getElementById('map-montant').value);
    if (isNaN(dateIdx) || isNaN(detailIdx) || isNaN(montantIdx)) {
        alert('Veuillez associer les 3 colonnes (Date, Libellé, Montant).');
        return;
    }
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) { alert('Clé Gemini manquante — configurez-la dans ⚙️ Paramètres.'); return; }

    const raw = csvRows
        .map(row => ({ date: parseDate(row[dateIdx] || ''), details: (row[detailIdx] || '').trim(), montant: parseMontant(row[montantIdx] || '') }))
        .filter(t => t.date && t.montant !== null);

    if (!raw.length) { alert('Aucune transaction valide trouvée. Vérifiez le mapping des colonnes.'); return; }

    const btn = document.getElementById('btn-process-csv');
    const setBtnState = (loading, text) => {
        btn.disabled = loading;
        btn.innerHTML = loading ? `<span class="spinner"></span> ${text}` : `🤖 ${text}`;
    };
    setBtnState(true, 'Analyse en cours…');

    try {
        tempImportedTransactions = [];
        const BATCH = 20;
        for (let i = 0; i < raw.length; i += BATCH) {
            setBtnState(true, `${Math.min(i+BATCH,raw.length)} / ${raw.length} lignes traitées…`);
            const result = await callGeminiCategorize(raw.slice(i, i + BATCH), apiKey);
            tempImportedTransactions.push(...result);
        }
        renderCSVPreview(tempImportedTransactions);
        document.getElementById('csv-preview-container').classList.remove('hidden');
        setBtnState(false, 'Relancer la catégorisation');
    } catch(err) {
        alert('Erreur Gemini : ' + err.message);
        setBtnState(false, 'Catégoriser via Gemini IA');
    }
}

async function callGeminiCategorize(batch, apiKey) {
    const structureStr = JSON.stringify(budgetStructure);
    const txList = batch.map((t, i) => `${i}|${t.details}|${t.montant > 0 ? '+' : ''}${t.montant}`).join('\n');
    const prompt =
`Tu es un assistant comptable français. Classe chaque transaction dans la structure budgétaire ci-dessous.

STRUCTURE (JSON) :
${structureStr}

TRANSACTIONS (format: index|libellé|montant) :
${txList}

RÈGLES STRICTES :
1. Utilise EXACTEMENT les noms de la structure (copie-colle, respecte majuscules et accents).
2. Montant positif inconnu → REVENUS / REVENUS FABIEN / Remboursement
3. Montant négatif inconnu → DÉPENSES QUOTIDIENNES / SHOPPING / Amazon divers
4. Réponds UNIQUEMENT avec un tableau JSON valide, sans markdown ni texte autour.

FORMAT DE RÉPONSE :
[{"index":0,"categorie":"...","poste":"...","description":"..."},...]`;

    const body = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
    });

    let lastError = null;
    for (const model of GEMINI_MODELS) {
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }
                );
                if (res.status === 429 || res.status === 503) {
                    lastError = `HTTP ${res.status}`;
                    if (attempt === 1) { await new Promise(r => setTimeout(r, 4000)); continue; }
                    break;
                }
                if (!res.ok) { lastError = `HTTP ${res.status}`; break; }

                const data  = await res.json();
                const raw   = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
                const clean = raw.replace(/```json|```/gi, '').trim();
                let classified = [];
                try { classified = JSON.parse(clean); } catch { classified = []; }

                return batch.map((t, i) => {
                    const match = classified.find(c => c.index === i) || {};
                    return {
                        ...t,
                        categorie:        match.categorie   || 'DÉPENSES QUOTIDIENNES',
                        poste:            match.poste       || 'SHOPPING',
                        description:      match.description || 'Amazon divers',
                        mois_affectation: getYearMonthString(t.date),
                        pointe:           false,
                        exclu_dashboard:  false,
                    };
                });
            } catch(networkErr) { lastError = networkErr.message; break; }
        }
    }
    throw new Error(`Tous les modèles Gemini sont indisponibles. Dernière erreur : ${lastError}`);
}

// ── Étape 3 : prévisualisation ───────────────────────────
function renderCSVPreview(list) {
    const tbody = document.getElementById('csv-preview-tbody');
    tbody.innerHTML = '';
    list.forEach((t, i) => {
        const amt        = parseFloat(t.montant) || 0;
        const mColor     = amt > 0 ? '#059669' : '#e11d48';
        const badgeClass = categoryBadgeClass[(t.categorie||'').toUpperCase().trim()] || 'badge badge-default';
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-50 hover:bg-slate-50 transition-colors';
        tr.innerHTML = `
            <td class="p-2 mono text-[10px] text-slate-400 whitespace-nowrap">${t.date}</td>
            <td class="p-2 text-[10px] text-slate-500 max-w-[180px] truncate" title="${t.details}">${t.details}</td>
            <td class="p-2 whitespace-nowrap"><span class="${badgeClass}">${t.categorie}</span></td>
            <td class="p-2 text-[10px] font-semibold text-slate-600 uppercase whitespace-nowrap">${t.poste}</td>
            <td class="p-2 text-[10px] text-slate-500 whitespace-nowrap">${t.description}</td>
            <td class="p-2 text-right mono text-[10px] font-bold whitespace-nowrap" style="color:${mColor}">${amt > 0 ? '+' : ''}${fmt(amt)}</td>
            <td class="p-2 text-center">
                <button onclick="removeImportRow(${i})"
                    class="w-5 h-5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-400 hover:text-rose-600 text-xs font-bold transition leading-none flex items-center justify-center mx-auto">×</button>
            </td>`;
        tbody.appendChild(tr);
    });
    const n = list.length;
    const cnt = document.getElementById('csv-import-count');
    if (cnt) cnt.textContent = `${n} transaction${n > 1 ? 's' : ''} prête${n > 1 ? 's' : ''}`;
}

function removeImportRow(index) {
    tempImportedTransactions.splice(index, 1);
    renderCSVPreview(tempImportedTransactions);
}

async function saveImportedTransactions() {
    if (!tempImportedTransactions.length) { alert('Aucune transaction à importer.'); return; }
    const btn = document.getElementById('btn-save-import');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="border-top-color:#fff;width:14px;height:14px;border-width:2px"></span>';
    try {
        const payload = tempImportedTransactions.map(t => ({
            date:             t.date,
            mois_affectation: t.mois_affectation || getYearMonthString(t.date),
            categorie:        t.categorie,
            poste:            t.poste,
            description:      t.description,
            details:          t.details,
            montant:          parseFloat(t.montant),
            pointe:           false,
            exclu_dashboard:  false,
        }));
        const { error } = await _supabase.from('transactions').insert(payload);
        if (error) throw error;
        const n = payload.length;
        toggleImportZone();
        tempImportedTransactions = [];
        document.getElementById('csv-preview-container').classList.add('hidden');
        document.getElementById('csv-mapping-container').classList.add('hidden');
        await fetchTransactionsFromCloud();
        alert(`✅ ${n} transaction${n > 1 ? 's' : ''} importée${n > 1 ? 's' : ''} avec succès !`);
    } catch(err) {
        alert('Erreur lors de la sauvegarde : ' + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '💾 Importer';
    }
}
