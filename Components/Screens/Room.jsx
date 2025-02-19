import React, { useState } from "react";
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, StyleSheet } from "react-native";

const CreateQuizScreen = ({ navigation }) => {
  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(null);

  const addQuestion = () => {
    if (questionText.trim() && correctAnswer !== null && options.every(opt => opt.trim() !== "")) {
      setQuestions([...questions, { questionText, options, correctAnswer }]);
      setQuestionText("");
      setOptions(["", "", "", ""]);
      setCorrectAnswer(null);
    } else {
      alert("Vui lòng nhập đầy đủ câu hỏi và đáp án");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tạo Bộ Câu Hỏi</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập câu hỏi"
        value={questionText}
        onChangeText={setQuestionText}
      />
      {options.map((option, index) => (
        <TextInput
          key={index}
          style={styles.input}
          placeholder={`Đáp án ${index + 1}`}
          value={option}
          onChangeText={(text) => {
            const newOptions = [...options];
            newOptions[index] = text;
            setOptions(newOptions);
          }}
        />
      ))}
      <FlatList
        data={options}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => setCorrectAnswer(index)}>
            <Text style={correctAnswer === index ? styles.selectedOption : styles.option}>{item || `Đáp án ${index + 1}`}</Text>
          </TouchableOpacity>
        )}
      />
      <Button title="Thêm câu hỏi" onPress={addQuestion} />
      <Button title="Bắt đầu chơi" onPress={() => navigation.navigate("GameRoom", { questions })} disabled={questions.length === 0} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  input: { borderWidth: 1, padding: 10, marginBottom: 5 },
  option: { padding: 10, marginVertical: 5, backgroundColor: "lightgray" },
  selectedOption: { padding: 10, marginVertical: 5, backgroundColor: "blue", color: "white" },
});

export default CreateQuizScreen;
