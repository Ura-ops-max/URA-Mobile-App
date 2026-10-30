import AsyncStorage from '@react-native-async-storage/async-storage';
import { consumeOAuthPending, parseOAuthRedirect } from '@/hooks/use-google-sign-in';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('parseOAuthRedirect', () => {
  it('reads tokens from the website success URL', () => {
    expect(parseOAuthRedirect('https://www.ura.com.ng/auth/oauth/success?accessToken=a&refreshToken=r')).toEqual({
      accessToken: 'a',
      refreshToken: 'r',
    });
  });
  it('reads the failure', () => {
    expect(parseOAuthRedirect('https://www.ura.com.ng/auth/login?error=oauth_failed')).toEqual({ error: 'oauth_failed' });
  });
  it('ignores junk', () => {
    expect(parseOAuthRedirect('not a url')).toBeNull();
    expect(parseOAuthRedirect('https://www.ura.com.ng/')).toBeNull();
  });
});

describe('consumeOAuthPending (blocks sign-in links the app did not start)', () => {
  beforeEach(() => AsyncStorage.clear());

  it('refuses tokens when no sign-in was started', async () => {
    expect(await consumeOAuthPending()).toBe(false);
  });

  it('accepts once for a recent sign-in, then refuses a replay', async () => {
    await AsyncStorage.setItem('ura_oauth_pending_at', String(Date.now()));
    expect(await consumeOAuthPending()).toBe(true);
    expect(await consumeOAuthPending()).toBe(false);
  });

  it('refuses an old sign-in', async () => {
    await AsyncStorage.setItem('ura_oauth_pending_at', String(Date.now() - 16 * 60 * 1000));
    expect(await consumeOAuthPending()).toBe(false);
  });
});
