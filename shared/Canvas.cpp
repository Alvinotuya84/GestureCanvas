#include "Canvas.h"
#include <algorithm>
#include <cmath>
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


std::string facebook::react::Canvas::base64_encode(const std::vector<uint8_t>& input) {
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
    
    std::memcpy(bmpData.data(), &header, headerSize);
    
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
    
    std::string base64Data = base64_encode(bmpData);
    
    return "data:image/bmp;base64," + base64Data;
}

} // namespace facebook::react