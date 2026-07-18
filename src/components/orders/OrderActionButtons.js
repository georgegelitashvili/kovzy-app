import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function getActionSizes(availableWidth) {
  // Narrow phone / multi-column tablet card
  if (availableWidth < 300) {
    return {
      buttonSize: 34,
      largeButtonSize: 44,
      iconSize: 16,
      largeIconSize: 20,
      buttonGap: 6,
      labelFontSize: 10,
      buttonHeight: 40,
      moreButtonWidth: 40,
      labelPaddingHorizontal: 6,
      acceptFlex: 1.45,
      rejectFlex: 0.9,
      borderRadius: 8,
    };
  }

  // Phone / narrow card
  if (availableWidth < 380) {
    return {
      buttonSize: 36,
      largeButtonSize: 48,
      iconSize: 18,
      largeIconSize: 22,
      buttonGap: 8,
      labelFontSize: 11,
      buttonHeight: 42,
      moreButtonWidth: 42,
      labelPaddingHorizontal: 8,
      acceptFlex: 1.5,
      rejectFlex: 0.9,
      borderRadius: 9,
    };
  }

  // Large phone / tablet portrait card
  if (availableWidth < 520) {
    return {
      buttonSize: 40,
      largeButtonSize: 52,
      iconSize: 20,
      largeIconSize: 24,
      buttonGap: 10,
      labelFontSize: 12,
      buttonHeight: 46,
      moreButtonWidth: 46,
      labelPaddingHorizontal: 10,
      acceptFlex: 1.45,
      rejectFlex: 0.9,
      borderRadius: 10,
    };
  }

  // Wide tablet / desktop card
  return {
    buttonSize: 44,
    largeButtonSize: 56,
    iconSize: 22,
    largeIconSize: 26,
    buttonGap: 12,
    labelFontSize: 13,
    buttonHeight: 50,
    moreButtonWidth: 50,
    labelPaddingHorizontal: 14,
    acceptFlex: 1.4,
    rejectFlex: 0.9,
    borderRadius: 10,
  };
}

export function useOrderActionSizes(availableWidth) {
  const { width: windowWidth } = useWindowDimensions();
  return getActionSizes(availableWidth || windowWidth);
}

export function OrderActionIcon({
  variant = 'accept',
  icon,
  onPress,
  disabled = false,
  size = 'default',
}) {
  const { buttonSize, largeButtonSize, iconSize, largeIconSize } = useOrderActionSizes();
  const variantStyle = orderActionStyles[variant] || orderActionStyles.accept;
  const isLarge = size === 'large';
  const dimension = isLarge ? largeButtonSize : buttonSize;
  const glyphSize = isLarge ? largeIconSize : iconSize;
  const iconColor = variant === 'more' ? '#495057' : 'white';

  return (
    <TouchableOpacity
      style={[
        variantStyle,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
        },
        disabled && orderActionStyles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <MaterialCommunityIcons name={icon} size={glyphSize} color={iconColor} />
    </TouchableOpacity>
  );
}

export function OrderActionLabelButton({
  variant = 'accept',
  icon,
  label,
  onPress,
  disabled = false,
  compact = false,
  sizes,
  style,
}) {
  const fallbackSizes = useOrderActionSizes();
  const {
    iconSize,
    labelFontSize,
    buttonHeight,
    moreButtonWidth,
    labelPaddingHorizontal,
    acceptFlex,
    rejectFlex,
    borderRadius,
  } = sizes || fallbackSizes;

  const variantStyle = orderActionStyles[variant] || orderActionStyles.accept;
  const isMore = variant === 'more';
  const iconColor = isMore ? '#495057' : 'white';
  const textColor = isMore ? '#495057' : 'white';
  const flexValue = compact || isMore
    ? 0
    : variant === 'accept'
      ? acceptFlex
      : rejectFlex;

  return (
    <TouchableOpacity
      style={[
        variantStyle,
        orderActionStyles.labelButton,
        {
          height: buttonHeight,
          borderRadius,
          flex: flexValue,
          flexGrow: compact || isMore ? 0 : flexValue,
          flexShrink: isMore ? 0 : 1,
          width: compact || isMore ? moreButtonWidth : undefined,
          minWidth: isMore ? moreButtonWidth : 0,
          maxWidth: isMore ? moreButtonWidth : undefined,
          paddingHorizontal: isMore ? 0 : labelPaddingHorizontal,
        },
        disabled && orderActionStyles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={iconSize}
          color={iconColor}
          style={label ? orderActionStyles.labelIcon : null}
        />
      ) : null}
      {label ? (
        <Text
          style={[
            orderActionStyles.labelText,
            { fontSize: labelFontSize, color: textColor },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {label}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

export function OrderActionRow({ children, style, onWidthChange }) {
  const [rowWidth, setRowWidth] = useState(0);
  const sizes = useOrderActionSizes(rowWidth);

  return (
    <View
      style={[orderActionStyles.row, { gap: sizes.buttonGap }, style]}
      onLayout={(event) => {
        const nextWidth = Math.round(event.nativeEvent.layout.width);
        if (nextWidth > 0 && nextWidth !== rowWidth) {
          setRowWidth(nextWidth);
          onWidthChange?.(nextWidth);
        }
      }}
    >
      {typeof children === 'function' ? children(sizes) : children}
    </View>
  );
}

export const orderActionStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: 8,
    width: '100%',
  },
  labelButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  labelIcon: {
    marginRight: 6,
  },
  labelText: {
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
  accept: {
    borderWidth: 1,
    borderColor: '#28a745',
    backgroundColor: '#28a745',
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
    borderColor: '#f15b50',
    backgroundColor: '#f15b50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  more: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
