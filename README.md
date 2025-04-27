# GestureCanvas

GestureCanvas is a high-performance drawing application built with React Native that leverages C++ Turbo Modules for efficient brush physics and rendering. This app demonstrates how to use React Native's new architecture to offload computationally intensive tasks to native code.

## Features

- Real-time drawing with pressure sensitivity
- Physics-based brush effects that respond to device motion
- Multiple brush textures (Normal, Chalk, Watercolor)
- Customizable brush properties (size, opacity, color)
- Performance monitoring with real-time FPS display
- Fluid UI powered by React Native Reanimated

## Technical Overview

GestureCanvas showcases the power of React Native's Turbo Modules by implementing the core rendering and physics logic in C++. This approach provides several advantages:

- **Cross-platform native performance**: The C++ code runs natively on both iOS and Android
- **Reduced bridge traffic**: Direct JSI calls without serialization overhead
- **High-performance physics**: Complex calculations run efficiently in native code
- **Smooth 60fps rendering**: Even with complex brush effects and fluid simulations

## Architecture

### JavaScript Layer

- **React Components**: UI rendering and user interaction
- **Reanimated**: Gesture handling and smooth animations
- **Hooks**: Abstract native module interaction and sensor access

### Native Layer

- **C++ Turbo Module**: Cross-platform implementation for brush physics and rendering
- **Canvas Management**: Efficient pixel buffer handling in C++
- **Physics Engine**: Simulates brush dynamics and fluid interactions

## Project Structure

```
GestureCanvas/
├── ios/                      # iOS native code
├── android/                  # Android native code
├── shared/                   # C++ shared code
│   ├── NativeGestureCanvas.h # C++ Turbo Module header
│   ├── NativeGestureCanvas.cpp # C++ Turbo Module implementation
│   ├── Canvas.h              # Canvas class header
│   ├── Canvas.cpp            # Canvas implementation
│   ├── BrushEngine.h         # Brush physics header
│   ├── BrushEngine.cpp       # Brush physics implementation
│   ├── Stroke.h              # Stroke tracking header
│   └── Stroke.cpp            # Stroke implementation
├── specs/                    # JavaScript specs for Codegen
│   └── NativeGestureCanvas.ts # Turbo Module TypeScript specs
├── components/               # React components
│   ├── Canvas.tsx            # Drawing surface component
│   └── BrushToolbar.tsx      # Brush customization UI
├── hooks/                    # Custom React hooks
│   ├── useCanvas.ts          # Canvas state management hook
│   └── useMotionSensor.ts    # Device motion sensor access
└── App.tsx                   # Main application component
```

## Implementation Details

### Brush Physics

The C++ implementation includes sophisticated physics simulations for brush behavior:

- Dampening factors for natural brush movement
- Fluid response for paint flow and watercolor effects
- Texture generation for different brush types
- Motion impact from device accelerometer/gyroscope

### Drawing Engine

The drawing engine efficiently handles:

- Canvas state management
- Stroke path calculation
- Color mixing algorithms
- Pressure sensitivity mapping
- Texture application

### Performance Optimizations

- Memory-efficient pixel buffer management
- Optimized rendering loop targeting 60fps
- Minimal data transfer between JS and native code
- Efficient gesture processing with Reanimated worklets

## Getting Started

### Prerequisites

- Node.js and npm/yarn
- React Native development environment
- Xcode (for iOS)
- Android Studio (for Android)

### Installation

1. Clone the repository

```bash
git clone https://github.com/Alvinotuya84/GestureCanvas.git
cd GestureCanvas
```

2. Install dependencies

```bash
npm install
# or
yarn
```

3. Install CocoaPods dependencies (iOS)

```bash
cd ios
pod install
cd ..
```

4. Run the app

```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

## Learnings & Challenges

Developing GestureCanvas provided valuable insights into:

1. **Turbo Module Implementation**: Creating cross-platform C++ modules that work seamlessly with React Native's new architecture.

2. **JSI Communication**: Efficiently passing data between JavaScript and C++ without the overhead of serialization.

3. **Memory Management**: Properly handling memory in C++ to avoid leaks, especially with large canvas buffers.

4. **Gesture Optimization**: Using Reanimated worklets to process touch data on the UI thread for minimal latency.

5. **Sensor Integration**: Accessing and utilizing device motion sensors across platforms for interactive brush physics.

## Future Improvements

- Implement layer support for more complex artwork
- Add undo/redo functionality
- Support for loading and saving drawings
- Additional brush types and effects
- Color picker for more precise color selection
- Shared canvas for collaborative drawing

## License

MIT

## Acknowledgements

- React Native Team for the new architecture and Turbo Modules
- Software Mansion for React Native Reanimated and Gesture Handler
- The open source community for valuable resources and inspiration
