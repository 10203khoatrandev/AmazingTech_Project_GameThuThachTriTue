import React, { useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import BadgeComponent from "../Component/Badge";
import StatsComponent from "../Component/Stats";
// import DetailComponent from "../component/Detail"; 

const ProfileScreen = () => {
    const [selectedTab, setSelectedTab] = useState("Badge");

    const renderContent = () => {
        switch (selectedTab) {
            case "Badge":
                return <BadgeComponent />;
            case "Stats":
                return <StatsComponent />;
            case "Detail":
            //     return <DetailComponent />;
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity>
                    <Icon name="arrow-left" size={32} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}></Text>
                <TouchableOpacity>
                    <Icon name="cog" size={32} color="white" />
                </TouchableOpacity>
            </View>

            {/* Profile Card */}
            <View style={styles.profileCard}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={require("../Images/MaskGroup.png")}
                        style={styles.avatar}
                    />
                    <View style={styles.flagContainer}>
                        <Image
                            source={{ uri: "https://flagcdn.com/w320/in.png" }}
                            style={styles.flag}
                        />
                    </View>
                </View>
                <Text style={styles.name}>Madelyn Dias</Text>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.stat}>
                        <Icon name="star" size={24} color="white" />
                        <Text style={styles.statText}>POINTS</Text>
                        <Text style={styles.statNumber}>590</Text>
                    </View>
                    <Image source={require("../Images/Divider.png")} />
                    <View style={styles.stat}>
                        <Icon name="globe" size={24} color="white" />
                        <Text style={styles.statText}>WORLD RANK</Text>
                        <Text style={styles.statNumber}>#1,438</Text>
                    </View>
                    <Image source={require("../Images/Divider.png")} />
                    <View style={styles.stat}>
                        <FontAwesome5 name="medal" size={24} color="white" />
                        <Text style={styles.statText}>LOCAL RANK</Text>
                        <Text style={styles.statNumber}>#56</Text>
                    </View>
                </View>

                {/* Badge Section */}
                <View style={styles.badgeSection}>
                    {/* Tab */}
                    <View style={styles.titleLink}>
                        {["Badge", "Stats", "Detail"].map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                onPress={() => setSelectedTab(tab)}
                                style={styles.tabContainer} // Đảm bảo các tab có kích thước đều nhau
                            >
                                <Text style={[styles.sectionTitle, selectedTab === tab && styles.selectedTab]}>
                                    {tab}
                                </Text>
                                {selectedTab === tab && <View style={styles.dot} />}
                            </TouchableOpacity>
                        ))}

                    </View>
                    <ScrollView
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={false}
                    >{renderContent()}</ScrollView>
                    {/* Nội dung tương ứng với tab */}

                </View>
            </View>
        </View>
    );
};

export default ProfileScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#6A5AE0",
        paddingTop: 50,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingBottom: 20,
        marginTop: 20
    },
    headerTitle: {
        fontSize: 18,
        color: "white",
        fontWeight: "bold",
    },
    profileCard: {
        backgroundColor: "white",
        borderRadius: 30,
        marginHorizontal: 10,
        paddingVertical: 20,
        alignItems: "center",
        elevation: 5,
        flex: 1
    },
    avatarContainer: {
        position: "relative",
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    flagContainer: {
        position: "absolute",
        bottom: 0,
        right: -10,
        backgroundColor: "white",
        borderRadius: 10,
        padding: 3,
    },
    flag: {
        width: 20,
        height: 15,
        borderRadius: 3,
    },
    name: {
        fontSize: 20,
        fontWeight: "bold",
        marginTop: 10,
    },
    statsContainer: {
        flexDirection: "row",
        backgroundColor: "#6A5AE0",
        padding: 10,
        borderRadius: 20,
        marginTop: 10,
        width: "90%",
        justifyContent: "space-around",
        alignItems: "center",
    },
    stat: {
        alignItems: "center",
        justifyContent: "center",
        width: 90,
        height: 90,
    },
    statNumber: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
        marginLeft: 5,
        lineHeight: 24,
    },
    statText: {
        color: "white",
        fontSize: 12,
        fontWeight: "bold",
        marginLeft: 5,
        opacity: 0.7,
        lineHeight: 18,
    },
    badgeSection: {
        backgroundColor: "white",
        borderRadius: 20,
        marginHorizontal: 20,
        paddingVertical: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    titleLink: {
        flexDirection: "row",
        justifyContent: "space-around",
        width: "100%",
        paddingVertical: 10,
    },
    tabContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#999",
        textAlign: "center",
    },
    selectedTab: {
        color: "#6C4AB6",
    },
    dot: {
        width: 6,
        height: 6,
        backgroundColor: "#6C4AB6",
        borderRadius: 3,
        marginTop: 2,
    },
    contentContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        flexGrow: 1,
    },
});
