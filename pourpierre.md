# Pour Pierre

Ce document explique comment relancer le projet sur n'importe quel ordinateur, et ce qu'on a construit ensemble en termes simples.

---

## Partie 1 — Relancer le projet sur un autre ordinateur

### Ce dont tu as besoin avant de commencer

1. **Node.js** — le moteur qui fait tourner le projet. Télécharge la version LTS sur https://nodejs.org et installe-la.
2. **Git** — pour récupérer le code. Télécharge sur https://git-scm.com et installe-le.
3. **Expo Go** — l'app à installer sur ton téléphone (iPhone ou Android). Cherche "Expo Go" dans l'App Store ou le Play Store.

---

### Étape 1 — Récupérer le projet

Ouvre un terminal (sur Windows : clique droit sur le bureau → "Ouvrir dans le terminal", ou cherche "Terminal" dans le menu démarrer) et tape :

```
git clone https://github.com/pierre-vg/visioone-bridge.git
cd visioone-bridge/app
```

---

### Étape 2 — Installer les dépendances

Toujours dans le terminal, tape :

```
npm install
```

Ça va télécharger tous les composants nécessaires. C'est normal si ça prend une minute.

---

### Étape 3 — Créer le fichier de configuration

Le fichier `.env` contient l'adresse de la carte. Il n'est pas inclus dans le projet pour des raisons de sécurité, il faut le créer manuellement.

Dans le dossier `visioone-bridge/app/`, crée un fichier appelé `.env` (exactement ce nom, avec le point devant) et colle-y ce texte :

```
EXPO_PUBLIC_VISIOONE_URL=https://pierre-vg.github.io/visioone-bridge/
```

Pour créer ce fichier rapidement depuis le terminal :

```
echo EXPO_PUBLIC_VISIOONE_URL=https://pierre-vg.github.io/visioone-bridge/ > .env
```

---

### Étape 4 — Lancer l'application

```
npx expo start
```

Un QR code s'affiche dans le terminal.

---

### Étape 5 — Ouvrir sur le téléphone

- **iPhone** : ouvre l'app Appareil photo et pointe-la vers le QR code
- **Android** : ouvre Expo Go et utilise le bouton "Scan QR code"

La carte se charge en quelques secondes. C'est bon !

---

### En cas de problème

**"Port déjà utilisé"** — tape `npx expo start --port 8083` pour utiliser un autre port.

**La carte ne charge pas** — vérifie que le fichier `.env` existe bien dans le dossier `app/` et que son contenu est exact.

**"SDK version mismatch"** — assure-toi que l'app Expo Go sur ton téléphone est à jour.

---

## Partie 2 — Ce qu'on a construit (version compréhensible)

### Le contexte

Visioglobe fabrique un produit qui s'appelle VisioOne : c'est une carte interactive en 3D pour naviguer à l'intérieur de bâtiments (hôpitaux, aéroports, centres commerciaux...). Les clients de Visioglobe veulent souvent intégrer cette carte dans leur propre application mobile.

L'objectif de ce projet était de montrer comment faire ça concrètement, avec un exemple qui fonctionne vraiment.

---

### Ce qu'on a construit

On a créé **deux choses qui fonctionnent ensemble** :

#### 1. La carte (la page web)
La carte VisioOne tourne dans une page web hébergée sur internet, à l'adresse `pierre-vg.github.io/visioone-bridge`. Cette page charge la carte en 3D, gère l'affichage, et attend des instructions.

On a fait en sorte que cette page soit "sobre" pour une intégration mobile : l'interface par défaut de VisioOne est masquée (à l'exception du sélecteur d'étage), et c'est l'app mobile qui contrôle tout.

#### 2. L'application mobile (l'app React Native)
C'est une application qui s'affiche sur le téléphone. Elle affiche la carte en plein écran, et en bas on peut ouvrir un panneau de contrôles pour interagir avec la carte.

---

### Comment les deux se parlent

La carte et l'app mobile ne sont pas dans le même endroit — l'une est sur internet, l'autre sur le téléphone. Pour qu'elles puissent se parler, on a construit un **pont de communication** (un "bridge").

Imagine que la carte et l'app s'envoient des petits messages texte. Par exemple :

- L'app dit à la carte : *"Recherche un endroit qui s'appelle cafeteria"*
- La carte répond : *"J'en ai trouvé 3, voilà leurs identifiants"*

Ou dans l'autre sens :

- L'utilisateur clique sur un point de la carte
- La carte dit à l'app : *"Quelqu'un a cliqué sur ce point d'intérêt"*
- L'app affiche une fenêtre avec les informations sur ce lieu

Ce système de messages fonctionne dans les deux sens, en temps réel, sans délai perceptible.

---

### Ce que l'app sait faire aujourd'hui

- **Afficher la carte** en 3D dans l'écran du téléphone
- **Rechercher un lieu** par son nom (ex: "cafeteria", "sortie")
- **Naviguer vers un lieu** : la carte centre la vue sur ce lieu
- **Calculer un itinéraire** entre deux endroits et l'afficher sur la carte
- **Détecter les clics** : quand on touche un lieu sur la carte, l'app affiche ses informations dans une fenêtre native
- **Changer d'étage** : l'app peut demander à la carte de montrer un étage précis, et être informée quand l'utilisateur change d'étage lui-même
- **Entrer dans un bâtiment** : cliquer sur un bâtiment sur la vue extérieure l'ouvre et affiche son intérieur

---

### Où vivent les fichiers

Tout est dans un seul endroit sur GitHub : `github.com/pierre-vg/visioone-bridge`

```
visioone-bridge/
├── app/        → le code de l'application mobile
└── docs/       → le code de la page web avec la carte
```

Quand on modifie quelque chose dans `docs/` et qu'on pousse le code sur GitHub, la page web se met à jour automatiquement en quelques secondes. L'app mobile n'a pas besoin d'être recompilée pour voir les changements côté carte.

---

### Ce qui n'est pas encore fait

Ce projet est un **démonstrateur technique**, pas un produit fini. Les choses qui restent à faire pour un vrai produit client :

- Connecter la carte au vrai venue du client (avec son propre identifiant, pas celui de la démo)
- Gérer la connexion sécurisée (token d'authentification)
- Adapter l'interface aux besoins spécifiques du client
- Tester sur différents téléphones et tailles d'écran
- Construire une vraie app (pour la soumettre sur l'App Store / Play Store, il faut une étape de compilation supplémentaire)
