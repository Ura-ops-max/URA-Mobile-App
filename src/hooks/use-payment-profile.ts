import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { useToast } from '@/components/ui';
import { useAuthContext } from '@/context/auth-provider';
import { setupPaymentProfile } from '@/api/wallet';

/** Phone numbers Payluk accepts (same rule as the web and backend). */
export const NG_PHONE = /^0[789][01]\d{8}$/;

/**
 * Guards anything that needs a Payluk payment profile (web usePaylukGuard).
 * With a valid phone on file the profile is created silently, then the action
 * runs; otherwise the person is sent to Payment Setup to enter their phone.
 */
export function usePaymentProfile() {
  const { user, refetchAuth } = useAuthContext();
  const toast = useToast();
  const [settingUp, setSettingUp] = useState(false);

  const ensure = useCallback(
    async (action: () => void) => {
      if (user?.paylukCustomerId) return action();
      const phone = (user?.phone ?? '').trim();
      if (NG_PHONE.test(phone) && user?.firstName?.trim()) {
        setSettingUp(true);
        try {
          await setupPaymentProfile({ phone });
        } catch (err) {
          const msg = String(
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '',
          ).toLowerCase();
          // "already exists" means the profile is fine; anything else is a real failure.
          if (!msg.includes('already')) {
            setSettingUp(false);
            toast.error('Could not set up your payment profile. Please try again.');
            return;
          }
        }
        await refetchAuth();
        setSettingUp(false);
        return action();
      }
      toast.show('Add your phone number to set up payments first.');
      router.push('/payluk-setup');
    },
    [user, refetchAuth, toast],
  );

  return { ensure, settingUp };
}
