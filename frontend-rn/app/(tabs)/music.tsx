import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MusicScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Music Screen</Text>
    </View>
  );
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#09090b', justifyContent: 'center', alignItems: 'center' }, text: { color: '#fafafa' } });
