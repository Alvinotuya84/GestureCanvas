import React, {useEffect, useRef} from 'react';
import {StyleSheet, View, Image, useWindowDimensions, Text} from 'react-native';
import Animated, {
  useAnimatedGestureHandler,
  runOnJS,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useDerivedValue,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import {useCanvas} from '../hooks/useCanvas';
import {Point, BrushStyle} from '../specs/NativeGestureCanvas';
import {CanvasHeader} from './CanvasHeader';

interface CanvasProps {
  brushStyle: BrushStyle;
  deviceMotion: {
    x: number;
    y: number;
    z: number;
  };
  registerClearFunction: (clearFunc: () => void) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  brushStyle,
  deviceMotion,
  registerClearFunction,
}) => {
  const {width, height} = useWindowDimensions();

  const {
    canvasState,
    handleStartDrawing,
    handleDrawMove,
    handleEndDrawing,
    applyMotion,
    clearCanvas,
    performanceStats,
  } = useCanvas(brushStyle);

  const cursorX = useSharedValue(width / 2);
  const cursorY = useSharedValue(height / 2);
  const cursorScale = useSharedValue(1);
  const lastMotionUpdate = useRef(0);
  const isDrawing = useSharedValue(false);

  useEffect(() => {
    registerClearFunction(clearCanvas);
  }, [clearCanvas, registerClearFunction]);

  useEffect(() => {
    const now = Date.now();
    if (deviceMotion.x !== 0 || deviceMotion.y !== 0 || deviceMotion.z !== 0) {
      if (now - lastMotionUpdate.current > 100) {
        applyMotion(deviceMotion.x, deviceMotion.y, deviceMotion.z);
        lastMotionUpdate.current = now;
      }
    }
  }, [deviceMotion, applyMotion]);

  const cursorColor = useDerivedValue(() => {
    return brushStyle.texture === 'eraser' ? '#FFFFFF' : brushStyle.color;
  }, [brushStyle.texture, brushStyle.color]);

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    {startX: number; startY: number}
  >({
    onStart: (event, ctx) => {
      ctx.startX = cursorX.value;
      ctx.startY = cursorY.value;

      cursorX.value = event.x;
      cursorY.value = event.y;
      cursorScale.value = withSpring(brushStyle.size / 20);
      isDrawing.value = true;

      const point: Point = {
        x: event.x,
        y: event.y,
        pressure: event.pressure || 1,
        timestamp: new Date().getTime(),
      };

      runOnJS(handleStartDrawing)(point);
    },

    onActive: (event, ctx) => {
      cursorX.value = event.x;
      cursorY.value = event.y;

      const point: Point = {
        x: event.x,
        y: event.y,
        pressure: event.pressure || 1,
        timestamp: new Date().getTime(),
      };

      runOnJS(handleDrawMove)(point);
    },

    onEnd: event => {
      cursorScale.value = withSpring(1);
      isDrawing.value = false;

      const point: Point = {
        x: event.x,
        y: event.y,
        pressure: event.pressure || 0.5,
        timestamp: new Date().getTime(),
      };

      runOnJS(handleEndDrawing)(point);
    },
  });

  const cursorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {translateX: cursorX.value},
        {translateY: cursorY.value},
        {scale: cursorScale.value},
      ],
      backgroundColor: cursorColor.value,
      opacity: brushStyle.texture === 'eraser' ? 0.3 : 0.5,
      width: brushStyle.size,
      height: brushStyle.size,
      borderRadius: brushStyle.size / 2,
      marginLeft: -brushStyle.size / 2,
      marginTop: -brushStyle.size / 2,
      position: 'absolute',
    };
  }, [brushStyle.size, cursorColor]);

  return (
    <View style={styles.container}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={styles.gestureContainer}>
          {canvasState.snapshot ? (
            <Image
              source={{uri: canvasState.snapshot}}
              style={[styles.canvas, {width, height}]}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.emptyCanvas, {width, height}]} />
          )}

          <Animated.View style={cursorStyle} />
        </Animated.View>
      </PanGestureHandler>

      {/* Add the new header component */}
      <CanvasHeader performanceStats={performanceStats} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gestureContainer: {
    flex: 1,
  },
  canvas: {
    flex: 1,
  },
  emptyCanvas: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  cursor: {
    position: 'absolute',
    borderRadius: 100,
  },
});
