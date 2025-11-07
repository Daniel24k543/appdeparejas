import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthRequest } from 'expo-auth-session/providers/google';
import { Link, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- ¡NUEVAS IMPORTACIONES! ---
import { GoogleAuthProvider, signInAnonymously, signInWithCredential } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; // <--- ¡NUEVO! Para guardar el usuario
import { auth, db } from '../firebaseConfig'; // <--- ¡Importamos 'db'!

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {

  // ID de Google (aún necesita el ID auto-generado de Firebase para funcionar)
  const WEB_CLIENT_ID = "1071750977993-0r4a9id06uvdthagf0sadsq3u35v2on5.apps.googleusercontent.com"; 

  const [request, response, promptAsync] = useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    androidClientId: WEB_CLIENT_ID,
    iosClientId: WEB_CLIENT_ID,
  });

  // Función para guardar datos del usuario en Firestore
  const updateUserProfileInFirestore = async (user) => {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      displayName: user.displayName || 'Invitado',
      email: user.email || '',
      uid: user.uid,
    }, { merge: true }); // 'merge: true' evita sobrescribir datos
  };

  // useEffect para Google
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication && authentication.idToken) { 
        const { idToken } = authentication;
        const credential = GoogleAuthProvider.credential(idToken); 
        signInWithCredential(auth, credential) 
          .then(async (userCredential) => { // <--- Convertido en 'async'
            const user = userCredential.user;
            
            // --- ¡NUEVO! Guardamos el usuario en Firestore ---
            await updateUserProfileInFirestore(user); 
            
            console.log("¡Firebase login exitoso!", user.email);
            Alert.alert("¡Bienvenido de nuevo!", `Iniciaste sesión como ${user.displayName}`);
            router.replace('/(tabs)');
          })
          .catch((error) => {
            console.error("Error de Firebase Auth:", error.code, error.message);
            Alert.alert("Error de Firebase", "Error 400: Revisa tu ID de cliente.");
          });
      } else {
        Alert.alert("Error", "No se recibió el token de Google.");
      }
    } else if (response?.type === 'error') {
      console.log("Error de inicio de sesión:", response.error);
      Alert.alert("Error", "No se pudo iniciar sesión con Google.");
    }
  }, [response]); 

  // Función de Google
  const handleGoogleSignIn = () => {
    if (request) {
      promptAsync();
    }
  };

  // Función de Invitado (¡Actualizada!)
  const handleGuestSignIn = () => {
    signInAnonymously(auth)
      .then(async (userCredential) => { // <--- Convertido en 'async'
        const user = userCredential.user;

        // --- ¡NUEVO! Guardamos el usuario anónimo en Firestore ---
        await updateUserProfileInFirestore(user); 

        console.log("¡Firebase login anónimo exitoso! UID:", user.uid);
        Alert.alert(
          "¡Bienvenido, Invitado!", 
          "Tu sesión es anónima."
        );
        router.replace('/(tabs)');
      })
      .catch((error) => {
        console.error("Error de Firebase Anónimo:", error);
        Alert.alert("Error", "No se pudo iniciar como invitado.");
      });
  };

  return (
    <ImageBackground
      source={{ uri: 'https://i.pinimg.com/736x/80/f6/5a/80f65a4867f39559e764669461cd24d0.jpg' }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          {/* --- Parte Superior (sin cambios) --- */}
          <View style={styles.topHalf}>
            <Text style={styles.title}>Duo Love</Text>
            
          </View>
          {/* --- Parte Inferior (sin cambios) --- */}
          <View style={styles.bottomHalf}>
            <TouchableOpacity 
              style={[styles.button, styles.googleButton]} 
              disabled={!request}
              onPress={handleGoogleSignIn} 
            >
              <FontAwesome name="google" size={20} color="#000" style={styles.icon} />
              <Text style={[styles.buttonText, styles.googleButtonText]}>Registrarse con Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.emailButton]}>
              <MaterialCommunityIcons name="email" size={20} color="#333" style={styles.icon} />
              <Text style={[styles.buttonText, styles.emailButtonText]}>Registrarse con Email</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.guestButton]} 
              onPress={handleGuestSignIn}
            >
              <FontAwesome name="user-secret" size={20} color="#FFF" style={styles.icon} />
              <Text style={[styles.buttonText, styles.guestButtonText]}>Entrar como invitado</Text>
            </TouchableOpacity>
         
            <Text style={styles.legalText}>
              Al continuar, aceptas nuestro
              <Text style={styles.legalLink}> Términos de servicio</Text> y
              <Text style={styles.legalLink}> política de privacidad</Text>
            </Text>
          </View>
        </SafeAreaView>
      </View>
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
    // backgroundColor: '#000000', // Quitamos el fondo negro
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)', // Overlay semitransparente para legibilidad
  },
  topHalf: {
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  bottomHalf: {
    flex: 1,
    justifyContent: 'center', // Centrado vertical
    padding: 30,
    // Puedes ajustar el paddingTop si quieres que estén más arriba
    paddingTop: 0,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff', // Blanco para fondo negro
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#e5e5e5', // Claro para fondo negro
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 30, 
    marginBottom: 15,
    width: '100%',
  },
  icon: {
    marginRight: 12, 
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
  },
  googleButtonText: {
    color: '#000000',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  facebookButtonText: {
    color: '#FFFFFF',
  },
  emailButton: {
    backgroundColor: '#EAEAEA',
  },
  emailButtonText: {
    color: '#333333',
  },
  guestButton: { 
    backgroundColor: '#5A5A5A',
  },
  guestButtonText: { 
    color: '#FFFFFF',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  loginText: {
    color: '#e5e5e5', // Claro para fondo negro
  },
  loginLink: {
    color: '#fff', // Blanco y destacado
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  legalText: {
    color: '#bdbdbd', // Claro para fondo negro
    fontSize: 12,
    textAlign: 'center',
    marginTop: 25,
  },
  legalLink: {
    color: '#fff', // Blanco y destacado
    textDecorationLine: 'underline',
  },
});