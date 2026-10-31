/**
 * data.js
 * Structure budgétaire : source de vérité pour catégories, postes et descriptions.
 * À modifier ici pour adapter la nomenclature à votre situation personnelle.
 */

const budgetStructure = {
    "REVENUS": {
        "REVENUS FABIEN": ["Revenu principal","chômage","frais km","Remboursement"],
        "REVENUS MARINA": ["Revenu secondaire","Remboursement"],
        "CAF": ["Prestations familiales","Remboursement"],
    },
    "PRÉLEVÈMENTS (FIXES)": {
        "ABONNEMENTS TV": ["Deezer","Disney Plus","Molotov","Netflix","Autres","Remboursement"],
        "ASSURANCES": ["Juridique","Maison / Auto","Prévoyance","Mutuelle","Remboursement"],
        "BANQUE": ["SG","Fortuneo","Boursobank","Remboursement"],
        "ECOLE": ["Collège"],
        "ÉNERGIE": ["Eau","Gaz","Electricité","Remboursement"],
        "IMPÔTS": ["Fonciers","Revenus","Remboursement"],
        "INVESTISSEMENT IMMO": ["SCI Lille","Remboursement"],
        "MAISON": ["Emprunt principal","Assurance prêt immo","Remboursement"],
        "MÉNAGE ET URSSAF": ["Lina","Remboursement"],
        "TELEPHONIE, INTERNET": ["SFR, Emile","Free, Internet","SFR, Fabien perso","SFR, Fabien pro","Free, Mobile Marina","Remboursement"],
        "VOITURE": ["5008","e-C3","Remboursement"],
    },
    "DÉPENSES QUOTIDIENNES": {
        "ALIMENTATION": ["Courses alimentaires","Snacking","Remboursement"],
        "ANIMAUX": ["Nourriture","Vétérinaire","Remboursement"],
        "CADEAUX": ["Événements / Fêtes","Remboursement"],
        "CHÈQUES": ["Suivi chèques émis","Remboursement"],
        "ESTHÉTIQUE & SOINS": ["Coiffeur","Cosmétique","Remboursement"],
        "LOISIRS": ["Sorties","Remboursement"],
        "SANTÉ": ["Médecin","Pharmacie","Dentaire","Optique","Labo","Remboursement"],
        "SHOPPING": ["Amazon divers","Vêtements","Maison","Fournitures Boulot","Remboursement"],
        "VOITURE": ["Carburant","Carburant PRO","Entretien","Parking","Péage","Remboursement","Réparation"],
    },
    "ÉPARGNE": {
        "ÉPARGNE": ["Épargne, Ménage","Épargne, Leonie","Épargne, Emile","Remboursement"],
    },
    "PATIN": {
        "STAGE": ["Stage","Remboursement"],
        "DÉPLACEMENT": ["Déplacement","Remboursement"],
        "CAFÉTÉRIA": ["Cafétéria","Remboursement"],
        "ÉQUIPEMENTS": ["Équipements","Remboursement"],
        "COTISATION": ["Cotisation","Remboursement"],
    },
    "VACANCES": {
        "AUTRES DEPENSES": ["Activité","Visite","Achats","Autres","Remboursement"],
        "ALIMENTATION VACANCES": ["Courses alimentaires","Restaurant","Autres","Remboursement"],
        "HEBERGEMENT": ["Camping","Hôtel","Location","Autres","Remboursement"],
        "TRANSPORT": ["Carburant","Location","Parking","Péage","Train","Vol","Remboursement"],
    },
};

/**
 * Budgets prévisionnels par défaut.
 *
 * Structure attendue :
 * Catégorie > Poste > Description > Montant mensuel
 *
 * Exemple :
 * "PRÉLEVÈMENTS (FIXES)": {
 *     "BANQUE": {
 *         "SG": 12.5
 *     }
 * }
 *
 * Si un montant est modifié dans l'interface, la valeur enregistrée prend le dessus
 * et sera reprise les mois suivants.
 */
const defaultForecastBudgets = {
    "REVENUS": {
        "REVENUS FABIEN": {
            "Revenu principal": 0,
            "chômage": 0,
            "frais km": 0,
            "Remboursement": 0,
        },
        "REVENUS MARINA": {
            "Revenu secondaire": 0,
            "Remboursement": 0,
        },
        "CAF": {
            "Prestations familiales": 76.13,
            "Remboursement": 0,
        },
    },
    "PRÉLEVÈMENTS (FIXES)": {
        "ABONNEMENTS TV": {
            "Deezer": 19.99,
            "Disney Plus": 0,
            "Molotov": 7.99,
            "Netflix": 0,
            "Autres": 28.95,
            "Remboursement": 0,
        },
        "ASSURANCES": {
            "Juridique": 0,
            "Maison / Auto": 227.99,
            "Prévoyance": 0,
            "Mutuelle": 0,
            "Remboursement": 0,
        },
        "BANQUE": {
            "SG": 26,
            "Fortuneo": 0,
            "Boursobank": 0.99,
            "Remboursement": 0,
        },
        "ECOLE": {
            "Collège": 0,
        },
        "ÉNERGIE": {
            "Eau": 69.58,
            "Gaz": 228,
            "Electricité": 165,
            "Remboursement": 0,
        },
        "IMPÔTS": {
            "Fonciers": 64,
            "Revenus": 190,
            "Remboursement": 0,
        },
        "INVESTISSEMENT IMMO": {
            "SCI Lille": 0,
            "Remboursement": 0,
        },
        "MAISON": {
            "Emprunt principal": 1012,
            "Assurance prêt immo": 63.76,
            "Remboursement": 0,
        },
        "MÉNAGE ET URSSAF": {
            "Lina": 300,
            "Remboursement": 0,
        },
        "TELEPHONIE, INTERNET": {
            "SFR, Emile": 1.99,
            "Free, Internet": 29.99,
            "SFR, Fabien perso": 5.99,
            "SFR, Fabien pro": 11.99,
            "Free, Mobile Marina": 19.99,
            "Remboursement": 0,
        },
        "VOITURE": {
            "5008": 394.14,
            "e-C3": 350.82,
            "Remboursement": 0,
        },
    },
    "DÉPENSES QUOTIDIENNES": {
        "ALIMENTATION": {
            "Courses alimentaires": 900,
            "Snacking": 40,
            "Remboursement": 0,
        },
        "ANIMAUX": {
            "Nourriture": 0,
            "Vétérinaire": 0,
            "Remboursement": 0,
        },
        "CADEAUX": {
            "Événements / Fêtes": 0,
            "Remboursement": 0,
        },
        "CHÈQUES": {
            "Suivi chèques émis": 0,
            "Remboursement": 0,
        },
        "ESTHÉTIQUE & SOINS": {
            "Coiffeur": 100,
            "Cosmétique": 0,
            "Remboursement": 0,
        },
        "LOISIRS": {
            "Sorties": 0,
            "Remboursement": 0,
        },
        "SANTÉ": {
            "Médecin": 0,
            "Pharmacie": 0,
            "Dentaire": 0,
            "Optique": 0,
            "Labo": 0,
            "Remboursement": 0,
        },
        "SHOPPING": {
            "Amazon divers": 50,
            "Vêtements": 250,
            "Maison": 20,
            "Fournitures Boulot": 0,
            "Remboursement": 0,
        },
        "VOITURE": {
            "Carburant": 150,
            "Carburant PRO": 0,
            "Entretien": 0,
            "Parking": 0,
            "Péage": 0,
            "Remboursement": 0,
            "Réparation": 0,
        },
    },
    "ÉPARGNE": {
        "ÉPARGNE": {
            "Épargne, Ménage": 200,
            "Épargne, Leonie": 200,
            "Épargne, Emile": 200,
            "Remboursement": 0,
        },
    },
    "PATIN": {
        "STAGE": {
            "Stage": 0,
            "Remboursement": 0,
        },
        "DÉPLACEMENT": {
            "Déplacement": 0,
            "Remboursement": 0,
        },
        "CAFÉTÉRIA": {
            "Cafétéria": 50,
            "Remboursement": 0,
        },
        "ÉQUIPEMENTS": {
            "Équipements": 0,
            "Remboursement": 0,
        },
        "COTISATION": {
            "Cotisation": 400,
            "Remboursement": 0,
        },
    },
    "VACANCES": {
        "AUTRES DEPENSES": {
            "Activité": 0,
            "Visite": 0,
            "Achats": 0,
            "Autres": 0,
            "Remboursement": 0,
        },
        "ALIMENTATION VACANCES": {
            "Courses alimentaires": 0,
            "Restaurant": 0,
            "Autres": 0,
            "Remboursement": 0,
        },
        "HEBERGEMENT": {
            "Camping": 0,
            "Hôtel": 0,
            "Location": 0,
            "Autres": 0,
            "Remboursement": 0,
        },
        "TRANSPORT": {
            "Carburant": 0,
            "Location": 0,
            "Parking": 0,
            "Péage": 0,
            "Train": 0,
            "Vol": 0,
            "Remboursement": 0,
        },
    },
};

/** Classe CSS du badge par catégorie */
const categoryBadgeClass = {
    "REVENUS":                  "badge badge-entrees",
    "PRÉLEVÈMENTS (FIXES)":     "badge badge-prelevements",
    "ÉPARGNE":                  "badge badge-epargne",
    "DÉPENSES QUOTIDIENNES":    "badge badge-quotidien",
    "PATIN":                    "badge badge-patin",
    "VACANCES":                 "badge badge-vacances",
};

/** Couleur de la barre de progression par catégorie */
const categoryBarColor = {
    "REVENUS":                  "#10b981",
    "PRÉLEVÈMENTS (FIXES)":     "#f43f5e",
    "ÉPARGNE":                  "#f59e0b",
    "DÉPENSES QUOTIDIENNES":    "#3b82f6",
    "PATIN":                    "#8b5cf6",
    "VACANCES":                 "#06b6d4",
};
