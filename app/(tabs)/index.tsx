import { FontAwesome, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { TextInput, Keyboard, Animated, PanResponder, TouchableWithoutFeedback } from 'react-native';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import Slider from '@react-native-community/slider';
import {
  Alert,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as ImagePicker from 'expo-image-picker';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Path, Svg } from 'react-native-svg';

// --- Importaciones de Firebase (¡con más funciones!) ---
import {
  addDoc,
  collection, // <--- ¡NUEVO! Para buscar el último trazo
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import { auth, db, storage } from '../../firebaseConfig';

// Lista de colores (sin cambios)
const COLORS = [
  '#000000', '#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF00FF', '#00FFFF',
  '#FFA500', '#800080', '#FFFFFF',
];

export default function TabHomeScreen() {
  // --- Estados para textos múltiples ---
  const [inputText, setInputText] = useState('');
  type CanvasText = {
    id: string;
    text: string;
    fontSize: number;
    x: Animated.Value;
    y: Animated.Value;
    selected: boolean;
  };
  const [canvasTexts, setCanvasTexts] = useState<CanvasText[]>([]);

  // Añadir texto al canvas
  const handleAddTextToCanvas = () => {
    if (inputText.trim() === '') return;
    const newText: CanvasText = {
      id: Math.random().toString(36).substr(2, 9),
      text: inputText,
      fontSize: 24,
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      selected: false,
    };
    setCanvasTexts(prev => [...prev, newText]);
    setInputText('');
    Keyboard.dismiss();
  };

  // Seleccionar texto al tocarlo
  const handleTextPress = (id: string) => {
    setCanvasTexts(prev => prev.map(t => ({ ...t, selected: t.id === id })));
  };

  // Deseleccionar texto al tocar fuera
  const handleCanvasPress = () => {
    setCanvasTexts(prev => prev.map(t => ({ ...t, selected: false })));
  };

  // Eliminar texto
  const handleDeleteText = (id: string) => {
    setCanvasTexts(prev => prev.filter(t => t.id !== id));
  };

  // Cambiar tamaño de texto
  const handleChangeFontSize = (id: string, delta: number) => {
    setCanvasTexts(prev => prev.map(t => t.id === id ? { ...t, fontSize: Math.max(12, Math.min(64, t.fontSize + delta)) } : t));
  };

  // PanResponder para cada texto
  const createPanResponder = (textObj: CanvasText) => {
    let lastX = 0;
    let lastY = 0;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => textObj.selected,
      onPanResponderGrant: () => {
        textObj.x.setOffset(lastX);
        textObj.y.setOffset(lastY);
        textObj.x.setValue(0);
        textObj.y.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        textObj.x.setValue(gestureState.dx);
        textObj.y.setValue(gestureState.dy);
      },
      onPanResponderRelease: (evt, gestureState) => {
        lastX += gestureState.dx;
        lastY += gestureState.dy;
        textObj.x.flattenOffset();
        textObj.y.flattenOffset();
      },
    });
  };
  // --- Estados (sin cambios) ---
  type PathPoint = { x: number; y: number };
  type DrawPath = { path: PathPoint[]; color: string; width: number };
  const [paths, setPaths] = useState<DrawPath[]>([]); 
  const [currentPath, setCurrentPath] = useState<PathPoint[]>([]); 
  const [selectedColor, setSelectedColor] = useState<string>(COLORS[0]);
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>(undefined); 
  const [roomID, setRoomID] = useState<string | null>(null); 
  const [lineWidth, setLineWidth] = useState<number>(4); // Estado para el grosor
  const user = auth.currentUser; 

  // --- Lógica de Dibujo (sin cambios) ---
  const createSvgPath = (points: PathPoint[]) => {
    if (points.length === 0) return "";
    let path = `M ${points[0].x} ${points[0].y}`;
  points.forEach((point: PathPoint) => {
      path += ` L ${point.x} ${point.y}`;
    });
    return path;
  };

  // --- Conectar y Escuchar la Sala (sin cambios) ---
  useEffect(() => {
    if (!user) return; 
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, where('members', 'array-contains', user.uid));
    getDocs(q).then(querySnapshot => {
      if (!querySnapshot.empty) {
        const roomDoc = querySnapshot.docs[0];
        const currentRoomID = roomDoc.id;
        setRoomID(currentRoomID); 

        const roomDocRef = doc(db, 'rooms', currentRoomID);
        const unsubscribeRoom = onSnapshot(roomDocRef, (doc) => {
          const data = doc.data();
          if (data && data.backgroundImageUrl) {
            setBackgroundImage(data.backgroundImageUrl);
          } else {
            setBackgroundImage(undefined);
          }
        });

        const pathsRef = collection(db, 'rooms', currentRoomID, 'paths');
        const qPaths = query(pathsRef, orderBy('createdAt', 'asc')); 
        const unsubscribePaths = onSnapshot(qPaths, (snapshot) => {
          const newPaths: DrawPath[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            newPaths.push({ path: data.path, color: data.color, width: data.width ?? 4 });
          });
          setPaths(newPaths); 
        });

        return () => {
          unsubscribeRoom();
          unsubscribePaths();
        };
      } else {
        console.log("No se encontró sala. ¡Crea o únete a una!");
      }
    });
  }, [user]); 


  // --- Lógica de Dibujo (sin cambios) ---
  const onGestureEvent = (event: any) => {
    const { x, y } = event.nativeEvent;
  setCurrentPath((prevPath: PathPoint[]) => [...prevPath, { x, y }]);
  };

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      if (roomID && currentPath.length > 0) {
        const pathsRef = collection(db, 'rooms', roomID, 'paths');
        addDoc(pathsRef, {
          path: currentPath,
          color: selectedColor,
          width: lineWidth,
          createdAt: serverTimestamp(),
        });
      }
      setCurrentPath([]);
    }
  };

  // --- Lógica de Herramientas (¡CON 'UNDO' ACTUALIZADO!) ---
  
  // Borrar todo (sin cambios)
  const handleClear = async () => {
    if (!roomID) return;
    const roomDocRef = doc(db, 'rooms', roomID);
    await updateDoc(roomDocRef, {
      backgroundImageUrl: null 
    });
    const pathsRef = collection(db, 'rooms', roomID, 'paths');
    const q = query(pathsRef);
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  };

  // --- "Deshacer" Sincronizado ---
  const handleUndo = async () => {
    if (!roomID) return;
    const pathsRef = collection(db, 'rooms', roomID, 'paths');
    const q = query(pathsRef, orderBy('createdAt', 'desc'), limit(1));
    try {
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const lastDocId = snapshot.docs[0].id;
        await deleteDoc(doc(db, 'rooms', roomID, 'paths', lastDocId));
      }
    } catch (error) {
      console.error("Error al deshacer:", error);
    }
  };

  // (Esta es la función de 'subir foto' de tu desarrollador, solo local)
  const handleImageUpload = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.granted === false) {
      alert('¡Necesitas dar permisos para elegir fotos!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setBackgroundImage(uri); // Solo se pone como fondo local
  };

  // --- Renderizado (sin cambios) ---
  return (
  <SafeAreaView style={styles.container}>
      {/* 1. BARRA SUPERIOR */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.createRoomButton} onPress={() => router.push('/pareja')}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createRoomText}>Crea pareja</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/modal')}>
          <Ionicons name="settings-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* 2. PALETA DE COLORES */}
      <View style={styles.paletteContainer}>
        {COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorCircle,
              { backgroundColor: color },
              selectedColor === color && styles.selectedColor,
            ]}
            onPress={() => setSelectedColor(color)}
          />
        ))}
      </View>

      {/* 3. BARRA DE HERRAMIENTAS */}
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={handleClear} style={styles.toolButton}>
          <MaterialIcons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleImageUpload} style={styles.toolButton}>
          <MaterialIcons name="image" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton}>
          <MaterialIcons name="edit" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleUndo} style={styles.toolButton}>
          <MaterialIcons name="undo" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton}>
          <MaterialIcons name="redo" size={24} color="#CCC" />
        </TouchableOpacity>
      </View>

      {/* 4. LIENZO */}
      <TouchableWithoutFeedback onPress={handleCanvasPress}>
        <View style={styles.canvasContainer}>
          <ImageBackground 
            source={backgroundImage ? { uri: backgroundImage } : undefined}
            style={styles.imageBackground}
            resizeMode="cover"
          >
            <PanGestureHandler
              onGestureEvent={onGestureEvent}
              onHandlerStateChange={onHandlerStateChange}
            >
              <View style={styles.svgContainer}> 
                <Svg width="100%" height="100%">
                  {/* Dibuja todos los trazos de la base de datos */}
                  {paths.map((p, index) => (
                    <Path
                      key={`path-${index}`}
                      d={createSvgPath(p.path)}
                      stroke={p.color}
                      strokeWidth={p.width}
                      fill="none"
                    />
                  ))}
                  {/* Dibuja el trazo local actual */}
                  <Path
                    d={createSvgPath(currentPath)}
                    stroke={selectedColor}
                    strokeWidth={lineWidth}
                    fill="none"
                  />
                </Svg>
                {/* Renderizar todos los textos en el canvas */}
                {canvasTexts.map(textObj => {
                  const panResponder = createPanResponder(textObj);
                  return (
                    <Animated.View
                      key={textObj.id}
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: [
                          { translateX: textObj.x },
                          { translateY: textObj.y },
                          { translateX: -80 },
                          { translateY: -20 },
                        ],
                        zIndex: 10,
                        alignItems: 'center',
                      }}
                      {...(textObj.selected ? panResponder.panHandlers : {})}
                    >
                      <Text
                        onPress={() => handleTextPress(textObj.id)}
                        style={{ fontSize: textObj.fontSize, color: '#333', backgroundColor: 'rgba(255,255,255,0.7)', padding: 6, borderRadius: 8, borderWidth: 1, borderColor: textObj.selected ? '#007AFF' : '#FF3B30', fontWeight: 'bold' }}
                      >
                        {textObj.text}
                      </Text>
                      {/* Controles flotantes solo si está seleccionado */}
                      {textObj.selected && (
                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 4, alignItems: 'center' }}>
                          <TouchableOpacity onPress={() => handleChangeFontSize(textObj.id, -2)} style={{ backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#FF3B30', padding: 4, marginHorizontal: 4 }}>
                            <Text style={{ fontSize: 18, color: '#FF3B30', fontWeight: 'bold' }}>-</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleChangeFontSize(textObj.id, 2)} style={{ backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#FF3B30', padding: 4, marginHorizontal: 4 }}>
                            <Text style={{ fontSize: 18, color: '#FF3B30', fontWeight: 'bold' }}>+</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteText(textObj.id)} style={{ backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#FF0000', padding: 4, marginHorizontal: 4 }}>
                            <MaterialIcons name="close" size={18} color="#FF0000" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </Animated.View>
                  );
                })}
              </View>
            </PanGestureHandler>
          </ImageBackground>
        </View>
      </TouchableWithoutFeedback>

      {/* Barra de grosor abajo */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
      }}>
        <Text style={{ marginRight: 12, fontWeight: 'bold', color: '#333' }}>Grosor: {lineWidth}</Text>
        <Slider
          style={{ width: 180, height: 40 }}
          minimumValue={1}
          maximumValue={20}
          step={1}
          value={lineWidth}
          minimumTrackTintColor="#FF3B30"
          maximumTrackTintColor="#CCC"
          thumbTintColor="#FF3B30"
          onValueChange={setLineWidth}
        />
      </View>

      {/* 6. BARRA INFERIOR: Solo campo para escribir y botón */}
      <View style={styles.bottomBar}>
        <FontAwesome name="heart-o" size={24} color="#CCC" style={styles.heartIcon} />
        <TextInput
          style={{
            flex: 1,
            backgroundColor: '#FFF',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#FF3B30',
            paddingHorizontal: 10,
            color: '#333',
            marginRight: 8,
          }}
          placeholder="Escribe tu texto..."
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleAddTextToCanvas}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleAddTextToCanvas}>
          <MaterialCommunityIcons name="arrow-up" size={24} color="white" />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

// --- ESTILOS (sin cambios) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 0,
    shadowColor: '#B0B0B0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  createRoomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  createRoomText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 7,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  paletteContainer: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 10,
    shadowColor: '#B0B0B0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#EEE',
    marginHorizontal: 2,
    shadowColor: '#B0B0B0',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedColor: {
    borderColor: '#FF3B30',
    borderWidth: 3,
    shadowColor: '#FF3B30',
    shadowOpacity: 0.25,
    elevation: 3,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 10,
    shadowColor: '#B0B0B0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  toolButton: {
    padding: 8,
    backgroundColor: '#F7F8FA',
    borderRadius: 16,
    marginHorizontal: 2,
    shadowColor: '#B0B0B0',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 2,
    elevation: 1,
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    marginHorizontal: 18,
    marginVertical: 16,
    borderRadius: 32,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#B0B0B0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  imageBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 32,
  },
  svgContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  textOverlay: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -100, 
    marginTop: -25, 
    zIndex: 10,
    alignItems: 'center',
  },
  canvasText: {
    color: '#333', 
    backgroundColor: 'rgba(255,255,255,0.7)', 
    padding: 6, 
    borderRadius: 8, 
    borderWidth: 1, 
    fontWeight: 'bold'
  },
  textControls: {
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 4, 
    alignItems: 'center'
  },
  controlButton: {
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#FF3B30', 
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginHorizontal: 4
  },
  controlButtonText: {
    fontSize: 18, 
    color: '#FF3B30', 
    fontWeight: 'bold'
  },
  thicknessSliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  thicknessText: {
    marginRight: 12, 
    fontWeight: 'bold', 
    color: '#333'
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 0,
    borderTopColor: '#EEE',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#B0B0B0',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 4,
  },
  heartIcon: {
    marginRight: 12,
    color: '#FF3B30',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
    paddingHorizontal: 10,
    color: '#333',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 28,
    padding: 10,
    marginLeft: 12,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
});