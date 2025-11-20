import Constants from 'expo-constants';

export const API_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
export const STRIPE_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.stripePublishableKey || process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
export const FIREBASE_API_KEY = Constants.expoConfig?.extra?.firebaseApiKey || process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '';

export default {
  API_URL,
  STRIPE_PUBLISHABLE_KEY,
  FIREBASE_API_KEY,
};

