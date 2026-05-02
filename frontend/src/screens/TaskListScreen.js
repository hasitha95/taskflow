import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TaskListScreen({ navigation }) {
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) navigation.replace('Login');
    })();
  }, [navigation]);

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Task List — coming next</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { fontSize: 16, color: '#6b7280', marginBottom: 24 },
  button: { backgroundColor: '#ef4444', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
