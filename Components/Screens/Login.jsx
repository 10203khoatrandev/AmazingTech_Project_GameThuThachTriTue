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
} from "react-native";
import React, { useState, useEffect } from "react";
import Custominput from "../custom/Custominput";
import ButtonCustom from "../custom/ButtonCustom";
import Thanhngang from "../custom/Thanhngang";
import Custminputpass from "../custom/Custminputpass";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { auth, realtimeDb } from "../config";
import { ref, get, update, set } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";

// Đảm bảo WebBrowser được đăng ký
WebBrowser.maybeCompleteAuthSession();

// Lấy kích thước màn hình để tính toán kích thước logo phù hợp
const { width, height } = Dimensions.get("window");

const Login = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isEntry, setIsEntry] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Cấu hình Google Auth
  // const [request, response, promptAsync] = Google.useAuthRequest({
  //   expoClientId: "175189069348-80294dibsn8b8ir5rhlt1u8eonp6el24.apps.googleusercontent.com",
  //   iosClientId: "175189069348-8bh5jt12j86ghmh500gem6h6bo1cht3m.apps.googleusercontent.com",
  //   // androidClientId: "YOUR_ANDROID_CLIENT_ID",
  //   // Quan trọng: Sử dụng đúng redirectUri
  //   redirectUri: makeRedirectUri({
  //     useProxy: true
  //   })
  // }, { authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth' });

  // Xử lý phản hồi Google Auth
  // useEffect(() => {
  //   if (response?.type === "success") {
  //     const { authentication } = response;
  //     handleGoogleLogin(authentication);
  //   }
  // }, [response]);

  const isValidEmail = (email) => {
    const re = /^[^@]+@[^@]+\.[^@]+$/;
    return re.test(email);
  };

  const showToast = (title, message, type = "error") => {
    Toast.show({
      text1: title,
      text2: message,
      type,
      duration: 3000,
      position: "top",
    });
  };

  const login = async () => {
    try {
      // Validate inputs
      if (!email || !password) {
        showToast("Thông báo", "Vui lòng nhập đầy đủ!");
        return;
      }

      if (!isValidEmail(email)) {
        showToast("Thông báo", "Email không hợp lệ!");
        return;
      }

      setLoading(true);

      const userCredential = await auth.signInWithEmailAndPassword(
        email,
        password
      );

      if (!userCredential?.user) {
        showToast("Lỗi", "Đã xảy ra lỗi khi đăng nhập");
        return;
      }

      if (!userCredential.user.emailVerified) {
        showToast("Thông báo", "Vui lòng xác nhận email của bạn để đăng nhập");
        return;
      }

      // User is verified, proceed with login
      console.log("Đăng nhập thành công!");
      const userRef = ref(realtimeDb, `users/${userCredential.user.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        showToast("Lỗi", "Không tìm thấy người dùng");
        return;
      }

      // Store user data and navigate
      const userData = snapshot.val();
      const userId = userCredential.user.uid;

      await Promise.all([
        AsyncStorage.setItem("userLogin", JSON.stringify(userData)),
        AsyncStorage.setItem("userId", JSON.stringify(userId)),
        update(userRef, { status: "online" }),
      ]);

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "MyTabs" }],
        })
      );
    } catch (error) {
      console.log("Lỗi đăng nhập:", error);

      if (error.code === "auth/invalid-credential") {
        showToast("Thông báo", "Email hoặc mật khẩu không đúng!");
      } else {
        showToast("Lỗi", "Đã xảy ra lỗi khi đăng nhập");
      }
    } finally {
      setLoading(false);
    }
  };

  // Xử lý đăng nhập Google
  const handleGoogleLogin = async (authentication) => {
    try {
      setGoogleLoading(true);

      // Lấy Google ID token
      const { idToken, accessToken } = authentication;

      // Tạo credential cho Firebase Auth
      const credential = GoogleAuthProvider.credential(idToken, accessToken);

      // Đăng nhập vào Firebase với Google credential
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      // Kiểm tra user trong database
      const userRef = ref(realtimeDb, `users/${user.uid}`);
      const snapshot = await get(userRef);

      let userData;

      if (snapshot.exists()) {
        // Cập nhật thông tin nếu người dùng đã tồn tại
        userData = snapshot.val();
        await update(userRef, {
          status: "online",
          lastLogin: new Date().toISOString(),
          displayName: user.displayName || userData.displayName,
          photoURL: user.photoURL || userData.photoURL,
        });
      } else {
        // Tạo người dùng mới nếu chưa tồn tại
        userData = {
          email: user.email,
          displayName: user.displayName || "",
          photoURL: user.photoURL || "",
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          status: "online",
          providerType: "google",
        };

        await set(userRef, userData);
      }

      // Lưu thông tin người dùng vào AsyncStorage
      await Promise.all([
        AsyncStorage.setItem("userLogin", JSON.stringify(userData)),
        AsyncStorage.setItem("userId", JSON.stringify(user.uid)),
      ]);

      showToast("Thành công", "Đăng nhập Google thành công!", "success");
      navigation.navigate("MyTabs");
    } catch (error) {
      console.log("Lỗi đăng nhập Google:", error);
      showToast("Lỗi", "Đăng nhập Google thất bại. Vui lòng thử lại.");
    } finally {
      setGoogleLoading(false);
    }
  };

  // Hàm gọi đăng nhập Google
  const signInWithGoogle = async () => {
    if (googleLoading) return;

    try {
      setGoogleLoading(true);
      await promptAsync();
    } catch (error) {
      console.log("Lỗi khi mở đăng nhập Google:", error);
      showToast("Lỗi", "Không thể mở đăng nhập Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  function handleGoRegist () {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Reis" }],
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
                IconName="email"
                placeholder="Nhập email"
                value={email}
                onChangeText={setEmail}
              />
              <Custminputpass
                IconName="password"
                placeholder="Password"
                onPress={() => setIsEntry(!isEntry)}
                value={password}
                onChangeText={setPassword}
                entry={isEntry}
              />
            </View>

            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity
                onPress={() => navigation.navigate("PasswordReset")}
              >
                <Text style={styles.forgotPasswordText}>Quên Mật Khẩu?</Text>
              </TouchableOpacity>
            </View>

            <ButtonCustom
              title="Đăng nhập"
              onPress={login}
              loading={loading}
              disabled={loading}
            />

            <Thanhngang title="hoặc" />

            <View style={styles.socialContainer}>
              <TouchableOpacity
                style={styles.googleButton}
                onPress={signInWithGoogle}
                disabled={googleLoading}
              >
                <Image
                  source={require("../Images/logoGoogle.png")}
                  style={styles.googleIcon}
                />
                {googleLoading ? (
                  <Text style={styles.googleButtonText}>Đang xử lý...</Text>
                ) : (
                  <Text style={styles.googleButtonText}>
                    Đăng nhập với Google
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.signupContainer}>
              <Text>Bạn Không có tài khoản?</Text>
              <TouchableOpacity onPress={handleGoRegist}>
                <Text style={styles.signupText}>Tạo tài khoản</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;

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
    marginTop: -55,
  },
  inputContainer: {
    width: "100%",
  },
  forgotPasswordContainer: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    marginVertical: 10,
  },
  forgotPasswordText: {
    color: "#444",
  },
  socialContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
    width: "100%",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    width: "100%",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  googleIcon: {
    marginRight: 10,
    width: 24,
    height: 24,
  },
  googleButtonText: {
    color: "#444",
    fontWeight: "500",
  },
  signupContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    marginBottom: Platform.OS === "ios" ? 20 : 10,
  },
  signupText: {
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: 10,
    color: "#FF5E78",
  },
});
