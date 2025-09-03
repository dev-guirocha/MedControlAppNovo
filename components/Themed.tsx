import React from 'react';
import { Text as DefaultText, View as DefaultView, TextProps, ViewProps } from 'react-native';

export function Text(props: TextProps) {
  return <DefaultText {...props} />;
}

export function View(props: ViewProps) {
  return <DefaultView {...props} />;
}