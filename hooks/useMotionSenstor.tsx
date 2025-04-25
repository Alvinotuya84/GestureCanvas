// useMotionSensor.ts
import {useState, useEffect} from 'react';
import {DeviceMotion} from 'expo-sensors';

interface MotionData {
  x: number;
  y: number;
  z: number;
}

export const useMotionSensor = (enabled = true) => {
  const [motion, setMotion] = useState<MotionData>({x: 0, y: 0, z: 0});
  const [isAvailable, setIsAvailable] = useState<boolean>(false);

  useEffect(() => {
    let subscription: ReturnType<typeof DeviceMotion.addListener> | null = null;

    const setupSensors = async () => {
      if (!enabled) return;

      try {
        // Check if DeviceMotion is available
        const isDeviceMotionAvailable = await DeviceMotion.isAvailableAsync();
        setIsAvailable(isDeviceMotionAvailable);

        if (isDeviceMotionAvailable) {
          // Set update interval (in ms)
          DeviceMotion.setUpdateInterval(1000 / 60); // 60fps

          // Start listening for updates
          subscription = DeviceMotion.addListener(data => {
            const {x, y, z} = data.acceleration;
            setMotion({x, y, z});
          });
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
    };
  }, [enabled]);

  return {
    motion,
    isAvailable,
  };
};
