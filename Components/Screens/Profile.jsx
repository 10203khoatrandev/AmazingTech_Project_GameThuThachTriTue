import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import BadgeComponent from "../Component/Badge";
import StatsComponent from "../Component/Stats";
import { ref, onValue, update } from "firebase/database";
import { auth, realtimeDb } from "../config";
import * as ImagePicker from "expo-image-picker";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState("Badge");
  const [userData, setUserData] = useState(null);
  const [isNameModalVisible, setNameModalVisible] = useState(false);
  const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);
  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  // Mật khẩu fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch user data
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchUserData(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserData = useCallback((userId) => {
    const userRef = ref(realtimeDb, `users/${userId}`);
    onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUserData(data);
        setNewName(data.name || "");
      }
      setLoading(false);
    });
  }, []);

  // Image picker for avatar
  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Thông báo", "Vui lòng cho phép truy cập thư viện ảnh");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        type: ["image"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setLoading(true);
        await uploadToCloudinary(result.assets[0].uri);
        setLoading(false);
      }
    } catch (error) {
      console.error("Lỗi chọn ảnh:", error);
      Alert.alert("Thông báo", "Không thể chọn ảnh. Vui lòng thử lại!");
      setLoading(false);
    }
  };

  // Upload image to Cloudinary
  const uploadToCloudinary = async (uri) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Thông báo", "Vui lòng đăng nhập lại!");
        return;
      }

      const formData = new FormData();
      formData.append("file", {
        uri: uri,
        type: "image/jpeg",
        name: `avatar_${user.uid}_${Date.now()}.jpg`,
      });
      formData.append("upload_preset", "quiz_app_avatars");

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dwwfdki8z/image/upload",
        {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.secure_url) {
        await updateUserProfile({ avatar: data.secure_url });
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      Alert.alert("Thông báo", "Không thể cập nhật ảnh. Vui lòng thử lại!");
    }
  };

  // Update user profile in Firebase
  const updateUserProfile = async (updates) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Thông báo", "Vui lòng đăng nhập lại!");
        return;
      }

      const userRef = ref(realtimeDb, `users/${user.uid}`);
      await update(userRef, {
        ...updates,
        updatedAt: Date.now(),
      });

      if (updates.avatar) {
        Alert.alert("Thành công", "Cập nhật ảnh đại diện thành công!");
      }
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      Alert.alert("Thông báo", "Không thể cập nhật. Vui lòng thử lại!");
    }
  };

  // Update user name
  const handleUpdateName = async () => {
    try {
      if (!newName.trim()) {
        Alert.alert("Thông báo", "Tên không được để trống!");
        return;
      }

      setLoading(true);
      await updateUserProfile({ name: newName.trim() });
      setLoading(false);
      setNameModalVisible(false);
      Alert.alert("Thành công", "Đã cập nhật tên thành công!");
    } catch (error) {
      setLoading(false);
      console.error("Lỗi cập nhật tên:", error);
      Alert.alert("Thông báo", "Không thể cập nhật tên. Vui lòng thử lại!");
    }
  };

  // Update password
  const handleUpdatePassword = async () => {
    try {
      if (
        !currentPassword.trim() ||
        !newPassword.trim() ||
        !confirmPassword.trim()
      ) {
        Alert.alert("Thông báo", "Vui lòng điền đầy đủ thông tin!");
        return;
      }

      if (newPassword !== confirmPassword) {
        Alert.alert("Thông báo", "Mật khẩu mới không khớp!");
        return;
      }

      if (newPassword.length < 6) {
        Alert.alert("Thông báo", "Mật khẩu mới phải có ít nhất 6 ký tự!");
        return;
      }

      setLoading(true);

      const user = auth.currentUser;
      if (!user) {
        throw new Error("Người dùng chưa đăng nhập");
      }

      // Khởi tạo lại credential từ email và mật khẩu hiện tại
      const credential = require("firebase/auth").EmailAuthProvider.credential(
        user.email,
        currentPassword
      );

      // Xác thực lại người dùng
      await require("firebase/auth").reauthenticateWithCredential(
        user,
        credential
      );

      // Cập nhật mật khẩu mới
      await require("firebase/auth").updatePassword(user, newPassword);

      setLoading(false);
      setPasswordModalVisible(false);

      // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      Alert.alert("Thành công", "Đã cập nhật mật khẩu thành công!");
    } catch (error) {
      setLoading(false);
      console.error("Lỗi cập nhật mật khẩu:", error);

      if (error.code === "auth/wrong-password") {
        Alert.alert("Thông báo", "Mật khẩu hiện tại không chính xác!");
      } else {
        Alert.alert(
          "Thông báo",
          "Không thể cập nhật mật khẩu. Vui lòng thử lại!"
        );
      }
    }
  };

  // Logout user
  const handleLogout = async () => {
    try {
      setLoading(true);
      await AsyncStorage.removeItem("userLogin");
      await auth.signOut();
      setSettingsModalVisible(false);
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
      Alert.alert("Thông báo", "Không thể đăng xuất. Vui lòng thử lại!");
      setLoading(false);
    }
  };

  // Navigate to Help Center
  const handleNavigateToHelp = () => {
    setSettingsModalVisible(false);
    Alert.alert(
      "Trung tâm trợ giúp",
      "Tính năng đang phát triển, sẽ sớm có mặt trong bản cập nhật tiếp theo!"
    );
  };

  // Navigate to App Settings
  const handleNavigateToAppSettings = () => {
    setSettingsModalVisible(false);
    Alert.alert(
      "Cài đặt ứng dụng",
      "Tính năng đang phát triển, sẽ sớm có mặt trong bản cập nhật tiếp theo!"
    );
  };

  // Render content based on selected tab
  const renderContent = () => {
    switch (selectedTab) {
      case "Badge":
        return <BadgeComponent userData={userData} />;
      case "Stats":
        return <StatsComponent userData={userData} />;
      case "Detail":
        return (
          <View style={styles.detailContainer}>
            <Text style={styles.detailText}>
              Chi tiết thông tin sẽ được cập nhật...
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A5AE0" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6A5AE0" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
        <TouchableOpacity
          style={styles.headerSettingsButton}
          onPress={() => setSettingsModalVisible(true)}
        >
          <Icon name="cog" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileInfo}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
            <Image
              source={
                userData?.avatar
                  ? { uri: userData.avatar }
                  : require("../Images/character2.png")
              }
              style={styles.avatar}
            />
            <View style={styles.editIconContainer}>
              <Icon name="camera" size={15} color="#6A5AE0" />
            </View>
          </TouchableOpacity>

          <View style={styles.nameSection}>
            <Text style={styles.name}>{userData?.name || "User"}</Text>
            <TouchableOpacity
              style={styles.editNameButton}
              onPress={() => setNameModalVisible(true)}
            >
              <Icon name="edit" size={14} color="#6A5AE0" />
              <Text style={styles.editNameText}>Đổi tên</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Icon name="star" size={24} color="white" />
              <Text style={styles.statText}>ĐIỂM</Text>
              <Text style={styles.statNumber}>{userData?.point || 0}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.stat}>
              <FontAwesome5 name="medal" size={24} color="white" />
              <Text style={styles.statText}>HẠNG</Text>
              <Text style={styles.statNumber}>#{userData?.rank || "N/A"}</Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {["Badge", "Stats", "Detail"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setSelectedTab(tab)}
              style={[
                styles.tab,
                selectedTab === tab && styles.selectedTabContainer,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab && styles.selectedTabText,
                ]}
              >
                {tab}
              </Text>
              {selectedTab === tab && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>
      </View>

      {/* Name Change Modal */}
      <Modal
        visible={isNameModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Đổi tên</Text>
            <TextInput
              style={styles.nameInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Nhập tên mới"
              maxLength={30}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setNameModalVisible(false);
                  setNewName(userData?.name || "");
                }}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateName}
              >
                <Text style={styles.saveButtonText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={isSettingsModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cài đặt</Text>

            <TouchableOpacity
              style={styles.settingOption}
              onPress={handleNavigateToAppSettings}
            >
              <Icon name="sliders" size={20} color="#6A5AE0" />
              <Text style={styles.settingText}>Cài đặt ứng dụng</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingOption}
              onPress={handleNavigateToHelp}
            >
              <Icon name="question-circle" size={20} color="#6A5AE0" />
              <Text style={styles.settingText}>Trung tâm trợ giúp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingOption}
              onPress={() => {
                setSettingsModalVisible(false);
                setPasswordModalVisible(true);
              }}
            >
              <Icon name="lock" size={20} color="#6A5AE0" />
              <Text style={styles.settingText}>Đổi mật khẩu</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingOption, styles.logoutOption]}
              onPress={handleLogout}
            >
              <Icon name="sign-out" size={20} color="#FF4D4F" />
              <Text style={styles.logoutText}>Đăng xuất</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.cancelButton,
                styles.closeButton,
              ]}
              onPress={() => setSettingsModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Password Change Modal */}
      <Modal
        visible={isPasswordModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, styles.passwordModalContent]}>
            <View style={styles.passwordModalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setPasswordModalVisible(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                style={styles.backButton}
              >
                <Icon name="arrow-left" size={20} color="#6A5AE0" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
              <View style={{ width: 20 }} />
            </View>

            <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Nhập mật khẩu hiện tại"
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeIcon}
              >
                <Icon
                  name={showCurrentPassword ? "eye-slash" : "eye"}
                  size={20}
                  color="#6A5AE0"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Mật khẩu mới</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Nhập mật khẩu mới"
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeIcon}
              >
                <Icon
                  name={showNewPassword ? "eye-slash" : "eye"}
                  size={20}
                  color="#6A5AE0"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Xác nhận mật khẩu mới</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Nhập lại mật khẩu mới"
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Icon
                  name={showConfirmPassword ? "eye-slash" : "eye"}
                  size={20}
                  color="#6A5AE0"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.passwordHint}>
              Mật khẩu phải có ít nhất 6 ký tự
            </Text>

            <TouchableOpacity
              style={[
                styles.updatePasswordButton,
                (!currentPassword || !newPassword || !confirmPassword) &&
                  styles.disabledButton,
              ]}
              onPress={handleUpdatePassword}
              disabled={!currentPassword || !newPassword || !confirmPassword}
            >
              <Text style={styles.updatePasswordText}>Cập nhật mật khẩu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6A5AE0",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#6A5AE0",
  },
  loadingText: {
    color: "white",
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#6A5AE0",
    elevation: 3,
    position: "relative",
  },
  headerTitle: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    alignSelf: "center",
  },
  headerSettingsButton: {
    position: "absolute",
    right: 20,
  },
  profileCard: {
    flex: 1,
    backgroundColor: "#F5F5F7",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
  },
  profileInfo: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "white",
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  nameSection: {
    alignItems: "center",
    marginTop: 5,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  editNameButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0EEFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 5,
  },
  editNameText: {
    color: "#6A5AE0",
    fontSize: 14,
    marginLeft: 6,
    fontWeight: "500",
  },
  statsCard: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#6A5AE0",
    padding: 15,
    borderRadius: 20,
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  stat: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 5,
  },
  statNumber: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
  },
  statText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
    opacity: 0.8,
    marginTop: 5,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    marginBottom: 15,
    backgroundColor: "white",
    borderRadius: 20,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    position: "relative",
  },
  selectedTabContainer: {
    backgroundColor: "rgba(106, 90, 224, 0.08)",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
  },
  selectedTabText: {
    color: "#6A5AE0",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    width: 6,
    height: 6,
    backgroundColor: "#6A5AE0",
    borderRadius: 3,
    marginTop: 4,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "85%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  passwordModalContent: {
    width: "90%",
    maxHeight: "80%",
  },
  passwordModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  nameInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: "#F9F9F9",
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
    marginTop: 15,
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    backgroundColor: "#F9F9F9",
    marginBottom: 5,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 12,
  },
  passwordHint: {
    fontSize: 14,
    color: "#777",
    marginTop: 5,
    marginBottom: 20,
  },
  updatePasswordButton: {
    backgroundColor: "#6A5AE0",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: "#A8A8A8",
  },
  updatePasswordText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F2F2F2",
  },
  saveButton: {
    backgroundColor: "#6A5AE0",
  },
  closeButton: {
    marginTop: 10,
  },
  cancelButtonText: {
    fontWeight: "bold",
    color: "#666",
    fontSize: 16,
  },
  saveButtonText: {
    fontWeight: "bold",
    color: "white",
    fontSize: 16,
  },
  settingOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  logoutOption: {
    borderBottomWidth: 0,
    marginTop: 5,
    marginBottom: 10,
  },
  settingText: {
    fontSize: 16,
    marginLeft: 15,
    color: "#333",
  },
  logoutText: {
    fontSize: 16,
    marginLeft: 15,
    color: "#FF4D4F",
    fontWeight: "500",
  },
  detailContainer: {
    padding: 15,
    backgroundColor: "white",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 150,
  },
  detailText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
});
