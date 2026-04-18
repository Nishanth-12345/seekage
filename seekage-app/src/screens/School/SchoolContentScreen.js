// ─── SchoolContentScreen.js ────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useAuth, T } from '../../utils/AuthContext';

const GREEN = '#2E5D3A';

const MOCK_CONTENT = [
  { id: 1, type: 'video',    title: 'Introduction to Algebra',  subject: 'Mathematics', hidden: false },
  { id: 2, type: 'document', title: 'Chapter 3 Notes',          subject: 'Mathematics', hidden: false },
  { id: 3, type: 'video',    title: 'Cell Structure',            subject: 'Science',     hidden: true },
  { id: 4, type: 'note',     title: 'Grammar Rules Summary',    subject: 'English',     hidden: false },
];

export function SchoolContentScreen({ route, navigation }) {
  const { user, lang } = useAuth();
  const t = T[lang];
  const { group, subject } = route.params || {};
  const [content, setContent] = useState(
    subject ? MOCK_CONTENT.filter(c => c.subject === subject.name) : MOCK_CONTENT
  );
  const canManage = ['admin', 'teacher', 'school'].includes(user?.role);

  function toggleHide(id) {
    setContent(prev => prev.map(c => c.id === id ? { ...c, hidden: !c.hidden } : c));
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.subHeader}>
        <Text style={s.subHeaderText}>{subject?.name || 'All Content'} · {group?.group_name}</Text>
        {canManage && (
          <TouchableOpacity onPress={() => navigation.navigate('SchoolUpload', { group, subject })}
            style={s.upBtn}>
            <Text style={s.upBtnText}>+ {t.upload}</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={content}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const icon = item.type === 'video' ? '🎬' : item.type === 'document' ? '📄' : '📝';
          return (
            <View style={s.card}>
              <Text style={{ fontSize: 22, marginRight: 10 }}>{icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{item.title}</Text>
                <Text style={s.cardSub}>{item.subject} · {item.type}</Text>
                {item.hidden && <Text style={s.hiddenTag}>🔒 Hidden</Text>}
              </View>
              {canManage && (
                <TouchableOpacity style={s.hideBtn} onPress={() => toggleHide(item.id)}>
                  <Text style={s.hideBtnText}>{item.hidden ? 'Show' : 'Hide'}</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

// ─── SchoolUploadScreen.js ─────────────────────────────────────────────────
import * as DocumentPicker from 'expo-document-picker';

export function SchoolUploadScreen({ route, navigation }) {
  const { user, lang } = useAuth();
  const t = T[lang];
  const { group, subject: preSubject } = route.params || {};
  const [subject,     setSubject]     = React.useState(preSubject?.name || '');
  const [title,       setTitle]       = React.useState('');
  const [contentType, setContentType] = React.useState('video');
  const [pickedFile,  setPickedFile]  = React.useState(null);

  async function pickFile() {
    const r = await DocumentPicker.getDocumentAsync({ type: contentType === 'video' ? 'video/*' : '*/*', copyToCacheDirectory: true });
    if (!r.canceled && r.assets?.[0]) setPickedFile(r.assets[0]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ padding: 20 }}>
        <Text style={[s.label, { marginTop: 0 }]}>Group</Text>
        <View style={s.infoBox}><Text style={s.infoText}>{group?.group_name}</Text></View>

        <Text style={s.label}>Content Type</Text>
        <View style={s.typeRow}>
          {['video','document','note','assignment'].map(tp => (
            <TouchableOpacity key={tp} onPress={() => setContentType(tp)}
              style={[s.typeBtn, contentType === tp && s.typeBtnActive]}>
              <Text style={[s.typeTxt, contentType === tp && { color: '#fff' }]}>
                {tp.charAt(0).toUpperCase()+tp.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Subject</Text>
        <View style={s.input2}><Text>{subject || 'Not set'}</Text></View>

        <Text style={s.label}>Title</Text>
        <View style={[s.input2, { height: 42 }]}>
          <Text style={{ color: title ? '#222' : '#aaa' }}>{title || 'Enter title…'}</Text>
        </View>

        <TouchableOpacity style={s.filePicker} onPress={pickFile}>
          <Text style={{ color: '#555' }}>{pickedFile ? `📎 ${pickedFile.name}` : '📁 Select file'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.uploadBtn} onPress={() => navigation.goBack()}>
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>⬆ {t.upload}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── SchoolQAScreen.js ─────────────────────────────────────────────────────
export function SchoolQAScreen({ route }) {
  const { user, lang } = useAuth();
  const t = T[lang];
  const [qaList, setQaList] = React.useState([
    { id: 1, q: 'What is Newton\'s 2nd law?', by: 'Student', answers: [{ a: 'F=ma', by: 'Teacher' }] },
    { id: 2, q: 'Explain photosynthesis.', by: 'Riya', answers: [] },
  ]);
  const [question, setQuestion] = React.useState('');
  const [replyMap, setReplyMap] = React.useState({});
  const canAnswer = ['admin', 'teacher', 'school'].includes(user?.role);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F7F4' }}>
      <FlatList
        data={qaList} keyExtractor={i => String(i.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={s.qaCard}>
            <Text style={s.qText}>Q: {item.q}</Text>
            <Text style={s.qBy}>— {item.by}</Text>
            {item.answers.map((a, i) => (
              <View key={i} style={s.ansBox}>
                <Text style={{ fontSize: 13, color: '#333' }}>A: {a.a}</Text>
                <Text style={{ fontSize: 11, color: '#888' }}>— {a.by}</Text>
              </View>
            ))}
            {canAnswer && (
              <View style={s.replyRow}>
                <View style={[s.input2, { flex: 1, height: 38 }]} />
                <TouchableOpacity style={s.replyBtn}><Text style={{ color: '#fff' }}>{t.send}</Text></TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
      <View style={s.askBar}>
        <View style={[s.input2, { flex: 1 }]} />
        <TouchableOpacity style={[s.replyBtn, { backgroundColor: GREEN }]}>
          <Text style={{ color: '#fff' }}>{t.send}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── SchoolChatScreen.js ───────────────────────────────────────────────────
export function SchoolChatScreen({ route }) {
  const { user, lang } = useAuth();
  const t = T[lang];
  const [msgs, setMsgs] = React.useState([
    { id: 1, text: 'Welcome to Class 8A chat!', from: 'Teacher', mine: false },
    { id: 2, text: 'Thank you sir!',             from: 'Student', mine: true },
  ]);
  const [text, setText] = React.useState('');

  function send() {
    if (!text.trim()) return;
    setMsgs(p => [...p, { id: Date.now(), text: text.trim(), from: user?.name || 'You', mine: true }]);
    setText('');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#EFF7F1' }}>
      <FlatList
        data={msgs} keyExtractor={i => String(i.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={{ alignItems: item.mine ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
            {!item.mine && <Text style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{item.from}</Text>}
            <View style={{ backgroundColor: item.mine ? GREEN : '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9, maxWidth: '78%', borderWidth: item.mine ? 0 : 0.5, borderColor: '#dde8df' }}>
              <Text style={{ color: item.mine ? '#fff' : '#333', fontSize: 14 }}>{item.text}</Text>
            </View>
          </View>
        )}
      />
      <View style={s.askBar}>
        <View style={{ flex: 1, borderWidth: 0.5, borderColor: '#ccc', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff' }}>
          <Text style={{ color: text ? '#222' : '#aaa' }}>{text || t.typeMessage}</Text>
        </View>
        <TouchableOpacity style={[s.replyBtn, { backgroundColor: GREEN, width: 44, height: 44, borderRadius: 22 }]} onPress={send}>
          <Text style={{ color: '#fff' }}>➤</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#F2F7F4' },
  subHeader:  { backgroundColor: '#fff', padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#dde8df' },
  subHeaderText: { fontSize: 14, fontWeight: '600', color: GREEN },
  upBtn:      { backgroundColor: GREEN, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  upBtnText:  { color: '#fff', fontSize: 12, fontWeight: '600' },
  card:       { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 0.5, borderColor: '#dde8df' },
  cardTitle:  { fontSize: 14, fontWeight: '600', color: '#222' },
  cardSub:    { fontSize: 12, color: '#888', marginTop: 2 },
  hiddenTag:  { fontSize: 11, color: '#E65100', marginTop: 3 },
  hideBtn:    { backgroundColor: '#E8F4EB', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  hideBtnText:{ fontSize: 11, color: GREEN, fontWeight: '600' },
  label:      { fontSize: 12, color: '#555', marginBottom: 4, marginTop: 14 },
  infoBox:    { backgroundColor: '#E8F4EB', borderRadius: 10, padding: 10 },
  infoText:   { fontSize: 14, color: GREEN, fontWeight: '600' },
  typeRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn:    { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 0.5, borderColor: '#ccc', backgroundColor: '#f5f5f5' },
  typeBtnActive: { backgroundColor: GREEN, borderColor: GREEN },
  typeTxt:    { fontSize: 12, color: '#555' },
  input2:     { borderWidth: 0.5, borderColor: '#ccc', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#f9f9f9', justifyContent: 'center' },
  filePicker: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#ccc', borderRadius: 10, paddingVertical: 20, alignItems: 'center', marginTop: 14, backgroundColor: '#fafafa' },
  uploadBtn:  { backgroundColor: GREEN, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  qaCard:     { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: '#dde8df' },
  qText:      { fontSize: 14, fontWeight: '600', color: '#222' },
  qBy:        { fontSize: 11, color: '#aaa', marginBottom: 8 },
  ansBox:     { backgroundColor: '#E8F4EB', borderRadius: 8, padding: 10, marginBottom: 6, borderLeftWidth: 3, borderLeftColor: GREEN },
  replyRow:   { flexDirection: 'row', gap: 8, marginTop: 8 },
  replyBtn:   { backgroundColor: '#2E5D3A', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  askBar:     { flexDirection: 'row', padding: 10, backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#dde8df', gap: 8, alignItems: 'center' },
});
