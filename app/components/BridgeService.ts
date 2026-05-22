export type BridgeMessageType =
  | 'SEARCH_POI'
  | 'NAVIGATE_TO'
  | 'CREATE_ROUTE'
  | 'SET_FLOOR'
  | 'SEARCH_RESULTS'
  | 'NAVIGATION_STARTED'
  | 'POI_SELECTED'
  | 'ROUTE_READY'
  | 'FLOOR_CHANGED'
  | 'MAP_READY';

export interface BridgeMessage<P = unknown> {
  type: BridgeMessageType;
  payload: P;
}

export interface POI {
  id: string;
  name: string;
  floor: string;
  lat?: number;
  lng?: number;
  category?: string;
}

export interface RouteStep {
  instruction: string;
  floor: string;
  distance: number;
}

export interface Route {
  steps: RouteStep[];
  duration: number;
  distance: number;
}

export interface SearchPOIPayload      { query: string; }
export interface NavigateToPayload     { poiId: string; }
export interface CreateRoutePayload    { from: string; to: string; }
export interface SetFloorPayload       { floorId: string; }
export interface SearchResultsPayload  { query: string; pois: POI[]; }
export interface NavigationStartedPayload { route: Route; }
export interface POISelectedPayload    { poi: POI; }
export interface RouteReadyPayload     { steps: RouteStep[]; duration: number; distance: number; }
export interface FloorChangedPayload   { floorId: string; }

export function buildInjectScript(type: BridgeMessageType, payload: unknown = {}): string {
  const messageJson = JSON.stringify(JSON.stringify({ type, payload }));
  return `
    (function() {
      window.dispatchEvent(new MessageEvent('message', { data: ${messageJson} }));
    })();
    true;
  `;
}

export const BRIDGE_BOOTSTRAP_SCRIPT = `
  (function() {
    'use strict';
    window.sendToRN = function(type, payload) {
      if (!window.ReactNativeWebView) {
        console.warn('[Bridge] ReactNativeWebView non disponible.');
        return;
      }
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload || {} }));
    };
    window.addEventListener('message', function(event) {
      var msg;
      try { msg = JSON.parse(event.data); } catch (e) { return; }
      window.dispatchEvent(new CustomEvent('rnCommand', { detail: msg }));
    });
    console.log('[Bridge] Bootstrap VisioOne ↔ React Native initialisé.');
  })();
  true;
`;
