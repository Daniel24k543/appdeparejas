import { FontAwesome5, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { updateProfile } from 'firebase/auth';
import { collection, getDocs, query, where, doc, getDoc, setDoc } from 'firebase/firestore'; 
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { auth, db } from '../firebaseConfig';

export default function ModalScreen() {
  const [userName, setUserName] = useState('');
  const [roomID, setRoomID] = useState<string | null>(null);
  const user = auth.currentUser;

  // Cargar nombre y sala (sin cambios)
  useEffect(() => {
    if (user) {
      setUserName(user.displayName || 'Mi nombre');
      const roomsRef = collection(db, 'rooms');
      const q = query(roomsRef, where('members', 'array-contains', user.uid));
      getDocs(q).then(querySnapshot => {
        if (!querySnapshot.empty) {
          setRoomID(querySnapshot.docs[0].id); 
        }
      });
    }
  }, [user]);

  // Funciones de UpdateName, ViewMembers, LinkPress, ResetAccount, InstallWidget...
  // ... (Toda la lógica de tus funciones se queda igual) ...
  const handleUpdateName = async () => { /* ... (código) ... */ };
  const handleViewMembers = async () => { /* ... (código) ... */ };
  const handleLinkPress = (url: string) => Linking.openURL(url);
  const handleResetAccount = () => { /* ... (código) ... */ };
  const handleInstallWidget = () => { /* ... (código) ... */ };

  // Componente de Botón (sin cambios)
  const SettingButton = ({ icon, name, onPress, iconSet = 'Ionicons' }: { icon: string; name: string; onPress: () => void; iconSet?: string }) => {
    const IconComponent = { Ionicons, MaterialCommunityIcons, MaterialIcons, FontAwesome5 }[iconSet];
    return (
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <IconComponent name={icon} size={22} color="#FF69B4" style={styles.icon} />
        <Text style={styles.buttonText}>{name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Header (sin cambios) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Ajustes</Text>
        <View style={{ width: 28 }} /> 
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Input nombre (sin cambios) */}
        <TextInput
          style={styles.nameInput}
          value={userName}
          onChangeText={setUserName}
          placeholder="Tu nombre"
          onEndEditing={handleUpdateName} 
        />

        {/* --- ¡Lista de Botones ACTUALIZADA! --- */}
        
        {/* --- ¡CAMBIO AQUÍ! --- */}
        <SettingButton
          iconSet="Ionicons"
          icon="chatbubble-ellipses-outline"
          name="Chat de Pareja"
          onPress={() => {
            // ¡Ahora pasamos el roomID a la pantalla de chat!
            if (roomID) {
              router.push({ pathname: '/chat', params: { roomID: roomID } });
            } else {
              Alert.alert("¡Sin sala!", "Crea o únete a una sala primero.");
            }
          }}
        />
        <SettingButton
          iconSet="Ionicons" 
          icon="gift-outline"             
          name="Enviar Regalos"
          onPress={() => router.push('/regalos')} 
        />
        
        {/* --- Resto de botones (sin cambios) --- */}
        <SettingButton
          icon="key-outline"
          name={roomID ? `Room-id: ${roomID.substring(0, 10)}...` : 'Sin sala'}
          onPress={() => {}}
        />
        <SettingButton
          icon="people-outline"
          name="Miembros de la sala"
          onPress={handleViewMembers}
        />
        <SettingButton
          iconSet="FontAwesome5" 
          icon="paw"             
          name="Mascota"
          onPress={() => alert('¡Próximamente: Tu mascota!')}
        />
        <SettingButton
          iconSet="MaterialCommunityIcons"
          icon="widgets-outline"
          name="Instalar widget"
          onPress={handleInstallWidget}
        />
        <SettingButton
          icon="card-outline"
          name="Administrar suscripción"
          onPress={() => alert('Próximamente...')}
        />
        <SettingButton
          icon="refresh-outline"
          name="Reiniciar cuenta"
          onPress={handleResetAccount}
        />
        <SettingButton
          iconSet="FontAwesome5"
          icon="tiktok"
          name="TikTok"
          onPress={() => handleLinkPress('https://www.tiktok.com/@tu_cuenta')}
        />
        <SettingButton
          iconSet="FontAwesome5"
          icon="discord"
          name="Discord"
          onPress={() => handleLinkPress('https://discord.gg/tu_servidor')}
        />

        {/* Ads (sin cambios) */}
        <View style={styles.adRemoveContainer}>
          <TouchableOpacity style={styles.adRemoveButton}>
            <MaterialIcons name="close" size={20} color="#E53935" />
            <Text style={styles.adRemoveText}>Quitar anuncios</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.adBanner}>
          <Text style={styles.adText}>Anuncio (ej. Temu) iría aquí</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- ESTILOS (sin cambios) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF6FF' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  title: { fontSize: 22, fontWeight: 'bold' },
  scrollContainer: { flex: 1 },
  nameInput: {
    backgroundColor: '#FFF',
    margin: 15,
    borderRadius: 15,
    padding: 18,
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    color: '#333',
    borderWidth: 1,
    borderColor: '#F0E4F4',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E4F4',
  },
  icon: { marginRight: 20, width: 25, textAlign: 'center' },
  buttonText: { fontSize: 16, color: '#333' },
  adRemoveContainer: { alignItems: 'center', marginTop: 30, marginBottom: 15 },
  adRemoveButton: { flexDirection: 'row', alignItems: 'center' },
  adRemoveText: { fontSize: 16, color: '#E53935', marginLeft: 5 },
  adBanner: {
    height: 60,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 15,
    borderRadius: 10,
  },
  adText: { color: '#777' },
});