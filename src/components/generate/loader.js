import React, { useContext } from 'react';
import { ActivityIndicator, StyleSheet, View, Text } from 'react-native';
import { String, LanguageContext } from "../Language";

export default function Loader(props) {
  const { dictionary } = useContext(LanguageContext);

    return (
      <View style={styles.indicatorWrapper}>
        <ActivityIndicator animating={true} size="large" style={styles.indicator}/>
        <Text style={styles.indicatorText}>{dictionary['loading']}</Text>
      </View>
    );
  }

const styles = StyleSheet.create({
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