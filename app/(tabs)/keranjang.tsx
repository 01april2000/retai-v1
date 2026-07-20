import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function KeranjangScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Keranjang</ThemedText>
      <ThemedText>Keranjang belanja Anda akan ditampilkan di sini.</ThemedText>
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
