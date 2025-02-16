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
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const navigation = useNavigation();
  const { category } = route.params;

  useEffect(() => {
    getQuestions(category);
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
    setQuestionIndex((prevIndex) => prevIndex + 1);
  };

  const handleOptionSelected = (questionIndex, option) => {
    setSelectedOption({
      ...selectedOption,
      [questionIndex]: option,
    });
  };

  const handleSubmit = () => {
    let correctAnswers = 0;
    question.forEach((question, index) => {
      if (selectedOption[index] === question.correctOption) {
        correctAnswers++;
      }
    });
    setScore(correctAnswers);
    setShowResult(true);
  };

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={{ flex: 1 }}
        data={question.slice(0, 1)}
        bounces={false}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
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
                  <Text style={styles.correctText}>01</Text>
                  <Text style={styles.correctText}>Đúng</Text>
                </View>
                <View style={styles.timeCounter}>
                  <Text style={styles.countdownTime}>15</Text>
                </View>
                <View style={styles.answerCheckbox}>
                  <Text style={styles.incorrectText}>01</Text>
                  <Text style={styles.incorrectText}>Sai</Text>
                </View>
              </View>
              <Text style={styles.questionText}>
                Câu hỏi số {index + 1} / {question.length}{" "}
              </Text>
              <Text style={styles.questionText2}>{item.question}</Text>
            </View>
            <TouchableOpacity 
            style={[styles.answerBox,
              selectedOption[index] === 1 && styles.selectedOption]
            }>
              <Text style={styles.answerText}>{item.yesOption}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.answerBox}>
              <Text style={styles.answerText}>{item.noOption}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
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
    width: "100%",
    height: "92%",
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
