import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, Alert,
} from 'react-native';
import { useAuth, T } from '../../utils/AuthContext';
import { registerUser } from '../../utils/api';

const NAVY = '#1E3A5F';

export default function RegisterScreen({ navigation }) {
  const { lang } = useAuth();
  const t = T[lang];

  const [path,      setPath]      = useState('seekage'); // 'seekage' | 'school'
  const [name,      setName]      = useState('');
  const [phone,     setPhone]     = useState('');
  const [password,  setPassword]  = useState('');
  const [age,       setAge]       = useState('');
  const [state,     setState]     = useState('Kerala');
  const [schoolCode,setSchoolCode] = useState('');
  const [loading,   setLoading]   = useState(false);

  async function handleRegister() {
    if (!name || !phone || !password) { Alert.alert('Error', 'Fill required fields'); return; }
    setLoading(true);
    try {
      await registerUser({ name, phone, password, age, state, schoolCode, registrationType: path });
      Alert.alert('Success', 'Account created! Please login.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
          <Text style={{ color: NAVY, fontSize: 14 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={s.title}>{t.register}</Text>

        {/* Path selector */}
        <View style={s.pathRow}>
          {['seekage', 'school'].map(p => (
            <TouchableOpacity key={p} style={[s.pathBtn, path === p && s.pathActive]}
              onPress={() => setPath(p)}>
              <Text style={[s.pathText, path === p && s.pathActiveText]}>
                {p === 'seekage' ? t.seekagePath : t.schoolPath}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.note}>
          <Text style={s.noteText}>
            {path === 'seekage'
              ? 'You will be placed in an age-based batch managed by Seekage admin.'
              : 'You will join your school's class. Enter the school code given by your school.'}
          </Text>
        </View>

        <Text style={s.label}>{t.name} *</Text>
        <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Full name" />

        <Text style={s.label}>{t.phone} *</Text>
        <TextInput style={s.input} value={phone} onChangeText={setPhone}
          placeholder="+91 XXXXX XXXXX" keyboardType="phone-pad" />

        <Text style={s.label}>{t.password} *</Text>
        <TextInput style={s.input} value={password} onChangeText={setPassword}
          placeholder="Create password" secureTextEntry />

        {path === 'school' && (
          <>
            <Text style={s.label}>{t.schoolCode} *</Text>
            <TextInput style={s.input} value={schoolCode} onChangeText={setSchoolCode}
              placeholder="e.g. GHS2024" />
          </>
        )}

        {path === 'seekage' && (
          <>
            <Text style={s.label}>{t.age}</Text>
            <TextInput style={s.input} value={age} onChangeText={setAge}
              placeholder="Your age" keyboardType="numeric" />
          </>
        )}

        <Text style={s.label}>{t.state}</Text>
        <TextInput style={s.input} value={state} onChangeText={setState}
          placeholder="State" />

        <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]}
          onPress={handleRegister} disabled={loading}>
          <Text style={s.btnText}>{loading ? '…' : t.register}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#fff' },
  scroll:         { padding: 24, paddingBottom: 40 },
  title:          { fontSize: 22, fontWeight: '700', color: NAVY, marginBottom: 20 },
  label:          { fontSize: 12, color: '#555', marginBottom: 4, marginTop: 12 },
  input:          { borderWidth: 0.5, borderColor: '#ccc', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, backgroundColor: '#f9f9f9' },
  pathRow:        { flexDirection: 'row', gap: 10, marginBottom: 10 },
  pathBtn:        { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 0.5, borderColor: '#ccc', alignItems: 'center', backgroundColor: '#f5f5f5' },
  pathActive:     { backgroundColor: NAVY, borderColor: NAVY },
  pathText:       { fontSize: 13, color: '#555' },
  pathActiveText: { color: '#fff', fontWeight: '600' },
  note:           { backgroundColor: '#EEF3FA', borderRadius: 10, padding: 10, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: NAVY },
  noteText:       { fontSize: 12, color: '#444', lineHeight: 18 },
  btn:            { backgroundColor: NAVY, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  btnText:        { color: '#fff', fontSize: 16, fontWeight: '600' },
});
