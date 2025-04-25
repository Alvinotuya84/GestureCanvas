import {useState, useEffect} from 'react';
import {NativeEventEmitter, NativeModules, Platform} from 'react-native';

const isIOS = Platform.OS === 'ios';

interface MotionData {
  x: number;
  y: number;
  z: number;
}

export const useMotionSensor = (enabled = true) => {
  const [motion, setMotion] = useState<MotionData>({x: 0, y: 0, z: 0});
  const [isAvailable, setIsAvailable] = useState<boolean>(false);

  useEffect(() => {
    let subscription: any = null;
    let gyroSubscription: any = null;
    let accelerometerSubscription: any = null;

    const setupSensors = async () => {
      if (!enabled) return;

      try {
        if (isIOS) {
          // iOS implementation using DeviceMotion
          const {RNDeviceMotion} = NativeModules;
          const deviceMotionEmitter = new NativeEventEmitter(RNDeviceMotion);

          await RNDeviceMotion.setUpdateInterval(1000 / 60); // 60fps

          subscription = deviceMotionEmitter.addListener(
            'DeviceMotionData',
            (data: any) => {
              if (data && data.acceleration) {
                setMotion({
                  x: data.acceleration.x,
                  y: data.acceleration.y,
                  z: data.acceleration.z,
                });
              }
            },
          );

          await RNDeviceMotion.startDeviceMotionUpdates();
          setIsAvailable(true);
        } else {
          // Android implementation using Sensors
          const {Sensors} = NativeModules;
          const sensorEmitter = new NativeEventEmitter(Sensors);

          // Try to use accelerometer first
          accelerometerSubscription = sensorEmitter.addListener(
            'Accelerometer',
            (data: any) => {
              if (data) {
                setMotion({
                  x: data.x,
                  y: data.y,
                  z: data.z,
                });
              }
            },
          );

          // Fallback to gyroscope if available
          gyroSubscription = sensorEmitter.addListener(
            'Gyroscope',
            (data: any) => {
              if (data) {
                // Combine with accelerometer data for better results
                setMotion(prev => ({
                  x: prev.x * 0.8 + data.x * 0.2,
                  y: prev.y * 0.8 + data.y * 0.2,
                  z: prev.z * 0.8 + data.z * 0.2,
                }));
              }
            },
          );

          Sensors.startAccelerometerUpdates();
          Sensors.startGyroscopeUpdates();
          setIsAvailable(true);
        }
      } catch (e) {
        console.error('Motion sensors not available:', e);
        setIsAvailable(false);
      }
    };

    setupSensors();

    return () => {
      if (subscription) {
        subscription.remove();
      }

      if (gyroSubscription) {
        gyroSubscription.remove();
      }

      if (accelerometerSubscription) {
        accelerometerSubscription.remove();
      }

      if (isIOS && NativeModules.RNDeviceMotion) {
        NativeModules.RNDeviceMotion.stopDeviceMotionUpdates();
      } else if (NativeModules.Sensors) {
        NativeModules.Sensors.stopAccelerometerUpdates();
        NativeModules.Sensors.stopGyroscopeUpdates();
      }
    };
  }, [enabled]);

  return {
    motion,
    isAvailable,
  };
};
