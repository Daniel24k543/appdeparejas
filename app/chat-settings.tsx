import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';

import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';

// --- ¡NUEVO! Paleta de colores "Free" ---
const CHAT_COLORS = [
  '#FF69B4', // Rosa (Default)
  '#007AFF', // Azul
  '#34C759', // Verde
  '#FF9500', // Naranja
  '#AF52DE', // Morado
  '#FF3B30', // Rojo
];

// --- Tema Claro (¡NUEVO!) ---
const lightTheme = {
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { backgroundColor: '#FFF', borderBottomColor: '#EEE' },
  title: { color: '#000' },
  label: { color: '#555' },
  chatPreview: { backgroundColor: '#F0F0F0' },
  chatMessageThem: { backgroundColor: '#E5E5EA' },
  chatText: { color: '#000' },
  button: { backgroundColor: '#F0F0F0' },
  buttonText: { color: '#000' },
  icon: { color: '#FF69B4' },
};

// --- Tema Oscuro (¡NUEVO!) ---
const darkTheme = {
  container: { flex: 1, backgroundColor: '#1C1C1E' }, 
  header: { backgroundColor: '#2C2C2E', borderBottomColor: '#3A3A3C' },
  title: { color: '#FFF' },
  label: { color: '#8E8E93' },
  chatPreview: { backgroundColor: '#2C2C2E' },
  chatMessageThem: { backgroundColor: '#3A3A3C' },
  chatText: { color: '#FFF' },
  button: { backgroundColor: '#2C2C2E' },
  buttonText: { color: '#FFF' },
  icon: { color: '#FF69B4' },
};

export default function ChatSettingsScreen() {
  const { roomID } = useLocalSearchParams(); 
  
  const [settings, setSettings] = useState({
    textSize: 16, // Lo mantenemos "por dentro" pero sin slider
    cornerRadius: 20,
    themeMode: 'dark', // 'dark' o 'light'
    myColor: '#FF69B4', 
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const settingsRef = doc(db, 'rooms', roomID as string, 'settings', 'chat');

  // Aplicamos el tema actual
  const theme = settings.themeMode === 'light' ? lightTheme : darkTheme;

  // 1. "Escucha" los ajustes
  useEffect(() => {
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings(prev => ({ ...prev, ...data })); 
      } else {
        saveSettings(settings); // Crea los ajustes por defecto
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [roomID]);

  // 2. Función para guardar
  const saveSettings = async (settingsToSave) => {
    try {
      await setDoc(settingsRef, settingsToSave, { merge: true });
    } catch (error) {
      console.error("Error al guardar ajustes:", error);
    }
  };

  // 3. --- ¡LÓGICA DE FONDO ARREGLADA! ---
  const handleBackgroundUpload = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.granted === false) {
      alert('¡Necesitas dar permisos para subir fotos!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5, 
    });

    if (result.canceled || !roomID) return;
    
    const uri = result.assets[0].uri;
    
    try {
      Alert.alert("Subiendo fondo...", "Tu nuevo fondo se está subiendo.");
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `rooms/${roomID}/chatBackground.jpg`);
      
      const uploadTask = uploadBytesResumable(storageRef, blob);
      
      uploadTask.then(async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        // ¡Guarda la URL del fondo en los ajustes!
        await saveSettings({ backgroundUrl: downloadURL });
        Alert.alert("¡Éxito!", "Fondo de pantalla actualizado.");
      });
    } catch (error) {
      console.error("Error al subir fondo:", error);
    }
  };
  
  // 4. Cambia el modo diurno/nocturno
  const handleToggleTheme = () => {
    const newTheme = settings.themeMode === 'dark' ? 'light' : 'dark';
    setSettings(prev => ({ ...prev, themeMode: newTheme })); 
    saveSettings({ themeMode: newTheme }); 
  };
  
  if (isLoading) {
    return <ActivityIndicator size="large" style={{flex: 1, backgroundColor: '#222'}} color="#FF69B4" />;
  }

  return (
    <SafeAreaView style={[styles.container, theme.container]} edges={['bottom', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, theme.header]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={theme.title.color} />
        </TouchableOpacity>
        <Text style={[styles.title, theme.title]}>Ajustes de chats</Text>
        <View style={{ width: 28 }} /> 
      </View>
      
      <ScrollView style={styles.content}>
        
        {/* --- ¡SLIDER DE TAMAÑO DE TEXTO ELIMINADO! --- */}
        
        {/* Preview del chat */}
        <View style={[styles.chatPreview, theme.chatPreview]}>
          <View style={[styles.chatMessageThem, theme.chatMessageThem, { borderRadius: settings.cornerRadius }]}>
            <Text style={[styles.chatText, theme.chatText, { fontSize: settings.textSize }]}>¿Sabes qué hora es?</Text>
          </View>
          <View style={[styles.chatMessageMe, { 
            borderRadius: settings.cornerRadius,
            backgroundColor: settings.myColor
          }]}>
            <Text style={[styles.chatText, theme.chatText, { fontSize: settings.textSize, color: '#FFF' }]}>Es de mañana en Tokio 😎</Text>
          </View>
        </View>

        {/* Selector de Color "Free" */}
        <Text style={[styles.label, theme.label]}>Cambiar tu color</Text>
        <View style={[styles.colorPalette, theme.button]}>
          {CHAT_COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorCircle, 
                { backgroundColor: color },
                settings.myColor === color && styles.selectedColor 
              ]}
              onPress={() => {
                setSettings(prev => ({...prev, myColor: color})); 
                saveSettings({ myColor: color }); 
              }}
            />
          ))}
        </View>

        {/* Botones de Personalización */}
        <TouchableOpacity style={[styles.button, theme.button]} onPress={handleBackgroundUpload}>
          <Ionicons name="image-outline" size={22} color={theme.icon.color} style={styles.icon} />
          <Text style={[styles.buttonText, theme.buttonText]}>Cambiar fondo de pantalla</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, theme.button]} onPress={handleToggleTheme}>
          <Ionicons name={settings.themeMode === 'dark' ? 'sunny-outline' : 'moon-outline'} size={22} color={theme.icon.color} style={styles.icon} />
          <Text style={[styles.buttonText, theme.buttonText]}>
            {settings.themeMode === 'dark' ? 'Cambiar a modo diurno' : 'Cambiar a modo nocturno'}
          </Text>
        </TouchableOpacity>
        
        {/* Esquinas (¡Este se queda!) */}
        <Text style={[styles.label, theme.label]}>Esquinas de los mensajes: {Math.round(settings.cornerRadius)}</Text>
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={0}
          maximumValue={20}
          step={1}
          value={settings.cornerRadius}
          minimumTrackTintColor="#FF69B4"
          maximumTrackTintColor="#555"
          thumbTintColor="#FFF"
          onSlidingComplete={(value) => saveSettings({ cornerRadius: value })}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: {}, 
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  title: { fontSize: 22, fontWeight: 'bold' },
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 10,
    marginTop: 15,
  },
  chatPreview: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
  },
  chatMessageThem: {
    padding: 10,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  chatMessageMe: {
    padding: 10,
    alignSelf: 'flex-end',
  },
  chatText: {
    // El tamaño y color se aplican dinámicamente
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 10,
    marginTop: 10,
  },
  icon: {
    marginRight: 20,
    width: 25, 
    textAlign: 'center', 
  },
  buttonText: {
    fontSize: 16,
  },
  colorPalette: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 15,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#FFF', 
  },
});