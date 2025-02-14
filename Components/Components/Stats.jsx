import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from "react-native";
import { PieChart, BarChart } from "react-native-chart-kit";
import Icon from "react-native-vector-icons/FontAwesome5";

const screenWidth = Dimensions.get("window").width;

const StatsComponent = () => {
    const totalQuizzes = 50;
    const playedQuizzes = 37;
    const remainingQuizzes = totalQuizzes - playedQuizzes;
    const maxValue = 8;
    const data = [3, 8, 6];

    // Chuyển dữ liệu về %
    const percentageData = data.map((value) => (value / maxValue) * 100);

    const pieData = [
        {
            name: "Played",
            population: playedQuizzes,
            color: "#6C4AB6",
            legendFontColor: "#6C4AB6",
            legendFontSize: 14,
        },
        {
            name: "Remaining",
            population: remainingQuizzes,
            color: "#EEE",
            legendFontColor: "#777",
            legendFontSize: 14,
        },
    ];

    return (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <Text style={styles.title}>Monthly</Text>
                <Icon name="chevron-down" size={14} color="#6C4AB6" />
            </View>

            <Text style={styles.subtitle}>
                You have played a total <Text style={styles.highlightText}>24 quizzes</Text> this month!
            </Text>

            {/* Biểu đồ PieChart */}
            <View style={styles.progressContainer}>
                <PieChart
                    data={pieData}
                    width={screenWidth - 40}
                    height={150}
                    chartConfig={{
                        backgroundColor: "#fff",
                        backgroundGradientFrom: "#fff",
                        backgroundGradientTo: "#fff",
                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    }}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                />
            </View>

            {/* Quiz Created & Quiz Won */}
            <View style={styles.statsRow}>
                <TouchableOpacity style={styles.statBox}>
                    <Text style={styles.statNumber}>5</Text>
                    <Text style={styles.statLabel}>Quiz Created</Text>
                    <Icon name="pen" size={16} color="black" />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.statBox, styles.statBoxPurple]}>
                    <Text style={styles.statNumber}>21</Text>
                    <Text style={styles.statLabel}>Quiz Won</Text>
                    <Icon name="trophy" size={16} color="white" />
                </TouchableOpacity>
            </View>

            {/* Biểu đồ BarChart */}
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Top performance by category</Text>
                <BarChart
                    data={{
                        labels: ["Math", "Sports", "Music"],
                        datasets: [{ data: percentageData }],
                    }}
                    width={screenWidth - 40}
                    height={250}
                    fromZero={true} // Cột bắt đầu từ 0
                    chartConfig={{
                        backgroundGradientFrom: "#6A5AE0",
                        backgroundGradientTo: "#6A5AE0",
                        color: () => `#fff`,
                        labelColor: () => `#fff`,
                        barPercentage: 1, // Điều chỉnh độ rộng cột
                        decimalPlaces: 0, // Không hiển thị số lẻ
                        barBorderRadius: 5,
                        propsForBackgroundLines: {
                            strokeDasharray: [10, 10], // Đoạn đầu (gần số) bị ẩn, đoạn sau vẫn hiển thị
                            strokeWidth: 1,
                            stroke: "#ffffff50", // Màu nhẹ để không quá nổi bật
                        },

                    }}
                    yAxisLabel="" // Không có tiền tố
                    yAxisSuffix="%" // Thêm ký hiệu % vào trục Y
                    showValuesOnTopOfBars={true} // Hiển thị giá trị trên cột
                    verticalLabelRotation={0}
                    style={styles.chart}
                />
            </View>
        </ScrollView>
    );
};

export default StatsComponent;

const styles = StyleSheet.create({
    scrollContent: {
        minHeight: Dimensions.get("window").height + 200,
        paddingBottom: 40,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    title: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#6C4AB6",
    },
    subtitle: {
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
    },
    highlightText: {
        color: "#6C4AB6",
    },
    progressContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    statBox: {
        flex: 1,
        backgroundColor: "white",
        borderRadius: 10,
        padding: 20,
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 5,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    statBoxPurple: {
        backgroundColor: "#6C4AB6",
    },
    statNumber: {
        fontSize: 24,
        fontWeight: "bold",
        color: "black",
    },
    statLabel: {
        fontSize: 12,
        color: "#777",
        marginVertical: 5,
    },
    chartContainer: {
        width: "100%",
        backgroundColor: "#6A5AE0",
        borderRadius: 10,
        padding: 15,
        marginTop: 20,
        alignItems: "center",
    },
    chartTitle: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 10,
    },
});
