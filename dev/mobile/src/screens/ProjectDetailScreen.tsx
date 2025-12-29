import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { projectsService, ProjectDetail } from '../services/projects.service';
import { theme } from '../../theme.config';
import { ModulesStackParamList } from '../navigation/types';

type ProjectDetailRouteProp = RouteProp<ModulesStackParamList, 'ProjectDetail'>;

export default function ProjectDetailScreen() {
  const route = useRoute<ProjectDetailRouteProp>();
  const navigation = useNavigation();
  const { projectId } = route.params;
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjectDetail();
  }, [projectId]);

  const loadProjectDetail = async () => {
    try {
      setIsLoading(true);
      const data = await projectsService.getProjectDetail(projectId);
      setProject(data);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        (navigation as any).navigate('NoAccess', { resource: 'project detail' });
      } else if (err?.response?.status === 404) {
        (navigation as any).navigate('NotFound', { resource: 'project' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <View style={s.centered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }

  if (!project) {
    return <View style={s.centered}><Text>Project not found</Text></View>;
  }

  return (
    <ScrollView style={s.container}>
      <View style={s.section}>
        <Text style={s.code}>{project.code}</Text>
        <Text style={s.name}>{project.name}</Text>
        <Text style={s.text}>{project.description}</Text>
        <Text style={s.text}>Manager: {project.managerName}</Text>
        <Text style={s.text}>Progress: {project.progress}%</Text>
      </View>

      <View style={s.section}>
        <Text style={s.title}>Milestones ({project.milestones.length})</Text>
        {project.milestones.map(m => (
          <View key={m.id} style={s.item}>
            <Text style={s.itemText}>{m.name} - {m.progress}%</Text>
          </View>
        ))}
      </View>

      <View style={s.section}>
        <Text style={s.title}>Tasks ({project.tasks.length})</Text>
        {project.tasks.map(t => (
          <View key={t.id} style={s.item}>
            <Text style={s.itemText}>{t.title} - {t.status}</Text>
          </View>
        ))}
      </View>

      <View style={s.section}>
        <Text style={s.title}>Team ({project.team.length})</Text>
        {project.team.map(tm => (
          <View key={tm.id} style={s.item}>
            <Text style={s.itemText}>{tm.userName} - {tm.role}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { padding: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  code: { fontSize: 12, color: theme.colors.textSecondary },
  name: { fontSize: 20, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text, marginTop: 4 },
  title: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, marginBottom: 8 },
  text: { fontSize: 14, color: theme.colors.text, marginBottom: 4 },
  item: { padding: 8, backgroundColor: theme.colors.surface, borderRadius: 4, marginBottom: 4 },
  itemText: { fontSize: 14, color: theme.colors.text },
});
