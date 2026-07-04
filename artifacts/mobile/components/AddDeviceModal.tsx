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
  device?: Device;
  onClose: () => void;
}

export function AddDeviceModal({ visible, device, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addDevice, updateDevice } = useApp();

  const [name, setName] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [extraControllerRate, setExtraControllerRate] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('4');

  useEffect(() => {
    if (device) {
      setName(device.name);
      setHourlyRate(device.hourlyRate.toString());
      setExtraControllerRate(device.extraControllerRate.toString());
      setMaxPlayers(device.maxPlayers.toString());
    } else {
      setName('');
      setHourlyRate('');
      setExtraControllerRate('');
      setMaxPlayers('4');
    }
  }, [device, visible]);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم الجهاز');
      return;
    }
    const rate = parseFloat(hourlyRate);
    if (!rate || rate <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال سعر ساعة صحيح');
      return;
    }
    const extraRate = parseFloat(extraControllerRate) || 0;
    const mp = parseInt(maxPlayers) || 4;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (device) {
      await updateDevice({ ...device, name: name.trim(), hourlyRate: rate, extraControllerRate: extraRate, maxPlayers: mp });
    } else {
      await addDevice({ name: name.trim(), hourlyRate: rate, extraControllerRate: extraRate, maxPlayers: mp });
    }
    onClose();
  }

  const s = styles(colors, insets);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        <View style={s.container}>
          <View style={s.header}>
            <Text style={s.title}>{device ? 'تعديل الجهاز' : 'إضافة جهاز'}</Text>
            <Pressable onPress={onClose} style={s.closeBtn}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView style={s.form} keyboardShouldPersistTaps="handled">
            <Text style={s.label}>اسم الجهاز</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="مثال: PS 1"
              placeholderTextColor={colors.mutedForeground}
            />

            <Text style={s.label}>سعر الساعة (للاعب أو لاعبين)</Text>
            <TextInput
              style={s.input}
              value={hourlyRate}
              onChangeText={setHourlyRate}
              placeholder="مثال: 60"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
            />

            <Text style={s.label}>سعر كل يد إضافية / ساعة</Text>
            <TextInput
              style={s.input}
              value={extraControllerRate}
              onChangeText={setExtraControllerRate}
              placeholder="مثال: 30"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
            />

            <Text style={s.label}>أقصى عدد لاعبين</Text>
            <View style={s.playerRow}>
              {['2', '3', '4', '5', '6'].map(n => (
                <Pressable
                  key={n}
                  style={[s.playerBtn, maxPlayers === n && s.playerBtnActive]}
                  onPress={() => setMaxPlayers(n)}
                >
                  <Text style={[s.playerBtnText, maxPlayers === n && s.playerBtnTextActive]}>{n}</Text>
                </Pressable>
              ))}
            </View>

            <View style={s.pricingNote}>
              <Feather name="info" size={14} color={colors.mutedForeground} />
              <Text style={s.pricingNoteText}>
                {'1-2 لاعب: السعر الأساسي\n3 لاعبين: +يد إضافية\n4 لاعبين: +يدين إضافيتين'}
              </Text>
            </View>
          </ScrollView>

          <View style={s.footer}>
            <Pressable style={s.cancelBtn} onPress={onClose}>
              <Text style={s.cancelText}>إلغاء</Text>
            </Pressable>
            <Pressable style={s.saveBtn} onPress={handleSave}>
              <Text style={s.saveText}>{device ? 'حفظ التعديلات' : 'إضافة الجهاز'}</Text>
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
      textAlign: 'right',
    },
    playerRow: { flexDirection: 'row', gap: 8 },
    playerBtn: {
      flex: 1,
      padding: 12,
      borderRadius: 10,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    playerBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    playerBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.mutedForeground },
    playerBtnTextActive: { color: '#fff' },
    pricingNote: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: colors.secondary,
      padding: 12,
      borderRadius: 10,
      marginTop: 20,
    },
    pricingNoteText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.mutedForeground, flex: 1, lineHeight: 20, textAlign: 'right' },
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
    saveBtn: { flex: 2, padding: 16, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' },
    saveText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  });
