import React, { useContext } from 'react';
import { ActivityIndicator, StyleSheet, View, Text, Dimensions } from 'react-native';
import { String, LanguageContext } from "../Language";
import Toast from './Toast';

const WIDTH = Dimensions.get("screen").width;

export default function Loader(props) {
  const { dictionary } = useContext(LanguageContext);

  return (
    <>
      <View style={styles.indicatorWrapper}>
        <ActivityIndicator animating={true} size="large" style={styles.indicator} />
        <Text style={styles.indicatorText}>{dictionary['loading']}</Text>
      </View>

      {props.error ? (
        <Toast
          type="failed"
          title="Error"
          subtitle={props.error}
          animate={true}
          addStyles={{ top: WIDTH, }}
        />
        ) : null}
      </>
    );
  }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative"
  },
  indicatorWrapper: {
    width: 200,
    height: 200,
    borderRadius: 13,
    position: 'absolute',
    top: '50%',
    marginTop: '-25%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(100, 100, 100, 0.9)',
    zIndex: 3,
    elevation: 3
  },
  indicatorText: {
    fontSize: 18,
    marginTop: 12,
    color: '#fff'
  },
});