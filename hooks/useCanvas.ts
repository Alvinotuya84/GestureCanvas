import {useState, useEffect, useRef, useCallback} from 'react';
import {useWindowDimensions} from 'react-native';
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
  const isMountedRef = useRef(true);

  useEffect(() => {
    setBrushStyle(initialBrushStyle);
  }, [initialBrushStyle]);

  const updateSnapshot = useCallback((canvasId: number) => {
    if (canvasId === null || !isMountedRef.current) return '';

    const snapshot = NativeGestureCanvas.getCanvasSnapshot(canvasId);

    if (isMountedRef.current) {
      setCanvasState(prev => ({...prev, snapshot}));
    }

    return snapshot;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    const canvasId = NativeGestureCanvas.createCanvas({
      width,
      height,
      backgroundColor: '#FFFFFF',
    });

    setCanvasState(prev => ({...prev, canvasId}));

    statsTimerRef.current = setInterval(() => {
      if (canvasId !== null && isMountedRef.current) {
        const renderTime = NativeGestureCanvas.getAverageRenderTime();
        const fps =
          renderTime > 0 ? Math.min(60, Math.round(1000 / renderTime)) : 0;

        setPerformanceStats({fps});
        updateSnapshot(canvasId);
      }
    }, 500);

    return () => {
      isMountedRef.current = false;

      if (statsTimerRef.current) {
        clearInterval(statsTimerRef.current);
      }

      if (canvasId !== null) {
        NativeGestureCanvas.destroyCanvas(canvasId);
      }
    };
  }, [width, height, updateSnapshot]);

  const handleStartDrawing = useCallback(
    (point: Point) => {
      if (canvasState.canvasId === null || !isMountedRef.current) {
        return;
      }

      const strokeId = NativeGestureCanvas.beginStroke(
        canvasState.canvasId,
        point,
        brushStyle,
      );

      currentStrokeIdRef.current = strokeId;
      setCanvasState(prev => ({...prev, strokeId}));
      setIsDrawing(true);
    },
    [canvasState.canvasId, brushStyle],
  );

  const handleDrawMove = useCallback(
    (point: Point) => {
      if (
        !isDrawing ||
        canvasState.canvasId === null ||
        currentStrokeIdRef.current === null ||
        !isMountedRef.current
      ) {
        return;
      }

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
      if (
        canvasState.canvasId === null ||
        currentStrokeIdRef.current === null ||
        !isMountedRef.current
      ) {
        return;
      }

      NativeGestureCanvas.endStroke(
        canvasState.canvasId,
        currentStrokeIdRef.current,
        point,
      );

      currentStrokeIdRef.current = null;

      if (isMountedRef.current) {
        setCanvasState(prev => ({...prev, strokeId: null}));
        setIsDrawing(false);
      }

      setTimeout(() => {
        if (canvasState.canvasId !== null && isMountedRef.current) {
          updateSnapshot(canvasState.canvasId);
        }
      }, 100);
    },
    [canvasState.canvasId, updateSnapshot],
  );

  const applyMotion = useCallback(
    (accelerationX: number, accelerationY: number, accelerationZ: number) => {
      if (canvasState.canvasId === null || !isMountedRef.current) return;

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
    if (canvasState.canvasId === null || !isMountedRef.current) return;

    NativeGestureCanvas.clearCanvas(canvasState.canvasId);

    if (isMountedRef.current && canvasState.canvasId !== null) {
      updateSnapshot(canvasState.canvasId);
    }
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
