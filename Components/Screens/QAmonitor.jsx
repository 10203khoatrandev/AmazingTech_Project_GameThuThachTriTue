import { ImageBackground, StyleSheet, Text, View } from "react-native";
import React from "react";

const QAmonitor = () => {
  return (
    <View style={styles.container}>
      <View style={styles.contentBox}>
        <View style={styles.maskBox}></View>
        <View style={styles.questionBox}></View>
        <View style={styles.answerBox}></View>
        <View style={styles.answerBox}></View>
        <View style={styles.answerBox}></View>
        <View style={styles.answerBox}></View>
      </View>
    </View>
  );
};

export default QAmonitor;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBECFF",
    justifyContent: "center",
    alignItems: "center",
  },
  contentBox: {
    width: "90%",
    height: "95%",
    backgroundColor: "#fff",
    borderRadius: 30,
  },
  maskBox: {
    width: "100%",
    height: "30%",
    backgroundColor: "#A42FC1",
    borderRadius: 30,
  },
  questionBox: {
    width: "85%",
    height: "25%",
    backgroundColor: "#ff0000",
    borderRadius: 20,
    alignSelf: "center",
    marginTop: -100,
    marginBottom: 50,
  },
  answerBox:{
    width: "85%",
    height: "9%",
    backgroundColor: "#A42FC1",
    alignSelf: "center",
    borderRadius: 25,
    marginTop: 20
  }
});
