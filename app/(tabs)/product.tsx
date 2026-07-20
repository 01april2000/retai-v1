import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ProductScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Produk</ThemedText>
      <ThemedText>Daftar produk akan ditampilkan di sini.</ThemedText>
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
