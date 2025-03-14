import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View, SafeAreaView, StatusBar, ScrollView, Dimensions, Platform } from "react-native";
import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

const DetailAnswer = ({ route }) => {
  const navigation = useNavigation();
  const { questionData } = route.params;
  
  const renderItem = useCallback(({ item }) => (
    <View style={[styles.answerContainer, {
      backgroundColor: item.correctOption === "Đúng" ? "#1F8435" : "#FA3939"
    }]}>
      <Text style={styles.questionLabel}>{item.question}</Text>
      <Text style={styles.answerLabel}>
        Đáp án là: {item.correctOption === "Đúng" ? "Đúng" : "Sai"}
      </Text>
      <Text style={styles.explainLabel}>Giải thích:</Text>
      <Text style={styles.explanationText}>{item.explanation}</Text>
    </View>
  ), []);
  
  const keyExtractor = useCallback((_, index) => index.toString(), []);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FBECFF" barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Image
            style={styles.backIcon}
            source={require("../Images/previous.png")}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.title}>Chi Tiết Đáp Án</Text>
        <View style={styles.placeholder} />
      </View>
      
      <FlatList
        data={questionData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={10}
      />
    </SafeAreaView>
  );
};

export default DetailAnswer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBECFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    tintColor: "#000",
    width: 24,
    height: 24,
  },
  placeholder: {
    width: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#A42FC1",
    textAlign: "center",
  },
  listContainer: {
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  answerContainer: {
    width: "100%",
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  questionLabel: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#F5F5F5"
  },
  answerLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#F5F5F5",
    marginBottom: 12
  },
  explainLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#F5F5F5",
    marginBottom: 6
  },
  explanationText: {
    fontSize: 16,
    color: "#F5F5F5",
    lineHeight: 22
  }
});