import React, { useState, useEffect, useCallback } from "react";
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
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Progress from "react-native-progress";
import CryptoJS from "crypto-js";
import { Animated } from "react-native";
import LinearGradient from "react-native-linear-gradient";

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
      navigation.navigate("QAmonitor", { selectedQuestion, roomid });
      setStart(false);
    }

    // Clean up the timer on unmount
    return () => clearTimeout(timer);
  }, [timeLeft, roomid, navigation, selectedQuestion, setStart]);

  return (
    <View style={styles.countdownContainer}>
      <Text style={styles.countdownTitle}>Game Starting in</Text>
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
      <Text style={styles.countdownSubtitle}>Get ready to play!</Text>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => {
          setStart(false);
          update(romRef, { status: "waiting" });
        }}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
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
    const unsubscribe = onValue(roomStatusRef, (snapshot) => {
      if (snapshot.val() === "playing") {
        setIsGameStarting(true);
        loadOpponentQuestions();
      } else {
        setIsGameStarting(false);
      }
    });

    return () => off(roomStatusRef, unsubscribe);
  }, [room?.id]);

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

  // Render a player item
  const renderPlayerItem = ({ item }) => (
    <View style={styles.playerItem}>
      <View style={styles.playerInfoColumn}>
        <Text style={styles.playerName}>{item.username}</Text>
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
        {item.isHost ? "Host" : "Player"}
      </Text>
      <View
        style={[
          styles.readyStatus,
          { backgroundColor: item.isReady ? "green" : "gray" },
        ]}
      >
        <Text style={styles.readyButtonText}>
          {item.isReady ? "Đã sẵn sàng" : "Chưa sẵn sàng"}
        </Text>
      </View>
    </View>
  );

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
          <Text style={styles.headerTitle}>Game Room</Text>
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
              <Text style={styles.roomIdLabel}>Room Code:</Text>
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
              <Text style={styles.playerCount}> {players.length} / 2</Text>
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
                {hasPickedQuestions ? "Questions Selected" : "Select Questions"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Player List */}
        <Text style={styles.sectionTitle}>Players</Text>
        {players.length === 0 ? (
          <View style={styles.emptyPlayerList}>
            <Icon name="user-times" size={50} color="rgba(255,255,255,0.5)" />
            <Text style={styles.emptyPlayerText}>
              No players have joined yet
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
              <Text style={styles.joinButtonText}>Join Room</Text>
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
              <Text style={styles.startButtonText}>START GAME</Text>
            </TouchableOpacity>
          ) : allPlayersPickedQuestions ? (
            <View style={styles.waitingContainer}>
              <Text style={styles.waitingText}>
                Waiting for host to start the game...
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
                Please select your questions to continue
              </Text>
            </View>
          )}
        </View>
      </View>
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
    alignSelf: "flex-start",
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
});

export default JoinRoom;
