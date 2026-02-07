import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_THEME } from '../constants/app-theme';
import { useAuth } from '../hooks/auth-context';

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const { login, register, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');

  const theme = APP_THEME.dark;
  const isWide = width >= 900;

  const title = useMemo(() => (mode === 'login' ? '登录 MyGymApp' : '注册 MyGymApp'), [mode]);

  const onSubmit = async () => {
    setErrorText('');

    if (!username.trim()) {
      setErrorText('请输入用户名。');
      return;
    }
    if (!password) {
      setErrorText('请输入密码。');
      return;
    }
    if (mode === 'register' && password !== confirmPassword) {
      setErrorText('两次输入的密码不一致。');
      return;
    }

    setSubmitting(true);
    try {
      const result =
        mode === 'login' ? await login(username.trim(), password) : await register(username.trim(), password);

      if (!result.ok) {
        setErrorText(result.message || '操作失败，请重试。');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}> 
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}> 
      <View style={[styles.root, isWide && styles.rootWide]}>
        <View style={[styles.brandPane, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
          <Text style={[styles.brandTitle, { color: theme.text }]}>久坐干预 + 训练提醒</Text>
          <Text style={[styles.brandDesc, { color: theme.textDim }]}>支持用户独立数据、拖拽布局和多端自适应。</Text>
        </View>

        <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

          <TextInput
            placeholder="用户名"
            placeholderTextColor={theme.textDim}
            testID="auth-username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt }]}
          />

          <TextInput
            placeholder="密码"
            placeholderTextColor={theme.textDim}
            testID="auth-password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt }]}
          />

          {mode === 'register' && (
            <TextInput
              placeholder="确认密码"
              placeholderTextColor={theme.textDim}
              testID="auth-confirm-password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt }]}
            />
          )}

          {!!errorText && <Text style={[styles.errorText, { color: theme.danger }]}>{errorText}</Text>}

          <Pressable testID="auth-submit" style={[styles.submitBtn, { backgroundColor: theme.primary }]} onPress={onSubmit} disabled={submitting}>
            <Text style={styles.submitBtnText}>{submitting ? '处理中...' : mode === 'login' ? '登录' : '注册并登录'}</Text>
          </Pressable>

          <Pressable testID="auth-switch-mode" style={[styles.switchBtn, { borderColor: theme.border }]} onPress={() => setMode((m) => (m === 'login' ? 'register' : 'login'))}>
            <Text style={[styles.switchBtnText, { color: theme.textDim }]}>
              {mode === 'login' ? '没有账号？去注册' : '已有账号？去登录'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  root: { flex: 1, padding: 18, gap: 14, justifyContent: 'center' },
  rootWide: { flexDirection: 'row', alignItems: 'stretch' },
  brandPane: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 18, justifyContent: 'center' },
  brandTitle: { fontSize: 28, fontWeight: '900' },
  brandDesc: { marginTop: 8, fontSize: 14, lineHeight: 22 },
  card: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 18, gap: 10, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  errorText: { fontSize: 12, marginTop: 2 },
  submitBtn: { borderRadius: 10, alignItems: 'center', paddingVertical: 11, marginTop: 8 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  switchBtn: { borderWidth: 1, borderRadius: 10, alignItems: 'center', paddingVertical: 10 },
  switchBtnText: { fontSize: 13, fontWeight: '600' },
});
