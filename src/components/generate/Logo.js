import React from 'react'
import { Image, StyleSheet } from 'react-native'

export default function Logo() {
  return <Image source={require('../../assets/kovzy-02.png')} style={styles.image} />
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 100,
    marginTop: -60,
    marginBottom: 8,
  },
})
