import { Feather } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { Device, DeviceStatus, Session } from '@/types';

interface Props {
  device: Device;
  onPress: () => void;
  onLongPress: () => void;
}

export function DeviceCard({ device, onPress, onLongPress }: Props) {
  const colors = useColors();
  const { getActiveSession, settings, calcCost, tick } = useApp();

  const session = getActiveSession(device.id);

  const status: DeviceStatus = useMemo(() => {
    if (!session) return 'available';
    if (session.isOpen) return 'active';
    if (!session.scheduledEndTime) return 'active';
    const now = Date.now();
    const remaining = session.scheduledEndTime - now;
    if (remaining <= 0) return 'expired';
    if (remaining <= settings.redWarningMinutes * 60 * 1000) return 'danger';
    if (remaining <= settings.yellowWarningMinutes * 60 * 1000) return 'warning';
    return 'active';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, settings, tick]);

  const statusColor = {
    available: colors.statusAvailable,
    active: colors.statusActive,
    warning: colors.statusWarning,
    danger: colors.statusDanger,
    expired: colors.statusExpired,
  }[status];

  const timerText = useMemo(() => {
    if (!session) return null;
    const now = Date.now();
    if (session.isOpen) {
      const elapsed = now - session.startTime;
      return { label: 'مضى', value: formatMs(elapsed), isCountdown: false };
    }
    if (!session.scheduledEndTime) return null;
    const remaining = session.scheduledEndTime - now;
    if (remaining <= 0) return { label: 'انتهى', value: '00:00', isCountdown: true };
    return { label: 'متبقي', value: formatMs(remaining), isCountdown: true };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, tick]);

  const currentCost = useMemo(() => {
    if (!session) return null;
    const now = Date.now();
    const actualEnd = session.isOpen ? now : Math.min(now, session.scheduledEndTime ?? now);
    const durationMs = actualEnd - session.startTime;
    return calcCost(durationMs, session.players, session.hourlyRate, session.extraControllerRate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, tick]);

  const s = styles(colors, statusColor);

  return (
    <Pressable
      style={({ pressed }) => [s.card, { opacity: pressed ? 0.85 : 1 }]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={s.topRow}>
        <View style={[s.statusDot, { backgroundColor: statusColor }]} />
        <Text style={s.deviceName} numberOfLines={1}>{device.name}</Text>
      </View>

      {session ? (
        <View style={s.sessionInfo}>
          <Text style={s.customerNote} numberOfLines={1}>{session.customerNote}</Text>
          <View style={s.playersRow}>
            {Array.from({ length: session.players }).map((_, i) => (
              <Feather key={i} name="user" size={10} color={colors.mutedForeground} />
            ))}
          </View>
          {timerText && (
            <View style={s.timerBox}>
              <Text style={s.timerLabel}>{timerText.label}</Text>
              <Text style={[s.timerValue, { color: statusColor }]}>{timerText.value}</Text>
            </View>
          )}
          {currentCost !== null && (
            <Text style={s.cost}>{currentCost} ل.س</Text>
          )}
        </View>
      ) : (
        <View style={s.availableInfo}>
          <Feather name="plus-circle" size={28} color={statusColor} style={{ opacity: 0.8 }} />
          <Text style={s.availableText}>متاح</Text>
          <Text style={s.rate}>{device.hourlyRate} / ساعة</Text>
        </View>
      )}
    </Pressable>
  );
}

function formatMs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const styles = (colors: ReturnType<typeof useColors>, statusColor: string) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 14,
      borderWidth: 2,
      borderColor: statusColor + '40',
      gap: 8,
      minHeight: 150,
      justifyContent: 'space-between',
    },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    deviceName: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.text, flex: 1 },
    sessionInfo: { flex: 1, justifyContent: 'space-between', gap: 6 },
    customerNote: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.secondaryForeground },
    playersRow: { flexDirection: 'row', gap: 3 },
    timerBox: { alignItems: 'flex-start' },
    timerLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', color: colors.mutedForeground, marginBottom: 2 },
    timerValue: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
    cost: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.statusActive },
    availableInfo: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
    availableText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.mutedForeground },
    rate: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.mutedForeground + 'aa' },
  });
