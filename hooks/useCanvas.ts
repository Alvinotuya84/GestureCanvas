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

  useEffect(() => {
    setBrushStyle(initialBrushStyle);
  }, [initialBrushStyle]);

  // Helper function to update the snapshot
  const updateSnapshot = useCallback(() => {
    if (canvasState.canvasId === null) return '';

    const snapshot = NativeGestureCanvas.getCanvasSnapshot(
      canvasState.canvasId,
    );
    console.log(
      'In hook - obtained snapshot:',
      snapshot ? 'Has value' : 'Empty',
    );

    setCanvasState(prev => {
      //   console.log(
      //     'Previous state before update:',
      //     prev.snapshot ? 'Has value' : 'Empty',
      //   );
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
      if (canvasState.canvasId === null) {
        console.log('Canvas ID is null!');
        return;
      }

      console.log('Beginning stroke with point:', point);
      const strokeId = NativeGestureCanvas.beginStroke(
        canvasState.canvasId,
        point,
        brushStyle,
      );
      console.log('Stroke ID returned:', strokeId);

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
      updateSnapshot();
    },
    [canvasState.canvasId, canvasState.strokeId, updateSnapshot],
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
