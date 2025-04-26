import React from 'react';
import {View, Text, StyleSheet, useWindowDimensions} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';

interface CanvasHeaderProps {
  performanceStats: {
    fps: number;
  };
}

export const CanvasHeader: React.FC<CanvasHeaderProps> = ({
  performanceStats,
}) => {
  const {width} = useWindowDimensions();
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      const scrollY = event.contentOffset.y;
      opacity.value = withTiming(scrollY > 10 ? 0 : 1, {duration: 300});
      translateY.value = withTiming(scrollY > 10 ? -50 : 0, {duration: 300});
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{translateY: translateY.value}],
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.headerContent}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}></Text>
          {/* <Text style={styles.subtitle}>Drawing with c++ physics</Text> */}
        </View>

        <View style={styles.statsContainer}>
          {performanceStats.fps > 0 && (
            <View style={styles.fpsContainer}>
              <View
                style={[
                  styles.fpsIndicator,
                  {
                    backgroundColor:
                      performanceStats.fps > 45
                        ? '#4CAF50'
                        : performanceStats.fps > 30
                        ? '#FFC107'
                        : '#F44336',
                  },
                ]}
              />
              <View style={styles.fpsTextContainer}>
                <Text style={styles.fpsText}>{performanceStats.fps} FPS</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  fpsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fpsIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  fpsTextContainer: {
    minWidth: 50,
  },
  fpsText: {
    color: 'white',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  toolTip: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginTop: 15,
    marginHorizontal: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  toolTipText: {
    fontSize: 13,
    color: '#555',
  },
});
