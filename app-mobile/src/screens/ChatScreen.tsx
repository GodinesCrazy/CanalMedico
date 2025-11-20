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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList, Message, Consultation } from '@/types';
import api from '@/services/api';
import socketService from '@/services/socket.service';
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
        setMessages(response.data.messages || []);
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

  const sendMessage = () => {
    if (!newMessage.trim() || !user) return;

    socketService.sendMessage({
      consultationId,
      senderId: user.id,
      text: newMessage.trim(),
    });

    setNewMessage('');
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Subir imagen y enviar mensaje
        // TODO: Implementar subida de archivo
        Alert.alert('Info', 'Subida de imagen próximamente');
      }
    } catch (error) {
      Alert.alert('Error', 'Error al seleccionar imagen');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
      });

      if (!result.canceled && result.output) {
        // Subir PDF y enviar mensaje
        // TODO: Implementar subida de archivo
        Alert.alert('Info', 'Subida de PDF próximamente');
      }
    } catch (error) {
      Alert.alert('Error', 'Error al seleccionar documento');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.id;
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
        {(item.fileUrl || item.audioUrl || item.pdfUrl) && (
          <View style={styles.fileContainer}>
            <Ionicons name="document" size={20} color={isOwn ? colors.white : colors.gray[600]} />
            <Text style={[styles.fileText, isOwn && styles.fileTextOwn]}>Archivo adjunto</Text>
          </View>
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
            <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
              <Ionicons name="image" size={24} color={colors.primary[600]} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachButton} onPress={pickDocument}>
              <Ionicons name="document" size={24} color={colors.primary[600]} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Escribe un mensaje..."
              placeholderTextColor={colors.gray[400]}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!newMessage.trim()}
            >
              <Ionicons name="send" size={24} color={colors.white} />
            </TouchableOpacity>
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
});

