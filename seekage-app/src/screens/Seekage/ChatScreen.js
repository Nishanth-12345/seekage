import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth, T } from '../../utils/AuthContext';
import { BASE_URL } from '../../utils/api';
// import io from 'socket.io-client';   ← uncomment when backend is ready

const NAVY = '#1E3A5F';

const MOCK_MESSAGES = [
  { id: 1, text: 'Hello everyone!',         senderId: 99, senderName: 'Teacher',      time: '09:01' },
  { id: 2, text: 'Good morning sir!',       senderId: 1,  senderName: 'Arjun',        time: '09:02' },
  { id: 3, text: 'Today we cover Chapter 4', senderId: 99, senderName: 'Teacher',     time: '09:03' },
];

export default function ChatScreen({ route }) {
  const { user, lang } = useAuth();
  const t = T[lang];
  const { group } = route.params || {};

  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [text,     setText]     = useState('');
  const flatRef = useRef(null);

  // ─── Socket.io setup (uncomment when backend is ready) ─────────────────────
  // useEffect(() => {
  //   const socket = io(BASE_URL.replace('/api', ''));
  //   socket.emit('joinGroup', group?.group_id);
  //   socket.on('message', (msg) => setMessages(prev => [...prev, msg]));
  //   return () => socket.disconnect();
  // }, []);

  function sendMessage() {
    if (!text.trim()) return;
    const newMsg = {
      id: Date.now(), text: text.trim(),
      senderId: user?.id, senderName: user?.name || 'You',
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, newMsg]);
    // socket.emit('message', { groupId: group?.group_id, ...newMsg });
    setText('');
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  }

  function renderMessage({ item }) {
    const isMe = item.senderId === user?.id;
    return (
      <View style={[s.msgRow, isMe && s.msgRowMe]}>
        {!isMe && <Text style={s.senderName}>{item.senderName}</Text>}
        <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
          <Text style={[s.bubbleText, isMe && s.bubbleTextMe]}>{item.text}</Text>
          <Text style={[s.timeText, isMe && { color: 'rgba(255,255,255,0.6)' }]}>{item.time}</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={i => String(i.id)}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        />
        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            value={text}
            onChangeText={setText}
            placeholder={t.typeMessage}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity style={s.sendBtn} onPress={sendMessage}>
            <Text style={{ color: '#fff', fontSize: 16 }}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#F0F4FA' },
  msgRow:       { marginBottom: 10, alignItems: 'flex-start' },
  msgRowMe:     { alignItems: 'flex-end' },
  senderName:   { fontSize: 11, color: '#888', marginBottom: 2, marginLeft: 4 },
  bubble:       { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9 },
  bubbleMe:     { backgroundColor: NAVY, borderBottomRightRadius: 4 },
  bubbleThem:   { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 0.5, borderColor: '#e0e0e0' },
  bubbleText:   { fontSize: 14, color: '#333' },
  bubbleTextMe: { color: '#fff' },
  timeText:     { fontSize: 10, color: '#aaa', textAlign: 'right', marginTop: 3 },
  inputBar:     { flexDirection: 'row', padding: 10, backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#e0e0e0', gap: 8 },
  input:        { flex: 1, borderWidth: 0.5, borderColor: '#ccc', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 9, fontSize: 14, backgroundColor: '#f5f5f5' },
  sendBtn:      { width: 44, height: 44, borderRadius: 22, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
});
