# Bridge API

Le bridge est une couche de communication bidirectionnelle entre l'application React Native et la page VisioOne chargée dans la WebView. Tous les messages ont la forme `{ type: string, payload: object }`.

---

## Commandes RN → WebView

Ces commandes sont envoyées depuis React Native vers la carte VisioOne.

### `SEARCH_POI`

Recherche des POIs dont le nom ou l'ID contient la chaîne fournie.

**Payload**

```ts
{ query: string }
```

**Exemple**

```ts
actions.searchPOI('cafeteria');
// ou directement :
webViewRef.current?.sendMessage('SEARCH_POI', { query: 'cafeteria' });
```

**Réponse attendue** : [`SEARCH_RESULTS`](#search_results)

---

### `NAVIGATE_TO`

Déplace la caméra vers un POI et le sélectionne visuellement. N'affiche pas d'itinéraire — pour un itinéraire, utiliser [`CREATE_ROUTE`](#create_route).

**Payload**

```ts
{ poiId: string }
```

**Exemple**

```ts
actions.navigateTo('poi_entrance_A');
```

**Réponse attendue** : [`NAVIGATION_STARTED`](#navigation_started)

---

### `CREATE_ROUTE`

Calcule et affiche un itinéraire entre deux POIs.

**Payload**

```ts
{ from: string; to: string }  // IDs de POIs
```

**Exemple**

```ts
actions.createRoute('poi_entrance_A', 'poi_cafeteria');
```

**Réponse attendue** : [`ROUTE_READY`](#route_ready)

> Si aucun chemin n'existe entre les deux POIs, `ROUTE_READY` est quand même émis avec des tableaux vides.

---

### `SET_FLOOR`

Change l'étage affiché par la carte.

**Payload**

```ts
{ floorId: string }
```

**Exemple**

```ts
actions.setFloor('B1-1');
```

> L'ID d'étage est celui retourné par les événements [`FLOOR_CHANGED`](#floor_changed) ou visible dans les données de venue.

---

## Événements WebView → RN

Ces événements sont émis par la carte VisioOne vers React Native.

### `MAP_READY`

La carte est initialisée et prête à recevoir des commandes.

**Payload** : `{}`

**Usage**

```ts
function handleMessage(message: BridgeMessage) {
  if (message.type === 'MAP_READY') {
    // La carte est prête, on peut appeler actions.*
  }
}
```

> Toutes les commandes envoyées avant `MAP_READY` seront ignorées.

---

### `SEARCH_RESULTS`

Résultats d'une recherche [`SEARCH_POI`](#search_poi).

**Payload**

```ts
{
  query: string;
  pois: Array<{
    id:       string;
    name:     string;   // texte du premier label du POI
    floor:    string;   // ID de l'étage, vide si POI sans étage
    category: string | null;
  }>;
}
```

**Exemple de traitement**

```ts
case 'SEARCH_RESULTS': {
  const { pois } = message.payload as SearchResultsPayload;
  // Afficher la liste, naviguer vers le premier résultat, etc.
  break;
}
```

---

### `NAVIGATION_STARTED`

Confirmation que la navigation vers un POI a démarré (suite à [`NAVIGATE_TO`](#navigate_to)).

**Payload**

```ts
{
  route: {
    steps:    [];      // vide pour NAVIGATE_TO (pas d'itinéraire calculé)
    duration: number;  // 0
    distance: number;  // 0
  }
}
```

---

### `ROUTE_READY`

Itinéraire calculé et affiché sur la carte (suite à [`CREATE_ROUTE`](#create_route)).

**Payload**

```ts
{
  steps: Array<{
    instruction: string;  // texte de l'instruction (ex: "Tournez à droite")
    distance:    number;  // mètres
    duration:    number;  // secondes
  }>;
  distance: number;  // distance totale en mètres
  duration: number;  // durée totale en secondes
}
```

**Exemple**

```ts
case 'ROUTE_READY': {
  const { distance, duration, steps } = message.payload as RouteReadyPayload;
  console.log(`${distance}m — ${Math.round(duration / 60)} min`);
  break;
}
```

---

### `POI_SELECTED`

L'utilisateur a cliqué sur un POI sur la carte.

> Les POIs de type bâtiment (dont l'ID correspond à un bâtiment dans le layout) ne déclenchent pas cet événement — ils ouvrent directement le bâtiment.

**Payload**

```ts
{
  poi: {
    id:       string;
    name:     string;
    floor:    string;
    category: string | null;
  }
}
```

**Exemple**

```ts
case 'POI_SELECTED': {
  const { poi } = message.payload as POISelectedPayload;
  // Afficher une bottom sheet, proposer la navigation, etc.
  break;
}
```

---

### `FLOOR_CHANGED`

L'étage affiché par la carte a changé (suite à une interaction utilisateur ou à [`SET_FLOOR`](#set_floor)).

**Payload**

```ts
{ floorId: string }
```

---

## Types TypeScript

Tous les types sont exportés depuis `components/BridgeService.ts`.

```ts
import type {
  BridgeMessage,
  BridgeMessageType,
  POI,
  Route,
  RouteStep,
  SearchPOIPayload,
  SearchResultsPayload,
  NavigateToPayload,
  NavigationStartedPayload,
  CreateRoutePayload,
  RouteReadyPayload,
  POISelectedPayload,
  SetFloorPayload,
  FloorChangedPayload,
} from '../components/BridgeService';
```

---

## Tableau récapitulatif

| Type | Direction | Déclenché par |
|---|---|---|
| `SEARCH_POI` | RN → WebView | `actions.searchPOI()` |
| `NAVIGATE_TO` | RN → WebView | `actions.navigateTo()` |
| `CREATE_ROUTE` | RN → WebView | `actions.createRoute()` |
| `SET_FLOOR` | RN → WebView | `actions.setFloor()` |
| `MAP_READY` | WebView → RN | Fin de `createView()` |
| `SEARCH_RESULTS` | WebView → RN | En réponse à `SEARCH_POI` |
| `NAVIGATION_STARTED` | WebView → RN | En réponse à `NAVIGATE_TO` |
| `ROUTE_READY` | WebView → RN | En réponse à `CREATE_ROUTE` |
| `POI_SELECTED` | WebView → RN | Clic utilisateur sur un POI |
| `FLOOR_CHANGED` | WebView → RN | Changement d'étage (user ou SDK) |
