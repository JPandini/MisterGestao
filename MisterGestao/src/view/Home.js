code = r'''import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * MisterGestaoHome.js
 *
 * Tela visual da página inicial do Mister Gestão.
 * Preparada para receber dados do Firebase: substitua MOCK_DATA por um hook
 * ou listener do Firestore/Realtime Database quando for integrar o backend.
 *
 * Dependência de ícones (Expo):
 * npx expo install @expo/vector-icons
 */

const MOCK_DATA = {
  userName: 'João',
  todaySales: 0,
  salesCount: 0,
  receivedToday: 0,
  pendingPayments: 0,
  waitingSync: 0,
  products: [
    { id: '1', name: 'Câmara reforçada Rinaldi', detail: 'R18 · mínimo 3', stock: 3 },
    { id: '2', name: 'WD-40 Multiuso', detail: '300 ml · mínimo 3', stock: 2 },
  ],
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

function Header({ userName }) {
  return (
    <View style={styles.header}>
      <View>
        <View style={styles.brandLine}>
          <Text style={styles.brandMister}>Mister</Text>
          <Text style={styles.brandGestao}>Gestão</Text>
        </View>
        <Text style={styles.subtitle}>Mister MotoPlace</Text>
      </View>

      <View style={styles.headerActions}>
        <TouchableOpacity
          accessibilityLabel="Notificações"
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="bell-outline" size={22} color="#525866" />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(userName || 'JP').slice(0, 2).toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
}

function SalesCard({ data }) {
  return (
    <View style={styles.salesCard}>
      <Text style={styles.salesEyebrow}>VENDAS DO DIA · DEMONSTRAÇÃO</Text>
      <Text style={styles.salesAmount}>{formatCurrency(data.todaySales)}</Text>
      <View style={styles.salesFooter}>
        <Text style={styles.mutedOnDark}>{data.salesCount} vendas registradas</Text>
        <Text style={styles.receivedText}>
          Recebido: {formatCurrency(data.receivedToday)}
        </Text>
      </View>
    </View>
  );
}

function ActionCard({ icon, title, description, onPress, accent = false }) {
  return (
    <TouchableOpacity
      style={[styles.actionCard, accent && styles.actionCardAccent]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons
        name={icon}
        size={25}
        color={accent ? '#171717' : '#F45108'}
      />
      <Text style={[styles.actionTitle, accent && styles.actionTitleAccent]}>
        {title}
      </Text>
      <Text
        numberOfLines={1}
        style={[styles.actionDescription, accent && styles.actionDescriptionAccent]}
      >
        {description}
      </Text>
    </TouchableOpacity>
  );
}

function MetricCard({ value, label }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function StockItem({ item }) {
  const isLowStock = item.stock <= 2;

  return (
    <TouchableOpacity style={styles.stockItem} activeOpacity={0.75}>
      <View style={styles.stockIcon}>
        <MaterialCommunityIcons name="package-variant-closed" size={20} color="#B75B20" />
      </View>
      <View style={styles.stockCopy}>
        <Text style={styles.stockName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.stockDetail}>{item.detail}</Text>
      </View>
      <Text style={[styles.stockCount, isLowStock && styles.stockCountLow]}>
        {item.stock}
      </Text>
    </TouchableOpacity>
  );
}

export default function MisterGestaoHome() {
  // Depois, obtenha estes dados do Firebase e mantenha o mesmo formato.
  const data = MOCK_DATA;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.prototypeBar}>
        <View style={styles.prototypeLeft}>
          <View style={styles.prototypeDot} />
          <Text style={styles.prototypeText}>Protótipo · dados fictícios</Text>
        </View>
        <View style={styles.offlineStatus}>
          <MaterialCommunityIcons name="wifi" size={13} color="#687080" />
          <Text style={styles.prototypeText}>Simular offline</Text>
        </View>
      </View>

      <Header userName={data.userName} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greeting}>
          <Text style={styles.pageTitle}>Seu dia, em um olhar.</Text>
          <Text style={styles.greetingSubtitle}>
            Olá, {data.userName}. Vamos atender?
          </Text>
        </View>

        <SalesCard data={data} />

        <View style={styles.actionsRow}>
          <ActionCard
            icon="plus"
            title="Nova venda"
            description="Começar venda"
            accent
            onPress={() => {}}
          />
          <ActionCard
            icon="barcode-scan"
            title="Escanear"
            description="Encontrar produto"
            onPress={() => {}}
          />
        </View>

        <View style={styles.metricsRow}>
          <MetricCard value={data.pendingPayments} label="Pagamentos pendentes" />
          <MetricCard value={data.waitingSync} label="Aguardando sincronização" />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>De olho no estoque</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => {}}>
            <Text style={styles.seeAll}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.stockList}>
          {data.products.map((item) => (
            <StockItem key={item.id} item={item} />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Formas de pagamento</Text>
        </View>
        <View style={styles.paymentCard}>
          <View style={styles.paymentIcon}>
            <MaterialCommunityIcons name="credit-card-outline" size={21} color="#F45108" />
          </View>
          <View style={styles.paymentCopy}>
            <Text style={styles.paymentTitle}>Resumo de pagamentos</Text>
            <Text style={styles.paymentSubtitle}>Acompanhe os recebimentos do dia</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={21} color="#8B909A" />
        </View>

        <Text style={styles.demoNote}>
          Os valores exibidos são demonstrativos e ainda não estão conectados ao Firebase.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  prototypeBar: {
    height: 25,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  prototypeLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  prototypeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8A8F98',
  },
  prototypeText: { color: '#777D87', fontSize: 9 },
  offlineStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  header: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  brandLine: { flexDirection: 'row', alignItems: 'baseline' },
  brandMister: { fontSize: 17, fontWeight: '800', color: '#18191C', letterSpacing: -0.6 },
  brandGestao: { fontSize: 17, fontWeight: '800', color: '#F45108', letterSpacing: -0.6 },
  subtitle: { fontSize: 9, color: '#7C818A', marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconButton: {
    width: 29,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    right: 3,
    top: 5,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#F45108',
  },
  avatar: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F1F3',
  },
  avatarText: { fontSize: 9, fontWeight: '700', color: '#5B606A' },
  scroll: { flex: 1, backgroundColor: '#F6F6F7' },
  content: { paddingHorizontal: 14, paddingTop: 15, paddingBottom: 28 },
  greeting: { marginBottom: 12 },
  pageTitle: { fontSize: 20, lineHeight: 25, fontWeight: '800', color: '#202126', letterSpacing: -0.55 },
  greetingSubtitle: { fontSize: 11, color: '#858A93', marginTop: 2 },
  salesCard: {
    backgroundColor: '#090A0B',
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingTop: 13,
    paddingBottom: 11,
    minHeight: 101,
    marginBottom: 12,
  },
  salesEyebrow: { color: '#F2F2F2', fontSize: 8, fontWeight: '600', letterSpacing: 0.15 },
  salesAmount: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginTop: 9, letterSpacing: -0.5 },
  salesFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 7,
  },
  mutedOnDark: { color: '#777B81', fontSize: 8 },
  receivedText: { color: '#F0F0F0', fontSize: 8, fontWeight: '500' },
  actionsRow: { flexDirection: 'row', gap: 9, marginBottom: 11 },
  actionCard: {
    flex: 1,
    minWidth: 0,
    height: 86,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E1E4',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  actionCardAccent: { backgroundColor: '#F45108', borderColor: '#F45108' },
  actionTitle: { color: '#222328', fontSize: 12, fontWeight: '750', marginTop: 1 },
  actionTitleAccent: { color: '#171717' },
  actionDescription: { color: '#898E97', fontSize: 8 },
  actionDescriptionAccent: { color: '#B93800' },
  metricsRow: { flexDirection: 'row', gap: 9, marginBottom: 14 },
  metricCard: {
    flex: 1,
    height: 65,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E2E5',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingTop: 9,
  },
  metricValue: { color: '#202126', fontSize: 16, fontWeight: '700' },
  metricLabel: { color: '#858A93', fontSize: 8, marginTop: 5 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#27282D' },
  seeAll: { fontSize: 9, color: '#747983' },
  stockList: { gap: 9, marginBottom: 16 },
  stockItem: {
    minHeight: 53,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E1E4',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  stockIcon: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockCopy: { flex: 1, minWidth: 0 },
  stockName: { color: '#292A2F', fontSize: 10, fontWeight: '700' },
  stockDetail: { color: '#858A93', fontSize: 8, marginTop: 3 },
  stockCount: { color: '#F45108', fontSize: 15, fontWeight: '800', paddingHorizontal: 2 },
  stockCountLow: { color: '#D9430B' },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E1E4',
    borderRadius: 10,
    padding: 11,
    gap: 10,
  },
  paymentIcon: { width: 30, alignItems: 'center' },
  paymentCopy: { flex: 1 },
  paymentTitle: { fontSize: 10, color: '#292A2F', fontWeight: '700' },
  paymentSubtitle: { fontSize: 8, color: '#858A93', marginTop: 3 },
  demoNote: {
    color: '#969AA2',
    fontSize: 8,
    lineHeight: 12,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 10,
  },
});
'''
path = '/mnt/data/MisterGestaoHome.js'
with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
print(path)

