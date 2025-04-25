/**
 * Creates a BMP image in base64 format from pixel data
 * @param {number} width - Width of the canvas
 * @param {number} height - Height of the canvas
 * @param {Uint32Array|Array<number>} pixelData - Array of pixel data in ARGB format (0xAARRGGBB)
 * @param {number} backgroundColor - Background color in ARGB format
 * @returns {string} - Data URL containing base64 encoded BMP image
 */
function getSnapshotAsBase64(
  width,
  height,
  pixelData,
  backgroundColor = 0xffffffff,
) {
  // If pixelData is not provided, generate a blank canvas
  if (!pixelData) {
    pixelData = new Uint32Array(width * height);
    pixelData.fill(backgroundColor);
  }

  // Calculate BMP file size components
  const headerSize = 14 + 40; // 14 bytes BMP file header + 40 bytes DIB header
  const rowSize = Math.floor((width * 24 + 31) / 32) * 4; // Row size must be multiple of 4 bytes (24 bits per pixel)
  const pixelDataSize = rowSize * height;
  const fileSize = headerSize + pixelDataSize;

  // Create a buffer for the BMP data
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // BMP File Header (14 bytes)
  view.setUint8(0, 0x42); // 'B'
  view.setUint8(1, 0x4d); // 'M'
  view.setUint32(2, fileSize, true); // File size
  view.setUint16(6, 0, true); // Reserved
  view.setUint16(8, 0, true); // Reserved
  view.setUint32(10, headerSize, true); // Offset to pixel data

  // DIB Header (40 bytes)
  view.setUint32(14, 40, true); // Header size
  view.setInt32(18, width, true); // Width
  view.setInt32(22, -height, true); // Height (negative for top-down)
  view.setUint16(26, 1, true); // Planes
  view.setUint16(28, 24, true); // Bits per pixel (24-bit RGB)
  view.setUint32(30, 0, true); // No compression
  view.setUint32(34, pixelDataSize, true); // Image size
  view.setInt32(38, 2835, true); // X pixels per meter (~72 DPI)
  view.setInt32(42, 2835, true); // Y pixels per meter
  view.setUint32(46, 0, true); // Colors in palette
  view.setUint32(50, 0, true); // Important colors

  // Write pixel data
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = pixelData[y * width + x];
      const pos = headerSize + y * rowSize + x * 3;

      // Extract ARGB components (we ignore alpha for BMP)
      const red = (pixel >> 16) & 0xff;
      const green = (pixel >> 8) & 0xff;
      const blue = pixel & 0xff;

      // BMP stores pixels as BGR
      view.setUint8(pos, blue);
      view.setUint8(pos + 1, green);
      view.setUint8(pos + 2, red);
    }

    // Pad row to multiple of 4 bytes if needed
    for (let p = width * 3; p < rowSize; p++) {
      view.setUint8(headerSize + y * rowSize + p, 0);
    }
  }

  // Convert to base64
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  return 'data:image/bmp;base64,' + base64;
}

/**
 * Function to draw a line on canvas data
 * @param {Uint32Array} pixelData - Canvas pixel data
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} x1 - Start x coordinate
 * @param {number} y1 - Start y coordinate
 * @param {number} x2 - End x coordinate
 * @param {number} y2 - End y coordinate
 * @param {number} size - Brush size
 * @param {number} color - Color in 0xRRGGBB format
 * @param {number} opacity - Opacity from 0 to 1
 */
function drawLine(
  pixelData,
  width,
  height,
  x1,
  y1,
  x2,
  y2,
  size,
  color,
  opacity = 1,
) {
  // Apply alpha channel to color
  const alpha = Math.floor(opacity * 255) << 24;
  const fullColor = alpha | (color & 0xffffff);

  // Calculate adjusted size based on pressure (simplified for JS implementation)
  const adjustedSize = size;

  // Calculate line parameters
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);

  // If points are too close, just draw a single point
  if (length < 1) {
    drawPoint(pixelData, width, height, x1, y1, adjustedSize, fullColor);
    return;
  }

  // Normalize direction
  const dirX = dx / length;
  const dirY = dy / length;

  // Draw points along the line
  const steps = Math.max(length, 1);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x1 + dirX * length * t;
    const y = y1 + dirY * length * t;
    drawPoint(pixelData, width, height, x, y, adjustedSize, fullColor);
  }
}

/**
 * Draw a point (circle) on canvas data
 * @param {Uint32Array} pixelData - Canvas pixel data
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} x - Center x coordinate
 * @param {number} y - Center y coordinate
 * @param {number} size - Radius of point
 * @param {number} color - Color in 0xAARRGGBB format
 */
function drawPoint(pixelData, width, height, x, y, size, color) {
  // Calculate bounds for the circle
  const radius = size / 2;
  const minX = Math.max(0, Math.floor(x - radius));
  const maxX = Math.min(width - 1, Math.ceil(x + radius));
  const minY = Math.max(0, Math.floor(y - radius));
  const maxY = Math.min(height - 1, Math.ceil(y + radius));

  const radiusSq = radius * radius;

  // Extract color components
  const alpha = (color >>> 24) & 0xff;
  const red = (color >>> 16) & 0xff;
  const green = (color >>> 8) & 0xff;
  const blue = color & 0xff;

  // Draw the circle
  for (let cy = minY; cy <= maxY; cy++) {
    for (let cx = minX; cx <= maxX; cx++) {
      // Calculate distance from center
      const dx = cx - x;
      const dy = cy - y;
      const distSq = dx * dx + dy * dy;

      if (distSq <= radiusSq) {
        // Simple anti-aliasing: calculate alpha based on distance from edge
        let pixelAlpha = alpha;
        if (distSq > radiusSq * 0.8) {
          const edgeDist = Math.sqrt(distSq) - radius * 0.9;
          if (edgeDist > 0) {
            pixelAlpha = Math.max(
              0,
              Math.floor(alpha * (1 - edgeDist / (radius * 0.1))),
            );
          }
        }

        if (pixelAlpha > 0) {
          const index = cy * width + cx;

          // Alpha blending with existing pixel
          const existingColor = pixelData[index];
          const existingAlpha = (existingColor >>> 24) & 0xff;
          const existingRed = (existingColor >>> 16) & 0xff;
          const existingGreen = (existingColor >>> 8) & 0xff;
          const existingBlue = existingColor & 0xff;

          // Simple alpha blending
          const outAlpha = pixelAlpha + existingAlpha * (1 - pixelAlpha / 255);
          const outRed = Math.floor(
            (red * pixelAlpha +
              existingRed * existingAlpha * (1 - pixelAlpha / 255)) /
              outAlpha,
          );
          const outGreen = Math.floor(
            (green * pixelAlpha +
              existingGreen * existingAlpha * (1 - pixelAlpha / 255)) /
              outAlpha,
          );
          const outBlue = Math.floor(
            (blue * pixelAlpha +
              existingBlue * existingAlpha * (1 - pixelAlpha / 255)) /
              outAlpha,
          );

          pixelData[index] =
            (Math.floor(outAlpha) << 24) |
            (outRed << 16) |
            (outGreen << 8) |
            outBlue;
        }
      }
    }
  }
}

/**
 * Create a canvas tracking object for drawing operations
 * @param {number} width - Width of the canvas
 * @param {number} height - Height of the canvas
 * @param {number} backgroundColor - Background color in ARGB format
 */
function createJSCanvas(width, height, backgroundColor = 0xffffffff) {
  const pixelData = new Uint32Array(width * height);
  pixelData.fill(backgroundColor);

  let currentStrokeId = 0;
  const activeStrokes = new Map();

  return {
    width,
    height,
    pixelData,
    backgroundColor,

    beginStroke(point, brushStyle) {
      const strokeId = ++currentStrokeId;
      activeStrokes.set(strokeId, {
        lastPoint: point,
        brushStyle,
      });
      return strokeId;
    },

    addPointToStroke(strokeId, point) {
      const stroke = activeStrokes.get(strokeId);
      if (!stroke) return false;

      drawLine(
        this.pixelData,
        this.width,
        this.height,
        stroke.lastPoint.x,
        stroke.lastPoint.y,
        point.x,
        point.y,
        stroke.brushStyle.size,
        parseInt(stroke.brushStyle.color.replace('#', '0x')),
        stroke.brushStyle.opacity,
      );

      stroke.lastPoint = point;
      return true;
    },

    endStroke(strokeId, point) {
      const stroke = activeStrokes.get(strokeId);
      if (!stroke) return false;

      this.addPointToStroke(strokeId, point);
      activeStrokes.delete(strokeId);
      return true;
    },

    clear() {
      this.pixelData.fill(this.backgroundColor);
      activeStrokes.clear();
    },

    getCanvasSnapshot() {
      return getSnapshotAsBase64(
        this.width,
        this.height,
        this.pixelData,
        this.backgroundColor,
      );
    },
  };
}

// Example usage:
/*
  const jsCanvas = createJSCanvas(400, 400, 0xFFFFFFFF);
  
  // Start a stroke
  const strokeId = jsCanvas.beginStroke(
    { x: 100, y: 100, pressure: 1, timestamp: Date.now() },
    { color: '#FF0000', size: 20, opacity: 0.8 }
  );
  
  // Add points to the stroke
  jsCanvas.addPointToStroke(strokeId, { x: 150, y: 150, pressure: 1, timestamp: Date.now() });
  jsCanvas.addPointToStroke(strokeId, { x: 200, y: 200, pressure: 1, timestamp: Date.now() });
  
  // End the stroke
  jsCanvas.endStroke(strokeId, { x: 250, y: 250, pressure: 1, timestamp: Date.now() });
  
  // Get the base64 snapshot
  const base64Image = jsCanvas.getCanvasSnapshot();
  */

export default createJSCanvas;
