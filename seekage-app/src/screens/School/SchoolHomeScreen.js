import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, TextInput, Modal, Alert,
} from 'react-native';
import { useAuth, T } from '../../utils/AuthContext';

const GREEN = '#2E5D3A';

const MOCK_GROUPS = [
  { group_id: 10, group_name: 'Class 8A',  student_count: 38, school_id: 1, teacher: 'Mrs. Priya' },
  { group_id: 11, group_name: 'Class 9B',  student_count: 42, school_id: 1, teacher: 'Mr. Suresh' },
  { group_id: 12, group_name: 'Class 10A', student_count: 45, school_id: 1, teacher: 'Mrs. Anitha' },
];

export default function SchoolHomeScreen({ navigation }) {
  const { user, lang, logout } = useAuth();
  const t = T[lang];
  const [groups, setGroups]   = useState(MOCK_GROUPS);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');

  const isSchoolAdmin = user?.role === 'admin' || user?.role === 'school';

  function addGroup() {
    if (!newName.trim()) { Alert.alert('Error', 'Enter group name'); return; }
    setGroups(prev => [...prev, { group_id: Date.now(), group_name: newName.trim(), student_count: 0, school_id: 1, teacher: user?.name }]);
    setNewName('');
    setShowAdd(false);
  }

  function renderGroup({ item }) {
    return (
      <TouchableOpacity style={s.card}
        onPress={() => navigation.navigate('SchoolGroup', { group: item })}>
        <View style={s.cardIcon}>
          <Text style={{ fontSize: 22 }}>🏫</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{item.group_name}</Text>
          <Text style={s.cardSub}>{item.student_count} students · {item.teacher}</Text>
        </View>
        <Text style={{ color: GREEN, fontSize: 18 }}>›</Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>School Portal</Text>
          <Text style={s.userName}>{user?.name || 'School'}</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{t.logout}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.titleRow}>
        <Text style={s.sectionTitle}>{t.groups}</Text>
        {isSchoolAdmin && (
          <TouchableOpacity onPress={() => setShowAdd(true)} style={s.addBtn}>
            <Text style={s.addBtnText}>+ Add Group</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={groups}
        keyExtractor={i => String(i.group_id)}
        renderItem={renderGroup}
        contentContainerStyle={{ padding: 16, paddingTop: 4 }}
      />

      {/* Add group modal */}
      <Modal visible={showAdd} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>New Group</Text>
            <TextInput style={s.input} value={newName} onChangeText={setNewName}
              placeholder="Group name e.g. Class 7A" />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={{ color: '#555' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={addGroup}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#F2F7F4' },
  header:       { backgroundColor: GREEN, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting:     { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  userName:     { color: '#fff', fontSize: 18, fontWeight: '700' },
  titleRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
  addBtn:       { backgroundColor: GREEN, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addBtnText:   { color: '#fff', fontSize: 13, fontWeight: '600' },
  card:         { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 0.5, borderColor: '#dde8df' },
  cardIcon:     { width: 44, height: 44, borderRadius: 10, backgroundColor: '#E8F4EB', alignItems: 'center', justifyContent: 'center' },
  cardTitle:    { fontSize: 14, fontWeight: '600', color: '#222' },
  cardSub:      { fontSize: 12, color: '#888', marginTop: 2 },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modalBox:     { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '82%' },
  modalTitle:   { fontSize: 16, fontWeight: '700', color: GREEN, marginBottom: 14 },
  input:        { borderWidth: 0.5, borderColor: '#ccc', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, backgroundColor: '#f9f9f9', marginBottom: 16 },
  modalBtns:    { flexDirection: 'row', gap: 10 },
  cancelBtn:    { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 10, borderWidth: 0.5, borderColor: '#ccc' },
  confirmBtn:   { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 10, backgroundColor: GREEN },
});
