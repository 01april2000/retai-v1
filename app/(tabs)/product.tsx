import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { FontFamilies, Luminous, Radius, Spacing } from '@/constants/theme';

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
};

type FormData = {
  name: string;
  price: string;
  stock: string;
};

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const CARD_MARGIN = Spacing.containerMargin;

function formatRupiah(amount: number): string {
  return `Rp${amount.toLocaleString('id-ID')}`;
}

function getStockStatus(stock: number): { label: string; active: boolean } {
  return stock > 0 ? { label: 'Tersedia', active: true } : { label: 'Habis', active: false };
}

function validateForm(data: FormData): string | null {
  const trimmed = data.name.trim();
  if (trimmed.length === 0) return 'Nama produk tidak boleh kosong.';
  const price = Number(data.price);
  if (!Number.isInteger(price) || price < 0) return 'Harga harus bilangan bulat >= 0.';
  const stock = Number(data.stock);
  if (!Number.isInteger(stock) || stock < 0) return 'Stok harus bilangan bulat >= 0.';
  return null;
}

async function getApiError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? `Server merespons HTTP ${response.status}.`;
  } catch {
    return `Server merespons HTTP ${response.status}.`;
  }
}

function FloatingInput({
  label,
  value,
  onChangeText,
  keyboardType,
  editable,
  onSubmitEditing,
  returnKeyType,
  inputRef,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'number-pad';
  editable?: boolean;
  onSubmitEditing?: () => void;
  returnKeyType?: 'next' | 'done';
  inputRef?: React.RefObject<TextInput | null>;
}) {
  const [focused, setFocused] = useState(false);

  const borderColor = focused ? Luminous.primary : '#e2e8f0';
  const borderWidth = focused ? 2 : 1;

  return (
    <View style={styles.inputWrapper}>
      <ThemedText
        style={[
          styles.inputLabel,
          focused && styles.inputLabelFocused,
        ]}>
        {label}
      </ThemedText>
      <TextInput
        ref={inputRef}
        style={[
          styles.input,
          { borderColor, borderWidth, color: Luminous.onSurface },
          focused && Platform.OS === 'ios' && {
            shadowColor: Luminous.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        editable={editable}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        accessibilityLabel={label}
      />
    </View>
  );
}

function StatusBadge({ stock }: { stock: number }) {
  const { label, active } = getStockStatus(stock);
  return (
    <View style={[
      styles.badge,
      { backgroundColor: active ? Luminous.successContainer : Luminous.errorContainer },
    ]}>
      <View style={[
        styles.badgeDot,
        { backgroundColor: active ? Luminous.success : Luminous.error },
      ]} />
      <ThemedText
        style={[
          styles.badgeText,
          { color: active ? Luminous.onSuccessContainer : Luminous.onErrorContainer },
        ]}
        type="labelSm">
        {label}
      </ThemedText>
    </View>
  );
}

export default function ProductScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<FormData>({ name: '', price: '', stock: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const insets = useSafeAreaInsets();
  const priceRef = useRef<TextInput>(null);
  const stockRef = useRef<TextInput>(null);

  const fetchProducts = useCallback(async () => {
    if (!apiBaseUrl) {
      setError('EXPO_PUBLIC_API_BASE_URL belum dikonfigurasi.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/products`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setProducts((await res.json()) as Product[]);
    } catch {
      setError('Tidak dapat mengambil data produk. Periksa koneksi ke backend.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredProducts = normalizedSearchQuery
    ? products.filter((product) => product.name.toLowerCase().includes(normalizedSearchQuery))
    : products;

  function openCreateModal() {
    setEditingProduct(null);
    setForm({ name: '', price: '', stock: '' });
    setFormError(null);
    setModalVisible(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setForm({
      name: product.name,
      price: String(product.price),
      stock: String(product.stock),
    });
    setFormError(null);
    setModalVisible(true);
  }

  async function handleSubmit() {
    if (!apiBaseUrl) {
      setFormError('EXPO_PUBLIC_API_BASE_URL belum dikonfigurasi.');
      return;
    }

    const validationError = validateForm(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const body = {
      name: form.name.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
    };

    try {
      const url = editingProduct
        ? `${apiBaseUrl}/api/products/${editingProduct.id}`
        : `${apiBaseUrl}/api/products`;
      const method = editingProduct ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(await getApiError(res));
      }

      setModalVisible(false);
      void fetchProducts();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Terjadi kesalahan server.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function confirmDelete(product: Product) {
    if (isDeleting) return;

    Alert.alert(
      'Hapus Produk',
      `Yakin ingin menghapus "${product.name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => void handleDelete(product.id),
        },
      ],
    );
  }

  async function handleDelete(id: string) {
    if (!apiBaseUrl || isDeleting) return;

    setIsDeleting(id);
    try {
      const res = await fetch(`${apiBaseUrl}/api/products/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error(await getApiError(res));
      }
      void fetchProducts();
    } catch (err) {
      Alert.alert(
        'Gagal Menghapus',
        err instanceof Error ? err.message : 'Terjadi kesalahan server.',
      );
    } finally {
      setIsDeleting(null);
    }
  }

  function renderCard(product: Product) {
    const isDeletingThis = isDeleting === product.id;
    const hasDeleteInProgress = isDeleting !== null;

    return (
      <View key={product.id} style={styles.card}>
        <View style={styles.cardBody}>
          <ThemedText type="headlineMd" style={styles.cardTitle}>
            {product.name}
          </ThemedText>
          <ThemedText type="bodyMd" style={styles.cardPrice}>
            {formatRupiah(product.price)}
          </ThemedText>
          <StatusBadge stock={product.stock} />
        </View>
        <View style={styles.cardActions}>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              styles.editBtn,
              pressed && styles.actionBtnPressed,
            ]}
            onPress={() => openEditModal(product)}
            disabled={hasDeleteInProgress}>
            <ThemedText style={styles.editBtnText} type="labelSm">Edit</ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              styles.deleteBtn,
              pressed && styles.deleteBtnPressed,
            ]}
            onPress={() => confirmDelete(product)}
            disabled={hasDeleteInProgress}>
            {isDeletingThis ? (
              <ActivityIndicator color={Luminous.onError} size="small" />
            ) : (
              <ThemedText style={styles.deleteBtnText} type="labelSm">Hapus</ThemedText>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="headlineLg" style={styles.headerTitle}>
            Produk
          </ThemedText>
          <ThemedText type="bodyMd" style={styles.headerCount}>
            {searchQuery.trim()
              ? `${filteredProducts.length} dari ${products.length} produk`
              : `${products.length} produk`}
          </ThemedText>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Cari produk..."
          placeholderTextColor={Luminous.outline}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          accessibilityLabel="Cari produk"
          accessibilityRole="search"
        />

        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Luminous.primary} />
            <ThemedText type="bodyMd" style={styles.loadingText}>
              Memuat produk...
            </ThemedText>
          </View>
        )}

        {!isLoading && error && (
          <View style={styles.center}>
            <ThemedText type="bodyMd" style={styles.errorText}>{error}</ThemedText>
            <Pressable
              style={({ pressed }) => [
                styles.retryBtn,
                pressed && styles.retryBtnPressed,
              ]}
              onPress={() => void fetchProducts()}>
              <ThemedText type="labelSm" style={styles.retryBtnText}>
                Coba Lagi
              </ThemedText>
            </Pressable>
          </View>
        )}

        {!isLoading && !error && products.length === 0 && (
          <View style={styles.center}>
            <ThemedText type="bodyLg" style={styles.emptyText}>
              Belum ada produk.
            </ThemedText>
            <ThemedText type="bodyMd" style={styles.emptySubtext}>
              Ketuk + untuk menambah produk baru.
            </ThemedText>
          </View>
        )}

        {!isLoading && !error && products.length > 0 && filteredProducts.length === 0 && (
          <View style={styles.center}>
            <ThemedText type="bodyLg" style={styles.emptyText}>
              Produk tidak ditemukan.
            </ThemedText>
            <ThemedText type="bodyMd" style={styles.emptySubtext}>
              Coba gunakan kata kunci lain.
            </ThemedText>
          </View>
        )}

        {!isLoading && !error && filteredProducts.map((p) => renderCard(p))}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { bottom: Math.max(insets.bottom, 16) + 16 },
          pressed && styles.fabPressed,
        ]}
        onPress={openCreateModal}
        accessibilityLabel="Tambah produk baru"
        accessibilityRole="button">
        <ThemedText style={styles.fabIcon}>+</ThemedText>
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!isSubmitting) setModalVisible(false);
        }}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              if (!isSubmitting) setModalVisible(false);
            }}
            accessibilityLabel="Tutup dialog"
            accessibilityRole="button"
          />
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 16) + 20 }]}>
            <View style={styles.modalHandle} />
            <ThemedText type="headlineMd" style={styles.modalTitle}>
              {editingProduct ? 'Edit Produk' : 'Tambah Produk'}
            </ThemedText>

            <FloatingInput
              label="Nama Produk"
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
              editable={!isSubmitting}
              onSubmitEditing={() => priceRef.current?.focus()}
              returnKeyType="next"
            />
            <FloatingInput
              label="Harga"
              value={form.price}
              onChangeText={(v) => setForm({ ...form, price: v })}
              keyboardType="number-pad"
              editable={!isSubmitting}
              inputRef={priceRef}
              onSubmitEditing={() => stockRef.current?.focus()}
              returnKeyType="next"
            />
            <FloatingInput
              label="Stok"
              value={form.stock}
              onChangeText={(v) => setForm({ ...form, stock: v })}
              keyboardType="number-pad"
              editable={!isSubmitting}
              inputRef={stockRef}
              onSubmitEditing={() => void handleSubmit()}
              returnKeyType="done"
            />

            {formError && (
              <View style={styles.formErrorBox}>
                <ThemedText type="bodyMd" style={styles.formErrorText}>
                  {formError}
                </ThemedText>
              </View>
            )}

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.submitBtn,
                  isSubmitting && styles.disabledBtn,
                  pressed && !isSubmitting && styles.submitBtnPressed,
                ]}
                onPress={() => void handleSubmit()}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel={editingProduct ? 'Simpan produk' : 'Tambah produk'}
                accessibilityState={{ disabled: isSubmitting }}>
                {isSubmitting ? (
                  <ActivityIndicator color={Luminous.onPrimary} size="small" />
                ) : (
                  <ThemedText type="labelMd" style={styles.submitBtnText}>
                    {editingProduct ? 'Simpan' : 'Tambah'}
                  </ThemedText>
                )}
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.cancelBtn,
                  pressed && styles.cancelBtnPressed,
                ]}
                onPress={() => setModalVisible(false)}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel="Batal"
                accessibilityState={{ disabled: isSubmitting }}>
                <ThemedText type="labelMd" style={styles.cancelBtnText}>
                  Batal
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Luminous.background,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: CARD_MARGIN,
    paddingTop: 12,
    paddingBottom: 100,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  headerTitle: {
    color: Luminous.onSurface,
    marginBottom: 2,
  },
  headerCount: {
    color: Luminous.onSurfaceVariant,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    color: Luminous.onSurfaceVariant,
  },
  errorText: {
    color: Luminous.error,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  retryBtn: {
    minHeight: Spacing.touchTargetMin,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: Luminous.primary,
    borderRadius: Radius.DEFAULT,
  },
  retryBtnPressed: {
    backgroundColor: Luminous.primaryContainer,
  },
  retryBtnText: {
    color: Luminous.onPrimary,
  },
  emptyText: {
    color: Luminous.onSurfaceVariant,
  },
  emptySubtext: {
    color: Luminous.outline,
  },
  searchInput: {
    height: 44,
    borderRadius: Radius.DEFAULT,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: FontFamilies.regular,
    backgroundColor: Luminous.surfaceContainerLow,
    color: Luminous.onSurface,
    marginBottom: 16,
  },
  bottomSpacer: {
    height: 80,
  },
  card: {
    backgroundColor: Luminous.surfaceContainerLowest,
    borderRadius: Radius.DEFAULT,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 6,
  },
  cardTitle: {
    color: Luminous.onSurface,
  },
  cardPrice: {
    color: Luminous.onSurfaceVariant,
  },
  cardActions: {
    gap: 8,
    marginLeft: 12,
  },
  actionBtn: {
    minHeight: Spacing.touchTargetMin,
    minWidth: 64,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
  },
  editBtn: {
    backgroundColor: Luminous.secondaryContainer,
  },
  editBtnText: {
    color: Luminous.onSecondaryContainer,
  },
  actionBtnPressed: {
    opacity: 0.8,
  },
  deleteBtn: {
    backgroundColor: Luminous.errorContainer,
  },
  deleteBtnPressed: {
    opacity: 0.8,
  },
  deleteBtnText: {
    color: Luminous.onErrorContainer,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: CARD_MARGIN,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Luminous.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Luminous.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  fabPressed: {
    backgroundColor: Luminous.primaryContainer,
  },
  fabIcon: {
    fontSize: 28,
    color: Luminous.onPrimary,
    lineHeight: 30,
    fontWeight: '400',
    marginTop: -2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  modalContent: {
    backgroundColor: Luminous.surfaceContainerLowest,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingHorizontal: CARD_MARGIN,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Luminous.outlineVariant,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    color: Luminous.onSurface,
    marginBottom: 4,
  },
  inputWrapper: {
    gap: 6,
  },
  input: {
    height: 52,
    borderRadius: Radius.DEFAULT,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: FontFamilies.regular,
    backgroundColor: Luminous.surfaceContainerLow,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: FontFamilies.medium,
    color: Luminous.onSurfaceVariant,
  },
  inputLabelFocused: {
    color: Luminous.primary,
  },
  formErrorBox: {
    backgroundColor: Luminous.errorContainer,
    borderRadius: Radius.sm,
    padding: 12,
  },
  formErrorText: {
    color: Luminous.onErrorContainer,
  },
  modalActions: {
    gap: 12,
    paddingTop: 8,
  },
  cancelBtn: {
    minHeight: Spacing.touchTargetMin,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  cancelBtnPressed: {
    opacity: 0.6,
  },
  cancelBtnText: {
    color: Luminous.onSurfaceVariant,
  },
  submitBtn: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.DEFAULT,
    backgroundColor: Luminous.primary,
  },
  submitBtnPressed: {
    backgroundColor: Luminous.primaryContainer,
  },
  submitBtnText: {
    color: Luminous.onPrimary,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    textTransform: 'uppercase',
  },
});
