#pragma once

#include <vector>
#include <tuple>
#include <memory>
#include "BrushEngine.h"

namespace facebook::react {

class Stroke {
public:
  Stroke(std::shared_ptr<BrushEngine> brushEngine);
  
  void addPoint(double x, double y, double pressure, double timestamp);
  void end(double x, double y, double pressure, double timestamp);
  
  std::shared_ptr<BrushEngine> brushEngine_;
  std::vector<std::tuple<double, double, double, double>> points_; // x, y, pressure, timestamp
  bool isActive_;
};

} // namespace facebook::react