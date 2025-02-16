import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { db } from "../config";
import { collection, getDocs, query, where } from "firebase/firestore";

const QAmonitor = ({ route }) => {
  const [question, setQuestion] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState({});
  const [correctScore, setCorrectScore] = useState(0);
  const [wrongScore, setWrongScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [timer, setTimer] = useState(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);

  const navigation = useNavigation();
  const { category } = route.params;

  useEffect(() => {
    let currentTimer = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);
    setTimer(currentTimer);

    return () => clearInterval(currentTimer);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      console.log("Hết thời gian!");
      setSkippedCount(skippedCount + 1);
      handleNextQuestion();
      setTimeLeft(15);
    }
  }, [timeLeft]);

  useEffect(() => {
    getQuestions(category);
    console.log(question);
  }, [category]);

  const getQuestions = async (currentCategory) => {
    if (loaded) return;
    setSelectedOption({});
    setShowResult(false);

    //tạo query
    const q = query(
      collection(db, "questions"),
      where("category", "==", currentCategory)
    );

    const querySnapshot = await getDocs(q);
    const questionData = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
    const shuffleQuestion = questionData.sort(() => 0.5 - Math.random());
    setQuestion(shuffleQuestion.slice(0, 5));
    setLoaded(true);

    // const data = await getDocs(collection(db, "questions"));
    // const questionData = data.docs.map((doc) => ({
    //   ...doc.data(), id: doc.id,
    // }));
    // setQuestion(questionData);

    // const db = firebase.firestore();
    // const questionRef = db.collection("questions");
    // const snapshot = await questionRef.where("category", "==", category).get();
    // if (snapshot.empty) {
    //   console.log("No matching documents...");
    //   return;
    // }
    // const allQuestions = snapshot.docs.map((doc) => doc.data());
    // const shuffleQuestion = allQuestions.sort(() => 0.5 - Math.random());
    // setQuestion(shuffleQuestion.slice(0, 5));
    // console.log("Questions fetched:", shuffleQuestion.slice(0, 5));
  };

  const currentQuestion = question[questionIndex];

  const handleNextQuestion = () => {
    if (questionIndex < question.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else {
      console.log("Đã hết câu hỏi!");
      navigation.navigate("Result", {
        answered: answeredCount + 1, //cộng thêm 1 cho câu hỏi cuối
        skipped: skippedCount,
        numberofquestion: question.length,
        correct: correctScore,
        wrong: wrongScore,
      });
    }
  };

  const handleOptionSelected = (selectedOption) => {
    clearInterval(timer);
    setTimeLeft(15);

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
      navigation.navigate("Result", {
        answered: answeredCount + 1,
        skipped: skippedCount,
        numberofquestion: question.length,
        correct: correctScore + (selectedOption === correctAnswer ? 1 : 0), // CorrectScore đã được cập nhật ở trên
        wrong: wrongScore + (selectedOption !== correctAnswer ? 1 : 0), // WrongScore đã được cập nhật ở trên
        questions: question,
      });
    } else {
      // Nếu không phải câu cuối cùng, chuyển sang câu tiếp theo
      setQuestionIndex((prevIndex) => prevIndex + 1);
    }
  };

  return (
    <View style={styles.container}>
      {currentQuestion && (
        <View style={styles.contentBox}>
          <View style={styles.maskBox}>
            <View
              style={{
                width: "90%",
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 20,
              }}
            >
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Image
                  style={{ tintColor: "#fff" }}
                  source={require("../Images/previous.png")}
                />
              </TouchableOpacity>
              <TouchableOpacity>
                <Image
                  style={{ tintColor: "#fff" }}
                  source={require("../Images/warning.png")}
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.questionBox}>
            <View style={styles.headerLine}>
              <View style={styles.answerCheckbox}>
                <Text style={styles.correctText}>{correctScore}</Text>
                <Text style={styles.correctText}>Đúng</Text>
              </View>
              <View style={styles.timeCounter}>
                <Text style={styles.countdownTime}>{timeLeft}</Text>
              </View>
              <View style={styles.answerCheckbox}>
                <Text style={styles.incorrectText}>{wrongScore}</Text>
                <Text style={styles.incorrectText}>Sai</Text>
              </View>
            </View>
            <Text style={styles.questionText}>
              Câu hỏi số {questionIndex + 1} / {question.length}
            </Text>
            <Text style={styles.questionText2}>{currentQuestion.question}</Text>
          </View>
          <TouchableOpacity
            onPress={() => handleOptionSelected(1)}
            style={styles.answerBox}
          >
            <Text style={styles.answerText}>{currentQuestion.yesOption}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleOptionSelected(2)}
            style={styles.answerBox}
          >
            <Text style={styles.answerText}>{currentQuestion.noOption}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default QAmonitor;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBECFF",
    alignItems: "center",
    justifyContent: "center",
  },
  contentBox: {
    width: "95%",
    height: "90%",
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 20,
    marginTop: 57,
  },
  maskBox: {
    width: "100%",
    height: "30%",
    backgroundColor: "#A42FC1",
    borderRadius: 30,
    flexDirection: "row",
    justifyContent: "center",
  },
  questionBox: {
    width: "85%",
    height: "25%",
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignSelf: "center",
    marginTop: -100,
    marginBottom: 50,
  },
  headerLine: {
    width: "100%",
    height: "50%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignSelf: "center",
  },
  answerBox: {
    width: "85%",
    height: "9%",
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#A42FC1",
    alignSelf: "center",
    borderRadius: 25,
    marginTop: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  timeCounter: {
    width: "25%",
    height: "80%",
    backgroundColor: "#fff",
    marginTop: -100,
    alignSelf: "center",
    borderRadius: 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignItems: "center",
    justifyContent: "center",
  },
  countdownTime: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#A42FC1",
  },
  answerCheckbox: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  correctText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1F8435",
  },
  incorrectText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#FA3939",
  },
  questionText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#A42FC1",
    marginTop: -40,
    alignSelf: "center",
  },
  questionText2: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2B262D",
    alignSelf: "center",
    marginTop: 40,
    textAlign: "center",
  },
  answerText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2B262D",
  },
});
