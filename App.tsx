import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { CLIENTS, User, clearSession, loadSession, login, saveSession } from './src/mockAuth';

const FEATURES = [
  { icon: '▦', name: 'Dashboard', description: 'Key metrics and activity at a glance.' },
  { icon: '▣', name: 'Products', description: 'Catalog and product management.' },
  { icon: '☰', name: 'Inventory', description: 'Stock levels and movements.' },
  { icon: '$', name: 'Billing', description: 'Invoices, plans and payments.' },
  { icon: '↗', name: 'Reports', description: 'Analytics and exportable reports.' },
];

export default function App() {
  // sessionStorage is synchronous, so the session is resolved before the first render.
  const [user, setUser] = useState<User | null>(loadSession);

  const handleLogin = (next: User) => {
    saveSession(next);
    setUser(next);
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={[styles.headerInner, styles.headerRow]}>
          <View>
            <Text style={styles.title}>Learning</Text>
            <Text style={styles.subtitle}>Feature Access Manager</Text>
          </View>
          {user && (
            <Pressable style={styles.logout} onPress={handleLogout} accessibilityRole="button">
              <Text style={styles.logoutText}>Log out</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          {!user && <LoginScreen onLogin={handleLogin} />}
          {user?.role === 'admin' && <AdminDashboard />}
          {user?.role === 'client' && <ClientHome user={user} />}
        </View>
      </ScrollView>
    </View>
  );
}

function LoginScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    const result = login(username, password);
    if (result) {
      setError('');
      onLogin(result);
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <View style={[styles.card, styles.loginCard]}>
      <Text style={styles.sectionTitle}>Sign in</Text>
      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Username"
        placeholderTextColor="#94A3B8"
      />
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        onSubmitEditing={submit}
        placeholder="Password"
        placeholderTextColor="#94A3B8"
      />
      {error !== '' && <Text style={styles.error}>{error}</Text>}
      <Pressable style={styles.button} onPress={submit} accessibilityRole="button">
        <Text style={styles.buttonText}>Sign in</Text>
      </Pressable>
    </View>
  );
}

function AdminDashboard() {
  const { width } = useWindowDimensions();
  const wide = width >= 720;

  return (
    <>
      <View style={[styles.row, wide && styles.rowWide]}>
        <View style={[styles.card, styles.summaryCard]}>
          <Text style={styles.summaryValue}>{CLIENTS.length}</Text>
          <Text style={styles.summaryLabel}>Clients</Text>
        </View>
        <View style={[styles.card, styles.summaryCard]}>
          <Text style={styles.summaryValue}>{FEATURES.length}</Text>
          <Text style={styles.summaryLabel}>Features</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Clients</Text>
      <View style={styles.grid}>
        {CLIENTS.map((client) => (
          <View key={client.username} style={[styles.card, styles.clientRow]}>
            <View style={styles.featureText}>
              <Text style={styles.featureName}>{client.name}</Text>
              <Text style={styles.featureDescription}>@{client.username}</Text>
            </View>
            <Text style={styles.badge}>{client.assignedFeatures.length} features</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Feature overview</Text>
      <View style={[styles.grid, wide && styles.gridWide]}>
        {FEATURES.map((feature) => (
          <View key={feature.name} style={[styles.card, styles.featureCard, wide && styles.featureCardWide]}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>{feature.icon}</Text>
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureName}>{feature.name}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

function ClientHome({ user }: { user: User }) {
  return (
    <>
      <Text style={styles.sectionTitle}>Welcome, {user.name}</Text>
      <View style={[styles.card, styles.empty]}>
        <Text style={styles.featureName}>No features assigned</Text>
        <Text style={styles.featureDescription}>No features are currently assigned to your account.</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3F5F9' },
  header: { backgroundColor: '#1E293B', paddingTop: 48, paddingBottom: 24, paddingHorizontal: 20 },
  headerInner: { width: '100%', maxWidth: 960, alignSelf: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '700' },
  subtitle: { color: '#94A3B8', fontSize: 15, marginTop: 4 },
  logout: { borderWidth: 1, borderColor: '#475569', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  logoutText: { color: '#E2E8F0', fontSize: 14, fontWeight: '600' },
  content: { padding: 20 },
  container: { width: '100%', maxWidth: 960, alignSelf: 'center' },
  row: { gap: 12 },
  rowWide: { flexDirection: 'row' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  summaryCard: { flex: 1 },
  summaryValue: { fontSize: 32, fontWeight: '700', color: '#0F172A' },
  summaryLabel: { fontSize: 14, color: '#64748B', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#0F172A', marginTop: 28, marginBottom: 12 },
  grid: { gap: 12 },
  gridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  featureCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureCardWide: { flexBasis: '31%', flexGrow: 1 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 18, color: '#4338CA', fontWeight: '700' },
  featureText: { flex: 1 },
  featureName: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  featureDescription: { fontSize: 13, color: '#64748B', marginTop: 2 },
  loginCard: { width: '100%', maxWidth: 420, alignSelf: 'center', marginTop: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  error: { color: '#B91C1C', fontSize: 13, marginTop: 12 },
  button: { backgroundColor: '#4338CA', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: { fontSize: 12, color: '#475569', backgroundColor: '#F1F5F9', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  empty: { alignItems: 'center', paddingVertical: 32 },
});
