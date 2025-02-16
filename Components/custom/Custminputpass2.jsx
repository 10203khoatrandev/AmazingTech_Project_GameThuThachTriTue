import { StyleSheet, Text, TextInput, View } from "react-native";
import React from "react";
import Icon from "react-native-vector-icons/Ionicons";
import Icon2 from "react-native-vector-icons/MaterialIcons";

const Custminputpass = ({
  placeholder,
  onPress,
  IconName,
  entry,
  onChangeText,
}) => {
  return (
    <View style={styles.Container}>
      <Icon2 name={"password"} style={styles.Icon}></Icon2>
      <TextInput
        secureTextEntry={entry}
        placeholder={placeholder}
        onChangeText={onChangeText}
        style={styles.input}
      ></TextInput>
      {entry == true ? (
        <Icon name={"eye"} style={styles.Icon} onPress={onPress}></Icon>
      ) : (
        <Icon name={"eye-off"} style={styles.Icon} onPress={onPress}></Icon>
      )}
    </View>
  );
};

export default Custminputpass;

const styles = StyleSheet.create({
  input: {
    width: "80%",
    fontSize: 20,
  },
  Icon: {
    fontSize: 30,
    marginRight: 10,
  },
  Container: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 50,
    borderColor: "black",
    borderWidth: 1,
    borderRadius: 10,
    paddingLeft: 10,
    marginBottom: 10,
    backgroundColor: "white",
  },
});
