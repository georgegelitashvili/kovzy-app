import React from 'react'
import { Image, StyleSheet } from 'react-native'

export default function Logo() {
  return <Image source={require('../../assets/kovzy-01.png')} style={styles.image} />
}

const styles = StyleSheet.create({
  image: {
    width: '65%',
    height: 100,
    marginTop: -60,
    marginBottom: 8,
  },
})
