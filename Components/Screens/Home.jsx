import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  SafeAreaView
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ref, update, get } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/FontAwesome";
import { realtimeDb } from "../config";

// Constants
const COUNTDOWN_INITIAL = 15;
const POINT_INCREMENT = 10;

// Component
const Home = () => {
  // Data
  const questionsData = require("../Model/questionData.json");
  
  // State
  const [userLogged, setUserLogged] = useState({});
  const [userId, setUserId] = useState(null);
  const [clearScreen, setClearScreen] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_INITIAL);
  const [canPress, setCanPress] = useState(false);

  // Refs
  const videoRef = useRef(null);
  const navigation = useNavigation();

  // Constants
  const categoryData = {
    science: {
      filter: "Khoa Học và Công nghệ",
      icon: require("../Images/atom.png"),
    },
    geography: {
      filter: "Địa lý và Môi trường",
      icon: require("../Images/geography.png"),
    },
    sport: {
      filter: "Thể thao và Giải trí",
      icon: require("../Images/entertainment.png"),
    },
  };

  const navigateToFriendsFromHome = () => {
    navigation.navigate('DiscoveryFrag', { 
      screen: 'Friends' 
    });
  };

  const navigateToRoomFromHome = () => {
    navigation.navigate('DiscoveryFrag', { 
      screen: 'Room' 
    });
  };

  // Filter categories
  const getFilteredData = useCallback((category) => {
    const filteredData = questionsData.filter(item => item.category === categoryData[category].filter);
    const categoryName = filteredData.length > 0 ? filteredData[0].category : '';
    return { data: filteredData, name: categoryName };
  }, [questionsData]);

  const scienceInfo = getFilteredData('science');
  const geographyInfo = getFilteredData('geography');
  const sportInfo = getFilteredData('sport');

  // Data fetching
  const fetchUserLogged = async () => {
    try {
      // Lấy thông tin người dùng từ AsyncStorage
      const userData = await AsyncStorage.getItem("userLogin");
      const userID = await AsyncStorage.getItem("userId");
      
      if (userID) {
        setUserId(JSON.parse(userID));
        
        // Lấy thông tin mới nhất từ Firebase để đảm bảo dữ liệu luôn được cập nhật
        const userRef = ref(realtimeDb, `users/${JSON.parse(userID)}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
          const firebaseUserData = snapshot.val();
          
          // Cập nhật userLogged state từ Firebase
          setUserLogged(firebaseUserData);
          
          // Cập nhật AsyncStorage với dữ liệu mới nhất
          await AsyncStorage.setItem("userLogin", JSON.stringify(firebaseUserData));
        } else if (userData) {
          // Fallback để sử dụng dữ liệu từ AsyncStorage nếu không thể kết nối Firebase
          setUserLogged(JSON.parse(userData));
        }
      } else if (userData) {
        setUserLogged(JSON.parse(userData));
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
      
      // Fallback để sử dụng dữ liệu từ AsyncStorage nếu có lỗi
      try {
        const userData = await AsyncStorage.getItem("userLogin");
        if (userData) {
          setUserLogged(JSON.parse(userData));
        }
      } catch (fallbackError) {
        console.error("Lỗi khi lấy dữ liệu từ AsyncStorage:", fallbackError);
      }
    }
  };

  // Effects
  useEffect(() => {
    fetchUserLogged();
  }, []);

  // Sử dụng useFocusEffect để làm mới dữ liệu mỗi khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      fetchUserLogged();
    }, [])
  );

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playAsync();
    }

    if (clearScreen) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanPress(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [clearScreen]);

  // Update user points
  const updateUserPoints = async (userId, newPoints) => {
    try {
      const userRef = ref(realtimeDb, `users/${userId}`);
      await update(userRef, { point: newPoints });
      console.log("Điểm đã được cập nhật thành công!");
      
      // Cập nhật lại thông tin người dùng sau khi cập nhật điểm
      await fetchUserLogged();
    } catch (error) {
      console.error("Lỗi khi cập nhật điểm:", error);
    }
  };

  // Event handlers
  const pressX = async () => {
    if (!canPress) return;
    
    setClearScreen(false);
    
    const newPoints = userLogged.point + POINT_INCREMENT;
    const updatedUserLogged = { ...userLogged, point: newPoints };
    
    setUserLogged(updatedUserLogged);

    try {
      await AsyncStorage.setItem("userLogin", JSON.stringify(updatedUserLogged));
      await updateUserPoints(userId, newPoints);
    } catch (error) {
      console.error("Lỗi khi lưu dữ liệu:", error);
    }
  };

  const pressClearScreen = () => {
    setClearScreen(true);
    setCanPress(false);
    setCountdown(COUNTDOWN_INITIAL);

    if (videoRef.current) {
      videoRef.current.playAsync();
    }
  };

  // UI Components
  const renderCategoryItem = useCallback(({ name, data, icon }) => (
    <TouchableOpacity style={styles.quizBox}>
      <View style={styles.quizImg}>
        <Image style={{ width: 45, height: 45 }} source={icon} />
      </View>
      <View style={styles.quizInfo}>
        <Text style={styles.categoryTitle}>{name}</Text>
        <Text style={styles.categorySubtitle}>
          {name} • {data.length} câu hỏi
        </Text>
      </View>
      <View style={styles.forwardIconContainer}>
        <Image
          style={styles.forwardIcon}
          source={require("../Images/forward.png")}
        />
      </View>
    </TouchableOpacity>
  ), []);

  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <View>
        <View style={styles.headerText}>
          <Image
            source={require("../Images/sun.png")}
            style={{ width: 20, height: 20 }}
          />
          <Text style={styles.welcomeText}>Chào mừng trở lại!</Text>
        </View>
        <Text style={styles.usernameText}>{userLogged.name}</Text>
      </View>
      <View style={styles.point}>
        <Icon name="diamond" size={20} color="#6A5AE0" />
        <Text style={styles.pointText}>{userLogged.point}</Text>
        <TouchableOpacity onPress={pressClearScreen}>
          <Ionicons name="add-circle-outline" size={28} color={"#6A5AE0"} />
        </TouchableOpacity>
      </View>
    </View>
  ), [userLogged, pressClearScreen]);

  const renderCountdownScreen = () => (
    <View style={styles.countdownContainer}>
      {/* Countdown circle */}
      <View style={styles.countdownCircle}>
        <TouchableOpacity onPress={pressX}>
          <Text style={styles.countdownText}>
            {canPress ? "X" : `${countdown}s`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Main render
  return (
    <SafeAreaView style={styles.mainContainer}>
      {clearScreen ? (
        renderCountdownScreen()
      ) : (
        <View style={styles.mainContainer}>
          {/* Header */}
          {renderHeader()}
          
          {/* ScrollView */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            {/* Recent Quiz */}
            <TouchableOpacity 
            style={styles.recentQuiz}>
              <ImageBackground
                style={styles.maskRecent}
                resizeMode="cover"
                source={require("../Images/maskRecent.png")}
              >
                <View style={styles.recentContent}>
                  <Text style={styles.recentTitle}>Tranh Tài</Text>
                  <View style={styles.recentDescription}>
                    <Image
                      style={{ tintColor: "#fff" }}
                      source={require("../Images/boxing.png")}
                    />
                    <Text style={styles.recentText}>
                      Thách đấu với mọi người để đạt thứ hạng cao hơn!
                    </Text>
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>
            
            {/* Find Friend */}
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
                  style={styles.btnFindFriend}
                  onPress={navigateToFriendsFromHome}
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
            
            {/* Live Quiz Section */}
            <View style={styles.liveQuiz}>
              <View style={styles.liveQuizTextTitle}>
                <Text style={styles.liveText}>Bộ câu hỏi hiện hành</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>Xem tất cả</Text>
                </TouchableOpacity>
              </View>
              
              {renderCategoryItem({
                name: scienceInfo.name,
                data: scienceInfo.data,
                icon: categoryData.science.icon
              })}
              
              {renderCategoryItem({
                name: geographyInfo.name,
                data: geographyInfo.data,
                icon: categoryData.geography.icon
              })}
              
              {renderCategoryItem({
                name: sportInfo.name,
                data: sportInfo.data,
                icon: categoryData.sport.icon
              })}
            </View>
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#6a4be4",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
  },
  countdownContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  countdownCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  countdownText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  header: {
    width: "90%",
    marginTop: 35,
    flexDirection: "row",
    alignSelf: "center",
    alignContent: "center",
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  headerText: {
    flexDirection: "row",
    gap: 10,
  },
  welcomeText: {
    fontSize: 12,
    color: "#FFD6DD",
    lineHeight: 18,
  },
  usernameText: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
    marginHorizontal: 10,
  },
  point: {
    flexDirection: "row",
    width: "35%",
    height: "80%",
    backgroundColor: "#fff",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  pointText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6A5AE0"
  },
  recentQuiz: {
    width: 327,
    height: 84,
    backgroundColor: "#FF5E78",
    borderRadius: 20,
    marginTop: 10,
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
  recentContent: {
    gap: 10,
  },
  recentTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },
  recentDescription: {
    flexDirection: "row",
    gap: 15,
  },
  recentText: {
    width: 250,
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
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
    bottom: 25,
    right: 15,
    width: 64,
    height: 56,
  },
  liveQuiz: {
    marginTop: 30,
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingBottom: 30,
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
    color: "#6a4be4",
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
    backgroundColor: "#ddd9fa",
    borderRadius: 15,
    margin: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  quizInfo: {
    justifyContent: "center",
    gap: 10,
  },
  categoryTitle: {
    fontSize: 16,
    color: "#0C092A",
    fontWeight: "bold",
  },
  categorySubtitle: {
    fontSize: 12,
    color: "#858494",
  },
  forwardIconContainer: {
    justifyContent: "center",
    marginRight: 10,
  },
  forwardIcon: {
    width: 20,
    height: 20,
    tintColor: "#6a4be4",
  },
});

export default Home;