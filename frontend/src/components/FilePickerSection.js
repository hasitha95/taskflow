import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

const MAX_FILES = 5;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilePickerSection({ files, onChange, disabled, label = 'Attachments' }) {
  const pickFiles = async () => {
    const remaining = MAX_FILES - files.length;
    if (remaining <= 0) {
      Alert.alert('Limit reached', `Maximum ${MAX_FILES} files per task`);
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const picked = result.assets || [];
      const valid = [];
      const rejected = [];

      for (const asset of picked) {
        if (asset.size && asset.size > MAX_SIZE_BYTES) {
          rejected.push(`${asset.name} (over 5MB)`);
          continue;
        }
        if (asset.mimeType && !ALLOWED_MIME.includes(asset.mimeType)) {
          rejected.push(`${asset.name} (unsupported type)`);
          continue;
        }
        valid.push({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
        });
      }

      const trimmed = valid.slice(0, remaining);
      const overflow = valid.length - trimmed.length;

      onChange([...files, ...trimmed]);

      if (rejected.length > 0 || overflow > 0) {
        const messages = [];
        if (rejected.length > 0) messages.push(`Skipped:\n• ${rejected.join('\n• ')}`);
        if (overflow > 0) messages.push(`${overflow} file(s) ignored — limit is ${MAX_FILES}`);
        Alert.alert('Some files were skipped', messages.join('\n\n'));
      }
    } catch (error) {
      Alert.alert('File picker error', error.message || 'Could not open file picker');
    }
  };

  const removeFile = (index) => {
    const next = [...files];
    next.splice(index, 1);
    onChange(next);
  };

  return (
    <View>
      <Text style={styles.label}>
        {label} ({files.length}/{MAX_FILES})
      </Text>

      <TouchableOpacity
        style={[styles.pickButton, disabled && styles.disabled]}
        onPress={pickFiles}
        disabled={disabled || files.length >= MAX_FILES}
      >
        <Text style={styles.pickButtonText}>+ Add files (images / PDF)</Text>
      </TouchableOpacity>

      {files.length > 0 && (
        <View style={styles.fileList}>
          {files.map((file, idx) => (
            <View key={`${file.uri}-${idx}`} style={styles.fileRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.name}
                </Text>
                <Text style={styles.fileSize}>{formatBytes(file.size)}</Text>
              </View>
              <TouchableOpacity
                onPress={() => removeFile(idx)}
                disabled={disabled}
                hitSlop={10}
              >
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  pickButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#9ca3af',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  pickButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  fileList: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  fileName: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  removeText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
  },
  disabled: {
    opacity: 0.5,
  },
});
