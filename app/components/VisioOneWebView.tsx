import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import {
  BRIDGE_BOOTSTRAP_SCRIPT,
  BridgeMessage,
  BridgeMessageType,
  buildInjectScript,
} from './BridgeService';

export interface VisioOneWebViewHandle {
  sendMessage: (type: BridgeMessageType, payload?: unknown) => void;
}

interface VisioOneWebViewProps {
  url: string;
  onBridgeMessage?: (message: BridgeMessage) => void;
}

const VisioOneWebView = forwardRef<VisioOneWebViewHandle, VisioOneWebViewProps>(
  ({ url, onBridgeMessage }, ref) => {
    const webViewRef = useRef<WebView>(null);

    useImperativeHandle(ref, () => ({
      sendMessage(type: BridgeMessageType, payload: unknown = {}) {
        const script = buildInjectScript(type, payload);
        webViewRef.current?.injectJavaScript(script);
      },
    }));

    function handleMessage(event: WebViewMessageEvent): void {
      try {
        const message = JSON.parse(event.nativeEvent.data) as BridgeMessage;
        onBridgeMessage?.(message);
      } catch {
        console.warn('[VisioOne] Message bridge ignoré (format non-JSON) :', event.nativeEvent.data);
      }
    }

    return (
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webView}
        injectedJavaScriptBeforeContentLoaded={BRIDGE_BOOTSTRAP_SCRIPT}
        onMessage={handleMessage}
        onLoad={() => onBridgeMessage?.({ type: 'MAP_READY', payload: {} })}
        mixedContentMode="always"
        allowsInlineMediaPlayback
        startInLoadingState
      />
    );
  }
);

VisioOneWebView.displayName = 'VisioOneWebView';

export default VisioOneWebView;

const styles = StyleSheet.create({
  webView: { flex: 1 },
});
