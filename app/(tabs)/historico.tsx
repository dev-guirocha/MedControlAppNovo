import React, { useState, useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, FlatList, ActivityIndicator } from 'react-native';
import { useDoseHistoryStore } from '@/hooks/useDoseHistoryStore';
import { colors, getFontSize, spacing } from '@/constants/theme';
import { DoseHistory } from '@/types/medication';
import { CheckCircle2, XCircle, CalendarClock } from 'lucide-react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import type { Theme } from 'react-native-calendars/src/types';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Text } from '@/components/StyledText';

LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  dayNamesShort: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'],
  today: "Hoje"
};
LocaleConfig.defaultLocale = 'pt-br';

const HistoryItem = ({ item, fontSize }: { item: DoseHistory, fontSize: any }) => {
  const isTaken = item.status === 'taken';
  const isSkipped = item.status === 'skipped';
  const statusLabel = isTaken ? 'Tomada' : isSkipped ? 'Pulada' : 'Pendente';
  const statusStyle = isTaken ? styles.badgeSuccess : isSkipped ? styles.badgeDanger : styles.badgeNeutral;

  return (
    <View style={styles.itemContainer}>
      <View style={styles.iconContainer}>
        {isTaken ? <CheckCircle2 size={24} color={colors.success} /> : <XCircle size={24} color={colors.danger} />}
      </View>
      <View style={styles.itemDetails}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemName, { fontSize: fontSize.md }]}>{item.medicationName}</Text>
          <View style={[styles.statusBadge, statusStyle]}>
            <Text style={styles.statusBadgeText}>{statusLabel}</Text>
          </View>
        </View>
        <Text style={[styles.itemTime, { fontSize: fontSize.sm }]}>
          Agendado para: {new Date(item.scheduledTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
        {item.takenTime && (
          <Text style={[styles.itemTime, { fontSize: fontSize.sm }]}>Registrado às: {new Date(item.takenTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
        )}
      </View>
    </View>
  );
};

export default function HistoryScreen() {
  const { doseHistory } = useDoseHistoryStore();
  const { fontScale } = useAuthStore();
  const fontSize = getFontSize(fontScale);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const markedDates = useMemo(() => {
    const markings: { [key: string]: any } = {};
    const historyByDay: { [key: string]: DoseHistory[] } = {};

    doseHistory.forEach(item => {
      if (item.scheduledTime && !isNaN(Date.parse(item.scheduledTime))) {
        const date = new Date(item.scheduledTime).toISOString().split('T')[0];
        if (!historyByDay[date]) historyByDay[date] = [];
        historyByDay[date].push(item);
      }
    });

    for (const date in historyByDay) {
      const dayItems = historyByDay[date];
      const allTaken = dayItems.every(item => item.status === 'taken');
      const anyTaken = dayItems.some(item => item.status === 'taken');

      let dotColor = colors.danger;
      if (allTaken) dotColor = colors.success;
      else if (anyTaken) dotColor = colors.warning;

      markings[date] = { marked: true, dotColor };
    }
    
    if (markings[selectedDate]) {
        markings[selectedDate].selected = true;
        markings[selectedDate].selectedColor = colors.primary;
    } else {
        markings[selectedDate] = { selected: true, selectedColor: colors.primary };
    }

    return markings;
  }, [doseHistory, selectedDate]);

  const selectedDayHistory = useMemo(() => {
      return doseHistory.filter(item => {
          return item.scheduledTime && !isNaN(Date.parse(item.scheduledTime)) && new Date(item.scheduledTime).toISOString().split('T')[0] === selectedDate;
      }).sort((a,b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime());
  }, [doseHistory, selectedDate]);
  
  const calendarTheme: Theme = {
      backgroundColor: colors.background,
      calendarBackground: colors.background,
      textSectionTitleColor: colors.textSecondary,
      selectedDayBackgroundColor: colors.primary,
      selectedDayTextColor: '#ffffff',
      todayTextColor: colors.primary,
      dayTextColor: colors.text,
      dotColor: colors.primary,
      selectedDotColor: '#ffffff',
      arrowColor: colors.primary,
      monthTextColor: colors.primary,
      indicatorColor: colors.primary,
      textDayFontWeight: '500',
      textMonthFontWeight: 'bold',
      textDayHeaderFontWeight: '600',
      textDayFontSize: 16,
      textMonthFontSize: 18,
      textDayHeaderFontSize: 14,
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Calendar
        onDayPress={day => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        theme={calendarTheme}
      />
      
      {selectedDayHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <CalendarClock size={48} color={colors.disabled} />
          <Text style={[styles.emptyTitle, { fontSize: fontSize.lg }]}>Nenhum registro para este dia</Text>
        </View>
      ) : (
        <FlatList
            data={selectedDayHistory}
            keyExtractor={(item) => item.id}
            renderItem={({item}) => <HistoryItem item={item} fontSize={fontSize} />}
            contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: spacing.lg },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyTitle: { fontWeight: '600', color: colors.textSecondary, marginTop: spacing.lg },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    marginRight: spacing.md,
  },
  itemDetails: {
    flex: 1,
  },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  itemName: {
    fontWeight: '600',
    color: colors.text,
  },
  itemTime: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statusBadge: { borderRadius: 12, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  statusBadgeText: { fontSize: 12, fontWeight: '600', color: colors.background },
  badgeSuccess: { backgroundColor: colors.success },
  badgeDanger: { backgroundColor: colors.danger },
  badgeNeutral: { backgroundColor: colors.textSecondary },
});
