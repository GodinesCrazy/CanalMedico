import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
  ActionSheetIOS,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList, Message, Consultation } from '@/types';
import api from '@/services/api';
import socketService from '@/services/socket.service';
import filesService from '@/services/files.service';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

export default function ChatScreen() {
  const route = useRoute<ChatScreenRouteProp>();
  const { consultationId } = route.params;
  const user = useAuthStore((state) => state.user);
  const flatListRef = useRef<FlatList>(null);

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  useEffect(() => {
    loadConsultation();
    initializeSocket();

    return () => {
      socketService.leaveConsultation(consultationId);
    };
  }, [consultationId]);

  const loadConsultation = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<Consultation>(`/consultations/${consultationId}`);
      if (response.success && response.data) {
        setConsultation(response.data);

        // Cargar mensajes por separado
        const messagesResponse = await api.get<Message[]>(`/messages/consultation/${consultationId}`);
        if (messagesResponse.success && messagesResponse.data) {
          setMessages(messagesResponse.data);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la consulta');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeSocket = () => {
    socketService.joinConsultation(consultationId);

    const handleMessageReceived = (message: Message) => {
      setMessages((prev) => [...prev, message]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };

    const handleMessageError = (error: any) => {
      Alert.alert('Error', error.error || 'Error al enviar mensaje');
    };

    socketService.onMessageReceived(handleMessageReceived);
    socketService.onMessageError(handleMessageError);

    return () => {
      socketService.offMessageReceived(handleMessageReceived);
      socketService.offMessageError(handleMessageError);
    };
  };

  const sendMessage = async (fileUrl?: string, audioUrl?: string, pdfUrl?: string) => {
    if ((!newMessage.trim() && !fileUrl && !audioUrl && !pdfUrl) || !user) return;

    try {
      const messageData: any = {
        consultationId,
        senderId: user.id,
      };

      if (newMessage.trim()) {
        messageData.text = newMessage.trim();
      }

      if (fileUrl) messageData.fileUrl = fileUrl;
      if (audioUrl) messageData.audioUrl = audioUrl;
      if (pdfUrl) messageData.pdfUrl = pdfUrl;

      // Si hay socket disponible, usar socket.io, sino usar API REST
      if (socketService.isConnected()) {
        socketService.sendMessage(messageData);
      } else {
        // Fallback a API REST
        const response = await api.post<Message>('/messages', messageData);
        if (response.success && response.data) {
          setMessages((prev) => [...prev, response.data!]);
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      }

      setNewMessage('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al enviar mensaje');
    }
  };

  const showImageOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Tomar Foto', 'Elegir de Galería'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            takePicture();
          } else if (buttonIndex === 2) {
            pickImageFromLibrary();
          }
        }
      );
    } else {
      Alert.alert(
        'Seleccionar Imagen',
        'Elige una opción',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Tomar Foto', onPress: takePicture },
          { text: 'Elegir de Galería', onPress: pickImageFromLibrary },
        ]
      );
    }
  };

  const pickImageFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesita acceso a la galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAndSendImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Error al seleccionar imagen');
    }
  };

  const takePicture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesita acceso a la cámara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAndSendImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Error al tomar foto');
    }
  };

  const uploadAndSendImage = async (uri: string) => {
    try {
      setIsUploading(true);
      const fileUrl = await filesService.uploadFile(uri, 'consultations');
      await sendMessage(fileUrl);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al subir imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await uploadAndSendPDF(result.assets[0].uri, result.assets[0].name || 'documento.pdf');
      }
    } catch (error) {
      Alert.alert('Error', 'Error al seleccionar documento');
    }
  };

  const uploadAndSendPDF = async (uri: string, filename: string) => {
    try {
      setIsUploading(true);
      const pdfUrl = await filesService.uploadDocument(uri, filename, 'consultations');
      await sendMessage(undefined, undefined, pdfUrl);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al subir PDF');
    } finally {
      setIsUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesita acceso al micrófono');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      Alert.alert('Error', 'Error al iniciar grabación');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        await uploadAndSendAudio(uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Error al detener grabación');
    }
  };

  const uploadAndSendAudio = async (uri: string | null) => {
    if (!uri) return;

    try {
      setIsUploading(true);
      const audioUrl = await filesService.uploadAudio(uri, 'consultations');
      await sendMessage(undefined, audioUrl);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al subir audio');
    } finally {
      setIsUploading(false);
    }
  };

  const playAudio = async (audioUrl: string) => {
    try {
      if (sound && playingAudio === audioUrl) {
        // Si está reproduciendo el mismo audio, detenerlo
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setPlayingAudio(null);
        return;
      }

      // Detener audio anterior si existe
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUrl });
      setSound(newSound);
      setPlayingAudio(audioUrl);

      await newSound.playAsync();

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingAudio(null);
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Error al reproducir audio');
    }
  };

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [sound, recording]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.id;
    const isPlayingThisAudio = playingAudio === item.audioUrl;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwn ? styles.messageOwn : styles.messageOther,
        ]}
      >
        {item.text && (
          <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
            {item.text}
          </Text>
        )}

        {item.fileUrl && (
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={() => {
              // Abrir imagen en visor o navegador
              Linking.openURL(item.fileUrl!);
            }}
          >
            <Image source={{ uri: item.fileUrl }} style={styles.messageImage} resizeMode="cover" />
          </TouchableOpacity>
        )}

        {item.pdfUrl && (
          <TouchableOpacity
            style={styles.fileContainer}
            onPress={() => Linking.openURL(item.pdfUrl!)}
          >
            <Ionicons name="document-text" size={24} color={isOwn ? colors.white : colors.primary[600]} />
            <Text style={[styles.fileText, isOwn && styles.fileTextOwn]}>Ver PDF</Text>
            <Ionicons name="open-outline" size={16} color={isOwn ? colors.white : colors.primary[600]} />
          </TouchableOpacity>
        )}

        {item.audioUrl && (
          <TouchableOpacity
            style={[styles.audioContainer, isOwn && styles.audioContainerOwn]}
            onPress={() => playAudio(item.audioUrl!)}
          >
            <Ionicons
              name={isPlayingThisAudio ? 'pause-circle' : 'play-circle'}
              size={32}
              color={isOwn ? colors.white : colors.primary[600]}
            />
            <View style={styles.audioInfo}>
              <Text style={[styles.audioText, isOwn && styles.audioTextOwn]}>
                {isPlayingThisAudio ? 'Reproduciendo...' : 'Reproducir audio'}
              </Text>
              <View
                style={[
                  styles.audioWave,
                  isPlayingThisAudio && styles.audioWaveActive,
                  isOwn && isPlayingThisAudio && styles.audioWaveOwn,
                ]}
              />
            </View>
          </TouchableOpacity>
        )}

        <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>
          {format(new Date(item.createdAt), 'HH:mm')}
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {consultation?.status === 'ACTIVE' && (
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={showImageOptions}
              disabled={isUploading || isRecording}
            >
              <Ionicons
                name="image"
                size={24}
                color={isUploading || isRecording ? colors.gray[400] : colors.primary[600]}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={pickDocument}
              disabled={isUploading || isRecording}
            >
              <Ionicons
                name="document"
                size={24}
                color={isUploading || isRecording ? colors.gray[400] : colors.primary[600]}
              />
            </TouchableOpacity>
            {isRecording ? (
              <TouchableOpacity
                style={[styles.recordingButton]}
                onPress={stopRecording}
              >
                <View style={styles.recordingIndicator} />
                <Text style={styles.recordingText}>Grabando... Toca para detener</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.attachButton}
                onPress={startRecording}
                disabled={isUploading}
              >
                <Ionicons
                  name="mic"
                  size={24}
                  color={isUploading ? colors.gray[400] : colors.primary[600]}
                />
              </TouchableOpacity>
            )}
            <TextInput
              style={styles.input}
              placeholder="Escribe un mensaje..."
              placeholderTextColor={colors.gray[400]}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
              editable={!isUploading && !isRecording}
            />
            {isUploading ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="small" color={colors.primary[600]} />
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!newMessage.trim() && !isRecording) && styles.sendButtonDisabled,
                ]}
                onPress={() => sendMessage()}
                disabled={!newMessage.trim() && !isRecording}
              >
                <Ionicons name="send" size={24} color={colors.white} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {consultation?.status === 'CLOSED' && (
          <View style={styles.closedContainer}>
            <Text style={styles.closedText}>Esta consulta ha sido cerrada</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.gray[600],
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  messageOwn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary[600],
  },
  messageOther: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
  },
  messageText: {
    fontSize: 16,
    color: colors.gray[900],
    marginBottom: 4,
  },
  messageTextOwn: {
    color: colors.white,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  fileText: {
    fontSize: 14,
    color: colors.gray[600],
    marginLeft: 4,
  },
  fileTextOwn: {
    color: colors.white,
  },
  messageTime: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
  messageTimeOwn: {
    color: colors.primary[100],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.gray[100],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
    color: colors.gray[900],
  },
  sendButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 20,
    padding: 10,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  uploadingContainer: {
    padding: 10,
    marginLeft: 8,
  },
  imageContainer: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
  },
  audioContainerOwn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  audioInfo: {
    marginLeft: 12,
    flex: 1,
  },
  audioText: {
    fontSize: 14,
    color: colors.gray[700],
    marginBottom: 4,
  },
  audioTextOwn: {
    color: colors.white,
  },
  audioWave: {
    height: 4,
    backgroundColor: colors.gray[300],
    borderRadius: 2,
    width: '80%',
  },
  audioWaveActive: {
    backgroundColor: colors.primary[300],
  },
  audioWaveOwn: {
    backgroundColor: colors.primary[200],
  },
  recordingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error[50],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.error[600],
    marginRight: 8,
  },
  recordingText: {
    fontSize: 14,
    color: colors.error[600],
    fontWeight: '600',
  },
  closedContainer: {
    backgroundColor: colors.warning[50],
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.warning[200],
  },
  closedText: {
    textAlign: 'center',
    color: colors.warning[700],
    fontSize: 14,
  },
});

