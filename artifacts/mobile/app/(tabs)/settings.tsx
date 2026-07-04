import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
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

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, sessions, devices } = useApp();

  const [yellowMinutes, setYellowMinutes] = useState(settings.yellowWarningMinutes.toString());
  const [redMinutes, setRedMinutes] = useState(settings.redWarningMinutes.toString());

  useEffect(() => {
    setYellowMinutes(settings.yellowWarningMinutes.toString());
    setRedMinutes(settings.redWarningMinutes.toString());
  }, [settings]);

  async function handleSave() {
    const y = parseInt(yellowMinutes);
    const r = parseInt(redMinutes);
    if (!y || y <= 0 || !r || r <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال قيم صحيحة');
      return;
    }
    if (r >= y) {
      Alert.alert('خطأ', 'يجب أن يكون التحذير الأصفر أكبر من الأحمر');
      return;
    }
    await updateSettings({ yellowWarningMinutes: y, redWarningMinutes: r });
    Alert.alert('تم', 'تم حفظ الإعدادات');
  }

  const closedSessions = sessions.filter(s => s.status === 'closed');

  const totalRevenue = closedSessions.reduce((sum, s) => {
    const endTime = s.actualEndTime ?? s.scheduledEndTime ?? (s.startTime + 3600000);
    const durationMs = Math.max(0, endTime - s.startTime);
    const hours = durationMs / 3600000;
    const extraControllers = Math.max(0, s.players - 2);
    const effectiveRate = s.hourlyRate + extraControllers * s.extraControllerRate;
    return sum + Math.ceil(hours * effectiveRate);
  }, 0);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const s = styles(colors);

  return (
    <ScrollView
      style={[s.container, { paddingTop: topPad }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.title}>الإعدادات</Text>

      <View style={s.section}>
        <Text style={s.sectionTitle}>تنبيهات الوقت</Text>
        <View style={s.settingCard}>
          <View style={s.settingRow}>
            <View style={[s.colorDot, { backgroundColor: colors.statusWarning }]} />
            <Text style={s.settingLabel}>تحذير أصفر (دقيقة)</Text>
          </View>
          <TextInput
            style={s.input}
            value={yellowMinutes}
            onChangeText={setYellowMinutes}
            keyboardType="numeric"
            textAlign="right"
            placeholderTextColor={colors.mutedForeground}
          />
          <Text style={s.settingHint}>يصبح لون الجهاز أصفر قبل هذه المدة من نهاية الجلسة</Text>

          <View style={[s.settingRow, { marginTop: 16 }]}>
            <View style={[s.colorDot, { backgroundColor: colors.statusDanger }]} />
            <Text style={s.settingLabel}>تحذير أحمر (دقيقة)</Text>
          </View>
          <TextInput
            style={s.input}
            value={redMinutes}
            onChangeText={setRedMinutes}
            keyboardType="numeric"
            textAlign="right"
            placeholderTextColor={colors.mutedForeground}
          />
          <Text style={s.settingHint}>يصبح لون الجهاز أحمر قبل هذه المدة من نهاية الجلسة</Text>

          <Pressable style={s.saveBtn} onPress={handleSave}>
            <Feather name="save" size={16} color="#fff" />
            <Text style={s.saveBtnText}>حفظ الإعدادات</Text>
          </Pressable>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>ملخص الجلسات</Text>
        <View style={s.statsGrid}>
          <View style={s.statCard}>
            <Feather name="monitor" size={24} color={colors.primary} />
            <Text style={s.statValue}>{devices.length}</Text>
            <Text style={s.statLabel}>جهاز</Text>
          </View>
          <View style={s.statCard}>
            <Feather name="check-circle" size={24} color={colors.statusActive} />
            <Text style={s.statValue}>{closedSessions.length}</Text>
            <Text style={s.statLabel}>جلسة مكتملة</Text>
          </View>
          <View style={s.statCard}>
            <Feather name="dollar-sign" size={24} color={colors.statusWarning} />
            <Text style={s.statValue}>{totalRevenue}</Text>
            <Text style={s.statLabel}>ل.س إجمالي</Text>
          </View>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>دليل الألوان</Text>
        <View style={s.colorGuide}>
          {[
            { color: colors.statusAvailable, label: 'الجهاز متاح' },
            { color: colors.statusActive, label: 'جلسة نشطة' },
            { color: colors.statusWarning, label: `أقل من ${settings.yellowWarningMinutes} دقيقة` },
            { color: colors.statusDanger, label: `أقل من ${settings.redWarningMinutes} دقائق` },
            { color: colors.statusExpired, label: 'انتهت الجلسة' },
          ].map(item => (
            <View key={item.label} style={s.colorRow}>
              <View style={[s.colorSquare, { backgroundColor: item.color }]} />
              <Text style={s.colorLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, gap: 24, paddingBottom: 120 },
    title: { fontSize: 26, fontFamily: 'Inter_700Bold', color: colors.text, textAlign: 'right' },
    section: { gap: 12 },
    sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.mutedForeground, textAlign: 'right' },
    settingCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    settingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    colorDot: { width: 12, height: 12, borderRadius: 6 },
    settingLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.text },
    settingHint: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.mutedForeground, textAlign: 'right' },
    input: {
      backgroundColor: colors.input,
      borderRadius: 10,
      padding: 12,
      fontSize: 16,
      fontFamily: 'Inter_500Medium',
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      padding: 14,
      borderRadius: 10,
      marginTop: 8,
    },
    saveBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
    statsGrid: { flexDirection: 'row', gap: 12 },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: { fontSize: 24, fontFamily: 'Inter_700Bold', color: colors.text },
    statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.mutedForeground, textAlign: 'center' },
    colorGuide: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    colorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    colorSquare: { width: 20, height: 20, borderRadius: 6 },
    colorLabel: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.text },
  });
