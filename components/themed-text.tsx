import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Typography } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'headlineLg' | 'headlineMd' | 'bodyLg' | 'bodyMd' | 'labelMd' | 'labelSm';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'headlineLg' ? styles.headlineLg : undefined,
        type === 'headlineMd' ? styles.headlineMd : undefined,
        type === 'bodyLg' ? styles.bodyLg : undefined,
        type === 'bodyMd' ? styles.bodyMd : undefined,
        type === 'labelMd' ? styles.labelMd : undefined,
        type === 'labelSm' ? styles.labelSm : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
  headlineLg: {
    ...Typography.headlineLg,
  },
  headlineMd: {
    ...Typography.headlineMd,
  },
  bodyLg: {
    ...Typography.bodyLg,
  },
  bodyMd: {
    ...Typography.bodyMd,
  },
  labelMd: {
    ...Typography.labelMd,
    textTransform: 'uppercase',
  },
  labelSm: {
    ...Typography.labelSm,
  },
});
