import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth, T } from '../../utils/AuthContext';
import { uploadContent } from '../../utils/api';

const NAVY = '#1E3A5F';
const TYPES = ['video', 'document', 'note', 'assignment'];

export default function UploadScreen({ route, navigation }) {
  const { user, lang } = useAuth();
  const t = T[lang];
  const { group } = route.params || {};

  const [contentType, setContentType] = useState('video');
  const [subject,     setSubject]     = useState('');
  const [title,       setTitle]       = useState('');
  const [pickedFile,  setPickedFile]  = useState(null);
  const [loading,     setLoading]     = useState(false);

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: contentType === 'video' ? 'video/*' : '*/*',
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      setPickedFile(result.assets[0]);
    }
  }

  async function handleUpload() {
    if (!subject || !title) { Alert.alert('Error', 'Fill all fields'); return; }
    if (!pickedFile)        { Alert.alert('Error', 'Select a file'); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri:  pickedFile.uri,
        name: pickedFile.name,
        type: pickedFile.mimeType || 'application/octet-stream',
      });
      formData.append('content_type', contentType);
      formData.append('subject_name', subject);
      formData.append('title',        title);
      formData.append('group_id',     group?.group_id || '');

      await uploadContent(formData, user.token);
      Alert.alert('Success', 'Uploaded successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Upload failed. Check server connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        <Text style={s.section}>Content Type</Text>
        <View style={s.typeRow}>
          {TYPES.map(tp => (
            <TouchableOpacity key={tp} style={[s.typeBtn, contentType === tp && s.typeBtnActive]}
              onPress={() => setContentType(tp)}>
              <Text style={[s.typeBtnText, contentType === tp && s.typeBtnActiveText]}>
                {tp.charAt(0).toUpperCase() + tp.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Subject</Text>
        <TextInput style={s.input} value={subject} onChangeText={setSubject}
          placeholder="e.g. Mathematics" />

        <Text style={s.label}>Title</Text>
        <TextInput style={s.input} value={title} onChangeText={setTitle}
          placeholder="e.g. Chapter 3 - Fractions" />

        <Text style={s.label}>File</Text>
        <TouchableOpacity style={s.filePicker} onPress={pickFile}>
          <Text style={s.filePickerText}>
            {pickedFile ? `📎 ${pickedFile.name}` : '📁 Tap to select file'}
          </Text>
        </TouchableOpacity>

        {group && (
          <View style={s.groupInfo}>
            <Text style={s.groupInfoText}>Uploading to: {group.group_name}</Text>
          </View>
        )}

        <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]}
          onPress={handleUpload} disabled={loading}>
          <Text style={s.btnText}>{loading ? 'Uploading…' : `⬆ ${t.upload}`}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: '#fff' },
  scroll:             { padding: 20, paddingBottom: 40 },
  section:            { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  label:              { fontSize: 12, color: '#555', marginBottom: 4, marginTop: 14 },
  input:              { borderWidth: 0.5, borderColor: '#ccc', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, backgroundColor: '#f9f9f9' },
  typeRow:            { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  typeBtn:            { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 0.5, borderColor: '#ccc', backgroundColor: '#f5f5f5' },
  typeBtnActive:      { backgroundColor: NAVY, borderColor: NAVY },
  typeBtnText:        { fontSize: 13, color: '#555' },
  typeBtnActiveText:  { color: '#fff' },
  filePicker:         { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, borderStyle: 'dashed', paddingVertical: 20, alignItems: 'center', backgroundColor: '#fafafa', marginTop: 6 },
  filePickerText:     { fontSize: 14, color: '#555' },
  groupInfo:          { backgroundColor: '#EEF3FA', borderRadius: 8, padding: 10, marginTop: 16, borderLeftWidth: 3, borderLeftColor: NAVY },
  groupInfoText:      { fontSize: 12, color: NAVY },
  btn:                { backgroundColor: NAVY, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  btnText:            { color: '#fff', fontSize: 16, fontWeight: '600' },
});
