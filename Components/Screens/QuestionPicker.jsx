import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Platform
} from "react-native";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { realtimeDb, auth } from "../config";
import { set, ref, get } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Dropdown } from "react-native-element-dropdown";

const { width, height } = Dimensions.get('window');

// Danh sách các danh mục và hình ảnh tương ứng
const CATEGORIES = [
  { label: "Tất cả", value: "All" },
  { label: "Khoa Học và Công nghệ", value: "Khoa Học và Công nghệ" },
  { label: "Địa lý và Môi trường", value: "Địa lý và Môi trường" },
  { label: "Lịch sử và Văn hóa", value: "Lịch sử và Văn hóa" },
  { label: "Thể thao và Giải trí", value: "Thể thao và Giải trí" },
  { label: "Sức khỏe và Đời sống", value: "Sức khỏe và Đời sống" },
  {
    label: "Việt Nam – Địa lý, Lịch sử và Văn hóa",
    value: "Việt Nam – Địa lý, Lịch sử và Văn hóa",
  },
];

const CATEGORY_IMAGES = {
  "Khoa Học và Công nghệ": require("../Images/atom.png"),
  "Địa lý và Môi trường": require("../Images/geography.png"),
  "Lịch sử và Văn hóa": require("../Images/history.png"),
  "Thể thao và Giải trí": require("../Images/entertainment.png"),
  "Sức khỏe và Đời sống": require("../Images/healthcare.png"),
  "Việt Nam – Địa lý, Lịch sử và Văn hóa": require("../Images/vietnamese.png"),
};

const QuestionPicker = () => {
  const [userId, setUserId] = useState(null);
  const [userQuestions, setUserQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isFocus, setIsFocus] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const navigation = useNavigation();
  const selectedCount = selectedQuestions.length;

  // Lấy dữ liệu người dùng và câu hỏi khi component được mount
  useEffect(() => {
    const initData = async () => {
      try {
        setIsLoading(true);
        const userID = await AsyncStorage.getItem("userId");
        if (userID) {
          const parsedUserId = JSON.parse(userID);
          setUserId(parsedUserId);
          await fetchUserQuestions(parsedUserId);
        }
      } catch (error) {
        console.log("Error initializing data:", error);
        Alert.alert("Lỗi", "Không thể tải dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, []);

  // Lấy danh sách câu hỏi của người dùng
  const fetchUserQuestions = async (userID) => {
    try {
      const userQuestionsRef = ref(realtimeDb, `users/${userID}/userQuestions`);
      const snapshot = await get(userQuestionsRef);
      
      if (snapshot.exists()) {
        const userQuestionsData = snapshot.val();
        const userQuestionsArray = Object.keys(userQuestionsData).map(
          (key) => ({
            id: key,
            ...userQuestionsData[key],
          })
        );
        setUserQuestions(userQuestionsArray);
      } else {
        setUserQuestions([]);
      }
    } catch (error) {
      console.log("Error fetching user questions:", error);
      throw error;
    }
  };

  // Lọc câu hỏi theo danh mục đã chọn
  const filteredQuestions = useMemo(() => {
    if (!selectedCategory || selectedCategory === "All") {
      return userQuestions;
    }
    return userQuestions.filter(
      (question) => question.categoryName === selectedCategory
    );
  }, [userQuestions, selectedCategory]);

  // Xử lý khi người dùng chọn "Chọn hết"
  const handleSelectAll = useCallback(() => {
    if (filteredQuestions.length >= 10) {
      const firstTenQuestions = filteredQuestions.slice(0, 10);
      setSelectedQuestions(firstTenQuestions);
    } else {
      Alert.alert(
        "Thông báo",
        "Không đủ câu hỏi để chọn. Vui lòng thêm ít nhất 10 câu hỏi hoặc chọn danh mục khác."
      );
    }
  }, [filteredQuestions]);

  // Xử lý khi người dùng chọn một câu hỏi
  const handleQuestionPress = useCallback((question) => {
    setSelectedQuestions(prev => {
      const isSelected = prev.some((q) => q.id === question.id);
      
      if (isSelected) {
        return prev.filter((q) => q.id !== question.id);
      } else {
        if (prev.length < 10) {
          return [...prev, question];
        } else {
          Alert.alert("Thông báo", "Bạn chỉ được chọn tối đa 10 câu hỏi.");
          return prev;
        }
      }
    });
  }, []);

  // Xử lý khi người dùng bắt đầu thách đấu
  const handleStartChallenge = useCallback(async () => {
    if (selectedQuestions.length !== 10) {
      Alert.alert("Thông báo", "Vui lòng chọn đủ 10 câu hỏi để bắt đầu thách đấu!");
      return;
    }

    try {
      setIsLoading(true);
      const roomId = await AsyncStorage.getItem("currentRoomId");

      if (!roomId || !userId) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin phòng hoặc người chơi.");
        return;
      }

      const playerQuestionsRef = ref(
        realtimeDb,
        `rooms/${roomId}/players/${userId}/playerQuestions`
      );
      await set(playerQuestionsRef, selectedQuestions);

      Alert.alert(
        "Thành công", 
        "Đã lưu câu hỏi thành công!", 
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error("Lỗi khi lưu câu hỏi:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi lưu câu hỏi.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedQuestions, userId, navigation]);

  // Render từng mục câu hỏi
  const renderQuestionItem = useCallback(({ item }) => {
    const isSelected = selectedQuestions.some((q) => q.id === item.id);
    const isCorrect = item.correctOption === "Đúng";
    
    return (
      <TouchableOpacity
        onPress={() => handleQuestionPress(item)}
        style={[
          styles.questionCard,
          isSelected && styles.selectedQuestion,
        ]}
        activeOpacity={0.7}
      >
        <View style={styles.questionHeader}>
          <Image
            style={styles.categoryImage}
            source={CATEGORY_IMAGES[item.categoryName]}
            resizeMode="contain"
          />
          <Text style={styles.categoryName}>{item.categoryName}</Text>
        </View>
        
        <View style={styles.questionContent}>
          <Text style={styles.questionText}>{item.question}</Text>
          <Text style={[
            styles.answerText,
            { color: isCorrect ? "#1F8435" : "#FA3939" }
          ]}>
            Đáp án: <Text style={styles.answerBold}>{isCorrect ? "Đúng" : "Sai"}</Text>
          </Text>
        </View>
        
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>Đã chọn</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [selectedQuestions, handleQuestionPress]);

  // Render empty state khi không có câu hỏi
  const renderEmptyList = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        Không có câu hỏi nào{selectedCategory !== "All" ? " trong danh mục này" : ""}
      </Text>
      <Text style={styles.emptySubText}>
        Hãy thêm câu hỏi hoặc chọn danh mục khác
      </Text>
    </View>
  ), [selectedCategory]);

  // Render header của danh sách
  const ListHeaderComponent = useCallback(() => (
    <View style={styles.listHeader}>
      <Text style={styles.selectionCounter}>
        Đã chọn: <Text style={styles.counterNumber}>{selectedCount}/10</Text>
        {selectedCount === 10 && <Text style={styles.counterComplete}> (Đã chọn đủ)</Text>}
      </Text>
      
      {filteredQuestions.length > 0 && (
        <TouchableOpacity
          style={styles.selectAllButton}
          onPress={handleSelectAll}
          activeOpacity={0.7}
        >
          <Text style={styles.selectAllButtonText}>Chọn hết</Text>
        </TouchableOpacity>
      )}
    </View>
  ), [selectedCount, filteredQuestions.length, handleSelectAll]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A42FC1" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FBECFF" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Image
            style={styles.backIcon}
            source={require("../Images/previous.png")}
          />
        </TouchableOpacity>
        
        <View style={styles.dropdownContainer}>
          <Dropdown
            style={[styles.dropdown, isFocus && styles.dropdownFocus]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            data={CATEGORIES}
            search
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder={!isFocus ? "Chọn danh mục" : "..."}
            searchPlaceholder="Tìm kiếm..."
            value={selectedCategory}
            onFocus={() => setIsFocus(true)}
            onBlur={() => setIsFocus(false)}
            onChange={(item) => {
              setSelectedCategory(item.value);
              setIsFocus(false);
            }}
            renderLeftIcon={() => (
              <Image
                style={styles.filterIcon}
                source={require("../Images/filter.png")}
              />
            )}
          />
        </View>
      </View>
      
      {/* Title */}
      <Text style={styles.title}>Chọn Câu Hỏi Thách Đấu</Text>
      
      {/* Question List */}
      <FlatList
        data={filteredQuestions}
        keyExtractor={(item) => item.id}
        renderItem={renderQuestionItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyList}
        ListHeaderComponent={ListHeaderComponent}
        showsVerticalScrollIndicator={false}
      />
      
      {/* Complete Button */}
      <TouchableOpacity
        onPress={handleStartChallenge}
        style={[
          styles.completeButton,
          selectedCount !== 10 && styles.completeButtonDisabled
        ]}
        activeOpacity={selectedCount === 10 ? 0.7 : 1}
      >
        <Text style={styles.completeButtonText}>
          Hoàn Thành Chọn Bộ Câu Hỏi
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default QuestionPicker;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBECFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FBECFF",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#A42FC1",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: width * 0.05,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 15,
    paddingBottom: 15,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(164, 47, 193, 0.1)",
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: "#A42FC1",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#A42FC1",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  dropdownContainer: {
    width: width * 0.5,
  },
  dropdown: {
    height: 40,
    borderColor: "#A42FC1",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "white",
  },
  dropdownFocus: {
    borderColor: "#A42FC1",
    borderWidth: 2,
    shadowColor: "#A42FC1",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filterIcon: {
    marginRight: 8,
    width: 20,
    height: 20,
    tintColor: "#A42FC1",
  },
  placeholderStyle: {
    fontSize: 14,
    color: "#666",
  },
  selectedTextStyle: {
    fontSize: 14,
    color: "#A42FC1",
    fontWeight: "500",
  },
  iconStyle: {
    width: 20,
    height: 20,
    tintColor: "#A42FC1",
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
    borderColor: "#A42FC1",
  },
  listContainer: {
    paddingHorizontal: width * 0.05,
    paddingBottom: 100,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  selectionCounter: {
    fontSize: 14,
    color: "#666",
  },
  counterNumber: {
    fontWeight: "bold",
    color: "#A42FC1",
  },
  counterComplete: {
    fontStyle: "italic",
    color: "#1F8435",
  },
  selectAllButton: {
    backgroundColor: "rgba(164, 47, 193, 0.9)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  selectAllButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  questionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  selectedQuestion: {
    backgroundColor: "#E5F9E7",
    borderColor: "#1F8435",
    borderWidth: 1.5,
  },
  questionHeader: {
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  categoryImage: {
    width: 48,
    height: 48,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
    color: "#A42FC1",
    textAlign: "center",
  },
  questionContent: {
    padding: 16,
  },
  questionText: {
    fontSize: 15,
    color: "#333",
    marginBottom: 10,
    lineHeight: 22,
  },
  answerText: {
    fontSize: 14,
    marginTop: 4,
  },
  answerBold: {
    fontWeight: "700",
  },
  selectedBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#1F8435",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  selectedBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: height * 0.3,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  completeButton: {
    position: "absolute",
    bottom: 24,
    left: width * 0.05,
    right: width * 0.05,
    backgroundColor: "#A42FC1",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  completeButtonDisabled: {
    backgroundColor: "rgba(164, 47, 193, 0.5)",
  },
  completeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});