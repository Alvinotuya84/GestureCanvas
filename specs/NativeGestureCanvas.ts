import {TurboModule, TurboModuleRegistry} from 'react-native';

export interface Point {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

export interface BrushStyle {
  size: number;
  opacity: number;
  color: string;
  texture: string;
  dampening: number;
  fluidResponse: number;
}

export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor: string;
}

export interface Spec extends TurboModule {
  // Canvas management
  createCanvas: (config: CanvasConfig) => number; // Returns canvas ID
  destroyCanvas: (canvasId: number) => void;
  clearCanvas: (canvasId: number) => void;

  // Stroke handling
  beginStroke: (
    canvasId: number,
    point: Point,
    brushStyle: BrushStyle,
  ) => number; // Returns stroke ID
  addPointToStroke: (canvasId: number, strokeId: number, point: Point) => void;
  endStroke: (canvasId: number, strokeId: number, point: Point) => void;

  // Motion impact (for physics-based effects)
  applyMotionToCanvas: (
    canvasId: number,
    accelerationX: number,
    accelerationY: number,
    accelerationZ: number,
  ) => void;

  // Canvas rendering
  getCanvasSnapshot: (canvasId: number) => string; // Returns base64 encoded image

  // Performance metrics
  getAverageRenderTime: () => number;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeGestureCanvas');
