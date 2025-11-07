import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, ImageBackground, StyleSheet } from 'react-native';
// --- ¡ARREGLO DE IMPORTACIÓN! ---
import { SafeAreaView } from 'react-native-safe-area-context';

const splashImage = require('../assets/images/splash_background.png');

export default function SplashScreen() {

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 3000); 

    return () => clearTimeout(timer);
  }, []);

  return (
    <ImageBackground source={splashImage} style={styles.background}>
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FFFFFF" style={styles.spinner} />
      </SafeAreaView> 
    </ImageBackground>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover', 
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end', 
    alignItems: 'center', 
  },
  spinner: {
    marginBottom: 80, 
  }
});