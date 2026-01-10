/**
 * Quick Consultation Screen
 * 
 * Pantalla que se abre cuando paciente hace clic en deep link de WhatsApp.
 * Redirige automáticamente a OTP Verification.
 * 
 * FASE 3: Login invisible
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types';
import { colors } from '@/theme/colors';
import { Logo } from '@/components/Logo';

type QuickConsultationScreenRouteProp = RouteProp<RootStackParamList, 'QuickConsultation'>;
type QuickConsultationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'QuickConsultation'>;

export default function QuickConsultationScreen() {
  const route = useRoute<QuickConsultationScreenRouteProp>();
  const navigation = useNavigation<QuickConsultationScreenNavigationProp>();
  const { doctorId, phone, attemptId } = route.params || {};

  useEffect(() => {
    // Redirigir inmediatamente a OTP Verification
    if (phone) {
      navigation.replace('OTPVerification', {
        phoneNumber: phone,
        attemptId,
      });
    }
  }, [phone, attemptId, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Logo variant="full" className="h-12 w-auto mx-auto mb-4" />
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Preparando tu consulta...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[50],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray[600],
  },
});

