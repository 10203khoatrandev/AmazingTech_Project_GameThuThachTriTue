import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  Dimensions,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { db } from "../config";
import { collection, getDocs, query, where } from "firebase/firestore";
const Home = () => {
  const [question, setQuestion] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    getCategory();
    console.log(question);
  }, []);

  const getCategory = async () => {
    if (loaded) return;
    const q = query(collection(db, "questions"));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      setQuestion((prev) => [...prev, doc.data()]);
    });
    setLoaded(true);
  };

  //lấy data Khoa học
  const ScienceData = question.filter(
    (item) => item.category === "Khoa Học và Công nghệ"
  );
  const scienceName = ScienceData.map((item) => item.category).slice(0,1);

  //lấy data Địa lý
  const geographyData = question.filter(
    (item) => item.category === "Địa lý và Môi trường"
  );
  const geoName = geographyData.map((item) => item.category).slice(0,1);

  //Lấy data Giải trí
  const sportData = question.filter(
    (item) => item.category === "Thể thao và Giải trí"
  );
  const sportName = sportData.map((item) => item.category).slice(0,1);

  return (
    <ScrollView contentContainerStyle={[styles.container]}>
      <View style={styles.header}>
        <View>
          <View style={styles.headerText}>
            <Image
              source={require("../Images/sun.png")}
              style={{ width: 20, height: 20 }}
            />
            <Text
              style={{
                fontSize: 12,
                color: "#FFD6DD",
                lineHeight: 18,
              }}
            >
              Chào mừng trở lại!
            </Text>
          </View>
          <Text
            style={{
              fontSize: 24,
              color: "#fff",
              fontWeight: "bold",
              marginHorizontal: 10,
            }}
          >
            Khoa Tran
          </Text>
        </View>
        <View style={styles.avatar}>
          <Image
            style={{ width: 48, height: 51, marginHorizontal: 10 }}
            source={require("../Images/kitty.png")}
          />
        </View>
      </View>
      <TouchableOpacity style={styles.recentQuiz}>
        <ImageBackground
          style={styles.maskRecent}
          resizeMode="cover"
          source={require("../Images/maskRecent.png")}
        >
          <View style={{ gap: 10 }}>
            <Text
              style={{
                fontSize: 18,
                color: "#660012",
                fontWeight: "600",
              }}
            >
              Tranh Tài
            </Text>
            <View style={{ flexDirection: "row", gap: 15 }}>
              <Image
                style={{
                  tintColor: "#660012",
                }}
                source={require("../Images/boxing.png")}
              />
              <Text
                style={{
                  width: 250,
                  fontSize: 14,
                  color: "#660012",
                  fontWeight: "600",
                }}
              >
                Thách đấu với mọi người để đạt thứ hạng cao hơn!
              </Text>
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
      <View style={styles.findFriendBox}>
        <ImageBackground
          source={require("../Images/maskFriend.png")}
          style={styles.maskFriend}
          resizeMode="cover"
        >
          <Text style={styles.featuredText}>Tiêu Điểm</Text>
          <Text style={styles.challengeText}>
            Tham gia vào trò chơi với bạn bè hoặc người lạ
          </Text>
          <TouchableOpacity
            onPress={console.log(ScienceData)}
            style={styles.btnFindFriend}
          >
            <Image
              source={require("../Images/friend.png")}
              style={styles.friendIcon}
            />
            <Text style={styles.findFriendText}>Kết bạn ngay</Text>
          </TouchableOpacity>
          <Image
            style={styles.friend1Image}
            source={require("../Images/friend1.png")}
          />
          <Image
            style={styles.friend2Image}
            source={require("../Images/friend2.png")}
          />
        </ImageBackground>
      </View>
      <View style={styles.liveQuiz}>
        <View style={styles.liveQuizTextTitle}>
          <Text style={styles.liveText}>Bộ câu hỏi hiện hành</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("QAmonitor", {
              category: "Khoa Học và Công nghệ",
            })
          }
          style={styles.quizBox}
        >
          <View style={styles.quizImg}>
            <Image
              style={{ width: 45, height: 45 }}
              source={require("../Images/atom.png")}
            />
          </View>
          <View style={{ justifyContent: "center", gap: 10 }}>
            <Text
              style={{
                fontSize: 16,
                color: "#0C092A",
                fontWeight: "bold",
              }}
            >
              {scienceName}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#858494",
              }}
            >
              {scienceName} • {ScienceData.length} câu hỏi
            </Text>
          </View>
          <View style={{ justifyContent: "center", marginRight: 10 }}>
            <Image
              style={{ width: 20, height: 20, tintColor: "#6A5AE0" }}
              source={require("../Images/forward.png")}
            />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("QAmonitor", {
              category: "Địa lý và Môi trường",
            })
          }
          style={styles.quizBox}
        >
          <View style={styles.quizImg}>
            <Image
              style={{ width: 45, height: 45 }}
              source={require("../Images/geography.png")}
            />
          </View>
          <View style={{ justifyContent: "center", gap: 10 }}>
            <Text
              style={{
                fontSize: 16,
                color: "#0C092A",
                fontWeight: "bold",
              }}
            >
              {geoName}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#858494",
              }}
            >
              {geoName} • {geographyData.length} câu hỏi
            </Text>
          </View>
          <View style={{ justifyContent: "center", marginRight: 10 }}>
            <Image
              style={{ width: 20, height: 20, tintColor: "#6A5AE0" }}
              source={require("../Images/forward.png")}
            />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("QAmonitor", {
              category: "Thể thao và Giải trí",
            })
          }
          style={styles.quizBox}
        >
          <View style={styles.quizImg}>
            <Image
              style={{ width: 45, height: 45 }}
              source={require("../Images/entertainment.png")}
            />
          </View>
          <View style={{ justifyContent: "center", gap: 10 }}>
            <Text
              style={{
                fontSize: 16,
                color: "#0C092A",
                fontWeight: "bold",
              }}
            >
              {sportName}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#858494",
              }}
            >
              {sportName} • {sportData.length} câu hỏi
            </Text>
          </View>
          <View style={{ justifyContent: "center", marginRight: 10 }}>
            <Image
              style={{ width: 20, height: 20, tintColor: "#6A5AE0" }}
              source={require("../Images/forward.png")}
            />
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#6A5AE0",
  },
  header: {
    width: "90%",
    marginTop: 65,
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "space-between",
  },
  headerText: {
    flexDirection: "row",
    gap: 10,
  },
  avatar: {
    width: 75,
    height: 75,
    backgroundColor: "#fff",
    borderRadius: 50,
    justifyContent: "center",
  },
  recentQuiz: {
    width: 327,
    height: 84,
    backgroundColor: "#FFCCD5",
    borderRadius: 20,
    marginTop: 30,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  maskRecent: {
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-evenly",
    overflow: "hidden",
  },
  findFriendBox: {
    width: 327,
    height: 232,
    borderRadius: 20,
    marginTop: 30,
  },
  maskFriend: {
    flex: 1,
    justifyContent: "flex-start",
    padding: 20,
    justifyContent: "space-evenly",
    alignItems: "center",
    overflow: "hidden",
  },
  featuredText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  challengeText: {
    width: "60%",
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 10,
  },
  btnFindFriend: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  friendIcon: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  findFriendText: {
    fontSize: 14,
    color: "#6A5AE0",
    fontWeight: "bold",
  },
  friend1Image: {
    position: "absolute",
    top: 15,
    left: 20,
    width: 50,
    height: 50,
  },
  friend2Image: {
    position: "absolute",
    bottom: 40,
    right: 15,
    width: 64,
    height: 56,
  },
  liveQuiz: {
    marginTop: 30,
    width: "100%",
    height: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  liveQuizTextTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  liveText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0C092A",
  },
  seeAllText: {
    fontSize: 14,
    lineHeight: 28,
    fontWeight: "600",
    color: "#6A5AE0",
  },
  quizBox: {
    width: 327,
    height: 80,
    borderWidth: 2,
    borderColor: "#E5E5EA",
    borderRadius: 20,
    justifyContent: "space-between",
    alignSelf: "center",
    flexDirection: "row",
    margin: 10,
  },
  quizImg: {
    width: 64,
    height: 64,
    backgroundColor: "#C4D0FB",
    borderRadius: 15,
    margin: 5,
    justifyContent: "center",
    alignItems: "center",
  },
});
