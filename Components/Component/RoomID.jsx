import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const RoomID = ({ roomId, onBack }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ID Phòng: {roomId}</Text>
      <QRCode value={roomId} size={150} />
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>Quay lại</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    color: "black",
    marginBottom: 12,
    fontWeight: "bold",
  },
  backButton: {
    backgroundColor: "#6A5AE0",
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default RoomID;

