import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  TextInput,
} from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { realtimeDb } from "../config";
import { set, ref, onValue, push, get, runTransaction } from "firebase/database";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Dropdown } from "react-native-element-dropdown";

// Constants
const CATEGORIES = [
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

// Question Item Component
const QuestionItem = ({ item }) => {
  const isCorrect = item.correctOption === "Đúng";
  return (
    <TouchableOpacity
      style={[
        styles.itemContainer,
        {
          borderLeftWidth: 3,
          borderColor: isCorrect ? "#1F8435" : "#FA3939",
        },
      ]}
    >
      <Image
        style={styles.categoryImage}
        source={CATEGORY_IMAGES[item.categoryName]}
      />
      <View style={styles.questionContent}>
        <Text style={styles.categoryLabel}>{item.categoryName}</Text>
        <Text style={styles.questionLabel}>{item.question}</Text>
        <Text
          style={[
            styles.answerLabel,
            { color: isCorrect ? "#1F8435" : "#FA3939" },
          ]}
        >
          {isCorrect
            ? "Đáp án bạn chọn là Đúng"
            : "Đáp án bạn chọn là Sai"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Empty List Component
const EmptyList = () => (
  <Text style={styles.emptyText}>Bạn chưa tạo bộ câu hỏi</Text>
);

const Quiz = () => {
  const navigation = useNavigation();

  // State
  const [modalVisible, setModalVisible] = useState(false);
  const [user, setUser] = useState({});
  const [userId, setUserId] = useState(null);
  const [userQuestions, setUserQuestions] = useState([]);
  const [dropValue, setDropValue] = useState(null);
  const [question, setQuestion] = useState("");
  const [isFocus, setIsFocus] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [remainingQuestions, setRemainingQuestions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user data
  const getUser = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem("userLogin");
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        setUser(parsedUserData);
        setRemainingQuestions(parsedUserData.remainingQuestions || 0);
      }
      
      const userID = await AsyncStorage.getItem("userId");
      if (userID) {
        setUserId(JSON.parse(userID));
      }
    } catch (error) {
      console.log("Error fetching user data:", error);
    }
  }, []);

  // Fetch user questions
  const getUserQuestion = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const userQuestionsRef = ref(realtimeDb, `users/${userId}/userQuestions`);
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
      Alert.alert("Lỗi", "Không thể tải câu hỏi. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Setup listeners
  useEffect(() => {
    const setup = async () => {
      await getUser();
    };
    setup();
  }, []);

  useEffect(() => {
    if (userId) {
      getUserQuestion();
      
      // Listen for changes to remaining questions
      const userRef = ref(realtimeDb, `users/${userId}/remainingQuestions`);
      const unsubscribe = onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data !== null) {
          setRemainingQuestions(Number(data));
        }
      });
      
      return () => unsubscribe();
    }
  }, [userId]);

  // Create user question
  const handleCreateUserQuestions = useCallback(async () => {
    if (!dropValue || !question || !selectedOption) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
      return;
    }
    
    try {
      const userQuestionsRef = ref(realtimeDb, `users/${userId}/userQuestions`);
      const newUserQuestionRef = push(userQuestionsRef);
      
      await set(newUserQuestionRef, {
        categoryName: dropValue,
        question: question,
        correctOption: selectedOption,
      });

      // Update remaining questions
      const userRef = ref(realtimeDb, `users/${userId}`);
      await runTransaction(userRef, (currentData) => {
        if (currentData && currentData.remainingQuestions > 0) {
          currentData.remainingQuestions--;
        }
        return currentData;
      });

      // Reset state
      setQuestion("");
      setDropValue(null);
      setSelectedOption(null);
      setModalVisible(false);

      // Refresh questions
      getUserQuestion();
      
      Alert.alert("Thành công", "Đã tạo câu hỏi mới");
    } catch (error) {
      console.log("Error creating question:", error);
      Alert.alert("Lỗi", "Không thể tạo câu hỏi. Vui lòng thử lại sau.");
    }
  }, [dropValue, question, selectedOption, userId]);

  // Handle option selection
  const handleOptionSelect = useCallback((option) => {
    setSelectedOption(selectedOption === option ? null : option);
  }, [selectedOption]);

  // Create question modal
  const openCreateQuestionModal = useCallback(() => {
    if (remainingQuestions > 0) {
      setModalVisible(true);
    } else {
      Alert.alert(
        "Thông báo",
        "Bạn đã tạo đủ 10 câu hỏi.\nVui lòng Review để nhận thêm lượt tạo!"
      );
    }
  }, [remainingQuestions]);

  // Close modal and reset form
  const closeModal = useCallback(() => {
    Keyboard.dismiss();
    setModalVisible(false);
  }, []);

  // Render question item
  const renderQuestionItem = useCallback(({ item }) => (
    <QuestionItem item={item} />
  ), []);

  // Keyextractor for FlatList
  const keyExtractor = useCallback((item) => item.id, []);

  // Render dropdown label
  const renderLabel = useCallback(() => {
    if (dropValue || isFocus) {
      return (
        <Text style={[styles.label, isFocus && { color: "#FF5E78" }]}>
          Danh mục
        </Text>
      );
    }
    return null;
  }, [dropValue, isFocus]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.text}>Bộ câu hỏi của bạn</Text>
        
        {isLoading ? (
          <ActivityIndicator size="large" color="#6A5AE0" style={styles.loader} />
        ) : (
          <FlatList
            data={userQuestions}
            keyExtractor={keyExtractor}
            renderItem={renderQuestionItem}
            ListEmptyComponent={EmptyList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
        
        <View style={styles.footer}>
          <View style={styles.remainBox}>
            <Text style={styles.remainText}>
              Lượt tạo còn {isNaN(remainingQuestions) ? 0 : remainingQuestions}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.createRoomButton}
            onPress={openCreateQuestionModal}
          >
            <FontAwesome name="plus" size={16} color="white" />
            <Text style={styles.createRoomText}>Tạo Câu Hỏi</Text>
          </TouchableOpacity>
        </View>

        {/* Create Question Modal with Keyboard Dismissal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalView}>
                  <Text style={styles.modalTitle}>Tạo câu hỏi của bạn</Text>
                  
                  <View style={styles.dropContainer}>
                    {renderLabel()}
                    <Dropdown
                      style={[styles.dropdown, isFocus && { borderColor: "#FF5E78" }]}
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
                      value={dropValue}
                      onFocus={() => setIsFocus(true)}
                      onBlur={() => setIsFocus(false)}
                      onChange={(item) => {
                        setDropValue(item.value);
                        setIsFocus(false);
                        Keyboard.dismiss();
                      }}
                      renderLeftIcon={() => (
                        <AntDesign
                          style={styles.icon}
                          color={isFocus ? "#FF5E78" : "black"}
                          name="Safety"
                          size={20}
                        />
                      )}
                    />
                  </View>
                  
                  <TouchableWithoutFeedback>
                    <TextInput
                      style={styles.input}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="off"
                      placeholder="Nhập câu hỏi của bạn"
                      value={question}
                      onChangeText={setQuestion}
                      multiline
                      numberOfLines={3}
                      blurOnSubmit={true}
                    />
                  </TouchableWithoutFeedback>
                  
                  <View style={styles.optionContainer}>
                    <TouchableOpacity
                      style={[
                        styles.yesButton,
                        selectedOption === "Đúng" && styles.correctOption,
                      ]}
                      onPress={() => handleOptionSelect("Đúng")}
                    >
                      <Text
                        style={{
                          color: selectedOption === "Đúng" ? "#fff" : "#1F8435",
                        }}
                      >
                        Đúng
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.noButton,
                        selectedOption === "Sai" && styles.wrongOption,
                      ]}
                      onPress={() => handleOptionSelect("Sai")}
                    >
                      <Text
                        style={{
                          color: selectedOption === "Sai" ? "#fff" : "#FA3939",
                        }}
                      >
                        Sai
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={closeModal}
                    >
                      <Text style={styles.cancelText}>Huỷ</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={handleCreateUserQuestions}
                      style={[
                        styles.createButton,
                        (!dropValue || !question || !selectedOption) && styles.disabledButton
                      ]}
                      disabled={!dropValue || !question || !selectedOption}
                    >
                      <Text style={styles.buttonText}>Tạo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default Quiz;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 16,
    color: "#FF5E78",
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#777",
    marginTop: 40,
  },
  itemContainer: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryImage: {
    width: 40,
    height: 40,
    marginRight: 12,
    alignSelf: "center",
  },
  questionContent: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  questionLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  remainBox: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  remainText: {
    color: "#555",
    fontWeight: "500",
  },
  createRoomButton: {
    backgroundColor: "#6a4be4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  createRoomText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalView: {
    width: "100%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  dropContainer: {
    marginBottom: 20,
  },
  label: {
    position: "absolute",
    backgroundColor: "white",
    left: 22,
    top: -10,
    zIndex: 999,
    paddingHorizontal: 8,
    fontSize: 14,
    color: "#666",
  },
  dropdown: {
    height: 50,
    borderColor: "#C5C5C5",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: "white",
  },
  icon: {
    marginRight: 5,
  },
  placeholderStyle: {
    fontSize: 14,
    color: "#999",
  },
  selectedTextStyle: {
    fontSize: 14,
    color: "#333",
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 14,
    borderColor: "#E0E0E0",
  },
  input: {
    height: 100,
    borderWidth: 1,
    borderColor: "#C5C5C5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
    textAlignVertical: "top",
    fontSize: 14,
    color: "#333",
  },
  optionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  yesButton: {
    width: "48%",
    height: 48,
    borderWidth: 1,
    borderColor: "#1F8435",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  noButton: {
    width: "48%",
    height: 48,
    borderWidth: 1,
    borderColor: "#FA3939",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  correctOption: {
    backgroundColor: "#1F8435",
    borderColor: "#1F8435",
  },
  wrongOption: {
    backgroundColor: "#FA3939",
    borderColor: "#FA3939",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    width: "48%",
    height: 48,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelText: {
    color: "#555",
    fontWeight: "500",
  },
  createButton: {
    width: "48%",
    height: 48,
    backgroundColor: "#6A5AE0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "500",
  },
  disabledButton: {
    backgroundColor: "#BDB9E8",
    opacity: 0.7,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  }
});