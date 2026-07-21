import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export const TabBarItem = ({ label, onPress, active, ...props }) => {
  return (
    <TouchableOpacity 
      style={[styles.tab, active && styles.activeTab]} 
      onPress={onPress}
      testID={`tab-${label}`}
    >
      <Text style={[styles.label, active && styles.activeLabel]}>
        {typeof label === 'string' ? label : String(label)}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  label: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  activeLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
});