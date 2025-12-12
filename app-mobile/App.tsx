import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import { registerForPushNotificationsAsync, saveNotificationToken, addNotificationReceivedListener } from './src/utils/notifications';
import { theme } from './src/theme';
import socketService from './src/services/socket.service';
import { handleDeepLink } from './src/utils/linking';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const { isAuthenticated, user, accessToken } = useAuthStore();
  const notificationListener = useRef<Notifications.EventSubscription>();
  const linkingListener = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    // Registrar notificaciones push
    registerForPushNotificationsAsync().then((token) => {
      if (token && user) {
        saveNotificationToken(user.id, token);
      }
    });

    // Listener de notificaciones recibidas
    notificationListener.current = addNotificationReceivedListener((notification) => {
      console.log('Notificación recibida:', notification);
    });

    // Listener de deep links
    linkingListener.current = Linking.addEventListener('url', (event) => {
      const result = handleDeepLink(event.url);
      if (result?.type === 'payment') {
        // El deep link será manejado por PaymentScreen
        console.log('Deep link de pago recibido:', result);
      }
    });

    // Verificar si la app fue abierta con un deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        const result = handleDeepLink(url);
        if (result?.type === 'payment') {
          console.log('Deep link inicial de pago:', result);
        }
      }
    });

    // Conectar socket si está autenticado
    if (isAuthenticated && accessToken) {
      socketService.connect(accessToken);
    }

    // Ocultar splash screen
    SplashScreen.hideAsync();

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (linkingListener.current) {
        linkingListener.current.remove();
      }
      if (!isAuthenticated) {
        socketService.disconnect();
      }
    };
  }, [isAuthenticated, user, accessToken]);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme as any}>
        <StatusBar style="auto" />
        <AppNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

