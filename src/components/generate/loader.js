import React, { useContext } from 'react';
import { ActivityIndicator, StyleSheet, View, Text, Dimensions } from 'react-native';
import { LanguageContext } from "../Language";
import Toast from './Toast';

const WIDTH = Dimensions.get("screen").width;

export default function Loader(props) {
  const { dictionary } = useContext(LanguageContext);

  return (
    <>
      <View style={styles.backgroundOverlay} />
      <View style={styles.loaderContainer}>
        <View style={styles.indicatorWrapper}>
          <ActivityIndicator animating={true} size="large" color="#ffffff" />
          <Text style={styles.indicatorText}>{dictionary['loading']}</Text>
        </View>
      </View>

      {props.error ? (
        <Toast
          type="failed"
          title="Error"
          subtitle={props.error}
          animate={true}
          addStyles={{ top: WIDTH }}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject, // Cover the entire screen
    backgroundColor: 'rgba(0, 0, 0, 0.0)', // Semi-transparent background
    zIndex: 10, // Ensure it's below the loader but above other elements
    // Disable interactions with underlying components
    pointerEvents: 'auto',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject, // Cover the entire screen
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
    zIndex: 20, // Ensure it's above the background overlay
  },
  indicatorWrapper: {
    width: 150, // Set the width of the square
    height: 150, // Set the height of the square to be the same as the width
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(100, 100, 100, 0.8)', // Semi-transparent background
    borderRadius: 10, // Optional: Rounded corners
  },
  indicatorText: {
    fontSize: 13,
    marginTop: 12,
    color: '#fff',
  },
});
