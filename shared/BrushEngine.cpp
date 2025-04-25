#include "BrushEngine.h"
#include <cmath>

namespace facebook::react {

BrushEngine::BrushEngine() 
    : size_(10.0), opacity_(1.0), color_(0xFF000000), 
      texture_("normal"), dampening_(0.9), fluidResponse_(0.5),
      velocityX_(0.0), velocityY_(0.0) {}

void BrushEngine::configureBrush(double size, double opacity, uint32_t color, 
                               const std::string& texture, double dampening, double fluidResponse) {
  size_ = size;
  opacity_ = opacity;
  color_ = color;
  texture_ = texture;
  dampening_ = dampening;
  fluidResponse_ = fluidResponse;
}

void BrushEngine::simulatePhysics(double accelX, double accelY, double accelZ) {
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

} // namespace facebook::react