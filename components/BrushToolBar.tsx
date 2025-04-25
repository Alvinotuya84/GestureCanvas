import React from 'react';
import {StyleSheet, View, TouchableOpacity, Text} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import {BrushStyle} from '../specs/NativeGestureCanvas';

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
];
const COLORS = [
  '#000000',
  '#FFFFFF',
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#FFFF00',
  '#FF00FF',
  '#00FFFF',
  '#FF5500',
  '#55FF00',
];

const BrushToolbar: React.FC<BrushToolbarProps> = ({
  brushStyle,
  onBrushChange,
  onClearCanvas,
}) => {
  const animatedHeight = useSharedValue(70);
  const expanded = useSharedValue(false);

  const toggleToolbar = () => {
    expanded.value = !expanded.value;
    animatedHeight.value = withTiming(expanded.value ? 280 : 70, {
      duration: 300,
    });
  };

  const containerStyle = useAnimatedStyle(() => {
    return {
      height: animatedHeight.value,
    };
  });

  const handleSizeChange = (size: number) => {
    onBrushChange({...brushStyle, size});
  };

  const handleTextureChange = (texture: string) => {
    onBrushChange({...brushStyle, texture});
  };

  const handleColorChange = (color: string) => {
    onBrushChange({...brushStyle, color});
  };

  const handleClear = () => {
    const scaleAnim = useSharedValue(1);
    scaleAnim.value = withSequence(
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
    const newValue = Math.max(0.1, Math.min(1.0, brushStyle.opacity + amount));
    onBrushChange({...brushStyle, opacity: newValue});
  };

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.expandButton} onPress={toggleToolbar}>
          <Text style={styles.expandIcon}>{expanded.value ? '▼' : '▲'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {expanded.value && (
        <>
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
                      {width: size / 2, height: size / 2},
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
                  <Text style={styles.textureText}>{texture.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
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
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Physics</Text>
            <View style={styles.physicsContainer}>
              <View style={styles.physicsControl}>
                <Text style={styles.physicsLabel}>Fluid</Text>
                <View style={styles.controlButtons}>
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => adjustBrushFluidResponse(-0.1)}>
                    <Text style={styles.controlText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.valueText}>
                    {brushStyle.fluidResponse.toFixed(1)}
                  </Text>
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => adjustBrushFluidResponse(0.1)}>
                    <Text style={styles.controlText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.physicsControl}>
                <Text style={styles.physicsLabel}>Dampening</Text>
                <View style={styles.controlButtons}>
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => adjustBrushDampening(-0.05)}>
                    <Text style={styles.controlText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.valueText}>
                    {brushStyle.dampening.toFixed(2)}
                  </Text>
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => adjustBrushDampening(0.05)}>
                    <Text style={styles.controlText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.physicsControl}>
                <Text style={styles.physicsLabel}>Opacity</Text>
                <View style={styles.controlButtons}>
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => adjustOpacity(-0.1)}>
                    <Text style={styles.controlText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.valueText}>
                    {brushStyle.opacity.toFixed(1)}
                  </Text>
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => adjustOpacity(0.1)}>
                    <Text style={styles.controlText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    padding: 10,
    overflow: 'hidden',
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
  expandIcon: {
    color: 'white',
    fontSize: 20,
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
  section: {
    marginBottom: 12,
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
    padding: 8,
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
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    margin: 4,
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
    marginBottom: 4,
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 5,
    paddingHorizontal: 4,
  },
  controlButton: {
    width: 28,
    height: 28,
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
    width: 36,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
export default BrushToolbar;
