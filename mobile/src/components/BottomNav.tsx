import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Home, FileText, QrCode, Menu } from 'lucide-react-native';
import { colors } from '../theme/colors';

export type TabKey = 'personal' | 'payments' | 'scan' | 'more';

interface BottomNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { key: 'personal' as TabKey, label: 'Personal', icon: Home },
    { key: 'payments' as TabKey, label: 'Payments', icon: FileText },
    { key: 'scan' as TabKey, label: 'Scan QR', icon: QrCode },
    { key: 'more' as TabKey, label: 'More', icon: Menu },
  ];

  return (
    <View style={styles.navBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const IconComponent = tab.icon;
        const tintColor = isActive ? colors.coralAccent : '#94A3B8';

        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.7}
            onPress={() => onTabChange(tab.key)}
            style={styles.tabButton}
          >
            <View style={styles.iconWrapper}>
              <IconComponent
                size={23}
                color={tintColor}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
            </View>
            <Text style={[styles.tabLabel, { color: tintColor, fontWeight: isActive ? '700' : '500' }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    paddingTop: 10,
    paddingBottom: 22,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'space-around',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconWrapper: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: 0.1,
  },
});
