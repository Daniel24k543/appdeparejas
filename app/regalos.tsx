import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

// --- ¡NUESTROS REGALOS DE VIRTUALITO! ---
const REGALOS = [
  { id: '1', nombre: 'Ramo de Flores 🌹', icono: 'fan', precio: '$1.99' },
  { id: '2', nombre: 'Caja de Chocolates 🍫', icono: 'box', precio: '$4.99' },
  { id: '3', nombre: 'Osito de Peluche 🧸', icono: 'bone', precio: '$9.99' }, // (No hay icono de oso, usamos uno 'tierno')
  { id: '4', nombre: '¡¡RAMO BUCHÓN!! 🤑', icono: 'rocket', precio: '$29.99' },
];

export default function RegalosScreen() {

  const handleSendGift = (regalo) => {
    Alert.alert(
      "¡Enviando Regalo!",
      `Estás a punto de enviar "${regalo.nombre}" por ${regalo.precio}.\n\n(Aquí iría la lógica de monetización de Google/Apple)`,
      [{ text: '¡Enviar!' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Enviar Regalos 🎁</Text>
        <View style={{ width: 28 }} /> 
      </View>
      
      {/* Lista de Regalos */}
      <View style={styles.content}>
        {REGALOS.map((regalo) => (
          <TouchableOpacity 
            key={regalo.id} 
            style={styles.regaloButton}
            onPress={() => handleSendGift(regalo)}
          >
            <FontAwesome5 name={regalo.icono} size={32} color="#FF3B30" />
            <Text style={styles.regaloNombre}>{regalo.nombre}</Text>
            <Text style={styles.regaloPrecio}>{regalo.precio}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    backgroundColor: '#FFF'
  },
  title: { fontSize: 22, fontWeight: 'bold' },
  content: {
    flex: 1,
    padding: 20,
  },
  regaloButton: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  regaloNombre: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginLeft: 15,
  },
  regaloPrecio: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF3B30',
  }
});