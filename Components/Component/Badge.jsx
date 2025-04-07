import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Image, Text, Modal, ScrollView, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";

const BadgeComponent = ({ achievements }) => {
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const badgeDefinitions = [
    {
      id: "games",
      name: "Người chơi chăm chỉ",
      color: "#8E44AD",
      levels: [
        { threshold: 5, title: "Người mới", description: "Hoàn thành 5 trò chơi" },
        { threshold: 25, title: "Người chơi đều đặn", description: "Hoàn thành 25 trò chơi" },
        { threshold: 100, title: "Người chơi chuyên nghiệp", description: "Hoàn thành 100 trò chơi" },
      ],
      getValue: (data) => data?.gamesPlayed || 0,
      imagePath: require("../Images/hardworkMedal.png"),
    },
    {
      id: "score",
      name: "Điểm số cao",
      color: "#3498DB",
      levels: [
        { threshold: 30, title: "Điểm tốt", description: "Đạt 30 điểm trong một ván chơi" },
        { threshold: 50, title: "Điểm xuất sắc", description: "Đạt 50 điểm trong một ván chơi" },
        { threshold: 100, title: "Điểm không tưởng", description: "Đạt 100 điểm trong một ván chơi" },
      ],
      getValue: (data) => data?.bestScore || 0,
      imagePath: require("../Images/highscoreMedal.png"),
    },
    {
      id: "correct",
      name: "Trả lời đúng",
      color: "#27AE60",
      levels: [
        { threshold: 50, title: "Trả lời chính xác", description: "Đạt 50 câu trả lời đúng" },
        { threshold: 200, title: "Trả lời thông minh", description: "Đạt 200 câu trả lời đúng" },
        { threshold: 500, title: "Trả lời xuất sắc", description: "Đạt 500 câu trả lời đúng" },
      ],
      getValue: (data) => data?.totalCorrectAnswers || 0,
      imagePath: require("../Images/correctMedal.png"),
    },
    {
      id: "streak",
      name: "Chuỗi thắng",
      color: "#FF9800",
      levels: [
        { threshold: 3, title: "Nhóm lửa hi vọng", description: "Đạt 3 trận thắng liên tiếp" },
        { threshold: 7, title: "Bất bại!", description: "Đạt 7 trận thắng liên tiếp" },
        { threshold: 10, title: "Không thể ngăn cản!", description: "Đạt 10 trận thắng liên tiếp" },
      ],
      getValue: (data) => data?.maxWinStreak || 0,
      imagePath: require("../Images/streakMedal.png"),
    },
    {
      id: "time",
      name: "Tốc độ",
      color: "#E74C3C",
      levels: [
        { threshold: 30, title: "Nhanh nhẹn", description: "Hoàn thành trò chơi trong 30 giây" },
        { threshold: 20, title: "Rất nhanh", description: "Hoàn thành trò chơi trong 20 giây" },
        { threshold: 10, title: "Siêu tốc", description: "Hoàn thành trò chơi trong 10 giây" },
      ],
      getValue: (data) => data?.fastestTime || 9999,
      reversed: true,
      imagePath: require("../Images/quickMedal.png"),
    },
    {
      id: "rank",
      name: "Hạng cao",
      color: "#FFC107",
      levels: [
        { threshold: 1, title: "Chiến thắng đầu tay", description: "Đạt hạng nhất 1 lần" },
        { threshold: 10, title: "Người chơi xuất sắc", description: "Đạt hạng nhất 10 lần" },
        { threshold: 30, title: "Bậc thầy siêu việt", description: "Đạt hạng nhất 30 lần" },
      ],
      getValue: (data) => data?.totalFirstPlaces || 0,
      imagePath: require("../Images/topRankMedal.png"),
    },
  ];

  const getBadgeLevel = (badge, value) => {
    if (badge.reversed) {
      for (let i = badge.levels.length - 1; i >= 0; i--) {
        if (value <= badge.levels[i].threshold) {
          return i + 1;
        }
      }
    } else {
      for (let i = badge.levels.length - 1; i >= 0; i--) {
        if (value >= badge.levels[i].threshold) {
          return i + 1;
        }
      }
    }
    return 0;
  };

  const getProgressToNextLevel = (badge, value) => {
    const currentLevel = getBadgeLevel(badge, value);
    
    if (currentLevel === 0) {
      
      const firstThreshold = badge.reversed ? badge.levels[0].threshold : badge.levels[0].threshold;
      return badge.reversed 
        ? Math.max(0, Math.min(1, (999 - value) / (999 - firstThreshold)))
        : Math.max(0, Math.min(1, value / firstThreshold));
    } 
    
    if (currentLevel === badge.levels.length) {
      return 1;
    }
    
    const currentThreshold = badge.levels[currentLevel - 1].threshold;
    const nextThreshold = badge.levels[currentLevel].threshold;
    
    return badge.reversed
      ? Math.max(0, Math.min(1, (currentThreshold - value) / (currentThreshold - nextThreshold)))
      : Math.max(0, Math.min(1, (value - currentThreshold) / (nextThreshold - currentThreshold)));
  };

  const BadgeItem = ({ badge }) => {
    const value = badge.getValue(achievements);
    const level = getBadgeLevel(badge, value);
    const progress = getProgressToNextLevel(badge, value);
  
    const showBadgeDetails = () => {
      setSelectedBadge(badge);
      setModalVisible(true);
    };
  
    return (
      <TouchableOpacity
        style={styles.badge}
        onPress={showBadgeDetails}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={level > 0 ? [badge.color, "#FFFFFF"] : ["#CCCCCC", "#EEEEEE"]}
          style={styles.badgeGradient}
        >
          <View style={styles.badgeContent}>
            <Image source={badge.imagePath} style={styles.badgeImage} />
            <View style={styles.levelIndicator}>
              {Array.from({ length: 3 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.levelDot,
                    { backgroundColor: i < level ? badge.color : "#D0D0D0" },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.badgeName}>{badge.name}</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress * 100}%`, backgroundColor: badge.color },
                ]}
              />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const BadgeModal = ({ badge, visible, onClose }) => {
    if (!badge) return null;
  
    const value = badge.getValue(achievements);
    const level = getBadgeLevel(badge, value);
    const progress = getProgressToNextLevel(badge, value);
  
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <FontAwesome5 name="times" size={24} color="#333" />
            </TouchableOpacity>
  
            <LinearGradient
              colors={level > 0 ? [badge.color, "#FFFFFF"] : ["#CCCCCC", "#EEEEEE"]}
              style={styles.modalBadgeContainer}
            >
              <Image source={badge.imagePath} style={styles.modalBadgeImage} />
            </LinearGradient>
  
            <Text style={styles.modalBadgeTitle}>{badge.name}</Text>
  
            <View style={styles.modalLevelIndicator}>
              {Array.from({ length: 3 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.modalLevelDot,
                    { backgroundColor: i < level ? badge.color : "#D0D0D0" },
                  ]}
                />
              ))}
            </View>
  
            <Text style={styles.modalCurrentValue}>
              {badge.reversed ? "Giá trị hiện tại: " : "Đã đạt được: "}
              <Text style={{ fontWeight: "bold", color: badge.color }}>
                {value}
                {badge.id === "time" ? " giây" : ""}
              </Text>
            </Text>
  
            <View style={styles.modalProgressBar}>
              <View
                style={[
                  styles.modalProgressFill,
                  { width: `${progress * 100}%`, backgroundColor: badge.color },
                ]}
              />
            </View>
  
            <ScrollView style={styles.levelsContainer}>
              {badge.levels.map((levelData, i) => (
                <View
                  key={i}
                  style={[
                    styles.levelItem,
                    {
                      backgroundColor: i < level ? `${badge.color}20` : "#F0F0F0",
                      borderColor: i < level ? badge.color : "#D0D0D0",
                    },
                  ]}
                >
                  <View style={styles.levelHeader}>
                    <Text style={styles.levelTitle}>{levelData.title}</Text>
                    {i < level && (
                      <FontAwesome5 name="check-circle" size={18} color={badge.color} />
                    )}
                  </View>
                  <Text style={styles.levelDescription}>{levelData.description}</Text>
                  <Text style={styles.levelThreshold}>
                    {badge.reversed ? "Dưới " : "Đạt "}
                    <Text style={{ fontWeight: "bold" }}>
                      {levelData.threshold}
                      {badge.id === "time" ? " giây" : ""}
                    </Text>
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Huân Chương</Text>
      <Text style={styles.pageSubtitle}>Thu thập huân chương qua các thành tích</Text>

      <View style={styles.badgeGrid}>
        {badgeDefinitions.map((badge) => (
          <BadgeItem key={badge.id} badge={badge} />
        ))}
      </View>

      <BadgeModal
      badge={selectedBadge}
      visible={modalVisible}
      onClose={() => setModalVisible(false)}
    />
    </View>
  );
};

export default BadgeComponent;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F8FF",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#0000ff",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F8FF",
    padding: 15,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginTop: 10,
  },
  pageSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  badge: {
    width: "48%",
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  badgeGradient: {
    borderRadius: 12,
    padding: 2,
  },
  badgeContent: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  badgeImage: {
    width: 70,
    height: 70,
    resizeMode: "contain",
    marginBottom: 8,
  },
  levelIndicator: {
    flexDirection: "row",
    marginTop: 5,
    marginBottom: 5,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  progressBar: {
    width: "100%",
    height: 5,
    backgroundColor: "#EEEEEE",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 20,
    width: "85%",
    maxHeight: "80%",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
  modalBadgeContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 15,
  },
  modalBadgeImage: {
    width: 80,
    height: 80,
    resizeMode: "contain",
  },
  badgeIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    width: 40,
    height: 40,
    borderRadius: 20,
    textAlign: "center",
    textAlignVertical: "center",
    overflow: "hidden",
  },
  modalBadgeTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  modalLevelIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
  },
  modalLevelDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  modalCurrentValue: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
  modalProgressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#EEEEEE",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 20,
  },
  modalProgressFill: {
    height: "100%",
    borderRadius: 4,
  },
  levelsContainer: {
    maxHeight: 300,
  },
  levelItem: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  levelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  levelDescription: {
    fontSize: 14,
    marginBottom: 5,
  },
  levelThreshold: {
    fontSize: 14,
    color: "#666",
  },
});