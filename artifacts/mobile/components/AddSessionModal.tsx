import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { Device } from '@/types';

interface Props {
  visible: boolean;
  device: Device | null;
  onClose: () => void;
}

type TimeMode = 'open' | 'fixed' | 'byAmount';

const PRESET_DURATIONS = [
  { label: '30 دقيقة', minutes: 30 },
  { label: '45 دقيقة', minutes: 45 },
  { label: 'ساعة', minutes: 60 },
  { label: 'ساعة و نص', minutes: 90 },
  { label: 'ساعتين', minutes: 120 },
];

export function AddSessionModal({ visible, device, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addSession, calcEffectiveRate, calcCost } = useApp();

  const [customerNote, setCustomerNote] = useState('');
  const [players, setPlayers] = useState(1);
  const [timeMode, setTimeMode] = useState<TimeMode>('open');
  const [fixedMinutes, setFixedMinutes] = useState<number | null>(null);
  const [customMinutes, setCustomMinutes] = useState('');
  const [amountPaid, setAmountPaid] = useState('');

  useEffect(() => {
    if (visible) {
      setCustomerNote('');
      setPlayers(1);
      setTimeMode('open');
      setFixedMinutes(null);
      setCustomMinutes('');
      setAmountPaid('');
    }
  }, [visible]);

  if (!device) return null;

  const maxP = device.maxPlayers;
  const effectiveRate = calcEffectiveRate(players, device.hourlyRate, device.extraControllerRate);

  function getDurationMinutes(): number | null {
    if (timeMode === 'open') return null;
    if (timeMode === 'fixed') {
      if (fixedMinutes) return fixedMinutes;
      const custom = parseInt(customMinutes);
      if (custom > 0) return custom;
      return null;
    }
    if (timeMode === 'byAmount') {
      const amount = parseFloat(amountPaid);
      if (!amount || amount <= 0 || effectiveRate <= 0) return null;
      return Math.round((amount / effectiveRate) * 60);
    }
    return null;
  }

  const durationMinutes = getDurationMinutes();
  const totalCost = durationMinutes !== null
    ? calcCost(durationMinutes * 60 * 1000, players, device.hourlyRate, device.extraControllerRate)
    : null;

  function formatDuration(minutes: number) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h} ساعة و ${m} دقيقة`;
    if (h > 0) return `${h} ساعة`;
    return `${m} دقيقة`;
  }

  async function handleStart() {
    const dur = getDurationMinutes();
    if (timeMode !== 'open' && !dur) {
      Alert.alert('خطأ', 'يرجى تحديد المدة أو المبلغ المدفوع');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const startTime = Date.now();
    const scheduledEndTime = dur ? startTime + dur * 60 * 1000 : undefined;

    await addSession({
      deviceId: device.id,
      customerNote: customerNote.trim() || 'زبون',
      players,
      startTime,
      isOpen: timeMode === 'open',
      scheduledEndTime,
      hourlyRate: device.hourlyRate,
      extraControllerRate: device.extraControllerRate,
    });
    onClose();
  }

  const s = styles(colors, insets);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        <View style={s.container}>
          <View style={s.header}>
            <View>
              <Text style={s.title}>جلسة جديدة</Text>
              <Text style={s.subtitle}>{device.name}</Text>
            </View>
            <Pressable onPress={onClose} style={s.closeBtn}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView style={s.form} keyboardShouldPersistTaps="handled">
            <Text style={s.label}>ملاحظة / اسم الزبون</Text>
            <TextInput
              style={s.input}
              value={customerNote}
              onChangeText={setCustomerNote}
              placeholder="اختياري..."
              placeholderTextColor={colors.mutedForeground}
              textAlign="right"
            />

            <Text style={s.label}>عدد اللاعبين</Text>
            <View style={s.playerRow}>
              {Array.from({ length: maxP }, (_, i) => i + 1).map(n => (
                <Pressable
                  key={n}
                  style={[s.playerBtn, players === n && s.playerBtnActive]}
                  onPress={() => setPlayers(n)}
                >
                  <Feather name="user" size={14} color={players === n ? '#fff' : colors.mutedForeground} />
                  <Text style={[s.playerBtnText, players === n && s.playerBtnTextActive]}>{n}</Text>
                </Pressable>
              ))}
            </View>

            <View style={s.rateBox}>
              <Feather name="dollar-sign" size={14} color={colors.primary} />
              <Text style={s.rateText}>
                {effectiveRate} / ساعة
                {players > 2 && ` (${device.hourlyRate} + ${players - 2} × ${device.extraControllerRate})`}
              </Text>
            </View>

            <Text style={s.label}>نوع الوقت</Text>
            <View style={s.modeRow}>
              {(['open', 'fixed', 'byAmount'] as TimeMode[]).map(mode => {
                const labels = { open: '⏱ مفتوح', fixed: '⏰ محدد', byAmount: '💵 بالمبلغ' };
                return (
                  <Pressable
                    key={mode}
                    style={[s.modeBtn, timeMode === mode && s.modeBtnActive]}
                    onPress={() => setTimeMode(mode)}
                  >
                    <Text style={[s.modeBtnText, timeMode === mode && s.modeBtnTextActive]}>
                      {labels[mode]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {timeMode === 'fixed' && (
              <View>
                <View style={s.presetsGrid}>
                  {PRESET_DURATIONS.map(p => (
                    <Pressable
                      key={p.minutes}
                      style={[s.presetBtn, fixedMinutes === p.minutes && s.presetBtnActive]}
                      onPress={() => { setFixedMinutes(p.minutes); setCustomMinutes(''); }}
                    >
                      <Text style={[s.presetText, fixedMinutes === p.minutes && s.presetTextActive]}>
                        {p.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={s.orText}>أو أدخل عدد الدقائق يدوياً</Text>
                <TextInput
                  style={s.input}
                  value={customMinutes}
                  onChangeText={t => { setCustomMinutes(t); setFixedMinutes(null); }}
                  placeholder="مثال: 75"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  textAlign="right"
                />
              </View>
            )}

            {timeMode === 'byAmount' && (
              <View>
                <Text style={s.label}>المبلغ المدفوع</Text>
                <TextInput
                  style={s.input}
                  value={amountPaid}
                  onChangeText={setAmountPaid}
                  placeholder="أدخل المبلغ..."
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  textAlign="right"
                />
              </View>
            )}

            {(durationMinutes !== null || totalCost !== null) && (
              <View style={s.summaryBox}>
                {durationMinutes !== null && (
                  <View style={s.summaryRow}>
                    <Text style={s.summaryLabel}>المدة:</Text>
                    <Text style={s.summaryValue}>{formatDuration(durationMinutes)}</Text>
                  </View>
                )}
                {totalCost !== null && (
                  <View style={s.summaryRow}>
                    <Text style={s.summaryLabel}>التكلفة:</Text>
                    <Text style={[s.summaryValue, { color: colors.statusActive }]}>{totalCost} ل.س</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          <View style={s.footer}>
            <Pressable style={s.cancelBtn} onPress={onClose}>
              <Text style={s.cancelText}>إلغاء</Text>
            </Pressable>
            <Pressable style={s.startBtn} onPress={handleStart}>
              <Feather name="play" size={18} color="#fff" />
              <Text style={s.startText}>بدء الجلسة</Text>
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
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      padding: 20,
      paddingTop: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.text },
    subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.mutedForeground, marginTop: 2 },
    closeBtn: { padding: 8, borderRadius: 20, backgroundColor: colors.secondary },
    form: { flex: 1, padding: 20 },
    label: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.mutedForeground, marginBottom: 8, marginTop: 16 },
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
    playerRow: { flexDirection: 'row', gap: 8 },
    playerBtn: {
      flex: 1,
      padding: 12,
      borderRadius: 10,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    playerBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    playerBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.mutedForeground },
    playerBtnTextActive: { color: '#fff' },
    rateBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.secondary,
      padding: 10,
      borderRadius: 8,
      marginTop: 8,
    },
    rateText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.secondaryForeground },
    modeRow: { flexDirection: 'row', gap: 8 },
    modeBtn: {
      flex: 1,
      padding: 10,
      borderRadius: 10,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    modeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    modeBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.mutedForeground },
    modeBtnTextActive: { color: '#fff' },
    presetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    presetBtn: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: colors.secondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    presetBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    presetText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.mutedForeground },
    presetTextActive: { color: '#fff' },
    orText: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', textAlign: 'center', marginVertical: 8 },
    summaryBox: {
      backgroundColor: colors.secondary,
      borderRadius: 12,
      padding: 14,
      marginTop: 16,
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.mutedForeground },
    summaryValue: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.text },
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
    startBtn: { flex: 2, padding: 16, borderRadius: 12, backgroundColor: colors.statusActive, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
    startText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  });
