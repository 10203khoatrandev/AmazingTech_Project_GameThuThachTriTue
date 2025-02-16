import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";

const DetailAnswer = ({ route }) => {
  const navigation = useNavigation();
  const { questionData } = route.params;
  return (
    <View style={styles.container}>
      <TouchableOpacity 
      onPress={() => navigation.goBack()}
      style={styles.header}>
        <Image
        style={{tintColor: "#000", width: 25, height: 25}}
        source={require("../Images/previous.png")} />
      </TouchableOpacity>
      <Text style={styles.title}>Chi Tiết Đáp Án</Text>
      <FlatList
      data={questionData}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item }) => (
        <View style={[styles.answerContainer,{
          backgroundColor: item.correctOption == 1 ? "#1F8435" : "#FA3939"
        }]}>
          <Text style={styles.questionLabel}>{item.question}</Text>
          <Text style={styles.answerLabel}>{item.correctOption == 1 ? "Đáp án là: Đúng" : "Đáp án là: Sai"}</Text>
          <Text style={styles.explainLabel}>Giải thích:</Text>
          <Text style={styles.explanationText}>{item.explanation}</Text>
        </View>
      )}
      />
    </View>
  );
};

export default DetailAnswer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBECFF",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#A42FC1",
    alignSelf: "center",
    textAlign: "center",
    marginBottom: 20,
  },
  header:{ 
    flexDirection: "row",
    marginTop: 70,
    marginLeft: 30,
  },
  answerContainer:{
    width: "90%",
    alignSelf: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    marginBottom: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  questionLabel:{
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#F5F5F5"
  },
  answerLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#F5F5F5",
    marginVertical: 5
  },
  explainLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#F5F5F5",
    marginVertical: 5
  },
  explanationText: {
    fontSize: 16,
    color: "#F5F5F5",
    marginVertical: 5
  }
});
