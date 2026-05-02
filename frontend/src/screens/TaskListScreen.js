import { useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

const STATUS_COLORS = {
  'To Do': { bg: '#e5e7eb', text: '#374151' },
  'In Progress': { bg: '#dbeafe', text: '#1e40af' },
  Done: { bg: '#d1fae5', text: '#065f46' },
};

const PRIORITY_COLORS = {
  High: { bg: '#fee2e2', text: '#991b1b' },
  Medium: { bg: '#fef3c7', text: '#92400e' },
  Low: { bg: '#e0e7ff', text: '#3730a3' },
};

function formatDueDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function TaskListScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await client.get('/api/tasks');
      setTasks(data);
    } catch (error) {
      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove(['token', 'user']);
        navigation.replace('Login');
        return;
      }
      Alert.alert(
        'Failed to load tasks',
        error.response?.data?.message || 'Please check your connection.'
      );
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (active) {
          await fetchTasks();
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [fetchTasks])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['token', 'user']);
          navigation.replace('Login');
        },
      },
    ]);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={handleLogout} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>Logout</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('AddTask')}
          style={styles.headerBtn}
        >
          <Text style={styles.headerPlus}>+</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const renderTask = ({ item }) => {
    const statusStyle = STATUS_COLORS[item.status] || STATUS_COLORS['To Do'];
    const priorityStyle = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.Medium;
    const dueDate = formatDueDate(item.dueDate);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('TaskDetail', { taskId: item._id })}
        activeOpacity={0.7}
      >
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={styles.pillRow}>
          <View style={[styles.pill, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.pillText, { color: statusStyle.text }]}>
              {item.status}
            </Text>
          </View>
          <View style={[styles.pill, { backgroundColor: priorityStyle.bg }]}>
            <Text style={[styles.pillText, { color: priorityStyle.text }]}>
              {item.priority}
            </Text>
          </View>
        </View>

        {dueDate && (
          <Text style={styles.dueDate}>Due {dueDate}</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item._id}
        renderItem={renderTask}
        contentContainerStyle={
          tasks.length === 0 ? styles.emptyContainer : styles.listContent
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap + to add your first one
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 10,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dueDate: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  headerBtnText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '500',
  },
  headerPlus: {
    color: '#2563eb',
    fontSize: 28,
    fontWeight: '300',
    marginTop: -2,
  },
});
