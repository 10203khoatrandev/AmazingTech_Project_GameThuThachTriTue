import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from "react-native";
import { ProgressChart, BarChart } from "react-native-chart-kit";
import Icon from "react-native-vector-icons/FontAwesome5";

const screenWidth = Dimensions.get("window").width;

const StatsComponent = () => {
    const totalQuizzes = 50;
    const playedQuizzes = 37;
    const progress = playedQuizzes / totalQuizzes;

    const maxValue = 8;
    const data = [3, 8, 6];
    const percentageData = data.map((value) => value / maxValue);

    return (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <Text style={styles.title}>Monthly</Text>
                <Icon name="chevron-down" size={14} color="#6C4AB6" />
            </View>

            <Text style={styles.subtitle}>
                You have played a total <Text style={styles.highlightText}>24 quizzes</Text> this month!
            </Text>

            {/* Biểu đồ ProgressChart */}
            <View style={styles.progressContainer}>
                <ProgressChart
                    data={{ data: [progress] }}
                    width={screenWidth - 50} // Tăng kích thước nếu cần
                    height={200}
                    strokeWidth={12} // Độ dày viền tròn
                    radius={70} // Bán kính vòng tròn
                    chartConfig={{
                        backgroundGradientFrom: "#fff",
                        backgroundGradientTo: "#fff",
                        color: (opacity = 1) => `rgba(106, 90, 224, ${opacity})`, 
                        labelColor: () => "#6A5AE0",
                    }}
                    hideLegend={true}
                />

                <View style={styles.progressTextContainer}>
                    <Text style={styles.progressText}>{playedQuizzes}/{totalQuizzes} quizzes</Text>
                </View>
            </View>

            {/* Quiz Created & Quiz Won */}
            <View style={styles.statsRow}>
                <TouchableOpacity style={styles.statBox}>
                    <Icon name="pen" size={20} color="black" style={styles.iconTopRight} />
                    <Text style={styles.statNumber}>5</Text>
                    <Text style={styles.statLabel}>Quiz Created</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.statBox, styles.statBoxPurple]}>
                    <Icon name="trophy" size={20} color="white" style={styles.iconTopRight} />
                    <Text style={styles.statNumberWon}>21</Text>
                    <Text style={styles.statLabelWon}>Quiz Won</Text>
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
                    fromZero={true}
                    chartConfig={{
                        backgroundGradientFrom: "#6A5AE0",
                        backgroundGradientTo: "#6A5AE0",
                        color: () => "#fff",
                        labelColor: () => "#fff",
                        barPercentage: 1,
                        decimalPlaces: 0,
                        barBorderRadius: 5,
                        propsForBackgroundLines: {
                            strokeDasharray: [10, 10],
                            strokeWidth: 1,
                            stroke: "#ffffff50",
                        },
                    }}
                    yAxisLabel=""
                    yAxisSuffix="%"
                    showValuesOnTopOfBars={true}
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
        color: "#6A5AE0",
    },
    subtitle: {
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
    },
    highlightText: {
        color: "#6A5AE0",
    },
    progressContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
        position: "relative",
    },
    progressTextContainer: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
    },
    progressText: {
        fontSize: 16,
        color: "#6A5AE0",
        fontWeight: "bold",
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
        justifyContent: "center",
        marginHorizontal: 5,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    statBoxPurple: {
        backgroundColor: "#6A5AE0",
    },
    statNumber: {
        fontSize: 30,
        fontWeight: "bold",
        color: "black",
    },
    statLabel: {
        fontSize: 16,
        color: "#777",
        marginVertical: 5,
    },
    statNumberWon: {
        fontSize: 30,
        fontWeight: "bold",
        color: "white",
    },
    statLabelWon: {
        fontSize: 16,
        color: "white",
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
    iconTopRight: {
        position: "absolute",
        top: 20,
        right: 20,
    },
});
