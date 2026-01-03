import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { grnService, PODetail, POItem, CreateGRNDto, ItemCondition } from '../services/grn.service';
import { grnActionsService } from '../services/grnActions.service';
import { mediaPickerService, PickedMedia } from '../services/mediaPicker.service';
import { grnAttachmentsService } from '../services/grnAttachments.service';
import { theme } from '../../theme.config';

export default function ReceiveGoodsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { poId } = route.params;
  const [po, setPO] = useState<PODetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [receivedQtys, setReceivedQtys] = useState<Record<string, string>>({});
  const [conditions, setConditions] = useState<Record<string, ItemCondition>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [deliveryNote, setDeliveryNote] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [grnNotes, setGrnNotes] = useState('');
  const [attachments, setAttachments] = useState<PickedMedia[]>([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);

  useEffect(() => {
    grnService.getPODetail(poId)
      .then(data => {
        setPO(data);
        const qtys: Record<string, string> = {};
        const conds: Record<string, ItemCondition> = {};
        data.items.forEach(item => {
          const remaining = item.quantity - item.receivedQty;
          qtys[item.id] = remaining > 0 ? remaining.toString() : '0';
          conds[item.id] = 'GOOD';
        });
        setReceivedQtys(qtys);
        setConditions(conds);
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, [poId]);

  const handleSubmit = async () => {
    if (!po) return;

    const items = po.items
      .filter(item => parseFloat(receivedQtys[item.id] || '0') > 0)
      .map(item => ({
        poItemId: item.id,
        receivedQty: receivedQtys[item.id],
        condition: conditions[item.id],
        notes: notes[item.id],
      }));

    if (items.length === 0) {
      Alert.alert('Error', 'Please enter received quantities for at least one item');
      return;
    }

    const dto: CreateGRNDto = {
      purchaseOrderId: poId,
      siteLocation: po.deliveryAddress,
      deliveryNote,
      carrierName,
      vehicleNumber,
      notes: grnNotes,
      items,
    };

    setSubmitting(true);
    const result = await grnActionsService.submitGRN(dto, attachments);
    
    if (result.success && attachments.length > 0 && result.grnId && !result.queued) {
      try {
        await grnAttachmentsService.uploadAttachments(result.grnId, attachments);
      } catch (error) {
        console.error('Failed to upload attachments:', error);
      }
    }
    
    setSubmitting(false);

    if (result.success) {
      Alert.alert(
        'Success',
        result.queued ? 'GRN queued for submission when online' : 'GRN submitted successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to submit GRN');
    }
  };

  const handleAddPhoto = async (source: 'camera' | 'library') => {
    try {
      const media = source === 'camera' 
        ? await mediaPickerService.pickFromCamera()
        : await mediaPickerService.pickFromLibrary();
      
      if (media) {
        setAttachments(prev => [...prev, media]);
      }
    } catch (error) {
      console.error('Failed to pick photo:', error);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  if (!po) return <View style={styles.centered}><Text>PO not found</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{po.poNumber}</Text>
        <Text style={styles.vendor}>{po.vendorName}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Information</Text>
        <TextInput style={styles.input} placeholder="Delivery Note #" value={deliveryNote} onChangeText={setDeliveryNote} />
        <TextInput style={styles.input} placeholder="Carrier Name" value={carrierName} onChangeText={setCarrierName} />
        <TextInput style={styles.input} placeholder="Vehicle Number" value={vehicleNumber} onChangeText={setVehicleNumber} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {po.items.map(item => (
          <View key={item.id} style={styles.itemCard}>
            <Text style={styles.itemName}>{item.itemName}</Text>
            <Text style={styles.itemMeta}>Ordered: {item.quantity} {item.unit}</Text>
            <Text style={styles.itemMeta}>Already received: {item.receivedQty} {item.unit}</Text>
            <Text style={styles.itemMeta}>Remaining: {item.quantity - item.receivedQty} {item.unit}</Text>
            
            <View style={styles.inputRow}>
              <Text style={styles.label}>Received Qty:</Text>
              <TextInput
                style={styles.qtyInput}
                keyboardType="numeric"
                value={receivedQtys[item.id]}
                onChangeText={val => setReceivedQtys(prev => ({ ...prev, [item.id]: val }))}
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.label}>Condition:</Text>
              <View style={styles.conditionButtons}>
                {(['GOOD', 'DAMAGED', 'DEFECTIVE'] as ItemCondition[]).map(cond => (
                  <TouchableOpacity
                    key={cond}
                    style={[styles.condBtn, conditions[item.id] === cond && styles.condBtnActive]}
                    onPress={() => setConditions(prev => ({ ...prev, [item.id]: cond }))}
                  >
                    <Text style={[styles.condBtnText, conditions[item.id] === cond && styles.condBtnTextActive]}>{cond}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={styles.notesInput}
              placeholder="Notes (optional)"
              value={notes[item.id] || ''}
              onChangeText={val => setNotes(prev => ({ ...prev, [item.id]: val }))}
              multiline
            />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>GRN Notes</Text>
        <TextInput style={styles.notesInput} placeholder="Overall notes..." value={grnNotes} onChangeText={setGrnNotes} multiline />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photo Attachments</Text>
        <View style={styles.photoButtons}>
          <TouchableOpacity style={styles.photoBtn} onPress={() => handleAddPhoto('camera')}>
            <Text style={styles.photoBtnText}>📷 Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoBtn} onPress={() => handleAddPhoto('library')}>
            <Text style={styles.photoBtnText}>🖼️ Choose Photo</Text>
          </TouchableOpacity>
        </View>
        {attachments.length > 0 && (
          <View style={styles.photoGrid}>
            {attachments.map((attachment, index) => (
              <View key={index} style={styles.photoItem}>
                <Image source={{ uri: attachment.uri }} style={styles.photoThumb} />
                <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemovePhoto(index)}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit GRN'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, backgroundColor: theme.colors.surface },
  title: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text },
  vendor: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 4 },
  section: { marginTop: 16, padding: 16, backgroundColor: theme.colors.surface },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: theme.colors.text },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#fff' },
  itemCard: { backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8, marginBottom: 12 },
  itemName: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  itemMeta: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  label: { fontSize: 14, width: 100 },
  qtyInput: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 4, padding: 8, backgroundColor: '#fff' },
  conditionButtons: { flex: 1, flexDirection: 'row', gap: 8 },
  condBtn: { flex: 1, padding: 8, borderRadius: 4, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#fff', alignItems: 'center' },
  condBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  condBtnText: { fontSize: 12, color: theme.colors.text },
  condBtnTextActive: { color: '#fff', fontWeight: '600' },
  notesInput: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 4, padding: 8, marginTop: 8, minHeight: 60, backgroundColor: '#fff' },
  photoButtons: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  photoBtn: { flex: 1, padding: 12, backgroundColor: theme.colors.primary, borderRadius: 8, alignItems: 'center' },
  photoBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoItem: { width: 100, height: 100, position: 'relative' },
  photoThumb: { width: '100%', height: '100%', borderRadius: 8 },
  removeBtn: { position: 'absolute', top: -8, right: -8, backgroundColor: 'red', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  submitBtn: { margin: 16, padding: 16, backgroundColor: theme.colors.primary, borderRadius: 8, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
