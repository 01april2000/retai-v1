import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function RiwayatScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Riwayat</ThemedText>
      <ThemedText>Riwayat transaksi akan ditampilkan di sini.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
});
