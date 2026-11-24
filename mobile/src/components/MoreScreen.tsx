import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { AdaptiveModal } from './AdaptiveModal';
import {
  User,
  Mail,
  Receipt,
  FileText,
  Shield,
  Calendar,
  Smartphone,
  Landmark,
  HeartCrack,
  LogOut,
  ChevronRight,
  X,
  CheckCircle2,
} from 'lucide-react-native';
import { useBankStore } from '../store/bank-store';

interface MoreScreenProps {
  onOpenAnalytics?: () => void;
  onOpenBudgets?: () => void;
  onOpenSavings?: () => void;
  onLockApp?: () => void;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({ onLockApp }) => {
  const { user } = useBankStore();

  // Active dialog modal
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [emailValue, setEmailValue] = useState('sayyed.taimoor@gmail.com');
  const [emailSaved, setEmailSaved] = useState(false);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Profile Card */}
      <View style={styles.card}>
        <View style={styles.profileAvatarBox}>
          <User size={22} color="#00D494" strokeWidth={2.8} />
        </View>
        <Text style={styles.profileName}>Sayyed Taimoor Shah</Text>
      </View>

      {/* 2. Update Email Address */}
      <TouchableOpacity
        style={styles.cardRowButton}
        activeOpacity={0.7}
        onPress={() => setActiveModal('EMAIL')}
      >
        <View style={styles.coralIconCircle}>
          <Mail size={19} color="#FA6854" strokeWidth={2.2} />
        </View>
        <Text style={styles.rowTitle}>Update email address</Text>
        <ChevronRight size={19} color="#94A3B8" />
      </TouchableOpacity>

      {/* 3. Limit Card */}
      <View style={styles.card}>
        <Text style={styles.cardSectionLabel}>Limit</Text>
        <View style={styles.limitRow}>
          <Text style={styles.limitLabel}>Incoming</Text>
          <Text style={styles.limitAmount}>Rs. 390,000 left</Text>
        </View>

        {/* Progress Bar Track */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '97.5%' }]} />
        </View>

        <Text style={styles.limitSubText}>
          Your Rs. 400k monthly limit resets on the 1st of next month
        </Text>
      </View>

      {/* 4. Documents Card */}
      <View style={styles.card}>
        <Text style={styles.cardSectionLabel}>Documents</Text>

        <TouchableOpacity
          style={styles.innerCardRow}
          activeOpacity={0.7}
          onPress={() => setActiveModal('STATEMENT')}
        >
          <View style={styles.coralIconCircle}>
            <Receipt size={19} color="#FA6854" strokeWidth={2.2} />
          </View>
          <Text style={styles.rowTitle}>Account statement</Text>
          <ChevronRight size={19} color="#94A3B8" />
        </TouchableOpacity>

        <View style={styles.rowDivider} />

        <TouchableOpacity
          style={styles.innerCardRow}
          activeOpacity={0.7}
          onPress={() => setActiveModal('TAX')}
        >
          <View style={styles.coralIconCircle}>
            <Receipt size={19} color="#FA6854" strokeWidth={2.2} />
          </View>
          <Text style={styles.rowTitle}>Tax refund statement</Text>
          <ChevronRight size={19} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* 5. Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardSectionLabel}>Info</Text>

        <TouchableOpacity
          style={styles.innerCardRow}
          activeOpacity={0.7}
          onPress={() => setActiveModal('PRIVACY')}
        >
          <View style={styles.coralIconCircle}>
            <Shield size={19} color="#FA6854" strokeWidth={2.2} />
          </View>
          <Text style={styles.rowTitle}>Privacy policy</Text>
        </TouchableOpacity>

        <View style={styles.rowDivider} />

        <TouchableOpacity
          style={styles.innerCardRow}
          activeOpacity={0.7}
          onPress={() => setActiveModal('TERMS')}
        >
          <View style={styles.coralIconCircle}>
            <FileText size={19} color="#FA6854" strokeWidth={2.2} />
          </View>
          <Text style={styles.rowTitle}>Terms & conditions</Text>
        </TouchableOpacity>

        <View style={styles.rowDivider} />

        <TouchableOpacity
          style={styles.innerCardRow}
          activeOpacity={0.7}
          onPress={() => setActiveModal('CHARGES')}
        >
          <View style={styles.coralIconCircle}>
            <Calendar size={19} color="#FA6854" strokeWidth={2.2} />
          </View>
          <Text style={styles.rowTitle}>Schedule of charges</Text>
        </TouchableOpacity>
      </View>

      {/* 6. Manage Devices */}
      <TouchableOpacity
        style={styles.cardRowButton}
        activeOpacity={0.7}
        onPress={() => setActiveModal('DEVICES')}
      >
        <View style={styles.coralIconCircle}>
          <Smartphone size={19} color="#FA6854" strokeWidth={2.2} />
        </View>
        <Text style={styles.rowTitle}>Manage devices</Text>
        <ChevronRight size={19} color="#94A3B8" />
      </TouchableOpacity>

      {/* 7. Raast ID Management */}
      <TouchableOpacity
        style={styles.cardRowButton}
        activeOpacity={0.7}
        onPress={() => setActiveModal('RAAST')}
      >
        <View style={styles.greenIconCircle}>
          <Landmark size={19} color="#059669" strokeWidth={2.2} />
        </View>
        <Text style={styles.rowTitle}>Raast ID management</Text>
        <ChevronRight size={19} color="#94A3B8" />
      </TouchableOpacity>

      {/* 8. Close Account */}
      <TouchableOpacity
        style={styles.cardRowButton}
        activeOpacity={0.7}
        onPress={() => setActiveModal('CLOSE_ACCOUNT')}
      >
        <View style={styles.coralIconCircle}>
          <HeartCrack size={19} color="#FA6854" strokeWidth={2.2} />
        </View>
        <Text style={styles.rowTitle}>Close account</Text>
      </TouchableOpacity>

      {/* 9. Log Out */}
      <TouchableOpacity
        style={styles.cardRowButton}
        activeOpacity={0.7}
        onPress={() => {
          if (onLockApp) {
            onLockApp();
          }
        }}
      >
        <View style={styles.coralIconCircle}>
          <LogOut size={19} color="#FA6854" strokeWidth={2.2} />
        </View>
        <Text style={[styles.rowTitle, { fontWeight: '700' }]}>Log out</Text>
      </TouchableOpacity>

      {/* 10. Footer */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerFlag}>Developed for 🇵🇰 with ❤️ by 🌍</Text>
        <Text style={styles.footerVersion}>App version: v1.0</Text>
      </View>

      {/* Interactive Modal Handler */}
      {renderDetailModal()}
    </ScrollView>
  );

  // Helper Modal for Row Taps
  function renderDetailModal() {
    if (!activeModal) return null;

    return (
      <AdaptiveModal visible={!!activeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeModal === 'EMAIL' && 'Update Email Address'}
                {activeModal === 'STATEMENT' && 'Account Statement'}
                {activeModal === 'TAX' && 'Tax Refund Statement'}
                {activeModal === 'PRIVACY' && 'Privacy Policy'}
                {activeModal === 'TERMS' && 'Terms & Conditions'}
                {activeModal === 'CHARGES' && 'Schedule of Charges'}
                {activeModal === 'DEVICES' && 'Manage Devices'}
                {activeModal === 'RAAST' && 'Raast ID Management'}
                {activeModal === 'CLOSE_ACCOUNT' && 'Close Account'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setActiveModal(null);
                  setEmailSaved(false);
                }}
              >
                <X size={22} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {/* Email Edit Modal */}
            {activeModal === 'EMAIL' && (
              <View style={styles.modalBody}>
                <Text style={styles.modalDesc}>
                  Enter your updated email address. Verification code will be sent.
                </Text>
                <TextInput
                  style={styles.modalInput}
                  value={emailValue}
                  onChangeText={setEmailValue}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {emailSaved ? (
                  <View style={styles.savedBanner}>
                    <CheckCircle2 size={18} color="#00D494" />
                    <Text style={styles.savedText}>Email updated successfully!</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.modalActionBtn}
                    onPress={() => setEmailSaved(true)}
                  >
                    <Text style={styles.modalActionBtnText}>Save Email</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Raast Modal */}
            {activeModal === 'RAAST' && (
              <View style={styles.modalBody}>
                <View style={styles.raastBanner}>
                  <Landmark size={24} color="#059669" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.raastBannerTitle}>Raast ID (Active)</Text>
                    <Text style={styles.raastBannerAlias}>0311-2345678</Text>
                    <Text style={styles.raastBannerIban}>PK19SADA0000003112345678</Text>
                  </View>
                </View>
                <Text style={styles.modalDesc}>
                  Your FinPilot account is linked to the State Bank of Pakistan Raast
                  instant payment system.
                </Text>
              </View>
            )}

            {/* Devices Modal */}
            {activeModal === 'DEVICES' && (
              <View style={styles.modalBody}>
                <View style={styles.deviceItem}>
                  <Smartphone size={22} color="#00D494" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deviceName}>Android Smartphone (This device)</Text>
                    <Text style={styles.deviceMeta}>Active • Pakistan • Version v1.0</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Statements Modal */}
            {(activeModal === 'STATEMENT' || activeModal === 'TAX') && (
              <View style={styles.modalBody}>
                <Text style={styles.modalDesc}>
                  Select period to generate your official PDF certificate.
                </Text>
                <TouchableOpacity
                  style={styles.modalActionBtn}
                  onPress={() => {
                    Alert.alert('Statement', 'PDF statement downloaded to device.');
                    setActiveModal(null);
                  }}
                >
                  <Text style={styles.modalActionBtnText}>Download PDF Statement</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* General Info / Privacy / Charges */}
            {(activeModal === 'PRIVACY' ||
              activeModal === 'TERMS' ||
              activeModal === 'CHARGES') && (
              <View style={styles.modalBody}>
                <Text style={styles.modalDesc}>
                  {activeModal === 'CHARGES' &&
                    '100% Free digital banking. 0 ATM fee for first 3 withdrawals monthly.'}
                  {activeModal === 'PRIVACY' &&
                    'FinPilot complies with State Bank of Pakistan electronic funds regulations and bank security.'}
                  {activeModal === 'TERMS' &&
                    'Licensed Electronic Money Institution (EMI) terms apply.'}
                </Text>
              </View>
            )}

            {/* Close Account */}
            {activeModal === 'CLOSE_ACCOUNT' && (
              <View style={styles.modalBody}>
                <Text style={[styles.modalDesc, { color: '#EF4444' }]}>
                  Closing your FinPilot account will permanently delete all cards, Raast
                  links, and payment history.
                </Text>
                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: '#EF4444' }]}
                  onPress={() => {
                    setActiveModal(null);
                    if (onLockApp) onLockApp();
                  }}
                >
                  <Text style={styles.modalActionBtnText}>Confirm Close Account</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </AdaptiveModal>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9', // Soft fintech background matching screenshot
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 12,
  },

  // Generic White Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },

  // 1. Profile Card
  profileAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D1FBEA', // Soft mint circle from Image 1
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },

  // 2. Standalone Row Button Cards
  cardRowButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  coralIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFF1EE', // Soft peach background from screenshot
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  greenIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#E6FBF5', // Soft green background for Raast
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowTitle: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '600',
    color: '#0F172A',
    letterSpacing: -0.1,
  },

  // 3. Limit Card
  cardSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E9BAE',
    marginBottom: 12,
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  limitLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  limitAmount: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FA6854', // Exact coral color from screenshot
  },
  progressTrack: {
    height: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FA6854',
    borderRadius: 4,
  },
  limitSubText: {
    fontSize: 12.5,
    color: '#8E9BAE',
    lineHeight: 18,
  },

  // 4. Multi-Row Inside Card (Documents, Info)
  innerCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F8FAFC',
    marginVertical: 4,
  },

  // Footer
  footerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 20,
    gap: 6,
  },
  footerFlag: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  footerVersion: {
    fontSize: 12.5,
    color: '#8E9BAE',
    fontWeight: '500',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 24,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalBody: {
    gap: 14,
  },
  modalDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  modalActionBtn: {
    backgroundColor: '#FA6854',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E6FBF5',
    padding: 12,
    borderRadius: 12,
  },
  savedText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '600',
  },
  raastBanner: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  raastBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  raastBannerAlias: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 2,
  },
  raastBannerIban: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  deviceItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 16,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  deviceMeta: {
    fontSize: 12,
    color: '#8E9BAE',
    marginTop: 2,
  },
});
