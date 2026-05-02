import { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import client from '../api/client';

const STATUS_OPTIONS = ['To Do', 'In Progress', 'Done'];
const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'];
const ATTACHMENT_BASE_URL = 'https://taskflow-iult.onrender.com';

export default function TaskDetailScreen({ route, navigation }) {
  const { taskId } = route.params;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('To Do');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get(`/api/tasks/${taskId}`);
        setTitle(data.title || '');
        setDescription(data.description || '');
        setStatus(data.status || 'To Do');
        setPriority(data.priority || 'Medium');
        setDueDate(data.dueDate ? new Date(data.dueDate) : null);
        setAttachments(data.attachments || []);
      } catch (error) {
        Alert.alert(
          'Failed to load task',
          error.response?.data?.message || 'Please try again.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [taskId, navigation]);

  const onChangeDate = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (event.type === 'dismissed') return;
    if (selectedDate) setDueDate(selectedDate);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Title cannot be empty');
      return;
    }
    setSaving(true);
    try {
      await client.put(`/api/tasks/${taskId}`, {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        dueDate: dueDate ? dueDate.toISOString() : null,
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        'Failed to save',
        error.response?.data?.message || 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete task', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await client.delete(`/api/tasks/${taskId}`);
            navigation.goBack();
          } catch (error) {
            Alert.alert(
              'Failed to delete',
              error.response?.data?.message || 'Please try again.'
            );
            setDeleting(false);
          }
        },
      },
    ]);
  };

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Edit Task' });
  }, [navigation]);

  const formatDate = (d) =>
    d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const busy = saving || deleting;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          editable={!busy}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          editable={!busy}
        />

        <Text style={styles.label}>Status</Text>
        <View style={styles.pillRow}>
          {STATUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.pill, status === opt && styles.pillSelected]}
              onPress={() => setStatus(opt)}
              disabled={busy}
            >
              <Text
                style={[
                  styles.pillText,
                  status === opt && styles.pillTextSelected,
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Priority</Text>
        <View style={styles.pillRow}>
          {PRIORITY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.pill, priority === opt && styles.pillSelected]}
              onPress={() => setPriority(opt)}
              disabled={busy}
            >
              <Text
                style={[
                  styles.pillText,
                  priority === opt && styles.pillTextSelected,
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Due date</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowPicker(true)}
          disabled={busy}
        >
          <Text style={[styles.dateText, !dueDate && styles.datePlaceholder]}>
            {dueDate ? formatDate(dueDate) : 'Select due date (optional)'}
          </Text>
          {dueDate && (
            <TouchableOpacity onPress={() => setDueDate(null)} hitSlop={8}>
              <Text style={styles.clearDate}>Clear</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={dueDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChangeDate}
          />
        )}

        {Platform.OS === 'ios' && showPicker && (
          <TouchableOpacity
            style={styles.iosDoneButton}
            onPress={() => setShowPicker(false)}
          >
            <Text style={styles.iosDoneText}>Done</Text>
          </TouchableOpacity>
        )}

        {attachments.length > 0 && (
          <>
            <Text style={styles.label}>Attachments ({attachments.length})</Text>
            <View style={styles.attachmentList}>
              {attachments.map((att, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.attachmentItem}
                  onPress={() => Linking.openURL(`${ATTACHMENT_BASE_URL}${att.url}`)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.attachmentName} numberOfLines={1}>
                      {att.filename}
                    </Text>
                    <Text style={styles.attachmentSize}>
                      {formatBytes(att.size)}
                    </Text>
                  </View>
                  <Text style={styles.attachmentOpen}>Open</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.saveButton, busy && styles.disabled]}
          onPress={handleSave}
          disabled={busy}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, busy && styles.disabled]}
          onPress={handleDelete}
          disabled={busy}
        >
          {deleting ? (
            <ActivityIndicator color="#ef4444" />
          ) : (
            <Text style={styles.deleteButtonText}>Delete Task</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  content: { padding: 20, paddingBottom: 40 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  multiline: { minHeight: 100 },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  pill: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  pillSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  pillText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  pillTextSelected: { color: '#fff' },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dateText: { fontSize: 16, color: '#111827' },
  datePlaceholder: { color: '#9ca3af' },
  clearDate: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
  iosDoneButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 4,
  },
  iosDoneText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  attachmentList: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  attachmentName: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  attachmentSize: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  attachmentOpen: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: { opacity: 0.6 },
});
