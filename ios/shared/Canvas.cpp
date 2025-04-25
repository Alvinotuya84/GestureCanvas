#include "Canvas.h"
#include <algorithm>
#include <cmath>

namespace facebook::react {

Canvas::Canvas(int width, int height, uint32_t backgroundColor)
    : width_(width), height_(height), backgroundColor_(backgroundColor) {
  pixelData_.resize(width * height, backgroundColor);
  fluidLayer_.resize(width * height * 2, 0);
}

Canvas::~Canvas() {
  // Clean up resources
}

void Canvas::clear() {
  std::fill(pixelData_.begin(), pixelData_.end(), backgroundColor_);
  std::fill(fluidLayer_.begin(), fluidLayer_.end(), 0);
}

void Canvas::applyStrokeLine(double x1, double y1, double x2, double y2, 
                           double pressure, double size, uint32_t color, 
                           double opacity, const std::string& texture) {
  // Implementation similar to what you had before, but with explicit std:: prefixes
  double adjustedSize = size * (0.5 + 0.5 * pressure);
  double dx = x2 - x1;
  double dy = y2 - y1;
  double length = std::sqrt(dx * dx + dy * dy);
  
  // ... rest of the implementation
  // Remember to use std::min, std::max, std::pow, etc.
}

void Canvas::applyPhysics(double accelX, double accelY, double accelZ) {
  // Implementation with proper std:: prefixes
}

std::string Canvas::getSnapshotAsBase64() {
  // Implementation
  return "data:image/png;base64,...";
}

} // namespace facebook::react