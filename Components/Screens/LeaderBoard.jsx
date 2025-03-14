import { StyleSheet, Text, View, Image, ScrollView } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ref, get, update } from "firebase/database";
import { realtimeDb } from "../config";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LeaderBoard = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [userLogged, setUserLogged] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lấy ID người dùng đã đăng nhập từ AsyncStorage
  const getUserId = async () => {
    try {
      const userData = await AsyncStorage.getItem("userLogin");
      if (userData) {
        const user = JSON.parse(userData);
        setUserId(user.id || user.uid);
        setUserLogged(user);
      }
    } catch (error) {
      console.error("Lỗi khi lấy userId từ AsyncStorage:", error);
    }
  };

  //Hàm cập nhật ranking
  const updateUserRanks = async (usersWithRank) => {
    try {
      const updates = {};

      // Tạo object chứa các cập nhật cho mỗi user
      usersWithRank.forEach((user) => {
        updates[`users/${user.id}/rank`] = user.rank;
      });

      // Thực hiện cập nhật tất cả cùng lúc
      await update(ref(realtimeDb), updates);
      console.log("Đã cập nhật rank cho tất cả người dùng");
    } catch (error) {
      console.error("Lỗi khi cập nhật rank:", error);
    }
  };

  // Fetch tất cả người dùng từ Firebase Realtime DB và sắp xếp theo điểm
  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      // Lấy tham chiếu đến node users trên database
      const usersRef = ref(realtimeDb, "users");

      // Lấy dữ liệu
      const snapshot = await get(usersRef);

      if (snapshot.exists()) {
        const usersData = snapshot.val();

        // Chuyển đổi từ object sang array và lọc ra những user có đủ thông tin cần thiết
        const usersArray = Object.keys(usersData)
          .map((key) => {
            const userData = usersData[key];

            // Kiểm tra xem user có thuộc tính name và point không
            if (userData && userData.name && userData.point !== undefined) {
              return {
                id: key,
                name: userData.name,
                point: userData.point,
                // Sử dụng avatar từ database hoặc ảnh mặc định
                avatar: userData.avatar 
                  ? { uri: userData.avatar }
                  : require("../Images/character2.png"),
                email: userData.email,
                status: userData.status,
                rank: userData.rank || 0,
              };
            }
            return null;
          })
          .filter((user) => user !== null); // Lọc bỏ những user không có đủ thông tin

        // Sắp xếp theo điểm cao đến thấp
        const sortedUsers = usersArray.sort((a, b) => b.point - a.point);

        // Thêm thuộc tính rank cho mỗi user dựa trên vị trí trong mảng đã sắp xếp
        const usersWithRank = sortedUsers.map((user, index) => {
          const newRank = index + 1;
          return { ...user, rank: newRank };
        });

        // Kiểm tra xem rank có thay đổi không để quyết định cập nhật lên database
        const rankChanged = usersWithRank.some(
          (user) => user.rank !== user.previousRank
        );

        // Cập nhật rank lên database nếu có sự thay đổi
        if (rankChanged) {
          updateUserRanks(usersWithRank);
        }

        setAllUsers(sortedUsers);
      } else {
        console.log("Không có dữ liệu user");
        setAllUsers([]);
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu từ Realtime DB:", error);
      setAllUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch dữ liệu người dùng hiện tại
  const fetchUserLogged = async () => {
    if (!userId) return;

    try {
      const userRef = ref(realtimeDb, `users/${userId}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const userData = snapshot.val();
        setUserLogged({
          id: userId,
          ...userData,
        });
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu người dùng:", error);
    }
  };

  // Effects
  useEffect(() => {
    getUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserLogged();
    }
  }, [userId]);

  // Sử dụng useFocusEffect để làm mới dữ liệu mỗi khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      fetchAllUsers();
      if (userId) {
        fetchUserLogged();
      }
    }, [userId])
  );

  // Phân chia dữ liệu
  const top3 = allUsers.slice(0, 3);
  const restOfUsers = allUsers.slice(3);

  // Tìm vị trí của người dùng hiện tại trong bảng xếp hạng
  const findUserRank = () => {
    if (!userLogged || !allUsers.length) return -1;
    const foundUser = allUsers.find((user) => user.id === userId);
    return foundUser ? foundUser.rank : -1;
  };

  const userRank = findUserRank();

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={styles.headerTitle}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
      </View>

      {/* Top 3 BXH */}
      <View style={styles.podiumContainer}>
        {/* Hạng 2 */}
        {top3.length > 1 && (
          <View style={styles.podiumSecond}>
            <View style={[styles.crownContainer, styles.crownContainerSecond]}>
              <Text style={styles.crownText}>2</Text>
            </View>
            <Image
              source={top3[1]?.avatar}
              style={[styles.topAvatar, styles.secondAvatar]}
            />
            <Text style={styles.topName}>{top3[1]?.name}</Text>
            <Text style={styles.topScore}>{top3[1]?.point}</Text>
          </View>
        )}

        {/* Hạng nhất */}
        {top3.length > 0 && (
          <View style={styles.podiumFirst}>
            <View style={[styles.crownContainer, styles.crownContainerFirst]}>
              <Text style={[styles.crownText, styles.crownTextFirst]}>1</Text>
            </View>
            <Image
              source={top3[0]?.avatar}
              style={[styles.topAvatar, styles.firstAvatar]}
            />
            <Text style={styles.topName}>{top3[0]?.name}</Text>
            <Text style={styles.topScore}>{top3[0]?.point}</Text>
          </View>
        )}

        {/* Hạng 3 */}
        {top3.length > 2 && (
          <View style={styles.podiumThird}>
            <View style={[styles.crownContainer, styles.crownContainerThird]}>
              <Text style={styles.crownText}>3</Text>
            </View>
            <Image
              source={top3[2]?.avatar}
              style={[styles.topAvatar, styles.thirdAvatar]}
            />
            <Text style={styles.topName}>{top3[2]?.name}</Text>
            <Text style={styles.topScore}>{top3[2]?.point}</Text>
          </View>
        )}
      </View>

      {/* Các người chơi còn lại */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>All Time Rankings</Text>
        <ScrollView style={styles.scrollView}>
          {restOfUsers.map((user) => (
            <View
              key={user.id}
              style={[
                styles.userRow,
                userId === user.id && styles.currentUserRow,
              ]}
            >
              <View style={styles.rankContainer}>
                <Text style={styles.rankText}>{user.rank}</Text>
              </View>
              <Image source={user.avatar} style={styles.listAvatar} />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <View style={styles.userScoreContainer}>
                  <Text style={styles.userScore}>{user.point} points</Text>
                  {user.status && (
                    <View
                      style={[
                        styles.statusIndicator,
                        user.status === "online"
                          ? styles.statusOnline
                          : styles.statusOffline,
                      ]}
                    />
                  )}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Hiển thị rank của người dùng hiện tại */}
      {userRank > 0 && (
        <View style={styles.currentUserContainer}>
          <Text style={styles.currentUserText}>
            Your Rank: {userRank} / {allUsers.length}
          </Text>
        </View>
      )}
    </View>
  );
};

export default LeaderBoard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6a5adf",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    marginTop: 20,
    height: 200,
  },
  podiumFirst: {
    alignItems: "center",
    marginHorizontal: 10,
    zIndex: 3,
  },
  podiumSecond: {
    alignItems: "center",
    marginTop: 30,
    marginHorizontal: 10,
    zIndex: 2,
  },
  podiumThird: {
    alignItems: "center",
    marginTop: 50,
    marginHorizontal: 10,
    zIndex: 1,
  },
  crownContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  crownContainerFirst: {
    backgroundColor: "#FFD700", // Gold
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  crownContainerSecond: {
    backgroundColor: "#C0C0C0", // Silver
  },
  crownContainerThird: {
    backgroundColor: "#CD7F32", // Bronze
  },
  crownText: {
    fontWeight: "bold",
    color: "#333",
  },
  crownTextFirst: {
    color: "#fff",
    fontSize: 18,
  },
  topAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: "#fff",
  },
  firstAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: "#FFD700", // Gold
  },
  secondAvatar: {
    borderColor: "#C0C0C0", // Silver
  },
  thirdAvatar: {
    borderColor: "#CD7F32", // Bronze
  },
  topName: {
    color: "#fff",
    fontWeight: "500",
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
  },
  topScore: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  listContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 30,
    padding: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  scrollView: {
    flex: 1,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  currentUserRow: {
    backgroundColor: "rgba(106, 90, 223, 0.1)",
    borderRadius: 8,
  },
  rankContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rankText: {
    fontWeight: "bold",
    color: "#666",
  },
  listAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    marginLeft: 15,
    flex: 1,
  },
  userName: {
    fontWeight: "500",
    color: "#333",
    fontSize: 16,
  },
  userScoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  userScore: {
    color: "#666",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  statusOnline: {
    backgroundColor: "#4CAF50",
  },
  statusOffline: {
    backgroundColor: "#9E9E9E",
  },
  currentUserContainer: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  currentUserText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
