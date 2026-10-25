import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) {
  const secondary = variant === 'secondary';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        secondary ? styles.secondary : styles.primary,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? <ActivityIndicator color={secondary ? '#151619' : '#FFFFFF'} /> : null}
      <Text style={[styles.text, secondary ? styles.secondaryText : styles.primaryText, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primary: { backgroundColor: '#C94700' },
  secondary: { borderWidth: 1, borderColor: '#DEE0E4', backgroundColor: '#FFFFFF' },
  disabled: { opacity: 0.6 },
  text: { fontSize: 15, fontWeight: '700' },
  primaryText: { color: '#FFFFFF' },
  secondaryText: { color: '#151619' },
});
