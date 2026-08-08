import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: '#18181b', borderTopColor: '#27272a' },
      tabBarActiveTintColor: '#6366f1',
      tabBarInactiveTintColor: '#71717a',
    }}>
      <Tabs.Screen name="albums" options={{ title: 'Albums', tabBarIcon: ({ color, size }) => <Ionicons name="disc" size={size} color={color} /> }} />
      <Tabs.Screen name="music" options={{ title: 'Music', tabBarIcon: ({ color, size }) => <Ionicons name="musical-notes" size={size} color={color} /> }} />
      <Tabs.Screen name="messages" options={{ title: 'Chat', tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} /> }} />
      <Tabs.Screen name="user" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
    </Tabs>
  );
}
