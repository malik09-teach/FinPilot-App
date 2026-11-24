import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useBankStore, TransactionItem } from '../store/bank-store';
import { BalanceCard } from '../components/BalanceCard';
import { ActionCards } from '../components/ActionCards';
import { TransactionsSection } from '../components/TransactionsSection';
import { AiAgentSpace } from '../components/AiAgentSpace';
import { BottomNav, TabKey } from '../components/BottomNav';
import { PinScreen } from '../components/PinScreen';
import { AiWorkspaceModal } from '../components/AiWorkspaceModal';
import { SendRequestModal } from '../components/SendRequestModal';
import { LoadMoneyModal } from '../components/LoadMoneyModal';
import { AllTransactionsModal } from '../components/AllTransactionsModal';
import { TransactionDetailModal } from '../components/TransactionDetailModal';
import { PaymentsScreen } from '../components/PaymentsScreen';
import { ScanQrScreen } from '../components/ScanQrScreen';
import { MoreScreen } from '../components/MoreScreen';
import { AnalyticsModal } from '../components/AnalyticsModal';
import { BudgetsModal } from '../components/BudgetsModal';
import { SavingsGoalsModal } from '../components/SavingsGoalsModal';
import { LoginScreen } from '../components/LoginScreen';
import { MyCardsScreen } from '../components/MyCardsScreen';

export default function FinPilotMainApp() {
  const {
    isAuthenticated,
    setAuthenticated,
    recentTransactions,
    activeTab,
    setActiveTab,
    loadInitialData,
  } = useBankStore();

  // Modals state
  const [showCardsScreen, setShowCardsScreen] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | undefined>(undefined);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showAllTxModal, setShowAllTxModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showBudgetsModal, setShowBudgetsModal] = useState(false);
  const [showSavingsModal, setShowSavingsModal] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const openAiWithPrompt = (prompt?: string) => {
    setAiInitialPrompt(prompt);
    setShowAiModal(true);
  };

  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLoginSuccess={() => {
          setAuthenticated(true);
          setActiveTab('personal');
          loadInitialData();
        }}
      />
    );
  }

  if (showCardsScreen) {
    return <MyCardsScreen onBack={() => setShowCardsScreen(false)} />;
  }

  const insets = useSafeAreaInsets();
  const safeTopPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 16
  ) + 12;

  return (
    <View style={[styles.safeArea, { paddingTop: safeTopPadding }]}>
      <StatusBar barStyle="dark-content" />

      {/* Main Tab Views */}
      <View style={styles.screenWrapper}>
        {activeTab === 'personal' && (
          <ScrollView
            style={styles.mainScroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Dashboard Cards Row */}
            <View style={styles.cardsRow}>
              {/* Left Tall Teal Balance Card -> Navigates to My Cards */}
              <BalanceCard onPress={() => setShowCardsScreen(true)} />

              {/* Right Column: Load Money & Send & Request */}
              <ActionCards
                onLoadMoney={() => setShowLoadModal(true)}
                onSendRequest={() => setShowSendModal(true)}
              />
            </View>

            {/* Transactions Section */}
            <TransactionsSection
              transactions={recentTransactions}
              onSeeAll={() => setShowAllTxModal(true)}
              onSelectTransaction={(tx) => setSelectedTx(tx)}
            />
          </ScrollView>
        )}

        {activeTab === 'payments' && (
          <PaymentsScreen
            onOpenSendModal={() => setShowSendModal(true)}
            onOpenLoadModal={() => setShowLoadModal(true)}
          />
        )}

        {activeTab === 'scan' && <ScanQrScreen />}

        {activeTab === 'more' && (
          <MoreScreen
            onOpenAnalytics={() => setShowAnalyticsModal(true)}
            onOpenBudgets={() => setShowBudgetsModal(true)}
            onOpenSavings={() => setShowSavingsModal(true)}
            onLockApp={() => setAuthenticated(false)}
          />
        )}
      </View>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Send & Request Modal */}
      <SendRequestModal
        visible={showSendModal}
        onClose={() => setShowSendModal(false)}
      />

      {/* Load Money Modal */}
      <LoadMoneyModal
        visible={showLoadModal}
        onClose={() => setShowLoadModal(false)}
      />

      {/* All Transactions Modal */}
      <AllTransactionsModal
        visible={showAllTxModal}
        onClose={() => setShowAllTxModal(false)}
        onSelectTransaction={(tx) => setSelectedTx(tx)}
      />

      {/* Transaction Detail & Ledger Proof Modal */}
      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />

      {/* Financial Analytics Modal */}
      <AnalyticsModal
        visible={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
      />

      {/* Budgets Modal */}
      <BudgetsModal
        visible={showBudgetsModal}
        onClose={() => setShowBudgetsModal(false)}
      />

      {/* Savings Goals Modal */}
      <SavingsGoalsModal
        visible={showSavingsModal}
        onClose={() => setShowSavingsModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenWrapper: {
    flex: 1,
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 14,
    paddingBottom: 24,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
});
