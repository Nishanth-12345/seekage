import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { useAuth, T } from '../../utils/AuthContext';

const GREEN = '#2E5D3A';

const SUBJECTS = [
  { id: 1, name: 'Mathematics', videos: 8, docs: 3 },
  { id: 2, name: 'Science',     videos: 5, docs: 4 },
  { id: 3, name: 'English',     videos: 6, docs: 5 },
  { id: 4, name: 'Social',      videos: 4, docs: 2 },
  { id: 5, name: 'Malayalam',   videos: 3, docs: 3 },
];

export default function SchoolGroupScreen({ route, navigation }) {
  const { user, lang } = useAuth();
  const t = T[lang];
  const { group } = route.params || {};
  const canUpload = ['admin', 'teacher', 'school'].includes(user?.role);

  function renderSubject({ item }) {
    return (
      <TouchableOpacity style={s.card}
        onPress={() => navigation.navigate('SchoolContent', { group, subject: item })}>
        <View style={s.iconBox}>
          <Text style={{ fontSize: 20 }}>📂</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.subjectName}>{item.name}</Text>
          <Text style={s.subjectSub}>{item.videos} videos · {item.docs} docs</Text>
        </View>
        <Text style={{ color: GREEN, fontSize: 18 }}>›</Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.groupHeader}>
        <Text style={s.groupName}>{group?.group_name || 'Group'}</Text>
        <Text style={s.groupMeta}>{group?.student_count} students · {group?.teacher}</Text>
      </View>

      <View style={s.actionRow}>
        <TouchableOpacity style={s.actionBtn}
          onPress={() => navigation.navigate('SchoolQA', { group })}>
          <Text style={s.actionBtnText}>💬 {t.qa}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn}
          onPress={() => navigation.navigate('SchoolChat', { group })}>
          <Text style={s.actionBtnText}>🗨 {t.chat}</Text>
        </TouchableOpacity>
        {canUpload && (
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: GREEN, borderColor: GREEN }]}
            onPress={() => navigation.navigate('SchoolUpload', { group })}>
            <Text style={[s.actionBtnText, { color: '#fff' }]}>⬆ {t.upload}</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={s.sectionTitle}>{t.subjects}</Text>
      <FlatList
        data={SUBJECTS}
        keyExtractor={i => String(i.id)}
        renderItem={renderSubject}
        contentContainerStyle={{ padding: 16, paddingTop: 4 }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#F2F7F4' },
  groupHeader:  { backgroundColor: GREEN, padding: 16 },
  groupName:    { color: '#fff', fontSize: 18, fontWeight: '700' },
  groupMeta:    { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  actionRow:    { flexDirection: 'row', gap: 8, padding: 12, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#dde8df' },
  actionBtn:    { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8, borderWidth: 0.5, borderColor: GREEN },
  actionBtnText:{ fontSize: 12, color: GREEN, fontWeight: '500' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#555', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  card:         { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 0.5, borderColor: '#dde8df' },
  iconBox:      { width: 44, height: 44, borderRadius: 10, backgroundColor: '#E8F4EB', alignItems: 'center', justifyContent: 'center' },
  subjectName:  { fontSize: 14, fontWeight: '600', color: '#222' },
  subjectSub:   { fontSize: 12, color: '#888', marginTop: 2 },
});
