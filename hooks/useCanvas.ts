import {useState, useEffect, useRef, useCallback} from 'react';
import {Alert, useWindowDimensions} from 'react-native';
import NativeGestureCanvas, {
  BrushStyle,
  Point,
} from '../specs/NativeGestureCanvas';

interface CanvasState {
  canvasId: number | null;
  strokeId: number | null;
  snapshot: string;
  averageRenderTime: number;
}

export const useCanvas = (initialBrushStyle: BrushStyle) => {
  const {width, height} = useWindowDimensions();
  const [canvasState, setCanvasState] = useState<CanvasState>({
    canvasId: null,
    strokeId: null,
    snapshot: '',
    averageRenderTime: 0,
  });
  const [brushStyle, setBrushStyle] = useState<BrushStyle>(initialBrushStyle);
  const [isDrawing, setIsDrawing] = useState(false);
  const [performanceStats, setPerformanceStats] = useState({fps: 0});

  const statsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentStrokeIdRef = useRef<number | null>(null);

  useEffect(() => {
    setBrushStyle(initialBrushStyle);
  }, [initialBrushStyle]);

  // Helper function to update the snapshot
  const updateSnapshot = useCallback(() => {
    if (canvasState.canvasId === null) return '';

    const snapshot = NativeGestureCanvas.getCanvasSnapshot(
      canvasState.canvasId,
    );
    console.log('Snapshot:', snapshot);

    setCanvasState(prev => {
      return {...prev, snapshot};
    });

    return snapshot;
  }, [canvasState.canvasId]);

  useEffect(() => {
    const canvasId = NativeGestureCanvas.createCanvas({
      width,
      height,
      backgroundColor: '#FFFFFF',
    });

    setCanvasState(prev => ({...prev, canvasId}));

    statsTimerRef.current = setInterval(() => {
      if (canvasState.canvasId !== null) {
        const renderTime = NativeGestureCanvas.getAverageRenderTime();
        const fps =
          renderTime > 0 ? Math.min(60, Math.round(1000 / renderTime)) : 0;

        setPerformanceStats({fps});

        updateSnapshot();
        setCanvasState(prev => ({
          ...prev,
          averageRenderTime: renderTime,
        }));
      }
    }, 500);

    return () => {
      if (statsTimerRef.current) {
        clearInterval(statsTimerRef.current);
      }

      if (canvasState.canvasId !== null) {
        NativeGestureCanvas.destroyCanvas(canvasState.canvasId);
      }
    };
  }, []);

  const handleStartDrawing = useCallback(
    (point: Point) => {
      console.log('point');
      if (canvasState.canvasId === null) {
        return;
      }

      const strokeId = NativeGestureCanvas.beginStroke(
        canvasState.canvasId,
        point,
        brushStyle,
      );
      console.log(
        'Stroke started with ID:',
        strokeId,
        'Color:',
        brushStyle.color,
        'Size:',
        brushStyle.size,
      );

      // Set both the ref and the state
      currentStrokeIdRef.current = strokeId;
      setCanvasState(prev => ({...prev, strokeId}));
      setIsDrawing(true);
    },
    [canvasState.canvasId, brushStyle],
  );

  const handleDrawMove = useCallback(
    (point: Point) => {
      // Use the ref instead of state
      if (
        !isDrawing ||
        canvasState.canvasId === null ||
        currentStrokeIdRef.current === null
      ) {
        return;
      }

      console.log(
        'Adding point to stroke:',
        currentStrokeIdRef.current,
        point.x,
        point.y,
      );

      NativeGestureCanvas.addPointToStroke(
        canvasState.canvasId,
        currentStrokeIdRef.current,
        point,
      );
    },
    [isDrawing, canvasState.canvasId],
  );

  const handleEndDrawing = useCallback(
    (point: Point) => {
      // Use the ref instead of state
      if (
        canvasState.canvasId === null ||
        currentStrokeIdRef.current === null
      ) {
        return;
      }

      console.log('Ending stroke:', currentStrokeIdRef.current);

      NativeGestureCanvas.endStroke(
        canvasState.canvasId,
        currentStrokeIdRef.current,
        point,
      );

      // Reset both the ref and the state
      currentStrokeIdRef.current = null;
      setCanvasState(prev => ({...prev, strokeId: null}));
      setIsDrawing(false);

      // Add a delay for the snapshot update
      setTimeout(() => {
        updateSnapshot();
      }, 100);
    },
    [canvasState.canvasId, updateSnapshot],
  );

  const applyMotion = useCallback(
    (accelerationX: number, accelerationY: number, accelerationZ: number) => {
      if (canvasState.canvasId === null) return;

      NativeGestureCanvas.applyMotionToCanvas(
        canvasState.canvasId,
        accelerationX,
        accelerationY,
        accelerationZ,
      );
    },
    [canvasState.canvasId],
  );

  const clearCanvas = useCallback(() => {
    if (canvasState.canvasId === null) return;

    NativeGestureCanvas.clearCanvas(canvasState.canvasId);
    updateSnapshot();
  }, [canvasState.canvasId, updateSnapshot]);

  return {
    canvasState,
    brushStyle,
    setBrushStyle,
    isDrawing,
    performanceStats,
    handleStartDrawing,
    handleDrawMove,
    handleEndDrawing,
    applyMotion,
    clearCanvas,
  };
};
