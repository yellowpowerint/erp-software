import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, TouchableOpacity, Alert } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { documentsService, DocumentItem } from '../services/documents.service';
import { theme } from '../../theme.config';
import { ListRow, Button } from '../components';
import { ModulesStackParamList } from '../navigation/types';

const formatBytes = (bytes?: number) => {
  if (!bytes) return '—';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${sizes[i]}`;
};

export default function DocumentListScreen() {
  const navigation = useNavigation<NavigationProp<ModulesStackParamList>>();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async (query?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await documentsService.listDocuments(query);
      setDocuments(data);
    } catch (err: any) {
      console.error('Failed to load documents', err);
      const status = err?.response?.status;
      if (status === 403) {
        navigation.navigate('NoAccess', { resource: 'Documents' });
        return;
      }
      if (status === 404) {
        navigation.navigate('NotFound', { resource: 'Documents' });
        return;
      }
      setError(err?.message || 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [navigation]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const onSearch = useMemo(
    () =>
      debounce((value: string) => {
        loadDocuments(value.trim() || undefined);
      }, 350),
    [loadDocuments]
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearch(value);
  };

  const navigateToUpload = () => {
    (navigation as any).navigate('DocumentUpload');
  };

  const navigateToDetail = (doc: DocumentItem) => {
    if (!doc.id) {
      Alert.alert('Document missing id', 'Cannot open this document.');
      return;
    }
    (navigation as any).navigate('DocumentViewer', {
      documentId: doc.id,
      url: doc.url,
      name: doc.name,
    });
  };

  const renderItem = ({ item }: { item: DocumentItem }) => (
    <ListRow
      title={item.name}
      subtitle={`${item.mimeType || 'Unknown type'} • ${formatBytes(item.size)}`}
      rightText={item.createdAt ? new Date(item.createdAt).toLocaleDateString() : undefined}
      onPress={() => navigateToDetail(item)}
    />
  );

  if (isLoading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={s.helperText}>Loading documents...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.centered}>
        <Text style={s.errorText}>{error}</Text>
        <Button title="Retry" onPress={() => loadDocuments(search.trim() || undefined)} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.headerRow}>
        <View>
          <Text style={s.title}>Documents</Text>
          <Text style={s.subtitle}>Browse and view files</Text>
        </View>
        <Button title="Upload" size="small" variant="primary" onPress={navigateToUpload} />
      </View>

      <View style={s.searchContainer}>
        <TextInput
          value={search}
          onChangeText={handleSearchChange}
          placeholder="Search documents"
          placeholderTextColor={theme.colors.textSecondary}
          style={s.searchInput}
        />
      </View>

      {documents.length === 0 ? (
        <View style={s.centered}>
          <Text style={s.helperText}>No documents found.</Text>
          <TouchableOpacity onPress={() => loadDocuments(undefined)}>
            <Text style={s.link}>Clear search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={documents}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={s.separator} />}
          contentContainerStyle={s.list}
        />
      )}
    </View>
  );
}

function debounce<F extends (...args: any[]) => void>(fn: F, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<F>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  helperText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.base,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.base,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  link: {
    marginTop: theme.spacing.xs,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.semibold,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  searchContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  searchInput: {
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.base,
  },
  list: {
    paddingBottom: theme.spacing.lg,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
});
