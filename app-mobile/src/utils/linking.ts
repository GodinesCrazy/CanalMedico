import * as Linking from 'expo-linking';

export const linking = {
  prefixes: ['canalmedico://', 'https://canalmedico.app'],
  config: {
    screens: {
      Home: 'home',
      ConsultationDetail: 'consultation/:consultationId',
      Chat: 'chat/:consultationId',
      Payment: 'payment/:consultationId',
      DoctorSearch: 'doctor/:doctorId',
      Login: 'login',
      // Deep links para pagos
      PaymentSuccess: 'payment/success',
      PaymentFailure: 'payment/failure',
      PaymentPending: 'payment/pending',
    },
  },
};

export function handleDeepLink(url: string) {
  const { scheme, hostname, path, queryParams } = Linking.parse(url);

  if (scheme === 'canalmedico' && hostname === 'doctor') {
    const doctorId = queryParams?.id as string;
    const openChat = queryParams?.openChat === 'true';

    return {
      type: 'doctor',
      doctorId,
      openChat,
    };
  }

  // Manejar deep links de pago
  if (scheme === 'canalmedico' && path?.startsWith('payment/')) {
    const consultationId = queryParams?.consultationId as string;
    const status = path.split('/')[1]; // 'success', 'failure', o 'pending'

    return {
      type: 'payment',
      status,
      consultationId,
    };
  }

  return null;
}

