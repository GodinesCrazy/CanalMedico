import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Consultation, Patient } from '@/types';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

type ConsultationsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function ConsultationsScreen() {
  const navigation = useNavigation<ConsultationsScreenNavigationProp>();
  const user = useAuthStore((state) => state.user);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadConsultations();
  }, []);

  const loadConsultations = async () => {
    try {
      setIsLoading(true);
      const patientId = (user?.profile as Patient)?.id;

      if (!patientId) return;

      const response = await api.get<Consultation[]>(`/consultations/patient/${patientId}`);
      if (response.success && response.data) {
        setConsultations(response.data);
      }
    } catch (error) {
      console.error('Error al cargar consultas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConsultations();
    setRefreshing(false);
  };

  const renderConsultation = ({ item }: { item: Consultation }) => {
    const getStatusColor = () => {
      switch (item.status) {
        case 'ACTIVE':
          return colors.success[500];
        case 'CLOSED':
          return colors.gray[400];
        case 'PAID':
          return colors.primary[500];
        default:
          return colors.warning[500];
      }
    };

    return (
      <TouchableOpacity
        style={styles.consultationCard}
        onPress={() => navigation.navigate('ConsultationDetail', { consultationId: item.id })}
      >
        <View style={styles.consultationHeader}>
          <View style={styles.doctorInfo}>
            <View style={styles.doctorAvatar}>
              <Text style={styles.doctorAvatarText}>
                {item.doctor?.name?.charAt(0).toUpperCase() || 'D'}
              </Text>
            </View>
            <View style={styles.doctorDetails}>
              <Text style={styles.doctorName}>{item.doctor?.name || 'Doctor'}</Text>
              <Text style={styles.doctorSpeciality}>{item.doctor?.speciality || 'N/A'}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.consultationBody}>
          <View style={styles.consultationRow}>
            <Ionicons name="calendar" size={16} color={colors.gray[600]} />
            <Text style={styles.consultationDate}>
              {format(new Date(item.createdAt), 'dd/MM/yyyy')}
            </Text>
          </View>
          <View style={styles.consultationRow}>
            <Ionicons name="medical" size={16} color={colors.gray[600]} />
            <Text style={styles.consultationType}>
              {item.type === 'URGENCIA' ? 'Urgencia' : 'Normal'}
            </Text>
          </View>
        </View>

        <View style={styles.consultationFooter}>
          <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Cargando consultas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={consultations}
        renderItem={renderConsultation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={colors.gray[400]} />
            <Text style={styles.emptyText}>No hay consultas disponibles</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  list: {
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
  consultationCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  consultationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  doctorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doctorAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 2,
  },
  doctorSpeciality: {
    fontSize: 14,
    color: colors.gray[600],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  consultationBody: {
    marginTop: 8,
  },
  consultationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  consultationDate: {
    fontSize: 14,
    color: colors.gray[600],
    marginLeft: 8,
  },
  consultationType: {
    fontSize: 14,
    color: colors.gray[600],
    marginLeft: 8,
  },
  consultationFooter: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray[500],
    marginTop: 16,
  },
});

