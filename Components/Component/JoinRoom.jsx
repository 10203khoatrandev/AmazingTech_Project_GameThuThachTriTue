import { StyleSheet, Text, View, Button } from 'react-native';
import React, { useContext, useCallback } from 'react';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { RoomsContext } from './RoomsContext';

const JoinRoom = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { room } = route.params;
  const { setRooms } = useContext(RoomsContext);

  const handleLeaveRoom = () => {
    setRooms(prevRooms => prevRooms.filter(r => r.id !== room.id));
    navigation.goBack();
  };

  useFocusEffect(
    useCallback(() => {
      return () => {
        setRooms(prevRooms => prevRooms.filter(r => r.id !== room.id));
      };
    }, [room.id, setRooms])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Room: {room.name}</Text>
      <Text style={styles.description}>Description: {room.des}</Text>
      <Text style={styles.players}>Players: {room.players} /2</Text>
      <Button title="Leave Room" onPress={handleLeaveRoom} />
    </View>
  );
};

export default JoinRoom;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    fontSize: 18,
    marginBottom: 16,
  },
  players: {
    fontSize: 18,
    marginBottom: 16,
  },
});