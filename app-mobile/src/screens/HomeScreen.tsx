import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Doctor } from '@/types';
import api from '@/services/api';
import { colors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '@/components/Logo';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<Doctor[]>('/doctors/online');
      if (response.success && response.data) {
        setDoctors(response.data);
      }
    } catch (error) {
      console.error('Error al cargar doctores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDoctors();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Logo variant="full" className="h-12 w-auto mx-auto mb-2" />
          <Text style={styles.subtitle}>Médicos disponibles</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('DoctorSearch' as any)}>
            <Ionicons name="search" size={24} color={colors.white} />
            <Text style={styles.actionButtonText}>Buscar Doctor</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Scanner' as any)}>
            <Ionicons name="qr-code" size={24} color={colors.white} />
            <Text style={styles.actionButtonText}>Escanear Código</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Doctores en línea</Text>
          {isLoading ? (
            <Text style={styles.loadingText}>Cargando...</Text>
          ) : doctors.length === 0 ? (
            <Text style={styles.emptyText}>No hay doctores disponibles en este momento</Text>
          ) : (
            doctors.map((doctor) => (
              <TouchableOpacity
                key={doctor.id}
                style={styles.doctorCard}
                onPress={() => navigation.navigate('DoctorSearch' as any, { doctorId: doctor.id })}
              >
                <View style={styles.doctorInfo}>
                  <View style={styles.doctorAvatar}>
                    <Text style={styles.doctorAvatarText}>{doctor.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.doctorDetails}>
                    <Text style={styles.doctorName}>{doctor.name}</Text>
                    <Text style={styles.doctorSpeciality}>{doctor.speciality}</Text>
                    <View style={styles.onlineIndicator}>
                      <View style={styles.onlineDot} />
                      <Text style={styles.onlineText}>En línea</Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  header: { marginBottom: 24, alignItems: 'center' },
  subtitle: { fontSize: 16, color: colors.gray[600] },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionButton: { flex: 1, backgroundColor: colors.primary[600], borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionButtonText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.gray[900], marginBottom: 12 },
  loadingText: { textAlign: 'center', color: colors.gray[500], marginTop: 24 },
  emptyText: { textAlign: 'center', color: colors.gray[500], marginTop: 24 },
  doctorCard: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  doctorInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  doctorAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary[100], justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  doctorAvatarText: { fontSize: 20, fontWeight: 'bold', color: colors.primary[600] },
  doctorDetails: { flex: 1 },
  doctorName: { fontSize: 16, fontWeight: '600', color: colors.gray[900], marginBottom: 4 },
  doctorSpeciality: { fontSize: 14, color: colors.gray[600], marginBottom: 4 },
  onlineIndicator: { flexDirection: 'row', alignItems: 'center' },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success[500], marginRight: 4 },
  onlineText: { fontSize: 12, color: colors.success[600] },
});
