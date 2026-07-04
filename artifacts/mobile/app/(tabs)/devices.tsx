import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddDeviceModal } from '@/components/AddDeviceModal';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { Device } from '@/types';

export default function DevicesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { devices, deleteDevice, getActiveSession } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | undefined>(undefined);

  function handleEdit(device: Device) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditDevice(device);
    setModalVisible(true);
  }

  function handleAdd() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditDevice(undefined);
    setModalVisible(true);
  }

  function handleDelete(device: Device) {
    const hasSession = !!getActiveSession(device.id);
    Alert.alert(
      'حذف الجهاز',
      hasSession
        ? `"${device.name}" لديه جلسة نشطة. هل تريد حذف الجهاز وجلسته؟`
        : `هل تريد حذف "${device.name}"؟`,
      [
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deleteDevice(device.id);
          },
        },
        { text: 'إلغاء', style: 'cancel' },
      ]
    );
  }

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const s = styles(colors);

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Text style={s.title}>الأجهزة</Text>
        <Pressable style={s.addBtn} onPress={handleAdd}>
          <Feather name="plus" size={20} color="#fff" />
          <Text style={s.addBtnText}>إضافة</Text>
        </Pressable>
      </View>

      {devices.length === 0 ? (
        <View style={s.emptyState}>
          <Feather name="monitor" size={56} color={colors.mutedForeground} style={{ opacity: 0.4 }} />
          <Text style={s.emptyTitle}>لا توجد أجهزة</Text>
          <Text style={s.emptySubtitle}>اضغط "إضافة" لإضافة جهاز جديد</Text>
        </View>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={d => d.id}
          contentContainerStyle={s.list}
          renderItem={({ item }) => {
            const activeSession = getActiveSession(item.id);
            const effectiveRate3 = item.hourlyRate + item.extraControllerRate;
            const effectiveRate4 = item.hourlyRate + 2 * item.extraControllerRate;
            return (
              <View style={s.deviceItem}>
                <View style={s.deviceLeft}>
                  <View style={[s.iconBox, { backgroundColor: activeSession ? colors.statusActive + '22' : colors.secondary }]}>
                    <Feather name="monitor" size={22} color={activeSession ? colors.statusActive : colors.mutedForeground} />
                  </View>
                  <View style={s.deviceInfo}>
                    <View style={s.nameRow}>
                      <Text style={s.deviceName}>{item.name}</Text>
                      {activeSession && (
                        <View style={s.activeBadge}>
                          <Text style={s.activeBadgeText}>نشط</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.deviceRate}>
                      {item.hourlyRate} ل.س / ساعة (1-2 لاعب)
                    </Text>
                    {item.extraControllerRate > 0 && (
                      <Text style={s.deviceRateExtra}>
                        {effectiveRate3} (3 لاعبين) · {effectiveRate4} (4 لاعبين)
                      </Text>
                    )}
                    <Text style={s.maxPlayers}>أقصى {item.maxPlayers} لاعبين</Text>
                  </View>
                </View>
                <View style={s.actions}>
                  <Pressable style={s.actionBtn} onPress={() => handleEdit(item)}>
                    <Feather name="edit-2" size={16} color={colors.primary} />
                  </Pressable>
                  <Pressable style={[s.actionBtn, s.deleteBtn]} onPress={() => handleDelete(item)}>
                    <Feather name="trash-2" size={16} color={colors.destructive} />
                  </Pressable>
                </View>
              </View>
            );
          }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <AddDeviceModal
        visible={modalVisible}
        device={editDevice}
        onClose={() => {
          setModalVisible(false);
          setEditDevice(undefined);
        }}
      />
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: { fontSize: 26, fontFamily: 'Inter_700Bold', color: colors.text },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 10,
    },
    addBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
    list: { padding: 16, gap: 12, paddingBottom: 100 },
    deviceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    deviceLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    iconBox: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    deviceInfo: { flex: 1, gap: 3 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    deviceName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.text },
    activeBadge: { backgroundColor: colors.statusActive + '22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    activeBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.statusActive },
    deviceRate: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.mutedForeground },
    deviceRateExtra: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.mutedForeground + 'aa' },
    maxPlayers: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.mutedForeground + '88' },
    actions: { flexDirection: 'row', gap: 8 },
    actionBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteBtn: { backgroundColor: colors.destructive + '18' },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.mutedForeground },
    emptySubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.mutedForeground + '99' },
  });
