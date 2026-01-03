import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme.config';
import { useCapabilities } from '../hooks/useCapabilities';

export default function FleetHomeScreen() {
  const navigation = useNavigation<any>();
  const { capabilities } = useCapabilities();

  const fleetActions = [
    {
      id: 'inspection',
      title: 'Pre-Start Inspection',
      subtitle: 'Daily vehicle checklist',
      icon: '✓',
      route: 'FleetInspection',
      capability: 'canCreateFleetInspection',
    },
    {
      id: 'breakdown',
      title: 'Report Breakdown',
      subtitle: 'Equipment failure',
      icon: '⚠️',
      route: 'ReportBreakdown',
      capability: 'canReportBreakdown',
    },
    {
      id: 'fuel',
      title: 'Log Fuel',
      subtitle: 'Fuel consumption',
      icon: '⛽',
      route: 'LogFuel',
      capability: 'canLogFuel',
    },
  ];

  const availableActions = fleetActions.filter(
    (action) => !action.capability || capabilities[action.capability]
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Fleet Operations</Text>
        <Text style={styles.subtitle}>Vehicle management and logging</Text>
      </View>

      <View style={styles.grid}>
        {availableActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.card}
            onPress={() => navigation.navigate(action.route)}
          >
            <Text style={styles.icon}>{action.icon}</Text>
            <Text style={styles.cardTitle}>{action.title}</Text>
            <Text style={styles.cardSubtitle}>{action.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  card: {
    width: '50%',
    padding: 8,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
