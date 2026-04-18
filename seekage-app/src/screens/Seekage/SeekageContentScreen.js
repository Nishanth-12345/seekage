import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, Modal, TextInput, Alert,
} from 'react-native';
import { useAuth, T } from '../../utils/AuthContext';
import { fetchContent, toggleHide, verifyParentPassword } from '../../utils/api';

const NAVY = '#1E3A5F';

const MOCK_CONTENT = [
  { content_id: 1, content_type: 'video',    subject_name: 'Maths',   file_url: 'https://example.com/v1.mp4', is_hidden_by_parent: false, title: 'Chapter 1 - Numbers' },
  { content_id: 2, content_type: 'document', subject_name: 'Science', file_url: 'https://example.com/d1.pdf', is_hidden_by_parent: false, title: 'Photosynthesis Notes' },
  { content_id: 3, content_type: 'video',    subject_name: 'English', file_url: 'https://example.com/v2.mp4', is_hidden_by_parent: true,  title: 'Grammar Lesson 2' },
  { content_id: 4, content_type: 'note',     subject_name: 'Maths',   file_url: 'https://example.com/n1.pdf', is_hidden_by_parent: false, title: 'Algebra Notes' },
];

export default function SeekageContentScreen({ route, navigation }) {
  const { user, lang } = useAuth();
  const t = T[lang];
  const { group } = route.params || {};

  const [content,  setContent]  = useState(MOCK_CONTENT);
  const [showParentModal, setShowParentModal] = useState(false);
  const [parentPass, setParentPass] = useState('');
  const [targetItem, setTargetItem] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'video' | 'document' | 'note'

  const isParent  = user?.role === 'parent';
  const canUpload = ['admin', 'teacher'].includes(user?.role);

  const filtered = activeTab === 'all'
    ? content
    : content.filter(c => c.content_type === activeTab);

  // Parents only see non-hidden; students see non-hidden too
  const visible = (isParent || user?.role === 'student')
    ? filtered.filter(c => !c.is_hidden_by_parent)
    : filtered;

  function askParentHide(item) {
    setTargetItem(item);
    setParentPass('');
    setShowParentModal(true);
  }

  async function confirmHide() {
    try {
      // Verify parent password with backend
      // await verifyParentPassword(user.id, parentPass);
      // Mock: accept any non-empty password
      if (!parentPass) { Alert.alert('Error', 'Enter password'); return; }
      const newHidden = !targetItem.is_hidden_by_parent;
      setContent(prev => prev.map(c =>
        c.content_id === targetItem.content_id ? { ...c, is_hidden_by_parent: newHidden } : c
      ));
      // await toggleHide(targetItem.content_id, newHidden, user.token);
      setShowParentModal(false);
    } catch (e) {
      Alert.alert('Error', 'Incorrect password');
    }
  }

  const TABS = ['all', 'video', 'document', 'note'];

  function renderItem({ item }) {
    const icon = item.content_type === 'video' ? '🎬' : item.content_type === 'document' ? '📄' : '📝';
    return (
      <View style={s.card}>
        <View style={s.cardLeft}>
          <Text style={{ fontSize: 22 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{item.title}</Text>
          <Text style={s.cardSub}>{item.subject_name} · {item.content_type}</Text>
          {item.is_hidden_by_parent && (
            <Text style={s.hiddenLabel}>🔒 Hidden by parent</Text>
          )}
        </View>
        {/* Parent hide/unhide button */}
        {isParent && (
          <TouchableOpacity style={s.hideBtn} onPress={() => askParentHide(item)}>
            <Text style={s.hideBtnText}>{item.is_hidden_by_parent ? '👁 Show' : '🚫 Hide'}</Text>
          </TouchableOpacity>
        )}
        {/* Admin can also hide */}
        {user?.role === 'admin' && (
          <TouchableOpacity style={[s.hideBtn, { backgroundColor: '#FFF3E0' }]}
            onPress={() => askParentHide(item)}>
            <Text style={[s.hideBtnText, { color: '#E65100' }]}>
              {item.is_hidden_by_parent ? 'Unhide' : 'Hide'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Group info */}
      <View style={s.groupBar}>
        <Text style={s.groupName}>{group?.group_name || 'Seekage Content'}</Text>
        {canUpload && (
          <TouchableOpacity onPress={() => navigation.navigate('Upload', { group })}
            style={s.uploadBtn}>
            <Text style={s.uploadBtnText}>+ {t.upload}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sub-nav: all / videos / docs / notes */}
      <View style={s.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}
            style={[s.tab, activeTab === tab && s.tabActive]}>
            <Text style={[s.tabText, activeTab === tab && s.tabActiveText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={visible}
        keyExtractor={i => String(i.content_id)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={s.empty}>No content found.</Text>}
      />

      {/* Bottom nav to Q&A and Chat */}
      <View style={s.bottomNav}>
        <TouchableOpacity style={s.navBtn}
          onPress={() => navigation.navigate('QA', { group })}>
          <Text style={s.navBtnText}>💬 {t.qa}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navBtn}
          onPress={() => navigation.navigate('Chat', { group })}>
          <Text style={s.navBtnText}>🗨 {t.chat}</Text>
        </TouchableOpacity>
      </View>

      {/* Parent password modal */}
      <Modal visible={showParentModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>
              {targetItem?.is_hidden_by_parent ? 'Unhide Content' : 'Hide Content'}
            </Text>
            <Text style={s.modalSub}>Enter your parent password to confirm.</Text>
            <TextInput
              style={s.modalInput}
              value={parentPass}
              onChangeText={setParentPass}
              placeholder="Parent password"
              secureTextEntry
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setShowParentModal(false)}>
                <Text style={{ color: '#555' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalConfirm} onPress={confirmHide}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#F4F7FB' },
  groupBar:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#e0e0e0' },
  groupName:     { fontSize: 15, fontWeight: '600', color: NAVY },
  uploadBtn:     { backgroundColor: NAVY, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  uploadBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  tabRow:        { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#e0e0e0' },
  tab:           { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:     { borderBottomColor: NAVY },
  tabText:       { fontSize: 12, color: '#888' },
  tabActiveText: { color: NAVY, fontWeight: '600' },
  card:          { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 0.5, borderColor: '#e0e0e0' },
  cardLeft:      { width: 40, alignItems: 'center' },
  cardTitle:     { fontSize: 14, fontWeight: '600', color: '#222' },
  cardSub:       { fontSize: 12, color: '#888', marginTop: 2 },
  hiddenLabel:   { fontSize: 11, color: '#E65100', marginTop: 3 },
  hideBtn:       { backgroundColor: '#EEF3FA', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  hideBtnText:   { fontSize: 11, color: NAVY, fontWeight: '600' },
  empty:         { textAlign: 'center', color: '#aaa', marginTop: 40 },
  bottomNav:     { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#e0e0e0' },
  navBtn:        { flex: 1, alignItems: 'center', paddingVertical: 12 },
  navBtnText:    { fontSize: 14, color: NAVY, fontWeight: '500' },
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modalBox:      { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '82%' },
  modalTitle:    { fontSize: 16, fontWeight: '700', color: NAVY, marginBottom: 6 },
  modalSub:      { fontSize: 13, color: '#666', marginBottom: 14 },
  modalInput:    { borderWidth: 0.5, borderColor: '#ccc', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, backgroundColor: '#f9f9f9', marginBottom: 16 },
  modalBtns:     { flexDirection: 'row', gap: 10 },
  modalCancel:   { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 10, borderWidth: 0.5, borderColor: '#ccc' },
  modalConfirm:  { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 10, backgroundColor: NAVY },
});
