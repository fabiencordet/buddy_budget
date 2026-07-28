# 💰 My Buddy Budget

Application de suivi budgétaire personnel — HTML/CSS/JS vanilla + Supabase.

## Arborescence

```
my-buddy-budget/
├── index.html              # Structure HTML (DOM uniquement, sans JS ni CSS inline)
├── config.js               # ⚠️ À créer localement (voir config.example.js)
├── config.example.js       # Template de configuration Supabase
├── .gitignore
│
├── css/
│   └── style.css           # Tous les styles de l'application
│
└── js/
    ├── data.js             # Structure budgétaire (catégories / postes / descriptions)
    ├── state.js            # État global, initialisation Supabase, helpers partagés
    ├── auth.js             # Authentification (connexion, inscription, déconnexion)
    ├── cloud.js            # Fetch Supabase, init app, navigation par onglets
    ├── ui-helpers.js       # Menu paramètres, modal doublon, dropdowns, toggle
    ├── dashboard.js        # KPIs, graphique, filtres, panneaux cat/postes/desc
    ├── transactions.js     # Tableau, CRUD, édition inline, drawer détails
    ├── budget.js           # Budget prévisionnel (modal + accordéon)
    ├── csv-import.js       # Import CSV 3 étapes avec Gemini IA
    ├── annual.js           # Vue annuelle (tableau récap par année)
    ├── comptes.js          # Gestion des comptes bancaires
    └── export.js           # Export CSV (tout / mois affiché)
```

## Installation

1. Clonez le dépôt
2. Copiez `config.example.js` en `config.js` et renseignez vos clés Supabase
3. Ouvrez `index.html` dans un navigateur (ou servez via un serveur local)

> **Note :** L'application fonctionne entièrement côté client. Aucun build tool requis.

## Configuration Supabase

Créez un projet sur [supabase.com](https://supabase.com) avec les tables suivantes :

### Table `transactions`
| Colonne | Type |
|---|---|
| id | uuid (PK) |
| date | date |
| mois_affectation | text |
| categorie | text |
| poste | text |
| description | text |
| details | text |
| montant | numeric |
| pointe | boolean |
| exclu_dashboard | boolean |
| compte_bancaire | text |

### Table `budget_lines`
| Colonne | Type |
|---|---|
| id | int8 (PK) |
| poste | text |
| description | text |
| amount | numeric |

Activez Row Level Security (RLS) sur les deux tables avec une policy `auth.uid() = user_id` ou adaptez selon votre besoin.

## Personnalisation

Pour adapter la nomenclature budgétaire à votre situation, modifiez uniquement **`js/data.js`** — c'est le seul fichier à toucher.
