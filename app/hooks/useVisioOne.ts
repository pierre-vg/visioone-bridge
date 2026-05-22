import { useCallback, useRef, useState } from 'react';
import type {
  BridgeMessage,
  FloorChangedPayload,
  NavigationStartedPayload,
  POI,
  POISelectedPayload,
  Route,
  RouteReadyPayload,
  SearchResultsPayload,
} from '../components/BridgeService';
import type { VisioOneWebViewHandle } from '../components/VisioOneWebView';

interface VisioOneState {
  isMapReady:    boolean;
  searchResults: POI[] | null;
  selectedPOI:   POI | null;
  currentRoute:  Route | null;
  currentFloor:  string | null;
  isNavigating:  boolean;
}

const INITIAL_STATE: VisioOneState = {
  isMapReady:    false,
  searchResults: null,
  selectedPOI:   null,
  currentRoute:  null,
  currentFloor:  null,
  isNavigating:  false,
};

export function useVisioOne() {
  const webViewRef = useRef<VisioOneWebViewHandle>(null);
  const [state, setState] = useState<VisioOneState>(INITIAL_STATE);

  const update = useCallback(
    (patch: Partial<VisioOneState>) => setState((prev) => ({ ...prev, ...patch })),
    []
  );

  const handleBridgeMessage = useCallback((message: BridgeMessage): void => {
    switch (message.type) {
      case 'MAP_READY':
        update({ isMapReady: true });
        break;
      case 'SEARCH_RESULTS': {
        const { pois } = message.payload as SearchResultsPayload;
        update({ searchResults: pois });
        break;
      }
      case 'NAVIGATION_STARTED': {
        const { route } = message.payload as NavigationStartedPayload;
        update({ currentRoute: route, isNavigating: true });
        break;
      }
      case 'POI_SELECTED': {
        const { poi } = message.payload as POISelectedPayload;
        update({ selectedPOI: poi });
        break;
      }
      case 'ROUTE_READY': {
        const { steps, duration, distance } = message.payload as RouteReadyPayload;
        update({ currentRoute: { steps, duration, distance }, isNavigating: true });
        break;
      }
      case 'FLOOR_CHANGED': {
        const { floorId } = message.payload as FloorChangedPayload;
        update({ currentFloor: floorId });
        break;
      }
      default:
        console.warn('[useVisioOne] Type de message non géré :', message.type);
    }
  }, [update]);

  const searchPOI      = useCallback((query: string)            => webViewRef.current?.sendMessage('SEARCH_POI',   { query }),    []);
  const navigateTo     = useCallback((poiId: string)            => webViewRef.current?.sendMessage('NAVIGATE_TO',  { poiId }),    []);
  const createRoute    = useCallback((from: string, to: string) => webViewRef.current?.sendMessage('CREATE_ROUTE', { from, to }), []);
  const setFloor       = useCallback((floorId: string)          => webViewRef.current?.sendMessage('SET_FLOOR',    { floorId }), []);
  const clearSelectedPOI = useCallback(()                       => update({ selectedPOI: null }), [update]);

  return {
    state,
    actions: { searchPOI, navigateTo, clearSelectedPOI, createRoute, setFloor },
    webViewRef,
    handleBridgeMessage,
  };
}
