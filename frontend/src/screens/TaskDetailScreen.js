import { View, Text, StyleSheet } from 'react-native';

export default function TaskDetailScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Task Detail — coming next</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 16, color: '#6b7280' },
});
