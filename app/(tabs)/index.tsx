import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
};

type ApiResponse = {
  status: string;
  service: string;
  timestamp: string;
  products: Product[];
};

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function HomeScreen() {
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function checkConnection() {
    if (!apiBaseUrl) {
      setError('EXPO_PUBLIC_API_BASE_URL belum dikonfigurasi.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api`);

      if (!response.ok) {
        throw new Error(`Server merespons HTTP ${response.status}.`);
      }

      setResult((await response.json()) as ApiResponse);
    } catch {
      setResult(null);
      setError('Tidak dapat menghubungi backend. Pastikan server dan HP berada di Wi-Fi yang sama.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void checkConnection();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Koneksi Backend</ThemedText>
        <ThemedText>Endpoint: {apiBaseUrl ?? 'belum dikonfigurasi'}/api</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Status</ThemedText>
        {isLoading && <ThemedText>Menghubungkan ke backend...</ThemedText>}
        {result && (
          <>
            <ThemedText>Status: {result.status}</ThemedText>
            <ThemedText>Service: {result.service}</ThemedText>
            <ThemedText>Respons: {new Date(result.timestamp).toLocaleString()}</ThemedText>
          </>
        )}
        {error && <ThemedText style={styles.error}>{error}</ThemedText>}
      </ThemedView>
      {result && (
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Produk Dummy</ThemedText>
          {result.products.map((product) => (
            <ThemedView key={product.id} style={styles.product}>
              <ThemedText type="defaultSemiBold">{product.name}</ThemedText>
              <ThemedText>Rp{product.price.toLocaleString('id-ID')}</ThemedText>
              <ThemedText>Stok: {product.stock}</ThemedText>
            </ThemedView>
          ))}
        </ThemedView>
      )}
      <Pressable style={styles.button} onPress={() => void checkConnection()}>
        <ThemedText style={styles.buttonText}>Coba Lagi</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 24,
    padding: 24,
  },
  titleContainer: {
    gap: 8,
  },
  stepContainer: {
    gap: 8,
  },
  product: {
    borderColor: '#D1D5DB',
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  error: {
    color: '#DC2626',
  },
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#0A7EA4',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
