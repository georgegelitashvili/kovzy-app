import React from 'react'
import { TouchableOpacity, Image, StyleSheet } from 'react-native'
import { StatusBar } from 'expo-status-bar'

export default function BackButton({ goBack }) {
  return (
    <TouchableOpacity onPress={goBack} style={styles.container}>
      <Image
        style={styles.image}
        source={require('../../assets/arrow_back.png')}
      />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10 + StatusBar.currentHeight, // Use StatusBar.currentHeight
    left: 4,
  },
  image: {
    width: 24,
    height: 24,
  },
})
