#include "NativeGestureCanvas.h"
#include <chrono>
#include <cmath>
#include <algorithm>
#include <sstream>

class Canvas {
public:
  Canvas(int width, int height, uint32_t backgroundColor)
      : width_(width), height_(height), backgroundColor_(backgroundColor) {
    pixelData_.resize(width * height, backgroundColor);
    fluidLayer_.resize(width * height * 2, 0);
  }
  
  ~Canvas() {}
  
  void clear() {
    std::fill(pixelData_.begin(), pixelData_.end(), backgroundColor_);
    std::fill(fluidLayer_.begin(), fluidLayer_.end(), 0);
  }
  
  void applyStrokeLine(double x1, double y1, double x2, double y2, 
                        double pressure, double size, uint32_t color, 
                        double opacity, const std::string& texture) {
    double adjustedSize = size * (0.5 + 0.5 * pressure);
    double dx = x2 - x1;
    double dy = y2 - y1;
    double length = std::sqrt(dx * dx + dy * dy);
    
    if (length < 1.0) {
      int centerX = static_cast<int>(x1);
      int centerY = static_cast<int>(y1);
      int radius = static_cast<int>(adjustedSize / 2.0);
      
      for (int y = std::max(0, centerY - radius); y < std::min(height_, centerY + radius + 1); ++y) {
        for (int x = std::max(0, centerX - radius); x < std::min(width_, centerX + radius + 1); ++x) {
          double distance = std::sqrt(std::pow(x - centerX, 2) + std::pow(y - centerY, 2));
          if (distance <= radius) {
            double alpha = (1.0 - distance / radius) * opacity * pressure;
            int index = y * width_ + x;
            if (index >= 0 && index < pixelData_.size()) {
              uint32_t existingColor = pixelData_[index];
              
              uint8_t existingR = (existingColor >> 16) & 0xFF;
              uint8_t existingG = (existingColor >> 8) & 0xFF;
              uint8_t existingB = existingColor & 0xFF;
              uint8_t existingA = (existingColor >> 24) & 0xFF;
              
              uint8_t newR = (color >> 16) & 0xFF;
              uint8_t newG = (color >> 8) & 0xFF;
              uint8_t newB = color & 0xFF;
              uint8_t newA = static_cast<uint8_t>(alpha * 255);
              
              double blendFactor = newA / 255.0;
              uint8_t resultR = static_cast<uint8_t>(existingR * (1.0 - blendFactor) + newR * blendFactor);
              uint8_t resultG = static_cast<uint8_t>(existingG * (1.0 - blendFactor) + newG * blendFactor);
              uint8_t resultB = static_cast<uint8_t>(existingB * (1.0 - blendFactor) + newB * blendFactor);
              uint8_t resultA = static_cast<uint8_t>(std::min(255.0, static_cast<double>(existingA + newA)));

              
              pixelData_[index] = (resultA << 24) | (resultR << 16) | (resultG << 8) | resultB;
            }
          }
        }
      }
      return;
    }
    
    dx /= length;
    dy /= length;
    
    double textureEffect = 1.0;
    if (texture == "chalk") {
      textureEffect = 0.8 + 0.2 * (std::rand() / static_cast<double>(RAND_MAX));
    } else if (texture == "watercolor") {
      textureEffect = 1.2;
    }
    
    const int steps = static_cast<int>(length) * 2;
    for (int i = 0; i <= steps; ++i) {
      double t = i / static_cast<double>(steps);
      double x = x1 + dx * length * t;
      double y = y1 + dy * length * t;
      
      double strokeProgress = std::min(t, 1.0 - t) * 2.0;
      double strokeSizeFactor = 0.5 + 0.5 * std::pow(strokeProgress, 0.5);
      double brushSize = adjustedSize * strokeSizeFactor * textureEffect;
      
      int centerX = static_cast<int>(x);
      int centerY = static_cast<int>(y);
      int radius = static_cast<int>(brushSize / 2.0);
      
      for (int py = std::max(0, centerY - radius); py < std::min(height_, centerY + radius + 1); ++py) {
        for (int px = std::max(0, centerX - radius); px < std::min(width_, centerX + radius + 1); ++px) {
          double distance = std::sqrt(std::pow(px - x, 2) + std::pow(py - y, 2));
          if (distance <= radius) {
            double falloff = texture == "watercolor" ? 0.7 : 2.0;
            double alpha = std::pow(1.0 - distance / radius, falloff) * opacity * pressure;
            
            if (texture == "chalk") {
              double noise = std::sin(px * 0.8) * std::cos(py * 0.8) * 0.2 + 0.8;
              alpha *= noise;
            }
            
            int index = py * width_ + px;
            if (index >= 0 && index < pixelData_.size()) {
              uint32_t existingColor = pixelData_[index];
              
              uint8_t existingR = (existingColor >> 16) & 0xFF;
              uint8_t existingG = (existingColor >> 8) & 0xFF;
              uint8_t existingB = existingColor & 0xFF;
              uint8_t existingA = (existingColor >> 24) & 0xFF;
              
              uint8_t newR = (color >> 16) & 0xFF;
              uint8_t newG = (color >> 8) & 0xFF;
              uint8_t newB = color & 0xFF;
              uint8_t newA = static_cast<uint8_t>(alpha * 255);
              
              double blendFactor = newA / 255.0;
              uint8_t resultR, resultG, resultB;
              
              if (texture == "watercolor") {
                blendFactor *= 0.7;
                resultR = static_cast<uint8_t>(existingR * (1.0 - blendFactor) + newR * blendFactor);
                resultG = static_cast<uint8_t>(existingG * (1.0 - blendFactor) + newG * blendFactor);
                resultB = static_cast<uint8_t>(existingB * (1.0 - blendFactor) + newB * blendFactor);
              } else {
                resultR = static_cast<uint8_t>(existingR * (1.0 - blendFactor) + newR * blendFactor);
                resultG = static_cast<uint8_t>(existingG * (1.0 - blendFactor) + newG * blendFactor);
                resultB = static_cast<uint8_t>(existingB * (1.0 - blendFactor) + newB * blendFactor);
              }
              
              uint8_t resultA = static_cast<uint8_t>(std::min(255.0, existingA + newA * 0.5));
              
              pixelData_[index] = (resultA << 24) | (resultR << 16) | (resultG << 8) | resultB;
              
              if (texture == "watercolor") {
                fluidLayer_[index * 2] += static_cast<uint8_t>(dx * pressure * 20);
                fluidLayer_[index * 2 + 1] += static_cast<uint8_t>(dy * pressure * 20);
              }
            }
          }
        }
      }
    }
  }
  
  void applyPhysics(double accelX, double accelY, double accelZ) {
    double accelMagnitude = std::sqrt(accelX * accelX + accelY * accelY + accelZ * accelZ);
    if (accelMagnitude < 0.5) {
      return;
    }
    
    double normalizer = 1.0 / accelMagnitude;
    accelX *= normalizer;
    accelY *= normalizer;
    
    std::vector<uint32_t> newPixelData = pixelData_;
    
    int flowX = static_cast<int>(accelX * 5);
    int flowY = static_cast<int>(accelY * 5);
    
    for (int y = 0; y < height_; ++y) {
      for (int x = 0; x < width_; ++x) {
        int sourceIndex = y * width_ + x;
        
        int fluidIndex = sourceIndex * 2;
        if (fluidIndex + 1 >= fluidLayer_.size()) continue;
        
        int velX = fluidLayer_[fluidIndex];
        int velY = fluidLayer_[fluidIndex + 1];
        
        if (velX == 0 && velY == 0) {
          continue;
        }
        
        int totalFlowX = flowX + velX / 10;
        int totalFlowY = flowY + velY / 10;
        
        int targetX = x + totalFlowX;
        int targetY = y + totalFlowY;
        
        if (targetX >= 0 && targetX < width_ && targetY >= 0 && targetY < height_) {
          int targetIndex = targetY * width_ + targetX;
          
          if (targetIndex >= 0 && targetIndex < newPixelData.size()) {
            uint32_t sourceColor = pixelData_[sourceIndex];
            uint32_t targetColor = newPixelData[targetIndex];
            
            uint8_t sourceA = (sourceColor >> 24) & 0xFF;
            uint8_t sourceR = (sourceColor >> 16) & 0xFF;
            uint8_t sourceG = (sourceColor >> 8) & 0xFF;
            uint8_t sourceB = sourceColor & 0xFF;
            
            uint8_t targetA = (targetColor >> 24) & 0xFF;
            uint8_t targetR = (targetColor >> 16) & 0xFF;
            uint8_t targetG = (targetColor >> 8) & 0xFF;
            uint8_t targetB = targetColor & 0xFF;
            
            double blendFactor = 0.1;
            
            uint8_t resultR = static_cast<uint8_t>(targetR * (1.0 - blendFactor) + sourceR * blendFactor);
            uint8_t resultG = static_cast<uint8_t>(targetG * (1.0 - blendFactor) + sourceG * blendFactor);
            uint8_t resultB = static_cast<uint8_t>(targetB * (1.0 - blendFactor) + sourceB * blendFactor);
            uint8_t resultA = std::max(sourceA, targetA);
            
            newPixelData[targetIndex] = (resultA << 24) | (resultR << 16) | (resultG << 8) | resultB;
            
            fluidLayer_[fluidIndex] = static_cast<uint8_t>(velX * 0.95);
            fluidLayer_[fluidIndex + 1] = static_cast<uint8_t>(velY * 0.95);
          }
        }
      }
    }
    
    pixelData_ = newPixelData;
  }
  
  std::string getSnapshotAsBase64() {
    std::string result = "data:image/png;base64,";
    
    // In a real implementation, we would convert the pixel data to PNG and encode as base64
    // This is a simplified stub
    result += "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
    
    return result;
  }
  
private:
  int width_;
  int height_;
  uint32_t backgroundColor_;
  std::vector<uint32_t> pixelData_;
  std::vector<uint8_t> fluidLayer_;
};

class BrushEngine {
public:
  BrushEngine() : size_(10.0), opacity_(1.0), color_(0xFF000000), 
                 texture_("normal"), dampening_(0.9), fluidResponse_(0.5),
                 velocityX_(0.0), velocityY_(0.0) {}
  
  void configureBrush(double size, double opacity, uint32_t color, 
                     const std::string& texture, double dampening, double fluidResponse) {
    size_ = size;
    opacity_ = opacity;
    color_ = color;
    texture_ = texture;
    dampening_ = dampening;
    fluidResponse_ = fluidResponse;
  }
  
  void simulatePhysics(double accelX, double accelY, double accelZ) {
    double force = std::sqrt(accelX * accelX + accelY * accelY + accelZ * accelZ);
    if (force < 0.1) {
      velocityX_ *= dampening_;
      velocityY_ *= dampening_;
      return;
    }
    
    velocityX_ += accelX * fluidResponse_;
    velocityY_ += accelY * fluidResponse_;
    
    velocityX_ *= dampening_;
    velocityY_ *= dampening_;
  }
  
  double size_;
  double opacity_;
  uint32_t color_;
  std::string texture_;
  double dampening_;
  double fluidResponse_;
  
  double velocityX_;
  double velocityY_;
};

class Stroke {
public:
  Stroke(std::shared_ptr<BrushEngine> brushEngine) 
      : brushEngine_(brushEngine), isActive_(true) {}
  
  void addPoint(double x, double y, double pressure, double timestamp) {
    points_.push_back(std::make_tuple(x, y, pressure, timestamp));
  }
  
  void end(double x, double y, double pressure, double timestamp) {
    addPoint(x, y, pressure, timestamp);
    isActive_ = false;
  }
  
  std::shared_ptr<BrushEngine> brushEngine_;
  std::vector<std::tuple<double, double, double, double>> points_;
  bool isActive_;
};

namespace facebook::react {

NativeGestureCanvas::NativeGestureCanvas(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeGestureCanvasCxxSpec(std::move(jsInvoker)) {}

NativeGestureCanvas::~NativeGestureCanvas() {
  canvases_.clear();
  brushEngines_.clear();
  activeStrokes_.clear();
}

int NativeGestureCanvas::createCanvas(jsi::Runtime& rt, jsi::Object config) {
  auto width = static_cast<int>(config.getProperty(rt, "width").asNumber());
  auto height = static_cast<int>(config.getProperty(rt, "height").asNumber());
  
  std::string bgColorHex = config.getProperty(rt, "backgroundColor").asString(rt).utf8(rt);
  uint32_t bgColor = 0xFFFFFFFF;
  
  if (bgColorHex.length() > 0 && bgColorHex[0] == '#') {
    bgColorHex = bgColorHex.substr(1);
    std::stringstream ss;
    ss << std::hex << bgColorHex;
    ss >> bgColor;
    
    if (bgColorHex.length() == 6) {
      bgColor = (bgColor << 8) | 0xFF;
    }
  }
  
  int canvasId = nextCanvasId_++;
  canvases_[canvasId] = std::make_shared<Canvas>(width, height, bgColor);
  return canvasId;
}

void NativeGestureCanvas::destroyCanvas(jsi::Runtime& rt, int canvasId) {
  if (canvases_.find(canvasId) != canvases_.end()) {
    std::vector<int> strokesToRemove;
    for (const auto& [strokeId, stroke] : activeStrokes_) {
      strokesToRemove.push_back(strokeId);
    }
    
    for (int strokeId : strokesToRemove) {
      activeStrokes_.erase(strokeId);
    }
    
    canvases_.erase(canvasId);
  }
}

void NativeGestureCanvas::clearCanvas(jsi::Runtime& rt, int canvasId) {
  if (canvases_.find(canvasId) != canvases_.end()) {
    canvases_[canvasId]->clear();
  }
}

int NativeGestureCanvas::beginStroke(jsi::Runtime& rt, int canvasId, jsi::Object point, jsi::Object brushStyle) {
  if (canvases_.find(canvasId) == canvases_.end()) {
    return -1;
  }
  
  auto pointData = extractPointData(rt, point);
  auto brushStyleData = extractBrushStyleData(rt, brushStyle);
  
  auto brushEngine = std::make_shared<BrushEngine>();
  
  std::string colorHex = brushStyleData["color"].asString(rt).utf8(rt);
  uint32_t color = 0xFF000000;
  
  if (colorHex.length() > 0 && colorHex[0] == '#') {
    colorHex = colorHex.substr(1);
    std::stringstream ss;
    ss << std::hex << colorHex;
    ss >> color;
    
    if (colorHex.length() == 6) {
      color = (color << 8) | 0xFF;
    }
  }
  
  brushEngine->configureBrush(
    brushStyleData["size"].asNumber(),
    brushStyleData["opacity"].asNumber(),
    color,
    brushStyleData["texture"].asString(rt).utf8(rt),
    brushStyleData["dampening"].asNumber(),
    brushStyleData["fluidResponse"].asNumber()
  );
  
  int strokeId = nextStrokeId_++;
  auto stroke = std::make_shared<Stroke>(brushEngine);
  
  stroke->addPoint(
    pointData["x"],
    pointData["y"],
    pointData["pressure"],
    pointData["timestamp"]
  );
  
  activeStrokes_[strokeId] = stroke;
  brushEngines_[strokeId] = brushEngine;
  
  return strokeId;
}

void NativeGestureCanvas::addPointToStroke(jsi::Runtime& rt, int canvasId, int strokeId, jsi::Object point) {
  if (canvases_.find(canvasId) == canvases_.end() || activeStrokes_.find(strokeId) == activeStrokes_.end()) {
    return;
  }
  
  auto pointData = extractPointData(rt, point);
  
  auto stroke = activeStrokes_[strokeId];
  auto prevPoints = stroke->points_;
  
  if (!prevPoints.empty()) {
    auto [prevX, prevY, prevPressure, prevTimestamp] = prevPoints.back();
    
    stroke->addPoint(
      pointData["x"],
      pointData["y"],
      pointData["pressure"],
      pointData["timestamp"]
    );
    
    auto startTime = std::chrono::high_resolution_clock::now();
    
    canvases_[canvasId]->applyStrokeLine(
      prevX, prevY,
      pointData["x"], pointData["y"],
      pointData["pressure"],
      stroke->brushEngine_->size_,
      stroke->brushEngine_->color_,
      stroke->brushEngine_->opacity_,
      stroke->brushEngine_->texture_
    );
    
    auto endTime = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double, std::milli> renderTime = endTime - startTime;
    
    renderTimes_.push_back(renderTime.count());
    if (renderTimes_.size() > renderTimeHistorySize_) {
      renderTimes_.erase(renderTimes_.begin());
    }
  }
}

void NativeGestureCanvas::endStroke(jsi::Runtime& rt, int canvasId, int strokeId, jsi::Object point) {
  if (activeStrokes_.find(strokeId) != activeStrokes_.end()) {
    auto pointData = extractPointData(rt, point);
    
    activeStrokes_[strokeId]->end(
      pointData["x"],
      pointData["y"],
      pointData["pressure"],
      pointData["timestamp"]
    );
    
    activeStrokes_.erase(strokeId);
    brushEngines_.erase(strokeId);
  }
}

void NativeGestureCanvas::applyMotionToCanvas(
  jsi::Runtime& rt, 
  int canvasId, 
  double accelerationX, 
  double accelerationY, 
  double accelerationZ
) {
  if (canvases_.find(canvasId) != canvases_.end()) {
    canvases_[canvasId]->applyPhysics(accelerationX, accelerationY, accelerationZ);
    
    for (const auto& [strokeId, brushEngine] : brushEngines_) {
      brushEngine->simulatePhysics(accelerationX, accelerationY, accelerationZ);
    }
  }
}

std::string NativeGestureCanvas::getCanvasSnapshot(jsi::Runtime& rt, int canvasId) {
  if (canvases_.find(canvasId) != canvases_.end()) {
    return canvases_[canvasId]->getSnapshotAsBase64();
  }
  return "";
}

double NativeGestureCanvas::getAverageRenderTime(jsi::Runtime& rt) {
  if (renderTimes_.empty()) {
    return 0.0;
  }
  
  double sum = 0.0;
  for (double time : renderTimes_) {
    sum += time;
  }
  
  return sum / renderTimes_.size();
}

std::unordered_map<std::string, double> NativeGestureCanvas::extractPointData(jsi::Runtime& rt, const jsi::Object& point) {
  std::unordered_map<std::string, double> data;
  data["x"] = point.getProperty(rt, "x").asNumber();
  data["y"] = point.getProperty(rt, "y").asNumber();
  data["pressure"] = point.getProperty(rt, "pressure").asNumber();
  data["timestamp"] = point.getProperty(rt, "timestamp").asNumber();
  return data;
}

std::unordered_map<std::string, jsi::Value> NativeGestureCanvas::extractBrushStyleData(jsi::Runtime& rt, const jsi::Object& brushStyle) {
  std::unordered_map<std::string, jsi::Value> data;
  data["size"] = brushStyle.getProperty(rt, "size");
  data["opacity"] = brushStyle.getProperty(rt, "opacity");
  data["color"] = brushStyle.getProperty(rt, "color");
  data["texture"] = brushStyle.getProperty(rt, "texture");
  data["dampening"] = brushStyle.getProperty(rt, "dampening");
  data["fluidResponse"] = brushStyle.getProperty(rt, "fluidResponse");
  return data;
}

} // namespace facebook::react