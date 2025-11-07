import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ScrollView,
  KeyboardAvoidingView, 
  Platform,
  ImageBackground // <--- ¡Importante!
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, FontAwesome, FontAwesome5 } from '@expo/vector-icons'; // <--- Añadimos FontAwesome5
import * as WebBrowser from 'expo-web-browser';

import {
  collection,
  query,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy,
  doc,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

// Imagen de fondo por defecto
const defaultChatBg = require('../assets/images/splash_background.png'); 

// --- Temas claro y oscuro ---
const lightTheme = {
  container: { backgroundColor: '#FFF' },
  header: { backgroundColor: '#FFF', borderBottomColor: '#EEE' },
  title: { color: '#000' },
  chatContainer: { }, // <-- Fondo transparente por defecto
  theirMessage: { backgroundColor: '#FFF' },
  myMessage: { backgroundColor: '#FF69B4' }, 
  messageText: { color: '#000' },
  inputContainer: { backgroundColor: '#FFF', borderTopColor: '#EEE' },
  textInput: { backgroundColor: '#F0F0F0', color: '#000' },
  icon: { color: '#555' }
};

const darkTheme = {
  container: { backgroundColor: '#1C1C1E' },
  header: { backgroundColor: '#2C2C2E', borderBottomColor: '#3A3A3C' },
  title: { color: '#FFF' },
  chatContainer: { }, // <-- Fondo transparente por defecto
  theirMessage: { backgroundColor: '#3A3A3C' },
  myMessage: { backgroundColor: '#FF69B4' }, 
  messageText: { color: '#FFF' },
  inputContainer: { backgroundColor: '#2C2C2E', borderTopColor: '#3A3A3C' },
  textInput: { backgroundColor: '#3A3A3C', color: '#FFF' },
  icon: { color: '#AAA' }
};

export default function ChatScreen() {
  const { roomID } = useLocalSearchParams(); 
  const user = auth.currentUser;
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const currentCallUrlRef = useRef<string | null>(null);

  const [chatSettings, setChatSettings] = useState({
    textSize: 16,
    cornerRadius: 20,
    backgroundUrl: null,
    themeMode: 'dark', 
    myColor: '#FF69B4',
  });

  const theme = chatSettings.themeMode === 'light' ? lightTheme : darkTheme;

  // --- ¡EFECTO DE ESCUCHA (ACTUALIZADO)! ---
  useEffect(() => {
    if (!roomID) {
      Alert.alert("Error", "No se encontró la sala.", [{ text: "OK", onPress: () => router.back() }]);
      return;
    }
    
    // 1. Escuchar la sala (para videollamadas)
    const roomDocRef = doc(db, 'rooms', roomID as string);
    const unsubscribeRoom = onSnapshot(roomDocRef, (docSnap) => {
      // ... (lógica de videollamada sin cambios) ...
    });

    // 2. Escuchar los mensajes
    const messagesRef = collection(db, 'rooms', roomID as string, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc')); 
    const unsubscribeMessages = onSnapshot(q, (querySnapshot) => {
      const msgs = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs);
    });
    
    // 3. --- ¡Escuchar los Ajustes del Chat! ---
    const settingsRef = doc(db, 'rooms', roomID as string, 'settings', 'chat');
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setChatSettings(docSnap.data());
      }
    });

    return () => {
      unsubscribeRoom();
      unsubscribeMessages();
      unsubscribeSettings(); 
    };
  }, [roomID]);

  // --- Función para Enviar Mensaje (sin cambios) ---
  const handleSend = async () => {
    if (inputText.trim() === '' || !roomID) return;
    const messagesRef = collection(db, 'rooms', roomID as string, 'messages');
    try {
      await addDoc(messagesRef, {
        text: inputText,
        senderId: user.uid,
        senderName: user.displayName || 'Invitado',
        createdAt: serverTimestamp(),
      });
      setInputText(''); 
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
    }
  };
  
  // --- Función de Videollamada (sin cambios) ---
  const handleStartVideoCall = async () => {
    if (!roomID) return;
    const callUrl = `https://meet.jit.si/DuoLove-${roomID}`;
    currentCallUrlRef.current = callUrl; 
    try {
      const roomDocRef = doc(db, 'rooms', roomID as string);
      await updateDoc(roomDocRef, { activeCallURL: callUrl });
      await WebBrowser.openBrowserAsync(callUrl);
    } catch (error) {
      console.error("Error al iniciar llamada:", error);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[{ flex: 1 }, theme.container]}
      keyboardVerticalOffset={0}
    >
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Header (Aplicando tema) */}
        <View style={[styles.header, theme.header]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={theme.title.color} />
          </TouchableOpacity>
          <Text style={[styles.title, theme.title]}>Chat de Pareja</Text>
          <View style={{flexDirection: 'row'}}>
            <TouchableOpacity onPress={handleStartVideoCall} style={{marginRight: 15}}>
              <Ionicons name="videocam-outline" size={28} color="#FF3B30" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push({ pathname: '/chat-settings', params: { roomID: roomID }})}>
              <Ionicons name="settings-outline" size={24} color={theme.title.color} />
            </TouchableOpacity> 
          </View>
        </View>
        
        {/* --- ¡ARREGLO DEL FONDO! --- */}
        <ImageBackground 
          // Si hay un fondo en los ajustes, úsalo. Si no, usa el de Navidad.
          source={chatSettings.backgroundUrl ? { uri: chatSettings.backgroundUrl } : defaultChatBg}
          style={[styles.chatContainer, theme.chatContainer]}
          imageStyle={{ opacity: 0.3 }} 
        >
          <ScrollView 
            ref={scrollViewRef}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            contentContainerStyle={{ padding: 10 }}
            style={{ backgroundColor: 'transparent' }} // <-- ¡Hacemos el ScrollView transparente!
          >
            {messages.map((msg) => (
              <View 
                key={msg.id} 
                style={[
                  styles.messageBubble,
                  { borderRadius: chatSettings.cornerRadius || 20 }, 
                  msg.senderId === user.uid 
                    ? [styles.myMessage, { backgroundColor: chatSettings.myColor || '#FF69B4' }] 
                    : [styles.theirMessage, theme.theirMessage]
                ]}
              >
                <Text style={[styles.messageText, theme.messageText, { fontSize: chatSettings.textSize || 16 }]}>
                  {msg.text}
                </Text>
              </View>
            ))}
          </ScrollView>
        </ImageBackground>
        
        {/* Barra de Input (¡ACTUALIZADA con Regalos!) */}
        <View style={[styles.inputContainer, theme.inputContainer]}>
          
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => Alert.alert('Próximamente', '¡Aquí podrás crear tus stickers!')}
          >
            <Ionicons name="add" size={28} color={theme.icon.color} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => Alert.alert('Próximamente', '¡Aquí verás tus stickers!')}
          >
            <FontAwesome name="smile-o" size={26} color={theme.icon.color} />
          </TouchableOpacity>

          <TextInput
            style={[styles.textInput, theme.textInput]}
            placeholder="Mensaje..." 
            placeholderTextColor={theme.icon.color}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          
          {/* --- ¡NUEVO BOTÓN DE REGALOS! --- */}
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => router.push('/regalos')} // <-- Abre la pantalla /regalos
          >
            <FontAwesome5 name="gift" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold' 
  },
  chatContainer: {
    flex: 1,
  },
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    elevation: 1,
  },
  messageText: {
    // Estilos dinámicos
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    alignItems: 'center', // <-- Cambiado a 'center'
  },
  iconButton: {
    padding: 8,
    marginHorizontal: 2,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingTop: 10, 
    maxHeight: 100, 
    marginHorizontal: 5,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});