import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import VisioOneWebView from './components/VisioOneWebView';
import type { BridgeMessage } from './components/BridgeService';
import { useVisioOne } from './hooks/useVisioOne';
import { VISIOONE_URL } from './constants/config';

export default function App() {
  const { state, actions, webViewRef, handleBridgeMessage } = useVisioOne();

  const [searchQuery, setSearchQuery]     = useState('');
  const [navigatePoiId, setNavigatePoiId] = useState('');
  const [routeFrom, setRouteFrom]         = useState('');
  const [routeTo, setRouteTo]             = useState('');
  const [floorId, setFloorId]             = useState('');

  const [panelVisible, setPanelVisible]   = useState(false);
  const [showPOIModal, setShowPOIModal]   = useState(false);

  function handleMessage(message: BridgeMessage): void {
    handleBridgeMessage(message);
    if (message.type === 'POI_SELECTED') {
      setShowPOIModal(true);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* ── Carte plein écran ─────────────────────────────────────────── */}
      <View style={styles.mapContainer}>
        {!state.isMapReady && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0066CC" />
            <Text style={styles.loadingText}>Chargement de la carte…</Text>
          </View>
        )}
        <VisioOneWebView
          ref={webViewRef}
          url={VISIOONE_URL}
          onBridgeMessage={handleMessage}
        />
      </View>

      {/* ── Barre de statut + bouton toggle ──────────────────────────── */}
      <View style={styles.statusBar}>
        <View style={[styles.statusDot, state.isMapReady ? styles.dotReady : styles.dotWaiting]} />
        <Text style={styles.statusText}>
          {state.isMapReady ? 'Carte prête' : 'Chargement…'}
        </Text>
        {state.currentFloor ? (
          <Text style={styles.floorBadge}>Étage : {state.currentFloor}</Text>
        ) : null}
        <TouchableOpacity
          style={[styles.toggleBtn, !state.isMapReady && styles.btnDisabled]}
          onPress={() => setPanelVisible(true)}
          disabled={!state.isMapReady}
        >
          <Text style={styles.toggleBtnText}>Contrôles</Text>
        </TouchableOpacity>
      </View>

      {/* ── Panel de contrôles (modal plein écran) ───────────────────── */}
      <Modal
        visible={panelVisible}
        animationType="slide"
        onRequestClose={() => setPanelVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalFull}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <SafeAreaView style={styles.modalFull}>
            {/* En-tête modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Contrôles</Text>
              <TouchableOpacity onPress={() => setPanelVisible(false)}>
                <Text style={styles.closeBtn}>Fermer</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* ── 1. Search POI ───────────────────────────────────── */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>1. Search POI</Text>
                <View style={styles.row}>
                  <TextInput
                    style={styles.input}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Ex: cafeteria"
                    returnKeyType="search"
                    onSubmitEditing={() => actions.searchPOI(searchQuery)}
                  />
                  <TouchableOpacity
                    style={styles.btn}
                    onPress={() => actions.searchPOI(searchQuery)}
                  >
                    <Text style={styles.btnText}>Rechercher</Text>
                  </TouchableOpacity>
                </View>
                {state.searchResults !== null && (
                  <Text style={styles.resultText}>
                    {state.searchResults.length} résultat(s)
                    {state.searchResults.length > 0
                      ? ' : ' + state.searchResults.map((p) => p.name).join(', ')
                      : ''}
                  </Text>
                )}
              </View>

              {/* ── 2. Navigate to POI ──────────────────────────────── */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>2. Navigate to POI</Text>
                <View style={styles.row}>
                  <TextInput
                    style={styles.input}
                    value={navigatePoiId}
                    onChangeText={setNavigatePoiId}
                    placeholder="ID du POI"
                  />
                  <TouchableOpacity
                    style={styles.btn}
                    onPress={() => actions.navigateTo(navigatePoiId)}
                  >
                    <Text style={styles.btnText}>Naviguer</Text>
                  </TouchableOpacity>
                </View>
                {state.isNavigating && state.currentRoute && (
                  <Text style={styles.resultText}>
                    Navigation : {state.currentRoute.steps.length} étape(s) —{' '}
                    {Math.round(state.currentRoute.duration / 60)} min
                  </Text>
                )}
              </View>

              {/* ── 3. POI Selected ─────────────────────────────────── */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>3. POI Selected (carte → RN)</Text>
                <Text style={styles.hint}>
                  Clique sur un POI sur la carte pour déclencher cet événement.
                </Text>
                {state.selectedPOI ? (
                  <Text style={styles.resultText}>
                    Sélectionné : {state.selectedPOI.name} (étage {state.selectedPOI.floor})
                  </Text>
                ) : (
                  <Text style={styles.emptyText}>Aucun POI sélectionné</Text>
                )}
              </View>

              {/* ── 4. Create Route ─────────────────────────────────── */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>4. Create Route</Text>
                <View style={styles.row}>
                  <TextInput
                    style={styles.input}
                    value={routeFrom}
                    onChangeText={setRouteFrom}
                    placeholder="De (POI ID)"
                  />
                  <Text style={styles.routeArrow}>→</Text>
                  <TextInput
                    style={styles.input}
                    value={routeTo}
                    onChangeText={setRouteTo}
                    placeholder="Vers (POI ID)"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.btn, styles.btnBlock]}
                  onPress={() => actions.createRoute(routeFrom, routeTo)}
                >
                  <Text style={styles.btnText}>Créer l'itinéraire</Text>
                </TouchableOpacity>
                {state.currentRoute && (
                  <Text style={styles.resultText}>
                    Route : {state.currentRoute.distance} m —{' '}
                    {Math.round(state.currentRoute.duration / 60)} min
                  </Text>
                )}
              </View>

              {/* ── 5. Floor Change ─────────────────────────────────── */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>5. Floor Change</Text>
                <View style={styles.row}>
                  <TextInput
                    style={styles.input}
                    value={floorId}
                    onChangeText={setFloorId}
                    placeholder="ID de l'étage"
                  />
                  <TouchableOpacity
                    style={styles.btn}
                    onPress={() => actions.setFloor(floorId)}
                  >
                    <Text style={styles.btnText}>Changer</Text>
                  </TouchableOpacity>
                </View>
                {state.currentFloor && (
                  <Text style={styles.resultText}>Étage affiché : {state.currentFloor}</Text>
                )}
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modale POI Selected ───────────────────────────────────────── */}
      <Modal
        visible={showPOIModal && state.selectedPOI !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPOIModal(false)}
      >
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{state.selectedPOI?.name}</Text>
            <Text style={styles.sheetDetail}>ID : {state.selectedPOI?.id}</Text>
            <Text style={styles.sheetDetail}>Étage : {state.selectedPOI?.floor}</Text>
            {state.selectedPOI?.category && (
              <Text style={styles.sheetDetail}>Catégorie : {state.selectedPOI.category}</Text>
            )}
            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => {
                  if (state.selectedPOI) actions.navigateTo(state.selectedPOI.id);
                  setShowPOIModal(false);
                }}
              >
                <Text style={styles.btnText}>Naviguer ici</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary]}
                onPress={() => {
                  setShowPOIModal(false);
                  actions.clearSelectedPOI();
                }}
              >
                <Text style={styles.btnTextSecondary}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#8E8E93',
  },

  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#1C1C1E',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotReady:   { backgroundColor: '#34C759' },
  dotWaiting: { backgroundColor: '#FF9500' },
  statusText: {
    fontSize: 12,
    color: '#AEAEB2',
    flex: 1,
  },
  floorBadge: {
    fontSize: 12,
    color: '#AEAEB2',
    marginRight: 4,
  },
  toggleBtn: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Modal plein écran
  modalFull: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  closeBtn: {
    fontSize: 17,
    color: '#0066CC',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 16,
    gap: 16,
  },

  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  hint: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
  },
  resultText: {
    fontSize: 12,
    color: '#34C759',
    lineHeight: 16,
  },
  emptyText: {
    fontSize: 12,
    color: '#C7C7CC',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 38,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    fontSize: 14,
    color: '#1C1C1E',
  },
  routeArrow: {
    fontSize: 16,
    color: '#8E8E93',
  },
  btn: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  btnBlock: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  btnDisabled: {
    backgroundColor: '#C7C7CC',
  },
  btnSecondary: {
    backgroundColor: '#F2F2F7',
  },
  btnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  btnTextSecondary: {
    color: '#1C1C1E',
    fontSize: 14,
    fontWeight: '600',
  },

  // Bottom sheet POI
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C7C7CC',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  sheetDetail: {
    fontSize: 15,
    color: '#3C3C43',
    marginBottom: 4,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
});
