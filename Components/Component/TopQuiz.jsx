import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import FontAwesome from "react-native-vector-icons/FontAwesome";

const quizzes = [
  { id: '1', title: 'Statistics Math Quiz', subtitle: 'Math • 12 Quizzes', image: require('../Images/statistics.png') },
  { id: '2', title: 'Matrices Quiz', subtitle: 'Math • 6 Quizzes', image: require('../Images/matrices.png') }
];

const TopQuiz = () => {
  return (
    <View style={styles.quizList}>
      <Text style={styles.quizTitle}>Quiz</Text>
      <FlatList
        data={quizzes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.quizItem}>
            <View>
              <Image source={item.image} style={styles.quizImage} />
            </View>
            <View>
              <Text style={styles.quizText}>{item.title}</Text>
              <Text style={styles.quizSubtitle}>{item.subtitle}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <FontAwesome name="chevron-right" size={20} color="#6A5AE0" style={{ justifyContent: 'flex-end' }} />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default TopQuiz;

const styles = StyleSheet.create({
  quizList: {
    marginTop: 16,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  quizItem: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEEFC',
    marginBottom: 10,
  },
  quizImage: {
    width: 64,
    height: 64,
    marginRight: 12,
  },
  quizText: {
    fontSize: 16,
    fontWeight: '600',
  },
  quizSubtitle: {
    fontSize: 14,
    color: 'gray',
  },
});