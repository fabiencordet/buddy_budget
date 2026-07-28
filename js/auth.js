/**
 * auth.js
 * Gestion de l'authentification Supabase (connexion, inscription, déconnexion).
 */

function getFriendlyAuthErrorMessage(err) {
    const msg = (err?.message || '').toLowerCase();
    if (!msg) return "Une erreur d'authentification est survenue.";
    if (msg.includes('invalid login credentials')) return 'Email ou mot de passe incorrect.';
    if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
        return "Votre e-mail n'est pas confirmé. Vérifiez votre boîte mail puis réessayez.";
    }
    if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('fetch')) {
        return 'Connexion impossible au serveur. Vérifiez votre réseau et la configuration Supabase.';
    }
    return err.message;
}

if (_supabase?.auth) {
    _supabase.auth.onAuthStateChange((event, session) => {
        currentUser = session?.user || null;
        currentUser ? showApp() : showAuth();
    });
} else {
    // Permet d'afficher un message explicite quand config.js est absent ou invalide.
    showAuth();
    showAuthMessage('Configuration Supabase manquante ou invalide (config.js).');
}

function showAuth() {
    document.getElementById('auth-page').classList.remove('hidden');
    document.getElementById('app-content').classList.add('hidden');
    transactions = [];
    if (budgetChartInstance) { budgetChartInstance.destroy(); budgetChartInstance = null; }
}

function showApp() {
    document.getElementById('auth-page').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    document.getElementById('settings-user-email').textContent = currentUser?.email || '';
    initApp();
}

function switchAuthMode(mode) {
    const isLogin = mode === 'login';
    document.getElementById('auth-login-view').classList.toggle('hidden', !isLogin);
    document.getElementById('auth-signup-view').classList.toggle('hidden', isLogin);
    document.getElementById('auth-tab-login').classList.toggle('active', isLogin);
    document.getElementById('auth-tab-signup').classList.toggle('active', !isLogin);
    clearAuthMessage();
}

function showAuthMessage(text, isError = true) {
    const el = document.getElementById('auth-message');
    el.textContent = text;
    el.className = `mt-3 text-xs text-center font-medium rounded-lg py-2 px-3 ${isError ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`;
    el.classList.remove('hidden');
}

function clearAuthMessage() {
    document.getElementById('auth-message').classList.add('hidden');
}

function setAuthLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    btn.disabled = loading;
    btn.innerHTML = loading
        ? '<span class="spinner"></span>'
        : (btnId === 'btn-signin' ? 'Se connecter' : 'Créer mon compte');
}

async function signIn() {
    if (!_supabase?.auth) {
        showAuthMessage('Configuration Supabase manquante ou invalide (config.js).');
        return;
    }
    const email = document.getElementById('login-email').value.trim();
    const pwd   = document.getElementById('login-password').value;
    if (!email || !pwd) { showAuthMessage('Veuillez remplir tous les champs.'); return; }
    setAuthLoading('btn-signin', true); clearAuthMessage();
    try {
        const { error } = await _supabase.auth.signInWithPassword({ email, password: pwd });
        if (error) throw error;
    } catch(err) {
        showAuthMessage(getFriendlyAuthErrorMessage(err));
        setAuthLoading('btn-signin', false);
    }
}

async function signUp() {
    if (!_supabase?.auth) {
        showAuthMessage('Configuration Supabase manquante ou invalide (config.js).');
        return;
    }
    const email   = document.getElementById('signup-email').value.trim();
    const pwd     = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    if (!email || !pwd || !confirm) { showAuthMessage('Veuillez remplir tous les champs.'); return; }
    if (pwd !== confirm) { showAuthMessage('Les mots de passe ne correspondent pas.'); return; }
    if (pwd.length < 8)  { showAuthMessage('Le mot de passe doit faire au moins 8 caractères.'); return; }
    setAuthLoading('btn-signup', true); clearAuthMessage();
    try {
        const { error } = await _supabase.auth.signUp({ email, password: pwd });
        if (error) throw error;
        showAuthMessage('Compte créé ! Vérifiez votre e-mail pour confirmer votre inscription.', false);
        setAuthLoading('btn-signup', false);
    } catch(err) {
        showAuthMessage(getFriendlyAuthErrorMessage(err));
        setAuthLoading('btn-signup', false);
    }
}

async function signOut() {
    if (!_supabase?.auth) return;
    await _supabase.auth.signOut();
}
