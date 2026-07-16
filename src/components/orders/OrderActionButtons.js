import React from 'react';
import { StyleSheet, View, TouchableOpacity, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export function useOrderActionSizes() {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 400;
  return {
    buttonSize: isSmallScreen ? 36 : 40,
    iconSize: isSmallScreen ? 18 : 20,
    buttonGap: isSmallScreen ? 6 : 8,
  };
}

export function OrderActionIcon({
  variant = 'accept',
  icon,
  onPress,
  disabled = false,
}) {
  const { buttonSize, iconSize } = useOrderActionSizes();
  const variantStyle = orderActionStyles[variant] || orderActionStyles.accept;

  return (
    <TouchableOpacity
      style={[
        variantStyle,
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
        },
        disabled && orderActionStyles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <MaterialCommunityIcons name={icon} size={iconSize} color="white" />
    </TouchableOpacity>
  );
}

export function OrderActionRow({ children, style }) {
  const { buttonGap } = useOrderActionSizes();
  return (
    <View style={[orderActionStyles.row, { gap: buttonGap }, style]}>
      {children}
    </View>
  );
}

export const orderActionStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-end',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: 8,
    width: '100%',
  },
  accept: {
    borderWidth: 1,
    borderColor: '#2fa360',
    backgroundColor: '#2fa360',
    justifyContent: 'center',
    alignItems: 'center',
  },
  edit: {
    borderWidth: 1,
    borderColor: '#3490dc',
    backgroundColor: '#3490dc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  schedule: {
    borderWidth: 1,
    borderColor: '#6f42c1',
    backgroundColor: '#6f42c1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  delay: {
    borderWidth: 1,
    borderColor: '#f0ad4e',
    backgroundColor: '#f0ad4e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reject: {
    borderWidth: 1,
    borderColor: '#f14c4c',
    backgroundColor: '#f14c4c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
