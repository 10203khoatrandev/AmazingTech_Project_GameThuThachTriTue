import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView, Alert } from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';
import { realtimeDb } from '../config';
import RoomID from './RoomID';
import QuestionSet from './RoomQuestionSet';
import { ref, onValue, push, get, remove, update, off } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const JoinRoom = ({ route, navigation }) => {
  const { room } = route.params;
  const [players, setPlayers] = useState([]);
  const [selectedQuestionSet, setSelectedQuestionSet] = useState(null);
  const [currentView, setCurrentView] = useState('room');
  const [questionSetVisible, setQuestionSetVisible] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;

  // Lắng nghe danh sách người chơi trong phòng
  useEffect(() => {
    const roomRef = ref(realtimeDb, `rooms/${room.id}/players`);

    const unsubscribe = onValue(roomRef, (snapshot) => {
      const playersData = snapshot.val()
        ? Object.entries(snapshot.val()).map(([key, value]) => ({ id: key, ...value }))
        : [];
      setPlayers(playersData);
    });

    return () => off(roomRef);
  }, [room.id]);

  // Thêm người chơi vào phòng
  const handleAddPlayer = async () => {
    if (!user) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để tham gia phòng.');
      return;
    }

    if (players.length >= 2) {
      Alert.alert('Lỗi', 'Phòng đã đầy.');
      return;
    }

    const isAlreadyInRoom = players.some(player => player.uid === user.uid);
    if (isAlreadyInRoom) {
      Alert.alert('Thông báo', 'Bạn đã tham gia phòng.');
      return;
    }

    const userRef = ref(realtimeDb, `users/${user.uid}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng.');
      return;
    }

    const userData = userSnapshot.val();
    const newPlayer = {
      username: userData.username || `Player ${players.length + 1}`,
      isHost: players.length === 0,
      uid: user.uid,
      point: 100,
      isReady: false, // Mặc định chưa sẵn sàng
    };

    const roomRef = ref(realtimeDb, `rooms/${room.id}/players`);
    await push(roomRef, newPlayer);
  };

  // Đổi trạng thái sẵn sàng
  const handleToggleReady = (playerId, isReady) => {
    const playerRef = ref(realtimeDb, `rooms/${room.id}/players/${playerId}`);
    update(playerRef, { isReady: !isReady });
  };

  // Bắt đầu trò chơi
  const handleStartGame = () => {
    const allReady = players.every(player => player.isReady);
    if (players.length < 2) {
      Alert.alert('Lỗi', 'Cần ít nhất 2 người chơi để bắt đầu.');
      return;
    }
    if (!allReady) {
      Alert.alert('Lỗi', 'Tất cả người chơi phải sẵn sàng để bắt đầu.');
      return;
    }
    console.log('Bắt đầu trò chơi với bộ câu hỏi:', selectedQuestionSet);
  };

  // Rời phòng
  const handleLeaveRoom = async () => {
    const player = players.find(p => p.uid === user.uid);
    if (!player) {
      Alert.alert('Lỗi', 'Bạn không có trong phòng.');
      return;
    }

    const playerRef = ref(realtimeDb, `rooms/${room.id}/players/${player.id}`);
    await remove(playerRef);

    // Nếu host rời phòng, chuyển quyền host cho người khác
    if (player.isHost && players.length > 1) {
      const remainingPlayers = players.filter(p => p.id !== player.id);
      const newHostRef = ref(realtimeDb, `rooms/${room.id}/players/${remainingPlayers[0].id}`);
      await update(newHostRef, { isHost: true });
    }

    // Nếu không còn ai trong phòng, xoá phòng
    if (players.length === 1) {
      await remove(ref(realtimeDb, `rooms/${room.id}`));
    }

    navigation.goBack();
  };

  // Chọn bộ câu hỏi
  const handleSelectQuestionSet = (id) => {
    setSelectedQuestionSet(id);
    setQuestionSetVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton} onPress={handleLeaveRoom}>
            <Icon name="close" size={20} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="cog" size={20} color="black" />
          </TouchableOpacity>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {currentView === 'room' ? (
            <>
              <TouchableOpacity onPress={() => setCurrentView('id')}>
                <Text style={styles.title}>Mã Phòng</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setQuestionSetVisible(true)}>
                <Text style={styles.title}>Chọn Bộ Câu Hỏi</Text>
              </TouchableOpacity>
            </>
          ) : currentView === 'id' ? (
            <RoomID roomId={room.id} onBack={() => setCurrentView('room')} />
          ) : null}
        </View>

        {/* Thông tin người chơi */}
        <View style={styles.playerInfo}>
          <View style={styles.playerIconContainer}>
            <Icon name="users" size={20} color="white" />
            <Text style={styles.playerCount}> {players.length} / 2</Text>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
            <Text style={styles.startButtonText}>BẮT ĐẦU</Text>
          </TouchableOpacity>
        </View>

        {/* Danh sách người chơi */}
        <FlatList
          data={players}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.playerItem}>
              <Text style={styles.playerName}>{item.username || 'Người chơi'}</Text>
              <Text style={styles.playerTag}>{item.isHost ? 'Host' : 'Player'}</Text>
              <TouchableOpacity
                style={[styles.readyButton, { backgroundColor: item.isReady ? 'green' : 'gray' }]}
                onPress={() => handleToggleReady(item.id, item.isReady)}
              >
                <Text style={styles.readyButtonText}>{item.isReady ? 'Sẵn sàng' : 'Chưa sẵn sàng'}</Text>
              </TouchableOpacity>
            </View>
          )}
          style={styles.playerList}
        />

        {/* Thêm người chơi */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddPlayer}>
          <Text style={styles.addButtonText}>Thêm Người Chơi</Text>
        </TouchableOpacity>
      </View>

      {/* Chọn bộ câu hỏi */}
      {questionSetVisible && (
        <QuestionSet
          questionSets={[{ id: '1', name: 'Bộ câu hỏi 1' }, { id: '2', name: 'Bộ câu hỏi 2' }]}
          onSelect={handleSelectQuestionSet}
          onBack={() => setQuestionSetVisible(false)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#6A5AE0" },
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16, marginTop: 20 },
  headerIcons: { top: 20, width: "100%", flexDirection: "row", justifyContent: "space-between" },
  iconButton: { borderRadius: 10, width: 40, height: 40, justifyContent: "center", alignItems: "center", backgroundColor: 'white' },
  card: { justifyContent: 'center', backgroundColor: "white", padding: 24, width: "100%", borderRadius: 16, alignItems: "center", marginTop: 40, elevation: 4 },
  title: { fontSize: 20, color: "black", marginBottom: 12, fontWeight: "bold" },
  playerInfo: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginTop: 24, paddingHorizontal: 16 },
  playerIconContainer: { flexDirection: "row", alignItems: "center" },
  playerCount: { color: "white", fontSize: 16, marginLeft: 8 },
  startButton: { backgroundColor: "rgb(9, 170, 244)", paddingVertical: 15, paddingHorizontal: 20, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  startButtonText: { color: "white", textAlign: "center" },
  playerList: { marginTop: 16, width: "100%" },
  playerItem: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "green", padding: 15, borderRadius: 10, marginBottom: 8, alignItems: 'center' },
  playerName: { color: "white" },
  playerTag: { backgroundColor: "#D1D5DB", color: "black", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, fontSize: 12 },
  readyButton: { padding: 8, borderRadius: 8 },
  readyButtonText: { color: 'white' },
  addButton: { backgroundColor: "#6A5AE0", padding: 10, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  addButtonText: { color: 'white', fontSize: 16 },
});

export default JoinRoom;
