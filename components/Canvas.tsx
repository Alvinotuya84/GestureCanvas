import React, {useEffect} from 'react';
import {
  StyleSheet,
  View,
  Image,
  useWindowDimensions,
  Alert,
  Text,
} from 'react-native';
import Animated, {
  useAnimatedGestureHandler,
  runOnJS,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import {useCanvas} from '../hooks/useCanvas';
import {Point, BrushStyle} from '../specs/NativeGestureCanvas';

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

  useEffect(() => {
    registerClearFunction(clearCanvas);
  }, [clearCanvas, registerClearFunction]);

  useEffect(() => {
    if (deviceMotion.x !== 0 || deviceMotion.y !== 0 || deviceMotion.z !== 0) {
      applyMotion(deviceMotion.x, deviceMotion.y, deviceMotion.z);
    }
  }, [deviceMotion, applyMotion]);

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
      backgroundColor: brushStyle.color,
      opacity: 0.5,
    };
  });

  //   useEffect(() => {
  //     console.log(
  //       'Canvas component - canvasState.snapshot:',
  //       canvasState.snapshot ? 'has value' : 'Empty',
  //     );
  //     console.log(
  //       'Canvas component - canvasState.canvasId:',
  //       canvasState.canvasId,
  //     );
  //   }, [canvasState]);

  return (
    <View style={styles.container}>
      {/* <Image
        source={{uri: canvasState.snapshot}}
        style={[styles.canvas, {width, height}]}
      /> */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={styles.gestureContainer}>
          {canvasState.snapshot ? (
            <>
              <Image
                source={{uri: canvasState.snapshot}}
                style={[styles.canvas, {width, height}]}
              />
              <Text
                style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  backgroundColor: 'white',
                }}>
                Snapshot length: {canvasState.snapshot.length}
              </Text>
            </>
          ) : (
            <View style={[styles.emptyCanvas, {width, height}]} />
          )}

          <Animated.View
            style={[
              styles.cursor,
              cursorStyle,
              {width: brushStyle.size, height: brushStyle.size},
            ]}
          />

          {performanceStats.fps > 0 && (
            <View style={styles.fpsContainer}>
              <View
                style={[
                  styles.fpsIndicator,
                  {
                    backgroundColor:
                      performanceStats.fps > 30 ? '#4CAF50' : '#F44336',
                  },
                ]}
              />
              <View style={styles.fpsTextContainer}>
                <Animated.Text style={styles.fpsText}>
                  {performanceStats.fps} FPS
                </Animated.Text>
              </View>
            </View>
          )}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gestureContainer: {
    flex: 1,
  },
  canvas: {
    borderColor: 'red',
    borderWidth: 2,
  },
  emptyCanvas: {
    backgroundColor: 'red',
  },
  cursor: {
    position: 'absolute',
    borderRadius: 100,
    width: 20,
    height: 20,
    marginLeft: -10,
    marginTop: -10,
  },
  fpsContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fpsIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  fpsTextContainer: {
    minWidth: 50,
  },
  fpsText: {
    color: 'white',
    fontVariant: ['tabular-nums'],
  },
});
