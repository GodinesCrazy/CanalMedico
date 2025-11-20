import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Consultation } from '@/types';
import api from '@/services/api';
import { colors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

type ConsultationDetailScreenRouteProp = RouteProp<RootStackParamList, 'ConsultationDetail'>;
type ConsultationDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ConsultationDetail'>;

export default function ConsultationDetailScreen() {
  const route = useRoute<ConsultationDetailScreenRouteProp>();
  const navigation = useNavigation<ConsultationDetailScreenNavigationProp>();
  const { consultationId } = route.params;

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConsultation();
  }, [consultationId]);

  const loadConsultation = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<Consultation>(`/consultations/${consultationId}`);
      if (response.success && response.data) {
        setConsultation(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la consulta');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = () => {
    if (consultation) {
      navigation.navigate('Payment', {
        consultationId: consultation.id,
        amount: consultation.type === 'URGENCIA'
          ? consultation.doctor?.tarifaUrgencia || 0
          : consultation.doctor?.tarifaConsulta || 0,
      });
    }
  };

  const handleChat = () => {
    if (consultation?.status === 'ACTIVE') {
      navigation.navigate('Chat', { consultationId: consultation.id });
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Cargando consulta...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!consultation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Consulta no encontrada</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.statusBadge}>
              <View
                style={[
                  styles.statusDot,
                  consultation.status === 'ACTIVE'
                    ? styles.statusDotActive
                    : consultation.status === 'CLOSED'
                    ? styles.statusDotClosed
                    : styles.statusDotPending,
                ]}
              />
              <Text style={styles.statusText}>{consultation.status}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Doctor</Text>
            <Text style={styles.value}>{consultation.doctor?.name || 'N/A'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Especialidad</Text>
            <Text style={styles.value}>{consultation.doctor?.speciality || 'N/A'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Tipo de Consulta</Text>
            <Text style={styles.value}>
              {consultation.type === 'URGENCIA' ? 'Urgencia' : 'Normal'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Fecha</Text>
            <Text style={styles.value}>
              {format(new Date(consultation.createdAt), 'dd/MM/yyyy HH:mm')}
            </Text>
          </View>

          {consultation.payment && (
            <View style={styles.section}>
              <Text style={styles.label}>Monto Pagado</Text>
              <Text style={styles.value}>
                ${Number(consultation.payment.amount).toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          {consultation.status === 'PENDING' && (
            <TouchableOpacity style={styles.paymentButton} onPress={handlePayment}>
              <Ionicons name="card" size={24} color={colors.white} />
              <Text style={styles.paymentButtonText}>Realizar Pago</Text>
            </TouchableOpacity>
          )}

          {consultation.status === 'ACTIVE' && (
            <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
              <Ionicons name="chatbubbles" size={24} color={colors.white} />
              <Text style={styles.chatButtonText}>Abrir Chat</Text>
            </TouchableOpacity>
          )}
        </View>
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.error[600],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusDotActive: {
    backgroundColor: colors.success[500],
  },
  statusDotClosed: {
    backgroundColor: colors.gray[400],
  },
  statusDotPending: {
    backgroundColor: colors.warning[500],
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  actions: {
    marginTop: 16,
  },
  paymentButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  paymentButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  chatButton: {
    backgroundColor: colors.success[600],
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chatButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

