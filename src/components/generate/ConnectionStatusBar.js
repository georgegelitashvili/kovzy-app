import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

const ConnectionStatusBar = ({ dictionary }) => {
  // ALWAYS call ALL hooks at the top level - NEVER conditionally
  const [isConnected, setIsConnected] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const newConnectionState = state.isConnected && state.isInternetReachable;
      
      if (isConnected !== newConnectionState) {
        setIsConnected(newConnectionState);
        setIsVisible(!newConnectionState);

        if (!newConnectionState) {
          // Show the banner when disconnected
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        } else {
          // Hide after a delay when reconnected to show the user
          setTimeout(() => {
            Animated.timing(animatedValue, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              setIsVisible(false);
            });
          }, 2000);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isConnected]);

  // Return null only after all hooks have been called
  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={styles.text}>
        {isConnected 
          ? (dictionary?.['connection.restored'] || 'Internet connection restored') 
          : (dictionary?.['connection.lost'] || 'No internet connection')}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'red',
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ConnectionStatusBar;
