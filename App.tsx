import React, {useState, useEffect, useRef} from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  AppState,
  AppStateStatus,
} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Canvas} from './components/Canvas';
import BrushToolbar from './components/BrushToolBar_';
import {useMotionSensor} from './hooks/useMotionSensor';
import {BrushStyle} from './specs/NativeGestureCanvas';

const DEFAULT_BRUSH_STYLE: BrushStyle = {
  size: 15,
  opacity: 0.8,
  color: '#333333',
  texture: 'normal',
  dampening: 0.9,
  fluidResponse: 0.5,
};

const App: React.FC = () => {
  const [brushStyle, setBrushStyle] = useState<BrushStyle>(DEFAULT_BRUSH_STYLE);
  const [motionEnabled, setMotionEnabled] = useState(true);
  const {motion, isAvailable} = useMotionSensor(motionEnabled);
  const canvasClearFuncRef = useRef<(() => void) | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
    }
    appState.current = nextAppState;
  };

  const handleBrushChange = (newBrushStyle: BrushStyle) => {
    setBrushStyle(newBrushStyle);
  };

  const handleClearCanvas = () => {
    if (canvasClearFuncRef.current) {
      canvasClearFuncRef.current();
    }
  };

  const registerClearFunction = (clearFunc: () => void) => {
    canvasClearFuncRef.current = clearFunc;
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <Canvas
          brushStyle={brushStyle}
          deviceMotion={motion}
          registerClearFunction={registerClearFunction}
        />
        <BrushToolbar
          brushStyle={brushStyle}
          onBrushChange={handleBrushChange}
          onClearCanvas={handleClearCanvas}
        />
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default App;
