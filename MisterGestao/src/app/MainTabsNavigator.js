import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../view/Home';
import ProductsScreen from '../view/Produtos';
import UpcomingScreen from '../view/EmDesenvolvimento';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: 'home-outline',
  Produtos: 'package-variant-closed',
  Orcamentos: 'clipboard-text-outline',
  Venda: 'cart-outline',
};

export default function MainTabsNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      backBehavior="initialRoute"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#F45108',
        tabBarInactiveTintColor: '#858A93',
        tabBarLabelPosition: 'below-icon',
        tabBarLabelStyle: styles.label,
        tabBarHideOnKeyboard: true,
        tabBarStyle: [
          styles.bar,
          { height: 64 + insets.bottom, paddingBottom: Math.max(insets.bottom, 8) },
        ],
        tabBarIcon: ({ color, focused }) => (
          <View style={[styles.icon, focused && styles.activeIcon]}>
            <MaterialCommunityIcons name={TAB_ICONS[route.name]} size={22} color={color} />
          </View>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Hoje' }} />
      <Tab.Screen name="Produtos" component={ProductsScreen} />
      <Tab.Screen name="Orcamentos" component={UpcomingScreen} options={{ title: 'Orçamentos' }} />
      <Tab.Screen name="Venda" component={UpcomingScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E9EAED',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
    elevation: 0,
    shadowOpacity: 0,
  },
  label: { fontSize: 10, fontWeight: '600', marginTop: 3 },
  icon: {
    width: 48,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIcon: { backgroundColor: '#FFF0E6' },
});
