import {StyleSheet, Text, TextInput, View} from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import Icon2 from 'react-native-vector-icons/MaterialIcons';

const Custminputpass = ({
  placeholder,
  onPress,
  IconName,
  entry,
  onChangeText,
}) => {
  return (
    <View style={styles.Container}>
      <Icon2 name={'password'} style={styles.leftIcon}></Icon2>
      <TextInput
        secureTextEntry={entry}
        placeholder={placeholder}
        onChangeText={onChangeText}
        style={styles.input}></TextInput>
      {entry == true ? (
        <Icon name={'eye'} style={styles.rightIcon} onPress={onPress}></Icon>
      ) : (
        <Icon name={'eye-off'} style={styles.rightIcon} onPress={onPress}></Icon>
      )}
    </View>
  );
};

export default Custminputpass;

const styles = StyleSheet.create({
  input: {
    flex: 1,
    fontSize: 20,
    paddingHorizontal: 5,
  },
  leftIcon: {
    fontSize: 30,
    marginRight: 10,
  },
  rightIcon: {
    fontSize: 30,
    paddingHorizontal: 5, // Thêm padding ngang
  },
  Container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 10,
    paddingLeft: 10,
    paddingRight: 10, // Thêm padding bên phải cho container
    marginBottom: 10,
    backgroundColor: 'white',
  },
});