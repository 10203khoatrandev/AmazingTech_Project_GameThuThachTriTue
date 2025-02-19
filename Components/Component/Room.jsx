import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, TextInput, Button } from 'react-native';
import React, { useState, useContext } from 'react';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import { RoomsContext } from '../Component/RoomsContext';

const Room = () => {
    const { rooms, setRooms } = useContext(RoomsContext);
    const [modalVisible, setModalVisible] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [questionSet, setQuestionSet] = useState('');
    const [password, setPassword] = useState('');
    const navigation = useNavigation();

    const handleCreateRoom = () => {
        const newRoom = {
            id: (rooms.length + 1).toString(),
            name: roomName,
            players: 1, // Số lượng người chơi ban đầu là 1
            des: questionSet,
        };
        setRooms([...rooms, newRoom]);
        setModalVisible(false);
        setRoomName('');
        setQuestionSet('');
        setPassword('');
        navigation.navigate('JoinRoom', { room: newRoom });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Rooms</Text>
            <FlatList
                data={rooms}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.roomItem}>
                        <View>
                            <Text style={styles.roomName}>{item.name}</Text>
                            <Text style={styles.roomDescription}>{item.des}</Text>
                        </View>
                        <Text style={styles.roomPlayers}>{item.players} /2 players</Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No rooms available</Text>}
            />
            <TouchableOpacity style={styles.createRoomButton} onPress={() => setModalVisible(true)}>
                <FontAwesome name="plus" size={16} color="white" />
                <Text style={styles.createRoomText}>Create Room</Text>
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Create Room</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Room Name"
                            value={roomName}
                            onChangeText={setRoomName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Question Set"
                            value={questionSet}
                            onChangeText={setQuestionSet}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                        <View style={styles.buttonContainer}>
                            <Button title="Cancel" onPress={() => setModalVisible(false)} />
                            <Button title="Create" onPress={handleCreateRoom} />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default Room;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    roomItem: {
        padding: 20,
        borderRadius: 15,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgb(146, 132, 255)',
    },
    roomName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    roomDescription: {
        fontSize: 14,
        color: 'white',
    },
    roomPlayers: {
        fontSize: 16,
        color: 'white'
    },
    createRoomButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#6A5AE0',
        borderRadius: 8,
        marginTop: 16,
    },
    createRoomText: {
        color: 'white',
        fontSize: 16,
        marginLeft: 8,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        marginBottom: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: 'gray',
    },
});