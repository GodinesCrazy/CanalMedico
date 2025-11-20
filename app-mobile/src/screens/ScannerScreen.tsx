import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { RootStackParamList } from '@/types';
import { colors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { handleDeepLink } from '@/utils/linking';

type ScannerScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function ScannerScreen() {
  const navigation = useNavigation<ScannerScreenNavigationProp>();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;

    setScanned(true);
    const deepLink = handleDeepLink(data);

    if (deepLink && deepLink.type === 'doctor') {
      navigation.navigate('DoctorSearch' as any, { doctorId: deepLink.doctorId });
    } else {
      Alert.alert('Código no válido', 'El código escaneado no es válido', [
        {
          text: 'OK',
          onPress: () => setScanned(false),
        },
      ]);
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Solicitando permisos de cámara...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="camera-outline" size={64} color={colors.error[600]} />
          <Text style={styles.errorText}>Se necesita acceso a la cámara</Text>
          <Text style={styles.errorSubtext}>
            Por favor, permite el acceso a la cámara en la configuración de la app
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
            <Text style={styles.permissionButtonText}>Solicitar Permiso</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.scannerContainer}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={styles.corner} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.instruction}>Apunta la cámara al código QR del doctor</Text>
        </View>
        {scanned && (
          <TouchableOpacity
            style={styles.scanAgainButton}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.scanAgainText}>Escanear Nuevamente</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.primary[600],
    borderWidth: 3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    top: 0,
    left: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderRightWidth: 3,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopWidth: 3,
  },
  bottomLeft: {
    top: 'auto',
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 3,
    borderTopWidth: 0,
  },
  bottomRight: {
    top: 'auto',
    right: 0,
    bottom: 0,
    left: 'auto',
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instruction: {
    marginTop: 32,
    color: colors.white,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  scanAgainButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  scanAgainText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
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
    padding: 32,
    backgroundColor: colors.white,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.error[600],
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  permissionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

