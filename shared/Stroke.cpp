#include "Stroke.h"

namespace facebook::react {

Stroke::Stroke(std::shared_ptr<BrushEngine> brushEngine) 
    : brushEngine_(brushEngine), isActive_(true) {}

void Stroke::addPoint(double x, double y, double pressure, double timestamp) {
  points_.push_back(std::make_tuple(x, y, pressure, timestamp));
}

void Stroke::end(double x, double y, double pressure, double timestamp) {
  addPoint(x, y, pressure, timestamp);
  isActive_ = false;
}

} // namespace facebook::react