import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
} from "react-native";
import { auth, realtimeDb } from "../config";
import { get, ref, update } from "firebase/database";
import FontAwesome from "react-native-vector-icons/FontAwesome";

const { width } = Dimensions.get("window");

const TopQuiz = () => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [reviewed, setReviewed] = useState(0);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    // Lấy tất cả các câu hỏi từ tất cả người dùng
    const fetchQuestions = async () => {
      try {
        const usersRef = ref(realtimeDb, "users");
        const usersSnapshot = await get(usersRef);
        
        if (!usersSnapshot.exists()) {
          console.log("Không có dữ liệu người dùng");
          return;
        }
        
        const allQuestions = [];
        
        usersSnapshot.forEach((userSnapshot) => {
          const userId = userSnapshot.key;
          const userData = userSnapshot.val();
          
          // Bỏ qua người dùng hiện tại
          if (userId !== currentUser.uid && userData.userQuestions) {
            // Lặp qua từng câu hỏi của người dùng này
            Object.entries(userData.userQuestions).forEach(
              ([questionId, questionData]) => {
                allQuestions.push({
                  id: questionId,
                  userId: userId,
                  name: userData.name,
                  ...questionData,
                });
              }
            );
          }
        });
        
        // Random ngẫu nhiên các câu hỏi
        setQuestions(allQuestions.sort(() => 0.5 - Math.random()));
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      }
    };
    
    fetchQuestions();
  }, [currentUser]);

  const updateRemainingQuestions = async (increment) => {
    if (!currentUser) return;
    
    try {
      const userRef = ref(realtimeDb, `users/${currentUser.uid}`);
      const userSnapshot = await get(userRef);
      
      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        const currentRemaining = userData.remainingQuestions || 0;
        
        // Cập nhật remainingQuestion
        await update(userRef, {
          remainingQuestions: currentRemaining + increment,
        });
        
        console.log("Đã cập nhật remainingQuestion thành công:", currentRemaining + increment);
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật remainingQuestion:", error);
    }
  };

  const handleAnswer = async (choice) => {
    if (currentIndex < questions.length) {
      const currentQuestion = questions[currentIndex];
      const isCorrect = choice === currentQuestion.correctOption;
      
      // Cập nhật số câu đã review
      setReviewed(prev => prev + 1);
      
      if (isCorrect) {
        // Cập nhật số lượt tạo được nhận thêm
        setScore(prev => prev + 1);
        
        // Cập nhật remainingQuestions khi trả lời đúng
        await updateRemainingQuestions(1);
      } 
      
      // Chuyển sang câu hỏi tiếp theo sau khi cập nhật
      nextCard();
      
      // Kiểm tra nếu là câu hỏi cuối cùng
      const isLastQuestion = currentIndex === questions.length - 1;
      
      if (isLastQuestion) {
        // Xử lý kết thúc ở đây nếu cần
        console.log("Đã hoàn thành tất cả câu hỏi");
      }
    }
  };

  const nextCard = () => {
    setCurrentIndex(prev => prev + 1);
  };

  const renderQuestion = () => {
    if (currentIndex >= questions.length) {
      return (
        <View style={styles.endContainer}>
          <Text style={styles.endText}>No more questions to review!</Text>
          <Text style={styles.scoreText}>Đã đánh giá: {reviewed} câu hỏi</Text>
        </View>
      );
    }

    const question = questions[currentIndex];

    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Image
            source={require("../Images/character2.png")}
            style={styles.avatar}
            defaultSource={require("../Images/character2.png")}
          />
          <Text style={styles.userName}>{question.name}</Text>
        </View>

        <View style={styles.questionContent}>
          <Text style={styles.questionText}>{question.question}</Text>

          <View style={styles.optionsContainer}>
            <View style={styles.optionItem}>
              <View
                style={[styles.optionBullet, { backgroundColor: "#FFECEC" }]}
              >
                <Text style={[styles.optionKey, { color: "#FF4A4A" }]}>X</Text>
              </View>
              <Text style={styles.optionValue}>Sai</Text>
            </View>
            <View style={styles.optionItem}>
              <View
                style={[styles.optionBullet, { backgroundColor: "#E7F8E9" }]}
              >
                <Text style={[styles.optionKey, { color: "#4CAF50" }]}>✓</Text>
              </View>
              <Text style={styles.optionValue}>Đúng</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.answerButton, styles.falseButton]} 
            onPress={() => handleAnswer("Sai")}
          >
            <FontAwesome name="times" size={24} color="#FFFFFF" />
            <Text style={styles.buttonText}>Sai</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.answerButton, styles.trueButton]} 
            onPress={() => handleAnswer("Đúng")}
          >
            <FontAwesome name="check" size={24} color="#FFFFFF" />
            <Text style={styles.buttonText}>Đúng</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>Đã đánh giá: {reviewed}</Text>
        <Text style={[styles.statsText, { marginLeft: 20 }]}>Lượt tạo thêm: {score}</Text>
      </View>

      {renderQuestion()}
    </View>
  );
};

export default TopQuiz;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
  },
  statsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF5E78",
  },
  card: {
    width: width - 70,
    minHeight: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEEFC",
    paddingBottom: 15,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  questionContent: {
    flex: 1,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
    lineHeight: 24,
  },
  optionsContainer: {
    marginTop: 15,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  optionBullet: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EFEEFC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  optionKey: {
    color: "#6A5AE0",
    fontWeight: "700",
  },
  optionValue: {
    fontSize: 16,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#EFEEFC",
  },
  answerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    width: "45%",
  },
  falseButton: {
    backgroundColor: "#FF4A4A",
  },
  trueButton: {
    backgroundColor: "#4CAF50",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  endContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  endText: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#6A5AE0",
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
});