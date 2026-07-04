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
import { AddSessionModal } from '@/components/AddSessionModal';
import { CloseSessionModal } from '@/components/CloseSessionModal';
import { DeviceCard } from '@/components/DeviceCard';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { Device, Session } from '@/types';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { devices, getActiveSession, deleteSession } = useApp();

  const [sessionModalDevice, setSessionModalDevice] = useState<Device | null>(null);
  const [closeModalSession, setCloseModalSession] = useState<Session | null>(null);
  const [closeModalDevice, setCloseModalDevice] = useState<Device | null>(null);

  function handleDevicePress(device: Device) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const activeSession = getActiveSession(device.id);
    if (activeSession) {
      setCloseModalSession(activeSession);
      setCloseModalDevice(device);
    } else {
      setSessionModalDevice(device);
    }
  }

  function handleDeviceLongPress(device: Device) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const activeSession = getActiveSession(device.id);
    if (activeSession) {
      Alert.alert(
        'خيارات الجلسة',
        `جلسة "${activeSession.customerNote}" على ${device.name}`,
        [
          {
            text: 'إغلاق الجلسة',
            style: 'destructive',
            onPress: () => {
              setCloseModalSession(activeSession);
              setCloseModalDevice(device);
            },
          },
          {
            text: 'حذف الجلسة',
            style: 'destructive',
            onPress: () => confirmDeleteSession(activeSession.id),
          },
          { text: 'إلغاء', style: 'cancel' },
        ]
      );
    }
  }

  function confirmDeleteSession(sessionId: string) {
    Alert.alert('حذف الجلسة', 'هل أنت متأكد من حذف هذه الجلسة؟', [
      { text: 'حذف', style: 'destructive', onPress: () => deleteSession(sessionId) },
      { text: 'إلغاء', style: 'cancel' },
    ]);
  }

  const activeSessions = devices.filter(d => !!getActiveSession(d.id)).length;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const s = styles(colors);

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Text style={s.title}>صالة البلايستيشن</Text>
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <View style={[s.statDot, { backgroundColor: colors.statusActive }]} />
            <Text style={s.statText}>{activeSessions} نشط</Text>
          </View>
          <View style={s.statItem}>
            <View style={[s.statDot, { backgroundColor: colors.statusAvailable }]} />
            <Text style={s.statText}>{devices.length - activeSessions} متاح</Text>
          </View>
        </View>
      </View>

      {devices.length === 0 ? (
        <View style={s.emptyState}>
          <Feather name="monitor" size={56} color={colors.mutedForeground} style={{ opacity: 0.4 }} />
          <Text style={s.emptyTitle}>لا توجد أجهزة</Text>
          <Text style={s.emptySubtitle}>أضف أجهزتك من تبويب "الأجهزة"</Text>
        </View>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={d => d.id}
          numColumns={2}
          contentContainerStyle={s.grid}
          columnWrapperStyle={s.row}
          renderItem={({ item }) => (
            <View style={s.cardWrapper}>
              <DeviceCard
                device={item}
                onPress={() => handleDevicePress(item)}
                onLongPress={() => handleDeviceLongPress(item)}
              />
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      <AddSessionModal
        visible={!!sessionModalDevice}
        device={sessionModalDevice}
        onClose={() => setSessionModalDevice(null)}
      />

      <CloseSessionModal
        visible={!!closeModalSession}
        session={closeModalSession}
        device={closeModalDevice}
        onClose={() => {
          setCloseModalSession(null);
          setCloseModalDevice(null);
        }}
      />
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: { fontSize: 26, fontFamily: 'Inter_700Bold', color: colors.text, textAlign: 'right' },
    statsRow: { flexDirection: 'row', gap: 16, marginTop: 6, justifyContent: 'flex-end' },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    statDot: { width: 8, height: 8, borderRadius: 4 },
    statText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.mutedForeground },
    grid: { padding: 12, paddingBottom: 100 },
    row: { gap: 12, marginBottom: 12 },
    cardWrapper: { flex: 1 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.mutedForeground },
    emptySubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.mutedForeground + '99' },
  });
