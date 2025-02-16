import {StyleSheet, Text, View} from 'react-native';
import React from 'react';

const Thanhngang = ({title}) => {
  return (
    <View style={styles.container}>
      <View style={styles.ngang}></View>
      <Text style={{fontSize: 20}}>{title}</Text>
      <View style={styles.ngang}></View>
    </View>
  );
};

export default Thanhngang;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  ngang: {
    flex: 1,
    height: 1,
    backgroundColor: 'blue',
    marginHorizontal: 10,
  },
});
