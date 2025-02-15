import React from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";

const BadgeComponent = () => {
    return (
        <View style={styles.container}>
            <View style={styles.badgeRow}>
                <View style={styles.badge}>
                    <TouchableOpacity >
                        <Image source={require("../Images/BadgeClock.png")} style={styles.image} />
                    </TouchableOpacity>
                </View>
                <View style={styles.badge}>
                    <TouchableOpacity >
                        <Image source={require("../Images/BadgeChart.png")} style={styles.image} />
                    </TouchableOpacity>
                </View>
                <View style={styles.badge}>
                    <TouchableOpacity >
                        <Image source={require("../Images/BadgeFace.png")} style={styles.image} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.badgeRow}>
                <View style={styles.badge}>
                    <TouchableOpacity >
                        <Image source={require("../Images/BadgeMedal.png")} style={styles.image} />
                    </TouchableOpacity>
                </View>
                <View style={styles.badge}>
                    <TouchableOpacity >
                        <Image source={require("../Images/BadgeShape.png")} style={styles.image} />
                    </TouchableOpacity>
                </View>
                <View style={styles.badge}>
                    <TouchableOpacity >
                        <Image source={require("../Images/BadgeLock.png")} style={styles.image} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};
export default BadgeComponent;

const styles = StyleSheet.create({
    container: {
        container: {
            alignItems: "center",  // Căn giữa theo chiều ngang
            justifyContent: "center", // Căn giữa theo chiều dọc
            flex: 1,  // Đảm bảo mở rộng đủ không gian
            width: "100%",
        },
    },
    badgeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "95%",
        marginVertical: 10,
        alignSelf: "center",
    },

});
