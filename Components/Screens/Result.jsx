import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";

const Result = ({ route }) => {
  const navigation = useNavigation();
  const { answered, skipped, numberofquestion, correct, wrong, questions } =
    route.params;

  const handleReplay = () => {
    navigation.navigate("QAmonitor", {
      replay: true,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentBox}>
        <View style={styles.maskBox}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              style={{ margin: 20, tintColor: "#fff", width: 25, height: 25 }}
              source={require("../Images/previous.png")}
            />
          </TouchableOpacity>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Tổng Điểm</Text>
            <Text style={styles.scoreText}>
              {(correct / numberofquestion) * 100} điểm
            </Text>
          </View>
        </View>
        <View style={styles.resultBox}>
          <View style={styles.horzontalLine}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: "#A42FC1",
                  marginTop: 10,
                  borderRadius: 50,
                }}
              ></View>
              <Text
                style={{
                  fontSize: 24,
                  color: "#A42FC1",
                  fontWeight: "600",
                }}
              >
                {(answered / numberofquestion) * 100}%
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: "#A42FC1",
                  marginTop: 10,
                  borderRadius: 50,
                }}
              ></View>
              <Text
                style={{
                  fontSize: 24,
                  color: "#A42FC1",
                  fontWeight: "600",
                }}
              >
                {numberofquestion}
              </Text>
            </View>
          </View>
          <View style={styles.horzontalLine}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "400",
                color: "#2B262D",
              }}
            >
              Hoàn thành
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "400",
                color: "#2B262D",
              }}
            >
              Tổng số câu hỏi
            </Text>
          </View>
          <View style={styles.horzontalLine2}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: "#1F8435",
                  marginTop: 10,
                  borderRadius: 50,
                }}
              ></View>
              <Text
                style={{
                  fontSize: 24,
                  color: "#1F8435",
                  fontWeight: "600",
                }}
              >
                {correct}
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: "#FA3939",
                  marginTop: 10,
                  borderRadius: 50,
                }}
              ></View>
              <Text
                style={{
                  fontSize: 24,
                  color: "#FA3939",
                  fontWeight: "600",
                }}
              >
                {wrong}
              </Text>
            </View>
          </View>
          <View style={styles.horzontalLine}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "400",
                color: "#2B262D",
              }}
            >
              Câu đúng
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "400",
                color: "#2B262D",
              }}
            >
              Câu sai
            </Text>
          </View>
        </View>
        <View style={styles.horzontalLine}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("DetailAnswer", {
                questionData: questions,
              })
            }
            style={styles.itemBox}
          >
            <Image source={require("../Images/review.png")} />
            <Text style={styles.itemText}>Xem đáp án</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.itemBox}>
            <Image source={require("../Images/savepoint.png")} />
            <Text style={styles.itemText}>Lưu điểm</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleReplay()}
            style={styles.itemBox}
          >
            <Image source={require("../Images/retry.png")} />
            <Text style={styles.itemText}>Chơi lại</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.horzontalLine2}>
          <TouchableOpacity style={styles.itemBox}>
            <Image source={require("../Images/opposite.png")} />
            <Text style={styles.itemText}>Xem đối thủ</Text>
          </TouchableOpacity>
          <TouchableOpacity 
          onPress={() => navigation.navigate("Home")}
          style={styles.itemBox}>
            <Image source={require("../Images/home.png")} />
            <Text style={styles.itemText}>Trang chủ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.itemBox}>
            <Image source={require("../Images/share.png")} />
            <Text style={styles.itemText}>Chia sẻ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Result;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBECFF",
    justifyContent: "center",
    alignItems: "center",
  },
  contentBox: {
    width: "90%",
    height: "90%",
    backgroundColor: "#fff",
    borderRadius: 30,
    marginTop: 40,
  },
  maskBox: {
    width: "100%",
    height: "45%",
    backgroundColor: "#A42FC1",
    borderRadius: 30,
  },
  resultBox: {
    width: "90%",
    height: "25%",
    backgroundColor: "#fff",
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignSelf: "center",
    marginTop: -100,
    marginBottom: 50,
  },
  horzontalLine: {
    width: "85%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    alignSelf: "center",
  },
  horzontalLine2: {
    width: "85%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    alignSelf: "center",
  },
  scoreBox: {
    width: "35%",
    height: "38%",
    backgroundColor: "#fff",
    borderRadius: 100,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#fff",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    gap: 10,
  },
  scoreLabel: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#A42FC1",
  },
  scoreText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#A42FC1",
  },
  itemBox: {
    gap: 10,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#2B262D",
    textAlign: "center",
  },
});
