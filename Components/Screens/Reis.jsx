import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import Custominput from "../custom/Custominput";
import ButtonCustom from "../custom/ButtonCustom";
import Thanhngang from "../custom/Thanhngang";
import Custminputpass2 from "../custom/Custminputpass2";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { auth, realtimeDb } from "../config";
import { ref, set } from "firebase/database";
import Toast from "react-native-toast-message";
import Custminputpass from "../custom/Custminputpass";

// Lấy kích thước màn hình để tính toán kích thước logo phù hợp
const { width, height } = Dimensions.get("window");

const Reis = () => {
  const navigation = useNavigation();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const [isEntry, setIsEntry] = useState(true);
  const [loading, setLoading] = useState(false);

  const showToast = (title, message, type = "error") => {
    Toast.show({
      text1: title,
      text2: message,
      type,
      duration: 3000,
      position: "top",
    });
  };

  const isValidEmail = (email) => {
    const re = /^[^@]+@[^@]+\.[^@]+$/;
    return re.test(email);
  };

  const handleRegister = async () => {
    try {
      // Validate dữ liệu đầu vào người dùng
      if (!username || !email || !password || !retypePassword) {
        showToast("Thông báo", "Vui lòng nhập đầy đủ thông tin người dùng!");
        return;
      }

      if (password !== retypePassword) {
        showToast("Thông báo", "Mật khẩu không khớp nhau!");
        return;
      }

      if (!isValidEmail(email)) {
        showToast("Thông báo", "Email không hợp lệ!");
        return;
      }

      // Hiển thị trạng thái loading
      setLoading(true);

      // Tạo người dùng mới với email và password
      const userCredential = await auth.createUserWithEmailAndPassword(
        email,
        password
      );

      if (!userCredential?.user) {
        showToast("Lỗi", "Không thể tạo tài khoản. Vui lòng thử lại!");
        return;
      }

      const user = userCredential.user;

      // Gửi email xác thực
      await user.sendEmailVerification();

      // Lưu thông tin người dùng vào Realtime Database
      await set(ref(realtimeDb, `users/${user.uid}`), {
        name: username,
        email: email,
        point: 100,
        remainingQuestions: 10,
        status: "offline",
        avatar: null,
        createdAt: new Date().toISOString(),
      });

      showToast(
        "Thành công",
        "Mã xác nhận đã gửi đến email của bạn",
        "success"
      );
      handleGoLogin();
    } catch (error) {
      console.log("Lỗi đăng ký:", error);

      if (error.code === "auth/email-already-in-use") {
        showToast("Thông báo", "Email này đã được sử dụng!");
      } else if (error.code === "auth/weak-password") {
        showToast("Thông báo", "Mật khẩu cần ít nhất 6 ký tự!");
      } else {
        showToast(
          "Lỗi",
          "Tạo tài khoản không thành công. Vui lòng thử lại sau!"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  function handleGoLogin() {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Login" }],
      })
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Image
              source={require("../Images/logoquizz.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.container}>
            <View style={styles.inputContainer}>
              <Custominput
                IconName="person"
                placeholder="Tên tài khoản"
                value={username}
                onChangeText={setUsername}
              />
              <Custominput
                IconName="email"
                placeholder="Nhập email"
                value={email}
                onChangeText={setEmail}
              />
              <Custminputpass
                IconName="password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChangeText={setPassword}
                onPress={() => setIsEntry(!isEntry)}
                entry={isEntry}
              />
              <Custminputpass2
                IconName="password"
                placeholder="Nhập lại mật khẩu"
                value={retypePassword}
                onChangeText={setRetypePassword}
                onPress={() => setIsEntry(!isEntry)}
                entry={isEntry}
              />
            </View>

            <ButtonCustom
              title="Đăng ký"
              onPress={handleRegister}
              disabled={loading}
            >
              {loading && (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={styles.loader}
                />
              )}
            </ButtonCustom>

            <View style={styles.loginContainer}>
              <Text>Bạn đã có tài khoản?</Text>
              <TouchableOpacity onPress={handleGoLogin}>
                <Text style={styles.loginText}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Reis;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: Platform.OS === "ios" ? "15%" : "6%",
    paddingHorizontal: 10,
  },
  logo: {
    width: Platform.OS === "ios" ? width * 0.92 : width * 0.95,
    height: Platform.OS === "ios" ? height * 0.35 : height * 0.38,
    maxHeight: "60%",
  },
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: -35,
  },
  inputContainer: {
    width: "100%",
  },
  socialContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  loginContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    marginBottom: Platform.OS === "ios" ? 20 : 10,
  },
  loginText: {
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: 10,
    color: "#FF5E78",
  },
  loader: {
    marginLeft: 10,
  },
});
