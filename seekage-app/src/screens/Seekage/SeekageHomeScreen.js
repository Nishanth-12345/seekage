import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useAuth, T } from '../../utils/AuthContext';
import { fetchGroups } from '../../utils/api';

const NAVY = '#1E3A5F';

// Mock data used while backend is not connected
const MOCK_GROUPS = [
  { group_id: 1, group_name: 'Age 8–9 · Batch A',  student_count: 87, group_type: 'age_based' },
  { group_id: 2, group_name: 'Age 10–11 · Batch A', student_count: 100, group_type: 'age_based' },
  { group_id: 3, group_name: 'Age 10–11 · Batch B', student_count: 42, group_type: 'age_based' },
  { group_id: 4, group_name: 'Age 12–13 · Batch A', student_count: 74, group_type: 'age_based' },
];

export default function SeekageHomeScreen({ navigation }) {
  const { user, lang, logout } = useAuth();
  const t = T[lang];
  const [groups,  setGroups]  = useState(MOCK_GROUPS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Uncomment when backend is ready:
    // setLoading(true);
    // fetchGroups(user.token).then(r => setGroups(r.data)).finally(() => setLoading(false));
  }, []);

  const canUpload = ['admin', 'teacher'].includes(user?.role);

  function renderGroup({ item }) {
    const full = item.student_count >= 100;
    return (
      <TouchableOpacity style={s.card}
        onPress={() => navigation.navigate('SeekageContent', { group: item })}>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{item.group_name}</Text>
          <Text style={s.cardSub}>{item.student_count} / 100 students</Text>
        </View>
        <View style={[s.badge, full ? s.badgeFull : s.badgeOk]}>
          <Text style={[s.badgeText, full ? s.badgeFullText : s.badgeOkText]}>
            {full ? 'Full' : 'Active'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header info */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Welcome back,</Text>
          <Text style={s.userName}>{user?.name || 'User'}</Text>
        </View>
        <View style={s.headerRight}>
          <View style={s.rolePill}><Text style={s.rolePillText}>{user?.role}</Text></View>
          <TouchableOpacity onPress={logout} style={{ marginTop: 4 }}>
            <Text style={{ fontSize: 11, color: '#aaa' }}>{t.logout}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Batches */}
      <Text style={s.sectionTitle}>{t.batches}</Text>

      {loading
        ? <ActivityIndicator color={NAVY} style={{ marginTop: 40 }} />
        : (
          <FlatList
            data={groups}
            keyExtractor={i => String(i.group_id)}
            renderItem={renderGroup}
            contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          />
        )
      }

      {/* Upload FAB (admin/teacher only) */}
      {canUpload && (
        <TouchableOpacity style={s.fab}
          onPress={() => navigation.navigate('Upload', { groupId: null })}>
          <Text style={s.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#F4F7FB' },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: NAVY, padding: 20, paddingBottom: 24 },
  greeting:      { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  userName:      { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerRight:   { alignItems: 'flex-end' },
  rolePill:      { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  rolePillText:  { color: '#fff', fontSize: 11, textTransform: 'capitalize' },
  sectionTitle:  { fontSize: 14, fontWeight: '600', color: '#333', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  card:          { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 0.5, borderColor: '#e0e0e0' },
  cardTitle:     { fontSize: 14, fontWeight: '600', color: '#222' },
  cardSub:       { fontSize: 12, color: '#888', marginTop: 2 },
  badge:         { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeOk:       { backgroundColor: '#E1F5EE' },
  badgeFull:     { backgroundColor: '#FFF3E0' },
  badgeOkText:   { color: '#085041', fontSize: 11 },
  badgeFullText: { color: '#E65100', fontSize: 11 },
  fab:           { position: 'absolute', right: 20, bottom: 24, width: 52, height: 52, borderRadius: 26, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  fabText:       { color: '#fff', fontSize: 28, lineHeight: 30 },
});
