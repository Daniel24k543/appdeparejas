import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
    addDoc,
    arrayUnion,
    collection,
    doc,
    getDocs,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import Slider from '@react-native-community/slider';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { auth, db } from '../firebaseConfig'; // <--- Importamos Auth y DB

export default function ParejaModal() {
  const [isLoading, setIsLoading] = useState(true);
  const [roomID, setRoomID] = useState(null); // ID de la sala del usuario
  const [joinInputCode, setJoinInputCode] = useState(''); // Texto del input para unirse
  const [userName, setUserName] = useState('Tu pareja'); // Nombre del usuario
  const [pencilThickness, setPencilThickness] = useState(3); // Grosor del lápiz
  const [showThicknessBar, setShowThicknessBar] = useState(false); // Mostrar barra de grosor
  
  const user = auth.currentUser; // Obtenemos el usuario actual

  // 1. Al cargar la pantalla, revisamos si el usuario ya está en una sala
  useEffect(() => {
    if (!user) {
      Alert.alert("Error", "No estás autenticado.");
      router.back(); // Si no hay usuario, cerramos el modal
      return;
    }
    
    // Guardamos un nombre (si es anónimo, usamos un placeholder)
    setUserName(user.displayName || 'Tu pareja');

    // Buscamos en Firestore una sala donde este usuario sea miembro
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, where('members', 'array-contains', user.uid));
    
    getDocs(q).then(querySnapshot => {
      if (!querySnapshot.empty) {
        // ¡Encontrado! El usuario ya está en una sala
        const roomDoc = querySnapshot.docs[0];
        setRoomID(roomDoc.id); // Guardamos el ID de la sala
      }
      setIsLoading(false);
    });
  }, [user]);

  // 2. Lógica para CREAR una sala
  const handleCreateRoom = async () => {
    setIsLoading(true);
    try {
      // Creamos un nuevo documento en la colección 'rooms'
      const newRoomRef = await addDoc(collection(db, 'rooms'), {
        members: [user.uid], // Añadimos al creador como primer miembro
        createdAt: serverTimestamp(),
      });
      setRoomID(newRoomRef.id); // Guardamos el nuevo ID de la sala
      Alert.alert("¡Sala creada!", `Comparte este código con tu pareja: ${newRoomRef.id}`);
    } catch (error) {
      console.error("Error al crear la sala:", error);
      Alert.alert("Error", "No se pudo crear la sala.");
    }
    setIsLoading(false);
  };

  // 3. Lógica para UNIRSE a una sala
  const handleJoinRoom = async () => {
    if (joinInputCode.trim() === '') {
      Alert.alert("Error", "El código no puede estar vacío.");
      return;
    }
    setIsLoading(true);
    try {
      const roomRef = doc(db, 'rooms', joinInputCode.trim());
      
      // Añadimos al usuario actual al array 'members' de la sala
      await updateDoc(roomRef, {
        members: arrayUnion(user.uid)
      });
      
      setRoomID(joinInputCode.trim()); // Guardamos el ID de la sala a la que nos unimos
      Alert.alert("¡Éxito!", "Te has unido a la sala.");
      router.back(); // Cerramos el modal
    } catch (error) {
      console.error("Error al unirse a la sala:", error);
      Alert.alert("Error", "No se encontró la sala o hubo un error.");
    }
    setIsLoading(false);
  };

  // 4. Lógica para COMPARTIR (la que pediste)
  const handleShareRoom = async () => {
    const shareableLink = `https://duolove.app/join/${roomID}`; // (Usamos un dominio de ejemplo)
    
    try {
      await Share.share({
        message:
          `${userName} te invita a su sala en Duo Love! 💖\n\n` +
          `Únete con este enlace: ${shareableLink}\n\n` +
          `O usa este código en la app: ${roomID}`,
        title: '¡Únete a mi sala en Duo Love!'
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  // --- Renderizado de la UI ---
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </SafeAreaView>
    );
  }

  // Si el usuario NO está en una sala, mostramos opciones para crear/unirse
  if (!roomID) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>

        {/* Ícono de lápiz para mostrar barra de grosor */}
        <TouchableOpacity style={styles.pencilIcon} onPress={() => setShowThicknessBar(!showThicknessBar)}>
          <FontAwesome name="pencil" size={28} color="#FF3B30" />
        </TouchableOpacity>
        {showThicknessBar && (
          <View style={styles.thicknessBarContainer}>
            <Text style={styles.label}>Grosor del lápiz: {pencilThickness}</Text>
            <Slider
              style={{ width: 200, height: 40 }}
              minimumValue={1}
              maximumValue={20}
              step={1}
              value={pencilThickness}
              minimumTrackTintColor="#FF3B30"
              maximumTrackTintColor="#CCC"
              thumbTintColor="#FF3B30"
              onValueChange={setPencilThickness}
            />
          </View>
        )}

        <Text style={styles.title}>Crea pareja</Text>

        <Text style={styles.label}>O únete con un código</Text>
        <TextInput
          style={styles.input}
          placeholder="Pega el código de tu pareja aquí"
          placeholderTextColor="#999"
          value={joinInputCode}
          onChangeText={setJoinInputCode}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.button} onPress={handleJoinRoom}>
          <Text style={styles.buttonText}>Únete</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>o</Text>

        <TouchableOpacity style={styles.buttonSecondary} onPress={handleCreateRoom}>
          <Text style={styles.buttonSecondaryText}>Crea una sala nueva</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Si el usuario YA está en una sala, mostramos su código e info
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={28} color="#000" />
      </TouchableOpacity>

      {/* Ícono de lápiz para mostrar barra de grosor */}
      <TouchableOpacity style={styles.pencilIcon} onPress={() => setShowThicknessBar(!showThicknessBar)}>
        <FontAwesome name="pencil" size={28} color="#FF3B30" />
      </TouchableOpacity>
      {showThicknessBar && (
        <View style={styles.thicknessBarContainer}>
          <Text style={styles.label}>Grosor del lápiz: {pencilThickness}</Text>
          <Slider
            style={{ width: 200, height: 40 }}
            minimumValue={1}
            maximumValue={20}
            step={1}
            value={pencilThickness}
            minimumTrackTintColor="#FF3B30"
            maximumTrackTintColor="#CCC"
            thumbTintColor="#FF3B30"
            onValueChange={setPencilThickness}
          />
        </View>
      )}

      <Text style={styles.title}>Crea pareja</Text>

      <Text style={styles.label}>Tu código de sala:</Text>
      <Text style={styles.code}>{roomID}</Text>

      <Text style={styles.label}>Comparte tu enlace</Text>
      <View style={styles.linkContainer}>
        <TextInput
          style={styles.linkInput}
          value={`duolove.app/join/${roomID}`}
          editable={false} // Hacemos que no se pueda editar
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleShareRoom}>
          <FontAwesome name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Nueva opción para ingresar el código de sala de la otra persona */}
      <Text style={styles.label}>¿Tienes el código de sala de otra persona?</Text>
      <TextInput
        style={styles.input}
        placeholder="Código de sala de tu pareja"
        placeholderTextColor="#999"
        value={joinInputCode}
        onChangeText={setJoinInputCode}
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} onPress={handleJoinRoom}>
        <Text style={styles.buttonText}>Unirse</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20,
    alignItems: 'center',
    paddingTop: 40,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    color: '#555',
    alignSelf: 'flex-start',
    marginBottom: 10,
    marginTop: 20,
  },
  code: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    backgroundColor: '#F0F0F0',
    padding: 15,
    borderRadius: 10,
    textAlign: 'center',
    width: '100%',
  },
  linkContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  linkInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#F5F5F5',
  },
  sendButton: {
    backgroundColor: '#FF3B30', // Rojo
    borderRadius: 10,
    padding: 15,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    width: '100%',
    backgroundColor: '#FF3B30', // Rojo
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  orText: {
    fontSize: 16,
    color: '#888',
    marginVertical: 20,
  },
  buttonSecondary: {
    width: '100%',
    backgroundColor: '#F0F0F0',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonSecondaryText: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pencilIcon: {
    position: 'absolute',
    top: 10,
    right: 20,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 6,
    elevation: 2
  },
  thicknessBarContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4
  },
});