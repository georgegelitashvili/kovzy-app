import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import ResponsiveFlatList from './ResponsiveFlatList';
import AdvancedResponsiveFlatList from './AdvancedResponsiveFlatList';

const FlatListDemo = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Responsive FlatList</Text>
          <Text style={styles.sectionDescription}>
            Simple implementation that adjusts columns based on screen width
          </Text>
          <View style={styles.componentContainer}>
            <ResponsiveFlatList />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced Responsive FlatList</Text>
          <Text style={styles.sectionDescription}>
            Enhanced version with pull-to-refresh, infinite scroll, and orientation detection
          </Text>
          <View style={styles.componentContainer}>
            <AdvancedResponsiveFlatList />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 20,
    paddingBottom: 16,
    lineHeight: 20,
  },
  componentContainer: {
    height: 400,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
});

export default FlatListDemo;
