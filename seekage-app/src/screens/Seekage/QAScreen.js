import React, { useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth, T } from '../../utils/AuthContext';

const NAVY = '#1E3A5F';

const MOCK_QA = [
  { id: 1, question: 'What is photosynthesis?', askedBy: 'Arjun', answers: [{ text: 'Plants use sunlight to make food.', by: 'Teacher' }] },
  { id: 2, question: 'How do I solve quadratic equations?', askedBy: 'Meera', answers: [] },
];

export default function QAScreen({ route }) {
  const { user, lang } = useAuth();
  const t = T[lang];
  const [qaList,   setQaList]   = useState(MOCK_QA);
  const [question, setQuestion] = useState('');
  const [replyMap, setReplyMap] = useState({});  // { qaId: answerText }
  const canAnswer = ['admin', 'teacher', 'counselor'].includes(user?.role);

  function submitQuestion() {
    if (!question.trim()) return;
    setQaList(prev => [{
      id: Date.now(), question: question.trim(), askedBy: user?.name || 'You', answers: [],
    }, ...prev]);
    setQuestion('');
  }

  function submitAnswer(qaId) {
    const ans = replyMap[qaId];
    if (!ans?.trim()) return;
    setQaList(prev => prev.map(q =>
      q.id === qaId
        ? { ...q, answers: [...q.answers, { text: ans.trim(), by: user?.name || 'Teacher' }] }
        : q
    ));
    setReplyMap(prev => ({ ...prev, [qaId]: '' }));
  }

  function renderItem({ item }) {
    return (
      <View style={s.card}>
        <Text style={s.q}>Q: {item.question}</Text>
        <Text style={s.askedBy}>— {item.askedBy}</Text>
        {item.answers.map((a, i) => (
          <View key={i} style={s.answerBox}>
            <Text style={s.answerText}>A: {a.text}</Text>
            <Text style={s.answerBy}>— {a.by}</Text>
          </View>
        ))}
        {canAnswer && (
          <View style={s.replyRow}>
            <TextInput
              style={s.replyInput}
              value={replyMap[item.id] || ''}
              onChangeText={v => setReplyMap(prev => ({ ...prev, [item.id]: v }))}
              placeholder={t.answer + '…'}
            />
            <TouchableOpacity style={s.replyBtn} onPress={() => submitAnswer(item.id)}>
              <Text style={{ color: '#fff', fontSize: 13 }}>{t.send}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={qaList}
          keyExtractor={i => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
        {/* Ask question input */}
        <View style={s.askBar}>
          <TextInput
            style={s.askInput}
            value={question}
            onChangeText={setQuestion}
            placeholder={t.typeQuestion}
          />
          <TouchableOpacity style={s.askBtn} onPress={submitQuestion}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>{t.send}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#F4F7FB' },
  card:       { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: '#e0e0e0' },
  q:          { fontSize: 14, fontWeight: '600', color: '#222' },
  askedBy:    { fontSize: 11, color: '#aaa', marginBottom: 8 },
  answerBox:  { backgroundColor: '#EEF3FA', borderRadius: 8, padding: 10, marginBottom: 6, borderLeftWidth: 3, borderLeftColor: NAVY },
  answerText: { fontSize: 13, color: '#333' },
  answerBy:   { fontSize: 11, color: '#888', marginTop: 2 },
  replyRow:   { flexDirection: 'row', gap: 8, marginTop: 8 },
  replyInput: { flex: 1, borderWidth: 0.5, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, fontSize: 13, backgroundColor: '#f9f9f9' },
  replyBtn:   { backgroundColor: NAVY, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, justifyContent: 'center' },
  askBar:     { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#e0e0e0', gap: 8 },
  askInput:   { flex: 1, borderWidth: 0.5, borderColor: '#ccc', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, backgroundColor: '#f9f9f9' },
  askBtn:     { backgroundColor: NAVY, paddingHorizontal: 18, borderRadius: 10, justifyContent: 'center' },
});
