import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView, Image } from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';

const JoinRoom = () => {
  const [players, setPlayers] = useState([{ name: "Nguyen HCM", isHost: true }]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="close" size={20} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="cog" size={20} color="black" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Hỏi bạn bè của bạn</Text>
          <Text style={styles.subtitle}>1. Sử dụng bất kỳ thiết bị để mở</Text>
          <View style={styles.linkBox}>
            <Text style={styles.linkText}>join my quiz.com</Text>
          </View>
          <Text style={styles.subtitle}>2. Nhập mã trò chơi</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>051 4515</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.shareLink}>hoặc chia sẻ một liên kết trực tiếp</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.playerInfo}>
          <View style={styles.playerIconContainer}>
            <Icon name="users" size={20} color="white" />
            <Text style={styles.playerCount}> {players.length}</Text>
          </View>

          <TouchableOpacity style={styles.startButton} disabled>
            <Text style={styles.startButtonText}>BẮT ĐẦU</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={players}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.playerItem}>
              <Text style={styles.playerName}>{item.name}</Text>
              <Text style={styles.playerTag}>Bạn</Text>
            </View>
          )}
          style={styles.playerList}
        />
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
    justifyContent: "center",
    padding: 16,
    marginTop: 20,
  },
  headerIcons: {
    top: 20,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  iconButton: {
    borderRadius: 10,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'white'
  },
  card: {
    justifyContent: 'center',
    backgroundColor: "white",
    padding: 24,
    width: "100%",
    borderRadius: 16,
    alignItems: "center",
    marginTop: 40, // Add margin to avoid overlap with status bar
    elevation: 4,
  },
  title: {
    fontSize: 20,
    color: "black",
    marginBottom: 12,
    fontWeight: "bold",
  },
  subtitle: {
    color: "black",
    marginBottom: 8,
  },
  linkBox: {
    borderWidth: 2,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  linkText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 24,
  },
  codeBox: {
    borderWidth: 2,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  codeText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 24,
    letterSpacing: 4,
  },
  shareLink: {
    color: "white",
    textDecorationLine: "underline",
  },
  playerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 24,
    paddingHorizontal: 16,
  },
  playerIconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  playerCount: {
    color: "white",
    fontSize: 16,
    marginLeft: 8,
  },
  startButton: {
    backgroundColor: "rgb(9, 170, 244)",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  startButtonText: {
    color: "white",
    textAlign: "center",
  },
  playerList: {
    marginTop: 16,
    width: "100%",
  },
  playerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "green",
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
  },
  playerName: {
    color: "white",
  },
  playerTag: {
    backgroundColor: "#D1D5DB",
    color: "black",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 12,
  },
});

export default JoinRoom;
