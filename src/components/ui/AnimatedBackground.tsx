import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function AnimatedBackground() {
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.bg]} />;
}

const styles = StyleSheet.create({
  bg: { backgroundColor: '#000000' },
});
