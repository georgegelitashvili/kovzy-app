import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axiosInstance from '../../apiConfig/apiRequests';
import { LanguageContext } from '../Language';
import Loader from '../generate/loader';

function useEditLayout() {
  const { width, height } = useWindowDimensions();
  const isPhone = width < 600;
  const isTablet = width >= 600 && width < 900;
  const isLargeTablet = width >= 900;
  const isLandscape = width > height;

  const sheetMaxWidth = isLargeTablet ? 720 : isTablet ? 600 : width;
  const sheetMaxHeight = isPhone
    ? height * (isLandscape ? 0.92 : 0.9)
    : Math.min(height * 0.86, 780);

  return {
    width,
    height,
    isPhone,
    isTablet,
    isLargeTablet,
    isLandscape,
    sheetMaxWidth,
    sheetMaxHeight,
    padding: isPhone ? 14 : isTablet ? 20 : 24,
    titleSize: isPhone ? 17 : 20,
    bodySize: isPhone ? 14 : 16,
    iconSize: isPhone ? 22 : 26,
    deleteIconSize: isPhone ? 22 : 26,
    qtyHeight: isPhone ? 40 : 48,
    qtyBtnWidth: isPhone ? 40 : 48,
    qtyInputWidth: isPhone ? 68 : 84,
    qtyFontSize: isPhone ? 16 : 18,
    packStack: width < 420,
    footerStack: width < 380,
  };
}

function cloneCart(orderData) {
  return (Array.isArray(orderData) ? orderData : []).map((product) => ({
    id: product.id,
    product_id: product.product_id,
    name: product.name,
    type: product.type,
    amount: Number(product.amount) || 0,
    originalAmount: Number(product.amount) || 0,
    price: Number(product.price) || 0,
    product_price: Number(product.product_price) || 0,
    deleted: false,
    children: (product.children || []).map((child) => ({
      id: child.id,
      product_id: child.product_id,
      name: child.name,
      amount: Number(child.amount) || 0,
      originalAmount: Number(child.amount) || 0,
      price: Number(child.price) || 0,
      product_price: Number(child.product_price) || 0,
      deleted: false,
      customizables: (child.customizables || []).map((cust) => ({
        id: cust.id,
        name: cust.name,
        packs: (cust.packs || []).map((pack) => ({
          id: pack.id,
          name: pack.name,
          quantity: Number(pack.quantity) || 1,
          originalQuantity: Number(pack.quantity) || 1,
          price_modifier: Number(pack.price_modifier) || 0,
          customizable_pack_id: pack.customizable_pack_id,
          parent_id: cust.id,
          deleted: false,
        })),
      })),
    })),
    customizables: (product.customizables || []).map((cust) => ({
      id: cust.id,
      name: cust.name,
      packs: (cust.packs || []).map((pack) => ({
        id: pack.id,
        name: pack.name,
        quantity: Number(pack.quantity) || 1,
        originalQuantity: Number(pack.quantity) || 1,
        price_modifier: Number(pack.price_modifier) || 0,
        customizable_pack_id: pack.customizable_pack_id,
        parent_id: cust.id,
        deleted: false,
      })),
    })),
  }));
}

function estimatePrice(products, initialPrice) {
  let total = Number(initialPrice) || 0;

  products.forEach((product) => {
    const unitPrice =
      product.originalAmount > 0
        ? product.price / product.originalAmount
        : product.price;

    if (product.deleted) {
      total -= product.price;
      return;
    }

    const qtyDelta = product.amount - product.originalAmount;
    total += qtyDelta * unitPrice;

    const allCustomizables = [
      ...(product.customizables || []),
      ...((product.children || []).flatMap((child) =>
        (child.customizables || []).map((cust) => ({
          ...cust,
          childDeleted: child.deleted,
          childAmount: child.amount,
          childOriginalAmount: child.originalAmount,
        }))
      )),
    ];

    (product.children || []).forEach((child) => {
      if (child.deleted) {
        total -= child.price;
      } else {
        const childUnit =
          child.originalAmount > 0
            ? child.price / child.originalAmount
            : child.price;
        total += (child.amount - child.originalAmount) * childUnit;
      }
    });

    allCustomizables.forEach((cust) => {
      if (cust.childDeleted) {
        return;
      }
      (cust.packs || []).forEach((pack) => {
        // Deleted packs contribute 0; delta from original reverses their share of initialPrice
        const effectiveQty = pack.deleted ? 0 : Number(pack.quantity) || 0;
        total +=
          pack.price_modifier * (effectiveQty - pack.originalQuantity);
      });
    });
  });

  return Math.max(0, total);
}

function collectChanges(products) {
  const productPayload = [];
  const collectionItems = [];
  const packs = [];

  products.forEach((product) => {
    productPayload.push({
      id: product.id,
      product_id: product.product_id,
      deleted: product.deleted,
      quantity: product.deleted ? 0 : product.amount,
    });

    (product.children || []).forEach((child) => {
      collectionItems.push({
        id: child.id,
        parent_id: product.id,
        deleted: child.deleted || product.deleted,
        quantity: child.deleted || product.deleted ? 0 : child.amount,
      });

      (child.customizables || []).forEach((cust) => {
        (cust.packs || []).forEach((pack) => {
          packs.push({
            id: pack.id,
            deleted: pack.deleted || child.deleted || product.deleted,
            quantity: pack.deleted || child.deleted || product.deleted ? 0 : pack.quantity,
            parent_id: cust.id,
            customizable_id: cust.id,
            customizable_pack_id: pack.customizable_pack_id,
          });
        });
      });
    });

    (product.customizables || []).forEach((cust) => {
      (cust.packs || []).forEach((pack) => {
        packs.push({
          id: pack.id,
          deleted: pack.deleted || product.deleted,
          quantity: pack.deleted || product.deleted ? 0 : pack.quantity,
          parent_id: cust.id,
          customizable_id: cust.id,
          customizable_pack_id: pack.customizable_pack_id,
        });
      });
    });
  });

  return { products: productPayload, collectionItems, packs };
}

function QuantityControls({ value, disabled, onChange, layout }) {
  const displayValue = Number.isFinite(Number(value)) ? String(value) : '0';
  const iconSize = layout.isPhone ? 18 : 22;

  return (
    <View
      style={[
        styles.qtyRow,
        {
          height: layout.qtyHeight,
          borderRadius: layout.isPhone ? 10 : 12,
        },
        disabled && styles.qtyRowDisabled,
      ]}
    >
      <TouchableOpacity
        style={[
          styles.qtyBtn,
          styles.qtyBtnLeft,
          { width: layout.qtyBtnWidth, height: layout.qtyHeight },
          disabled && styles.disabled,
        ]}
        disabled={disabled}
        activeOpacity={0.7}
        onPress={() => onChange(Math.max(0, Number(value) - 1))}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <MaterialCommunityIcons
          name="minus"
          size={iconSize}
          color={disabled ? '#9aa3af' : '#1f2937'}
        />
      </TouchableOpacity>
      <TextInput
        mode="flat"
        dense
        keyboardType="decimal-pad"
        value={displayValue}
        editable={!disabled}
        underlineColor="transparent"
        activeUnderlineColor="transparent"
        selectionColor="#2fa360"
        style={[
          styles.qtyInput,
          {
            width: layout.qtyInputWidth,
            height: layout.qtyHeight,
          },
        ]}
        contentStyle={[
          styles.qtyInputContent,
          {
            fontSize: layout.qtyFontSize,
            minHeight: layout.qtyHeight,
          },
        ]}
        theme={{
          colors: {
            background: 'transparent',
            onSurfaceVariant: '#6b7280',
            primary: '#2fa360',
          },
          roundness: 0,
        }}
        onChangeText={(text) => {
          const cleaned = text.replace(/[^0-9.]/g, '');
          if (cleaned === '' || cleaned === '.') {
            onChange(0);
            return;
          }
          const next = parseFloat(cleaned);
          onChange(Number.isFinite(next) ? Math.max(0, next) : 0);
        }}
      />
      <TouchableOpacity
        style={[
          styles.qtyBtn,
          styles.qtyBtnRight,
          { width: layout.qtyBtnWidth, height: layout.qtyHeight },
          disabled && styles.disabled,
        ]}
        disabled={disabled}
        activeOpacity={0.7}
        onPress={() => onChange(Number(value) + 1)}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <MaterialCommunityIcons
          name="plus"
          size={iconSize}
          color={disabled ? '#9aa3af' : '#1f2937'}
        />
      </TouchableOpacity>
    </View>
  );
}

export default function OrdersModalEdit({
  visible,
  onClose,
  order,
  orderData,
  currency,
  updateUrl,
  onUpdated,
}) {
  const { dictionary } = useContext(LanguageContext);
  const layout = useEditLayout();
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setProducts(cloneCart(orderData));
    }
  }, [visible, orderData]);

  const initialPrice = Number(order?.price) || 0;
  const estimatedPrice = useMemo(
    () => estimatePrice(products, initialPrice),
    [products, initialPrice]
  );

  const updateProduct = useCallback((productId, updater) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? updater(p) : p))
    );
  }, []);

  const handleSave = useCallback(() => {
    Alert.alert(
      dictionary['general.alerts'] || 'Alert',
      dictionary['orders.confirmUpdateOrder'] ||
        'Are you sure you want to save the changes?',
      [
        { text: dictionary['cancel'] || 'Cancel', style: 'cancel' },
        {
          text: dictionary['okay'] || 'OK',
          onPress: async () => {
            if (!updateUrl || !order?.id) {
              return;
            }
            setSaving(true);
            try {
              const changes = collectChanges(products);
              const response = await axiosInstance.post(updateUrl, {
                orderId: order.id,
                products: JSON.stringify(changes.products),
                collectionItems: JSON.stringify(changes.collectionItems),
                packs: JSON.stringify(changes.packs),
              });

              const payload = response?.data?.data ?? response?.data;
              if (payload?.success) {
                Alert.alert(
                  dictionary['general.alerts'] || 'Alert',
                  dictionary['orders.updateSuccess'] ||
                    'Order was updated successfully'
                );
                onUpdated?.(order.id, payload);
                onClose?.();
              } else {
                Alert.alert(
                  dictionary['general.alerts'] || 'Alert',
                  `${dictionary['orders.updateError'] || 'Failed to update order'}${
                    payload?.message ? `: ${payload.message}` : ''
                  }`
                );
              }
            } catch (error) {
              const message =
                error?.response?.data?.data?.message ||
                error?.response?.data?.message ||
                error?.message;
              Alert.alert(
                dictionary['general.alerts'] || 'Alert',
                `${dictionary['orders.updateError'] || 'Failed to update order'}${
                  message ? `: ${message}` : ''
                }`
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  }, [dictionary, updateUrl, order, products, onUpdated, onClose]);

  const renderPacks = (packs, onPackChange, parentDeleted) =>
    (packs || []).map((pack) => (
      <View
        key={`pack-${pack.id}`}
        style={[
          styles.packRow,
          layout.packStack && styles.packRowStacked,
          (pack.deleted || parentDeleted) && styles.deleted,
        ]}
      >
        <Text
          style={[
            styles.packName,
            { fontSize: layout.bodySize - 1 },
            layout.packStack && styles.packNameStacked,
          ]}
          numberOfLines={2}
        >
          {pack.name} ({pack.price_modifier} {currency})
        </Text>
        <View style={styles.packControls}>
          <QuantityControls
            value={pack.quantity}
            disabled={pack.deleted || parentDeleted}
            onChange={(quantity) => onPackChange(pack.id, { quantity })}
            layout={layout}
          />
          <TouchableOpacity
            style={styles.iconHit}
            onPress={() =>
              onPackChange(
                pack.id,
                pack.deleted
                  ? { deleted: false, quantity: pack.originalQuantity }
                  : { deleted: true, quantity: 0 }
              )
            }
            disabled={parentDeleted}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name={pack.deleted ? 'undo' : 'delete-outline'}
              size={layout.deleteIconSize}
              color={pack.deleted ? '#2fa360' : '#f14c4c'}
            />
          </TouchableOpacity>
        </View>
      </View>
    ));

  return (
    <Modal
      visible={visible}
      animationType={layout.isPhone ? 'slide' : 'fade'}
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.overlay,
            layout.isPhone ? styles.overlayPhone : styles.overlayTablet,
          ]}
        >
          <Pressable style={styles.backdrop} onPress={onClose} />
          <View
            style={[
              styles.sheet,
              layout.isPhone ? styles.sheetPhone : styles.sheetTablet,
              {
                maxWidth: layout.sheetMaxWidth,
                maxHeight: layout.sheetMaxHeight,
                width: layout.isPhone ? '100%' : '92%',
                padding: layout.padding,
              },
            ]}
          >
            {saving && <Loader show />}
            <View style={styles.header}>
              <Text
                style={[styles.title, { fontSize: layout.titleSize }]}
                numberOfLines={1}
              >
                {dictionary['orders.editOrder'] || 'Edit'} #{order?.id}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.iconHit}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={layout.iconSize}
                  color="#333"
                />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.priceRow,
                !layout.isPhone && styles.priceRowTablet,
              ]}
            >
              <Text style={{ fontSize: layout.bodySize }}>
                {dictionary['orders.initialPrice'] || 'Initial Price'}:{' '}
                {initialPrice.toFixed(2)} {currency}
              </Text>
              <Text
                style={[
                  styles.updatedPrice,
                  { fontSize: layout.bodySize },
                ]}
              >
                {dictionary['orders.updatedPrice'] || 'New Price'}:{' '}
                {estimatedPrice.toFixed(2)} {currency}
              </Text>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              {products.map((product) => (
                <View
                  key={`product-${product.id}`}
                  style={[
                    styles.productCard,
                    { padding: layout.isPhone ? 12 : 16 },
                    product.deleted && styles.deleted,
                  ]}
                >
                  <View style={styles.productHeader}>
                    <Text
                      style={[
                        styles.productName,
                        { fontSize: layout.bodySize },
                      ]}
                      numberOfLines={2}
                    >
                      {product.name}
                    </Text>
                    <TouchableOpacity
                      style={styles.iconHit}
                      onPress={() =>
                        updateProduct(product.id, (p) => ({
                          ...p,
                          deleted: !p.deleted,
                        }))
                      }
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialCommunityIcons
                        name={product.deleted ? 'undo' : 'delete-outline'}
                        size={layout.deleteIconSize}
                        color={product.deleted ? '#2fa360' : '#f14c4c'}
                      />
                    </TouchableOpacity>
                  </View>

                  <QuantityControls
                    value={product.amount}
                    disabled={product.deleted}
                    onChange={(amount) =>
                      updateProduct(product.id, (p) => ({ ...p, amount }))
                    }
                    layout={layout}
                  />

                  {(product.children || []).map((child) => (
                    <View
                      key={`child-${child.id}`}
                      style={[
                        styles.childCard,
                        (child.deleted || product.deleted) && styles.deleted,
                      ]}
                    >
                      <View style={styles.productHeader}>
                        <Text
                          style={[
                            styles.childName,
                            { fontSize: layout.bodySize - 1 },
                          ]}
                        >
                          {child.name}
                        </Text>
                        <TouchableOpacity
                          style={styles.iconHit}
                          disabled={product.deleted}
                          onPress={() =>
                            updateProduct(product.id, (p) => ({
                              ...p,
                              children: (p.children || []).map((c) =>
                                c.id === child.id
                                  ? { ...c, deleted: !c.deleted }
                                  : c
                              ),
                            }))
                          }
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <MaterialCommunityIcons
                            name={child.deleted ? 'undo' : 'delete-outline'}
                            size={layout.deleteIconSize - 2}
                            color={child.deleted ? '#2fa360' : '#f14c4c'}
                          />
                        </TouchableOpacity>
                      </View>
                      <QuantityControls
                        value={child.amount}
                        disabled={child.deleted || product.deleted}
                        onChange={(amount) =>
                          updateProduct(product.id, (p) => ({
                            ...p,
                            children: (p.children || []).map((c) =>
                              c.id === child.id ? { ...c, amount } : c
                            ),
                          }))
                        }
                        layout={layout}
                      />
                      {(child.customizables || []).map((cust) => (
                        <View key={`cust-${cust.id}`} style={styles.custBlock}>
                          <Text
                            style={[
                              styles.custName,
                              { fontSize: layout.bodySize - 1 },
                            ]}
                          >
                            {cust.name}
                          </Text>
                          {renderPacks(
                            cust.packs,
                            (packId, patch) =>
                              updateProduct(product.id, (p) => ({
                                ...p,
                                children: (p.children || []).map((c) =>
                                  c.id !== child.id
                                    ? c
                                    : {
                                        ...c,
                                        customizables: (c.customizables || []).map(
                                          (cu) =>
                                            cu.id !== cust.id
                                              ? cu
                                              : {
                                                  ...cu,
                                                  packs: (cu.packs || []).map((pk) =>
                                                    pk.id === packId
                                                      ? { ...pk, ...patch }
                                                      : pk
                                                  ),
                                                }
                                        ),
                                      }
                                ),
                              })),
                            product.deleted || child.deleted
                          )}
                        </View>
                      ))}
                    </View>
                  ))}

                  {(product.customizables || []).map((cust) => (
                    <View key={`pcust-${cust.id}`} style={styles.custBlock}>
                      <Text
                        style={[
                          styles.custName,
                          { fontSize: layout.bodySize - 1 },
                        ]}
                      >
                        {cust.name}
                      </Text>
                      {renderPacks(
                        cust.packs,
                        (packId, patch) =>
                          updateProduct(product.id, (p) => ({
                            ...p,
                            customizables: (p.customizables || []).map((cu) =>
                              cu.id !== cust.id
                                ? cu
                                : {
                                    ...cu,
                                    packs: (cu.packs || []).map((pk) =>
                                      pk.id === packId
                                        ? { ...pk, ...patch }
                                        : pk
                                    ),
                                  }
                            ),
                          })),
                        product.deleted
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>

            <View
              style={[
                styles.footer,
                layout.footerStack && styles.footerStacked,
              ]}
            >
              <Button
                mode="outlined"
                onPress={onClose}
                style={[
                  styles.footerBtn,
                  layout.footerStack && styles.footerBtnStacked,
                ]}
                contentStyle={styles.footerBtnContent}
                labelStyle={{ fontSize: layout.bodySize }}
              >
                {dictionary['cancel'] || 'Cancel'}
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                loading={saving}
                disabled={saving || products.length === 0}
                style={[
                  styles.footerBtn,
                  styles.saveBtn,
                  layout.footerStack && styles.footerBtnStacked,
                ]}
                contentStyle={styles.footerBtnContent}
                labelStyle={{ fontSize: layout.bodySize }}
              >
                {dictionary['save'] || dictionary['okay'] || 'Save'}
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  overlayPhone: {
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  overlayTablet: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: '#fff',
    zIndex: 2,
  },
  sheetPhone: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  sheetTablet: {
    borderRadius: 18,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontWeight: '700',
    marginRight: 12,
  },
  priceRow: {
    marginBottom: 10,
    gap: 4,
  },
  priceRowTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  updatedPrice: {
    fontWeight: '700',
    color: '#2fa360',
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  list: {
    paddingBottom: 12,
  },
  productCard: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    marginBottom: 12,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    flex: 1,
    fontWeight: '700',
    marginRight: 8,
  },
  childCard: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
  },
  childName: {
    flex: 1,
    fontWeight: '600',
  },
  custBlock: {
    marginTop: 8,
  },
  custName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  packRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  packRowStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  packName: {
    flex: 1,
  },
  packNameStacked: {
    marginBottom: 4,
  },
  packControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconHit: {
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
  },
  qtyRowDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  qtyBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2f7',
  },
  qtyBtnLeft: {
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
  },
  qtyBtnRight: {
    borderLeftWidth: 1,
    borderLeftColor: '#d1d5db',
  },
  qtyInput: {
    margin: 0,
    padding: 0,
    backgroundColor: '#fff',
  },
  qtyInputContent: {
    textAlign: 'center',
    fontWeight: '600',
    paddingHorizontal: 4,
    color: '#111827',
  },
  deleted: {
    opacity: 0.45,
  },
  disabled: {
    opacity: 0.55,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  footerStacked: {
    flexDirection: 'column-reverse',
  },
  footerBtn: {
    flex: 1,
  },
  footerBtnStacked: {
    flex: 0,
    width: '100%',
  },
  footerBtnContent: {
    minHeight: 44,
  },
  saveBtn: {
    backgroundColor: '#2fa360',
  },
});
