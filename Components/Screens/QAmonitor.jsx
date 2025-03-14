import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Animated,
  PanResponder,
  Modal,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { realtimeDb, auth } from "../config";
import { ref, update } from "firebase/database";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SCREEN_WIDTH = Dimensions.get("window").width;

// Colors
const COLORS = {
  primary: "#A42FC1",
  background: "#FBECFF",
  white: "#fff",
  text: "#2B262D",
  correct: "#1F8435",
  incorrect: "#FA3939",
};

const QAmonitor = ({ route }) => {
  const { selectedQuestion, roomid } = route.params;
  
  // State management
  const [question, setQuestion] = useState(selectedQuestion);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctScore, setCorrectScore] = useState(0);
  const [wrongScore, setWrongScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [timer, setTimer] = useState(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [startTime, setStartTime] = useState(null);
  const [showLoading, setShowLoading] = useState(false);

  const user = auth.currentUser;
  const navigation = useNavigation();
  const swipe = useRef(new Animated.ValueXY()).current;

  // Clean up timer when component unmounts
  useEffect(() => {
    return () => clearInterval(timer);
  }, [timer]);

  // Handle timer expiration
  useEffect(() => {
    if (timeLeft === 0) {
      setSkippedCount(skippedCount + 1);
      handleNextQuestion();
    }
  }, [timeLeft]);

  // Reset animation when question changes
  // useEffect(() => {
  //   swipe.setValue({ x: 0, y: 0 });
  // }, [questionIndex]);

  // Reset game when screen comes into focus
  // useFocusEffect(
  //   useCallback(() => {
  //     return () => {
  //       clearInterval(timer);
  //     };
  //   }, [timer])
  // );

  const currentQuestion = question[questionIndex];

  // Update player score in database
  const updatePlayerScore = async (score, totalTime) => {
    try {
      const playerRef = ref(realtimeDb, `rooms/${roomid}/players/${user.uid}`);
      await update(playerRef, {
        diem: score,
        totalTime: totalTime,
      });
    } catch (error) {
      console.error("Error updating player score:", error);
    }
  };

  // Calculate total time spent
  const calculateTotalTime = (start, finish) => {
    if (!start || !finish) return 0;
    return Math.floor((finish - start) / 1000);
  };

  // Start the countdown timer
  const startTimer = () => {
    const currentTimer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime > 0) {
          return prevTime - 1;
        } else {
          clearInterval(timer);
          return 0; // Đảm bảo thời gian không âm
        }
      });
    }, 1000);
    setTimer(currentTimer);
  };

  // Handle game start
  const handleStartGame = () => {
    setShowInstructions(false);
    setStartTime(new Date());
    setTimeout(() => {
      setTimeLeft(15);
      startTimer();
    }, 500);
  };

  // Navigate to next question or results screen
  const handleNextQuestion = () => {
    if (questionIndex < question.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else {
      const finishTime = new Date();
      const totalTime = calculateTotalTime(startTime, finishTime);
      console.log("Đã hết câu hỏi!");
      updatePlayerScore(
        Math.round((correctScore / question.length) * 100),
        totalTime
      );
      navigation.navigate("Result", {
        answered: answeredCount + 1, //cộng thêm 1 cho câu hỏi cuối
        skipped: skippedCount,
        numberofquestion: question.length,
        correct: correctScore,
        wrong: wrongScore,
        totalTime: totalTime,
        roomid: roomid,
      });
    }
  };

  // Navigate to results screen with final scores
  const navigateToResults = async () => {
    // Dừng timer nếu còn chạy
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    
    setShowLoading(true);
    
    const finishTime = new Date();
    const totalTime = calculateTotalTime(startTime, finishTime);
    const finalScore = Math.round((correctScore / question.length) * 100);
    
    try {
      await updatePlayerScore(finalScore, totalTime);
      
      // Đợi một khoảng thời gian ngắn để hiển thị loading
      setTimeout(() => {
        setShowLoading(false);
        navigation.navigate("Result", {
          answered: answeredCount,
          skipped: skippedCount,
          numberofquestion: question.length,
          correct: correctScore,
          wrong: wrongScore,
          questions: question,
          totalTime: totalTime,
          user: user,
          roomid: roomid,
        });
      }, 1000);
    } catch (error) {
      console.error("Error in navigateToResults:", error);
      setShowLoading(false);
      // Vẫn chuyển hướng nếu có lỗi
      navigation.navigate("Result", {
        answered: answeredCount,
        skipped: skippedCount,
        numberofquestion: question.length,
        correct: correctScore,
        wrong: wrongScore,
        questions: question,
        totalTime: totalTime,
        user: user,
        roomid: roomid,
      });
    }
  };

  // Handle option selection
  const handleOptionSelected = (selectedOption) => {
    clearInterval(timer);

    const currentQuestion = question[questionIndex];
    const correctAnswer = currentQuestion.correctOption;
    const isLastQuestion = questionIndex === question.length - 1;

    if (selectedOption === correctAnswer) {
      setCorrectScore((prevScore) => prevScore + 1); // Sử dụng callback để đảm bảo cập nhật đúng giá trị
    } else {
      setWrongScore((prevScore) => prevScore + 1); // Sử dụng callback để đảm bảo cập nhật đúng giá trị
    }

    setAnsweredCount((prevCount) => prevCount + 1);

    // Chuyển sang màn hình kết quả *chỉ khi* là câu hỏi cuối cùng
    if (isLastQuestion) {
      setShowLoading(true);

      const finishTime = new Date();
      const totalTime = calculateTotalTime(startTime, finishTime);
      const correctScoreFinal = correctScore + (selectedOption === correctAnswer ? 1 : 0);
      const wrongScoreFinal = wrongScore + (selectedOption !== correctAnswer ? 1 : 0);
      
      updatePlayerScore(
        Math.round((correctScoreFinal / question.length) * 100),
        totalTime
      );
      
      // Delay 2s trước khi chuyển màn hình
    setTimeout(() => {
      setShowLoading(false);
      navigation.navigate("Result", {
        answered: answeredCount + 1,
        skipped: skippedCount,
        numberofquestion: question.length,
        correct: correctScoreFinal,
        wrong: wrongScoreFinal,
        questions: question,
        totalTime: totalTime,
        user: user,
        roomid: roomid,
      });
    }, 1500);
    } else {
      // Nếu không phải câu cuối cùng, chuyển sang câu tiếp theo
      setQuestionIndex((prevIndex) => prevIndex + 1);
      setTimeLeft(15); // Đặt lại thời gian đếm ngược
      startTimer();
    }
  };

  // Pan responder for swipe gestures
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, { dx, dy }) => {
      console.log("dx" + dx + "dy" + dy);
      swipe.setValue({ x: dx, y: dy });
    },
    onPanResponderRelease: (_, { dx, dy }) => {
      const direction = Math.sign(dx);
      const isActionActive = Math.abs(dx) > 100;

      if (isActionActive) {
        if (direction === 1) {
          handleOptionSelected("Sai");
          setWrongCount((prevScore) => prevScore + 1);
        } else if (direction === -1) {
          handleOptionSelected("Đúng");
          setCorrectCount((prevScore) => prevScore + 1);
        }
        //Di chuyen index dau tien ra khoi man hinh
        Animated.timing(swipe, {
          duration: 200,
          toValue: {
            x: direction * SCREEN_WIDTH,
            y: dy,
          },
          useNativeDriver: true,
        }).start(() => {
          // Sau khi animation kết thúc, reset vị trí và chuyển sang câu hỏi tiếp theo
          swipe.setValue({ x: 0, y: 0 });
          // handleNextQuestion();
        });
      } else {
        // Nếu swipe không đủ mạnh, reset vị trí card
        Animated.spring(swipe, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
          friction: 5,
        }).start();
      }
    },
  });
  // Animation interpolations
  const rotate = swipe.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ["-10deg", "0deg", "10deg"],
    extrapolate: "clamp",
  });

  const correctOpacity = swipe.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const incorrectOpacity = swipe.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const animatedCardStyle = {
    transform: [
      { translateX: swipe.x },
      { rotate: rotate },
    ],
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.background} barStyle="dark-content" />
      
      {/* Instructions Modal */}
      <Modal visible={showInstructions} animationType="fade" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Hướng dẫn chơi</Text>
            <View style={styles.instructionRow}>
              <Image 
                source={require("../Images/swipe-left.png")} 
                style={styles.instructionIcon} 
                resizeMode="contain"
              />
              <Text style={styles.modalText}>
                Vuốt sang trái nếu bạn nghĩ câu trả lời là "Đúng"
              </Text>
            </View>
            <View style={styles.instructionRow}>
              <Image 
                source={require("../Images/swipe-right.png")} 
                style={styles.instructionIcon} 
                resizeMode="contain"
              />
              <Text style={styles.modalText}>
                Vuốt sang phải nếu bạn nghĩ câu trả lời là "Sai"
              </Text>
            </View>
            <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
              <Text style={styles.startButtonText}>Bắt đầu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Loading Overlay */}
      <Modal visible={showLoading} animationType="fade" transparent={true}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang tính điểm</Text>
          </View>
        </View>
      </Modal>

      {/* Main Content */}
      {currentQuestion && !showInstructions && (
        <View style={styles.gameContainer}>
          {/* Card */}
          <Animated.View 
            style={[styles.card, animatedCardStyle]} 
            {...panResponder.panHandlers}
          >
            {/* Header */}
            <View style={styles.headerBackground}>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Image
                    source={require("../Images/previous.png")}
                    style={styles.headerIcon}
                  />
                </TouchableOpacity>
                <View style={styles.questionCounter}>
                  <Text style={styles.questionCounterText}>{questionIndex + 1}/{question.length}</Text>
                </View>
                <TouchableOpacity>
                  <Image
                    source={require("../Images/warning.png")}
                    style={styles.headerIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Timer */}
            <View style={styles.timerWrapper}>
              <View style={styles.timerCircle}>
                <Text style={styles.timerText}>{timeLeft}</Text>
              </View>
            </View>

            {/* Scores */}
            <View style={styles.scoreRow}>
              <View style={styles.scoreItem}>
                <Text style={styles.scoreNumber}>{correctCount}</Text>
                <Text style={styles.scoreCorrect}>Đúng</Text>
              </View>
              <View style={styles.scoreItem}>
                <Text style={styles.scoreNumber}>{wrongCount}</Text>
                <Text style={styles.scoreIncorrect}>Sai</Text>
              </View>
            </View>

            {/* Question */}
            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>{currentQuestion.question}</Text>
            </View>

            {/* Answer Buttons */}
            <View style={styles.answerButtonsContainer}>
              <TouchableOpacity 
                style={styles.answerButton} 
                onPress={() => handleOptionSelected("Đúng")}
              >
                <Image 
                  source={require("../Images/swipe-left.png")}
                  style={styles.answerButtonIcon}
                />
                <Text style={styles.answerButtonTextCorrect}>Đúng</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.answerButton}
                onPress={() => handleOptionSelected("Sai")}
              >
                <Text style={styles.answerButtonTextIncorrect}>Sai</Text>
                <Image 
                  source={require("../Images/swipe-right.png")}
                  style={styles.answerButtonIcon}
                />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gameContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    height: '85%',
    maxHeight: 640,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerBackground: {
    backgroundColor: COLORS.primary,
    height: 200,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: '100%',
  },
  headerIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.white,
  },
  questionCounter: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  questionCounterText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  timerWrapper: {
    alignItems: 'center',
    marginTop: -35,
  },
  timerCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  timerText: {
    fontSize: 34,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 30,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  scoreCorrect: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.correct,
  },
  scoreIncorrect: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.incorrect,
  },
  questionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 28,
    color: COLORS.text,
  },
  answerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingBottom: 25,
  },
  answerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  answerButtonIcon: {
    width: 24,
    height: 24,
    marginHorizontal: 8,
  },
  answerButtonTextCorrect: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.correct,
  },
  answerButtonTextIncorrect: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.incorrect,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 16,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: COLORS.primary,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  instructionIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  modalText: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 30,
    marginTop: 24,
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingContent: {
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 200,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 16,
  },
});

export default QAmonitor;