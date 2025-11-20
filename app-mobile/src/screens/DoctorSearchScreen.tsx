import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Doctor, Consultation, ConsultationType } from '@/types';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';

type DoctorSearchScreenRouteProp = RouteProp<RootStackParamList, 'DoctorSearch'>;
type DoctorSearchScreenNavigationProp = StackNavigationProp<RootStackParamList, 'DoctorSearch'>;

export default function DoctorSearchScreen() {
  const route = useRoute<DoctorSearchScreenRouteProp>();
  const navigation = useNavigation<DoctorSearchScreenNavigationProp>();
  const doctorId = route.params?.doctorId;
  const user = useAuthStore((state) => state.user);

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [consultationType, setConsultationType] = useState<ConsultationType>('NORMAL');

  useEffect(() => {
    if (doctorId) {
      loadDoctor(doctorId);
    } else {
      loadDoctors();
    }
  }, [doctorId]);

  const loadDoctor = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await api.get<Doctor>(`/doctors/${id}`);
      if (response.success && response.data) {
        setDoctor(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el doctor');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<Doctor[]>('/doctors');
      if (response.success && response.data) {
        setDoctors(response.data);
      }
    } catch (error) {
      console.error('Error al cargar doctores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateConsultation = async () => {
    if (!doctor || !user) {
      Alert.alert('Error', 'Datos incompletos');
      return;
    }

    const patientId = (user.profile as any)?.id;
    if (!patientId) {
      Alert.alert('Error', 'No se encontró el ID del paciente');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post<Consultation>('/consultations', {
        doctorId: doctor.id,
        patientId,
        type: consultationType,
      });

      if (response.success && response.data) {
        Alert.alert(
          'Consulta Creada',
          'Consulta creada exitosamente. Procede al pago.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('Payment', {
                  consultationId: response.data!.id,
                  amount:
                    consultationType === 'URGENCIA'
                      ? doctor.tarifaUrgencia
                      : doctor.tarifaConsulta,
                });
              },
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al crear consulta');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !doctor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (doctor) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.doctorDetail}>
          <View style={styles.doctorHeader}>
            <View style={styles.doctorAvatar}>
              <Text style={styles.doctorAvatarText}>
                {doctor.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{doctor.name}</Text>
              <Text style={styles.doctorSpeciality}>{doctor.speciality}</Text>
              <View style={styles.onlineIndicator}>
                <View
                  style={[
                    styles.onlineDot,
                    doctor.estadoOnline ? styles.onlineDotActive : styles.onlineDotInactive,
                  ]}
                />
                <Text style={styles.onlineText}>
                  {doctor.estadoOnline ? 'En línea' : 'Fuera de línea'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.pricing}>
            <Text style={styles.pricingTitle}>Tarifas</Text>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Consulta Normal:</Text>
              <Text style={styles.pricingValue}>${doctor.tarifaConsulta.toFixed(2)}</Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Consulta Urgencia:</Text>
              <Text style={styles.pricingValue}>${doctor.tarifaUrgencia.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.consultationType}>
            <Text style={styles.consultationTypeTitle}>Tipo de Consulta</Text>
            <View style={styles.typeButtons}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  consultationType === 'NORMAL' && styles.typeButtonActive,
                ]}
                onPress={() => setConsultationType('NORMAL')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    consultationType === 'NORMAL' && styles.typeButtonTextActive,
                  ]}
                >
                  Normal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  consultationType === 'URGENCIA' && styles.typeButtonActive,
                ]}
                onPress={() => setConsultationType('URGENCIA')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    consultationType === 'URGENCIA' && styles.typeButtonTextActive,
                  ]}
                >
                  Urgencia
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.createButton, (!doctor.estadoOnline || isLoading) && styles.createButtonDisabled]}
            onPress={handleCreateConsultation}
            disabled={!doctor.estadoOnline || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="medical" size={24} color={colors.white} />
                <Text style={styles.createButtonText}>
                  Crear Consulta - $
                  {(
                    consultationType === 'URGENCIA' ? doctor.tarifaUrgencia : doctor.tarifaConsulta
                  ).toFixed(2)}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const filteredDoctors = doctors.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.speciality.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.gray[400]} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar doctor..."
          placeholderTextColor={colors.gray[400]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredDoctors}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.doctorCard}
            onPress={() => navigation.navigate('DoctorSearch' as any, { doctorId: item.id })}
          >
            <View style={styles.doctorCardHeader}>
              <View style={styles.doctorCardAvatar}>
                <Text style={styles.doctorCardAvatarText}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.doctorCardInfo}>
                <Text style={styles.doctorCardName}>{item.name}</Text>
                <Text style={styles.doctorCardSpeciality}>{item.speciality}</Text>
                <View style={styles.onlineIndicator}>
                  <View
                    style={[
                      styles.onlineDot,
                      item.estadoOnline ? styles.onlineDotActive : styles.onlineDotInactive,
                    ]}
                  />
                  <Text style={styles.onlineText}>
                    {item.estadoOnline ? 'En línea' : 'Fuera de línea'}
                  </Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No se encontraron doctores</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: colors.gray[900],
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  doctorCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  doctorCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  doctorCardAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doctorCardAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  doctorCardInfo: {
    flex: 1,
  },
  doctorCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  doctorCardSpeciality: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 4,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  onlineDotActive: {
    backgroundColor: colors.success[500],
  },
  onlineDotInactive: {
    backgroundColor: colors.gray[400],
  },
  onlineText: {
    fontSize: 12,
    color: colors.gray[600],
  },
  emptyContainer: {
    paddingVertical: 64,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray[500],
  },
  doctorDetail: {
    padding: 16,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  doctorAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  doctorAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 4,
  },
  doctorSpeciality: {
    fontSize: 16,
    color: colors.gray[600],
    marginBottom: 8,
  },
  pricing: {
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
  pricingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 12,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pricingLabel: {
    fontSize: 16,
    color: colors.gray[700],
  },
  pricingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[600],
  },
  consultationType: {
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
  consultationTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  typeButtonTextActive: {
    color: colors.primary[600],
  },
  createButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

