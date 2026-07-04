import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { Device, Session } from '@/types';

interface Props {
  visible: boolean;
  session: Session | null;
  device: Device | null;
  onClose: () => void;
}

export function CloseSessionModal({ visible, session, device, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { closeSession, calcCost } = useApp();
  const [customEndMinutes, setCustomEndMinutes] = useState('');
  const [useCustomEnd, setUseCustomEnd] = useState(false);

  if (!session || !device) return null;

  const now = Date.now();
  const actualEnd = useCustomEnd && customEndMinutes
    ? session.startTime + parseInt(customEndMinutes) * 60 * 1000
    : now;
  const durationMs = actualEnd - session.startTime;
  const durationMin = Math.max(0, Math.round(durationMs / 60000));
  const cost = calcCost(durationMs, session.players, session.hourlyRate, session.extraControllerRate);

  function formatDuration(min: number) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h > 0 && m > 0) return `${h} ساعة و ${m} دقيقة`;
    if (h > 0) return `${h} ساعة`;
    return `${m} دقيقة`;
  }

  function formatTime(ts: number) {
    const d = new Date(ts);
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }

  async function handleClose() {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await closeSession(session!.id, actualEnd);
    setCustomEndMinutes('');
    setUseCustomEnd(false);
    onClose();
  }

  const s = styles(colors, insets);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        <View style={s.container}>
          <View style={s.header}>
            <Text style={s.title}>إغلاق الجلسة</Text>
            <Pressable onPress={onClose} style={s.closeBtn}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <View style={s.body}>
            <View style={s.infoCard}>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>الجهاز</Text>
                <Text style={s.infoValue}>{device.name}</Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>الزبون</Text>
                <Text style={s.infoValue}>{session.customerNote}</Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>اللاعبون</Text>
                <Text style={s.infoValue}>{session.players} لاعبين</Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>بداية</Text>
                <Text style={s.infoValue}>{formatTime(session.startTime)}</Text>
              </View>
            </View>

            <Pressable style={s.toggleCustom} onPress={() => setUseCustomEnd(!useCustomEnd)}>
              <Feather name={useCustomEnd ? 'check-square' : 'square'} size={18} color={colors.primary} />
              <Text style={s.toggleText}>تحديد وقت نهاية مخصص</Text>
            </Pressable>

            {useCustomEnd && (
              <View style={s.customEndRow}>
                <Text style={s.label}>مدة الجلسة بالدقائق</Text>
                <TextInput
                  style={s.input}
                  value={customEndMinutes}
                  onChangeText={setCustomEndMinutes}
                  placeholder="مثال: 45"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  textAlign="right"
                />
              </View>
            )}

            <View style={s.summaryBox}>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>نهاية الجلسة</Text>
                <Text style={s.summaryValue}>{formatTime(actualEnd)}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>المدة الفعلية</Text>
                <Text style={s.summaryValue}>{formatDuration(durationMin)}</Text>
              </View>
              <View style={[s.summaryRow, s.totalRow]}>
                <Text style={s.totalLabel}>المبلغ الإجمالي</Text>
                <Text style={s.totalValue}>{cost} ل.س</Text>
              </View>
            </View>
          </View>

          <View style={s.footer}>
            <Pressable style={s.cancelBtn} onPress={onClose}>
              <Text style={s.cancelText}>إلغاء</Text>
            </Pressable>
            <Pressable style={s.closeSessionBtn} onPress={handleClose}>
              <Feather name="stop-circle" size={18} color="#fff" />
              <Text style={s.closeSessionText}>إغلاق الجلسة</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = (colors: ReturnType<typeof useColors>, insets: ReturnType<typeof useSafeAreaInsets>) =>
  StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1, backgroundColor: colors.background, paddingBottom: insets.bottom + 16 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      paddingTop: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.text },
    closeBtn: { padding: 8, borderRadius: 20, backgroundColor: colors.secondary },
    body: { flex: 1, padding: 20, gap: 16 },
    infoCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      gap: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    infoLabel: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.mutedForeground },
    infoValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.text },
    toggleCustom: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    toggleText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.text },
    customEndRow: { gap: 8 },
    label: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.mutedForeground },
    input: {
      backgroundColor: colors.input,
      borderRadius: 10,
      padding: 14,
      fontSize: 16,
      fontFamily: 'Inter_400Regular',
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryBox: {
      backgroundColor: colors.secondary,
      borderRadius: 12,
      padding: 16,
      gap: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.mutedForeground },
    summaryValue: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.text },
    totalRow: { paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
    totalLabel: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.text },
    totalValue: { fontSize: 22, fontFamily: 'Inter_700Bold', color: colors.statusActive },
    footer: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    cancelBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: colors.secondary, alignItems: 'center' },
    cancelText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.mutedForeground },
    closeSessionBtn: {
      flex: 2,
      padding: 16,
      borderRadius: 12,
      backgroundColor: colors.destructive,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    closeSessionText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  });
