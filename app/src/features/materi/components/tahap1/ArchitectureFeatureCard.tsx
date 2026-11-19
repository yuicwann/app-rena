import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui/Text';
import { FM_ADVANTAGES } from './tahap1Data';

export function ArchitectureFeatureCard() {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={18} color="#ffc800" />
        <Text style={styles.title}>Keunggulan Arsitektur Penerima FM</Text>
      </View>

      <View style={styles.list}>
        {FM_ADVANTAGES.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.checkIcon}>
              <Ionicons name="checkmark" size={13} color="#006590" />
            </View>
            <Text style={styles.itemText}>
              <Text style={styles.itemTextBold}>{item.title}: </Text>
              {item.detail}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    color: tokens.colors.text,
  },
  list: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  checkIcon: {
    marginTop: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#c8e6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: tokens.colors.textSecondary,
  },
  itemTextBold: {
    fontWeight: '800',
    color: tokens.colors.text,
  },
});
