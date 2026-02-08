import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Consultation } from '@/types';
import api from '@/services/api';
import { colors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { formatCLP } from '@/utils/currency';

type PaymentScreenRouteProp = RouteProp<RootStackParamList, 'Payment'>;
type PaymentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Payment'>;

export default function PaymentScreen() {
  const route = useRoute<PaymentScreenRouteProp>();
  const navigation = useNavigation<PaymentScreenNavigationProp>();
  const { consultationId, amount } = route.params;

  const [isLoading, setIsLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'paid' | 'failed'>('pending');
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    createPaymentSession();
    
    // Listener para deep links cuando la app vuelve al foreground
    const subscription = Linking.addEventListener('url', handleDeepLink);
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      appStateSubscription.remove();
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Iniciar polling cuando la pantalla está enfocada
  useFocusEffect(
    React.useCallback(() => {
      if (paymentUrl && paymentStatus === 'pending') {
        startPolling();
      }
      return () => {
        stopPolling();
      };
    }, [paymentUrl, paymentStatus])
  );

  const createPaymentSession = async () => {
    try {
      setIsLoading(true);
      setPaymentStatus('pending');
      const response = await api.post('/payments/session', {
        consultationId,
        successUrl: `canalmedico://payment/success?consultationId=${consultationId}`,
        cancelUrl: `canalmedico://payment/cancel?consultationId=${consultationId}`,
      });

      if (response.success && response.data) {
        // MercadoPago retorna initPoint (producción) o sandboxInitPoint (desarrollo)
        // Usar sandboxInitPoint si está disponible (desarrollo), sino initPoint (producción)
        const paymentUrl = response.data.sandboxInitPoint || response.data.initPoint || response.data.url;
        
        if (paymentUrl) {
          setPaymentUrl(paymentUrl);
          // Abrir URL de pago en el navegador
          Linking.openURL(paymentUrl).catch((error) => {
            Alert.alert('Error', 'No se pudo abrir la página de pago');
          });
          // Iniciar polling después de abrir el navegador
          startPolling();
        } else {
          Alert.alert('Error', 'No se recibió una URL de pago válida');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al crear sesión de pago');
    } finally {
      setIsLoading(false);
    }
  };

  const startPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    setIsPolling(true);
    setPaymentStatus('checking');
    
    // Polling cada 3 segundos
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await api.get<Consultation>(`/consultations/${consultationId}`);
        if (response.success && response.data) {
          const consultation = response.data;
          
          if (consultation.status === 'ACTIVE') {
            // Pago confirmado, consulta activa
            stopPolling();
            setPaymentStatus('paid');
            Alert.alert(
              '¡Pago Confirmado!',
              'Tu consulta ha sido activada. Serás redirigido al chat.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    navigation.navigate('Chat', { consultationId });
                  },
                },
              ]
            );
          } else if (consultation.payment?.status === 'FAILED') {
            // Pago fallido
            stopPolling();
            setPaymentStatus('failed');
            Alert.alert('Pago Fallido', 'El pago no pudo ser procesado. Por favor, intenta nuevamente.');
          }
        }
      } catch (error) {
        console.error('Error al verificar estado del pago:', error);
        // Continuar polling en caso de error
      }
    }, 3000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  };

  const handleDeepLink = (event: { url: string }) => {
    const url = event.url;
    // Siempre verificar en servidor; no confiar en querystring
    setPaymentStatus('checking');
    if (url.includes('payment/failure') || url.includes('payment/cancel')) {
      // Si el usuario canceló, seguimos verificando estado real antes de marcar fallo
      stopPolling();
    }
    checkPaymentAndNavigate();
    if (!isPolling) {
      startPolling();
    }
  };

  const handleAppStateChange = (nextAppState: string) => {
    if (
      appStateRef.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // App volvió al foreground - verificar si el pago se completó
      if (paymentUrl && paymentStatus === 'pending') {
        checkPaymentAndNavigate();
        if (!isPolling) {
          startPolling();
        }
      }
    }
    appStateRef.current = nextAppState;
  };

  const checkPaymentAndNavigate = async () => {
    try {
      const response = await api.get<Consultation>(`/consultations/${consultationId}`);
      if (response.success && response.data) {
        const consultation = response.data;
        if (consultation.status === 'ACTIVE') {
          stopPolling();
          setPaymentStatus('paid');
          navigation.navigate('Chat', { consultationId });
        }
      }
    } catch (error) {
      console.error('Error al verificar pago:', error);
    }
  };

  const handleRetry = () => {
    stopPolling();
    setPaymentStatus('pending');
    createPaymentSession();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Ionicons name="card" size={64} color={colors.primary[600]} />
          <Text style={styles.title}>Procesar Pago</Text>
          <Text style={styles.subtitle}>Monto a pagar</Text>
          <Text style={styles.amount}>{formatCLP(amount)}</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
            <Text style={styles.loadingText}>Procesando pago...</Text>
          </View>
        ) : paymentStatus === 'paid' ? (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success[600]} />
            <Text style={styles.successText}>¡Pago Confirmado!</Text>
            <Text style={styles.successSubtext}>Redirigiendo al chat...</Text>
          </View>
        ) : paymentStatus === 'failed' ? (
          <View style={styles.errorContainer}>
            <Ionicons name="close-circle" size={64} color={colors.error[600]} />
            <Text style={styles.errorText}>Pago no procesado</Text>
            <Text style={styles.errorSubtext}>El pago no pudo ser completado. Por favor, intenta nuevamente.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Reintentar Pago</Text>
            </TouchableOpacity>
          </View>
        ) : paymentUrl ? (
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Se abrirá una ventana para completar el pago de forma segura.
            </Text>
            <Text style={styles.infoText}>
              Una vez completado el pago, serás redirigido de vuelta a la app.
            </Text>
            {isPolling && (
              <View style={styles.pollingContainer}>
                <ActivityIndicator size="small" color={colors.primary[600]} style={styles.pollingIndicator} />
                <Text style={styles.pollingText}>Verificando estado del pago...</Text>
              </View>
            )}
            <TouchableOpacity 
              style={styles.checkButton} 
              onPress={checkPaymentAndNavigate}
              disabled={isPolling}
            >
              <Ionicons name="refresh" size={20} color={colors.white} />
              <Text style={styles.checkButtonText}>Verificar Pago</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error al crear sesión de pago</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[600],
    marginBottom: 8,
  },
  amount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray[600],
  },
  infoContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 24,
    marginTop: 24,
  },
  infoText: {
    fontSize: 16,
    color: colors.gray[700],
    marginBottom: 16,
    lineHeight: 24,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  errorText: {
    fontSize: 16,
    color: colors.error[600],
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.success[600],
    marginTop: 16,
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 16,
    color: colors.gray[600],
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  pollingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
  },
  pollingIndicator: {
    marginRight: 8,
  },
  pollingText: {
    fontSize: 14,
    color: colors.primary[700],
  },
  checkButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  checkButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

