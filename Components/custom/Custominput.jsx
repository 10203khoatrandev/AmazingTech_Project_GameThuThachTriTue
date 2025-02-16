import {StyleSheet, Text, TextInput, View} from 'react-native';
import React from 'react';
import Icon from'react-native-vector-icons/Fontisto';

const Custominput = ({placeholder, IconName, onChangeText}) => {
  return (
    <View style={styles.Container}>
      <Icon name={IconName} style={styles.Icon}></Icon>
      {/* {IconName && <Icon name={IconName} style={styles.Icon} />} */}
      <TextInput
        secureTextEntry={false}
        placeholder={placeholder}
        onChangeText={onChangeText}
        autoCapitalize='none'
        autoCorrect={false}
        style={styles.input}
      ></TextInput>
    </View>
  );
};

export default Custominput;
const styles = StyleSheet.create({
  input: {
    fontSize: 20,
    width: "100%",
  },
  Icon: {
    fontSize: 30,
    marginRight: 10,
  },
  Container: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height:50,
    borderColor: "black",
    borderWidth: 1,
    borderRadius: 10,
    paddingLeft: 10,
    marginBottom: 10,
    backgroundColor: "white",
  },
});
