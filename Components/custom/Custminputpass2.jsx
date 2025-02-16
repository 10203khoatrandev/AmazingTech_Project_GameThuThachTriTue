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
        style={styles.input}
      ></TextInput>
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
    borderColor: "black",
    borderWidth: 1,
    borderRadius: 10,
    paddingLeft: 10,
    marginBottom: 10,
    backgroundColor: "white",
  },
});
