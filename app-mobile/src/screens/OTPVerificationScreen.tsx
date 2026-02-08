/**
 * OTP Verification Screen
 * 
 * Pantalla para verificar código OTP recibido por WhatsApp.
 * 
 * FASE 3: Login invisible
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { colors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '@/components/Logo';

type OTPVerificationScreenRouteProp = RouteProp<RootStackParamList, 'OTPVerification'>;
type OTPVerificationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OTPVerification'>;

export default function OTPVerificationScreen() {
  const route = useRoute<OTPVerificationScreenRouteProp>();
  const navigation = useNavigation<OTPVerificationScreenNavigationProp>();
  const { phoneNumber, attemptId } = route.params || {};

  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Auto-enviar OTP al cargar
    if (phoneNumber) {
      sendOTP();
    }
  }, [phoneNumber]);

  useEffect(() => {
    // Countdown para reenvío
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendOTP = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Número de teléfono no proporcionado');
      return;
    }

    try {
      setIsSendingOTP(true);
      const response = await api.post('/auth/send-otp', {
        phoneNumber,
        attemptId,
        method: 'WHATSAPP',
      });

      if (response.success) {
        setCountdown(60); // 60 segundos para reenvío
        Alert.alert('Código enviado', 'Revisa tu WhatsApp para el código de verificación');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al enviar código OTP');
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleOTPChange = (value: string, index: number) => {
    // Solo permitir números
    if (value && !/^\d+$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;

    // Auto-avanzar al siguiente campo
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    setOtp(newOtp);

    // Auto-verificar cuando se completa el OTP
    if (newOtp.every((digit) => digit !== '') && newOtp.join('').length === 6) {
      verifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    // Retroceder al campo anterior si se presiona backspace en campo vacío
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOTP = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== 6) {
      Alert.alert('Error', 'El código OTP debe tener 6 dígitos');
      return;
    }

    if (!phoneNumber) {
      Alert.alert('Error', 'Número de teléfono no proporcionado');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post('/auth/verify-otp', {
        phoneNumber,
        otp: code,
        attemptId,
      });

      if (response.success && response.data) {
        const { user, accessToken, refreshToken, isNewUser, consultationId } = response.data;

        // Guardar tokens y usuario
        setTokens(accessToken, refreshToken);
        setUser(user);

        // Mostrar mensaje según si es usuario nuevo
        if (isNewUser) {
          Alert.alert(
            '¡Bienvenido!',
            'Tu cuenta ha sido creada automáticamente. Puedes editar tu perfil después.',
            [{ text: 'OK' }]
          );
        }

        // Si se creó consulta automáticamente, redirigir a pago
        if (consultationId) {
          // Obtener información de la consulta para el monto
          const consultationResponse = await api.get(`/consultations/${consultationId}`);
          if (consultationResponse.success && consultationResponse.data) {
            const consultation = consultationResponse.data;
            const amount = consultation.type === 'URGENCIA'
              ? consultation.doctor?.tarifaUrgencia || 0
              : consultation.doctor?.tarifaConsulta || 0;

            navigation.replace('Payment', {
              consultationId,
              amount: Number(amount),
            });
            return;
          }
        }

        // Si no hay consulta, ir a home
        navigation.replace('Home');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Código OTP inválido o expirado');
      // Limpiar OTP para reintentar
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Logo variant="full" className="h-12 w-auto mx-auto mb-2" />
            <Text style={styles.title}>Verificación de Código</Text>
            <Text style={styles.subtitle}>
              Hemos enviado un código de 6 dígitos a{'\n'}
              <Text style={styles.phoneNumber}>{phoneNumber || 'tu WhatsApp'}</Text>
            </Text>
          </View>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[styles.otpInput, digit && styles.otpInputFilled]}
                value={digit}
                onChangeText={(value) => handleOTPChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!isLoading}
              />
            ))}
          </View>

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary[600]} />
              <Text style={styles.loadingText}>Verificando código...</Text>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.resendButton, (countdown > 0 || isSendingOTP) && styles.resendButtonDisabled]}
              onPress={sendOTP}
              disabled={countdown > 0 || isSendingOTP}
            >
              {isSendingOTP ? (
                <ActivityIndicator size="small" color={colors.primary[600]} />
              ) : (
                <>
                  <Ionicons name="refresh" size={16} color={colors.primary[600]} />
                  <Text style={styles.resendButtonText}>
                    {countdown > 0 ? `Reenviar código (${countdown}s)` : 'Reenviar código'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
              onPress={() => verifyOTP()}
              disabled={isLoading || otp.join('').length !== 6}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.verifyButtonText}>Verificar</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              ¿No recibiste el código?{'\n'}
              Verifica que el número sea correcto o solicita un nuevo código.
            </Text>
            <Text style={styles.legalText}>
              Al continuar aceptas los Términos y Condiciones y la Política de Privacidad de CanalMedico.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[50],
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 20,
  },
  phoneNumber: {
    fontWeight: '600',
    color: colors.primary[600],
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  otpInput: {
    flex: 1,
    height: 60,
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
    backgroundColor: colors.white,
  },
  otpInputFilled: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: colors.gray[600],
  },
  actions: {
    gap: 12,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  helpContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
  },
  helpText: {
    fontSize: 12,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 18,
  },
  legalText: {
    marginTop: 12,
    fontSize: 11,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 16,
  },
});

