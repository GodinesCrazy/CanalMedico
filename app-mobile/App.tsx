import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import { registerForPushNotificationsAsync, saveNotificationToken, addNotificationReceivedListener } from './src/utils/notifications';
import { theme } from './src/theme';
import socketService from './src/services/socket.service';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const { isAuthenticated, user, accessToken } = useAuthStore();
  const notificationListener = useRef<Notifications.EventSubscription>();

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

