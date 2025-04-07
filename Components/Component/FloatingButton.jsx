import React, { useContext, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ref, get } from "firebase/database";
import { realtimeDb } from "../config";

const FloatingButton = () => {
  const navigation = useNavigation();
  const [roomId, setRoomId] = useState(null);

  useEffect(() => {
    const fetchRoomId = async () => {
      const storedRoomId = await AsyncStorage.getItem("currentRoomId");
      setRoomId(storedRoomId);
    };

    fetchRoomId();
  }, []);

  const handleRejoin = async () => {
    if (!roomId) {
      Alert.alert("Error", "No room to rejoin.");
      return;
    }

    const roomRef = ref(realtimeDb, `rooms/${roomId}`);
    const snapshot = await get(roomRef);

    if (snapshot.exists()) {
      const roomData = snapshot.val();
      navigation.navigate("JoinRoom", { room: { ...roomData, id: roomId } });
    } else {
      Alert.alert("Error", "The room no longer exists.");
      await AsyncStorage.removeItem("currentRoomId");
      setRoomId(null);
    }
  };

  if (!roomId) return null;

  return (
    <TouchableOpacity style={styles.floatingButton} onPress={handleRejoin}>
      <Text style={styles.floatingButtonText}>Rejoin</Text>
    </TouchableOpacity>
  );
};

export default FloatingButton;

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    top: 100,
    right: 20,
    backgroundColor: "#6A5AE0",
    padding: 15,
    borderRadius: 30,
    elevation: 5,
  },
  floatingButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});