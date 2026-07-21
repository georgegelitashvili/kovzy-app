import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';

// Sample dataset
const SAMPLE_DATA = Array.from({ length: 50 }, (_, index) => ({
  id: `item-${index + 1}`,
  title: `Item ${index + 1}`,
}));

const ResponsiveFlatList = () => {
  const { width } = useWindowDimensions();
  const [numColumns, setNumColumns] = useState(2);

  // Calculate number of columns based on screen width
  const calculateColumns = useCallback((screenWidth) => {
    if (screenWidth < 600) {
      return 2; // Portrait phone
    } else if (screenWidth < 900) {
      return 3; // Landscape phone or small tablet
    } else {
      return 4; // Large tablet or desktop
    }
  }, []);

  // Update columns when screen width changes
  useEffect(() => {
    const newColumns = calculateColumns(width);
    setNumColumns(newColumns);
  }, [width, calculateColumns]);

  // Render item component
  const renderItem = useCallback(({ item }) => {
    return (
      <View style={[styles.item, { width: width / numColumns - 20 }]}>
        <Text style={styles.itemText}>{item.title}</Text>
      </View>
    );
  }, [width, numColumns]);

  // Key extractor using id field
  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        Responsive Grid (Columns: {numColumns})
      </Text>
      <FlatList
        key={numColumns} // Force re-render when numColumns changes
        data={SAMPLE_DATA}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  listContainer: {
    padding: 10,
  },
  item: {
    backgroundColor: '#fff',
    margin: 5,
    padding: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});

export default ResponsiveFlatList;
