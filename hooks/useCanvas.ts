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

  useEffect(() => {
    setBrushStyle(initialBrushStyle);
  }, [initialBrushStyle]);

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

        const snapshot = NativeGestureCanvas.getCanvasSnapshot(
          canvasState.canvasId,
        );
        setCanvasState(prev => ({
          ...prev,
          snapshot,
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
      if (canvasState.canvasId === null) return;

      const strokeId = NativeGestureCanvas.beginStroke(
        canvasState.canvasId,
        point,
        brushStyle,
      );

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
        canvasState.strokeId === null
      ) {
        return;
      }

      NativeGestureCanvas.addPointToStroke(
        canvasState.canvasId,
        canvasState.strokeId,
        point,
      );
    },
    [isDrawing, canvasState.canvasId, canvasState.strokeId],
  );

  const handleEndDrawing = useCallback(
    (point: Point) => {
      if (canvasState.canvasId === null || canvasState.strokeId === null) {
        return;
      }

      NativeGestureCanvas.endStroke(
        canvasState.canvasId,
        canvasState.strokeId,
        point,
      );

      setCanvasState(prev => ({...prev, strokeId: null}));
      setIsDrawing(false);

      const snapshot = NativeGestureCanvas.getCanvasSnapshot(
        canvasState.canvasId,
      );
      setCanvasState(prev => ({...prev, snapshot}));
    },
    [canvasState.canvasId, canvasState.strokeId],
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

    const snapshot = NativeGestureCanvas.getCanvasSnapshot(
      canvasState.canvasId,
    );
    setCanvasState(prev => ({...prev, snapshot}));
  }, [canvasState.canvasId]);

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
