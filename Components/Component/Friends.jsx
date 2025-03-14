import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ref,
  onDisconnect,
  serverTimestamp,
  update,
  onValue,
  get,
  remove,
} from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { auth, realtimeDb } from "../config";
import Ionicons from "@expo/vector-icons/Ionicons";
import Icon from "react-native-vector-icons/FontAwesome";

const Friends = () => {
  const [user, setUser] = useState({});
  const [userId, setUserId] = useState(null);
  const [status, setStatus] = useState("offline");
  const [friendEmail, setFriendEmail] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingFriend, setAddingFriend] = useState(false);

  // Memoized values for better performance
  const friendRequestsCount = useMemo(
    () => friendRequests.length,
    [friendRequests]
  );

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserLogged();
  }, []);

  // Setup online/offline status
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userStatusRef = ref(realtimeDb, `users/${user.uid}`);
        update(userStatusRef, {
          status: "online",
          lastSeen: serverTimestamp(),
        });

        onDisconnect(userStatusRef).update({
          status: "offline",
          lastSeen: serverTimestamp(),
        });
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Track current user status
  useEffect(() => {
    if (!userId) return;

    const userStatusRef = ref(realtimeDb, `users/${userId}/status`);
    const unsubscribeStatus = onValue(userStatusRef, (snapshot) => {
      const statusData = snapshot.val();
      if (statusData) {
        setStatus(statusData);
      }
    });

    return () => unsubscribeStatus();
  }, [userId]);

  // Track friend requests
  useEffect(() => {
    if (!userId) return;

    const friendRequestsRef = ref(realtimeDb, `users/${userId}/friendRequests`);
    const unsubscribe = onValue(friendRequestsRef, (snapshot) => {
      const friendRequestsData = snapshot.val();
      if (friendRequestsData) {
        const friendIds = Object.keys(friendRequestsData);
        fetchFriendRequestsDetails(friendIds);
      } else {
        setFriendRequests([]);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  // Track friends list
  useEffect(() => {
    if (!userId) return;

    const friendsRef = ref(realtimeDb, `users/${userId}/friends`);
    const unsubscribe = onValue(friendsRef, (snapshot) => {
      const friendsData = snapshot.val();
      if (friendsData) {
        const friendIds = Object.keys(friendsData);
        fetchFriendDetails(friendIds);
      } else {
        setFriends([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  // Lấy thông tin bạn bè
  const fetchFriendDetails = async (friendIds) => {
    try {
      const promises = friendIds.map(async (friendId) => {
        const friendRef = ref(realtimeDb, `users/${friendId}`);
        const snapshot = await get(friendRef);
        const friendData = snapshot.val();
        if (friendData) {
          return {
            id: friendId,
            name: friendData.name,
            point: friendData.point || 0,
            status: "offline",
            avatar: friendData.avatar,
          };
        }
        return null;
      });

      const results = await Promise.all(promises);
      const validFriends = results.filter((friend) => friend !== null);
      setFriends(validFriends);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching friend details:", error);
      setLoading(false);
    }
  };

  //Cập nhật trạng thái online/offline của bạn bè
  useEffect(() => {
    if (!userId || friends.length === 0) return;
    
    const statusListeners = friends.map(friend => {
      const friendStatusRef = ref(realtimeDb, `users/${friend.id}/status`);
      
      return onValue(friendStatusRef, (snapshot) => {
        const status = snapshot.val() || "offline";
        
        setFriends(currentFriends => 
          currentFriends.map(f => 
            f.id === friend.id ? {...f, status} : f
          )
        );
      });
    });
    
    return () => {
      statusListeners.forEach(unsubscribe => unsubscribe());
    };
  }, [userId, friends.length]);

  
  const fetchFriendRequestsDetails = async (friendIds) => {
    try {
      const promises = friendIds.map(async (friendId) => {
        const friendRef = ref(realtimeDb, `users/${friendId}`);
        const snapshot = await get(friendRef);
        const friendData = snapshot.val();
        if (friendData) {
          return { id: friendId, name: friendData.name };
        }
        return null;
      });

      const results = await Promise.all(promises);
      const validRequests = results.filter((request) => request !== null);
      setFriendRequests(validRequests);
    } catch (error) {
      console.error("Error fetching friend request details:", error);
    }
  };

  // Fetch logged in user data
  const fetchUserLogged = async () => {
    try {
      const userData = await AsyncStorage.getItem("userLogin");
      const userID = await AsyncStorage.getItem("userId");

      if (userData) {
        setUser(JSON.parse(userData));
      }

      if (userID) {
        setUserId(JSON.parse(userID));
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setLoading(false);
    }
  };

  // Accept friend request
  const handleAcceptFriendRequest = useCallback(
    async (friendId) => {
      try {
        // Add friendId to userId's friends list
        await update(ref(realtimeDb, `users/${userId}/friends`), {
          [friendId]: true,
        });

        // Add userId to friendId's friends list
        await update(ref(realtimeDb, `users/${friendId}/friends`), {
          [userId]: true,
        });

        // Remove friend request
        await remove(
          ref(realtimeDb, `users/${userId}/friendRequests/${friendId}`)
        );

        // Remove sent friend request if exists
        await remove(
          ref(realtimeDb, `users/${friendId}/sentFriendRequests/${userId}`)
        );

        // Close modal and show success message
        setModalVisible(false);
        Alert.alert("Thành công", "Đã chấp nhận lời mời kết bạn!");

        // Update UI immediately
        setFriendRequests((prev) =>
          prev.filter((request) => request.id !== friendId)
        );
      } catch (error) {
        console.error("Error accepting friend request:", error);
        Alert.alert("Lỗi", "Đã xảy ra lỗi khi chấp nhận lời mời kết bạn.");
      }
    },
    [userId]
  );

  // Reject friend request
  const handleRejectFriendRequest = useCallback(
    async (friendId) => {
      try {
        await remove(
          ref(realtimeDb, `users/${userId}/friendRequests/${friendId}`)
        );
        setFriendRequests((prev) =>
          prev.filter((request) => request.id !== friendId)
        );
        Alert.alert("Thông báo", "Đã từ chối lời mời kết bạn.");
      } catch (error) {
        console.error("Error rejecting friend request:", error);
        Alert.alert("Lỗi", "Đã xảy ra lỗi khi từ chối lời mời kết bạn.");
      }
    },
    [userId]
  );

  // Add friend by email
  const handleAddFriendByEmail = useCallback(async () => {
    if (!friendEmail) {
      Alert.alert("Lỗi", "Vui lòng nhập email.");
      return;
    }

    if (friendEmail === user.email) {
      Alert.alert("Lỗi", "Bạn không thể tự kết bạn với chính mình.");
      return;
    }

    setAddingFriend(true);

    try {
      // Search for user by email
      const usersRef = ref(realtimeDb, "users");
      const snapshot = await get(usersRef);

      if (snapshot.exists()) {
        const users = snapshot.val();
        const friendId = Object.keys(users).find(
          (id) => users[id].email === friendEmail.trim().toLowerCase()
        );

        if (friendId) {
          // Check if already friends
          const userFriendsRef = ref(
            realtimeDb,
            `users/${userId}/friends/${friendId}`
          );
          const friendsSnapshot = await get(userFriendsRef);

          if (friendsSnapshot.exists()) {
            Alert.alert("Thông báo", "Người dùng này đã là bạn bè của bạn.");
            setAddingFriend(false);
            return;
          }

          // Check if request already sent
          const sentRequestRef = ref(
            realtimeDb,
            `users/${userId}/sentFriendRequests/${friendId}`
          );
          const sentRequestSnapshot = await get(sentRequestRef);

          if (sentRequestSnapshot.exists()) {
            Alert.alert(
              "Thông báo",
              "Bạn đã gửi lời mời kết bạn cho người dùng này rồi."
            );
            setAddingFriend(false);
            return;
          }

          // Check if request already received
          const receivedRequestRef = ref(
            realtimeDb,
            `users/${userId}/friendRequests/${friendId}`
          );
          const receivedRequestSnapshot = await get(receivedRequestRef);

          if (receivedRequestSnapshot.exists()) {
            Alert.alert(
              "Thông báo",
              "Người dùng này đã gửi lời mời kết bạn cho bạn. Hãy kiểm tra mục thông báo."
            );
            setAddingFriend(false);
            return;
          }

          // Send friend request
          await update(ref(realtimeDb, `users/${userId}/sentFriendRequests`), {
            [friendId]: true,
          });

          await update(ref(realtimeDb, `users/${friendId}/friendRequests`), {
            [userId]: true,
          });

          Alert.alert("Thành công", "Lời mời kết bạn đã được gửi!");
          setFriendEmail("");
        } else {
          Alert.alert("Thông báo", "Không tìm thấy người dùng với email này.");
        }
      }
    } catch (error) {
      console.error("Error adding friend by email:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi tìm kiếm người dùng.");
    } finally {
      setAddingFriend(false);
    }
  }, [friendEmail, user.email, userId]);

  // Render friend item
  const renderFriendItem = useCallback(
    ({ item }) => (
      <View style={styles.friendBox}>
        <View style={styles.friendAvatar}>
          <Image
            source={item.avatar 
              ? { uri: item.avatar }
              : require("../Images/character2.png")}
            style={styles.avatarImage}
          />
          <View
            style={[
              styles.statusIndicator,
              {
                backgroundColor:
                  item.status === "online" ? "#4CAF50" : "#bdbdbd",
              },
            ]}
          />
        </View>
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.name}</Text>
          <View style={styles.pointContainer}>
            <Icon name="diamond" size={16} color="#fff" />
            <Text style={styles.friendPoint}>{item.point}</Text>
          </View>
          <Text
            style={[
              styles.friendStatus,
              { color: item.status === "online" ? "#E0F7FA" : "#E0E0E0" },
            ]}
          >
            {item.status === "online" ? "Đang trực tuyến" : "Đang ngoại tuyến"}
          </Text>
        </View>
      </View>
    ),
    []
  );

  // Render friend request item
  const renderFriendRequestItem = useCallback(
    ({ item }) => (
      <View style={styles.friendRequestItem}>
        <View style={styles.requestAvatarContainer}>
          <View style={styles.requestAvatar}>
            <Image
              source={require("../Images/character1.png")}
              style={styles.requestAvatarImage}
            />
          </View>
          <Text style={styles.friendRequestName}>{item.name}</Text>
        </View>
        <View style={styles.friendRequestButtons}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptFriendRequest(item.id)}
          >
            <Text style={styles.acceptButtonText}>Chấp nhận</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleRejectFriendRequest(item.id)}
          >
            <Text style={styles.rejectButtonText}>Từ chối</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [handleAcceptFriendRequest, handleRejectFriendRequest]
  );

  // Empty friends list component
  const EmptyFriendsList = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Icon name="users" size={50} color="#e0e0e0" />
        <Text style={styles.emptyFriendsList}>Chưa có bạn bè nào</Text>
        <Text style={styles.emptyFriendsListSubtext}>
          Hãy gửi lời mời kết bạn để bắt đầu!
        </Text>
      </View>
    ),
    []
  );

  // Empty requests list component
  const EmptyRequestsList = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Icon name="bell-o" size={40} color="#e0e0e0" />
        <Text style={styles.emptyRequestsList}>
          Chưa có lời mời kết bạn nào
        </Text>
      </View>
    ),
    []
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Bạn bè</Text>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="notifications" size={24} color="#6A5AE0" />
          {friendRequestsCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {friendRequestsCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Add Friend Form */}
      <View style={styles.addFriendContainer}>
        <TextInput
          style={styles.emailInput}
          placeholder="Nhập email bạn bè"
          placeholderTextColor="#9e9e9e"
          value={friendEmail}
          onChangeText={setFriendEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!addingFriend}
        />
        <TouchableOpacity
          style={[
            styles.addFriendButton,
            addingFriend && styles.addingFriendButton,
          ]}
          onPress={handleAddFriendByEmail}
          disabled={addingFriend}
        >
          {addingFriend ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.addFriendButtonText}>Kết bạn</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Friends List */}
      <View style={styles.friendsListContainer}>
        <View style={styles.friendsListHeaderContainer}>
          <Text style={styles.friendsListTitle}>Danh sách bạn bè</Text>
          {friends.length > 0 && (
            <Text style={styles.friendCount}>{friends.length}</Text>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6A5AE0" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : (
          <FlatList
            data={friends}
            keyExtractor={(item) => item.id}
            renderItem={renderFriendItem}
            ListEmptyComponent={EmptyFriendsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              friends.length === 0
                ? { flex: 1, justifyContent: "center" }
                : null
            }
          />
        )}
      </View>

      {/* Friend Requests Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lời mời kết bạn</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6A5AE0" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={friendRequests}
              keyExtractor={(item) => item.id}
              renderItem={renderFriendRequestItem}
              ListEmptyComponent={EmptyRequestsList}
              contentContainerStyle={
                friendRequests.length === 0
                  ? { flex: 1, justifyContent: "center" }
                  : { paddingVertical: 10 }
              }
            />

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Friends;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#424242",
  },
  notificationButton: {
    position: "relative",
    padding: 8,
    backgroundColor: "#f0eeff",
    borderRadius: 12,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#ff5252",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#f5f5f5",
  },
  notificationBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },

  // Add Friend Form
  addFriendContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  emailInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: "#424242",
  },
  addFriendButton: {
    backgroundColor: "#6A5AE0",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  addingFriendButton: {
    backgroundColor: "#9586f0",
  },
  addFriendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Friends List
  friendsListContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  friendsListHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  friendsListTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#424242",
  },
  friendCount: {
    backgroundColor: "#f0eeff",
    color: "#6A5AE0",
    fontWeight: "bold",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  friendBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#7A67FF",
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  friendAvatar: {
    position: "relative",
    width: 60,
    height: 60,
    backgroundColor: "#9586f0",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 40,
  },
  statusIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#fff",
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  pointContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  friendPoint: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
  friendStatus: {
    fontSize: 14,
  },

  // Empty States
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyFriendsList: {
    fontSize: 18,
    fontWeight: "600",
    color: "#9e9e9e",
    marginTop: 12,
    textAlign: "center",
  },
  emptyFriendsListSubtext: {
    fontSize: 14,
    color: "#bdbdbd",
    marginTop: 6,
    textAlign: "center",
  },
  emptyRequestsList: {
    fontSize: 16,
    color: "#9e9e9e",
    marginTop: 12,
    textAlign: "center",
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#9e9e9e",
  },

  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "85%",
    height: "60%",
    backgroundColor: "white",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#424242",
  },
  friendRequestItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    flexDirection: "column", // Thay đổi từ "row" thành "column"
  },
  requestAvatarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12, // Thêm margin bottom để tạo khoảng cách với buttons
  },
  requestAvatar: {
    width: 40,
    height: 40,
    backgroundColor: "#f0eeff",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  requestAvatarImage: {
    width: 30,
    height: 30,
  },
  friendRequestName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#424242",
  },
  friendRequestButtons: {
    flexDirection: "row",
    justifyContent: "flex-end", // Căn phải các nút
  },
  acceptButton: {
    backgroundColor: "#6A5AE0",
    paddingVertical: 8,
    paddingHorizontal: 16, // Tăng padding để nút to hơn
    borderRadius: 8,
    marginRight: 8,
  },
  acceptButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  rejectButton: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 8,
    paddingHorizontal: 16, // Tăng padding để nút to hơn
    borderRadius: 8,
  },
  rejectButtonText: {
    color: "#757575",
    fontWeight: "600",
  },
  closeButton: {
    margin: 16,
    backgroundColor: "#6A5AE0",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
