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

  return null;
}

