import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function UserScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>User Profile Screen</Text>
    </View>
  );
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#09090b', justifyContent: 'center', alignItems: 'center' }, text: { color: '#fafafa' } });
