import { StyleSheet, Text, TextInput, View } from 'react-native';

export default function FormField({ label, error, optional = false, editable = true, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {optional ? <Text style={styles.optional}> (opcional)</Text> : null}
      </Text>
      <TextInput
        editable={editable}
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor="#9A9CA1"
        {...inputProps}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '600', color: '#444850', marginBottom: 6 },
  optional: { fontWeight: '400', color: '#8F9297' },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#DEE0E4',
    borderRadius: 9,
    paddingHorizontal: 13,
    fontSize: 14,
    color: '#151619',
    backgroundColor: '#FFFFFF',
  },
  inputError: { borderColor: '#C94700' },
  errorText: { fontSize: 11, color: '#C94700', marginTop: 5 },
});
