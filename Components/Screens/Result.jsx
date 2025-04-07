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
  Animated,
  Easing,
} from "react-native";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { ref, get, remove, onValue, off, update, set } from "firebase/database";
import { auth, realtimeDb } from "../config";
import {
  CommonActions,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from "lottie-react-native";

const Result = ({ route }) => {
  const [name, setName] = useState("");
  const [ranking, setRanking] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [highScoreUpdated, setHighScoreUpdated] = useState(false);
  const [allPlayersHaveScores, setAllPlayersHaveScores] = useState(false);
  const [playersWithScores, setPlayersWithScores] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [lottieAnimationFinished, setLottieAnimationFinished] = useState(false);
  const [scoresProcessed, setScoresProcessed] = useState(false);
  const [animationCompleted, setAnimationCompleted] = useState(false);
  const [allAnimationsCompleted, setAllAnimationsCompleted] = useState(false);
  const [animationStatus, setAnimationStatus] = useState({
    isWinner: false,
    shouldShow: false,
    finished: false,
  });

  const highScoreUpdatedRef = useRef(false);
  const scoresProcessedRef = useRef(false);
  const animationRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

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

  const completionPercentage = useMemo(
    () => Math.round((answered / numberofquestion) * 100),
    [answered, numberofquestion]
  );

  const score = useMemo(
    () => Math.round((correct / numberofquestion) * 100 * 10) / 10,
    [correct, numberofquestion]
  );

  // Animate progress bar when score is available and animation is finished
  useEffect(() => {
    if (
      score !== undefined &&
      numberofquestion > 0 &&
      lottieAnimationFinished
    ) {
      const correctPercentage = Math.round((correct / numberofquestion) * 100);

      Animated.timing(progressAnim, {
        toValue: correctPercentage,
        duration: 1000,
        useNativeDriver: false,
        easing: Easing.out(Easing.ease),
      }).start();
    }
  }, [score, correct, numberofquestion, lottieAnimationFinished]);

  // Lắng nghe status của người chơi thắng thua
  useEffect(() => {
    if (animationStatus.shouldShow && !animationStatus.isWinner) {
      // Animation cho người thua cuộc
      Animated.sequence([
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        // Scale up
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.elastic(1),
          useNativeDriver: true,
        }),
        // Gentle wobble
        Animated.timing(rotateAnim, {
          toValue: 0.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: -0.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animationStatus.shouldShow, animationStatus.isWinner]);

  // Fetch tên người chơi từ Firebase
  useEffect(() => {
    if (user?.uid) {
      const userRef = ref(realtimeDb, `users/${user.uid}/name`);
      get(userRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setName(userData.playerName);
          }
        })
        .catch((error) => console.error("Error getting name:", error));
    }
  }, [user]);

  useEffect(() => {
    if (animationCompleted) {
      setRanking((prevRanking) =>
        prevRanking.map((player) =>
          player.uid === user?.uid
            ? { ...player, animationCompleted: true }
            : player
        )
      );
    }
  }, [animationCompleted, user]);

  // Lắng nghe xếp hạng và cho biết người thắng thua
  // useEffect(() => {
  //   if (!roomid) return;

  //   const playersRef = ref(realtimeDb, `rooms/${roomid}/players`);

  //   const handlePlayersSnapshot = (snapshot) => {
  //     if (snapshot.exists()) {
  //       const playersData = snapshot.val();

  //       // Process player data
  //       const activePlayersArray = Object.keys(playersData)
  //         .map((key) => ({ uid: key, ...playersData[key] }))
  //         .filter((player) => !player.left);

  //       setTotalPlayers(activePlayersArray.length);

  //       const playersWithScoresCount = activePlayersArray.filter(
  //         (player) => player.diem != null
  //       ).length;
  //       setPlayersWithScores(playersWithScoresCount);

  //       // Check if all players have scores
  //       const allHaveScores = activePlayersArray.every(
  //         (player) => player.diem != null
  //       );
  //       setAllPlayersHaveScores(allHaveScores);

  //       // Sort players by score and time
  //       const sortedPlayers = [...activePlayersArray].sort((a, b) => {
  //         if (a.diem == null) return 1;
  //         if (b.diem == null) return -1;
  //         if (a.diem !== b.diem) return b.diem - a.diem;
  //         if (a.totalTime == null) return 1;
  //         if (b.totalTime == null) return -1;
  //         return a.totalTime - b.totalTime;
  //       });

  //       setRanking(sortedPlayers);

  //       // Determine winner and show animation
  //       if (allHaveScores && sortedPlayers.length >= 2) {
  //         const highestScorePlayer = sortedPlayers[0];
  //         const isCurrentUserWinner = highestScorePlayer.uid === user?.uid;

  //         if (!animationStatus.finished) {
  //           setAnimationStatus({
  //             isWinner: isCurrentUserWinner,
  //             shouldShow: true,
  //             finished: false,
  //           });
  //         }
  //       }
  //     } else {
  //       setRanking([]);
  //       setAllPlayersHaveScores(false);
  //     }
  //   };

  //   const unsubscribe = onValue(playersRef, handlePlayersSnapshot);

  //   return () => off(playersRef, "value", unsubscribe);
  // }, [roomid, user, animationStatus.finished]);

  useEffect(() => {
    if (!roomid) return;

    const playersRef = ref(realtimeDb, `rooms/${roomid}/players`);

    const handlePlayersDoneSnapshot = (snapshot) => {
      if (scoresProcessedRef.current) return; // Kiểm tra biến tham chiếu

      if (snapshot.exists()) {
        const playersData = snapshot.val();

        const activePlayers = Object.values(playersData).filter(
          (player) => !player.left
        );

        const allPlayersDone = activePlayers.every(
          (player) => player.isDone && player.diem != null
        );

        if (allPlayersDone) {
          scoresProcessedRef.current = true; // Cập nhật biến tham chiếu
          setScoresProcessed(true); // Cập nhật trạng thái React
          processRankingsAndScores(playersData);

          off(playersRef, "value", handlePlayersDoneSnapshot);
        }
      }
    };

    const unsubscribe = onValue(playersRef, handlePlayersDoneSnapshot);

    return () => off(playersRef, "value", unsubscribe);
  }, [roomid, scoresProcessed]);

  const saveScoresCalledRef = useRef(false);

  useEffect(() => {
    if (allAnimationsCompleted && !saveScoresCalledRef.current) {
      saveScoresCalledRef.current = true; // Đánh dấu đã gọi hàm
      const saveScoresAndAchievements = async () => {
        try {
          for (let i = 0; i < ranking.length; i++) {
            const player = ranking[i];
            console.log("achievement of player:", player.username, "index:", i);
            await savePlayerAchievements(player, i === 0);

            const rank = i + 1;
            const rankText =
              rank === 1
                ? "Nhất"
                : rank === 2
                ? "Nhì"
                : rank === 3
                ? "Ba"
                : `Hạng ${rank}`;

            //Lưu lịch sử chơi
            await savePlayerGameHistory(player, rankText);
          }

          if (ranking.length > 0) {
            await updateHighestScore(ranking);
          }

          setIsLoading(false);
        } catch (error) {
          console.error("Error saving scores and achievements:", error);
        }
      };

      saveScoresAndAchievements();
    }
  }, [allAnimationsCompleted, ranking]);

  // New function to process rankings and save scores
  const processRankingsAndScores = useCallback(async (playersData) => {
    try {
      // Filter out left players and those without scores
      const activePlayers = Object.values(playersData).filter(
        (player) => !player.left && player.diem != null
      );

      // Sort players by score and time
      const sortedPlayers = activePlayers.sort((a, b) => {
        if (a.diem !== b.diem) return b.diem - a.diem;
        if (a.totalTime == null) return 1;
        if (b.totalTime == null) return -1;
        return a.totalTime - b.totalTime;
      });

      // Update rankings in state
      setRanking(sortedPlayers);

      if (sortedPlayers.length >= 2) {
        const highestScorePlayer = sortedPlayers[0];
        const isCurrentUserWinner = highestScorePlayer.uid === user?.uid;

        setAnimationStatus({
          isWinner: isCurrentUserWinner,
          shouldShow: true,
          finished: false,
        });
      }
    } catch (error) {
      console.error("Error processing rankings and scores:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Hàm lưu thành tích
  const savePlayerAchievements = async (player, isFirstPlace) => {
    try {
      const playerRef = ref(realtimeDb, `users/${player.uid}/achievements`);
      const achievementSnapshot = await get(playerRef);

      const currentAchievement = achievementSnapshot.exists()
        ? achievementSnapshot.val()
        : {
            gamesPlayed: 0,
            bestScore: 0,
            totalCorrectAnswers: 0,
            fastestTime: Number.MAX_VALUE,
            totalFirstPlaces: 0,
            totalWins: 0,
            winStreak: 0,
            maxWinStreak: 0,
            isSaved: false,
          };

      if (currentAchievement.isSaved) {
        console.log(`Achievements for ${player.uid} already saved.`);
        return;
      }

      const updatedAchievement = {
        ...currentAchievement,
        gamesPlayed: currentAchievement.gamesPlayed + 1,
        bestScore: Math.max(currentAchievement.bestScore, player.diem),
        totalCorrectAnswers: currentAchievement.totalCorrectAnswers + correct,
        fastestTime: Math.min(
          currentAchievement.fastestTime,
          player.totalTime || Number.MAX_VALUE
        ),
        totalFirstPlaces: isFirstPlace
          ? currentAchievement.totalFirstPlaces + 1
          : currentAchievement.totalFirstPlaces,
        totalWins: isFirstPlace
          ? currentAchievement.totalWins + 1
          : currentAchievement.totalWins,
        winStreak: isFirstPlace ? currentAchievement.winStreak + 1 : 0,
        maxWinStreak: isFirstPlace
          ? Math.max(
              currentAchievement.maxWinStreak,
              currentAchievement.winStreak + 1
            )
          : currentAchievement.maxWinStreak,
        isSaved: true,
      };

      await update(playerRef, updatedAchievement);
      console.log(
        `Updated achievements for ${player.uid}:`,
        updatedAchievement
      );
    } catch (error) {
      console.error(`Error saving achievements for ${player.uid}:`, error);
    }
  };

  //Hàm lưu lịch sử chơi
  const savePlayerGameHistory = async (player, rankText) => {
    try {
      const playerRef = ref(realtimeDb, `users/${player.uid}/gameHistory`);
      const gameHistoryEntry = {
        timestamp: Date.now(),
        correct: correct,
        wrong: wrong,
        totalTime: totalTime,
        rank: rankText,
        roomId: roomid,
        score: player.diem,
      };
  
      // Lấy lịch sử hiện tại
      const historySnapshot = await get(playerRef);
      const currentHistory = historySnapshot.exists()
        ? historySnapshot.val()
        : [];
  
      // Đảm bảo currentHistory luôn là một mảng
      const historyArray = Array.isArray(currentHistory) ? currentHistory : [];
  
      // Thêm mục mới vào đầu danh sách và giới hạn tối đa 10 mục
      const updatedHistory = [gameHistoryEntry, ...historyArray].slice(0, 9);
  
      // Sử dụng set để ghi đè toàn bộ lịch sử
      await set(playerRef, updatedHistory);
      console.log(`Updated game history for ${player.uid}:`, updatedHistory);
    } catch (error) {
      console.error(`Error saving game history for ${player.uid}:`, error);
    }
  };

  // Hàm để cập nhật điểm cho người chơi có điểm cao nhất
  const updateHighestScore = useCallback(
    async (players) => {
      if (
        !players ||
        players.length === 0 ||
        !roomid ||
        highScoreUpdated ||
        !user?.uid
      ) {
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
              const currentPoints = userData.point;
              const bonusPoints = roomData.point * 2;

              // Cộng thêm điểm cho người chơi chiến thắng
              await update(userRef, {
                point: currentPoints + bonusPoints,
              });
            }
          }
        }
      } catch (error) {
        console.error("Error updating highest score:", error);
      }
    },
    [roomid, highScoreUpdated, user]
  );

  // Xử lý khi người dùng trở về trang chủ
  const handleGoHome = useCallback(async () => {
    try {
      if (user?.uid) {
        const roomId = await AsyncStorage.getItem("currentRoomId");

        if (roomId) {
          // Đánh dấu trạng thái "đã thoát" cho người chơi
          const playerRef = ref(
            realtimeDb,
            `rooms/${roomId}/players/${user.uid}`
          );
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

  const handleAnimationFinish = useCallback(() => {
    setAnimationStatus((prev) => ({
      ...prev,
      finished: true,
      shouldShow: false,
    }));

    // Cho biết animation result đã hoàn thành
    setLottieAnimationFinished(true);
    setAnimationCompleted(true);

    // Kiểm tra nếu tất cả người chơi đã hoàn thành animation
    if (ranking.every((player) => player.animationCompleted)) {
      setAllAnimationsCompleted(true);
    }
  }, []);

  // Hiển thị thông tin xếp hạng người chơi
  const renderRankingItem = useCallback(
    (player, index) => {
      // Check current user
      const isCurrentUser = player.uid === user?.uid;

      return (
        <View
          style={[
            styles.rankingItem,
            isCurrentUser && styles.currentUserRankingItem,
          ]}
          key={player.uid}
        >
          <View style={styles.playerInfoContainer}>
            <View style={styles.avatarContainer}>
              <Image
                source={
                  player.avatar
                    ? { uri: player.avatar }
                    : require("../Images/character2.png")
                }
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
                  isCurrentUser && styles.currentUserName,
                ]}
                numberOfLines={1}
              >
                {player.username || "Chưa có tên"}
                {player.left ? " (Đã thoát)" : ""}
              </Text>
              <Text style={styles.playerScore}>
                {player.diem != null
                  ? `${player.diem} điểm ${
                      player.totalTime ? `• ${player.totalTime}s` : ""
                    }`
                  : "Chưa có điểm"}
              </Text>
            </View>

            {/* Badges for top 2 players */}
            {!player.left && index === 0 && (
              <Image
                source={require("../Images/first.png")}
                style={styles.rankBadge}
              />
            )}
            {!player.left && index === 1 && (
              <Image
                source={require("../Images/second.png")}
                style={styles.rankBadge}
              />
            )}
          </View>
        </View>
      );
    },
    [user]
  );

  // Hiển thị thông tin thống kê
  const renderStatItem = useCallback(
    (value, label, color, icon) => (
      <View style={styles.statContainer}>
        <View style={[styles.statHeader, { backgroundColor: color }]}>
          {icon && <Image source={icon} style={styles.statIcon} />}
        </View>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    ),
    []
  );

  // Hiển thị điểm số dạng biểu đồ
  const ScoreDisplay = useMemo(() => {
    const correctPercentage = Math.round((correct / numberofquestion) * 100);

    // Determine user's rank for display
    const userRank =
      ranking.findIndex((player) => player.uid === user?.uid) + 1;
    const rankText =
      userRank > 0 ? `Hạng ${userRank}/${ranking.length}` : "Chưa xếp hạng";

    return (
      <View style={styles.scoreDisplayContainer}>
        <Text style={styles.scoreTitle}>Kết quả của bạn</Text>
        <View style={styles.scoreValue}>
          <Text style={styles.scoreNumber}>{score}</Text>
          <Text style={styles.scoreUnit}>điểm</Text>
        </View>

        <Text style={styles.rankText}>{rankText}</Text>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0%", "100%"],
                  }),
                },
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
  }, [score, correct, wrong, numberofquestion, ranking, user, progressAnim]);

  const renderResultAnimation = () => {
    if (!animationStatus.shouldShow) return null;

    return (
      <View style={styles.animationContainer}>
        {animationStatus.isWinner ? (
          <LottieView
            ref={animationRef}
            source={require("../Images/Animation - 1741871809409.json")}
            autoPlay
            loop={false}
            style={styles.winnerAnimation}
            onAnimationFinish={handleAnimationFinish}
            speed={1.0}
            resizeMode="cover"
          />
        ) : (
          <Animated.View
            style={[
              styles.loserContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }, { rotate: spin }],
              },
            ]}
          >
            <Text style={styles.loserEmoji}>😔</Text>
            <Text style={styles.loserTitle}>Tiếc quá!</Text>
            <Text style={styles.loserDescription}>
              Chúc bạn may mắn ở lần chơi tiếp theo!
            </Text>
          </Animated.View>
        )}
        <Text
          style={[
            styles.animationText,
            animationStatus.isWinner ? styles.winnerText : styles.loserText,
          ]}
        >
          {animationStatus.isWinner
            ? "Chúc mừng bạn đã chiến thắng!"
            : "Chúc may mắn lần sau!"}
        </Text>
        {/* Add dismiss button */}
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleAnimationFinish}
        >
          <Text style={styles.dismissButtonText}>OK</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {renderResultAnimation()}
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
              <Text style={styles.sectionTitle}>Bảng xếp hạng</Text>

              {isLoading ? (
                <ActivityIndicator
                  size="large"
                  color="#fff"
                  style={styles.loader}
                />
              ) : ranking.length > 0 ? (
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
  rankText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
    marginBottom: 10,
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
    paddingBottom: 110,
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
    alignSelf: "center",
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
  dismissButton: {
    backgroundColor: "#A42FC1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  dismissButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  animationContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    zIndex: 1000,
  },
  winnerAnimation: {
    width: 300,
    height: 300,
  },
  animationText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    padding: 10,
  },
  winnerText: {
    color: "#FFD700",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  loserContainer: {
    backgroundColor: "#F44336",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    width: 220,
    height: 220,
  },
  loserEmoji: {
    fontSize: 70,
    marginBottom: 15,
  },
  loserTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  loserDescription: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
  },
  loserText: {
    color: "#ff6b6b",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
