#pragma once

#include <AppSpecsJSI.h>
#include <memory>
#include <string>
#include <vector>
#include <unordered_map>

namespace facebook::react {

// Forward declarations
class Canvas;
class BrushEngine;
class Stroke;

class NativeGestureCanvas : public NativeGestureCanvasCxxSpec<NativeGestureCanvas> {
public:
  NativeGestureCanvas(std::shared_ptr<CallInvoker> jsInvoker);
  ~NativeGestureCanvas();

  // Canvas management
  int createCanvas(jsi::Runtime& rt, jsi::Object config);
  void destroyCanvas(jsi::Runtime& rt, int canvasId);
  void clearCanvas(jsi::Runtime& rt, int canvasId);
  
  // Stroke handling
  int beginStroke(jsi::Runtime& rt, int canvasId, jsi::Object point, jsi::Object brushStyle);
  void addPointToStroke(jsi::Runtime& rt, int canvasId, int strokeId, jsi::Object point);
  void endStroke(jsi::Runtime& rt, int canvasId, int strokeId, jsi::Object point);
  
  // Motion impact
  void applyMotionToCanvas(
    jsi::Runtime& rt, 
    int canvasId, 
    double accelerationX, 
    double accelerationY, 
    double accelerationZ
  );
  
  // Canvas rendering
  std::string getCanvasSnapshot(jsi::Runtime& rt, int canvasId);
  
  // Performance metrics
  double getAverageRenderTime(jsi::Runtime& rt);

private:
  // Utility methods for converting between JSI and C++ types
  std::unordered_map<std::string, double> extractPointData(jsi::Runtime& rt, const jsi::Object& point);
  std::unordered_map<std::string, jsi::Value> extractBrushStyleData(jsi::Runtime& rt, const jsi::Object& brushStyle);
  
  // Internal state
  std::unordered_map<int, std::shared_ptr<Canvas>> canvases_;
  std::unordered_map<int, std::shared_ptr<BrushEngine>> brushEngines_;
  std::unordered_map<int, std::shared_ptr<Stroke>> activeStrokes_;
  
  int nextCanvasId_ = 1;
  int nextStrokeId_ = 1;
  
  std::vector<double> renderTimes_;
  int renderTimeHistorySize_ = 60; // Keep last 60 render times for averaging
};

} // namespace facebook::react