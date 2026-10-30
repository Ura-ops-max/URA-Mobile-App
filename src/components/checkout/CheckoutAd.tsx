import { useQuery } from '@tanstack/react-query';
import { Linking, View } from 'react-native';
import { WebView } from 'react-native-webview';
import API from '@/lib/axios-client';
import { radii, spacing, useTheme } from '@/theme';

/**
 * A single 300x250 sponsored ad on checkout screens (web components/ads/CheckoutAd).
 * GET /ads/checkout?businessId → { ad: { format:'html', html } | null }. The ad HTML
 * runs in an isolated WebView; any link it opens goes to the browser, never in-app.
 * Renders nothing when there is no ad, so checkout looks the same without it.
 */
export function CheckoutAd({ businessId }: { businessId?: string | null }) {
  const { colors } = useTheme();
  const { data: html } = useQuery({
    queryKey: ['checkout-ad', businessId],
    enabled: !!businessId,
    staleTime: 60_000,
    queryFn: async () => {
      try {
        const { data } = await API.get('/ads/checkout', { params: { businessId } });
        return data?.ad?.format === 'html' && typeof data.ad.html === 'string' ? (data.ad.html as string) : null;
      } catch {
        return null;
      }
    },
  });

  if (!html) return null;

  return (
    <View style={{ alignItems: 'center', marginTop: spacing.md }}>
      <View style={{ width: 300, height: 250, borderRadius: radii.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
        <WebView
          source={{ html: `<meta name="viewport" content="width=300,initial-scale=1"><style>body{margin:0}</style>${html}` }}
          originWhitelist={['*']}
          scrollEnabled={false}
          javaScriptEnabled
          setSupportMultipleWindows={false}
          onShouldStartLoadWithRequest={(req) => {
            // The first load is the ad itself; any navigation after that opens in the browser.
            if (req.url === 'about:blank' || req.url.startsWith('data:')) return true;
            if (req.isTopFrame === false) return true;
            if (/^https?:/i.test(req.url)) {
              Linking.openURL(req.url).catch(() => {});
              return false;
            }
            // Third-party ad HTML: never follow other schemes (intent:, javascript:, app links…).
            return false;
          }}
          javaScriptCanOpenWindowsAutomatically={false}
          allowFileAccess={false}
          style={{ width: 300, height: 250, backgroundColor: 'transparent' }}
        />
      </View>
    </View>
  );
}
