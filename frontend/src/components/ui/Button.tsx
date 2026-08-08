import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({ title, onPress, variant = 'primary', size = 'md', loading, disabled, icon, style }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles[`${variant}Variant`],
        styles[`${size}Size`],
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? '#6366f1' : '#fafafa'} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    gap: 8,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  primaryVariant: {
    backgroundColor: '#6366f1',
  },
  secondaryVariant: {
    backgroundColor: '#27272a',
  },
  ghostVariant: {
    backgroundColor: 'transparent',
  },
  dangerVariant: {
    backgroundColor: '#ef4444',
  },
  smSize: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  mdSize: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  lgSize: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  text: {
    fontWeight: '600',
    fontSize: 16,
  },
  primaryText: {
    color: '#fafafa',
  },
  secondaryText: {
    color: '#fafafa',
  },
  ghostText: {
    color: '#6366f1',
  },
  dangerText: {
    color: '#fafafa',
  },
});
