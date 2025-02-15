import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome from "react-native-vector-icons/FontAwesome";

export default function DiscoverScreen() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <FontAwesome name="chevron-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Discover</Text>
        <TouchableOpacity style={styles.createRoomButton}>
          <FontAwesome name="plus" size={16} color="black" />
          <Text style={styles.createRoomText}>Tạo phòng</Text>
        </TouchableOpacity>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          <Text style={styles.activeTab}>Top</Text>
          <Text style={styles.inactiveTab}>Quiz</Text>
          <Text style={styles.inactiveTab}>Categories</Text>
          <Text style={styles.inactiveTab}>Friends</Text>
        </View>

        {/* Quiz List */}
        <View style={styles.quizList}>
          <Text style={styles.quizTitle}>Quiz</Text>
          <TouchableOpacity style={styles.quizItem}>
            <Text style={styles.quizText}>Statistics Math Quiz</Text>
            <FontAwesome name="chevron-right" size={20} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quizItem}>
            <Text style={styles.quizText}>Matrices Quiz</Text>
            <FontAwesome name="chevron-right" size={20} color="black" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6B46C1',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  createRoomButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createRoomText: {
    marginLeft: 8,
    color: 'black',
  },
  tabsContainer: {
    marginTop: 16,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 8,
  },
  activeTab: {
    color: '#6B46C1',
    fontWeight: 'bold',
  },
  inactiveTab: {
    color: 'gray',
  },
  quizList: {
    marginTop: 16,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  quizItem: {
    marginTop: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quizText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
