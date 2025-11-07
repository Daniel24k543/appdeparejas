// ¡Línea 1 obligatoria!
import 'react-native-gesture-handler'; 

import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        {/* Pantallas que ya tenías */}
        <Stack.Screen name="index" options={{ headerShown: false }} /> 
        <Stack.Screen name="login" options={{ headerShown: false }} /> 
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> 
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Ajustes' }} />
        <Stack.Screen name="pareja" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="chat" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="regalos" options={{ presentation: 'modal', headerShown: false }} />

        {/* --- ¡NUEVA PANTALLA DE AJUSTES DE CHAT! --- */}
        <Stack.Screen name="chat-settings" options={{ presentation: 'modal', headerShown: false }} />

      </Stack>
    </GestureHandlerRootView>
  );
}