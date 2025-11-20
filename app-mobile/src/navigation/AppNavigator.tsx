import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList } from '@/types';
import { useAuthStore } from '@/store/authStore';

// Screens
import LoginScreen from '@/screens/LoginScreen';
import RegisterScreen from '@/screens/RegisterScreen';
import HomeScreen from '@/screens/HomeScreen';
import ConsultationsScreen from '@/screens/ConsultationsScreen';
import ConsultationDetailScreen from '@/screens/ConsultationDetailScreen';
import ChatScreen from '@/screens/ChatScreen';
import PaymentScreen from '@/screens/PaymentScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import ScannerScreen from '@/screens/ScannerScreen';
import DoctorSearchScreen from '@/screens/DoctorSearchScreen';

import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.gray[400],
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Consultations"
        component={ConsultationsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />,
          title: 'Consultas',
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} />,
          title: 'Historial',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
          title: 'Perfil',
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="ConsultationDetail"
              component={ConsultationDetailScreen}
              options={{ headerShown: true, title: 'Detalle de Consulta' }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ headerShown: true, title: 'Chat' }}
            />
            <Stack.Screen
              name="Payment"
              component={PaymentScreen}
              options={{ headerShown: true, title: 'Pago' }}
            />
            <Stack.Screen
              name="Scanner"
              component={ScannerScreen}
              options={{ headerShown: true, title: 'Escanear Código' }}
            />
            <Stack.Screen
              name="DoctorSearch"
              component={DoctorSearchScreen}
              options={{ headerShown: true, title: 'Buscar Doctor' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

