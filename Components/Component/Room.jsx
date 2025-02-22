import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import React, { useState, useContext, useEffect } from 'react';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import { RoomsContext } from '../Component/RoomsContext';
import { FloatingButtonContext } from '../Component/FloatingButtonContext';
import { realtimeDb, auth } from '../config';
import { ref, onValue, push, set, update, off, get, remove } from 'firebase/database';

const Room = () => {
    const { rooms, setRooms } = useContext(RoomsContext);
    const { setCreatedRoom } = useContext(FloatingButtonContext);
    const [modalVisible, setModalVisible] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [questionSet, setQuestionSet] = useState('');
    const [password, setPassword] = useState('');
    const [point, setPoint] = useState(100);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [enteredPassword, setEnteredPassword] = useState('');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const navigation = useNavigation();
    const user = auth.currentUser;

    useEffect(() => {
        const roomsRef = ref(realtimeDb, 'rooms');
        const unsubscribe = onValue(roomsRef, (snapshot) => {
            const roomsData = snapshot.val() ? Object.values(snapshot.val()) : [];
            setRooms(roomsData);
        });

        return () => off(roomsRef, 'value', unsubscribe);
    }, []);

    const handleCreateRoom = async () => {
        if (!user) {
            Alert.alert('Lỗi', 'Vui lòng đăng nhập để tạo phòng.');
            return;
        }

        const userRef = ref(realtimeDb, `users/${user.uid}`);
        const userSnapshot = await get(userRef);
        if (!userSnapshot.exists()) {
            Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng.');
            return;
        }
        const userData = userSnapshot.val();

        // if (userData.point < point) {
        //     Alert.alert('Lỗi', 'Số dư không đủ để tạo phòng.');
        //     return;
        // }

        // Trừ tiền khi tạo phòng
        // await update(userRef, { point: userData.point - point });

        const newRoomRef = push(ref(realtimeDb, 'rooms'));
        const newRoom = {
            id: newRoomRef.key,
            name: roomName || 'Phòng không tên',
            players: [{ username: userData.username || 'Player 1', isHost: true, uid: user.uid }],
            des: questionSet,
            point: point,
            hostId: user.uid,
            status: 'waiting',
            password: password || null
        };
        await set(newRoomRef, newRoom);

        setModalVisible(false);
        setRoomName('');
        setQuestionSet('');
        setPassword('');
        setCreatedRoom(newRoom);
        navigation.navigate('JoinRoom', { room: newRoom });
    };

    const handleJoinRoom = async (room) => {
        if (!user) {
            Alert.alert('Lỗi', 'Vui lòng đăng nhập để tham gia phòng.');
            return;
        }

        const userRef = ref(realtimeDb, `users/${user.uid}`);
        const userSnapshot = await get(userRef);
        if (!userSnapshot.exists()) {
            Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng.');
            return;
        }
        const userData = userSnapshot.val();

        // if (userData.point < room.point) {
        //     Alert.alert('Lỗi', 'Số dư không đủ để tham gia phòng.');
        //     return;
        // }

        if (room.players.length >= 2) {
            Alert.alert('Lỗi', 'Phòng đã đầy, không thể tham gia.');
            return;
        }

        if (room.password) {
            setSelectedRoom(room);
            setPasswordModalVisible(true);
            return;
        }

        await joinRoom(userRef, userData, room);
    };

    const joinRoom = async (userRef, userData, room) => {
        await update(userRef, { point: userData.point - room.point });

        const updatedPlayers = [...room.players, { username: userData.username || 'Player', isHost: false, uid: user.uid }];
        await update(ref(realtimeDb, `rooms/${room.id}`), { players: updatedPlayers });

        navigation.navigate('JoinRoom', { room: { ...room, players: updatedPlayers } });
    };

    const handlePasswordSubmit = async () => {
        if (enteredPassword === selectedRoom.password) {
            const userRef = ref(realtimeDb, `users/${user.uid}`);
            const userSnapshot = await get(userRef);
            const userData = userSnapshot.val();
            await joinRoom(userRef, userData, selectedRoom);
            setPasswordModalVisible(false);
            setEnteredPassword('');
        } else {
            Alert.alert('Lỗi', 'Mật khẩu không đúng.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Danh sách phòng</Text>
            <FlatList
                data={rooms}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.roomItem}>
                        <View>
                            <Text style={styles.roomName}>{item.name}</Text>
                            <Text style={styles.roomDescription}>{item.des}</Text>
                            <Text style={styles.roomPoint}>Mức cược: {item.point}</Text>
                            <Text style={styles.roomStatus}>Trạng thái: {item.status === 'waiting' ? 'Đang chờ' : 'Đang chơi'}</Text>
                        </View>
                        <View style={styles.roomActions}>
                            <Text style={styles.roomPlayers}>{item.players.length} /2 người chơi</Text>
                            <TouchableOpacity style={styles.joinButton} onPress={() => handleJoinRoom(item)}>
                                <Text style={styles.joinButtonText}>Vào phòng</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>Không có phòng nào.</Text>}
            />

            <TouchableOpacity style={styles.createRoomButton} onPress={() => setModalVisible(true)}>
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
                        <Text style={styles.modalTitle}>Tạo Phòng</Text>
                        <TextInput style={styles.input} placeholder="Tên Phòng" value={roomName} onChangeText={setRoomName} />
                        <TextInput style={styles.input} placeholder="Mức Cược" value={point.toString()} onChangeText={(text) => setPoint(parseInt(text) || 0)} keyboardType="numeric" />
                        <TextInput style={styles.input} placeholder="Bộ Câu Hỏi" value={questionSet} onChangeText={setQuestionSet} />
                        <TextInput style={styles.input} placeholder="Mật Khẩu (tuỳ chọn)" value={password} onChangeText={setPassword} secureTextEntry />
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                                <Text style={styles.buttonText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.createButton} onPress={handleCreateRoom}>
                                <Text style={styles.buttonText}>Tạo</Text>
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
                        <Text style={styles.modalTitle}>Nhập Mật Khẩu</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Mật khẩu"
                            value={enteredPassword}
                            onChangeText={setEnteredPassword}
                            secureTextEntry
                        />
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setPasswordModalVisible(false)}>
                                <Text style={styles.buttonText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.createButton} onPress={handlePasswordSubmit}>
                                <Text style={styles.buttonText}>Xác nhận</Text>
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
    container: { flex: 1, padding: 16, backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
    roomItem: { padding: 20, borderRadius: 15, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgb(146, 132, 255)' },
    roomName: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    roomDescription: { fontSize: 14, color: 'white' },
    roomPoint: { fontSize: 14, color: 'white' },
    roomStatus: { fontSize: 14, color: 'white' },
    roomActions: { alignItems: 'center' },
    roomPlayers: { fontSize: 16, color: 'white', marginBottom: 8 },
    joinButton: { backgroundColor: '#6A5AE0', padding: 8, borderRadius: 8 },
    joinButtonText: { color: 'white', fontSize: 14 },
    createRoomButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#6A5AE0', borderRadius: 8, marginTop: 16 },
    createRoomText: { color: 'white', fontSize: 16, marginLeft: 8 },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    modalView: { width: '80%', backgroundColor: 'white', borderRadius: 20, padding: 20, alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    input: { width: '100%', padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 10, marginBottom: 10 },
    buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
    cancelButton: { backgroundColor: 'rgb(174, 1, 96)', padding: 10, borderRadius: 10, flex: 1, marginRight: 10, alignItems: 'center' },
    createButton: { backgroundColor: 'rgb(96, 75, 255)', padding: 10, borderRadius: 10, flex: 1, alignItems: 'center' },
    buttonText: { color: 'white', fontSize: 16 },
    emptyText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: 'gray' },
  });
  