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
import React from "react";
const Home = () => {
  // const navigation = useNavigation();
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
              GOOD MORNING!
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
                fontSize: "14",
                color: "#660012",
                fontWeight: "600",
              }}
            >
              RECENT QUIZ
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Image
                style={{
                  tintColor: "#660012",
                }}
                source={require("../Images/headphone.png")}
              />
              <Text
                style={{
                  fontSize: 18,
                  color: "#660012",
                  fontWeight: "600",
                }}
              >
                A Basic Music Quiz
              </Text>
            </View>
          </View>
          <Image source={require("../Images/percent.png")} />
        </ImageBackground>
      </TouchableOpacity>
      <View style={styles.findFriendBox}>
        <ImageBackground
          source={require("../Images/maskFriend.png")}
          style={styles.maskFriend}
          resizeMode="cover"
        >
          <Text style={styles.featuredText}>FEATURED</Text>
          <Text style={styles.challengeText}>
            Take part in challenges with friends or other players
          </Text>
          <TouchableOpacity style={styles.btnFindFriend}>
            <Image
              source={require("../Images/friend.png")}
              style={styles.friendIcon}
            />
            <Text style={styles.findFriendText}>Find Friends</Text>
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
          <Text style={styles.liveText}>Live Quizzes</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.quizBox}>
          <View style={styles.quizImg}>
            <Image
              style={{ width: 45, height: 45 }}
              source={require("../Images/math.png")}
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
              Math Quiz
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#858494",
              }}
            >
              Math • 5 Quizzes
            </Text>
          </View>
          <View style={{ justifyContent: "center", marginRight: 10 }}>
            <Image
              style={{ width: 20, height: 20, tintColor: "#6A5AE0" }}
              source={require("../Images/forward.png")}
            />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quizBox}>
          <View style={styles.quizImg}>
            <Image
              style={{ width: 45, height: 45 }}
              source={require("../Images/eng.png")}
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
              English Quiz
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#858494",
              }}
            >
              English • 5 Quizzes
            </Text>
          </View>
          <View style={{ justifyContent: "center", marginRight: 10 }}>
            <Image
              style={{ width: 20, height: 20, tintColor: "#6A5AE0" }}
              source={require("../Images/forward.png")}
            />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quizBox}>
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
              Geography Quiz
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#858494",
              }}
            >
              Geography • 5 Quizzes
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
    marginTop: 20,
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
