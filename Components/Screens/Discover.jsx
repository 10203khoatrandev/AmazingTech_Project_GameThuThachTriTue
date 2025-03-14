import { View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { useState } from "react";
import TopQuiz from "../Component/TopQuiz";
import Quiz from '../Component/Quiz';
import Room from '../Component/Room';
import Friends from '../Component/Friends';

export default function DiscoverScreen() {
  const [tabs, setTabs] = useState([
    { id: '1', name: 'Top', active: true },
    { id: '2', name: 'Quiz', active: false },
    { id: '3', name: 'Room', active: false },
    { id: '4', name: 'Friends', active: false },
  ]);

  const handleTabPress = (id) => {
    setTabs(tabs.map(tab => ({ ...tab, active: tab.id === id })));
  };

  const renderContent = () => {
    const activeTab = tabs.find(tab => tab.active);
    switch (activeTab.name) {
      case 'Top':
        return <TopQuiz />;
      case 'Quiz':
        return <Quiz />;
      case 'Room':
        return <Room />;
      case 'Friends':
        return <Friends />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {/* <TouchableOpacity>
            <FontAwesome name="chevron-left" size={24} color="white" />
          </TouchableOpacity> */}
          <View style={{flex:1, justifyContent: 'center', alignItems: 'center'}}>
            <Text style={styles.headerText}>Khám Phá</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <FlatList
            data={tabs}
            horizontal
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleTabPress(item.id)} style={styles.tabButton}>
                <Text style={item.active ? styles.activeTab : styles.inactiveTab}>{item.name}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.tabsList} // Áp dụng style cho danh sách tabs
            showsHorizontalScrollIndicator={false} // Ẩn thanh cuộn ngang
            style={styles.flatList} // Thêm style cho FlatList
          />

          {/* Render Content */}
          {renderContent()}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#6A5AE0', // Màu nền cho toàn bộ giao diện
  },
  container: {
    flex: 1,
    padding: 16,
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16, // Đảm bảo không bị che khuất bởi thanh trạng thái
  },
  headerText: {
    color: 'white',
    fontSize: 25,
    fontWeight: '550',
  },
  createRoomText: {
    marginLeft: 8,
    color: 'black',
  },
  tabsContainer: {
    marginTop: 16,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    flex: 1,
    // Đảm bảo tabs container không chiếm quá nhiều diện tích
  },
  activeTab: {
    color: '#6A5AE0',
    fontWeight: 'bold',
    marginRight: 16,
  },
  inactiveTab: {
    color: 'gray',
    marginRight: 16,
  },
  tabsList: {
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 10,
  },
  flatList: {
    maxHeight: 50, // Giới hạn chiều cao của FlatList
    flexShrink: 1, // Cho phép FlatList co lại khi cần thiết
  },
});