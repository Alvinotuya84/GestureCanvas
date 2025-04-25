#pragma once

#include <vector>
#include <string>
#include <cstdint>

namespace facebook::react {

class Canvas {
public:
  Canvas(int width, int height, uint32_t backgroundColor);
  ~Canvas();
  
  void clear();
  void applyStrokeLine(double x1, double y1, double x2, double y2, 
                      double pressure, double size, uint32_t color, 
                      double opacity, const std::string& texture);
  void applyPhysics(double accelX, double accelY, double accelZ);
  std::string getSnapshotAsBase64();
  
private:
  int width_;
  int height_;
  uint32_t backgroundColor_;
  std::vector<uint32_t> pixelData_;
  std::vector<uint8_t> fluidLayer_; 
  std::string base64_encode(const std::vector<uint8_t>& input);

};

} 