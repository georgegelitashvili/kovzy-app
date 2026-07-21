import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  useWindowDimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';

// Sample dataset with more fields
const generateSampleData = (count = 100) =>
  Array.from({ length: count }, (_, index) => ({
    id: `item-${index + 1}`,
    title: `Item ${index + 1}`,
    subtitle: `Subtitle for item ${index + 1}`,
    color: `hsl(${(index * 137.5) % 360}, 70%, 80%)`,
  }));

const AdvancedResponsiveFlatList = () => {
  const { width, height } = useWindowDimensions();
  const [data, setData] = useState(() => generateSampleData());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Calculate number of columns based on screen dimensions
  const numColumns = useMemo(() => {
    const isLandscape = width > height;
    
    if (width < 600) {
      return isLandscape ? 3 : 2; // Phone
    } else if (width < 900) {
      return isLandscape ? 4 : 3; // Small tablet
    } else if (width < 1200) {
      return isLandscape ? 5 : 4; // Large tablet
    } else {
      return isLandscape ? 6 : 5; // Desktop
    }
  }, [width, height]);

  // Calculate item width
  const itemWidth = useMemo(() => {
    const totalMargin = 20; // 10px margin on each side
    const spacing = (numColumns - 1) * 10; // 10px between items
    return (width - totalMargin - spacing) / numColumns;
  }, [width, numColumns]);

  // Render item component
  const renderItem = useCallback(({ item, index }) => {
    return (
      <View 
        style={[
          styles.item, 
          { 
            width: itemWidth,
            backgroundColor: item.color,
          }
        ]}
      >
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
      </View>
    );
  }, [itemWidth]);

  // Key extractor
  const keyExtractor = useCallback((item) => item.id, []);

  // Get item layout for performance optimization
  const getItemLayout = useCallback((data, index) => {
    const itemHeight = 100;
    const margin = 10;
    const row = Math.floor(index / numColumns);
    
    return {
      length: itemHeight,
      offset: (itemHeight + margin) * row,
      index,
    };
  }, [numColumns]);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setData(generateSampleData());
    setRefreshing(false);
  }, []);

  // Load more data handler
  const onEndReached = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    // Simulate loading more data
    await new Promise(resolve => setTimeout(resolve, 500));
    setData(prevData => [
      ...prevData,
      ...generateSampleData(20).map((item, index) => ({
        ...item,
        id: `${item.id}-extra-${index}`,
      }))
    ]);
    setLoading(false);
  }, [loading]);

  // Footer component for loading indicator
  const renderFooter = useCallback(() => {
    if (!loading) return null;
    
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  }, [loading]);

  // Empty component
  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No items found</Text>
    </View>
  ), []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Advanced Responsive Grid
        </Text>
        <Text style={styles.headerSubtitle}>
          {numColumns} columns • {data.length} items
        </Text>
        <Text style={styles.orientationInfo}>
          {width > height ? 'Landscape' : 'Portrait'} • {width.toFixed(0)}×{height.toFixed(0)}
        </Text>
      </View>
      
      <FlatList
        key={`flatlist-${numColumns}`} // Critical: Force re-render when columns change
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={20}
        // Performance optimization: only use getItemLayout if items have consistent height
        // getItemLayout={getItemLayout}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 4,
  },
  orientationInfo: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 2,
  },
  listContainer: {
    padding: 10,
  },
  item: {
    margin: 5,
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    textAlign: 'center',
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#495057',
    textAlign: 'center',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6c757d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
  },
});

export default AdvancedResponsiveFlatList;
