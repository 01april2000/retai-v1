import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Animated,
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

type CartItemWithProduct = {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
};

type Point = {
  x: number;
  y: number;
};

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const CARD_MARGIN = Spacing.containerMargin;

function formatRupiah(amount: number): string {
  return `Rp${amount.toLocaleString('id-ID')}`;
}

function computeTotal(items: CartItemWithProduct[]): number {
  return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}

function getStockStatus(stock: number): { label: string; active: boolean } {
  return stock > 0
    ? { label: 'Tersedia', active: true }
    : { label: 'Habis', active: false };
}

function StatusBadge({ stock }: { stock: number }) {
  const { label, active } = getStockStatus(stock);
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: active ? Luminous.successContainer : Luminous.errorContainer },
      ]}>
      <View
        style={[
          styles.badgeDot,
          { backgroundColor: active ? Luminous.success : Luminous.error },
        ]}
      />
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

export default function KeranjangScreen() {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [pendingProducts, setPendingProducts] = useState<Set<string>>(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentInput, setPaymentInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const chipX = useRef(new Animated.Value(0)).current;
  const chipY = useRef(new Animated.Value(0)).current;
  const chipScale = useRef(new Animated.Value(1)).current;
  const chipOpacity = useRef(new Animated.Value(1)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;
  const screenRef = useRef<View>(null);
  const ctaRef = useRef<View>(null);
  const [flyingChip, setFlyingChip] = useState<{ name: string } | null>(null);

  function startFlyingAnimation(fromX: number, fromY: number, productName: string) {
    screenRef.current?.measureInWindow((screenX, screenY) => {
      ctaRef.current?.measureInWindow((x, y, width, height) => {
        chipX.setValue(fromX - screenX);
        chipY.setValue(fromY - screenY);
        chipScale.setValue(1);
        chipOpacity.setValue(1);
        setFlyingChip({ name: productName });

        Animated.parallel([
          Animated.timing(chipX, {
            toValue: x + width / 2 - screenX,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(chipY, {
            toValue: y + height / 2 - screenY,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(chipScale, { toValue: 0.3, duration: 500, useNativeDriver: true }),
          Animated.timing(chipOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start(() => {
          setFlyingChip(null);
          Animated.sequence([
            Animated.timing(ctaScale, { toValue: 1.08, duration: 100, useNativeDriver: true }),
            Animated.timing(ctaScale, { toValue: 1, duration: 150, useNativeDriver: true }),
          ]).start();
        });
      });
    });
  }

  const total = computeTotal(cartItems);
  const distinctSelectedCount = cartItems.length;
  const paid = paymentInput === '' ? 0 : parseInt(paymentInput, 10);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredProducts = normalizedSearchQuery
    ? products.filter((product) => product.name.toLowerCase().includes(normalizedSearchQuery))
    : products;

  function closeModal() {
    setModalVisible(false);
    setPaymentInput('');
  }

  const fetchData = useCallback(async () => {
    if (!apiBaseUrl) {
      setError('EXPO_PUBLIC_API_BASE_URL belum dikonfigurasi.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [productsRes, cartRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/products`),
        fetch(`${apiBaseUrl}/api/cart`),
      ]);
      if (!productsRes.ok) throw new Error(`Produk HTTP ${productsRes.status}`);
      if (!cartRes.ok) throw new Error(`Keranjang HTTP ${cartRes.status}`);
      setProducts((await productsRes.json()) as Product[]);
      const data = (await cartRes.json()) as { items: CartItemWithProduct[] };
      setCartItems(data.items);
    } catch {
      setError('Tidak dapat memuat data. Periksa koneksi ke backend.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchData();
    }, [fetchData]),
  );

  useEffect(() => {
    if (cartItems.length === 0) {
      setPaymentInput('');
    }
  }, [cartItems]);

  async function handleAdd(product: Product, touchLocation: Point) {
    setMutationError(null);
    setPendingProducts((prev) => new Set(prev).add(product.id));
    try {
      const res = await fetch(`${apiBaseUrl}/api/cart/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: 1 }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const updated = (await res.json()) as CartItemWithProduct;
      setCartItems((prev) => {
        const idx = prev.findIndex((ci) => ci.productId === updated.productId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [...prev, updated];
      });
      startFlyingAnimation(
        touchLocation.x,
        touchLocation.y,
        product.name,
      );
    } catch (err) {
      setMutationError(
        err instanceof Error ? err.message : 'Gagal menambah item.',
      );
    } finally {
      setPendingProducts((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  }

  async function handleCartUpdate(productId: string, newQty: number) {
    setMutationError(null);
    setPendingProducts((prev) => new Set(prev).add(productId));
    try {
      if (newQty < 1) {
        const res = await fetch(`${apiBaseUrl}/api/cart/${productId}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }
        setCartItems((prev) =>
          prev.filter((ci) => ci.productId !== productId),
        );
      } else {
        const res = await fetch(`${apiBaseUrl}/api/cart/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: newQty }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }
        const updated = (await res.json()) as CartItemWithProduct;
        setCartItems((prev) => {
          const idx = prev.findIndex((ci) => ci.productId === updated.productId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updated;
            return next;
          }
          return [...prev, updated];
        });
      }
    } catch (err) {
      setMutationError(
        err instanceof Error ? err.message : 'Gagal memperbarui keranjang.',
      );
    } finally {
      setPendingProducts((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  }

  async function handleCartRemove(productId: string) {
    setMutationError(null);
    setPendingProducts((prev) => new Set(prev).add(productId));
    try {
      const res = await fetch(`${apiBaseUrl}/api/cart/${productId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setCartItems((prev) =>
        prev.filter((ci) => ci.productId !== productId),
      );
    } catch (err) {
      setMutationError(
        err instanceof Error ? err.message : 'Gagal menghapus item.',
      );
    } finally {
      setPendingProducts((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  }

  function renderProduct(product: Product) {
    const isInCart = cartItems.some((ci) => ci.productId === product.id);
    const isPending = pendingProducts.has(product.id);
    const isOutOfStock = product.stock === 0;

    let buttonLabel: string;
    let buttonDisabled: boolean;
    let buttonOnPress: ((touchLocation: Point) => void) | undefined;

    if (isOutOfStock) {
      buttonLabel = 'Habis';
      buttonDisabled = true;
      buttonOnPress = undefined;
    } else if (isInCart) {
      buttonLabel = 'Sudah Ditambahkan';
      buttonDisabled = true;
      buttonOnPress = undefined;
    } else {
      buttonLabel = 'Tambah ke Keranjang';
      buttonDisabled = false;
      buttonOnPress = (touchLocation) => void handleAdd(product, touchLocation);
    }

    return (
      <View
        key={product.id}
        style={[styles.card, isOutOfStock && styles.cardDisabled]}>
        <View style={styles.cardBody}>
          <ThemedText type="headlineMd" style={styles.cardTitle}>
            {product.name}
          </ThemedText>
          <ThemedText type="bodyMd" style={styles.cardPrice}>
            {formatRupiah(product.price)}
          </ThemedText>
          <StatusBadge stock={product.stock} />
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.addBtn,
            buttonDisabled && styles.addBtnDisabled,
            !buttonDisabled && pressed && styles.addBtnPressed,
          ]}
          onPress={(e) => {
            if (!buttonOnPress) return;
            buttonOnPress({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
          }}
          disabled={isPending || buttonDisabled}
          accessibilityLabel={buttonLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled: isPending || buttonDisabled }}>
          {isPending ? (
            <ActivityIndicator size="small" color={Luminous.onPrimary} />
          ) : (
            <ThemedText
              style={[
                styles.addBtnText,
                buttonDisabled && styles.addBtnTextDisabled,
              ]}
              type="labelMd">
              {buttonLabel}
            </ThemedText>
          )}
        </Pressable>
      </View>
    );
  }

  function renderCartItem(item: CartItemWithProduct) {
    const isPending = pendingProducts.has(item.productId);
    const atMinQuantity = item.quantity <= 1;
    const atMaxStock = item.quantity >= item.product.stock;
    const isOutOfStock = item.product.stock === 0;

    return (
      <View key={item.productId} style={styles.cartItem}>
        <View style={styles.cartItemInfo}>
          <ThemedText type="headlineMd" style={styles.cartItemName}>
            {item.product.name}
          </ThemedText>
          <ThemedText type="bodyMd" style={styles.cartItemPrice}>
            {formatRupiah(item.product.price)}
          </ThemedText>
          <ThemedText type="bodyMd" style={styles.cartItemSubtotal}>
            Subtotal: {formatRupiah(item.product.price * item.quantity)}
          </ThemedText>
        </View>
        <View style={styles.cartItemActions}>
          <Pressable
            style={({ pressed }) => [
              styles.cartQtyBtn,
              styles.cartQtyBtnMinus,
              (isPending || atMinQuantity) && styles.cartQtyBtnDisabled,
              pressed && !isPending && !atMinQuantity && styles.cartQtyBtnPressed,
            ]}
            onPress={() => {
              if (item.quantity > 1) {
                void handleCartUpdate(item.productId, item.quantity - 1);
              }
            }}
            disabled={isPending || atMinQuantity}
            accessibilityLabel={
              atMinQuantity
                ? `Minimal 1, tidak bisa dikurangi`
                : `Kurangi ${item.product.name}`
            }
            accessibilityRole="button"
            accessibilityState={{ disabled: isPending || atMinQuantity }}>
            <ThemedText
              style={[
                styles.cartQtyBtnText,
                (isPending || atMinQuantity) && styles.cartQtyBtnTextDisabled,
              ]}>
              -
            </ThemedText>
          </Pressable>
          <ThemedText
            style={styles.cartQtyValue}
            accessibilityLabel={`Jumlah ${item.product.name}: ${item.quantity}`}
            accessibilityRole="text">
            {item.quantity}
          </ThemedText>
          <Pressable
            style={({ pressed }) => [
              styles.cartQtyBtn,
              styles.cartQtyBtnPlus,
              (isPending || atMaxStock || isOutOfStock) &&
                styles.cartQtyBtnDisabled,
              pressed &&
                !isPending &&
                !atMaxStock &&
                !isOutOfStock &&
                styles.cartQtyBtnPressed,
            ]}
            onPress={() => void handleCartUpdate(item.productId, item.quantity + 1)}
            disabled={isPending || atMaxStock || isOutOfStock}
            accessibilityLabel={`Tambah ${item.product.name}`}
            accessibilityRole="button"
            accessibilityState={{
              disabled: isPending || atMaxStock || isOutOfStock,
            }}>
            <ThemedText
              style={[
                styles.cartQtyBtnText,
                (atMaxStock || isOutOfStock) && styles.cartQtyBtnTextDisabled,
              ]}>
              +
            </ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.cartRemoveBtn,
              pressed && styles.cartRemoveBtnPressed,
            ]}
            onPress={() => void handleCartRemove(item.productId)}
            disabled={isPending}
            accessibilityLabel={`Hapus ${item.product.name}`}
            accessibilityRole="button"
            accessibilityState={{ disabled: isPending }}>
            {isPending ? (
              <ActivityIndicator size="small" color={Luminous.onErrorContainer} />
            ) : (
              <ThemedText style={styles.cartRemoveBtnText} type="labelSm">
                Hapus
              </ThemedText>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  const bottomBarHeight = Math.max(insets.bottom, 12) + 60;

  return (
    <View ref={screenRef} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="headlineLg" style={styles.headerTitle}>
            Keranjang
          </ThemedText>
          {!isLoading && !error && (
            <ThemedText type="bodyMd" style={styles.headerCount}>
              {searchQuery.trim()
                ? `${filteredProducts.length} dari ${products.length} produk`
                : `${products.length} produk`}
            </ThemedText>
          )}
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
              Memuat keranjang...
            </ThemedText>
          </View>
        )}

        {!isLoading && error && (
          <View style={styles.center}>
            <ThemedText type="bodyMd" style={styles.errorText}>
              {error}
            </ThemedText>
            <Pressable
              style={({ pressed }) => [
                styles.retryBtn,
                pressed && styles.retryBtnPressed,
              ]}
              onPress={() => void fetchData()}>
              <ThemedText type="labelMd" style={styles.retryBtnText}>
                Coba Lagi
              </ThemedText>
            </Pressable>
          </View>
        )}

        {mutationError && (
          <View style={styles.mutationErrorBox}>
            <ThemedText type="bodyMd" style={styles.mutationErrorText}>
              {mutationError}
            </ThemedText>
          </View>
        )}

        {!isLoading && !error && products.length === 0 && (
          <View style={styles.center}>
            <ThemedText type="bodyLg" style={styles.emptyText}>
              Belum ada produk.
            </ThemedText>
            <ThemedText type="bodyMd" style={styles.emptySubtext}>
              Tambah produk dari halaman Produk.
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

        {!isLoading && !error && filteredProducts.map((p) => renderProduct(p))}

        <View style={{ height: bottomBarHeight + 16 }} />
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}>
        <Animated.View
          ref={ctaRef}
          style={{ transform: [{ scale: ctaScale }] }}>
          <Pressable
            style={({ pressed }) => [
              styles.ctaBtn,
              pressed && styles.ctaBtnPressed,
            ]}
            onPress={() => setModalVisible(true)}
            accessibilityLabel={`Lihat Keranjang, ${distinctSelectedCount} item dipilih`}
            accessibilityRole="button"
            accessibilityState={{ disabled: false }}>
            <ThemedText type="labelMd" style={styles.ctaBtnText}>
              Lihat Keranjang ({distinctSelectedCount})
            </ThemedText>
            {total > 0 && (
              <ThemedText type="bodyMd" style={styles.ctaTotalText}>
                {formatRupiah(total)}
              </ThemedText>
            )}
          </Pressable>
        </Animated.View>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={closeModal}
            accessibilityLabel="Tutup dialog"
            accessibilityRole="button"
          />
          <View
            style={[
              styles.modalContent,
              { paddingBottom: Math.max(insets.bottom, 16) + 20 },
            ]}>
            <View style={styles.modalHandle} />
            <ThemedText type="headlineMd" style={styles.modalTitle}>
              Keranjang Belanja
            </ThemedText>

            {mutationError && (
              <View style={styles.mutationErrorBox}>
                <ThemedText type="bodyMd" style={styles.mutationErrorText}>
                  {mutationError}
                </ThemedText>
              </View>
            )}

            {cartItems.length === 0 ? (
              <View style={styles.emptyCartContainer}>
                <ThemedText type="bodyLg" style={styles.emptyCartText}>
                  Keranjang kosong
                </ThemedText>
                <ThemedText type="bodyMd" style={styles.emptyCartSubtext}>
                  Tap &ldquo;Tambah ke Keranjang&rdquo; pada produk untuk memulai.
                </ThemedText>
              </View>
            ) : (
              <>
                <ScrollView
                  style={styles.cartList}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled">
                  {cartItems.map((item) => renderCartItem(item))}
                </ScrollView>

                <View style={styles.cartTotalRow}>
                  <ThemedText type="headlineMd" style={styles.cartTotalLabel}>
                    Total
                  </ThemedText>
                  <ThemedText type="headlineMd" style={styles.cartTotalValue}>
                    {formatRupiah(total)}
                  </ThemedText>
                </View>

                <View style={styles.paymentSection}>
                  <ThemedText type="bodyMd" style={styles.paymentLabel}>
                    Jumlah Dibayar
                  </ThemedText>
                  <TextInput
                    style={styles.paymentInput}
                    keyboardType="number-pad"
                    placeholder="Masukkan nominal"
                    placeholderTextColor={Luminous.outline}
                    value={paymentInput}
                    onChangeText={(t) => setPaymentInput(t.replace(/\D/g, ''))}
                    accessibilityLabel="Jumlah uang yang dibayar customer"
                  />
                  {paymentInput !== '' && (
                    <View
                      style={[
                        styles.paymentResult,
                        paid < total
                          ? styles.paymentResultError
                          : styles.paymentResultSuccess,
                      ]}>
                      <ThemedText
                        type="bodyMd"
                        style={[
                          styles.paymentResultText,
                          {
                            color:
                              paid < total
                                ? Luminous.onErrorContainer
                                : Luminous.onSuccessContainer,
                          },
                        ]}>
                        {paid < total
                          ? `Kekurangan ${formatRupiah(total - paid)}`
                          : `Kembalian ${formatRupiah(paid - total)}`}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {flyingChip && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Animated.View
            style={[
              styles.flyingChip,
              {
                transform: [
                  { translateX: chipX },
                  { translateY: chipY },
                  { scale: chipScale },
                ],
                opacity: chipOpacity,
              },
            ]}>
            <ThemedText
              style={styles.flyingChipText}
              type="labelSm"
              numberOfLines={1}>
              {flyingChip.name}
            </ThemedText>
          </Animated.View>
        </View>
      )}
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
  mutationErrorBox: {
    backgroundColor: Luminous.errorContainer,
    borderRadius: Radius.sm,
    padding: 12,
    marginBottom: 12,
  },
  mutationErrorText: {
    color: Luminous.onErrorContainer,
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
  emptyText: {
    color: Luminous.onSurfaceVariant,
  },
  emptySubtext: {
    color: Luminous.outline,
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
  cardDisabled: {
    opacity: 0.5,
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
  addBtn: {
    minHeight: Spacing.touchTargetMin,
    minWidth: 130,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.DEFAULT,
    paddingHorizontal: 14,
    backgroundColor: Luminous.primary,
    marginLeft: 12,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnPressed: {
    opacity: 0.8,
  },
  addBtnText: {
    color: Luminous.onPrimary,
  },
  addBtnTextDisabled: {
    color: Luminous.onSurfaceVariant,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Luminous.surfaceContainerLowest,
    paddingHorizontal: CARD_MARGIN,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  ctaBtn: {
    height: 52,
    borderRadius: Radius.DEFAULT,
    backgroundColor: Luminous.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ctaBtnPressed: {
    opacity: 0.8,
  },
  ctaBtnText: {
    color: Luminous.onPrimary,
  },
  ctaTotalText: {
    color: Luminous.onPrimary,
    opacity: 0.85,
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
    maxHeight: '80%',
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
  cartList: {
    flexGrow: 1,
  },
  cartItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 12,
    gap: 8,
  },
  cartItemInfo: {
    gap: 2,
  },
  cartItemName: {
    color: Luminous.onSurface,
  },
  cartItemPrice: {
    color: Luminous.onSurfaceVariant,
  },
  cartItemSubtotal: {
    color: Luminous.primary,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartQtyBtn: {
    minWidth: Spacing.touchTargetMin,
    minHeight: Spacing.touchTargetMin,
    borderRadius: Radius.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartQtyBtnMinus: {
    backgroundColor: Luminous.errorContainer,
  },
  cartQtyBtnPlus: {
    backgroundColor: Luminous.primary,
  },
  cartQtyBtnPressed: {
    opacity: 0.8,
  },
  cartQtyBtnDisabled: {
    opacity: 0.4,
  },
  cartQtyBtnText: {
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '600',
    color: Luminous.onPrimary,
  },
  cartQtyBtnTextDisabled: {
    color: Luminous.onSurfaceVariant,
  },
  cartQtyValue: {
    fontSize: 16,
    fontFamily: FontFamilies.semiBold,
    color: Luminous.onSurface,
    minWidth: 24,
    textAlign: 'center',
  },
  cartRemoveBtn: {
    marginLeft: 'auto',
    minHeight: Spacing.touchTargetMin,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    backgroundColor: Luminous.errorContainer,
    justifyContent: 'center',
  },
  cartRemoveBtnPressed: {
    opacity: 0.8,
  },
  cartRemoveBtnText: {
    color: Luminous.onErrorContainer,
  },
  cartTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  cartTotalLabel: {
    color: Luminous.onSurface,
  },
  cartTotalValue: {
    color: Luminous.primary,
  },
  emptyCartContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyCartText: {
    color: Luminous.onSurfaceVariant,
  },
  emptyCartSubtext: {
    color: Luminous.outline,
    textAlign: 'center',
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
  paymentSection: {
    gap: 8,
  },
  paymentLabel: {
    color: Luminous.onSurfaceVariant,
  },
  paymentInput: {
    borderWidth: 1,
    borderColor: Luminous.outline,
    borderRadius: Radius.DEFAULT,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontFamily: FontFamilies.semiBold,
    color: Luminous.onSurface,
    backgroundColor: Luminous.surfaceContainerLowest,
  },
  paymentResult: {
    borderRadius: Radius.sm,
    padding: 12,
  },
  paymentResultError: {
    backgroundColor: Luminous.errorContainer,
  },
  paymentResultSuccess: {
    backgroundColor: Luminous.successContainer,
  },
  paymentResultText: {
    fontFamily: FontFamilies.semiBold,
  },
  flyingChip: {
    position: 'absolute',
    left: -80,
    top: -18,
    width: 160,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Luminous.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  flyingChipText: {
    color: Luminous.onPrimary,
    fontSize: 12,
    fontFamily: FontFamilies.semiBold,
  },
});
