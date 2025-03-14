import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ref, get, remove, onValue, off, update } from "firebase/database";
import { auth, realtimeDb } from "../config";
import {
  CommonActions,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Result = ({ route }) => {
  const [name, setName] = useState("");
  const [ranking, setRanking] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [highScoreUpdated, setHighScoreUpdated] = useState(false);
  const [allPlayersHaveScores, setAllPlayersHaveScores] = useState(false);
  const [playersWithScores, setPlayersWithScores] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);

  const navigation = useNavigation();
  const {
    answered,
    skipped,
    numberofquestion,
    correct,
    wrong,
    questions,
    totalTime,
    roomid,
  } = route.params;

  const user = auth.currentUser;
  
  const completionPercentage = useMemo(() => 
    Math.round((answered / numberofquestion) * 100), 
    [answered, numberofquestion]
  );
  
  const score = useMemo(() => 
    Math.round((correct / numberofquestion) * 100 * 10) / 10,
    [correct, numberofquestion]
  );

  // Lưu điểm khi component mount
  useEffect(() => {
    if (!scoreSaved && user?.uid) {
      saveScore();
    }
  }, [user, scoreSaved]);

  // Fetch tên người chơi từ Firebase - chỉ gọi một lần khi có user
  useEffect(() => {
    if (user?.uid) {
      const userRef = ref(realtimeDb, `users/${user.uid}/name`);
      get(userRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setName(userData.playerName || "");
          }
        })
        .catch((error) => console.error("Error getting name:", error));
    }
  }, [user]);

  // Lắng nghe xếp hạng và cho biết người thắng thua
  useEffect(() => {
    let playersListener = null;
    
    if (roomid) {
      const playersRef = ref(realtimeDb, `rooms/${roomid}/players`);
      
      playersListener = onValue(playersRef, (snapshot) => {
        setIsLoading(false);
        
        if (snapshot.exists()) {
          const playersData = snapshot.val();

          // Lọc và xử lý dữ liệu người chơi
          const activePlayersArray = Object.keys(playersData)
            .map((key) => ({ uid: key, ...playersData[key] }))
            .filter((player) => !player.left);

          setTotalPlayers(activePlayersArray.length);

          const playersWithScoresCount = activePlayersArray.filter(
            (player) => player.diem != null
          ).length;
          setPlayersWithScores(playersWithScoresCount);

          // Kiểm tra xem tất cả người chơi đã có điểm chưa
          const allHaveScores = activePlayersArray.every(
            (player) => player.diem != null
          );
          setAllPlayersHaveScores(allHaveScores);

          // Sắp xếp bảng xếp hạng theo điểm và thời gian
          const sortedPlayers = [...activePlayersArray].sort((a, b) => {
            if (a.diem == null) return 1;
            if (b.diem == null) return -1;
            if (a.diem !== b.diem) return b.diem - a.diem;
            if (a.totalTime == null) return 1;
            if (b.totalTime == null) return -1;
            return a.totalTime - b.totalTime;
          });

          setRanking(sortedPlayers);

          // Tự động cập nhật điểm cao nhất sau khi có ranking
          if (!highScoreUpdated && allHaveScores) {
            updateHighestScore(sortedPlayers);
          }
        } else {
          setRanking([]);
          setAllPlayersHaveScores(false);
        }
      });
    } else {
      setIsLoading(false);
    }

    // Cleanup
    return () => {
      if (playersListener && roomid) {
        off(ref(realtimeDb, `rooms/${roomid}/players`), "value", playersListener);
      }
    };
  }, [roomid, highScoreUpdated, user]);

  // Hàm để cập nhật điểm cho người chơi có điểm cao nhất
  const updateHighestScore = useCallback(async (players) => {
    if (!players || players.length === 0 || !roomid || highScoreUpdated || !user?.uid) {
      return;
    }

    try {
      // Lọc ra những người chơi không thoát và có điểm
      const activePlayers = players.filter(
        (player) => !player.left && player.diem != null
      );

      if (activePlayers.length === 0) return;

      // Lấy người chơi có điểm cao nhất
      const highestScorePlayer = activePlayers[0];

      // Lấy thông tin về phòng chơi từ database
      const roomRef = ref(realtimeDb, `rooms/${roomid}`);
      const roomSnapshot = await get(roomRef);

      if (roomSnapshot.exists()) {
        const roomData = roomSnapshot.val();

        // Lưu thông tin người thắng cuộc vào phòng để tránh thông báo nhiều lần
        if (!roomData.winnerDetermined) {
          await update(roomRef, {
            winnerDetermined: true,
            winnerId: highestScorePlayer.uid,
          });

          const userRef = ref(realtimeDb, `users/${highestScorePlayer.uid}`);
          const userSnapshot = await get(userRef);

          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            const currentPoints = userData.point || 0;
            const bonusPoints = roomData.point * 2;

            // Cộng thêm điểm cho người chơi chiến thắng
            await update(userRef, {
              point: currentPoints + bonusPoints,
            });

            // Hiển thị thông báo nếu người chơi hiện tại là người thắng cuộc
            if (highestScorePlayer.uid === user.uid) {
              Alert.alert(
                "Chúc mừng!",
                `Bạn đạt điểm cao nhất và được cộng thêm ${bonusPoints} điểm vào tài khoản!`,
                [{ text: "OK" }]
              );
            }
          }
        } else {
          // Nếu người thắng đã được xác định, chỉ hiển thị thông báo nếu người chơi hiện tại là người thắng
          if (roomData.winnerId === user.uid) {
            Alert.alert(
              "Chúc mừng!",
              `Bạn đạt điểm cao nhất và được cộng thêm ${roomData.point * 2} điểm vào tài khoản!`,
              [{ text: "OK" }]
            );
          }
        }
      }

      setHighScoreUpdated(true);
    } catch (error) {
      console.error("Error updating highest score:", error);
    }
  }, [roomid, highScoreUpdated, user]);

  // Lưu điểm vào AsyncStorage và cập nhật Firebase
  const saveScore = useCallback(async () => {
    if (scoreSaved || !user?.uid) return;

    try {
      // Lưu lịch sử điểm vào AsyncStorage
      const history = await AsyncStorage.getItem("history");
      const currentHistory = history ? JSON.parse(history) : [];

      const newHistory = [
        ...currentHistory,
        {
          userId: user.uid,
          score,
          correct,
          wrong,
          totalTime,
          ranking: ranking.length > 0 ? ranking : [],
          timestamp: new Date().toISOString(),
        },
      ];

      await AsyncStorage.setItem("history", JSON.stringify(newHistory));
      setScoreSaved(true);

      // Cập nhật điểm người chơi hiện tại trong phòng
      if (roomid) {
        const playerRef = ref(realtimeDb, `rooms/${roomid}/players/${user.uid}`);
        await update(playerRef, {
          diem: score,
          totalTime: totalTime,
        });
      }
    } catch (error) {
      console.error("Error saving score:", error);
    }
  }, [
    scoreSaved, user, score, correct, wrong, answered, 
    skipped, numberofquestion, totalTime, ranking, roomid
  ]);

  // Xử lý khi người dùng trở về trang chủ
  const handleGoHome = useCallback(async () => {
    try {
      if (user?.uid) {
        const roomId = await AsyncStorage.getItem("currentRoomId");

        if (roomId) {
          // Đánh dấu trạng thái "đã thoát" cho người chơi
          const playerRef = ref(realtimeDb, `rooms/${roomId}/players/${user.uid}`);
          await update(playerRef, { left: true });

          // Kiểm tra nếu phòng không còn ai chưa thoát
          const playersRef = ref(realtimeDb, `rooms/${roomId}/players`);
          const playersSnapshot = await get(playersRef);

          if (playersSnapshot.exists()) {
            const playersData = playersSnapshot.val();
            const activePlayers = Object.values(playersData).filter(
              (player) => !player.left
            );

            // Nếu không còn ai chưa thoát, xoá phòng
            if (activePlayers.length === 0) {
              const roomRef = ref(realtimeDb, `rooms/${roomId}`);
              await remove(roomRef);
            }
          }

          // Xoá roomId từ AsyncStorage
          await AsyncStorage.removeItem("currentRoomId");
        }

        // Reset navigation stack
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Home" }],
          })
        );
      }
    } catch (error) {
      console.error("Error leaving room:", error);
      // Fallback navigation
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Home" }],
        })
      );
    }
  }, [user, navigation]);

  // Hiển thị thông tin xếp hạng người chơi
  const renderRankingItem = useCallback((player, index, allPlayers) => {
    // Lọc ra những người chơi có điểm số và chưa rời phòng
    const activePlayers = allPlayers.filter((p) => p.diem != null && !p.left);

    // Sắp xếp theo điểm số và thời gian chơi
    const sortedActivePlayers = [...activePlayers].sort((a, b) => {
      if (a.diem !== b.diem) return b.diem - a.diem;
      if (a.totalTime == null) return 1;
      if (b.totalTime == null) return -1;
      return a.totalTime - b.totalTime;
    });

    // Tìm thứ hạng thực của người chơi này trong số những người còn hoạt động
    const realRank = sortedActivePlayers.findIndex((p) => p.uid === player.uid);
    
    // Check current user
    const isCurrentUser = player.uid === user?.uid;

    return (
      <View 
        style={[
          styles.rankingItem, 
          isCurrentUser && styles.currentUserRankingItem
        ]} 
        key={player.uid}
      >
        <View style={styles.playerInfoContainer}>
          <View style={styles.avatarContainer}>
            <Image
              source={player.avatar 
                ? { uri: player.avatar }
                : require("../Images/character2.png")}
              style={styles.playerAvatar}
            />
            {isCurrentUser && (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>Bạn</Text>
              </View>
            )}
          </View>
          
          <View style={styles.playerDetails}>
            <Text 
              style={[
                styles.playerName,
                isCurrentUser && styles.currentUserName
              ]}
              numberOfLines={1}
            >
              {player.username || "Chưa có tên"}
              {player.left ? " (Đã thoát)" : ""}
            </Text>
            <Text style={styles.playerScore}>
              {player.diem != null 
                ? `${player.diem} điểm ${player.totalTime ? `• ${player.totalTime}s` : ''}`
                : "Chưa có điểm"}
            </Text>
          </View>
          
          {/* Badges for top 3 players */}
          {!player.left && realRank === 0 && (
            <Image
              source={require("../Images/first.png")}
              style={styles.rankBadge}
            />
          )}
          {!player.left && realRank === 1 && (
            <Image
              source={require("../Images/second.png")}
              style={styles.rankBadge}
            />
          )}
        </View>
      </View>
    );
  }, [user]);

  // Hiển thị thông tin thống kê
  const renderStatItem = useCallback((value, label, color, icon) => (
    <View style={styles.statContainer}>
      <View style={[styles.statHeader, { backgroundColor: color }]}>
        {icon && (
          <Image source={icon} style={styles.statIcon} />
        )}
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  ), []);

  // Hiển thị điểm số dạng biểu đồ
  const ScoreDisplay = useMemo(() => {
    const correctPercentage = Math.round((correct / numberofquestion) * 100);
    
    return (
      <View style={styles.scoreDisplayContainer}>
        <Text style={styles.scoreTitle}>Kết quả của bạn</Text>
        <View style={styles.scoreValue}>
          <Text style={styles.scoreNumber}>{score}</Text>
          <Text style={styles.scoreUnit}>điểm</Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${correctPercentage}%` }
              ]} 
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>{correct} đúng</Text>
            <Text style={styles.progressLabel}>{wrong} sai</Text>
          </View>
        </View>
      </View>
    );
  }, [score, correct, wrong, numberofquestion]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Hiển thị điểm ở trên đầu */}
          {ScoreDisplay}
          
          <View style={styles.contentBox}>
            {/* Hiển Thị Ranking */}
            <View style={styles.rankingSection}>
              <View style={styles.headerRow}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Image
                    style={styles.backIcon}
                    source={require("../Images/previous.png")}
                  />
                </TouchableOpacity>
                
                <Text style={styles.sectionTitle}>Bảng xếp hạng</Text>
                
                <View style={styles.placeholder} />
              </View>

              {isLoading ? (
                <ActivityIndicator size="large" color="#fff" style={styles.loader} />
              ) : allPlayersHaveScores && ranking.length > 0 ? (
                <View style={styles.rankingList}>
                  {ranking.map((player, index) =>
                    renderRankingItem(player, index, ranking)
                  )}
                </View>
              ) : (
                <View style={styles.waitingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.emptyMessage}>
                    {ranking.length > 0
                      ? `Đang chờ người chơi hoàn thành (${playersWithScores}/${totalPlayers})...`
                      : "Không có người chơi nào trong phòng"}
                  </Text>
                </View>
              )}
            </View>

            {/* Kết Quả */}
            <View style={styles.resultsCard}>
              <View style={styles.statsGrid}>
                {renderStatItem(
                  `${completionPercentage}%`,
                  "Hoàn thành",
                  "#A42FC1",
                  require("../Images/completion.png")
                )}
                
                {renderStatItem(
                  numberofquestion,
                  "Số câu hỏi",
                  "#3F51B5",
                  require("../Images/questions.png")
                )}
                
                {renderStatItem(
                  correct,
                  "Câu đúng",
                  "#1F8435",
                  require("../Images/correct.png")
                )}
                
                {renderStatItem(
                  `${totalTime}s`,
                  "Thời gian",
                  "#FA3939",
                  require("../Images/time.png")
                )}
              </View>
            </View>

            {/* Các nút tương tác */}
            <View style={styles.actionSection}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("DetailAnswer", {
                    questionData: questions,
                  })
                }
                style={styles.reviewButton}
              >
                <Image
                  source={require("../Images/review.png")}
                  style={styles.actionIcon}
                />
                <Text style={styles.reviewButtonText}>Xem đáp án</Text>
              </TouchableOpacity>
              
              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={handleGoHome}
                  style={styles.actionButton}
                >
                  <Image
                    source={require("../Images/home.png")}
                    style={styles.actionIcon}
                  />
                  <Text style={styles.actionText}>Trang chủ</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => {
                    Alert.alert(
                      "Chia sẻ kết quả",
                      "Tính năng đang phát triển, sẽ sớm có mặt trong bản cập nhật tiếp theo!"
                    );
                  }}
                >
                  <Image
                    source={require("../Images/share.png")}
                    style={styles.actionIcon}
                  />
                  <Text style={styles.actionText}>Chia sẻ</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Result;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FBECFF",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#FBECFF",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
    paddingBottom: 20,
  },
  // Score display
  scoreDisplayContainer: {
    width: "92%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  scoreValue: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 15,
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#A42FC1",
  },
  scoreUnit: {
    fontSize: 18,
    color: "#A42FC1",
    marginLeft: 5,
  },
  progressBarContainer: {
    width: "100%",
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: "#F0F0F0",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 5,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  progressLabel: {
    fontSize: 14,
    color: "#666",
  },
  // Main content box
  contentBox: {
    width: "92%",
    backgroundColor: "#fff",
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  // Ranking section
  rankingSection: {
    width: "100%",
    backgroundColor: "#A42FC1",
    borderRadius: 30,
    padding: 15,
    paddingBottom: 110, // Extra padding to allow overlap
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  backButton: {
    padding: 10,
  },
  backIcon: {
    width: 25,
    height: 20,
    tintColor: "#fff",
  },
  placeholder: {
    width: 45,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  loader: {
    marginTop: 30,
  },
  rankingList: {
    width: "100%",
    alignItems: "center",
    gap: 15,
  },
  rankingItem: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  currentUserRankingItem: {
    backgroundColor: "#F8F0FF",
    borderWidth: 2,
    borderColor: "#D9A4FF",
  },
  playerInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },
  avatarContainer: {
    position: "relative",
  },
  playerAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  youBadge: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "#A42FC1",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  youBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  playerDetails: {
    flex: 1,
    marginLeft: 15,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0C092A",
  },
  currentUserName: {
    color: "#A42FC1",
  },
  playerScore: {
    fontSize: 14,
    color: "#858494",
    marginTop: 2,
  },
  rankBadge: {
    width: 40,
    height: 40,
  },
  thirdPlace: {
    width: 35,
    height: 35,
    backgroundColor: "#CD7F32",
    borderRadius: 17.5,
    alignItems: "center",
    justifyContent: "center",
  },
  thirdPlaceText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  waitingContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  emptyMessage: {
    color: "#fff",
    textAlign: "center",
    marginTop: 10,
    fontSize: 16,
  },
  // Result card
  resultsCard: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 20,
    marginTop: -100,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
    marginBottom: 25,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  statContainer: {
    alignItems: "center",
    width: "48%",
    marginBottom: 20,
    backgroundColor: "#F8F8F8",
    borderRadius: 15,
    padding: 12,
    elevation: 1,
  },
  statHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statIcon: {
    width: 20,
    height: 20,
    tintColor: "#FFF",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: "#2B262D",
    textAlign: "center",
  },
  // Action buttons
  actionSection: {
    width: "100%",
    paddingHorizontal: 20,
    paddingBottom: 25,
  },
  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#A42FC1",
    borderRadius: 25,
    paddingVertical: 12,
    marginBottom: 20,
    shadowColor: "#A42FC1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    width: "40%",
    backgroundColor: "#F6F6F6",
    borderRadius: 20,
    padding: 15,
  },
  actionIcon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2B262D",
    textAlign: "center",
  },
});