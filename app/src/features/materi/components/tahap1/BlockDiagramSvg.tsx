import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  Marker,
  Path as SvgPath,
  Line,
  Rect,
  Text as SvgText,
  G,
  Circle,
} from 'react-native-svg';
import { DIAGRAM_NODES, NODE_WIDTH, NODE_HEIGHT } from './tahap1Data';

interface BlockDiagramSvgProps {
  activeIndex: number;
  onSelectNode: (index: number) => void;
  pulsePos: { x: number; y: number };
}

export function BlockDiagramSvg({
  activeIndex,
  onSelectNode,
  pulsePos,
}: BlockDiagramSvgProps) {
  return (
    <View style={styles.container}>
      <Svg viewBox="0 0 360 170" style={styles.svg}>
        <Defs>
          <Marker
            id="ar"
            markerWidth="7"
            markerHeight="7"
            refX="5"
            refY="3.5"
            orient="auto"
          >
            <SvgPath d="M0 0 L7 3.5 L0 7Z" fill="#becbb1" />
          </Marker>
        </Defs>

        {/* Connecting signal lines */}
        {/* Antena -> RF */}
        <Line x1="82" y1="60" x2="96" y2="60" stroke="#becbb1" strokeWidth="3" strokeLinecap="round" markerEnd="url(#ar)" />
        {/* RF -> Mixer */}
        <Line x1="172" y1="60" x2="186" y2="60" stroke="#becbb1" strokeWidth="3" strokeLinecap="round" markerEnd="url(#ar)" />
        {/* Mixer -> IF */}
        <Line x1="262" y1="60" x2="276" y2="60" stroke="#becbb1" strokeWidth="3" strokeLinecap="round" markerEnd="url(#ar)" />
        {/* LO -> Mixer */}
        <Line x1="225" y1="30" x2="225" y2="38" stroke="#becbb1" strokeWidth="3" strokeLinecap="round" markerEnd="url(#ar)" />
        {/* IF down to Limiter */}
        <Line x1="315" y1="80" x2="315" y2="118" stroke="#becbb1" strokeWidth="3" strokeLinecap="round" markerEnd="url(#ar)" />
        {/* Limiter -> Diskriminator */}
        <Line x1="276" y1="140" x2="262" y2="140" stroke="#becbb1" strokeWidth="3" strokeLinecap="round" markerEnd="url(#ar)" />
        {/* Diskriminator -> AF */}
        <Line x1="186" y1="140" x2="172" y2="140" stroke="#becbb1" strokeWidth="3" strokeLinecap="round" markerEnd="url(#ar)" />

        {/* Box Osilator Lokal (LO) */}
        <G>
          <Rect x="188" y="4" width="74" height="26" rx="8" fill="#ffc800" />
          <SvgText
            x="225"
            y="15"
            fontSize="8"
            fontWeight="900"
            fill="#241a00"
            textAnchor="middle"
          >
            OSC LO
          </SvgText>
          <SvgText
            x="225"
            y="25"
            fontSize="6.5"
            fontWeight="700"
            fill="#594400"
            textAnchor="middle"
          >
            f_RF + 10.7 MHz
          </SvgText>
        </G>

        {/* 7 Diagram Nodes */}
        {DIAGRAM_NODES.map((n, i) => {
          const isActive = i === activeIndex;
          const isDone = i < activeIndex;

          return (
            <G
              key={n.id}
              opacity={isActive ? 1 : isDone ? 0.95 : 0.65}
              onPress={() => onSelectNode(i)}
            >
              {/* Active glow outline */}
              {isActive && (
                <Rect
                  x={n.x - 3}
                  y={n.y - 3}
                  width={NODE_WIDTH + 6}
                  height={NODE_HEIGHT + 6}
                  rx="13"
                  fill="none"
                  stroke="#2fb8ff"
                  strokeWidth="2.5"
                />
              )}

              {/* Node Card Rectangle */}
              <Rect
                x={n.x}
                y={n.y}
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                rx="10"
                fill={n.fill}
              />

              {/* Node Title */}
              <SvgText
                x={n.x + NODE_WIDTH / 2}
                y={n.y + 17}
                fontSize="8.5"
                fontWeight="900"
                textAnchor="middle"
                fill={n.tc}
              >
                {n.t}
              </SvgText>

              {/* Node Subtitle */}
              <SvgText
                x={n.x + NODE_WIDTH / 2}
                y={n.y + 29}
                fontSize="7"
                fontWeight="700"
                textAnchor="middle"
                fill={n.sc}
              >
                {n.s}
              </SvgText>
            </G>
          );
        })}

        {/* Animated Signal Tracker Pulse */}
        <Circle
          cx={pulsePos.x}
          cy={pulsePos.y}
          r="7"
          fill="#ffc800"
          stroke="#ffffff"
          strokeWidth="2.5"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  svg: {
    width: '100%',
    aspectRatio: 360 / 170,
  },
});
