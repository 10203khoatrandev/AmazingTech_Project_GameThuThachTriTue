import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Alert,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { realtimeDb } from "../config";
import {
  ref,
  onValue,
  get,
  remove,
  update,
  off,
  onDisconnect,
  onChildRemoved,
  set,
} from "firebase/database";
import { getAuth } from "firebase/auth";
import {
  useNavigation,
  useFocusEffect,
  CommonActions,
} from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Progress from "react-native-progress";
import CryptoJS from "crypto-js";
import { Animated } from "react-native";

const CircularCountdown = ({
  setStart,
  roomid,
  navigation,
  selectedQuestion,
}) => {
  const [timeLeft, setTimeLeft] = useState(5);
  const [animation] = useState(new Animated.Value(1));
  const romRef = ref(realtimeDb, `rooms/${roomid}/status`);

  useEffect(() => {
    // Animate the countdown timer
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 0.8,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Check if the room status is "waiting" when component mounts
    get(romRef).then((snapshot) => {
      if (snapshot.exists() && snapshot.val() === "waiting") {
        setStart(false);
      }
    });

    // Set up the countdown timer
    let timer;
    if (timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: "QAmonitor",
              params: { selectedQuestion, roomid },
            },
          ],
        })
      );
      setStart(false);
    }

    // Clean up the timer on unmount
    return () => clearTimeout(timer);
  }, [timeLeft, roomid, navigation, selectedQuestion, setStart]);

  return (
    <View style={styles.countdownContainer}>
      <Text style={styles.countdownTitle}>Màn chơi bắt đầu sau</Text>
      <Animated.View style={{ transform: [{ scale: animation }] }}>
        <Progress.Circle
          size={150}
          progress={timeLeft / 5}
          showsText
          formatText={() => `${timeLeft}s`}
          color="#FFFFFF"
          thickness={6}
          borderWidth={0}
          unfilledColor="rgba(255,255,255,0.3)"
          textStyle={{ fontSize: 40, fontWeight: "bold", color: "#FFFFFF" }}
        />
      </Animated.View>
      <Text style={styles.countdownSubtitle}>Hãy sẵn sàng!</Text>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => {
          setStart(false);
          update(romRef, { status: "waiting" });
        }}
      >
        <Text style={styles.cancelButtonText}>Huỷ</Text>
      </TouchableOpacity>
    </View>
  );
};

const JoinRoom = ({ route }) => {
  const { room } = route.params;
  const navigation = useNavigation();
  const [players, setPlayers] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState([]);
  const [hasPickedQuestions, setHasPickedQuestions] = useState(false);
  const [isGameStarting, setIsGameStarting] = useState(false);
  const [hashedRoomId, setHashedRoomId] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [allPlayersPickedQuestions, setAllPlayersPickedQuestions] =
    useState(false);
  const [playerAchievements, setPlayerAchievements] = useState({});
  const [selectedPlayerAchievements, setSelectedPlayerAchievements] =
    useState(null);
  const [isAchievementModalVisible, setIsAchievementModalVisible] =
    useState(false);

  const auth = getAuth();
  const user = auth.currentUser;

  // Mã hóa ID phòng ngay khi component được render
  useEffect(() => {
    if (room?.id) {
      const hash = CryptoJS.SHA256(room.id.toString()).toString(
        CryptoJS.enc.Hex
      );
      const numericHash = parseInt(hash.substring(0, 12), 16) % 1000000;
      const hashedRoomId = numericHash.toString().padStart(6, "0");
      setHashedRoomId(hashedRoomId);

      //Tạo mapping room
      const mappingRef = ref(realtimeDb, `roomMappings/${hashedRoomId}`);
      set(mappingRef, { realRoomId: room.id });
    }
  }, [room?.id]);

  //Kiểm tra bắt đầu game
  useEffect(() => {
    if (!room?.id) return;

    const roomStatusRef = ref(realtimeDb, `rooms/${room.id}/status`);

    const handleRoomStatusChange = async (snapshot) => {
      const status = snapshot.val();

      if (status === "playing") {
        setIsGameStarting(true);
        loadOpponentQuestions();

        // Reset `isSaved` cho tất cả người chơi trong phòng nếu họ có achievements
        const playersRef = ref(realtimeDb, `rooms/${room.id}/players`);
        const playersSnapshot = await get(playersRef);

        if (playersSnapshot.exists()) {
          const playersData = playersSnapshot.val();
          const updates = {};

          for (const playerUid of Object.keys(playersData)) {
            const achievementRef = ref(
              realtimeDb,
              `users/${playerUid}/achievements`
            );
            const achievementSnapshot = await get(achievementRef);

            if (achievementSnapshot.exists()) {
              // Nếu người chơi đã có achievements, đặt isSaved thành false
              updates[`users/${playerUid}/achievements/isSaved`] = false;
            }
          }

          if (Object.keys(updates).length > 0) {
            await update(ref(realtimeDb), updates);
            console.log("Reset isSaved for players with achievements.");
          }
        }
      } else {
        setIsGameStarting(false);
      }
    };

    const unsubscribe = onValue(roomStatusRef, handleRoomStatusChange);

    return () => off(roomStatusRef, unsubscribe);
  }, [room?.id, loadOpponentQuestions]);

  // Lắng nghe danh sách người chơi trong phòng
  useEffect(() => {
    if (!room?.id) {
      Alert.alert("Thông báo", "Phòng không tồn tại.");
      navigation.goBack();
      return;
    }

    const roomPlayersRef = ref(realtimeDb, `rooms/${room.id}/players`);

    const handlePlayersSnapshot = (snapshot) => {
      const playersData = snapshot.val()
        ? Object.entries(snapshot.val()).map(([key, value]) => ({
            id: key,
            ...value,
          }))
        : [];
      setPlayers(playersData);
    };

    const unsubscribe = onValue(roomPlayersRef, handlePlayersSnapshot);
    const onPlayerRemovedListener = onChildRemoved(
      roomPlayersRef,
      (snapshot) => {
        const removedPlayerId = snapshot.key;
        setPlayers((prevPlayers) =>
          prevPlayers.filter((player) => player.id !== removedPlayerId)
        );
      }
    );

    return () => {
      off(roomPlayersRef, "value", unsubscribe);
      off(roomPlayersRef, "child_removed", onPlayerRemovedListener);
    };
  }, [room?.id, navigation]);

  // Lắng nghe onDisconnect
  useEffect(() => {
    if (!user?.uid || !room?.id) return;

    const playerRef = ref(realtimeDb, `rooms/${room.id}/players/${user.uid}`);
    onDisconnect(playerRef).remove();

    return () => {
      onDisconnect(playerRef).cancel();
    };
  }, [user?.uid, room?.id]);

  // Kiểm tra xem người dùng dã chọn câu hỏi hay chưa
  useFocusEffect(
    useCallback(() => {
      if (!user?.uid || !room?.id) return;

      const checkQuestions = async () => {
        const playerRef = ref(
          realtimeDb,
          `rooms/${room.id}/players/${user.uid}`
        );
        const playerSnapshot = await get(playerRef);
        const playerData = playerSnapshot.val();

        if (
          playerData?.playerQuestions &&
          Object.keys(playerData.playerQuestions).length > 0
        ) {
          setHasPickedQuestions(true);
          // Automatically set ready status
          if (!playerData.isReady) {
            update(playerRef, { isReady: true });
          }
        } else {
          setHasPickedQuestions(false);
          // Cancel ready status if no questions are chosen
          if (playerData?.isReady) {
            update(playerRef, { isReady: false });
          }
        }
      };

      checkQuestions();
    }, [user?.uid, room?.id])
  );

  //Kiểm tra tất cả người dùng đều đã chọn câu hỏi chưa
  useEffect(() => {
    if (players.length > 0) {
      // Check if all players have picked questions
      const allPicked = players.every((player) => {
        // Check if player has questions property and it has content
        return (
          player.playerQuestions &&
          Object.keys(player.playerQuestions).length > 0
        );
      });

      setAllPlayersPickedQuestions(allPicked);
    }
  }, [players]);

  //Lấy thành tích của tất cả players
  useEffect(() => {
    const fetchPlayerAchievements = async () => {
      const achievements = {};

      for (const player of players) {
        const playerRef = ref(realtimeDb, `users/${player.uid}/achievements`);
        const snapshot = await get(playerRef);

        if (snapshot.exists()) {
          achievements[player.uid] = snapshot.val();
        } else {
          achievements[player.uid] = {
            gamesPlayed: 0,
            bestScore: 0,
            totalCorrectAnswers: 0,
            fastestTime: "N/A",
            totalFirstPlaces: 0,
            totalWins: 0,
            winStreak: 0,
            maxWinStreak: 0,
          };
        }
      }

      setPlayerAchievements(achievements);
    };

    if (players.length > 0) {
      fetchPlayerAchievements();
    }
  }, [players]);

  //Lấy bộ câu hỏi của đối phương
  const loadOpponentQuestions = useCallback(async () => {
    if (!room?.id || !user?.uid) return;

    const roomRef = ref(realtimeDb, `rooms/${room.id}`);
    const snapshot = await get(roomRef);
    const roomData = snapshot.val();

    if (!roomData?.players) return;

    const playerData = Object.values(roomData.players);
    const otherPlayersQuestions = playerData
      .filter((player) => player.uid !== user.uid)
      .flatMap((player) => player.playerQuestions || []);

    setSelectedQuestion(otherPlayersQuestions);
  }, [room?.id, user?.uid]);

  // Thêm người chơi vào phòng
  const handleAddPlayer = async () => {
    try {
      // Check if user is authenticated
      if (!user) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập để tham gia phòng.");
        return;
      }

      // Check if room exists
      if (!room || !room.id) {
        Alert.alert("Lỗi", "Phòng không tồn tại hoặc ID phòng không hợp lệ.");
        return;
      }

      // Check if player already in room
      if (players.some((p) => p.uid === user.uid)) {
        Alert.alert("Thông báo", "Bạn đã tham gia phòng này rồi.");
        return;
      }

      const userRef = ref(realtimeDb, `users/${user.uid}`);
      const userSnapshot = await get(userRef);

      if (!userSnapshot.exists()) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập để tham gia phòng.");
        return;
      }

      const userData = userSnapshot.val();

      if (userData.point < room.point) {
        Alert.alert(
          "Lỗi",
          `Bạn không đủ điểm để tham gia phòng này.\nCần ${room.point} điểm, bạn chỉ có ${userData.point} điểm.`
        );
        return;
      }

      const updatedPlayers = room.players ? { ...room.players } : {};

      updatedPlayers[user.uid] = {
        username: userData.name,
        isHost: false,
        uid: user.uid,
        userPoint: userData.point,
        isReady: false,
      };

      await update(ref(realtimeDb, `rooms/${room.id}`), {
        players: updatedPlayers,
      });

      // Store the room ID in AsyncStorage for persistence
      await AsyncStorage.setItem("currentRoomId", room.id);
    } catch (error) {
      console.error("Error adding player:", error);
      Alert.alert("Lỗi", `Không thể tham gia phòng: ${error.message}`);
    }
  };

  // Đổi trạng thái sẵn sàng
  const handleToggleReady = async (playerUid, isReady) => {
    if (playerUid !== user.uid) {
      Alert.alert(
        "Lỗi",
        "Bạn chỉ có thể thay đổi trạng thái sẵn sàng của chính mình."
      );
      return;
    }

    // Tìm playerId dựa trên playerUid
    const player = players.find((p) => p.uid === playerUid);
    if (!player) {
      Alert.alert("Lỗi", "Không tìm thấy người chơi.");
      return;
    }

    const playerRef = ref(realtimeDb, `rooms/${room.id}/players/${player.id}`);
    const playerSnapshot = (await get(playerRef)).val().playerQuestions;
    if (!playerSnapshot) {
      Alert.alert("Lỗi", "Vui lòng chọn bộ câu hỏi để sẵn sàng.");
      return;
    }

    update(playerRef, { isReady: !isReady });
  };

  //Reset trạng thái lưu của người dùng
  const resetPlayerAchievements = async (playerUid) => {
    try {
      const playerRef = ref(realtimeDb, `users/${playerUid}/achievements`);
      const achievementSnapshot = await get(playerRef);

      if (achievementSnapshot.exists()) {
        await update(playerRef, { isSaved: false });
        console.log(`Reset isSaved for ${playerUid}`);
      }
    } catch (error) {
      console.error(`Error resetting isSaved for ${playerUid}:`, error);
    }
  };

  // Bắt đầu trò chơi
  const handleStartGame = async () => {
    if (players.length < 2) {
      Alert.alert("Lỗi", "Cần ít nhất 2 người chơi để bắt đầu.");
      return;
    }

    const roomRef = ref(realtimeDb, `rooms/${room.id}`);
    const snapshot = await get(roomRef);
    const roomData = snapshot.val();

    if (!roomData?.players) return;

    const playerData = Object.values(roomData.players);
    const currentPlayer = playerData.find((p) => p.uid === user.uid);

    // Check if the current user is the host
    if (!currentPlayer?.isHost) {
      Alert.alert("Lỗi", "Bạn phải là host để bắt đầu trò chơi.");
      return;
    }

    // Check if all players are ready
    const allPlayersAreReady = playerData.every((player) => player.isReady);
    if (!allPlayersAreReady) {
      Alert.alert("Lỗi", "Cả 2 người chơi phải sẵn sàng trước khi bắt đầu.");
      return;
    }

    await update(roomRef, { status: "playing", gameStarted: true });
    setIsGameStarting(true);
    loadOpponentQuestions();
  };
  // const letgo = async () => {
  //   const Romref = ref(realtimeDb, `rooms/${room.id}`);
  //   const RomSnapshot = await get(Romref);
  //   const playerData = (await RomSnapshot.val().players)
  //     ? await Object.values(RomSnapshot.val().players)
  //     : [];
  //   const otherPlayersQuestions = await playerData
  //     .filter((player) => player.uid !== user.uid)
  //     .map((player) => player.playerQuestions);
  //   const cauhoi = otherPlayersQuestions.flat();

  //   setSelectedQuestion(cauhoi);
  // };

  // useEffect(() => {
  //   if (room && room.id) {
  //     const roomRef = ref(realtimeDb, `rooms/${room.id}`);
  //     const unsubscribe = onValue(roomRef, (snapshot) => {
  //       const roomData = snapshot.val();
  //       if (roomData) {
  //         if (roomData.status === "playing") {
  //           // Nếu trạng thái là "playing", điều hướng mọi người đến QAmonitor
  //           const playerRef = ref(realtimeDb, `rooms/${room.id}/players`);
  //           get(playerRef).then((playerSnapshot) => {
  //             const playerData = playerSnapshot.val();
  //             const otherPlayersQuestions = Object.values(playerData)
  //               .filter((player) => player.uid !== user.uid)
  //               .map((player) => player.playerQuestions);
  //             const selectedQuestions = otherPlayersQuestions.flat();
  //             navigation.navigate("QAmonitor", { selectedQuestions });
  //           });
  //         } else if (roomData.status === "waiting") {
  //         }
  //       }
  //     });
  //     return () => off(roomRef, "value", unsubscribe);
  //   }
  // }, [room, navigation, user]);

  // Rời phòng
  const handleLeaveRoom = async () => {
    if (!user?.uid || !room?.id) {
      navigation.goBack();
      return;
    }

    const player = players.find((p) => p.uid === user.uid);
    if (!player) {
      Alert.alert(
        "Lỗi",
        "Bạn không có trong phòng hoặc có lỗi đặc biệt xảy ra."
      );
      navigation.goBack();
      return;
    }

    const playerRef = ref(realtimeDb, `rooms/${room.id}/players/${player.id}`);
    await remove(playerRef);
    const userRef = ref(realtimeDb, `users/${player.id}`);
    const userSnapshot = await get(userRef);

    if (userSnapshot.exists()) {
      const userData = userSnapshot.val();
      const currentPoint = userData.point || 0;

      // Refund lại điểm cho người chơi
      await update(userRef, {
        point: currentPoint + room.point,
      });
    }

    await AsyncStorage.removeItem("currentRoomId");

    // If the host leaves, transfer host role to another player
    if (player.isHost && players.length > 1) {
      const remainingPlayers = players.filter((p) => p.id !== player.id);
      const newHostRef = ref(
        realtimeDb,
        `rooms/${room.id}/players/${remainingPlayers[0].id}`
      );
      await update(newHostRef, { isHost: true });
    }

    // If no players remain, close the room
    if (players.length <= 1) {
      await update(ref(realtimeDb, `rooms/${room.id}`), { status: "closed" });
      await remove(ref(realtimeDb, `rooms/${room.id}`));
    }

    navigation.goBack();
  };

  const handleCopyRoomId = () => {
    if (hashedRoomId) {
      // In a real app, you would use Clipboard API here
      // Clipboard.setString(hashedRoomId);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Chọn bộ câu hỏi
  const handleSelectQuestionSet = () => {
    navigation.navigate("QuestionPicker");
  };

  // Rời phòng tạm thời
  const handleTemporaryLeave = async () => {
    if (!user?.uid || !room?.id) return;

    const playerRef = ref(realtimeDb, `rooms/${room.id}/players/${user.uid}`);
    await update(playerRef, { isTemporarilyInactive: true });

    // Lưu roomId vào AsyncStorage để sử dụng sau
    await AsyncStorage.setItem("currentRoomId", room.id);

    Alert.alert(
      "Temporary Leave",
      "You have temporarily left the room. You will be notified when someone joins."
    );

    navigation.goBack();

    // Lắng nghe sự kiện khi có người chơi mới tham gia
    const roomPlayersRef = ref(realtimeDb, `rooms/${room.id}/players`);
    onChildAdded(roomPlayersRef, async (snapshot) => {
      const newPlayer = snapshot.val();
      if (newPlayer && newPlayer.uid !== user.uid) {
        Alert.alert(
          "New Player Joined",
          "A new player has joined your room. Rejoining now..."
        );

        // Điều hướng người dùng quay lại phòng
        navigation.navigate("JoinRoom", { room });
      }
    });
  };

  const PlayerAchievementsTooltip = ({ achievements }) => {
    if (!achievements) return null;

    return (
      <View style={styles.achievementsTooltip}>
        <View style={styles.achievementsTooltipContent}>
          <View style={styles.achievementsTooltipRow}>
            <Text style={styles.achievementsTooltipLabel}>Win Rate:</Text>
            <Text style={styles.achievementsTooltipValue}>
              {achievements.gamesPlayed > 0
                ? (
                    (achievements.totalWins / achievements.gamesPlayed) *
                    100
                  ).toFixed(2) + "%"
                : "0%"}
            </Text>
          </View>
          <View style={styles.achievementsTooltipRow}>
            <Text style={styles.achievementsTooltipLabel}>Games:</Text>
            <Text style={styles.achievementsTooltipValue}>
              {achievements.gamesPlayed || 0}
            </Text>
          </View>
          <View style={styles.achievementsTooltipRow}>
            <Text style={styles.achievementsTooltipLabel}>Wins:</Text>
            <Text style={styles.achievementsTooltipValue}>
              {achievements.totalWins || 0}
            </Text>
          </View>
          <View style={styles.achievementsTooltipRow}>
            <Text style={styles.achievementsTooltipLabel}>Best Score:</Text>
            <Text style={styles.achievementsTooltipValue}>
              {achievements.bestScore || 0}
            </Text>
          </View>
          <View style={styles.achievementsTooltipRow}>
            <Text style={styles.achievementsTooltipLabel}>
              Total First Place:
            </Text>
            <Text style={styles.achievementsTooltipValue}>
              {achievements.totalFirstPlaces || 0}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Render a player item
  const renderPlayerItem = ({ item }) => {
    const achievements = playerAchievements[item.uid];

    const handleShowAchievements = () => {
      setSelectedPlayerAchievements(
        selectedPlayerAchievements?.uid === item.uid
          ? null
          : { ...achievements, uid: item.uid }
      );
    };

    return (
      <View style={styles.playerItem}>
        <View style={styles.playerInfoColumn}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.playerName}>{item.username}</Text>
            <TouchableOpacity
              onPress={handleShowAchievements}
              style={styles.infoIcon}
            >
              <Icon name="info-circle" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            {selectedPlayerAchievements?.uid === item.uid && (
              <PlayerAchievementsTooltip achievements={achievements} />
            )}
          </View>
          <View style={styles.pointsContainer}>
            <Icon name="diamond" size={16} color="#ffffff" />
            <Text style={styles.playerPoint}> {item.userPoint}</Text>
          </View>
        </View>
        <Text
          style={[
            styles.playerTag,
            { backgroundColor: item.isHost ? "#FFBF00" : "#ccc" },
          ]}
        >
          {item.isHost ? "Host" : "Người chơi"}
        </Text>
        <View
          style={[
            styles.readyStatus,
            { backgroundColor: item.isReady ? "green" : "gray" },
          ]}
        >
          <Text style={styles.readyButtonText}>
            {item.isReady ? "Sẵn sàng" : "Chưa sẵn sàng"}
          </Text>
        </View>
      </View>
    );
  };

  const isCurrentPlayerHost = players.some(
    (p) => p.uid === user?.uid && p.isHost
  );
  const isUserInRoom = players.some((p) => p.uid === user?.uid);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton} onPress={handleLeaveRoom}>
            <Icon name="arrow-left" size={20} color="#6A5AE0" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Phòng Chơi</Text>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="cog" size={20} color="#6A5AE0" />
          </TouchableOpacity>
        </View>

        {/* Room Info Card */}
        <View style={styles.card}>
          <View style={styles.roomInfo}>
            <View style={styles.betInfo}>
              <Icon name="diamond" size={22} color="#6A5AE0" />
              <Text style={styles.betAmount}>{room?.point}</Text>
            </View>
            <TouchableOpacity
              style={styles.roomIdContainer}
              onPress={handleCopyRoomId}
              activeOpacity={0.7}
            >
              <Text style={styles.roomIdLabel}>Mã Phòng:</Text>
              <Text style={styles.roomIdText}>
                {hashedRoomId || "Creating..."}
              </Text>
              <Icon name="copy" size={16} color="#6A5AE0" />
              {copySuccess && (
                <View style={styles.copyTooltip}>
                  <Text style={styles.copyTooltipText}>Copied!</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Player Info */}
        <View style={styles.playerInfo}>
          <View style={styles.playerIconContainer}>
            <View style={styles.playerCountContainer}>
              <Icon name="users" size={20} color="white" />
              <Text style={styles.playerCount}>
                {" "}
                {players.length} / {room.maxPlayers}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.questionButton,
                hasPickedQuestions && styles.questionButtonSelected,
              ]}
              onPress={handleSelectQuestionSet}
            >
              <Icon
                name={hasPickedQuestions ? "check-circle" : "list"}
                size={18}
                color={hasPickedQuestions ? "#FFC300" : "#6A5AE0"}
                style={styles.questionButtonIcon}
              />
              <Text
                style={[
                  styles.questionButtonText,
                  hasPickedQuestions && styles.questionButtonTextSelected,
                ]}
              >
                {hasPickedQuestions ? "Đã Chọn Bộ Câu Hỏi" : "Chọn Bộ Câu Hỏi"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Player List */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Text style={styles.sectionTitle}>Người chơi</Text>
          <TouchableOpacity
            style={styles.tempLeaveButton}
            onPress={handleTemporaryLeave}
          >
            <Icon
              name="pause-circle"
              size={20}
              color="white"
              style={styles.buttonIcon}
            />
            <Text style={styles.tempLeaveButtonText}>Tạm Rời Phòng</Text>
          </TouchableOpacity>
        </View>
        {players.length === 0 ? (
          <View style={styles.emptyPlayerList}>
            <Icon name="user-times" size={50} color="rgba(255,255,255,0.5)" />
            <Text style={styles.emptyPlayerText}>
              Chưa có ai tham gia vào phòng
            </Text>
          </View>
        ) : (
          <FlatList
            data={players}
            keyExtractor={(item) => item.id}
            renderItem={renderPlayerItem}
            style={styles.playerList}
            contentContainerStyle={styles.playerListContent}
          />
        )}

        {/* Game Start Countdown Modal */}
        {isGameStarting && (
          <Modal
            animationType="fade"
            transparent={true}
            visible={isGameStarting}
            onRequestClose={() => setIsGameStarting(false)}
          >
            <View style={styles.modalContainer}>
              <CircularCountdown
                setStart={setIsGameStarting}
                roomid={room?.id}
                navigation={navigation}
                selectedQuestion={selectedQuestion}
              />
            </View>
          </Modal>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {!isUserInRoom ? (
            <TouchableOpacity
              style={styles.joinButton}
              onPress={handleAddPlayer}
            >
              <Icon
                name="sign-in"
                size={20}
                color="white"
                style={styles.buttonIcon}
              />
              <Text style={styles.joinButtonText}>Tham Gia Phòng</Text>
            </TouchableOpacity>
          ) : isCurrentPlayerHost ? (
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartGame}
              disabled={players.length < 2 || !players.every((p) => p.isReady)}
            >
              <Icon
                name="play-circle"
                size={20}
                color="white"
                style={styles.buttonIcon}
              />
              <Text style={styles.startButtonText}>BẮT ĐẦU</Text>
            </TouchableOpacity>
          ) : allPlayersPickedQuestions ? (
            <View style={styles.waitingContainer}>
              <Text style={styles.waitingText}>
                Đang đợi host bắt đầu trò chơi...
              </Text>
              <Progress.Bar
                indeterminate={true}
                width={200}
                color="white"
                unfilledColor="rgba(255,255,255,0.3)"
                borderWidth={0}
              />
            </View>
          ) : (
            <View style={styles.pickQuestionsPrompt}>
              <Text style={styles.pickQuestionsText}>
                Hãy chọn bộ câu hỏi trước khi tiếp tục
              </Text>
            </View>
          )}
        </View>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isAchievementModalVisible}
        onRequestClose={() => setIsAchievementModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Player Achievements</Text>
            {selectedPlayerAchievements ? (
              <View>
                <Text style={styles.modalText}>
                  <Text style={styles.modalLabel}>Games Played:</Text>{" "}
                  {selectedPlayerAchievements.gamesPlayed || 0}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={styles.modalLabel}>Total Wins:</Text>{" "}
                  {selectedPlayerAchievements.totalWins || 0}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={styles.modalLabel}>Best Score:</Text>{" "}
                  {selectedPlayerAchievements.bestScore || 0}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={styles.modalLabel}>Fastest Time:</Text>{" "}
                  {selectedPlayerAchievements.fastestTime !== Number.MAX_VALUE
                    ? `${selectedPlayerAchievements.fastestTime}s`
                    : "N/A"}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={styles.modalLabel}>Win Streak:</Text>{" "}
                  {selectedPlayerAchievements.winStreak || 0}
                </Text>
              </View>
            ) : (
              <Text style={styles.modalText}>No achievements available.</Text>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsAchievementModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#6A5AE0",
  },
  container: {
    flex: 1,
    alignItems: "center",
    padding: 16,
  },
  headerIcons: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  iconButton: {
    borderRadius: 15,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  card: {
    backgroundColor: "white",
    padding: 20,
    width: "100%",
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  roomInfo: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  roomIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  roomIdLabel: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  roomIdText: {
    fontSize: 20,
    color: "#6A5AE0",
    fontWeight: "bold",
    letterSpacing: 1,
  },
  copyTooltip: {
    position: "absolute",
    top: -30,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  copyTooltipText: {
    color: "white",
    fontSize: 12,
  },
  playerInfo: {
    width: "100%",
    marginBottom: 20,
  },
  playerIconContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 15,
    borderRadius: 16,
  },
  playerCountContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  playerCount: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  questionButton: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  questionButtonSelected: {
    backgroundColor: "rgba(76, 175, 80, 0.15)",
    borderWidth: 1,
    borderColor: "#FFC300",
  },
  questionButtonIcon: {
    marginRight: 8,
  },
  questionButtonText: {
    color: "#6A5AE0",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  questionButtonTextSelected: {
    color: "#FFC300",
  },
  sectionTitle: {
    alignSelf: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
    marginLeft: 5,
  },
  playerList: {
    width: "100%",
    marginBottom: 20,
  },
  playerListContent: {
    paddingBottom: 10,
  },
  emptyPlayerList: {
    width: "100%",
    height: 150,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyPlayerText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    marginTop: 12,
  },
  playerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    alignItems: "center",
    borderLeftWidth: 0,
  },
  currentPlayerItem: {
    borderLeftWidth: 5,
    borderLeftColor: "#4CAF50",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  playerInfoColumn: {
    flex: 1,
    gap: 5,
  },
  playerStatusContainer: {
    alignItems: "flex-end",
    gap: 8,
  },
  playerName: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  playerPoint: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  pickedQuestionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  pickedQuestionsText: {
    color: "#FFC300",
    fontSize: 13,
    fontWeight: "500",
  },
  playerTag: {
    backgroundColor: "#FFBF00",
    color: "#333",
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 12,
    overflow: "hidden",
    marginHorizontal: 10,
  },
  readyStatus: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 100,
    alignItems: "center",
  },
  readyButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 13,
  },
  actionButtonsContainer: {
    width: "100%",
    alignItems: "center",
    position: "absolute",
    bottom: 20,
    paddingHorizontal: 16,
  },
  joinButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 30,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  joinButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  startButton: {
    backgroundColor: "#FF5722",
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 30,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  startButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonIcon: {
    marginRight: 10,
  },
  waitingContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  waitingText: {
    color: "white",
    marginBottom: 10,
    fontSize: 16,
  },
  betInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  betAmount: {
    fontSize: 22,
    color: "#6A5AE0",
    fontWeight: "bold",
  },
  countdownContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  countdownTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 30,
  },
  countdownSubtitle: {
    fontSize: 18,
    color: "white",
    marginTop: 30,
    opacity: 0.8,
  },
  cancelButton: {
    marginTop: 40,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  cancelButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 20,
    alignItems: "center",
    elevation: 10,
  },
  pickQuestionsPrompt: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 16,
    borderRadius: 16,
    width: "100%",
  },
  pickQuestionsText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
  tempLeaveButton: {
    backgroundColor: "#FFA500",
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 30,
    width: "50%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    marginBottom: 10,
  },
  tempLeaveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  achievementIcons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  achievementIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  achievementText: {
    color: "white",
    fontSize: 12,
    marginLeft: 5,
  },
  infoIcon: {
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
    color: "#555",
  },
  modalLabel: {
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#6A5AE0",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  achievementsTooltip: {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 10,
    padding: 10,
    width: 200,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  achievementsTooltipContent: {
    flexDirection: "column",
  },
  achievementsTooltipRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  achievementsTooltipLabel: {
    fontWeight: "bold",
    color: "#6A5AE0",
    fontSize: 12,
  },
  achievementsTooltipValue: {
    color: "#333",
    fontSize: 12,
  },
});

export default JoinRoom;
