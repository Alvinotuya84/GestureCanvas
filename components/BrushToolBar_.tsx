import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';
import {BrushStyle} from '../specs/NativeGestureCanvas';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {PanGestureHandler} from 'react-native-gesture-handler';

interface BrushToolbarProps {
  brushStyle: BrushStyle;
  onBrushChange: (brushStyle: BrushStyle) => void;
  onClearCanvas: () => void;
}

const BRUSH_SIZES = [5, 10, 15, 25, 40];
const BRUSH_TEXTURES = [
  {name: 'Normal', value: 'normal'},
  {name: 'Chalk', value: 'chalk'},
  {name: 'Watercolor', value: 'watercolor'},
  {name: 'Eraser', value: 'eraser'},
];
const COLORS = [
  'white',
  // colors in full name
  'black',
  'red',
  'green',
  'blue',
  'yellow',
  'orange',
  'purple',
  'pink',
];

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

const COLLAPSED_HEIGHT = 70;
const EXPANDED_HEIGHT = 500;

const BrushToolbar: React.FC<BrushToolbarProps> = ({
  brushStyle,
  onBrushChange,
  onClearCanvas,
}) => {
  const animatedHeight = useSharedValue(COLLAPSED_HEIGHT);
  const positionX = useSharedValue(0);
  const positionY = useSharedValue(SCREEN_HEIGHT - COLLAPSED_HEIGHT);
  const clearButtonScale = useSharedValue(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDocked, setIsDocked] = useState(true);
  const [previousBrushStyle, setPreviousBrushStyle] =
    useState<BrushStyle | null>(null);

  const toggleToolbar = () => {
    setIsExpanded(!isExpanded);
    animatedHeight.value = withTiming(
      isExpanded ? COLLAPSED_HEIGHT : EXPANDED_HEIGHT,
      {
        duration: 300,
      },
    );
  };

  const toggleDock = () => {
    setIsDocked(!isDocked);
    if (isDocked) {
      positionY.value = withTiming(SCREEN_HEIGHT - 300);
    } else {
      positionY.value = withTiming(SCREEN_HEIGHT - COLLAPSED_HEIGHT);
      positionX.value = withTiming(0);
    }
  };

  const panGestureEvent = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startX = positionX.value;
      ctx.startY = positionY.value;
    },
    onActive: (event, ctx) => {
      if (!isDocked) {
        positionX.value = ctx.startX + event.translationX;
        positionY.value = ctx.startY + event.translationY;
      }
    },
    onEnd: _ => {
      if (positionX.value < 0) {
        positionX.value = withTiming(0);
      } else if (positionX.value > SCREEN_WIDTH - 150) {
        positionX.value = withTiming(SCREEN_WIDTH - 150);
      }

      if (positionY.value < 100) {
        positionY.value = withTiming(100);
      } else if (positionY.value > SCREEN_HEIGHT - COLLAPSED_HEIGHT) {
        positionY.value = withTiming(SCREEN_HEIGHT - COLLAPSED_HEIGHT);
      }
    },
  });

  const containerStyle = useAnimatedStyle(() => {
    if (isDocked) {
      return {
        height: animatedHeight.value,
        bottom: 0,
        left: 0,
        right: 0,
        position: 'absolute',
      };
    }
    return {
      height: animatedHeight.value,
      position: 'absolute',
      left: positionX.value,
      top: positionY.value,
      width: 300,
    };
  });

  const handleSizeChange = (size: number) => {
    onBrushChange({...brushStyle, size});
  };

  const handleTextureChange = (texture: string) => {
    if (texture === 'eraser') {
      if (brushStyle.texture !== 'eraser') {
        setPreviousBrushStyle({...brushStyle});
        onBrushChange({
          ...brushStyle,
          texture: 'eraser',
          color: '#FFFFFF',
          opacity: 1.0,
        });
      }
    } else if (brushStyle.texture === 'eraser' && previousBrushStyle) {
      onBrushChange({
        ...previousBrushStyle,
        texture: texture,
      });
    } else {
      onBrushChange({...brushStyle, texture});
    }
  };

  const handleColorChange = (color: string) => {
    if (brushStyle.texture === 'eraser') {
      if (previousBrushStyle) {
        onBrushChange({
          ...previousBrushStyle,
          color: color,
          texture: 'normal',
        });
      } else {
        onBrushChange({
          ...brushStyle,
          color: color,
          texture: 'normal',
        });
      }
    } else {
      onBrushChange({...brushStyle, color});
    }
  };

  const handleClear = () => {
    clearButtonScale.value = withSequence(
      withTiming(1.2, {duration: 150}),
      withTiming(1, {duration: 150}),
    );
    onClearCanvas();
  };

  const adjustBrushFluidResponse = (amount: number) => {
    const newValue = Math.max(
      0.1,
      Math.min(1.0, brushStyle.fluidResponse + amount),
    );
    onBrushChange({...brushStyle, fluidResponse: newValue});
  };

  const adjustBrushDampening = (amount: number) => {
    const newValue = Math.max(
      0.5,
      Math.min(0.99, brushStyle.dampening + amount),
    );
    onBrushChange({...brushStyle, dampening: newValue});
  };

  const adjustOpacity = (amount: number) => {
    if (brushStyle.texture === 'eraser') return;

    const newValue = Math.max(0.1, Math.min(1.0, brushStyle.opacity + amount));
    onBrushChange({...brushStyle, opacity: newValue});
  };

  const toggleEraser = () => {
    if (brushStyle.texture === 'eraser') {
      if (previousBrushStyle) {
        onBrushChange(previousBrushStyle);
      } else {
        onBrushChange({
          ...brushStyle,
          texture: 'normal',
          color: '#000000',
        });
      }
    } else {
      setPreviousBrushStyle({...brushStyle});
      onBrushChange({
        ...brushStyle,
        texture: 'eraser',
        color: '#FFFFFF',
        opacity: 1.0,
      });
    }
  };

  return (
    <PanGestureHandler onGestureEvent={panGestureEvent}>
      <Animated.View style={[styles.container, containerStyle]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.expandButton} onPress={toggleToolbar}>
            <Icon
              name={isExpanded ? 'chevron-down' : 'chevron-up'}
              size={24}
              color="white"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.eraserButton,
              brushStyle.texture === 'eraser' && styles.eraserButtonActive,
            ]}
            onPress={toggleEraser}>
            <Icon name="eraser" size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.dockButton} onPress={toggleDock}>
            <Icon
              name={isDocked ? 'dock-window' : 'drag'}
              size={20}
              color="white"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Size</Text>
              <View style={styles.sizeContainer}>
                {BRUSH_SIZES.map(size => (
                  <TouchableOpacity
                    key={`size-${size}`}
                    style={[
                      styles.sizeButton,
                      brushStyle.size === size && styles.selectedSizeButton,
                    ]}
                    onPress={() => handleSizeChange(size)}>
                    <View
                      style={[
                        styles.sizePreview,
                        {
                          width: size / 2,
                          height: size / 2,
                          backgroundColor:
                            brushStyle.texture === 'eraser' ? '#333' : 'white',
                        },
                      ]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Texture</Text>
              <View style={styles.textureContainer}>
                {BRUSH_TEXTURES.map(texture => (
                  <TouchableOpacity
                    key={`texture-${texture.value}`}
                    style={[
                      styles.textureButton,
                      brushStyle.texture === texture.value &&
                        styles.selectedTextureButton,
                    ]}
                    onPress={() => handleTextureChange(texture.value)}>
                    <Icon
                      name={
                        texture.value === 'normal'
                          ? 'brush'
                          : texture.value === 'chalk'
                          ? 'format-paint'
                          : texture.value === 'eraser'
                          ? 'eraser'
                          : 'water'
                      }
                      size={18}
                      color="white"
                    />
                    <Text style={styles.textureText}>{texture.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View
              style={[
                styles.section,
                brushStyle.texture === 'eraser' && styles.disabledSection,
              ]}>
              <Text style={styles.sectionTitle}>Color</Text>
              <View style={styles.colorContainer}>
                {COLORS.map(color => (
                  <TouchableOpacity
                    key={`color-${color}`}
                    style={[
                      styles.colorButton,
                      {backgroundColor: color},
                      brushStyle.color === color && styles.selectedColorButton,
                    ]}
                    onPress={() => handleColorChange(color)}
                    disabled={brushStyle.texture === 'eraser'}
                  />
                ))}
              </View>
            </View>

            <View
              style={[
                styles.section,
                brushStyle.texture === 'eraser' && styles.disabledSection,
              ]}>
              <Text style={styles.sectionTitle}>Physics</Text>
              <View style={styles.physicsContainer}>
                <View style={styles.physicsControl}>
                  <Text style={styles.physicsLabel}>Fluid</Text>
                  <View style={styles.controlButtons}>
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={() => adjustBrushFluidResponse(-0.1)}
                      disabled={brushStyle.texture === 'eraser'}>
                      <Text style={styles.controlText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.valueText}>
                      {brushStyle.fluidResponse.toFixed(1)}
                    </Text>
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={() => adjustBrushFluidResponse(0.1)}
                      disabled={brushStyle.texture === 'eraser'}>
                      <Text style={styles.controlText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.physicsControl}>
                  <Text style={styles.physicsLabel}>Damp</Text>
                  <View style={styles.controlButtons}>
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={() => adjustBrushDampening(-0.05)}
                      disabled={brushStyle.texture === 'eraser'}>
                      <Text style={styles.controlText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.valueText}>
                      {brushStyle.dampening.toFixed(2)}
                    </Text>
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={() => adjustBrushDampening(0.05)}
                      disabled={brushStyle.texture === 'eraser'}>
                      <Text style={styles.controlText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.physicsControl}>
                  <Text style={styles.physicsLabel}>Opacity</Text>
                  <View style={styles.controlButtons}>
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={() => adjustOpacity(-0.1)}
                      disabled={brushStyle.texture === 'eraser'}>
                      <Text style={styles.controlText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.valueText}>
                      {brushStyle.opacity.toFixed(1)}
                    </Text>
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={() => adjustOpacity(0.1)}
                      disabled={brushStyle.texture === 'eraser'}>
                      <Text style={styles.controlText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    padding: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  expandButton: {
    padding: 8,
  },
  dockButton: {
    padding: 8,
  },
  eraserButton: {
    padding: 8,
    backgroundColor: '#333',
    borderRadius: 5,
  },
  eraserButtonActive: {
    backgroundColor: '#2196F3',
  },
  clearButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  clearText: {
    color: 'white',
    fontWeight: 'bold',
  },
  expandedContent: {
    flex: 1,
    paddingBottom: 10,
  },
  section: {
    marginBottom: 18,
  },
  disabledSection: {
    opacity: 0.5,
  },
  sectionTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sizeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sizeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  selectedSizeButton: {
    backgroundColor: '#2196F3',
  },
  sizePreview: {
    backgroundColor: 'white',
    borderRadius: 100,
  },
  textureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textureButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#333',
    marginHorizontal: 5,
    alignItems: 'center',
  },
  selectedTextureButton: {
    backgroundColor: '#2196F3',
  },
  textureText: {
    color: 'white',
    marginTop: 4,
    fontSize: 12,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    margin: 5,
    borderWidth: 1,
    borderColor: '#555',
  },
  selectedColorButton: {
    borderColor: 'white',
    borderWidth: 3,
  },
  physicsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  physicsControl: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  physicsLabel: {
    color: 'white',
    fontSize: 12,
    marginBottom: 6,
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 5,
    paddingHorizontal: 4,
  },
  controlButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  valueText: {
    color: 'white',
    width: 40,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});

export default BrushToolbar;
