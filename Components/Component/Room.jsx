import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import React, {
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { useNavigation } from "@react-navigation/native";
import { RoomsContext } from "../Component/RoomsContext";
import { FloatingButtonContext } from "../Component/FloatingButtonContext";
import { realtimeDb, auth } from "../config";
import {
  ref,
  onValue,
  push,
  set,
  update,
  off,
  get,
  remove,
  onChildRemoved,
} from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CryptoJS from "crypto-js";

const Room = () => {
  const { rooms, setRooms } = useContext(RoomsContext);
  const { setCreatedRoom } = useContext(FloatingButtonContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState("");
  const [point, setPoint] = useState(100);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchId, setSearchId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const navigation = useNavigation();
  const user = auth.currentUser;

  useEffect(() => {
    const roomsRef = ref(realtimeDb, "rooms");

    const unsubscribe = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      const roomsData = data ? Object.values(data) : [];
      setRooms(roomsData);
      setIsLoading(false);
    });

    const onRoomRemoved = onChildRemoved(roomsRef, (snapshot) => {
      const removedRoomId = snapshot.key;
      setRooms((prevRooms) =>
        prevRooms.filter((room) => room.id !== removedRoomId)
      );
    });

    return () => {
      off(roomsRef, "value", unsubscribe);
      off(roomsRef, "child_removed", onRoomRemoved);
    };
  }, [setRooms]);

  // Check and rejoin room if needed
  useEffect(() => {
    const checkAndRejoinRoom = async () => {
      try {
        const roomId = await AsyncStorage.getItem("currentRoomId");
        if (!roomId || !user) {
          await AsyncStorage.removeItem("currentRoomId");
          return;
        }

        const roomRef = ref(realtimeDb, `rooms/${roomId}`);
        const roomSnapshot = await get(roomRef);

        if (!roomSnapshot.exists()) {
          await AsyncStorage.removeItem("currentRoomId");
          return;
        }

        const roomData = roomSnapshot.val();
        const players = roomData.players || {};
        const playerExists = players[user.uid];

        if (!playerExists) {
          await AsyncStorage.removeItem("currentRoomId");
          return;
        }

        if (roomData.status !== "waiting") {
          Alert.alert("Thông báo", "Phòng đã bắt đầu trò chơi.");
          await AsyncStorage.removeItem("currentRoomId");
          return;
        }

        if (Object.keys(players).length > 2) {
          Alert.alert("Thông báo", "Phòng đã đủ 2 người chơi.");
          await AsyncStorage.removeItem("currentRoomId");
          return;
        }

        navigation.navigate("JoinRoom", {
          room: { ...roomData, id: roomId },
        });
      } catch (error) {
        console.error("Error checking room:", error);
        await AsyncStorage.removeItem("currentRoomId");
      }
    };

    if (user) {
      checkAndRejoinRoom();
    }
  }, [user, navigation]);

  //hàm tìm phòng bằng ID
  const handleSearchRoomById = useCallback(async () => {
    if (!searchId.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập ID phòng để tìm kiếm.");
      return;
    }

    try {
      // Đầu tiên tìm mapping để lấy roomId thật
      const mappingRef = ref(realtimeDb, `roomMappings/${searchId}`);
      const mappingSnapshot = await get(mappingRef);

      if (mappingSnapshot.exists()) {
        const { realRoomId } = mappingSnapshot.val();

        // Sử dụng roomId thật để lấy thông tin phòng
        const roomRef = ref(realtimeDb, `rooms/${realRoomId}`);
        const roomSnapshot = await get(roomRef);

        if (roomSnapshot.exists()) {
          const roomData = roomSnapshot.val();
          navigation.navigate("JoinRoom", {
            room: { ...roomData, id: realRoomId, hashedId: searchId },
          });
        } else {
          Alert.alert("Lỗi", "Không tìm thấy phòng với ID này.");
        }
      } else {
        Alert.alert("Lỗi", "Không tìm thấy phòng với mã này.");
      }
    } catch (error) {
      console.error("Lỗi khi tìm kiếm phòng:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi tìm kiếm phòng.");
    }
  }, [searchId, navigation]);

  const saveRoomInfo = useCallback(async (roomId) => {
    try {
      await AsyncStorage.setItem("currentRoomId", roomId);
    } catch (error) {
      console.error("Lỗi khi lưu thông tin phòng:", error);
    }
  }, []);

  //hàm cập nhật điểm khi cược điểm vào phòng chơi
  const updateUserPoints = async (userId, newPoints) => {
    try {
      const userRef = ref(realtimeDb, `users/${userId}`);
      await update(userRef, { point: newPoints });
    } catch (error) {
      console.error("Lỗi khi cập nhật điểm:", error);
    }
  };

  // hàm tạo phòng
const handleCreateRoom = useCallback(async () => {
  if (!user) {
    Alert.alert("Lỗi", "Vui lòng đăng nhập để tạo phòng.");
    return;
  }

  try {
    const userRef = ref(realtimeDb, `users/${user.uid}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng.");
      return;
    }

    const userData = userSnapshot.val();

    if (userData.point < point) {
      Alert.alert(
        "Lỗi",
        `Bạn không đủ điểm để tạo phòng với mức cược ${point} điểm. Bạn chỉ có ${userData.point} điểm.`
      );
      return;
    }

    // Cập nhật điểm người dùng trước
    const newPoints = userData.point - point;
    
    // Cập nhật điểm trong Firebase
    await updateUserPoints(user.uid, newPoints);
    
    //Cập nhật điểm trong AsyncStorage
    try {
      // Lấy thông tin user hiện tại từ AsyncStorage
      const userLoginString = await AsyncStorage.getItem("userLogin");
      if (userLoginString) {
        const userLogin = JSON.parse(userLoginString);
        const updatedUserLogged = {
          ...userLogin,
          point: newPoints
        };
        // Lưu thông tin đã cập nhật vào AsyncStorage
        await AsyncStorage.setItem("userLogin", JSON.stringify(updatedUserLogged));
      }
    } catch (error) {
      console.error("Lỗi khi lưu dữ liệu AsyncStorage:", error);
    }

    // Sau khi cập nhật điểm xong, tạo phòng mới
    const newRoomRef = push(ref(realtimeDb, "rooms"));
    const newRoom = {
      id: newRoomRef.key,
      name: roomName || `${Math.floor(Math.random() * 10000) + 1000}`,
      players: {
        [user.uid]: {
          username: userData.name,
          isHost: true,
          uid: user.uid,
          userPoint: newPoints, // Sử dụng điểm đã cập nhật
          isReady: false,
        },
      },
      des: "",
      point: point,
      hostId: user.uid,
      status: "waiting",
      password: password || null,
    };

    await set(newRoomRef, newRoom);

    // 4. Reset state và chuyển hướng
    setModalVisible(false);
    setRoomName("");
    setPoint(100);
    setPassword("");
    setCreatedRoom(newRoom);

    await saveRoomInfo(newRoomRef.key);
    navigation.navigate("JoinRoom", { room: newRoom });
  } catch (error) {
    console.error("Lỗi khi tạo phòng:", error);
    Alert.alert("Lỗi", "Đã xảy ra lỗi khi tạo phòng.");
  }
}, [
  user,
  roomName,
  point,
  password,
  navigation,
  saveRoomInfo,
  setCreatedRoom,
]);

  //handle join room
  const handleJoinRoom = useCallback(
    async (room) => {
      if (!user) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập để tham gia phòng.");
        return;
      }

      try {
        const currentRoomId = await AsyncStorage.getItem("currentRoomId");

        if (currentRoomId) {
          if (currentRoomId === room.id) {
            navigation.navigate("JoinRoom", { room });
            return;
          } else {
            Alert.alert(
              "Lỗi",
              "Vui lòng rời phòng hiện tại trước khi tham gia phòng mới."
            );
            return;
          }
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

        if (room.password) {
          setSelectedRoom(room);
          setPasswordModalVisible(true);
          return;
        }

        await joinRoom(userData, room);
      } catch (error) {
        console.error("Lỗi khi tham gia phòng:", error);
        Alert.alert("Lỗi", "Đã xảy ra lỗi khi tham gia phòng.");
      }
    },
    [user, navigation, joinRoom]
  );

  //logic join room
const joinRoom = useCallback(
  async (userData, room) => {
    try {
      // Cập nhật điểm của người tham gia phòng
      const newPoints = userData.point - room.point;
      
      // Cập nhật điểm trong Firebase
      await updateUserPoints(user.uid, newPoints);
      
      // Cập nhật điểm trong AsyncStorage
      try {
        const userLoginString = await AsyncStorage.getItem("userLogin");
        if (userLoginString) {
          const userLogin = JSON.parse(userLoginString);
          const updatedUserLogged = {
            ...userLogin,
            point: newPoints
          };
          await AsyncStorage.setItem("userLogin", JSON.stringify(updatedUserLogged));
        }
      } catch (error) {
        console.error("Lỗi khi lưu dữ liệu AsyncStorage:", error);
      }

      // Sau khi cập nhật điểm xong, thêm người chơi vào phòng
      const updatedPlayers = room.players ? { ...room.players } : {};

      updatedPlayers[user.uid] = {
        username: userData.name,
        isHost: false,
        uid: user.uid,
        userPoint: newPoints, // Sử dụng điểm đã cập nhật
        isReady: false,
      };

      await update(ref(realtimeDb, `rooms/${room.id}`), {
        players: updatedPlayers,
      });

      await saveRoomInfo(room.id);

      navigation.navigate("JoinRoom", {
        room: { ...room, players: updatedPlayers },
      });
    } catch (error) {
      console.error("Lỗi khi tham gia phòng:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi tham gia phòng.");
    }
  },
  [user, navigation, saveRoomInfo]
);

  // Handle password submission
const handlePasswordSubmit = useCallback(async () => {
  try {
    if (enteredPassword === selectedRoom.password) {
      const userRef = ref(realtimeDb, `users/${user.uid}`);
      const userSnapshot = await get(userRef);
      const userData = userSnapshot.val();
      
      // Kiểm tra lại điểm một lần nữa trước khi vào phòng
      if (userData.point < selectedRoom.point) {
        Alert.alert(
          "Lỗi",
          `Bạn không đủ điểm để tham gia phòng này.\nCần ${selectedRoom.point} điểm, bạn chỉ có ${userData.point} điểm.`
        );
        setPasswordModalVisible(false);
        setEnteredPassword("");
        return;
      }

      await joinRoom(userData, selectedRoom);

      setPasswordModalVisible(false);
      setEnteredPassword("");
    } else {
      Alert.alert("Lỗi", "Mật khẩu không đúng.");
    }
  } catch (error) {
    console.error("Lỗi khi xác nhận mật khẩu:", error);
    Alert.alert("Lỗi", "Đã xảy ra lỗi khi xác nhận mật khẩu.");
  }
}, [enteredPassword, selectedRoom, user, joinRoom]);

  // Render a room
  const renderRoomItem = useCallback(
    ({ item }) => {
      if (!item) return null;

      return (
        <View style={styles.roomItem}>
          <View>
            <Text style={styles.roomName}>{item.name}</Text>
            <Text style={styles.roomDescription}>{item.des}</Text>
            <Text style={styles.roomPoint}>Mức cược: {item.point} điểm</Text>
            <Text style={styles.roomStatus}>
              Trạng thái: {item.status === "waiting" ? "Đang chờ" : "Đang chơi"}
            </Text>
          </View>
          <View style={styles.roomActions}>
            <Text style={styles.roomPlayers}>
              {item.players ? Object.keys(item.players).length : 0} / 2 người
              chơi
            </Text>
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => handleJoinRoom(item)}
            >
              <Text style={styles.joinButtonText}>Vào phòng</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [handleJoinRoom]
  );

  const EmptyComponent = useMemo(
    () => <Text style={styles.emptyText}>Không có phòng nào.</Text>,
    []
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm phòng..."
          placeholderTextColor="#888"
          value={searchId}
          onChangeText={setSearchId} // Hàm này sẽ lọc danh sách phòng
        />
        <TouchableOpacity onPress={handleSearchRoomById}>
          <FontAwesome
            name="search"
            size={20}
            color="#888"
            style={styles.searchIcon}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Danh sách phòng</Text>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item?.id || Math.random().toString()}
        renderItem={renderRoomItem}
        ListEmptyComponent={EmptyComponent}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
      />

      <TouchableOpacity
        style={styles.createRoomButton}
        onPress={() => setModalVisible(true)}
        // onPress={onpressConsole}
      >
        <FontAwesome name="plus" size={16} color="white" />
        <Text style={styles.createRoomText}>Tạo phòng</Text>
      </TouchableOpacity>

      {/* Modal Tạo Phòng */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo Phòng</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome name="times" size={24} color="#6A5AE0" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tên Phòng</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên phòng..."
                placeholderTextColor="#999"
                value={roomName}
                onChangeText={setRoomName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mức Cược</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập số điểm cược..."
                placeholderTextColor="#999"
                value={point.toString()}
                onChangeText={(text) => setPoint(parseInt(text) || 0)}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mật Khẩu (tuỳ chọn)</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu nếu cần..."
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateRoom}
              >
                <Text style={styles.buttonText}>Tạo Phòng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Nhập Mật Khẩu */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={passwordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nhập Mật Khẩu</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                <FontAwesome name="times" size={24} color="#6A5AE0" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mật Khẩu</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Nhập mật khẩu phòng..."
                  placeholderTextColor="#999"
                  value={enteredPassword}
                  onChangeText={setEnteredPassword}
                  secureTextEntry
                />
                <FontAwesome name="lock" size={20} color="#6A5AE0" />
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setPasswordModalVisible(false)}
              >
                <Text style={styles.buttonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handlePasswordSubmit}
              >
                <Text style={styles.buttonText}>Xác Nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Room;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  roomItem: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgb(146, 132, 255)",
  },
  roomName: { fontSize: 18, fontWeight: "bold", color: "white" },
  roomDescription: { fontSize: 14, color: "white" },
  roomPoint: { fontSize: 14, color: "white" },
  roomStatus: { fontSize: 14, color: "white" },
  roomActions: { alignItems: "center" },
  roomPlayers: { fontSize: 16, color: "white", marginBottom: 8 },
  joinButton: { backgroundColor: "#6A5AE0", padding: 8, borderRadius: 8 },
  joinButtonText: { color: "white", fontSize: 14 },
  createRoomButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#6A5AE0",
    borderRadius: 8,
    marginTop: 16,
  },
  createRoomText: { color: "white", fontSize: 16, marginLeft: 8 },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalView: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#6A5AE0",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    marginRight: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: "rgba(174, 1, 96, 0.9)",
    padding: 14,
    borderRadius: 12,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  createButton: {
    backgroundColor: "rgba(96, 75, 255, 0.9)",
    padding: 14,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  buttonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginTop: 30,
    marginBottom: 30,
    fontStyle: "italic",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    fontSize: 16,
    color: "#6A5AE0",
    marginTop: 10,
  },
});
