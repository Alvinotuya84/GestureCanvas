#pragma once

#include <string>
#include <cstdint>

namespace facebook::react {

class BrushEngine {
public:
  BrushEngine();
  
  void configureBrush(double size, double opacity, uint32_t color, 
                     const std::string& texture, double dampening, double fluidResponse);
  void simulatePhysics(double accelX, double accelY, double accelZ);
  
  double size_;
  double opacity_;
  uint32_t color_;
  std::string texture_;
  double dampening_;
  double fluidResponse_;
  
  // Physics state
  double velocityX_;
  double velocityY_;
};

} // namespace facebook::react