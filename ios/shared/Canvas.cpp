#include "Canvas.h"
#include <algorithm>
#include <cmath>
#include <cstring>
#include <random>

#pragma pack(push, 1)
struct BMPHeader {
    uint16_t fileType;      // File type, always "BM" (0x4D42)
    uint32_t fileSize;      // Size of the file in bytes
    uint16_t reserved1;     // Reserved, always 0
    uint16_t reserved2;     // Reserved, always 0
    uint32_t dataOffset;    // Offset to image data in bytes
    uint32_t headerSize;    // Header size in bytes (40)
    int32_t width;          // Width of the image
    int32_t height;         // Height of the image
    uint16_t planes;        // Number of color planes
    uint16_t bitsPerPixel;  // Bits per pixel
    uint32_t compression;   // Compression type
    uint32_t imageSize;     // Image size in bytes
    int32_t xPixelsPerM;    // Pixels per meter in x
    int32_t yPixelsPerM;    // Pixels per meter in y
    uint32_t colorsUsed;    // Number of colors used
    uint32_t colorsImportant; // Number of important colors
};
#pragma pack(pop)

namespace facebook::react {

Canvas::Canvas(int width, int height, uint32_t backgroundColor)
    : width_(width), height_(height), backgroundColor_(backgroundColor) {
  pixelData_.resize(width * height, backgroundColor);
  fluidLayer_.resize(width * height * 2, 0);
}

Canvas::~Canvas() {
}

void Canvas::clear() {
  std::fill(pixelData_.begin(), pixelData_.end(), backgroundColor_);
  std::fill(fluidLayer_.begin(), fluidLayer_.end(), 0);
}

void Canvas::applyStrokeLine(double x1, double y1, double x2, double y2, 
                           double pressure, double size, uint32_t color, 
                           double opacity, const std::string& texture) {
  double adjustedSize = size * (0.5 + 0.5 * pressure);
  double dx = x2 - x1;
  double dy = y2 - y1;
  double length = std::sqrt(dx * dx + dy * dy);
  
  // If points are very close, just draw a single point
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
  
  // For longer lines, normalize direction vector
  dx /= length;
  dy /= length;
  
  // Apply texture effects
  double textureEffect = 1.0;
  static std::random_device rd;
  static std::mt19937 gen(rd());
  static std::uniform_real_distribution<> dis(0.8, 1.2);
  
  if (texture == "chalk") {
    textureEffect = 0.8 + 0.2 * dis(gen);
  } else if (texture == "watercolor") {
    textureEffect = 1.2;
  }
  
  // Draw the stroke by sampling points along the line
  const int steps = static_cast<int>(length) * 2; // More steps for smoother lines
  for (int i = 0; i <= steps; ++i) {
    double t = i / static_cast<double>(steps);
    double x = x1 + dx * length * t;
    double y = y1 + dy * length * t;
    
    // Adjust brush size based on position along stroke for more natural look
    double strokeProgress = std::min(t, 1.0 - t) * 2.0;
    double strokeSizeFactor = 0.5 + 0.5 * std::pow(strokeProgress, 0.5);
    double brushSize = adjustedSize * strokeSizeFactor * textureEffect;
    
    int centerX = static_cast<int>(x);
    int centerY = static_cast<int>(y);
    int radius = static_cast<int>(brushSize / 2.0);
    
    // Draw a brush stamp at this position
    for (int py = std::max(0, centerY - radius); py < std::min(height_, centerY + radius + 1); ++py) {
      for (int px = std::max(0, centerX - radius); px < std::min(width_, centerX + radius + 1); ++px) {
        double distance = std::sqrt(std::pow(px - x, 2) + std::pow(py - y, 2));
        if (distance <= radius) {
          // Apply falloff based on distance from center
          double falloff = texture == "watercolor" ? 0.7 : 2.0;
          double alpha = std::pow(1.0 - distance / radius, falloff) * opacity * pressure;
          
          // Apply texture effects
          if (texture == "chalk") {
            // Simple noise effect for chalk
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
              // Softer blending for watercolor
              blendFactor *= 0.7;
              resultR = static_cast<uint8_t>(existingR * (1.0 - blendFactor) + newR * blendFactor);
              resultG = static_cast<uint8_t>(existingG * (1.0 - blendFactor) + newG * blendFactor);
              resultB = static_cast<uint8_t>(existingB * (1.0 - blendFactor) + newB * blendFactor);
            } else {
              // Normal blending for other brushes
              resultR = static_cast<uint8_t>(existingR * (1.0 - blendFactor) + newR * blendFactor);
              resultG = static_cast<uint8_t>(existingG * (1.0 - blendFactor) + newG * blendFactor);
              resultB = static_cast<uint8_t>(existingB * (1.0 - blendFactor) + newB * blendFactor);
            }
            
            uint8_t resultA = static_cast<uint8_t>(std::min(255.0, existingA + newA * 0.5));
            
            pixelData_[index] = (resultA << 24) | (resultR << 16) | (resultG << 8) | resultB;
            
            // Update fluid simulation data for watercolor effect
            if (texture == "watercolor") {
              if ((index * 2 + 1) < fluidLayer_.size()) {
                fluidLayer_[index * 2] += static_cast<uint8_t>(dx * pressure * 20);
                fluidLayer_[index * 2 + 1] += static_cast<uint8_t>(dy * pressure * 20);
              }
            }
          }
        }
      }
    }
  }
}

void Canvas::applyPhysics(double accelX, double accelY, double accelZ) {
  double accelMagnitude = std::sqrt(accelX * accelX + accelY * accelY + accelZ * accelZ);
  if (accelMagnitude < 0.5) {
    return; // Ignore small movements
  }
  
  // Normalize acceleration vector
  double normalizer = 1.0 / accelMagnitude;
  accelX *= normalizer;
  accelY *= normalizer;
  
  // Make a copy of pixel data to work with
  std::vector<uint32_t> newPixelData = pixelData_;
  
  // Calculate flow direction based on acceleration
  int flowX = static_cast<int>(accelX * 5);
  int flowY = static_cast<int>(accelY * 5);
  
  // Apply fluid simulation
  for (int y = 0; y < height_; ++y) {
    for (int x = 0; x < width_; ++x) {
      int sourceIndex = y * width_ + x;
      
      int fluidIndex = sourceIndex * 2;
      if (fluidIndex + 1 >= fluidLayer_.size()) continue;
      
      int velX = fluidLayer_[fluidIndex];
      int velY = fluidLayer_[fluidIndex + 1];
      
      // Skip pixels with no velocity
      if (velX == 0 && velY == 0) {
        continue;
      }
      
      // Calculate total flow including acceleration influence
      int totalFlowX = flowX + velX / 10;
      int totalFlowY = flowY + velY / 10;
      
      // Calculate target pixel position
      int targetX = x + totalFlowX;
      int targetY = y + totalFlowY;
      
      // Ensure target position is within canvas bounds
      if (targetX >= 0 && targetX < width_ && targetY >= 0 && targetY < height_) {
        int targetIndex = targetY * width_ + targetX;
        
        if (targetIndex >= 0 && targetIndex < newPixelData.size()) {
          uint32_t sourceColor = pixelData_[sourceIndex];
          uint32_t targetColor = newPixelData[targetIndex];
          
          // Extract color components
          uint8_t sourceA = (sourceColor >> 24) & 0xFF;
          uint8_t sourceR = (sourceColor >> 16) & 0xFF;
          uint8_t sourceG = (sourceColor >> 8) & 0xFF;
          uint8_t sourceB = sourceColor & 0xFF;
          
          uint8_t targetA = (targetColor >> 24) & 0xFF;
          uint8_t targetR = (targetColor >> 16) & 0xFF;
          uint8_t targetG = (targetColor >> 8) & 0xFF;
          uint8_t targetB = targetColor & 0xFF;
          
          // Apply gentle blending for fluid effect
          double blendFactor = 0.1;
          
          uint8_t resultR = static_cast<uint8_t>(targetR * (1.0 - blendFactor) + sourceR * blendFactor);
          uint8_t resultG = static_cast<uint8_t>(targetG * (1.0 - blendFactor) + sourceG * blendFactor);
          uint8_t resultB = static_cast<uint8_t>(targetB * (1.0 - blendFactor) + sourceB * blendFactor);
          uint8_t resultA = std::max(sourceA, targetA);
          
          newPixelData[targetIndex] = (resultA << 24) | (resultR << 16) | (resultG << 8) | resultB;
          
          // Gradually reduce velocity (damping)
          fluidLayer_[fluidIndex] = static_cast<uint8_t>(velX * 0.95);
          fluidLayer_[fluidIndex + 1] = static_cast<uint8_t>(velY * 0.95);
        }
      }
    }
  }
  
  // Update pixel data with new values
  pixelData_ = newPixelData;
}

std::string Canvas::base64_encode(const std::vector<uint8_t>& input) {
    static const char base64_chars[] = 
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        "abcdefghijklmnopqrstuvwxyz"
        "0123456789+/";
        
    std::string output;
    int val = 0, valb = -6;
    
    for (uint8_t c : input) {
        val = (val << 8) + c;
        valb += 8;
        while (valb >= 0) {
            output.push_back(base64_chars[(val >> valb) & 0x3F]);
            valb -= 6;
        }
    }
    
    if (valb > -6) {
        output.push_back(base64_chars[((val << 8) >> (valb + 8)) & 0x3F]);
    }
    
    // Add padding
    while (output.size() % 4) {
        output.push_back('=');
    }
    
    return output;
}

std::string Canvas::getSnapshotAsBase64() {
    // Calculate BMP file size (header + pixel data)
    const int headerSize = sizeof(BMPHeader);
    const int rowSize = ((width_ * 24 + 31) / 32) * 4; // Row size must be multiple of 4 bytes
    const int pixelDataSize = rowSize * height_;
    const int fileSize = headerSize + pixelDataSize;
    
    // Create header
    BMPHeader header;
    header.fileType = 0x4D42; // "BM"
    header.fileSize = fileSize;
    header.reserved1 = 0;
    header.reserved2 = 0;
    header.dataOffset = headerSize;
    header.headerSize = 40;
    header.width = width_;
    header.height = -height_; // Negative for top-down image
    header.planes = 1;
    header.bitsPerPixel = 24; // 24-bit RGB
    header.compression = 0;   // No compression
    header.imageSize = pixelDataSize;
    header.xPixelsPerM = 2835; // ~72 DPI
    header.yPixelsPerM = 2835; // ~72 DPI
    header.colorsUsed = 0;
    header.colorsImportant = 0;
    
    // Create buffer for entire BMP file
    std::vector<uint8_t> bmpData(fileSize);
    
    // Copy header to buffer
    std::memcpy(bmpData.data(), &header, headerSize);
    
    // Copy pixel data to buffer
    for (int y = 0; y < height_; ++y) {
        for (int x = 0; x < width_; ++x) {
            uint32_t pixel = pixelData_[y * width_ + x];
            
            uint8_t blue = pixel & 0xFF;
            uint8_t green = (pixel >> 8) & 0xFF;
            uint8_t red = (pixel >> 16) & 0xFF;
            
            int pos = headerSize + y * rowSize + x * 3;
            
            bmpData[pos] = blue;
            bmpData[pos + 1] = green;
            bmpData[pos + 2] = red;
        }
    }
    
    // Encode to base64
    std::string base64Data = base64_encode(bmpData);
    
    return "data:image/bmp;base64," + base64Data;
}

} // namespace facebook::react