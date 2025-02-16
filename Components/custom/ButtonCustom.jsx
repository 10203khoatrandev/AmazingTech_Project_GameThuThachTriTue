import { Button, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React from "react";
// import {Button} from 'react-native-elements';
// import LinearGradient from 'react-native-linear-gradient'; // Add this import

const ButtonCustom = ({ title, onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

export default ButtonCustom;

const styles = StyleSheet.create({
  button: {
    width: "60%",
    // alignSelf: "center",
    // justifyContent: "center",
    // alignItems: "center",
    // elevation: 5, // Add this for shadow effect
    backgroundColor: "#4CAF50",
    padding: 10,
    marginVertical: 10,
    borderColor: "black",
    borderWidth: 1,
    borderRadius: 10,
  },
  text: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});
