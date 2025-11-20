import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types';
import api from '@/services/api';
import { colors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';

type PaymentScreenRouteProp = RouteProp<RootStackParamList, 'Payment'>;
type PaymentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Payment'>;

export default function PaymentScreen() {
  const route = useRoute<PaymentScreenRouteProp>();
  const navigation = useNavigation<PaymentScreenNavigationProp>();
  const { consultationId, amount } = route.params;

  const [isLoading, setIsLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  useEffect(() => {
    createPaymentSession();
  }, []);

  const createPaymentSession = async () => {
    try {
      setIsLoading(true);
      const response = await api.post('/payments/session', {
        consultationId,
        successUrl: 'canalmedico://payment/success',
        cancelUrl: 'canalmedico://payment/cancel',
      });

      if (response.success && response.data?.url) {
        setPaymentUrl(response.data.url);
        // Abrir URL de pago en el navegador
        Linking.openURL(response.data.url).catch((error) => {
          Alert.alert('Error', 'No se pudo abrir la página de pago');
        });
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al crear sesión de pago');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    createPaymentSession();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Ionicons name="card" size={64} color={colors.primary[600]} />
          <Text style={styles.title}>Procesar Pago</Text>
          <Text style={styles.subtitle}>Monto a pagar</Text>
          <Text style={styles.amount}>${amount.toFixed(2)}</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
            <Text style={styles.loadingText}>Procesando pago...</Text>
          </View>
        ) : paymentUrl ? (
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Se abrirá una ventana para completar el pago de forma segura.
            </Text>
            <Text style={styles.infoText}>
              Una vez completado el pago, serás redirigido de vuelta a la app.
            </Text>
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
});

