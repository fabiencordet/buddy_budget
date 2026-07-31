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
        "ALIMENTATION": ["Courses alimentaires","Restaurant","Autres","Remboursement"],
        "HEBERGEMENT": ["Camping","Hôtel","Location","Autres","Remboursement"],
        "TRANSPORT": ["Carburant","Location","Parking","Péage","Train","Vol","Remboursement"],
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
