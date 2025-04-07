import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Trophy, CheckCircle, Target } from "lucide-react-native";

const screenWidth = Dimensions.get("window").width;

const StatsComponent = ({ achievements }) => {
  const totalQuizzes = achievements?.gamesPlayed || 0;
  const totalWins = achievements?.totalFirstPlaces || 0;
  const totalCorrectAnswers = achievements?.totalCorrectAnswers || 0;
  const winRate = totalQuizzes > 0 ? ((totalWins / totalQuizzes) * 100).toFixed(1) : 0;

  // Dữ liệu cho biểu đồ đường thể hiện tiến trình
  const chartData = {
    labels: ['Bắt đầu', 'Hiện tại'],
    datasets: [
      {
        data: [0, totalWins],
        color: (opacity = 1) => `rgba(106, 90, 224, ${opacity})`,
        strokeWidth: 3
      }
    ]
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Tổng Quan Thành Tích Cá Nhân</Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statsSummary}>
          <View style={styles.summaryItem}>
            <Target color="#6A5AE0" size={24} />
            <Text style={styles.summaryLabel}>Tổng Số Game</Text>
            <Text style={styles.summaryValue}>{totalQuizzes}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Trophy color="#FFD700" size={24} />
            <Text style={styles.summaryLabel}>Số Trận Thắng</Text>
            <Text style={styles.summaryValue}>{totalWins}</Text>
          </View>
          <View style={styles.summaryItem}>
            <CheckCircle color="#4CAF50" size={24} />
            <Text style={styles.summaryLabel}>Câu Trả Lời Đúng</Text>
            <Text style={styles.summaryValue}>{totalCorrectAnswers}</Text>
          </View>
        </View>

        <View style={styles.winRateContainer}>
          <Text style={styles.winRateTitle}>Tỷ Lệ Chiến Thắng</Text>
          <Text style={styles.winRatePercentage}>{winRate}%</Text>
        </View>

        <LineChart
          data={chartData}
          width={screenWidth - 60}
          height={220}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            color: (opacity = 1) => `rgba(106, 90, 224, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            decimalPlaces: 0,
            style: {
              borderRadius: 16
            }
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16
          }}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F5F5F7',
    paddingBottom: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    margin: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  statsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  winRateContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  winRateTitle: {
    fontSize: 16,
    color: '#6A5AE0',
    fontWeight: '600',
  },
  winRatePercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6A5AE0',
  }
});

export default StatsComponent;