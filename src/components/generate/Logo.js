import React from 'react'
import { Image, StyleSheet } from 'react-native'

export default function Logo() {
  return <Image source={require('../../assets/kovzy-01.png')} style={styles.image} />
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 150,
    marginBottom: 8,
  },
})
