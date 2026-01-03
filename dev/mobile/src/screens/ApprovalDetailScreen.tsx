/**
 * Approval Detail Screen
 * Session M3.2 - Approval detail with approve/reject actions
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRoute, useNavigation, NavigationProp } from '@react-navigation/native';
import { approvalsService, ApprovalDetail } from '../services/approvals.service';
import { WorkStackParamList } from '../navigation/types';
import { theme } from '../../theme.config';
import { AttachmentsCard } from '../components';
import { mediaPickerService } from '../services/mediaPicker.service';
import { useCapabilities } from '../hooks/useCapabilities';
import { useAuthStore } from '../store/authStore';
import { deepLinkOfflineService } from '../services/deepLinkOffline.service';
import { approvalActionsService } from '../services/approvalActions.service';

export default function ApprovalDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<NavigationProp<WorkStackParamList>>();
  const { approvalId, approvalType } = route.params || {};
  const { canApprove, canReject } = useCapabilities();
  const { user } = useAuthStore();

  const [approval, setApproval] = useState<ApprovalDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);

  useEffect(() => {
    loadApproval();
  }, [approvalId]);

  const loadApproval = async () => {
    if (!approvalId) {
      setError('Approval ID not provided');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Use offline fallback service
      const result = await deepLinkOfflineService.fetchApproval(approvalId, approvalType || 'INVOICE', user?.id);
      
      if (result.success && result.data) {
        setApproval(result.data);
        setIsFromCache(result.fromCache);
        
        // Cache the data for future offline access
        if (!result.fromCache) {
          await deepLinkOfflineService.cacheApproval(approvalId, approvalType || 'INVOICE', result.data, user?.id);
        }
      } else {
        setError(result.error || 'Failed to load approval');
      }
    } catch (err: any) {
      console.error('Failed to load approval:', err);
      const status = err?.response?.status;
      if (status === 403) {
        (navigation as any).navigate('NoAccess', { resource: 'approval', message: 'You do not have permission to view this approval.' });
        return;
      }
      if (status === 404) {
        (navigation as any).navigate('NotFound', { resource: 'approval', message: 'This approval could not be found.' });
        return;
      }
      setError('Failed to load approval');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = () => {
    Alert.alert('Confirm Approval', 'Are you sure you want to approve this request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        style: 'default',
        onPress: async () => {
          if (!approval) return;
          try {
            setIsApproving(true);
            const result = await approvalActionsService.queueApprovalAction({
              approvalId: approval.id,
              approvalType: approval.type,
              action: 'approve',
            });
            
            if (result.queued) {
              Alert.alert('Queued', 'Approval action queued. It will be submitted when you are online.');
            } else {
              Alert.alert('Success', 'Approval submitted successfully');
            }
            navigation.goBack();
          } catch (err: any) {
            console.error('Failed to approve:', err);
            Alert.alert('Error', err?.message || 'Failed to approve. Please try again.');
          } finally {
            setIsApproving(false);
          }
        },
      },
    ]);
  };

  const handleReject = () => {
    setShowRejectModal(true);
  };

  const submitRejection = async () => {
    if (!approval || !rejectReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    try {
      setIsRejecting(true);
      const result = await approvalActionsService.queueApprovalAction({
        approvalId: approval.id,
        approvalType: approval.type,
        action: 'reject',
        comment: rejectReason.trim(),
      });
      
      setShowRejectModal(false);
      setRejectReason('');
      
      if (result.queued) {
        Alert.alert('Queued', 'Rejection queued. It will be submitted when you are online.');
      } else {
        Alert.alert('Success', 'Rejection submitted successfully');
      }
      navigation.goBack();
    } catch (err: any) {
      console.error('Failed to reject:', err);
      Alert.alert('Error', err?.message || 'Failed to reject. Please try again.');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleAddAttachment = async () => {
    if (!approval) return;

    try {
      const result = await mediaPickerService.pickDocument();
      if (!result) return;

      setIsUploading(true);
      await approvalsService.uploadAttachment({
        type: approval.type,
        id: approval.id,
        file: {
          uri: result.uri,
          name: result.name,
          mimeType: result.mimeType,
        },
      });
      Alert.alert('Success', 'Attachment uploaded successfully');
      await loadApproval();
    } catch (err: any) {
      console.error('Failed to upload attachment:', err);
      Alert.alert('Error', err?.message || 'Failed to upload attachment');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading approval...</Text>
      </View>
    );
  }

  if (error || !approval) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Approval not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadApproval}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        {isFromCache && (
          <View style={styles.cacheBanner}>
            <Text style={styles.cacheBannerText}>📱 Offline - Showing cached data</Text>
          </View>
        )}
        
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{approval.title}</Text>
            <Text style={styles.subtitle}>{approval.type}</Text>
          </View>
          <View style={[styles.badge, getBadgeStyle(approval.status)]}>
            <Text style={styles.badgeText}>{approval.status}</Text>
          </View>
        </View>

        {approval.amount !== undefined && (
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Amount</Text>
            <Text style={styles.amountValue}>
              {approval.currency || 'USD'} {approval.amount.toLocaleString()}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.card}>
            {approval.requesterName && (
              <InfoRow label="Requester" value={approval.requesterName} />
            )}
            {approval.priority && <InfoRow label="Priority" value={approval.priority} />}
            <InfoRow label="Created" value={new Date(approval.createdAt).toLocaleString()} />
            {approval.description && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Description</Text>
                <Text style={styles.infoValue}>{approval.description}</Text>
              </View>
            )}
          </View>
        </View>

        {approval.lineItems && approval.lineItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Line Items</Text>
            <View style={styles.card}>
              {approval.lineItems.map((item, idx) => (
                <View key={item.id} style={[styles.lineItem, idx > 0 && styles.lineItemBorder]}>
                  <Text style={styles.lineItemDesc}>{item.description}</Text>
                  {item.quantity && item.unitPrice && (
                    <Text style={styles.lineItemMeta}>
                      {item.quantity} × {item.unitPrice.toLocaleString()} = {item.total?.toLocaleString()}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <AttachmentsCard
            attachments={approval.attachments || []}
            onAdd={approval.status === 'PENDING' && !isUploading ? handleAddAttachment : undefined}
            onPressItem={(att) => {
              if (att.url) {
                navigation.navigate('DocumentViewer', {
                  documentId: att.id,
                  url: att.url,
                  name: att.name,
                  mimeType: att.mimeType,
                  size: att.size,
                });
              } else {
                Alert.alert('No URL', 'This attachment has no download URL.');
              }
            }}
          />
        </View>

        {approval.history && approval.history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>History</Text>
            <View style={styles.card}>
              {approval.history.map((h, idx) => (
                <View key={h.id} style={[styles.historyItem, idx > 0 && styles.historyItemBorder]}>
                  <Text style={styles.historyAction}>{h.action}</Text>
                  <Text style={styles.historyMeta}>
                    {h.actorName} • {new Date(h.timestamp).toLocaleString()}
                  </Text>
                  {h.comment && <Text style={styles.historyComment}>{h.comment}</Text>}
                </View>
              ))}
            </View>
          </View>
        )}

        {approval.comments && approval.comments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comments</Text>
            <View style={styles.card}>
              {approval.comments.map((c, idx) => (
                <View key={c.id} style={[styles.comment, idx > 0 && styles.commentBorder]}>
                  <Text style={styles.commentAuthor}>{c.authorName}</Text>
                  <Text style={styles.commentContent}>{c.content}</Text>
                  <Text style={styles.commentDate}>{new Date(c.createdAt).toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {approval.status === 'PENDING' && canApprove && canReject && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={handleReject}
            disabled={isApproving || isRejecting}
          >
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={handleApprove}
            disabled={isApproving || isRejecting}
          >
            {isApproving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Approve</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showRejectModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Approval</Text>
            <Text style={styles.modalLabel}>Reason for rejection (required):</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter reason..."
              placeholderTextColor={theme.colors.textSecondary}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                disabled={isRejecting}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSubmitButton]}
                onPress={submitRejection}
                disabled={isRejecting || !rejectReason.trim()}
              >
                {isRejecting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function getBadgeStyle(status: string) {
  switch (status) {
    case 'APPROVED':
      return { backgroundColor: '#4CAF50' };
    case 'REJECTED':
      return { backgroundColor: '#F44336' };
    case 'PENDING':
      return { backgroundColor: '#FF9800' };
    default:
      return { backgroundColor: '#999' };
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  cacheBanner: { backgroundColor: '#fff3cd', borderColor: '#ffc107', borderWidth: 1, borderRadius: theme.borderRadius.md, padding: theme.spacing.sm, margin: theme.spacing.md },
  cacheBannerText: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.medium, color: '#856404', textAlign: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.lg, backgroundColor: theme.colors.background },
  loadingText: { marginTop: theme.spacing.sm, color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily.regular },
  errorText: { color: theme.colors.error, fontFamily: theme.typography.fontFamily.medium, marginBottom: theme.spacing.sm },
  retryButton: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md },
  retryText: { color: '#fff', fontFamily: theme.typography.fontFamily.medium },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: theme.spacing.md, backgroundColor: theme.colors.surface },
  title: { fontSize: theme.typography.fontSize.xl, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text },
  subtitle: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
  badge: { paddingHorizontal: theme.spacing.sm, paddingVertical: 4, borderRadius: theme.borderRadius.full },
  badgeText: { color: '#fff', fontSize: theme.typography.fontSize.xs, fontFamily: theme.typography.fontFamily.semibold },
  amountCard: { backgroundColor: theme.colors.primary, padding: theme.spacing.md, margin: theme.spacing.md, borderRadius: theme.borderRadius.md },
  amountLabel: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.medium, color: '#fff', opacity: 0.9 },
  amountValue: { fontSize: theme.typography.fontSize.xxl, fontFamily: theme.typography.fontFamily.bold, color: '#fff', marginTop: theme.spacing.xs },
  section: { padding: theme.spacing.md },
  sectionTitle: { fontSize: theme.typography.fontSize.lg, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.text, marginBottom: theme.spacing.sm },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.md },
  infoRow: { marginBottom: theme.spacing.sm },
  infoLabel: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textSecondary, marginBottom: 2 },
  infoValue: { fontSize: theme.typography.fontSize.base, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.text },
  lineItem: { paddingVertical: theme.spacing.sm },
  lineItemBorder: { borderTopWidth: 1, borderTopColor: theme.colors.border },
  lineItemDesc: { fontSize: theme.typography.fontSize.base, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text },
  lineItemMeta: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary, marginTop: 2 },
  attachment: { paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  attachmentName: { fontSize: theme.typography.fontSize.base, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.text },
  attachmentSize: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary, marginTop: 2 },
  historyItem: { paddingVertical: theme.spacing.sm },
  historyItemBorder: { borderTopWidth: 1, borderTopColor: theme.colors.border },
  historyAction: { fontSize: theme.typography.fontSize.base, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.text },
  historyMeta: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary, marginTop: 2 },
  historyComment: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.text, marginTop: theme.spacing.xs, fontStyle: 'italic' },
  comment: { paddingVertical: theme.spacing.sm },
  commentBorder: { borderTopWidth: 1, borderTopColor: theme.colors.border },
  commentAuthor: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.semibold, color: theme.colors.text },
  commentContent: { fontSize: theme.typography.fontSize.base, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.text, marginTop: 2 },
  commentDate: { fontSize: theme.typography.fontSize.xs, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border },
  actionButton: { flex: 1, padding: theme.spacing.md, borderRadius: theme.borderRadius.md, alignItems: 'center', marginHorizontal: theme.spacing.xs },
  approveButton: { backgroundColor: theme.colors.success },
  rejectButton: { backgroundColor: theme.colors.error },
  actionButtonText: { color: '#fff', fontSize: theme.typography.fontSize.base, fontFamily: theme.typography.fontFamily.semibold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg, width: '90%', maxWidth: 400 },
  modalTitle: { fontSize: theme.typography.fontSize.xl, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text, marginBottom: theme.spacing.md },
  modalLabel: { fontSize: theme.typography.fontSize.sm, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text, marginBottom: theme.spacing.xs },
  modalInput: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, fontSize: theme.typography.fontSize.base, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.text, backgroundColor: theme.colors.surface, minHeight: 100, marginBottom: theme.spacing.md },
  modalActions: { flexDirection: 'row' },
  modalButton: { flex: 1, padding: theme.spacing.md, borderRadius: theme.borderRadius.md, alignItems: 'center', marginHorizontal: theme.spacing.xs },
  modalCancelButton: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  modalSubmitButton: { backgroundColor: theme.colors.error },
  modalCancelText: { color: theme.colors.text, fontSize: theme.typography.fontSize.base, fontFamily: theme.typography.fontFamily.medium },
  modalSubmitText: { color: '#fff', fontSize: theme.typography.fontSize.base, fontFamily: theme.typography.fontFamily.semibold },
});
