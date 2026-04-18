import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, ScrollView,
} from 'react-native';
import { useAuth, T } from '../../utils/AuthContext';
import { loginUser } from '../../utils/api';

const NAVY = '#1E3A5F';
const ROLES = ['admin', 'student', 'parent', 'teacher', 'counselor'];

export default function LoginScreen({ navigation }) {
  const { login, lang, setLang } = useAuth();
  const t = T[lang];

  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState('student');
  const [loading,  setLoading]  = useState(false);

  async function handleLogin() {
    if (!phone || !password) { Alert.alert('Error', 'Fill all fields'); return; }
    setLoading(true);
    try {
      // ── For development/testing, mock the login ──────────────────────────
      // const res = await loginUser(phone, password, role);
      // login({ ...res.data.user, token: res.data.token });
      login({ id: 1, name: 'Test User', role, phone, token: 'dev-token' });
    } catch (e) {
      Alert.alert('Login Failed', e?.response?.data?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Language toggle */}
        <View style={s.langRow}>
          <TouchableOpacity onPress={() => setLang('en')}
            style={[s.langBtn, lang === 'en' && s.langActive]}>
            <Text style={[s.langText, lang === 'en' && s.langActiveText]}>EN</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setLang('ml')}
            style={[s.langBtn, lang === 'ml' && s.langActive]}>
            <Text style={[s.langText, lang === 'ml' && s.langActiveText]}>മലയാളം</Text>
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <View style={s.logoWrap}>
          <View style={s.logoCircle}>
            <Text style={s.logoText}>SK</Text>
          </View>
          <Text style={s.appName}>{t.appName}</Text>
          <Text style={s.tagline}>Learn · Grow · Succeed</Text>
        </View>

        {/* Role selector */}
        <Text style={s.label}>{t.role}</Text>
        <View style={s.roleRow}>
          {ROLES.map(r => (
            <TouchableOpacity key={r} onPress={() => setRole(r)}
              style={[s.roleBtn, role === r && s.roleBtnActive]}>
              <Text style={[s.roleBtnText, role === r && s.roleBtnTextActive]}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Inputs */}
        <Text style={s.label}>{t.phone}</Text>
        <TextInput style={s.input} value={phone} onChangeText={setPhone}
          placeholder="+91 XXXXX XXXXX" keyboardType="phone-pad" />

        <Text style={s.label}>{t.password}</Text>
        <TextInput style={s.input} value={password} onChangeText={setPassword}
          placeholder="••••••••" secureTextEntry />

        <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]}
          onPress={handleLogin} disabled={loading}>
          <Text style={s.btnText}>{loading ? '…' : t.login}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={s.link}>No account? {t.register}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#fff' },
  scroll:          { padding: 24, paddingBottom: 40 },
  langRow:         { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginBottom: 8 },
  langBtn:         { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 0.5, borderColor: '#ccc' },
  langActive:      { backgroundColor: NAVY, borderColor: NAVY },
  langText:        { fontSize: 12, color: '#555' },
  langActiveText:  { color: '#fff' },
  logoWrap:        { alignItems: 'center', marginVertical: 24 },
  logoCircle:      { width: 72, height: 72, borderRadius: 36, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  logoText:        { color: '#fff', fontSize: 24, fontWeight: '700' },
  appName:         { fontSize: 28, fontWeight: '700', color: NAVY, letterSpacing: 3 },
  tagline:         { fontSize: 13, color: '#888', marginTop: 4 },
  label:           { fontSize: 12, color: '#555', marginBottom: 4, marginTop: 12 },
  input:           { borderWidth: 0.5, borderColor: '#ccc', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, backgroundColor: '#f9f9f9' },
  roleRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  roleBtn:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 0.5, borderColor: '#ccc', backgroundColor: '#f5f5f5' },
  roleBtnActive:   { backgroundColor: NAVY, borderColor: NAVY },
  roleBtnText:     { fontSize: 12, color: '#555' },
  roleBtnTextActive: { color: '#fff' },
  btn:             { backgroundColor: NAVY, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  btnText:         { color: '#fff', fontSize: 16, fontWeight: '600' },
  link:            { textAlign: 'center', marginTop: 16, color: NAVY, fontSize: 13 },
});
