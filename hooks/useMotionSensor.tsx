import {useAnimatedSensor, SensorType} from 'react-native-reanimated';
import {useEffect, useState, useRef} from 'react';
import {Platform, NativeModules, Alert} from 'react-native';

interface MotionData {
  x: number;
  y: number;
  z: number;
}

export const useMotionSensor = (enabled = true) => {
  const [motion, setMotion] = useState<MotionData>({x: 0, y: 0, z: 0});
  const [isAvailable, setIsAvailable] = useState(false);
  const requestedPermission = useRef(false);

  const accelerometer = useAnimatedSensor(SensorType.ACCELEROMETER, {
    interval: 16,
  });

  const gravity = useAnimatedSensor(SensorType.GRAVITY, {
    interval: 16,
  });

  const requestIOSPermissions = async () => {
    if (Platform.OS === 'ios' && !requestedPermission.current) {
      requestedPermission.current = true;

      try {
        if (NativeModules.CoreMotionPermissionsAuthorizer) {
          await NativeModules.CoreMotionPermissionsAuthorizer.authorize();
          return true;
        } else if (NativeModules.RNMotionManager) {
          await NativeModules.RNMotionManager.startAccelerometerUpdates();
          NativeModules.RNMotionManager.stopAccelerometerUpdates();
          return true;
        } else {
          return true;
        }
      } catch (error) {
        Alert.alert(
          'Motion Sensor Required',
          'Please enable motion and orientation access for this app in your device settings to get the full drawing experience.',
          [{text: 'OK'}],
        );
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const initSensors = async () => {
      if (Platform.OS === 'ios') {
        await requestIOSPermissions();
      }

      const accelAvailable = accelerometer.isAvailable;
      const gravityAvailable = gravity.isAvailable;

      setIsAvailable(accelAvailable || gravityAvailable);

      if (!accelAvailable && !gravityAvailable) {
        if (Platform.OS === 'ios') {
          setTimeout(() => {
            setIsAvailable(accelerometer.isAvailable || gravity.isAvailable);
          }, 1000);
        }
        return;
      }
    };

    initSensors();

    const intervalId = setInterval(() => {
      let sensorValue = null;

      if (accelerometer.isAvailable && accelerometer.sensor.value) {
        sensorValue = accelerometer.sensor.value;
      } else if (gravity.isAvailable && gravity.sensor.value) {
        sensorValue = gravity.sensor.value;
      }

      if (sensorValue) {
        const {x, y, z} = sensorValue;
        setMotion({x, y, z});
      }
    }, 16);

    return () => {
      clearInterval(intervalId);
      accelerometer.unregister();
      gravity.unregister();
    };
  }, [enabled, accelerometer, gravity]);

  return {
    motion,
    isAvailable,
  };
};
