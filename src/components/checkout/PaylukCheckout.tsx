// Payluk's Checkout widget, run in a WebView. It does exactly what the web
// app's `payluk-escrow-inline-checkout` package does: create a checkout
// session with the publishable key, load Payluk's widget script, and open it.
// The widget's callback / onClose are posted back to the app. Only URA's
// backend decides an order is paid; the caller polls /payment-status after.
import { useMemo } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { X } from 'lucide-react-native';
import { Text } from '@/components/ui';
import { spacing, useTheme, makeStyles } from '@/theme';
import {
  PAYLUK_CHECKOUT_API,
  PAYLUK_PUBLIC_KEY,
  PAYLUK_WIDGET_SCRIPT,
  SITE_URL,
} from '@/constants/config';
import type { StartPaymentResponse } from '@/types';

export type PaylukResult = { type: 'done' } | { type: 'closed' } | { type: 'error'; message: string };

const paymentCompleteUrl = (orderId: string) =>
  `${SITE_URL}/payment-complete?orderId=${encodeURIComponent(orderId)}`;

function buildHtml(orderId: string, p: StartPaymentResponse): string {
  const config = {
    sessionUrl: `${PAYLUK_CHECKOUT_API}/v1/checkout/session`,
    scriptUrl: PAYLUK_WIDGET_SCRIPT,
    publicKey: PAYLUK_PUBLIC_KEY,
    paymentToken: p.paymentToken,
    reference: p.reference,
    customerId: p.customerId,
    redirectUrl: paymentCompleteUrl(orderId),
    logoUrl: `${SITE_URL}/icon-192.png`,
  };
  // JSON inside a <script>: escape "<" so the data can never close the tag.
  const json = JSON.stringify(config).replace(/</g, '\\u003c');
  return `<!doctype html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<style>html,body{margin:0;height:100%;background:#fff;font-family:-apple-system,Roboto,sans-serif}
#s{display:flex;height:100%;align-items:center;justify-content:center;color:#6B7280;font-size:14px}</style>
</head><body><div id="s">Opening secure payment…</div>
<script>
(function () {
  var c = ${json};
  function post(m) { window.ReactNativeWebView.postMessage(JSON.stringify(m)); }
  function fail(msg) { post({ type: 'error', message: String(msg || 'Could not open the payment window.') }); }
  function loadWidget() {
    return new Promise(function (resolve, reject) {
      if (typeof window.EscrowCheckout === 'function') return resolve(window.EscrowCheckout);
      var s = document.createElement('script');
      s.src = c.scriptUrl; s.async = true; s.crossOrigin = 'anonymous';
      s.onload = function () {
        typeof window.EscrowCheckout === 'function' ? resolve(window.EscrowCheckout)
          : reject(new Error('Payment window failed to load.'));
      };
      s.onerror = function () { reject(new Error('Could not load the payment window. Check your connection.')); };
      document.head.appendChild(s);
    });
  }
  function createSession() {
    return fetch(c.sessionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentToken: c.paymentToken, redirectUrl: c.redirectUrl,
        reference: c.reference, customerId: c.customerId, publicKey: c.publicKey })
    }).then(function (r) {
      return r.text().then(function (t) {
        var j = null; try { j = JSON.parse(t); } catch (e) {}
        if (!r.ok) throw new Error((j && j.message) || ('Could not start the payment (HTTP ' + r.status + ').'));
        if (!j || !('session' in j)) throw new Error('Could not start the payment.');
        return j;
      });
    });
  }
  Promise.all([createSession(), loadWidget()]).then(function (res) {
    document.getElementById('s').style.display = 'none';
    res[1]({
      session: res[0].session, logoUrl: c.logoUrl, brand: 'URA',
      customerId: c.customerId, publicKey: c.publicKey,
      callback: function () { post({ type: 'done' }); },
      onClose: function () { post({ type: 'closed' }); }
    });
  }).catch(function (e) { fail(e && e.message); });
})();
</script></body></html>`;
}

export function PaylukCheckout({
  orderId,
  payment,
  onResult,
}: {
  orderId: string;
  /** From POST /orders/:id/pay. null = closed. */
  payment: StartPaymentResponse | null;
  onResult: (r: PaylukResult) => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const html = useMemo(() => (payment ? buildHtml(orderId, payment) : ''), [orderId, payment]);
  const doneUrl = `${SITE_URL}/payment-complete`;

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const m = JSON.parse(e.nativeEvent.data) as PaylukResult;
      if (m && (m.type === 'done' || m.type === 'closed' || m.type === 'error')) onResult(m);
    } catch {
      /* not ours */
    }
  };

  return (
    <Modal visible={!!payment} animationType="slide" onRequestClose={() => onResult({ type: 'closed' })}>
      <View style={[styles.bar, { paddingTop: insets.top + spacing.sm }]}>
        <Text variant="subheading">Secure payment</Text>
        <Pressable onPress={() => onResult({ type: 'closed' })} hitSlop={12} accessibilityLabel="Close payment">
          <X size={24} color={colors.text} />
        </Pressable>
      </View>
      {payment ? (
        <WebView
          // The page runs on URA's own site origin, like the web checkout.
          source={{ html, baseUrl: SITE_URL }}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          onMessage={onMessage}
          startInLoadingState
          renderLoading={() => <ActivityIndicator color={colors.primary} style={StyleSheet.absoluteFill} />}
          // Payluk may send the page to redirectUrl when it finishes: treat it as done.
          onShouldStartLoadWithRequest={(req) => {
            if (req.url.startsWith(doneUrl)) {
              onResult({ type: 'done' });
              return false;
            }
            if (/^(https?:|about:|data:|blob:)/i.test(req.url)) return true;
            // tel: (USSD), mailto: and bank-app links open in their apps; never javascript:.
            if (!/^javascript:/i.test(req.url)) Linking.openURL(req.url).catch(() => {});
            return false;
          }}
          allowFileAccess={false}
          style={{ flex: 1, marginBottom: insets.bottom }}
        />
      ) : null}
    </Modal>
  );
}

const useStyles = makeStyles((colors) => ({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
}));
