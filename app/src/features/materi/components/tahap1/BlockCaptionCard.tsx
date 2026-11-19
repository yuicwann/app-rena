import React from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui/Text';
import { DIAGRAM_NODES, NODE_CAPTIONS, getDiagramNode } from './tahap1Data';

interface BlockCaptionCardProps {
  activeIndex: number;
}

export function BlockCaptionCard({ activeIndex }: BlockCaptionCardProps) {
  const node = getDiagramNode(activeIndex);
  const caption = NODE_CAPTIONS[node.id] || {
    title: node.t,
    desc: node.s,
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>
            {activeIndex + 1}/{DIAGRAM_NODES.length}
          </Text>
        </View>
        <Text style={styles.title}>{caption.title}</Text>
      </View>
      <Text style={styles.description}>{caption.desc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    minHeight: 88,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  stepBadge: {
    backgroundColor: '#006590',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
  },
  title: {
    fontSize: 15,
    fontWeight: '900',
    color: tokens.colors.text,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
});
