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
    backgroundColor: "#FF5E78",
    padding: 10,
    marginVertical: 10,
    borderRadius: 10,
  },
  text: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
});
